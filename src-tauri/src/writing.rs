use crate::utils::{backspace_click, left_arrow_click, right_arrow_click, select_all, INPUT_LOCK};
use crate::APP_HANDLE;
use debug_print::debug_println;
use enigo::*;
use parking_lot::Mutex;
use similar::utils::diff_chars;
use similar::{Algorithm, ChangeTag};
use std::{thread, time::Duration};
use tauri_plugin_aptabase::EventTracker;

pub fn get_input_text(
    enigo: &mut Enigo,
    cancel_select: bool,
) -> Result<String, Box<dyn std::error::Error>> {
    select_all(enigo);
    return crate::utils::get_selected_text_by_clipboard(enigo, cancel_select);
}

static IS_WRITING: Mutex<bool> = Mutex::new(false);
static TRANSLATE_SELECTED_TEXT_PLACEHOLDER: &str = "<Translating ✍️>";
static IS_TRANSLATE_SELECTED_TEXT: Mutex<bool> = Mutex::new(false);
static PREVIOUS_TRANSLATED_TEXT: Mutex<String> = Mutex::new(String::new());
static ALL_TRANSLATED_FINGERPRINT: &str = "‌";
static ALL_TRANSLATED_FINGERPRINT_COUNT: Mutex<usize> = Mutex::new(1);
static NEED_TO_ADD_FINGERPRINT: Mutex<bool> = Mutex::new(false);

#[derive(Clone)]
struct IncrementalAction {
    left_arrow_click_count: usize,
    right_arrow_click_count: usize,
    insertion_content: String,
}

static INCREMENTAL_ACTIONS: Mutex<Vec<IncrementalAction>> = Mutex::new(Vec::new());

