use crate::config;
use crate::utils;
use crate::UpdateResult;
use crate::ALWAYS_ON_TOP;
use crate::APP_HANDLE;
#[cfg(target_os = "macos")]
use cocoa::appkit::NSWindow;
use debug_print::debug_println;
use enigo::*;
use get_selected_text::get_selected_text;
use mouse_position::mouse_position::Mouse;
use serde_json::json;
use std::sync::atomic::Ordering;
use tauri::{LogicalPosition, Manager, PhysicalPosition};
use tauri_plugin_updater::UpdaterExt;
use tauri_specta::Event;

pub const TRANSLATOR_WIN_NAME: &str = "translator";
pub const SETTINGS_WIN_NAME: &str = "settings";
pub const ACTION_MANAGER_WIN_NAME: &str = "action_manager";
pub const UPDATER_WIN_NAME: &str = "updater";
pub const THUMB_WIN_NAME: &str = "thumb";
pub const SCREENSHOT_WIN_NAME: &str = "screenshot";

fn get_dummy_window() -> tauri::WebviewWindow {
    let app_handle = APP_HANDLE.get().unwrap();
    match app_handle.get_webview_window("dummy") {
        Some(window) => {
            debug_println!("Dummy window found!");
            window
        }
        None => {
            debug_println!("Create dummy window!");
            tauri::WebviewWindowBuilder::new(
                app_handle,
                "dummy",
                tauri::WebviewUrl::App("src/tauri/dummy.html".into()),
            )
            .title("Dummy")
            .visible(false)
            .build()
            .unwrap()
        }
    }
}

pub fn get_current_monitor() -> tauri::Monitor {
    let window = get_dummy_window();
    let (mouse_logical_x, mouse_logical_y): (i32, i32) = get_mouse_location().unwrap();
    let scale_factor = window.scale_factor().unwrap_or(1.0);
    let mut mouse_physical_position = PhysicalPosition::new(mouse_logical_x, mouse_logical_y);
    if cfg!(target_os = "macos") {
        mouse_physical_position =
            LogicalPosition::new(mouse_logical_x as f64, mouse_logical_y as f64)
                .to_physical(scale_factor);
    }
    window
        .available_monitors()
        .map(|monitors| {
            monitors
                .iter()
                .find(|monitor| {
                    let monitor_physical_size = monitor.size();
                    let monitor_physical_position = monitor.position();
                    mouse_physical_position.x >= monitor_physical_position.x
                        && mouse_physical_position.x
                            <= monitor_physical_position.x + (monitor_physical_size.width as i32)
                        && mouse_physical_position.y >= monitor_physical_position.y
                        && mouse_physical_position.y
                            <= monitor_physical_position.y + (monitor_physical_size.height as i32)
                })
                .cloned()
        })
        .unwrap_or_else(|e| {
            eprintln!("Error get available monitors: {}", e);
            None
        })
        .or_else(|| window.current_monitor().unwrap())
        .or_else(|| window.primary_monitor().unwrap())
        .expect("No current monitor found")
}

pub fn get_mouse_location() -> Result<(i32, i32), String> {
    let position = Mouse::get_mouse_position();
    match position {
        Mouse::Position { x, y } => Ok((x, y)),
        Mouse::Error => Err("Error getting mouse position".to_string()),
    }
}

pub fn set_translator_window_always_on_top() -> bool {
    let handle = APP_HANDLE.get().unwrap();
    if let Some(window) = handle.get_webview_window(TRANSLATOR_WIN_NAME) {
        let always_on_top = ALWAYS_ON_TOP.load(Ordering::Acquire);

        if !always_on_top {
            window.set_always_on_top(true).unwrap();
            ALWAYS_ON_TOP.store(true, Ordering::Release);
        } else {
            window.set_always_on_top(false).unwrap();
            ALWAYS_ON_TOP.store(false, Ordering::Release);
        }
        ALWAYS_ON_TOP.load(Ordering::Acquire)
    } else {
        false
    }
}

