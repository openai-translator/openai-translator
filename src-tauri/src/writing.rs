use parking_lot::Mutex;
use std::{thread, time::Duration};
use enigo::{Enigo, KeyboardControllable};

#[allow(dead_code)]
#[cfg(target_os = "windows")]
pub fn select_all() {
    use enigo::*;
    let mut enigo = Enigo::new();
    enigo.key_up(Key::Control);
    enigo.key_up(Key::Alt);
    enigo.key_up(Key::Shift);
    enigo.key_up(Key::Space);
    enigo.key_down(Key::Control);
    enigo.key_click(Key::Layout('a'));
    enigo.key_up(Key::Control);
}

static SELECT_ALL: Mutex<()> = Mutex::new(());

#[allow(dead_code)]
#[cfg(target_os = "macos")]
pub fn select_all() {
    use enigo::*;

    let _guard = SELECT_ALL.lock();

    let mut enigo = Enigo::new();
    enigo.key_up(Key::Control);
    enigo.key_up(Key::Meta);
    enigo.key_up(Key::Alt);
    enigo.key_up(Key::Shift);
    enigo.key_up(Key::Space);
    enigo.key_up(Key::Tab);
    enigo.key_up(Key::Option);
    enigo.key_down(Key::Meta);
    enigo.key_click(Key::Layout('a'));
    enigo.key_up(Key::Meta);
}

#[allow(dead_code)]
#[cfg(target_os = "linux")]
pub fn select_all() {
    use enigo::*;
    let mut enigo = Enigo::new();
    enigo.key_up(Key::Control);
    enigo.key_up(Key::Alt);
    enigo.key_up(Key::Shift);
    enigo.key_up(Key::Space);
    enigo.key_down(Key::Control);
    enigo.key_click(Key::Layout('a'));
    enigo.key_up(Key::Control);
}

static INPUT_LOCK: Mutex<()> = Mutex::new(());

pub fn double_backspace_click() {
    let _guard = INPUT_LOCK.lock();
    use enigo::*;
    let mut enigo = Enigo::new();
    enigo.key_click(Key::Backspace);
    enigo.key_click(Key::Backspace);
}

pub fn double_left_click() {
    let _guard = INPUT_LOCK.lock();
    use enigo::*;
    let mut enigo = Enigo::new();
    thread::sleep(Duration::from_millis(100));
    enigo.key_click(Key::LeftArrow);
    thread::sleep(Duration::from_millis(100));
    enigo.key_click(Key::LeftArrow);
    thread::sleep(Duration::from_millis(100));
}

pub fn double_right_click() {
    let _guard = INPUT_LOCK.lock();
    use enigo::*;
    let mut enigo = Enigo::new();
    enigo.key_click(Key::RightArrow);
    enigo.key_click(Key::RightArrow);
}

#[allow(dead_code)]
#[cfg(target_os = "windows")]
pub fn paste() {
    let _guard = INPUT_LOCK.lock();
    let __guard = PASTE.lock();
    use enigo::*;
    let mut enigo = Enigo::new();
    enigo.key_up(Key::Control);
    enigo.key_up(Key::Alt);
    enigo.key_up(Key::Shift);
    enigo.key_up(Key::Space);
    enigo.key_down(Key::Control);
    enigo.key_click(Key::Layout('v'));
    enigo.key_up(Key::Control);
}

static PASTE: Mutex<()> = Mutex::new(());

#[allow(dead_code)]
#[cfg(target_os = "macos")]
pub fn paste() {
    let _guard = INPUT_LOCK.lock();
    let __guard = PASTE.lock();
    use enigo::*;
    let mut enigo = Enigo::new();
    enigo.key_up(Key::Control);
    enigo.key_up(Key::Meta);
    enigo.key_up(Key::Alt);
    enigo.key_up(Key::Shift);
    enigo.key_up(Key::Space);
    enigo.key_up(Key::Tab);
    enigo.key_up(Key::Option);
    enigo.key_down(Key::Meta);
    enigo.key_click(Key::Layout('v'));
    enigo.key_up(Key::Meta);
}

#[allow(dead_code)]
#[cfg(target_os = "linux")]
pub fn paste() {
    let _guard = INPUT_LOCK.lock();
    let __guard = PASTE.lock();
    use enigo::*;
    let mut enigo = Enigo::new();
    enigo.key_up(Key::Control);
    enigo.key_up(Key::Alt);
    enigo.key_up(Key::Shift);
    enigo.key_up(Key::Space);
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

    thread::sleep(Duration::from_millis(50));

    select_all();

    thread::sleep(Duration::from_millis(50));

    crate::utils::copy();

    thread::sleep(Duration::from_millis(100));

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
    do_write_to_input("Translating, please wait... ✍️".to_string(), false);
    crate::utils::writing_text(content);
}

static START_WRITING: Mutex<bool> = Mutex::new(false);

fn do_write_to_input(text: String, animation: bool) {
    let _guard = INPUT_LOCK.lock();
    let mut enigo = Enigo::new();
    if animation {
        for c in text.chars() {
            let char = c.to_string();
            enigo.key_sequence(&char);
            thread::sleep(Duration::from_millis(20));
        }
    } else {
        enigo.key_sequence(&text);
    }
}

#[tauri::command]
pub fn write_to_input(text: String) {
    let mut new_text = text.clone();
    let mut start_writing = START_WRITING.lock();
    let is_first_writing = !*start_writing;
    if is_first_writing {
        select_all();
        thread::sleep(Duration::from_millis(50));
        // new_text = text.clone() + " ✍️";
    }
    *start_writing = true;
    do_write_to_input(new_text, true);
    // if is_first_writing {
    //     double_left_click();
    // }
}

#[tauri::command]
pub fn finish_writing() {
    let mut start_writing = START_WRITING.lock();
    *start_writing = false;

    // double_right_click();
    // thread::sleep(Duration::from_millis(50));
    //
    // double_backspace_click();
    // thread::sleep(Duration::from_millis(50));

    do_write_to_input(" ✅".to_string(), true);
    thread::sleep(Duration::from_millis(300));

    double_backspace_click();
    thread::sleep(Duration::from_millis(50));
}