#[tauri::command]
#[specta::specta]
pub fn writing_command() {
    debug_println!("[writing] trigger");
    let is_writing = IS_WRITING.lock();
    if *is_writing {
        return;
    }
    let app_handle = APP_HANDLE.get().unwrap();
    app_handle.track_event("writing", None);
    {
        let mut incremental_actions = INCREMENTAL_ACTIONS.lock();
        incremental_actions.clear();
    }
    let mut is_translate_selected_text = IS_TRANSLATE_SELECTED_TEXT.lock();
    let mut enigo = Enigo::new(&Settings::default()).unwrap();
    let selected_text =
        crate::utils::get_selected_text_by_clipboard(&mut enigo, false).unwrap_or_default();
    if !selected_text.is_empty() {
        *is_translate_selected_text = true;
        do_write_to_input(
            &mut enigo,
            TRANSLATE_SELECTED_TEXT_PLACEHOLDER.to_owned(),
            false,
        );
        crate::utils::writing_text(selected_text);
        return;
    }
    *is_translate_selected_text = false;
    let mut previous_translated_text = PREVIOUS_TRANSLATED_TEXT.lock();
    let mut content = get_input_text(&mut enigo, true).unwrap_or_default();
    if content.is_empty() {
        *previous_translated_text = content;
        return;
    }
    if content.ends_with("\r\n") {
        content = content[..content.len() - 2].to_owned();
    }
    let mut content = content.replace("\r\n", "\n");
    if content.trim().is_empty() {
        *previous_translated_text = content;
        return;
    }
    debug_println!("[writing] content: {:?}", content.chars());
    debug_println!(
        "[writing] previous_translated_text: {:?}",
        previous_translated_text.chars()
    );
    let changeset = diff_chars(Algorithm::Myers, &*previous_translated_text, &content);
    debug_println!("[writing] changeset: {:?}", changeset);
    let modifications_count = changeset
        .iter()
        .filter(|(change_tag, _)| match change_tag {
            ChangeTag::Insert => true,
            ChangeTag::Delete => true,
            _ => false,
        })
        .count();
    let translated_fingerprint_count = ALL_TRANSLATED_FINGERPRINT_COUNT.lock();
    let mut is_all_translated_before = content
        .starts_with(&ALL_TRANSLATED_FINGERPRINT.repeat(*translated_fingerprint_count))
        && !content
            .starts_with(&ALL_TRANSLATED_FINGERPRINT.repeat(*translated_fingerprint_count + 1));
    let mut need_to_add_fingerprint = NEED_TO_ADD_FINGERPRINT.lock();
    *need_to_add_fingerprint = false;

    if !is_all_translated_before {
        match changeset.iter().next().clone() {
            Some(change) => match change {
                (ChangeTag::Delete, text) => {
                    if *text == ALL_TRANSLATED_FINGERPRINT.repeat(*translated_fingerprint_count) {
                        *need_to_add_fingerprint = true;
                        is_all_translated_before = true;
                    }
                }
                _ => {}
            },
            None => {}
        }
        if !is_all_translated_before && changeset.len() >= 2 {
            let first_change = changeset.iter().next().unwrap();
            let second_change = changeset.iter().nth(1).unwrap();
            match (first_change, second_change) {
                ((ChangeTag::Insert, _), (ChangeTag::Equal, text)) => {
                    if text.starts_with(
                        &ALL_TRANSLATED_FINGERPRINT.repeat(*translated_fingerprint_count),
                    ) && !text.starts_with(
                        &ALL_TRANSLATED_FINGERPRINT.repeat(*translated_fingerprint_count + 1),
                    ) {
                        *need_to_add_fingerprint = true;
                        is_all_translated_before = true;
                    }
                }
                _ => {}
            }
        }
    }

    debug_println!("is_all_translated_before: {:?}", is_all_translated_before);
    if !previous_translated_text.is_empty()
        && modifications_count > 0
        && modifications_count < 10
        && is_all_translated_before
    {
        let mut incremental_actions = Vec::new();
        let mut is_first_insertion = true;
        let mut prev_insertion_index = 0;
        for i in 0..changeset.len() {
            let change = &changeset[i];
            let insertion_content = match change {
                (ChangeTag::Insert, content) => content,
                _ => continue,
            };
            if insertion_content.trim().is_empty() {
                continue;
            }
            let mut prefix_newline_count = 0;
            for c in insertion_content.chars() {
                if c == '\n' {
                    prefix_newline_count += 1;
                } else {
                    break;
                }
            }
            let mut suffix_newline_count = 0;
            for c in insertion_content.chars().rev() {
                if c == '\n' {
                    suffix_newline_count += 1;
                } else {
                    break;
                }
            }
            let mut left_arrow_click_count = 0;
            let mut right_arrow_click_count = 0;
            if is_first_insertion {
                is_first_insertion = false;
                left_arrow_click_count =
                    changeset[i + 1..]
                        .iter()
                        .fold(0, |acc, change| match change {
                            (ChangeTag::Insert, text) => acc + text.chars().count(),
                            (ChangeTag::Equal, text) => acc + text.chars().count(),
                            _ => acc,
                        })
                        + suffix_newline_count;
            } else {
                right_arrow_click_count = changeset[prev_insertion_index + 1..i].iter().fold(
                    0,
                    |acc, change| match change {
                        (ChangeTag::Insert, text) => acc + text.chars().count(),
                        (ChangeTag::Equal, text) => acc + text.chars().count(),
                        _ => acc,
                    },
                ) + prefix_newline_count;
            }
            prev_insertion_index = i;
            let insertion_content = insertion_content
                [prefix_newline_count..insertion_content.len() - suffix_newline_count]
                .to_owned();
            let incremental_action = IncrementalAction {
                left_arrow_click_count,
                right_arrow_click_count,
                insertion_content,
            };
            incremental_actions.push(incremental_action);
        }
        if incremental_actions.is_empty() {
            *previous_translated_text = content;
            return;
        }
        thread::spawn(move || {
            let mut global_incremental_actions = INCREMENTAL_ACTIONS.lock();
            let reversed_incremental_actions = incremental_actions
                .iter()
                .rev()
                .map(|action| action.to_owned())
                .collect::<Vec<_>>();
            let incremental_action =
                reversed_incremental_actions[reversed_incremental_actions.len() - 1].clone();
            *global_incremental_actions = reversed_incremental_actions;
            do_incremental_writing(&incremental_action);
        });
        return;
    }
    select_all(&mut enigo);
    thread::sleep(Duration::from_millis(30));
    do_write_to_input(&mut enigo, "Translating... ✍️".to_string(), false);

    if content.starts_with(&ALL_TRANSLATED_FINGERPRINT.repeat(*translated_fingerprint_count))
        && !content
            .starts_with(&ALL_TRANSLATED_FINGERPRINT.repeat(*translated_fingerprint_count + 1))
    {
        // use chars to get string slice
        let mut translated_text = String::new();
        for c in content.chars().skip(*translated_fingerprint_count) {
            translated_text.push(c);
        }
        content = translated_text;
    }
    crate::utils::writing_text(content);
}

