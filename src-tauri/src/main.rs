#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod fetch;
mod config;
mod lang;
mod ocr;
mod writing;
mod tray;
mod utils;
mod windows;

use parking_lot::Mutex;
use windows::get_main_window;
use std::env;
use std::sync::atomic::{AtomicBool, Ordering};
use sysinfo::{CpuExt, System, SystemExt};
use tauri_plugin_autostart::MacosLauncher;

use crate::config::{clear_config_cache, get_config_content};
use crate::lang::detect_lang;
use crate::ocr::ocr;
use crate::fetch::fetch_stream;
use crate::writing::{writing, write_to_input, finish_writing};
use crate::windows::{
    get_main_window_always_on_top, set_main_window_always_on_top, show_action_manager_window,
    show_main_window_with_selected_text, MAIN_WIN_NAME,
    show_updater_window, close_updater_window,
};

use mouce::Mouse;
use once_cell::sync::OnceCell;
use tauri_plugin_notification::NotificationExt;
use tauri::{AppHandle, LogicalPosition, LogicalSize};
use tauri::{Manager, PhysicalPosition, PhysicalSize};
use tiny_http::{Response as HttpResponse, Server};
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

#[inline]
fn launch_ipc_server(server: &Server) {
    for mut req in server.incoming_requests() {
        let mut selected_text = String::new();
        req.as_reader().read_to_string(&mut selected_text).unwrap();
        utils::send_text(selected_text);
        let window = windows::show_main_window(false, false);
        window.set_focus().unwrap();
        utils::show();
        let response = HttpResponse::from_string("ok");
        req.respond(response).unwrap();
    }
}

