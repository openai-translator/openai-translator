use clipboard::ClipboardProvider;
use clipboard::ClipboardContext;
use tauri::Manager;

use crate::APP_HANDLE;

static ASCII_LOWER: [char; 26] = [
    'a', 'b', 'c', 'd', 'e', 
    'f', 'g', 'h', 'i', 'j', 
    'k', 'l', 'm', 'n', 'o',
    'p', 'q', 'r', 's', 't', 
    'u', 'v', 'w', 'x', 'y', 
    'z',
];

#[cfg(target_os = "windows")]
pub fn copy() {
    use enigo::*;
    let mut enigo = Enigo::new();
    enigo.key_up(Key::Control);
    enigo.key_up(Key::Alt);
    enigo.key_up(Key::Shift);
    enigo.key_up(Key::Space);
    enigo.key_down(Key::Control);
    enigo.key_click(Key::Layout('c'));
    enigo.key_up(Key::Control);
}

#[cfg(target_os = "macos")]
pub fn copy() {
    // use std::{thread, time::Duration};

    use enigo::*;
    let mut enigo = Enigo::new();
    enigo.key_up(Key::Control);
    enigo.key_up(Key::Meta);
    enigo.key_up(Key::Alt);
    enigo.key_up(Key::Shift);
    enigo.key_up(Key::Space);
    enigo.key_up(Key::Tab);
    enigo.key_up(Key::Option);
    for c in ASCII_LOWER.iter() {
        enigo.key_up(Key::Layout(*c));
    }
    enigo.key_down(Key::Meta);
    enigo.key_click(Key::Layout('c'));
    // enigo.key_down(Key::Layout('c'));
    // thread::sleep(Duration::from_millis(300));
    // enigo.key_up(Key::Layout('c'));
    enigo.key_up(Key::Meta);
}

#[cfg(target_os = "linux")]
pub fn copy() {
    use enigo::*;
    let mut enigo = Enigo::new();
    enigo.key_up(Key::Control);
    enigo.key_up(Key::Alt);
    enigo.key_up(Key::Shift);
    enigo.key_up(Key::Space);
    for c in ASCII_LOWER.iter() {
        enigo.key_up(Key::Layout(*c));
    }
    enigo.key_down(Key::Control);
    enigo.key_click(Key::Layout('c'));
    enigo.key_up(Key::Control);
}

pub fn get_selected_text() -> String {
    let mut ctx: ClipboardContext = ClipboardProvider::new().unwrap();
    let current_text = ctx.get_contents().unwrap();
    copy();
    match ctx.get_contents() {
        Ok(selected_text) => {
            if selected_text == current_text {
                return "".to_string();
            }
            ctx.set_contents(current_text).unwrap();
            selected_text
        }
        Err(_) => "failed to get selected text".to_string(),
    }
}

pub fn send_text(text: String) {
    let handle = APP_HANDLE.get().unwrap();
    handle.emit_all("change-text", text).unwrap();
}
