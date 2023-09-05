use arboard::ImageData;
use parking_lot::Mutex;

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
    // use std::{thread, time::Duration};

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
    // enigo.key_down(Key::Layout('c'));
    // thread::sleep(Duration::from_millis(300));
    // enigo.key_up(Key::Layout('c'));
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

#[allow(dead_code)]
#[cfg(target_os = "windows")]
pub fn paste() {
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
    // use std::{thread, time::Duration};

    use enigo::*;

    let _guard = PASTE.lock();

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
    // enigo.key_down(Key::Layout('c'));
    // thread::sleep(Duration::from_millis(300));
    // enigo.key_up(Key::Layout('c'));
    enigo.key_up(Key::Meta);
}

#[allow(dead_code)]
#[cfg(target_os = "linux")]
pub fn paste() {
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
    use std::{thread, time::Duration};

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
    crate::utils::writing_text(content);
}

static START_WRITING: Mutex<bool> = Mutex::new(false);
static OLD_CLIPBOARD_CONTENT: Mutex<(Option<String>, Option<ImageData<'static>>)> = Mutex::new((None, None));

#[tauri::command]
pub fn write_to_input(text: String) {
    // println!("write_to_input: {}", text);
    {
        let mut start_writing = START_WRITING.lock();
        if !*start_writing {
            let old_text = Clipboard::new().unwrap().get_text();
            let old_image = Clipboard::new().unwrap().get_image();
            {
                let mut old_clipboard_content = OLD_CLIPBOARD_CONTENT.lock();
                *old_clipboard_content = (old_text.ok(), old_image.ok());
            }
        }
        *start_writing = true;
    }
    use arboard::Clipboard;
    use std::{thread, time::Duration};
    let mut write_clipboard = Clipboard::new().unwrap();

    write_clipboard.set_text(text).unwrap();
    thread::sleep(Duration::from_millis(50));
    paste();
}

#[tauri::command]
pub fn finish_writing() {
    use arboard::Clipboard;
    let mut start_writing = START_WRITING.lock();
    *start_writing = false;
    let old_clipboard_content = OLD_CLIPBOARD_CONTENT.lock().clone();
    let (old_text, old_image) = old_clipboard_content;
    let mut write_clipboard = Clipboard::new().unwrap();
    match old_text {
        Some(text) => {
            write_clipboard.set_text(text.clone()).unwrap();
        }
        None => {
            write_clipboard.clear().unwrap();
        }
    }
    match old_image {
        Some(image) => {
            write_clipboard.set_image(image.clone()).unwrap();
        }
        None => {}
    }
}
