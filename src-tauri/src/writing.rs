use parking_lot::Mutex;
use std::{thread, time::Duration};
use text_diff::{diff, Difference};
use enigo::*;

static SELECT_ALL: Mutex<()> = Mutex::new(());

#[allow(dead_code)]
#[cfg(target_os = "windows")]
pub fn select_all(enigo: &mut Enigo) {
    let _guard = SELECT_ALL.lock();

    crate::utils::up_control_keys(enigo);

    enigo.key_down(Key::Control);
    enigo.key_click(Key::Layout('a'));
    enigo.key_up(Key::Control);
}

#[allow(dead_code)]
#[cfg(target_os = "macos")]
pub fn select_all(enigo: &mut Enigo) {
    use crate::APP_HANDLE;

    let apple_script = APP_HANDLE
        .get()
        .unwrap()
        .path_resolver()
        .resolve_resource("resources/select-all.applescript")
        .expect("failed to resolve select-all.applescript");

    std::process::Command::new("osascript").arg(apple_script).spawn().expect("failed to run applescript").wait().expect("failed to wait");
}

#[allow(dead_code)]
#[cfg(target_os = "linux")]
pub fn select_all(enigo: &mut Enigo) {
    let _guard = SELECT_ALL.lock();

    crate::utils::up_control_keys(enigo);

    enigo.key_down(Key::Control);
    enigo.key_click(Key::Layout('a'));
    enigo.key_up(Key::Control);
}

static INPUT_LOCK: Mutex<()> = Mutex::new(());

#[cfg(not(target_os = "macos"))]
pub fn left_arrow_click(enigo: &mut Enigo, n: usize) {
    let _guard = INPUT_LOCK.lock();

    for _ in 0..n {
        enigo.key_click(Key::LeftArrow);
    }
}

#[cfg(target_os = "macos")]
pub fn left_arrow_click(enigo: &mut Enigo, n: usize) {
    use crate::APP_HANDLE;
    let _guard = INPUT_LOCK.lock();

    let apple_script = APP_HANDLE
        .get()
        .unwrap()
        .path_resolver()
        .resolve_resource("resources/left.applescript")
        .expect("failed to resolve left.applescript");

    std::process::Command::new("osascript").arg(apple_script).arg(n.to_string()).spawn().expect("failed to run applescript").wait().expect("failed to wait");
}

#[cfg(not(target_os = "macos"))]
pub fn backspace_click(enigo: &mut Enigo, n: usize) {
    let _guard = INPUT_LOCK.lock();

    for _ in 0..n {
        enigo.key_click(Key::Backspace);
    }
}

#[cfg(target_os = "macos")]
pub fn backspace_click(enigo: &mut Enigo, n: usize) {
    use crate::APP_HANDLE;
    let _guard = INPUT_LOCK.lock();

    let apple_script = APP_HANDLE
        .get()
        .unwrap()
        .path_resolver()
        .resolve_resource("resources/backspace.applescript")
        .expect("failed to resolve backspace.applescript");

    std::process::Command::new("osascript").arg(apple_script).arg(n.to_string()).spawn().expect("failed to run applescript").wait().expect("failed to wait");
}

pub fn get_input_text(enigo: &mut Enigo, cancel_select: bool) -> Result<String, Box<dyn std::error::Error>> {
    select_all(enigo);
    return crate::utils::get_selected_text_by_clipboard(enigo, cancel_select);
}

static IS_WRITING: Mutex<bool> = Mutex::new(false);
static TRANSLATE_SELECTED_TEXT_PLACEHOLDER: &str = "<Translating... ✍️>";
static IS_TRANSLATE_SELECTED_TEXT: Mutex<bool> = Mutex::new(false);
static IS_INCREMENTAL_TRANSLATE: Mutex<bool> = Mutex::new(false);
static IS_INCREMENTAL_TRANSLATE_IN_THE_MIDDLE: Mutex<bool> = Mutex::new(false);
static PREVIOUS_TRANSLATED_TEXT: Mutex<String> = Mutex::new(String::new());

