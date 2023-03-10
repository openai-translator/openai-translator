#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod config;
mod hotkey;
mod tray;
mod utils;
mod windows;

use crate::config::get_config_content;
use crate::windows::{show_main_window, MAIN_WIN_NAME, show_main_window_with_selected_text};
use once_cell::sync::OnceCell;
use tauri::AppHandle;
use tauri::Manager;
use window_shadows::set_shadow;

pub static APP_HANDLE: OnceCell<AppHandle> = OnceCell::new();

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            APP_HANDLE.get_or_init(|| app.handle());
            if cfg!(target_os = "windows") || cfg!(target_os = "linux") {
                let window = app.get_window(MAIN_WIN_NAME).unwrap();
                window.set_decorations(false)?;
                // Try set shadow and ignore errors if it failed.
                set_shadow(&window, true).unwrap_or_default();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_config_content,
            show_main_window,
            show_main_window_with_selected_text,
        ])
        .system_tray(tray::menu())
        .on_system_tray_event(tray::handler)
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| match event {
            tauri::RunEvent::WindowEvent { label, event, .. } => match event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    let window = app.get_window(label.as_str()).unwrap();
                    window.hide().unwrap();
                    api.prevent_close();
                }
                _ => {}
            },
            _ => {}
        });
}
