#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod config;

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
                set_shadow(&window, true).unwrap();
                window.set_decorations(false)?;
                set_shadow(&window, true).expect("Unsupported platform!");
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, get_config_content])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
