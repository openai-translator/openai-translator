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

use crate::windows::{show_main_window, MAIN_WIN_NAME, show_main_window_with_selected_text, get_main_window_always_on_top, set_main_window_always_on_top};


use once_cell::sync::OnceCell;
use tauri::AppHandle;
use tauri::Manager;
use tauri::api::notification::Notification;
use window_shadows::set_shadow;

pub static APP_HANDLE: OnceCell<AppHandle> = OnceCell::new();
pub static mut ALWAYS_ON_TOP: bool = false;

#[cfg(target_os = "macos")]
fn query_accessibility_permissions() -> bool {
    let trusted = macos_accessibility_client::accessibility::application_is_trusted_with_prompt();
    if trusted {
        print!("Application is totally trusted!");
    } else {
        print!("Application isn't trusted :(");
    }
    return trusted
}

#[cfg(not(target_os = "macos"))]
fn query_accessibility_permissions() -> bool {
    return true
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();
            APP_HANDLE.get_or_init(|| app.handle());
            if cfg!(target_os = "windows") || cfg!(target_os = "linux") {
                let window = app.get_window(MAIN_WIN_NAME).unwrap();
                window.set_decorations(false)?;
                // Try set shadow and ignore errors if it failed.
                set_shadow(&window, true).unwrap_or_default();
            }
            if !query_accessibility_permissions() {
                let window = app.get_window(MAIN_WIN_NAME).unwrap();
                window.minimize().unwrap();
                Notification::new(&app.config().tauri.bundle.identifier)
                    .title("Accessibility permissions")
                    .body("Please grant accessibility permissions to the app")
                    .icon("icon.png")
                    .notify(&app_handle)
                    .unwrap();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_config_content,
            show_main_window_with_selected_text,
            get_main_window_always_on_top,
            set_main_window_always_on_top,
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
