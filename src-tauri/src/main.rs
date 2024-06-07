#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod config;
mod fetch;
mod lang;
mod ocr;
mod tray;
mod utils;
mod windows;
mod writing;

use config::get_config;
use debug_print::debug_println;
use get_selected_text::get_selected_text;
use parking_lot::Mutex;
use serde_json::json;
use std::env;
use std::sync::atomic::{AtomicBool, Ordering};
use sysinfo::{CpuExt, System, SystemExt};
use tauri_plugin_aptabase::EventTracker;
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_updater::UpdaterExt;
use tauri_specta::Event;
use tray::{PinnedFromTrayEvent, PinnedFromWindowEvent};
use windows::{get_translator_window, CheckUpdateEvent, CheckUpdateResultEvent};

use crate::config::{clear_config_cache, get_config_content, ConfigUpdatedEvent};
use crate::fetch::fetch_stream;
use crate::lang::detect_lang;
use crate::ocr::{cut_image, finish_ocr, screenshot, start_ocr};
use crate::windows::{
    get_translator_window_always_on_top, hide_translator_window, show_action_manager_window,
    show_translator_window_command, show_translator_window_with_selected_text_command,
    show_updater_window, TRANSLATOR_WIN_NAME,
};
use crate::writing::{finish_writing, write_to_input, writing_command};

use mouce::Mouse;
use once_cell::sync::OnceCell;
use tauri::{AppHandle, LogicalPosition, LogicalSize};
use tauri::{Manager, PhysicalPosition, PhysicalSize};
use tauri_plugin_notification::NotificationExt;
use tiny_http::{Response as HttpResponse, Server};

pub static APP_HANDLE: OnceCell<AppHandle> = OnceCell::new();
pub static ALWAYS_ON_TOP: AtomicBool = AtomicBool::new(false);
pub static CPU_VENDOR: Mutex<String> = Mutex::new(String::new());
pub static SELECTED_TEXT: Mutex<String> = Mutex::new(String::new());
pub static PREVIOUS_PRESS_TIME: Mutex<u128> = Mutex::new(0);
pub static PREVIOUS_RELEASE_TIME: Mutex<u128> = Mutex::new(0);
pub static PREVIOUS_RELEASE_POSITION: Mutex<(i32, i32)> = Mutex::new((0, 0));
pub static RELEASE_THREAD_ID: Mutex<u32> = Mutex::new(0);

#[derive(Clone, Debug, serde::Serialize, serde::Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateResult {
    version: String,
    current_version: String,
    body: Option<String>,
}

pub static UPDATE_RESULT: Mutex<Option<Option<UpdateResult>>> = Mutex::new(None);

#[tauri::command]
#[specta::specta]
fn get_update_result() -> (bool, Option<UpdateResult>) {
    if UPDATE_RESULT.lock().is_none() {
        return (false, None);
    }
    return (true, UPDATE_RESULT.lock().clone().unwrap());
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
        let window = windows::show_translator_window(false, true, false);
        window.set_focus().unwrap();
        utils::show();
        let response = HttpResponse::from_string("ok");
        req.respond(response).unwrap();
    }
}

