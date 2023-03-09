#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod config;
mod window_ext;

use crate::window_ext::WindowExt;
use crate::config::get_config_content;
use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
          let win = app.get_window("main").unwrap();
          win.set_transparent_titlebar(true, false);

         Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, get_config_content])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