#[tauri::command]
#[specta::specta]
pub fn get_translator_window_always_on_top() -> bool {
    ALWAYS_ON_TOP.load(Ordering::Acquire)
}

#[tauri::command]
#[specta::specta]
pub async fn show_translator_window_with_selected_text_command() {
    let mut window = show_translator_window(false, true, false);
    let mut enigo = Enigo::new(&Settings::default()).unwrap();
    let selected_text;
    if cfg!(target_os = "macos") {
        selected_text = match utils::get_selected_text_by_clipboard(&mut enigo, false) {
            Ok(text) => text,
            Err(e) => {
                eprintln!("Error getting selected text: {}", e);
                "".to_string()
            }
        };
    } else {
        selected_text = match get_selected_text() {
            Ok(text) => text,
            Err(e) => {
                eprintln!("Error getting selected text: {}", e);
                "".to_string()
            }
        };
    }
    if !selected_text.is_empty() {
        utils::send_text(selected_text);
    } else {
        window = show_translator_window(true, false, false);
    }

    window.set_focus().unwrap();
    utils::show();
}

pub fn do_hide_translator_window() {
    if let Some(handle) = APP_HANDLE.get() {
        match handle.get_webview_window(TRANSLATOR_WIN_NAME) {
            Some(window) => {
                #[cfg(not(target_os = "macos"))]
                {
                    window.hide().unwrap();
                }
                #[cfg(target_os = "macos")]
                {
                    tauri::AppHandle::hide(&handle).unwrap();
                    window.hide().unwrap();
                }
            }
            None => {}
        }
    }
}

#[tauri::command]
#[specta::specta]
pub async fn hide_translator_window() {
    do_hide_translator_window();
}

pub fn delete_thumb() {
    match APP_HANDLE.get() {
        Some(handle) => match handle.get_webview_window(THUMB_WIN_NAME) {
            Some(window) => {
                window.close().unwrap();
            }
            None => {}
        },
        None => {}
    }
}

pub fn close_thumb() {
    match APP_HANDLE.get() {
        Some(handle) => match handle.get_webview_window(THUMB_WIN_NAME) {
            Some(window) => {
                window
                    .set_position(LogicalPosition::new(-100.0, -100.0))
                    .unwrap();
                window.set_always_on_top(false).unwrap();
                window.hide().unwrap();
            }
            None => {}
        },
        None => {}
    }
}

pub fn show_thumb(x: i32, y: i32) {
    let window = get_thumb_window(x, y);
    window.show().unwrap();
}

pub fn get_thumb_window(x: i32, y: i32) -> tauri::WebviewWindow {
    let handle = APP_HANDLE.get().unwrap();
    let position_offset = 7.0 as f64;
    let window = match handle.get_webview_window(THUMB_WIN_NAME) {
        Some(window) => {
            debug_println!("Thumb window already exists");
            window.unminimize().unwrap();
            window.set_always_on_top(true).unwrap();
            window
        }
        None => {
            debug_println!("Thumb window does not exist");
            let mut builder = tauri::WebviewWindowBuilder::new(
                handle,
                THUMB_WIN_NAME,
                tauri::WebviewUrl::App("src/tauri/index.html".into()),
            )
            .fullscreen(false)
            .focused(false)
            .inner_size(20.0, 20.0)
            .min_inner_size(20.0, 20.0)
            .max_inner_size(20.0, 20.0)
            .visible(false)
            .resizable(false)
            .skip_taskbar(true)
            .minimizable(false)
            .maximizable(false)
            .closable(false)
            .decorations(false);

            #[cfg(target_os = "windows")]
            {
                builder = builder.shadow(false);
            }

            let window = builder.build().unwrap();
            #[cfg(target_os = "windows")]
            {
                // use SetWindowLongPtrW in tao page to disable minimize, maximize and close buttons
                use windows::Win32::UI::WindowsAndMessaging::{
                    SetWindowLongPtrW, GWL_STYLE, WS_POPUP,
                };
                let hwnd: windows::Win32::Foundation::HWND = window.hwnd().unwrap();
                unsafe {
                    // let mut style = GetWindowLongPtrW(hwnd, GWL_STYLE);
                    // style = style & !(0x00020000 | 0x00010000 | 0x00080000); // WS_MINIMIZEBOX | WS_MAXIMIZEBOX | WS_SYSMENU
                    let style: u32 = WS_POPUP.0;
                    SetWindowLongPtrW(hwnd, GWL_STYLE, style as isize);
                }
                window
                    .set_size(tauri::LogicalSize {
                        width: 20.0,
                        height: 20.0,
                    })
                    .unwrap();
            }
            post_process_window(&window);

            window.unminimize().unwrap();
            window.set_always_on_top(true).unwrap();

            window
        }
    };

    if cfg!(target_os = "macos") {
        window
            .set_position(LogicalPosition::new(
                x as f64 + position_offset,
                y as f64 + position_offset,
            ))
            .unwrap();
    } else {
        window
            .set_position(PhysicalPosition::new(
                x as f64 + position_offset,
                y as f64 + position_offset,
            ))
            .unwrap();
    }

    window
}