fn do_incremental_writing(incremental_action: &IncrementalAction) {
    let mut enigo = Enigo::new(&Settings::default()).unwrap();
    if incremental_action.left_arrow_click_count > 0 {
        left_arrow_click(&mut enigo, incremental_action.left_arrow_click_count);
    } else if incremental_action.right_arrow_click_count > 0 {
        right_arrow_click(
            &mut enigo,
            incremental_action.right_arrow_click_count
                + incremental_action.insertion_content.chars().count(),
        );
    }
    backspace_click(
        &mut enigo,
        incremental_action.insertion_content.chars().count(),
    );
    do_write_to_input(
        &mut enigo,
        TRANSLATE_SELECTED_TEXT_PLACEHOLDER.to_owned(),
        false,
    );
    crate::utils::writing_text(incremental_action.insertion_content.to_owned());
}

static IS_START_WRITING: Mutex<bool> = Mutex::new(false);

fn do_write_to_input(enigo: &mut Enigo, text: String, animation: bool) {
    let _guard = INPUT_LOCK.lock();
    if animation {
        for c in text.chars() {
            let char = c.to_string();
            if char == "\n" {
                if let Ok(config) = crate::config::get_config() {
                    if let Some(writing_newline_hotkey) = config.writing_newline_hotkey {
                        let keys = writing_newline_hotkey
                            .split("+")
                            .map(|c| c.trim())
                            .collect::<Vec<&str>>();
                        for key in &keys {
                            if key.len() == 1 {
                                enigo
                                    .key(
                                        Key::Unicode(key.chars().next().unwrap()),
                                        Direction::Press,
                                    )
                                    .unwrap_or_default();
                            } else {
                                match *key {
                                    "ctrl" => enigo.key(Key::Control, Direction::Press).unwrap(),
                                    "alt" => enigo.key(Key::Alt, Direction::Press).unwrap(),
                                    "shift" => enigo.key(Key::Shift, Direction::Press).unwrap(),
                                    "meta" => enigo.key(Key::Meta, Direction::Press).unwrap(),
                                    "caps_lock" => {
                                        enigo.key(Key::CapsLock, Direction::Press).unwrap()
                                    }
                                    "escape" => enigo.key(Key::Escape, Direction::Press).unwrap(),
                                    "enter" => enigo.key(Key::Return, Direction::Press).unwrap(),
                                    _ => {}
                                }
                            }
                        }
                        for key in keys.iter().rev() {
                            if key.len() == 1 {
                                enigo
                                    .key(
                                        Key::Unicode(key.chars().next().unwrap()),
                                        Direction::Release,
                                    )
                                    .unwrap_or_default();
                            } else {
                                match *key {
                                    "ctrl" => enigo.key(Key::Control, Direction::Release).unwrap(),
                                    "alt" => enigo.key(Key::Alt, Direction::Release).unwrap(),
                                    "shift" => enigo.key(Key::Shift, Direction::Release).unwrap(),
                                    "meta" => enigo.key(Key::Meta, Direction::Release).unwrap(),
                                    "caps_lock" => {
                                        enigo.key(Key::CapsLock, Direction::Release).unwrap()
                                    }
                                    "escape" => enigo.key(Key::Escape, Direction::Release).unwrap(),
                                    "enter" => enigo.key(Key::Return, Direction::Release).unwrap(),
                                    _ => {}
                                }
                            }
                        }
                        continue;
                    }
                }
            }
            enigo.text(&char).unwrap_or_default();
            thread::sleep(Duration::from_millis(20));
        }
    } else {
        enigo.text(&text).unwrap_or_default();
    }
}

