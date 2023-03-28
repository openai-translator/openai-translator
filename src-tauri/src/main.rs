#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod config;
mod hotkey;
mod lang;
mod ocr;
mod tray;
mod utils;
mod windows;

#[cfg(target_os = "macos")]
use cocoa::appkit::NSWindow;
use parking_lot::Mutex;
use tauri_plugin_autostart::MacosLauncher;
use std::env;
use std::sync::atomic::AtomicBool;
use sysinfo::{CpuExt, System, SystemExt};

use crate::config::{get_config_content, clear_config_cache};
use crate::lang::detect_lang;
use crate::ocr::ocr;
use crate::windows::{
    get_main_window_always_on_top, set_main_window_always_on_top,
    show_main_window_with_selected_text, MAIN_WIN_NAME,
};

use mouce::Mouse;
use once_cell::sync::OnceCell;
use tauri::api::notification::Notification;
use tauri::Manager;
use tauri::{AppHandle, LogicalPosition, LogicalSize};
use window_shadows::set_shadow;

pub static APP_HANDLE: OnceCell<AppHandle> = OnceCell::new();
pub static ALWAYS_ON_TOP: AtomicBool = AtomicBool::new(false);
pub static CPU_VENDOR: Mutex<String> = Mutex::new(String::new());
pub static SELECTED_TEXT: Mutex<String> = Mutex::new(String::new());
pub static PREVIOUS_PRESS_TIME: Mutex<u128> = Mutex::new(0);
pub static PREVIOUS_RELEASE_TIME: Mutex<u128> = Mutex::new(0);
pub static PREVIOUS_RELEASE_POSITION: Mutex<(i32, i32)> = Mutex::new((0, 0));
pub static RELEASE_THREAD_ID: Mutex<u32> = Mutex::new(0);

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
    trusted
}

#[cfg(not(target_os = "macos"))]
fn query_accessibility_permissions() -> bool {
    return true;
}

