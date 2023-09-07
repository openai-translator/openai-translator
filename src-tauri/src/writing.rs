use parking_lot::Mutex;
use std::{thread, time::Duration};
use enigo::*;

static SELECT_ALL: Mutex<()> = Mutex::new(());

#[allow(dead_code)]
#[cfg(target_os = "windows")]
pub fn select_all() {
    let _guard = SELECT_ALL.lock();

    crate::utils::up_control_keys();

    let mut enigo = Enigo::new();
    enigo.key_down(Key::Control);
    enigo.key_click(Key::Layout('a'));
    enigo.key_up(Key::Control);
}

#[allow(dead_code)]
#[cfg(target_os = "macos")]
pub fn select_all() {
    let _guard = SELECT_ALL.lock();

    crate::utils::up_control_keys();

    let mut enigo = Enigo::new();

    if let Ok(config) = crate::config::get_config() {
        if let Some(writing_hotkey) = config.writing_hotkey {
            for key in writing_hotkey.split("+") {
                let key = key.trim();
                if key.len() == 1 {
                    enigo.key_up(Key::Layout(key.chars().next().unwrap()));
                }
            }
        }
    }

    enigo.key_down(Key::Meta);
    enigo.key_click(Key::Layout('a'));
    enigo.key_up(Key::Meta);
}

#[allow(dead_code)]
#[cfg(target_os = "linux")]
pub fn select_all() {
    let _guard = SELECT_ALL.lock();

    crate::utils::up_control_keys();

    let mut enigo = Enigo::new();
    enigo.key_down(Key::Control);
    enigo.key_click(Key::Layout('a'));
    enigo.key_up(Key::Control);
}

static INPUT_LOCK: Mutex<()> = Mutex::new(());

pub fn double_backspace_click() {
    let _guard = INPUT_LOCK.lock();

    crate::utils::up_control_keys();

    let mut enigo = Enigo::new();
    enigo.key_click(Key::Backspace);
    enigo.key_click(Key::Backspace);
}

pub fn double_left_click() {
    let _guard = INPUT_LOCK.lock();

    crate::utils::up_control_keys();

    let mut enigo = Enigo::new();
    enigo.key_click(Key::LeftArrow);
    enigo.key_click(Key::LeftArrow);
}

pub fn double_right_click() {
    let _guard = INPUT_LOCK.lock();

    crate::utils::up_control_keys();

    let mut enigo = Enigo::new();
    enigo.key_click(Key::RightArrow);
    enigo.key_click(Key::RightArrow);
}

static PASTE: Mutex<()> = Mutex::new(());

#[allow(dead_code)]
#[cfg(target_os = "windows")]
pub fn paste() {
    let _guard = INPUT_LOCK.lock();
    let __guard = PASTE.lock();

    crate::utils::up_control_keys();

    let mut enigo = Enigo::new();
    enigo.key_down(Key::Control);
    enigo.key_click(Key::Layout('v'));
    enigo.key_up(Key::Control);
}

#[allow(dead_code)]
#[cfg(target_os = "macos")]
pub fn paste() {
    let _guard = INPUT_LOCK.lock();
    let __guard = PASTE.lock();

    crate::utils::up_control_keys();

    let mut enigo = Enigo::new();
    enigo.key_down(Key::Meta);
    enigo.key_click(Key::Layout('v'));
    enigo.key_up(Key::Meta);
}

#[allow(dead_code)]
#[cfg(target_os = "linux")]
pub fn paste() {
    let _guard = INPUT_LOCK.lock();
    let __guard = PASTE.lock();

    crate::utils::up_control_keys();

    let mut enigo = Enigo::new();
    enigo.key_down(Key::Control);
    enigo.key_click(Key::Layout('v'));
    enigo.key_up(Key::Control);
}

pub fn get_input_text() -> Result<String, Box<dyn std::error::Error>> {
    use arboard::Clipboard;

    let old_clipboard = (Clipboard::new()?.get_text(), Clipboard::new()?.get_image());

    let mut write_clipboard = Clipboard::new()?;

    let not_selected_placeholder = "";

    write_clipboard.set_text(not_selected_placeholder)?;

    select_all();

    thread::sleep(Duration::from_millis(10));

    crate::utils::copy();

    thread::sleep(Duration::from_millis(10));

    let new_text = Clipboard::new()?.get_text();

    match old_clipboard {
        (Ok(old_text), _) => {
            // Old Content is Text
            write_clipboard.set_text(old_text.clone())?;
            if let Ok(new) = new_text {
                if new.trim() == not_selected_placeholder.trim() {
                    Ok(String::new())
                } else {
                    Ok(new)
                }
            } else {
                Ok(String::new())
            }
        }
        (_, Ok(image)) => {
            // Old Content is Image
            write_clipboard.set_image(image)?;
            if let Ok(new) = new_text {
                if new.trim() == not_selected_placeholder.trim() {
                    Ok(String::new())
                } else {
                    Ok(new)
                }
            } else {
                Ok(String::new())
            }
        }
        _ => {
            // Old Content is Empty
            write_clipboard.clear()?;
            if let Ok(new) = new_text {
                if new.trim() == not_selected_placeholder.trim() {
                    Ok(String::new())
                } else {
                    Ok(new)
                }
            } else {
                Ok(String::new())
            }
        }
    }
}

#[tauri::command]
pub fn writing() {
    let content = get_input_text().unwrap_or_default();
    do_write_to_input("OpenAI Translator is translating, please wait... ✍️".to_string(), false);
    crate::utils::writing_text(content);
}

static START_WRITING: Mutex<bool> = Mutex::new(false);

fn do_write_to_input(text: String, animation: bool) {
    let _guard = INPUT_LOCK.lock();
    let mut enigo = Enigo::new();
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
    let mut start_writing = START_WRITING.lock();
    let is_first_writing = !*start_writing;
    if is_first_writing {
        select_all();
        thread::sleep(Duration::from_millis(50));
    }
    *start_writing = true;
    do_write_to_input(text, true);
}

#[tauri::command]
pub fn finish_writing() {
    let mut start_writing = START_WRITING.lock();
    *start_writing = false;

    do_write_to_input(" ✅".to_string(), true);
    thread::sleep(Duration::from_millis(300));

    double_backspace_click();
    thread::sleep(Duration::from_millis(50));
}
