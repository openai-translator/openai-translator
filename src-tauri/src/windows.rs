use crate::config;
use crate::utils;
use crate::ALWAYS_ON_TOP;
use crate::APP_HANDLE;
use debug_print::debug_println;
use mouse_position::mouse_position::Mouse;
use std::sync::atomic::Ordering;
use tauri::{LogicalPosition, Manager, PhysicalPosition};
use enigo::*;
use window_shadows::set_shadow;

pub const MAIN_WIN_NAME: &str = "main";
pub const ACTION_MANAGER_WIN_NAME: &str = "action_manager";
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

    let always_on_top = ALWAYS_ON_TOP.load(Ordering::Acquire);

    if !always_on_top {
        window.set_always_on_top(true).unwrap();
        ALWAYS_ON_TOP.store(true, Ordering::Release);
    } else {
        window.set_always_on_top(false).unwrap();
        ALWAYS_ON_TOP.store(false, Ordering::Release);
    }
    ALWAYS_ON_TOP.load(Ordering::Acquire)
}

#[tauri::command]
pub fn get_main_window_always_on_top() -> bool {
    ALWAYS_ON_TOP.load(Ordering::Acquire)
}

#[tauri::command]
pub fn show_main_window_with_selected_text() {
    let mut window = show_main_window(false, false);
    let mut enigo = Enigo::new();
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
        selected_text = match utils::get_selected_text() {
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
        window = show_main_window(true, false);
    }

    window.set_focus().unwrap();
    utils::show();
}

pub fn delete_thumb() {
    match APP_HANDLE.get() {
        Some(handle) => match handle.get_window(THUMB_WIN_NAME) {
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
        Some(handle) => match handle.get_window(THUMB_WIN_NAME) {
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
    match APP_HANDLE.get() {
        Some(handle) => {
            let position_offset = 7.0 as f64;
            match handle.get_window(THUMB_WIN_NAME) {
                Some(window) => {
                    println!("Thumb window already exists");
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
                    window.unminimize().unwrap();
                    window.show().unwrap();
                    window.set_always_on_top(true).unwrap();
                }
                None => {
                    println!("Thumb window does not exist");
                    let builder = tauri::WindowBuilder::new(
                        handle,
                        THUMB_WIN_NAME,
                        tauri::WindowUrl::App("src/tauri/thumb.html".into()),
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

                    #[cfg(target_os = "macos")]
                    set_shadow(&window, true).unwrap();

                    window.unminimize().unwrap();
                    window.show().unwrap();
                    window.set_always_on_top(true).unwrap();
                }
            }
        }
        None => {}
    }
}

pub fn show_main_window(center: bool, set_focus: bool) -> tauri::Window {
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
                let (mouse_logical_x, mouse_logical_y): (i32, i32) = get_mouse_location().unwrap();
                let window_physical_size = window.outer_size().unwrap();
                let scale_factor = window.scale_factor().unwrap_or(1.0);
                let mut mouse_physical_position = PhysicalPosition::new(mouse_logical_x, mouse_logical_y);
                if cfg!(target_os = "macos") {
                    mouse_physical_position =
                        LogicalPosition::new(mouse_logical_x as f64, mouse_logical_y as f64).to_physical(scale_factor);
                }

                let current_monitor = window.available_monitors().and_then(|monitors| {
                    Ok(monitors
                        .iter()
                        .find(|monitor| {
                            let monitor_physical_size = monitor.size();
                            let monitor_physical_position = monitor.position();
                            mouse_physical_position.x >= monitor_physical_position.x
                                && mouse_physical_position.x <= monitor_physical_position.x + (monitor_physical_size.width as i32)
                                && mouse_physical_position.y >= monitor_physical_position.y
                                && mouse_physical_position.y <= monitor_physical_position.y + (monitor_physical_size.height as i32)
                        })
                        .cloned())
                }).unwrap_or_else(|_| window.current_monitor().unwrap()).unwrap();

                let monitor_physical_size = current_monitor.size();
                let monitor_physical_position = current_monitor.position();

                let mut window_physical_position = mouse_physical_position;
                if mouse_physical_position.x + (window_physical_size.width as i32) > monitor_physical_position.x + (monitor_physical_size.width as i32) {
                    window_physical_position.x = monitor_physical_position.x + (monitor_physical_size.width as i32) - (window_physical_size.width as i32);
                }
                if mouse_physical_position.y + (window_physical_size.height as i32) > monitor_physical_position.y + (monitor_physical_size.height as i32) {
                    window_physical_position.y = monitor_physical_position.y + (monitor_physical_size.height as i32) - (window_physical_size.height as i32);
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
            } else {
                if !cfg!(target_os = "macos") {
                    window.unminimize().unwrap();
                }
                window.center().unwrap();
            }
            window.unminimize().unwrap();
            if set_focus {
                window.set_focus().unwrap();
            }
            window.show().unwrap();
            window
        }
        None => {
            let builder = tauri::WindowBuilder::new(
                handle,
                MAIN_WIN_NAME,
                tauri::WindowUrl::App("src/tauri/index.html".into()),
            )
            .fullscreen(false)
            .inner_size(620.0, 700.0)
            .min_inner_size(540.0, 600.0)
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

#[tauri::command]
pub fn show_action_manager_window() {
    let handle = APP_HANDLE.get().unwrap();
    match handle.get_window(ACTION_MANAGER_WIN_NAME) {
        Some(window) => {
            window.unminimize().unwrap();
            window.center().unwrap();
            window.set_focus().unwrap();
            window.show().unwrap();
        }
        None => {
            let builder = tauri::WindowBuilder::new(
                handle,
                ACTION_MANAGER_WIN_NAME,
                tauri::WindowUrl::App("src/tauri/action_manager.html".into()),
            )
            .fullscreen(false)
            .inner_size(700.0, 700.0)
            .min_inner_size(660.0, 600.0)
            .resizable(true)
            .skip_taskbar(true)
            .center()
            .focused(true)
            .title("OpenAI Translator Action Manager");

            #[cfg(target_os = "macos")]
            {
                builder
                    .hidden_title(true)
                    .title_bar_style(tauri::TitleBarStyle::Overlay)
                    .build()
                    .unwrap();
            }

            #[cfg(target_os = "windows")]
            {
                let window = builder.decorations(false).build().unwrap();
                window.set_always_on_top(true).unwrap();

                set_shadow(&window, true).unwrap();
            }

            #[cfg(target_os = "linux")]
            {
                let window = builder.decorations(false).build().unwrap();
                window.set_always_on_top(true).unwrap();

                set_shadow(&window, true).unwrap();
            }
        }
    }
}
