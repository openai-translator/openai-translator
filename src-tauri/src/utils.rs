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
    use clipboard::ClipboardProvider;
    use clipboard::ClipboardContext;
    let mut ctx: ClipboardContext = ClipboardProvider::new()?;
    let current_text = ctx.get_contents().unwrap_or_default();
    copy();
    let selected_text = ctx.get_contents().unwrap_or_default();
    // creat a new thread to restore the clipboard
    let current_text_cloned = current_text.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(100));
        ctx.set_contents(current_text_cloned).unwrap();
    });
    if selected_text.trim() == current_text.trim() {
        return Ok(String::new());
    }
    Ok(selected_text.trim().to_string())
}

#[cfg(target_os = "macos")]
pub fn get_selected_text() -> Result<String, Box<dyn std::error::Error>> {
    match get_selected_text_by_ax() {
        Ok(text) => Ok(text),
        Err(err) => {
            println!("get_selected_text_by_ax error: {}", err);
            get_selected_text_by_clipboard()
        }
    }
}

#[cfg(target_os = "macos")]
pub fn get_selected_text_by_ax() -> Result<String, Box<dyn std::error::Error>> {
    let apple_script = APP_HANDLE
        .get()
        .unwrap()
        .path_resolver()
        .resolve_resource("resources/get-selected-text-by-ax.applescript")
        .expect("failed to resolve ocr binary resource");

    match std::process::Command::new("osascript")
        .arg(apple_script)
        .output()
    {
        Ok(output) => {
            // check exit code
            if output.status.success() {
                // get output content
                let content = String::from_utf8(output.stdout)
                    .expect("failed to parse get-selected-text-by-ax.applescript output");
                // trim content
                let content = content.trim();
                Ok(content.to_string())
            } else {
                let err = output
                    .stderr
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

#[cfg(target_os = "macos")]
pub fn get_selected_text_by_clipboard() -> Result<String, Box<dyn std::error::Error>> {
    let apple_script = APP_HANDLE
        .get()
        .unwrap()
        .path_resolver()
        .resolve_resource("resources/get-selected-text.applescript")
        .expect("failed to resolve ocr binary resource");

    match std::process::Command::new("osascript")
        .arg(apple_script)
        .output()
    {
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
                let err = output
                    .stderr
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