fn main() {
    let silently = env::args().any(|arg| {
        arg == "--silently"
    });

    let mut mouse_manager = Mouse::new();

    if !query_accessibility_permissions() {
        return;
    }

    let hook_result = mouse_manager.hook(Box::new(|event| {
        let config = config::get_config().unwrap();
        let always_show_icons = config.always_show_icons.unwrap_or(true);
        if !always_show_icons {
            return;
        }
        if cfg!(target_os = "linux") {
            return;
        }
        match event {
            mouce::common::MouseEvent::Press(mouce::common::MouseButton::Left) => {
                let current_press_time = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis();
                *PREVIOUS_PRESS_TIME.lock() = current_press_time;
            }
            mouce::common::MouseEvent::Release(mouce::common::MouseButton::Left) => {
                let current_release_time = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis();
                let mut is_text_selected_event = false;
                let (x, y): (i32, i32) = windows::get_mouse_location().unwrap();
                let (prev_release_x, prev_release_y) = { *PREVIOUS_RELEASE_POSITION.lock() };
                {
                    *PREVIOUS_RELEASE_POSITION.lock() = (x, y);
                }
                let mouse_distance = (((x - prev_release_x).pow(2) + (y - prev_release_y).pow(2)) as f64).sqrt();
                let mut previous_press_time = 0;
                let mut previous_release_time = 0;
                {
                    let previous_press_time_lock = PREVIOUS_PRESS_TIME.lock();
                    let mut previous_release_time_lock = PREVIOUS_RELEASE_TIME.lock();
                    *previous_release_time_lock = current_release_time;
                    previous_release_time = *previous_release_time_lock;
                    previous_press_time = *previous_press_time_lock;
                }
                let pressed_time = current_release_time - previous_press_time;
                let is_double_click = current_release_time - previous_release_time < 700 && mouse_distance < 100.0;
                if pressed_time > 300 && mouse_distance > 20.0 {
                    is_text_selected_event = true;
                }
                if previous_release_time != 0 && is_double_click {
                    is_text_selected_event = true;
                }
                let is_click_on_thumb = match APP_HANDLE.get() {
                    Some(handle) => {
                        match handle.get_window(windows::THUMB_WIN_NAME) {
                            Some(window) => {
                                match window.outer_position() {
                                    Ok(position) => {
                                        let scale_factor = window.scale_factor().unwrap_or(1.0);
                                        if let Ok(size) = window.outer_size() {
                                            let LogicalPosition{ x: x1, y: y1 } = position.to_logical::<i32>(scale_factor);
                                            let LogicalSize{ width: w, height: h } = size.to_logical::<i32>(scale_factor);
                                            let (x2, y2) = (x1 + w, y1 + h);
                                            let res = x >= x1 && x <= x2 && y >= y1 && y <= y2;
                                            res
                                        } else {
                                            false
                                        }
                                    }
                                    Err(err) => {
                                        println!("err: {:?}", err);
                                        false
                                    }
                                }
                            }
                            None => false
                        }
                    }
                    None => false
                };
                if !is_text_selected_event && !is_click_on_thumb {
                    windows::close_thumb();
                    // println!("not text selected event");
                    // println!("is_click_on_thumb: {}", is_click_on_thumb);
                    // println!("mouse_distance: {}", mouse_distance);
                    // println!("pressed_time: {}", pressed_time);
                    // println!("released_time: {}", current_release_time - previous_release_time);
                    // println!("is_double_click: {}", is_double_click);
                    return;
                }

                if !is_click_on_thumb {
                    if cfg!(target_os = "macos") {
                        if RELEASE_THREAD_ID.is_locked() {
                            return;
                        }
                        std::thread::spawn(move || {
                            let _lock = RELEASE_THREAD_ID.lock();
                            let selected_text = utils::get_selected_text().unwrap();
                            if !selected_text.is_empty() {
                                {
                                    *SELECTED_TEXT.lock() = selected_text;
                                }
                                windows::show_thumb(x, y);
                            } else {
                                windows::close_thumb();
                            }
                        });
                    } else {
                        let selected_text = utils::get_selected_text().unwrap();
                        if !selected_text.is_empty() {
                            {
                                *SELECTED_TEXT.lock() = selected_text;
                            }
                            windows::show_thumb(x, y);
                        } else {
                            windows::close_thumb();
                        }
                    }
                } else {
                    windows::close_thumb();
                    let selected_text = (*SELECTED_TEXT.lock()).to_string();
                    if !selected_text.is_empty() {
                        let window = windows::show_main_window(false);
                        window.set_focus().unwrap();
                        utils::send_text(selected_text);
                    }
                }
            }
            _ => {}
        }
    }));

    match hook_result {
        Ok(_) => {
            println!("mouse event Hooked!");
        }
        Err(e) => {
            println!("Error: {}", e);
        }
    }

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
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec!["--silently"])))
        // .plugin(tauri_plugin_window_state::Builder::default().build())
        .setup(move |app| {
            if silently {
                let window = app.get_window(MAIN_WIN_NAME).unwrap();
                window.unminimize().unwrap();
                window.hide().unwrap();
            }
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
            #[cfg(target_os = "macos")]
            {
                // Disable the automatic creation of "Show Tab Bar" etc menu items on macOS
                let window = app.get_window(MAIN_WIN_NAME).unwrap();
                unsafe {
                    let ns_window = window.ns_window().unwrap() as cocoa::base::id;
                    NSWindow::setAllowsAutomaticWindowTabbing_(ns_window, cocoa::base::NO);
                }
            }
            windows::show_thumb(-100, -100);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_config_content,
            clear_config_cache,
            show_main_window_with_selected_text,
            get_main_window_always_on_top,
            set_main_window_always_on_top,
            ocr,
            detect_lang,
        ])
        .system_tray(tray::menu())
        .on_system_tray_event(tray::handler)
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let tauri::RunEvent::WindowEvent {
                label,
                event: tauri::WindowEvent::CloseRequested { api, .. },
                ..
            } = event
            {
                let window = app.get_window(label.as_str()).unwrap();
                window.hide().unwrap();
                api.prevent_close();
            }
        });
}
