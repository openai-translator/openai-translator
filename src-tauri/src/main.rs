#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod config;
mod utils;
mod windows;

use crate::config::get_config_content;
use crate::windows::show_translate_window;
use once_cell::sync::OnceCell;
use tauri::api::notification::Notification;
use tauri::AppHandle;

pub static APP_HANDLE: OnceCell<AppHandle> = OnceCell::new();

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            Notification::new(&app.config().tauri.bundle.identifier)
                .title("OpenAI Translator is already running")
                .body("You can only run one instance of OpenAI Translator at a time.")
                .icon("icons/icon.png")
                .notify(app)
                .unwrap();
        }))
        .setup(|app| {
            APP_HANDLE.get_or_init(|| app.handle());
            show_translate_window();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_config_content])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
