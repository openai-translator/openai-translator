use tauri::Manager;


use crate::APP_HANDLE;

#[allow(dead_code)]
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
#[allow(dead_code)]
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
    enigo.key_down(Key::Meta);
    enigo.key_click(Key::Layout('c'));
    // enigo.key_down(Key::Layout('c'));
    // thread::sleep(Duration::from_millis(300));
    // enigo.key_up(Key::Layout('c'));
    enigo.key_up(Key::Meta);
}
#[allow(dead_code)]
#[cfg(target_os = "linux")]
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

#[cfg(not(target_os = "macos"))]
pub fn get_selected_text() -> Result<String, Box<dyn std::error::Error>> {
    let mut clipboard = Clipboard::new()?;
    let current_text = clipboard.get_text()?;
    copy();
    let selected_text = clipboard.get_text()?;
    // creat a new thread to restore the clipboard
    let current_text_cloned = current_text.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(100));
        clipboard.set_text(&current_text_cloned).unwrap();
    });
    if selected_text.trim() == current_text.trim() {
        return Ok(String::new());
    }
    Ok(selected_text)
}

#[cfg(target_os = "macos")]
pub fn get_selected_text() -> Result<String, Box<dyn std::error::Error>> {
    let apple_script = APP_HANDLE
        .get()
        .unwrap()
        .path_resolver()
        .resolve_resource("resources/get-selected-text.applescript")
        .expect("failed to resolve ocr binary resource");

    match std::process::Command::new("osascript").arg(apple_script).output() {
        Ok(output) => {
            // check exit code
            if output.status.success() {
                // get output content
                let content = String::from_utf8(output.stdout)
                    .expect("failed to parse get-selected-text.applescript output");
                // trim content
                let content = content.trim();
                Ok(content.to_string())
            } else {
                let err = output.stderr
                    .into_iter()
                    .map(|c| c as char)
                    .collect::<String>()
                    .into();
                Err(err)
            }
        }
        Err(e) => Err(Box::new(e)),
    }
}

pub fn send_text(text: String) {
    let handle = APP_HANDLE.get().unwrap();
    handle.emit_all("change-text", text).unwrap();
}
