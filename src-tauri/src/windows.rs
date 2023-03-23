use crate::config;
use crate::utils;
use crate::ALWAYS_ON_TOP;
use crate::APP_HANDLE;
use mouse_position::mouse_position::Mouse;
use std::sync::atomic::Ordering;
use tauri::{LogicalPosition, Manager, PhysicalPosition};
use window_shadows::set_shadow;

pub const MAIN_WIN_NAME: &str = "main";
pub const THUMB_WIN_NAME: &str = "thumb";

pub fn get_mouse_location() -> Result<(i32, i32), String> {
    let position = Mouse::get_mouse_position();
    match position {
        Mouse::Position { x, y } => Ok((x, y)),
        Mouse::Error => Err("Error getting mouse position".to_string()),
    }
}

#[tauri::command]
pub fn set_main_window_always_on_top() -> bool {
    let handle = APP_HANDLE.get().unwrap();
    let window = handle.get_window(MAIN_WIN_NAME).unwrap();
    let item = handle.tray_handle().get_item("pin");

    let always_on_top = ALWAYS_ON_TOP.load(Ordering::Acquire);

    if !always_on_top {
        window.set_always_on_top(true).unwrap();
        ALWAYS_ON_TOP.store(true, Ordering::Release);
        item.set_selected(true).unwrap();
    } else {
        window.set_always_on_top(false).unwrap();
        ALWAYS_ON_TOP.store(false, Ordering::Release);
        item.set_selected(false).unwrap();
    }
    ALWAYS_ON_TOP.load(Ordering::Acquire)
}

#[tauri::command]
pub fn get_main_window_always_on_top() -> bool {
    ALWAYS_ON_TOP.load(Ordering::Acquire)
}

#[tauri::command]
pub fn show_main_window_with_selected_text() {
    let window = show_main_window(false);
    let selected_text = match utils::get_selected_text() {
        Ok(text) => text,
        Err(e) => {
            eprintln!("Error getting selected text: {}", e);
            "".to_string()
        }
    };
    if !selected_text.is_empty() {
        utils::send_text(selected_text);
    } else {
        show_main_window(true);
    }

    window.set_focus().unwrap();
}

pub fn close_thumb() {
    let handle = APP_HANDLE.get().unwrap();
    match handle.get_window(THUMB_WIN_NAME) {
        Some(window) => {
            window.set_position(LogicalPosition::new(-100.0, -100.0)).unwrap();
        },
        None => {}
    }
}

pub fn show_thumb(x: i32, y: i32) {
    let handle = APP_HANDLE.get().unwrap();
    let position_offset = 7.0 as f64;
    match handle.get_window(THUMB_WIN_NAME) {
        Some(window) => {
            println!("Thumb window already exists");
            if cfg!(target_os = "macos") {
                window
                    .set_position(LogicalPosition::new(x as f64 + position_offset, y as f64 + position_offset))
                    .unwrap();
            } else {
                window.unminimize().unwrap();
                window
                    .set_position(PhysicalPosition::new(x as f64 + position_offset, y as f64 + position_offset))
                    .unwrap();
            }
            window.unminimize().unwrap();
            window.show().unwrap();
            window.set_always_on_top(true).unwrap();
        }
        None => {
            println!("Thumb window does not exist");
            let builder = tauri::WindowBuilder::new(
                handle,
                THUMB_WIN_NAME,
                tauri::WindowUrl::App("thumb.html".into()),
            )
            .fullscreen(false)
            .focused(false)
            .inner_size(20.0, 20.0)
            .min_inner_size(20.0, 20.0)
            .max_inner_size(20.0, 20.0)
            .visible(true)
            .resizable(false)
            .skip_taskbar(true)
            .decorations(false);

            #[cfg(target_os = "macos")]
            let window = builder.hidden_title(true).build().unwrap();

            #[cfg(not(target_os = "macos"))]
            let window = builder.transparent(true).build().unwrap();

            window.unminimize().unwrap();
            window.show().unwrap();
            window.set_always_on_top(true).unwrap();

            if cfg!(target_os = "macos") {
                window
                    .set_position(LogicalPosition::new(x as f64 + position_offset, y as f64 + position_offset))
                    .unwrap();
            } else {
                window.unminimize().unwrap();
                window
                    .set_position(PhysicalPosition::new(x as f64 + position_offset, y as f64 + position_offset))
                    .unwrap();
            }

            #[cfg(target_os = "macos")]
            set_shadow(&window, true).unwrap();
        }
    }
}

pub fn show_main_window(center: bool) -> tauri::Window {
    let handle = APP_HANDLE.get().unwrap();
    match handle.get_window(MAIN_WIN_NAME) {
        Some(window) => {
            let restore_previous_position = match config::get_config() {
                Ok(config) => config.restore_previous_position.unwrap_or(false),
                Err(e) => {
                    eprintln!("Error getting config: {}", e);
                    false
                }
            };

            if restore_previous_position {
                if !cfg!(target_os = "macos") {
                    window.unminimize().unwrap();
                }
            } else if !center {
                let (x, y): (i32, i32) = get_mouse_location().unwrap();
                if cfg!(target_os = "macos") {
                    window
                        .set_position(LogicalPosition::new(x as f64, y as f64))
                        .unwrap();
                } else {
                    window.unminimize().unwrap();
                    window
                        .set_position(PhysicalPosition::new(x as f64, y as f64))
                        .unwrap();
                }
            } else {
                if !cfg!(target_os = "macos") {
                    window.unminimize().unwrap();
                }
                window.center().unwrap();
            }
            window.unminimize().unwrap();
            window.show().unwrap();
            window
        }
        None => {
            let builder = tauri::WindowBuilder::new(
                handle,
                MAIN_WIN_NAME,
                tauri::WindowUrl::App("index.html".into()),
            )
            .fullscreen(false)
            .inner_size(600.0, 700.0)
            .min_inner_size(560.0, 600.0)
            .resizable(true)
            .skip_taskbar(true)
            .center()
            .focused(false)
            .title("OpenAI Translator");

            #[cfg(target_os = "macos")]
            {
                builder
                    .title_bar_style(tauri::TitleBarStyle::Overlay)
                    .hidden_title(true)
                    .build()
                    .unwrap()
            }

            #[cfg(target_os = "windows")]
            {
                let window = builder.decorations(false).build().unwrap();

                set_shadow(&window, true).unwrap();

                window
            }

            #[cfg(target_os = "linux")]
            {
                let window = builder.decorations(false).build().unwrap();

                set_shadow(&window, true).unwrap();

                window
            }
        }
    }
}