pub fn post_process_window<R: tauri::Runtime>(window: &tauri::WebviewWindow<R>) {
    window.set_visible_on_all_workspaces(true).unwrap();

    let _ = window.current_monitor();

    #[cfg(target_os = "macos")]
    {
        use cocoa::appkit::NSWindowCollectionBehavior;
        use cocoa::base::id;

        let ns_win = window.ns_window().unwrap() as id;

        unsafe {
            // Disable the automatic creation of "Show Tab Bar" etc menu items on macOS
            NSWindow::setAllowsAutomaticWindowTabbing_(ns_win, cocoa::base::NO);

            let mut collection_behavior = ns_win.collectionBehavior();
            collection_behavior |=
                NSWindowCollectionBehavior::NSWindowCollectionBehaviorCanJoinAllSpaces;

            ns_win.setCollectionBehavior_(collection_behavior);
        }
    }
}

pub fn build_window<'a, R: tauri::Runtime, M: tauri::Manager<R>>(
    builder: tauri::WebviewWindowBuilder<'a, R, M>,
) -> tauri::WebviewWindow<R> {
    #[cfg(target_os = "macos")]
    {
        let window = builder
            .title_bar_style(tauri::TitleBarStyle::Overlay)
            .hidden_title(true)
            .transparent(true)
            .build()
            .unwrap();

        post_process_window(&window);

        window
    }

    #[cfg(not(target_os = "macos"))]
    {
        let window = builder.transparent(true).decorations(true).build().unwrap();

        post_process_window(&window);

        window
    }
}

#[tauri::command]
#[specta::specta]
pub async fn show_translator_window_command() {
    show_translator_window(false, false, true);
}

pub fn show_translator_window(
    center: bool,
    to_mouse_position: bool,
    set_focus: bool,
) -> tauri::WebviewWindow {
    let window = get_translator_window(center, to_mouse_position, set_focus);
    window.show().unwrap();
    window
}

