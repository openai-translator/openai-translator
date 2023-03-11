use clipboard::ClipboardProvider;
use clipboard::ClipboardContext;
use tauri::Manager;

use crate::APP_HANDLE;

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
    enigo.key_down(Key::Control);
    enigo.key_click(Key::Layout('c'));
    enigo.key_up(Key::Control);
}

#[cfg(not(target_os = "macos"))]
pub fn get_selected_text() -> Result<String, Box<dyn std::error::Error>> {
    let mut ctx: ClipboardContext = ClipboardProvider::new()?;
    let current_text = ctx.get_contents()?;
    copy();
    ctx.get_contents().map(|selected_text| {
        if selected_text == current_text {
            Ok("".to_string())
        } else {
            ctx.set_contents(current_text).and_then(|_| Ok(selected_text))
        }
    })?
}

#[cfg(target_os = "macos")]
pub fn get_selected_text() -> Result<String, Box<dyn std::error::Error>> {
    use std::process::Command;
    let resource_path = APP_HANDLE.get().unwrap().path_resolver()
      .resolve_resource("get-selected-text.applescript").ok_or("no applescript resource found")?;
    let output = Command::new("osascript")
        .arg(&resource_path)
        .output()?;
    let selected_text = String::from_utf8(output.stdout)?;
    Ok(selected_text)
}

pub fn send_text(text: String) {
    let handle = APP_HANDLE.get().unwrap();
    handle.emit_all("change-text", text).unwrap();
}