fn main() {
    let silently = env::args().any(|arg| arg == "--silently");

    let mut mouse_manager = Mouse::new();

    if !query_accessibility_permissions() {
        return;
    }

    let hook_result = mouse_manager.hook(Box::new(|event| {
        if cfg!(target_os = "linux") {
            return;
        }
        match event {
            mouce::common::MouseEvent::Press(mouce::common::MouseButton::Left) => {
                let config = config::get_config().unwrap();
                let always_show_icons = config.always_show_icons.unwrap_or(true);
                if !always_show_icons {
                    return;
                }
                let current_press_time = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_millis();
                *PREVIOUS_PRESS_TIME.lock() = current_press_time;
            }
            mouce::common::MouseEvent::Release(mouce::common::MouseButton::Left) => {
                let config = config::get_config().unwrap();
                let always_show_icons = config.always_show_icons.unwrap_or(true);
                if !always_show_icons {
                    windows::delete_thumb();
                    return;
                }
                let current_release_time = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_millis();
                let mut is_text_selected_event = false;
                let (x, y): (i32, i32) = windows::get_mouse_location().unwrap();
                let (prev_release_x, prev_release_y) = { *PREVIOUS_RELEASE_POSITION.lock() };
                {
                    *PREVIOUS_RELEASE_POSITION.lock() = (x, y);
                }
                let mouse_distance =
                    (((x - prev_release_x).pow(2) + (y - prev_release_y).pow(2)) as f64).sqrt();
                let mut previous_press_time = 0;
                let mut previous_release_time = 0;
                {
                    let previous_press_time_lock = PREVIOUS_PRESS_TIME.lock();
                    let mut previous_release_time_lock = PREVIOUS_RELEASE_TIME.lock();
                    previous_release_time = *previous_release_time_lock;
                    *previous_release_time_lock = current_release_time;
                    previous_press_time = *previous_press_time_lock;
                }
                let is_pressed = previous_release_time < previous_press_time;
                let pressed_time = current_release_time - previous_press_time;
                let is_double_click =
                    current_release_time - previous_release_time < 700 && mouse_distance < 10.0;
                if is_pressed && pressed_time > 300 && mouse_distance > 20.0 {
                    is_text_selected_event = true;
                }
                if previous_release_time != 0 && is_double_click {
                    is_text_selected_event = true;
                }
                let is_click_on_thumb = match APP_HANDLE.get() {
                    Some(handle) => match handle.get_window(windows::THUMB_WIN_NAME) {
                        Some(window) => match window.outer_position() {
                            Ok(position) => {
                                let scale_factor = window.scale_factor().unwrap_or(1.0);
                                if let Ok(size) = window.outer_size() {
                                    if cfg!(target_os = "macos") {
                                        let LogicalPosition { x: x1, y: y1 } =
                                            position.to_logical::<i32>(scale_factor);
                                        let LogicalSize {
                                            width: mut w,
                                            height: mut h,
                                        } = size.to_logical::<i32>(scale_factor);
                                        if cfg!(target_os = "windows") {
                                            w = (20.0 as f64 * scale_factor) as i32;
                                            h = (20.0 as f64 * scale_factor) as i32;
                                        }
                                        let (x2, y2) = (x1 + w, y1 + h);
                                        let res = x >= x1 && x <= x2 && y >= y1 && y <= y2;
                                        res
                                    } else {
                                        let PhysicalPosition { x: x1, y: y1 } = position;
                                        let PhysicalSize {
                                            width: mut w,
                                            height: mut h,
                                        } = size;
                                        if cfg!(target_os = "windows") {
                                            w = (20.0 as f64 * scale_factor) as u32;
                                            h = (20.0 as f64 * scale_factor) as u32;
                                        }
                                        let (x2, y2) = (x1 + w as i32, y1 + h as i32);
                                        let res = x >= x1 && x <= x2 && y >= y1 && y <= y2;
                                        res
                                    }
                                } else {
                                    false
                                }
                            }
                            Err(err) => {
                                println!("err: {:?}", err);
                                false
                            }
                        },
                        None => false,
                    },
                    None => false,
                };
                // println!("is_text_selected_event: {}", is_text_selected_event);
                // println!("is_click_on_thumb: {}", is_click_on_thumb);
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
                    if RELEASE_THREAD_ID.is_locked() {
                        // println!("release thread is locked");
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
                            // println!("selected text is empty");
                            windows::close_thumb();
                        }
                    });
                } else {
                    windows::close_thumb();
                    let selected_text = (*SELECTED_TEXT.lock()).to_string();
                    if !selected_text.is_empty() {
                        let window = windows::show_main_window(false, false);
                        utils::send_text(selected_text);
                        if cfg!(target_os = "windows") {
                            window.set_always_on_top(true).unwrap();
                            let always_on_top = ALWAYS_ON_TOP.load(Ordering::Acquire);
                            if !always_on_top {
                                std::thread::spawn(move || {
                                    window.set_always_on_top(false).unwrap();
                                });
                            }
                        } else {
                            window.set_focus().unwrap();
                        }
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

    let mut app = tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            println!("{}, {argv:?}, {cwd}", app.package_info().name);
            app.notification()
                .builder()
                .title("This app is already running!")
                .body("You can find it in the tray menu.")
                .show()
                .unwrap();
        }))
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--silently"]),
        ))
        .plugin(tauri_plugin_process::init())
        .setup(move |app| {
            let app_handle = app.handle();
            APP_HANDLE.get_or_init(|| app.handle().clone());
            tray::create_tray(&app_handle)?;
            app_handle.plugin(tauri_plugin_global_shortcut::Builder::new().build())?;
            app_handle.plugin(tauri_plugin_updater::Builder::new().build())?;
            if silently {
                let window = get_main_window(false, false);
                window.unminimize().unwrap();
                window.hide().unwrap();
            } else {
                let window = get_main_window(false, false);
                window.set_focus().unwrap();
                window.show().unwrap();
            }
            if !query_accessibility_permissions() {
                let window = app.get_window(MAIN_WIN_NAME).unwrap();
                window.minimize().unwrap();
                app.notification()
                    .builder()
                    .title("Accessibility permissions")
                    .body("Please grant accessibility permissions to the app")
                    .icon("icon.png")
                    .show()
                    .unwrap();
            }
            std::thread::spawn(move || {
                #[cfg(target_os = "windows")]
                {
                    let server = Server::http("127.0.0.1:62007").unwrap();
                    launch_ipc_server(&server);
                }
                #[cfg(not(target_os = "windows"))]
                {
                    use std::path::Path;
                    let path = Path::new("/tmp/openai-translator.sock");
                    std::fs::remove_file(path).unwrap_or_default();
                    let server = Server::http_unix(path).unwrap();
                    launch_ipc_server(&server);
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_config_content,
            clear_config_cache,
            show_main_window_with_selected_text,
            show_action_manager_window,
            show_updater_window,
            close_updater_window,
            get_main_window_always_on_top,
            set_main_window_always_on_top,
            ocr,
            fetch_stream,
            writing,
            write_to_input,
            finish_writing,
            detect_lang,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    #[cfg(target_os = "macos")]
    app.set_activation_policy(tauri::ActivationPolicy::Regular);

    app.run(|app, event| {
        if let tauri::RunEvent::WindowEvent {
            label,
            event: tauri::WindowEvent::CloseRequested { api, .. },
            ..
        } = event
        {
            if label != MAIN_WIN_NAME {
                return;
            }

            #[cfg(target_os = "macos")]
            {
                tauri::AppHandle::hide(&app.app_handle()).unwrap();
            }
            #[cfg(target_os = "windows")]
            {
                let window = app.get_window(label.as_str()).unwrap();
                window.hide().unwrap();
            }
            api.prevent_close();
        }
    });
}