pub fn get_translator_window(
    center: bool,
    to_mouse_position: bool,
    set_focus: bool,
) -> tauri::WebviewWindow {
    let current_monitor = get_current_monitor();
    let handle = APP_HANDLE.get().unwrap();
    let window = match handle.get_webview_window(TRANSLATOR_WIN_NAME) {
        Some(window) => {
            window.unminimize().unwrap();
            if set_focus {
                window.set_focus().unwrap();
            }
            window
        }
        None => {
            let config = config::get_config_by_app(handle).unwrap();

            let builder = tauri::WebviewWindowBuilder::new(
                handle,
                TRANSLATOR_WIN_NAME,
                tauri::WebviewUrl::App("src/tauri/index.html".into()),
            )
            .title("OpenAI Translator")
            .fullscreen(false)
            .inner_size(620.0, 700.0)
            .min_inner_size(540.0, 600.0)
            .resizable(true)
            .skip_taskbar(config.hide_the_icon_in_the_dock.unwrap_or(true))
            .visible(false)
            .focused(false);

            build_window(builder)
        }
    };

    let restore_previous_position = match config::get_config() {
        Ok(config) => config.restore_previous_position.unwrap_or(false),
        Err(e) => {
            eprintln!("Error getting config: {}", e);
            false
        }
    };

    if restore_previous_position {
        debug_println!("Restoring previous position");
        if !cfg!(target_os = "macos") {
            window.unminimize().unwrap();
        }
    } else if to_mouse_position {
        debug_println!("Setting position to mouse position");
        let (mouse_logical_x, mouse_logical_y): (i32, i32) = get_mouse_location().unwrap();
        let window_physical_size = window.outer_size().unwrap();
        let scale_factor = window.scale_factor().unwrap_or(1.0);
        let mut mouse_physical_position = PhysicalPosition::new(mouse_logical_x, mouse_logical_y);
        if cfg!(target_os = "macos") {
            mouse_physical_position =
                LogicalPosition::new(mouse_logical_x as f64, mouse_logical_y as f64)
                    .to_physical(scale_factor);
        }

        let monitor_physical_size = current_monitor.size();
        let monitor_physical_position = current_monitor.position();

        let mut window_physical_position = mouse_physical_position;
        if mouse_physical_position.x + (window_physical_size.width as i32)
            > monitor_physical_position.x + (monitor_physical_size.width as i32)
        {
            window_physical_position.x = monitor_physical_position.x
                + (monitor_physical_size.width as i32)
                - (window_physical_size.width as i32);
        }
        if mouse_physical_position.y + (window_physical_size.height as i32)
            > monitor_physical_position.y + (monitor_physical_size.height as i32)
        {
            window_physical_position.y = monitor_physical_position.y
                + (monitor_physical_size.height as i32)
                - (window_physical_size.height as i32);
        }
        if !cfg!(target_os = "macos") {
            window.unminimize().unwrap();
        }
        debug_println!("Mouse physical position: {:?}", mouse_physical_position);
        debug_println!("Monitor physical size: {:?}", monitor_physical_size);
        debug_println!("Monitor physical position: {:?}", monitor_physical_position);
        debug_println!("Window physical size: {:?}", window_physical_size);
        debug_println!("Window physical position: {:?}", window_physical_position);
        window.set_position(window_physical_position).unwrap();
    } else if center {
        if !cfg!(target_os = "macos") {
            window.unminimize().unwrap();
        }
        window.center().unwrap();
    }

    window
}

#[tauri::command]
#[specta::specta]
pub async fn show_action_manager_window() {
    let window = get_action_manager_window();
    window.center().unwrap();
    window.show().unwrap();
}

pub fn get_action_manager_window() -> tauri::WebviewWindow {
    let handle = APP_HANDLE.get().unwrap();
    let window = match handle.get_webview_window(ACTION_MANAGER_WIN_NAME) {
        Some(window) => {
            window.unminimize().unwrap();
            window.set_focus().unwrap();
            window
        }
        None => {
            let builder = tauri::WebviewWindowBuilder::new(
                handle,
                ACTION_MANAGER_WIN_NAME,
                tauri::WebviewUrl::App("src/tauri/index.html".into()),
            )
            .title("OpenAI Translator Action Manager")
            .fullscreen(false)
            .inner_size(700.0, 700.0)
            .min_inner_size(660.0, 600.0)
            .resizable(true)
            .skip_taskbar(true)
            .focused(true);

            return build_window(builder);
        }
    };

    window
}

pub fn show_settings_window() {
    let window = get_settings_window();
    window.center().unwrap();
    window.show().unwrap();
}

