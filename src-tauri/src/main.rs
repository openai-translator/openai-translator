#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod config;
mod tray;

use crate::config::get_config_content;
use tauri::Manager;
use window_shadows::set_shadow;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // if windows or linux
            if cfg!(target_os = "windows") || cfg!(target_os = "linux") {
                let window = app.get_window("main").unwrap();
                window.set_decorations(false)?;
                // Try set shadow and ignore errors if it failed.
                set_shadow(&window, true).unwrap_or_default();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, get_config_content])
        .system_tray(tray::menu())
        .on_system_tray_event(tray::handler)
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| match event {
            tauri::RunEvent::WindowEvent {
                label,
                event: win_event,
                ..
            } => match win_event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    let win = app.get_window(label.as_str()).unwrap();
                    win.hide().unwrap();
                    api.prevent_close();
                }
                _ => {}
            },
            _ => {}
        });
}