fn bind_mouse_hook() {
    if !query_accessibility_permissions() {
        return;
    }

    // Mouse event hook requires `sudo` permission on linux.
    // Let's just skip it.
    if cfg!(target_os = "linux") {
        println!("mouse event hook skipped in linux!");
        return;
    }

    let mut mouse_manager = Mouse::new();

    let hook_result = mouse_manager.hook(Box::new(|event| {
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
                    Some(handle) => match handle.get_webview_window(windows::THUMB_WIN_NAME) {
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
                // debug_println!("is_text_selected_event: {}", is_text_selected_event);
                // debug_println!("is_click_on_thumb: {}", is_click_on_thumb);
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
                        return;
                    }
                    std::thread::spawn(move || {
                        #[cfg(target_os = "macos")]
                        {
                            if !utils::is_valid_selected_frame().unwrap_or(false) {
                                debug_println!("No valid selected frame");
                                windows::close_thumb();
                                return;
                            }
                        }

                        let _lock = RELEASE_THREAD_ID.lock();
                        let selected_text = get_selected_text().unwrap_or_default();
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
                    windows::close_thumb();
                    let selected_text = (*SELECTED_TEXT.lock()).to_string();
                    if !selected_text.is_empty() {
                        let window = windows::show_translator_window(false, true, false);
                        utils::send_text(selected_text);
                        window.set_focus().unwrap();
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
}

fn main() {
    let silently = env::args().any(|arg| arg == "--silently");

    let mut sys = System::new();
    sys.refresh_cpu(); // Refreshing CPU information.
    if let Some(cpu) = sys.cpus().first() {
        let vendor_id = cpu.vendor_id().to_string();
        *CPU_VENDOR.lock() = vendor_id;
    }

    let (invoke_handler, register_events) = {
        let builder = tauri_specta::ts::builder()
            .commands(tauri_specta::collect_commands![
                get_config_content,
                get_update_result,
                clear_config_cache,
                show_translator_window_command,
                show_translator_window_with_selected_text_command,
                show_action_manager_window,
                get_translator_window_always_on_top,
                fetch_stream,
                writing_command,
                write_to_input,
                finish_writing,
                detect_lang,
                screenshot,
                hide_translator_window,
                start_ocr,
                finish_ocr,
                cut_image,
            ])
            .events(tauri_specta::collect_events![
                CheckUpdateEvent,
                CheckUpdateResultEvent,
                PinnedFromWindowEvent,
                PinnedFromTrayEvent,
                ConfigUpdatedEvent
            ])
            .config(specta::ts::ExportConfig::default().formatter(specta::ts::formatter::prettier));

        #[cfg(debug_assertions)]
        let builder = builder.path("../src/tauri/bindings.ts");

        builder.build().unwrap()
    };

    let mut app = tauri::Builder::default()
        .plugin(
            tauri_plugin_aptabase::Builder::new("A-US-9856842764")
                .with_panic_hook(Box::new(|client, info, msg| {
                    let location = info
                        .location()
                        .map(|loc| format!("{}:{}:{}", loc.file(), loc.line(), loc.column()))
                        .unwrap_or_else(|| "".to_string());

                    client.track_event(
                        "panic",
                        Some(json!({
                            "info": format!("{} ({})", msg, location),
                        })),
                    );
                }))
                .build(),
        )
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
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
            // create thumb window
            let _ = windows::get_thumb_window(0, 0);
            if silently {
                // create translator window
                let _ = get_translator_window(false, false, false);
                windows::do_hide_translator_window();
                debug_println!("translator window is hidden");
            } else {
                let window = get_translator_window(false, false, false);
                window.set_focus().unwrap();
                window.show().unwrap();
            }
            if !query_accessibility_permissions() {
                if let Some(window) = app.get_webview_window(TRANSLATOR_WIN_NAME) {
                    window.minimize().unwrap();
                }
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

            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                loop {
                    std::thread::sleep(std::time::Duration::from_secs(60 * 10));
                    let builder = handle.updater_builder();
                    let updater = builder.build().unwrap();

                    match updater.check().await {
                        Ok(Some(update)) => {
                            *UPDATE_RESULT.lock() = Some(Some(UpdateResult {
                                version: update.version,
                                current_version: update.current_version,
                                body: update.body,
                            }));
                            tray::create_tray(&handle).unwrap();
                        }
                        Ok(None) => {
                            if UPDATE_RESULT.lock().is_some() {
                                if let Some(Some(_)) = *UPDATE_RESULT.lock() {
                                    *UPDATE_RESULT.lock() = Some(None);
                                    tray::create_tray(&handle).unwrap();
                                }
                            } else {
                                *UPDATE_RESULT.lock() = Some(None);
                            }
                        }
                        Err(_) => {}
                    }
                }
            });
            register_events(app);

            let handle = app_handle.clone();
            PinnedFromWindowEvent::listen_any(app_handle, move |event| {
                let pinned = event.payload.pinned();
                ALWAYS_ON_TOP.store(*pinned, Ordering::Release);
                tray::create_tray(&handle).unwrap();
            });

            let handle = app_handle.clone();
            ConfigUpdatedEvent::listen_any(app_handle, move |_event| {
                clear_config_cache();
                tray::create_tray(&handle).unwrap();
            });
            Ok(())
        })
        .invoke_handler(invoke_handler)
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    #[cfg(target_os = "macos")]
    {
        let config = config::get_config_by_app(app.handle()).unwrap();
        if config.hide_the_icon_in_the_dock.unwrap_or(true) {
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);
        } else {
            app.set_activation_policy(tauri::ActivationPolicy::Regular);
        }
    }

    app.run(|app, event| match event {
        tauri::RunEvent::Exit { .. } => {
            app.track_event("app_exited", None);
            app.flush_events_blocking();
        }
        tauri::RunEvent::Ready => {
            app.track_event("app_started", None);
            bind_mouse_hook();
            let handle = app.clone();
            tauri::async_runtime::spawn(async move {
                let builder = handle.updater_builder();
                let updater = builder.build().unwrap();

                match updater.check().await {
                    Ok(Some(update)) => {
                        *UPDATE_RESULT.lock() = Some(Some(UpdateResult {
                            version: update.version,
                            current_version: update.current_version,
                            body: update.body,
                        }));
                        tray::create_tray(&handle).unwrap();
                        let config = get_config().unwrap();
                        if config.automatic_check_for_updates.is_none()
                            || config
                                .automatic_check_for_updates
                                .is_some_and(|x| x == true)
                        {
                            std::thread::sleep(std::time::Duration::from_secs(3));
                            show_updater_window();
                        }
                    }
                    Ok(None) => {
                        if UPDATE_RESULT.lock().is_some() {
                            if let Some(Some(_)) = *UPDATE_RESULT.lock() {
                                *UPDATE_RESULT.lock() = Some(None);
                                tray::create_tray(&handle).unwrap();
                            }
                        } else {
                            *UPDATE_RESULT.lock() = Some(None);
                        }
                    }
                    Err(_) => {}
                }
            });
        }
        tauri::RunEvent::WindowEvent {
            label,
            event: tauri::WindowEvent::CloseRequested { api, .. },
            ..
        } => {
            if label != TRANSLATOR_WIN_NAME {
                return;
            }

            windows::do_hide_translator_window();

            api.prevent_close();
        }
        #[cfg(target_os = "macos")]
        tauri::RunEvent::Reopen {
            has_visible_windows,
            ..
        } => {
            if !has_visible_windows {
                windows::show_translator_window(false, false, false);
            }
        }
        _ => {}
    });
}