#[tauri::command]
pub fn writing() {
    let is_writing = IS_WRITING.lock();
    if *is_writing {
        return;
    }
    let mut is_incremental_translate = IS_INCREMENTAL_TRANSLATE.lock();
    *is_incremental_translate = false;
    let mut is_incremental_translate_in_the_middle = IS_INCREMENTAL_TRANSLATE_IN_THE_MIDDLE.lock();
    *is_incremental_translate_in_the_middle = false;
    let mut is_translate_selected_text = IS_TRANSLATE_SELECTED_TEXT.lock();
    let mut enigo = Enigo::new();
    let selected_text = crate::utils::get_selected_text_by_clipboard(&mut enigo, false).unwrap_or_default();
    if !selected_text.is_empty() {
        *is_translate_selected_text = true;
        do_write_to_input(&mut enigo, TRANSLATE_SELECTED_TEXT_PLACEHOLDER.to_owned(), false);
        crate::utils::writing_text(selected_text);
        return;
    }
    *is_translate_selected_text = false;
    let content = get_input_text(&mut enigo, true).unwrap_or_default();
    if content.is_empty() {
        return;
    }
    let previous_translated_text = PREVIOUS_TRANSLATED_TEXT.lock();
    let (_, changeset) = diff(&*previous_translated_text, &content, "");
    let changes = changeset.iter().filter(|change| {
        match change {
            Difference::Add(_) => true,
            Difference::Rem(_) => true,
            _ => false,
        }
    }).collect::<Vec<_>>();
    if !previous_translated_text.is_empty() && changes.len() == 1 {
        let insertions = changes.iter().map(|change| {
            match change {
                Difference::Add(text) => {
                    text.to_owned()
                }
                _ => String::new(),
            }
        }).collect::<Vec<_>>();
        if insertions.len() == 1 {
            let insertion = insertions.iter().next().unwrap();
            let insertion_idx = changeset.iter().take_while(|change| {
                match change {
                    Difference::Same(_) => true,
                    _ => false,
                }
            }).fold(0, |acc, change| {
                match change {
                    Difference::Same(v) => acc + v.chars().count(),
                    _ => acc,
                }
            });
            let left_click_count = content.chars().count() - insertion_idx - insertion.chars().count();
            if left_click_count > 0 {
                *is_incremental_translate_in_the_middle = true;
            }
            left_arrow_click(&mut enigo, left_click_count);
            *is_incremental_translate = true;
            let new_content = insertion;
            for _ in 0..new_content.chars().count() {
                enigo.key_click(Key::Backspace);
            }
            do_write_to_input(&mut enigo, TRANSLATE_SELECTED_TEXT_PLACEHOLDER.to_owned(), false);
            crate::utils::writing_text(new_content.to_owned());
            return;
        }
    }
    select_all(&mut enigo);
    thread::sleep(Duration::from_millis(30));
    do_write_to_input(&mut enigo, "Translating... ✍️".to_string(), false);
    crate::utils::writing_text(content);
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
                        let keys = writing_newline_hotkey.split("+").map(|c| c.trim()).collect::<Vec<&str>>();
                        for key in &keys {
                            if key.len() == 1 {
                                enigo.key_down(Key::Layout(key.chars().next().unwrap()));
                            } else {
                                match *key {
                                    "ctrl" => enigo.key_down(Key::Control),
                                    "alt" => enigo.key_down(Key::Alt),
                                    "shift" => enigo.key_down(Key::Shift),
                                    "meta" => enigo.key_down(Key::Meta),
                                    "caps_lock" => enigo.key_down(Key::CapsLock),
                                    "escape" => enigo.key_down(Key::Escape),
                                    "enter" => enigo.key_down(Key::Return),
                                    _ => {}
                                }
                            }
                        }
                        for key in keys.iter().rev() {
                            if key.len() == 1 {
                                enigo.key_up(Key::Layout(key.chars().next().unwrap()));
                            } else {
                                match *key {
                                    "ctrl" => enigo.key_up(Key::Control),
                                    "alt" => enigo.key_up(Key::Alt),
                                    "shift" => enigo.key_up(Key::Shift),
                                    "meta" => enigo.key_up(Key::Meta),
                                    "caps_lock" => enigo.key_up(Key::CapsLock),
                                    "escape" => enigo.key_up(Key::Escape),
                                    "enter" => enigo.key_up(Key::Return),
                                    _ => {}
                                }
                            }
                        }
                        continue;
                    }
                }
            }
            enigo.key_sequence(&char);
            thread::sleep(Duration::from_millis(20));
        }
    } else {
        enigo.key_sequence(&text);
    }
}

#[tauri::command]
pub fn write_to_input(text: String) {
    let is_translate_selected_text = IS_TRANSLATE_SELECTED_TEXT.lock();
    let is_incremental_translate = IS_INCREMENTAL_TRANSLATE.lock();
    let mut is_start_writing = IS_START_WRITING.lock();
    let mut enigo = Enigo::new();
    let is_first_writing = !*is_start_writing;
    if is_first_writing {
        if !*is_translate_selected_text && !*is_incremental_translate {
            select_all(&mut enigo);
            thread::sleep(Duration::from_millis(50));
        } else {
            backspace_click(&mut enigo, TRANSLATE_SELECTED_TEXT_PLACEHOLDER.to_owned().chars().count() - 1);
        }
    }
    *is_start_writing = true;
    do_write_to_input(&mut enigo, text, true);
}

#[tauri::command]
pub fn finish_writing() {
    let mut is_writing = IS_WRITING.lock();
    *is_writing = false;
    let mut is_start_writing = IS_START_WRITING.lock();
    let mut enigo = Enigo::new();
    *is_start_writing = false;

    let is_incremental_translate_in_the_middle = IS_INCREMENTAL_TRANSLATE_IN_THE_MIDDLE.lock();
    if *is_incremental_translate_in_the_middle {
        do_write_to_input(&mut enigo, " ".to_string(), false);
    }

    do_write_to_input(&mut enigo, " ✅".to_string(), true);
    thread::sleep(Duration::from_millis(300));

    backspace_click(&mut enigo, 2);
    thread::sleep(Duration::from_millis(50));

    let input_text = get_input_text(&mut enigo, true).unwrap_or_default();
    if input_text.is_empty() {
        return;
    }

    let mut previous_translated_text = PREVIOUS_TRANSLATED_TEXT.lock();
    *previous_translated_text = input_text;
}