#[tauri::command]
#[specta::specta]
pub fn write_to_input(text: String) {
    let is_translate_selected_text = IS_TRANSLATE_SELECTED_TEXT.lock();
    let incremental_contents = INCREMENTAL_ACTIONS.lock();
    let is_incremental_translate = !incremental_contents.is_empty();
    let mut is_start_writing = IS_START_WRITING.lock();
    let mut enigo = Enigo::new(&Settings::default()).unwrap();
    let mut new_text = text.clone();
    let is_first_writing = !*is_start_writing;
    let mut need_to_add_fingerprint = false;
    if is_first_writing {
        if !*is_translate_selected_text && !is_incremental_translate {
            select_all(&mut enigo);
            thread::sleep(Duration::from_millis(50));
            need_to_add_fingerprint = true;
        } else {
            backspace_click(
                &mut enigo,
                TRANSLATE_SELECTED_TEXT_PLACEHOLDER
                    .to_owned()
                    .chars()
                    .count()
                    - 1,
            );
        }
    }
    let mut global_need_to_add_fingerprint = NEED_TO_ADD_FINGERPRINT.lock();
    if need_to_add_fingerprint || *global_need_to_add_fingerprint {
        *global_need_to_add_fingerprint = false;
        let mut translated_fingerprint_count = ALL_TRANSLATED_FINGERPRINT_COUNT.lock();
        *translated_fingerprint_count += 1;
        if *translated_fingerprint_count > 7 {
            *translated_fingerprint_count = 1;
        }
        new_text = format!(
            "{}{}",
            ALL_TRANSLATED_FINGERPRINT.repeat(*translated_fingerprint_count),
            text
        );
    }
    *is_start_writing = true;
    do_write_to_input(&mut enigo, new_text, true);
}

#[tauri::command]
#[specta::specta]
pub fn finish_writing() {
    let mut is_writing = IS_WRITING.lock();
    *is_writing = false;
    let mut is_start_writing = IS_START_WRITING.lock();
    let mut enigo = Enigo::new(&Settings::default()).unwrap();
    *is_start_writing = false;

    let mut incremental_actions = INCREMENTAL_ACTIONS.lock();

    let is_incremental_translate_in_the_middle = {
        if incremental_actions.is_empty() {
            false
        } else {
            let incremental_action = &incremental_actions[incremental_actions.len() - 1];
            incremental_action.left_arrow_click_count > 0
        }
    };
    if is_incremental_translate_in_the_middle {
        do_write_to_input(&mut enigo, " ".to_string(), false);
    }

    if incremental_actions.len() > 1 {
        let mut new_incremental_actions = incremental_actions.clone();
        new_incremental_actions.pop().unwrap();
        let incremental_action = new_incremental_actions[new_incremental_actions.len() - 1].clone();
        *incremental_actions = new_incremental_actions;
        do_incremental_writing(&incremental_action);
    } else {
        incremental_actions.clear();

        do_write_to_input(&mut enigo, " ✅".to_string(), true);
        thread::sleep(Duration::from_millis(300));

        backspace_click(&mut enigo, 2);
        thread::sleep(Duration::from_millis(50));

        let input_text = get_input_text(&mut enigo, true).unwrap_or_default();
        let input_text = input_text.replace("\r\n", "\n");

        let fingerprint_count = input_text
            .chars()
            .take_while(|c| *c == ALL_TRANSLATED_FINGERPRINT.chars().next().unwrap())
            .count();
        if fingerprint_count > 0 {
            let mut global_all_translated_fingerprint_count =
                ALL_TRANSLATED_FINGERPRINT_COUNT.lock();
            *global_all_translated_fingerprint_count = fingerprint_count;
        }

        let mut previous_translated_text = PREVIOUS_TRANSLATED_TEXT.lock();
        *previous_translated_text = input_text;
    }
}
