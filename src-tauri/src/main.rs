#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod config;
mod hotkey;
mod tray;
mod utils;
mod windows;
mod ocr;

use std::sync::atomic::AtomicBool;
use sysinfo::{CpuExt, System, SystemExt};
use parking_lot::Mutex;

use crate::config::get_config_content;
use crate::windows::{MAIN_WIN_NAME, show_main_window_with_selected_text, get_main_window_always_on_top, set_main_window_always_on_top};
use crate::ocr::ocr;


use once_cell::sync::OnceCell;
use tauri::AppHandle;
use tauri::Manager;
use tauri::api::notification::Notification;
use window_shadows::set_shadow;

pub static APP_HANDLE: OnceCell<AppHandle> = OnceCell::new();
pub static ALWAYS_ON_TOP: AtomicBool = AtomicBool::new(false);
pub static CPU_VENDOR: Mutex<String> = Mutex::new(String::new());

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

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
    let mut sys = System::new();
    sys.refresh_cpu(); // Refreshing CPU information.
    if let Some(cpu) = sys.cpus().first() {
        let vendor_id = cpu.vendor_id().to_string();
        *CPU_VENDOR.lock() = vendor_id;
    }
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            println!("{}, {argv:?}, {cwd}", app.package_info().name);
            Notification::new(&app.config().tauri.bundle.identifier)
                .title("This app is already running!")
                .body("You can find it in the tray menu.")
                .icon("icon")
                .notify(app)
                .unwrap();
            app.emit_all("single-instance", Payload { args: argv, cwd })
                .unwrap();
        }))
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
            ocr,
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