pub fn get_settings_window() -> tauri::WebviewWindow {
    let handle = APP_HANDLE.get().unwrap();
    let window = match handle.get_webview_window(SETTINGS_WIN_NAME) {
        Some(window) => {
            window.unminimize().unwrap();
            window.set_focus().unwrap();
            window
        }
        None => {
            let builder = tauri::WebviewWindowBuilder::new(
                handle,
                SETTINGS_WIN_NAME,
                tauri::WebviewUrl::App("src/tauri/index.html".into()),
            )
            .title("OpenAI Translator Settings")
            .fullscreen(false)
            .inner_size(660.0, 800.0)
            .min_inner_size(660.0, 600.0)
            .resizable(true)
            .skip_taskbar(true)
            .focused(true);

            return build_window(builder);
        }
    };

    window
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone, specta::Type, tauri_specta::Event)]
pub struct CheckUpdateResultEvent(UpdateResult);

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone, specta::Type, tauri_specta::Event)]
pub struct CheckUpdateEvent;

pub fn show_updater_window() {
    let window = get_updater_window();
    window.center().unwrap();
    window.show().unwrap();

    let handle = APP_HANDLE.get().unwrap();
    CheckUpdateEvent::listen(handle, move |event| {
        let window_clone = window.clone();
        tauri::async_runtime::spawn(async move {
            let builder = handle.updater_builder();
            let updater = builder.build().unwrap();

            match updater.check().await {
                Ok(Some(update)) => {
                    CheckUpdateResultEvent(UpdateResult {
                        version: update.version,
                        current_version: update.current_version,
                        body: update.body,
                    })
                    .emit(handle)
                    .unwrap();
                }
                Ok(None) => {
                    handle
                        .emit(
                            "update_result",
                            json!({
                                "result": None::<UpdateResult>
                            }),
                        )
                        .unwrap();
                }
                Err(_) => {}
            }
            window_clone.unlisten(event.id)
        });
    });
}

pub fn get_updater_window() -> tauri::WebviewWindow {
    let handle = APP_HANDLE.get().unwrap();
    let window = match handle.get_webview_window(UPDATER_WIN_NAME) {
        Some(window) => {
            window.unminimize().unwrap();
            window.set_focus().unwrap();
            window
        }
        None => {
            let builder = tauri::WebviewWindowBuilder::new(
                handle,
                UPDATER_WIN_NAME,
                tauri::WebviewUrl::App("src/tauri/index.html".into()),
            )
            .title("OpenAI Translator Updater")
            .fullscreen(false)
            .inner_size(500.0, 500.0)
            .min_inner_size(200.0, 200.0)
            .resizable(true)
            .skip_taskbar(true)
            .focused(true);

            return build_window(builder);
        }
    };

    window
}

pub fn show_screenshot_window() {
    let _ = get_screenshot_window();
    // window.show().unwrap();
}

pub fn get_screenshot_window() -> tauri::WebviewWindow {
    let handle = APP_HANDLE.get().unwrap();
    let current_monitor = get_current_monitor();
    let dpi = current_monitor.scale_factor();
    let physical_position = current_monitor.position();
    let position: tauri::LogicalPosition<f64> = physical_position.to_logical(dpi);

    let window = match handle.get_webview_window(SCREENSHOT_WIN_NAME) {
        Some(window) => {
            window.set_focus().unwrap();
            window
        }
        None => {
            let builder = tauri::WebviewWindowBuilder::new(
                handle,
                SCREENSHOT_WIN_NAME,
                tauri::WebviewUrl::App("src/tauri/index.html".into()),
            )
            .title("OpenAI Translator Screenshot")
            .position(position.x, position.y)
            .visible(false)
            .focused(true);

            let window = build_window(builder);
            window
        }
    };

    window.set_resizable(false).unwrap();
    window.set_skip_taskbar(true).unwrap();
    #[cfg(target_os = "macos")]
    {
        let size = current_monitor.size();
        window.set_decorations(false).unwrap();
        window.set_size(*size).unwrap();
    }

    #[cfg(not(target_os = "macos"))]
    window.set_fullscreen(true).unwrap();

    window.set_always_on_top(true).unwrap();

    window
}
