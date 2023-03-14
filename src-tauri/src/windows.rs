use crate::ALWAYS_ON_TOP;
use crate::utils;
use crate::APP_HANDLE;
use tauri::{LogicalPosition, Manager, PhysicalPosition};
#[cfg(target_os = "windows")]
use window_shadows::set_shadow;
#[cfg(target_os = "linux")]
use window_shadows::set_shadow;
use mouse_position::mouse_position::Mouse;

pub const MAIN_WIN_NAME: &str = "main";

fn get_mouse_location() -> Result<(i32, i32), String> {
    let position = Mouse::get_mouse_position();
    match position {
        Mouse::Position { x, y } => Ok((x, y)),
        Mouse::Error => Err("Error getting mouse position".to_string()),
   }
}

#[tauri::command]
pub fn set_main_window_always_on_top() -> bool  {
    let handle = APP_HANDLE.get().unwrap();
    let window = handle.get_window(MAIN_WIN_NAME).unwrap();
    let item = handle.tray_handle().get_item("pin");
    unsafe {
        if !ALWAYS_ON_TOP {
            window.set_always_on_top(true).unwrap();
            ALWAYS_ON_TOP = true;
            item.set_selected(true).unwrap();
        } else {
            window.set_always_on_top(false).unwrap();
            ALWAYS_ON_TOP = false;
            item.set_selected(false).unwrap();
        }
        ALWAYS_ON_TOP
    }
}

#[tauri::command]
pub fn get_main_window_always_on_top() -> bool {
    unsafe {
        crate::ALWAYS_ON_TOP
    }
}

#[tauri::command]
pub fn show_main_window_with_selected_text() {
    let selected_text = match utils::get_selected_text() {
        Ok(text) => text,
        Err(e) => {
            eprintln!("Error getting selected text: {}", e);
            "".to_string()
        }
    };
    if !selected_text.is_empty() {
        show_main_window(false);
        utils::send_text(selected_text);
    } else {
        show_main_window(true);
    }
}

pub fn show_main_window(center: bool) {
    let handle = APP_HANDLE.get().unwrap();
    match handle.get_window(MAIN_WIN_NAME) {
        Some(window) => {
            if !center {
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
            window.set_focus().unwrap();
            window.show().unwrap();
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
            .focused(true)
            .title("OpenAI Translator");

            #[cfg(target_os = "macos")]
            {
                builder
                    .title_bar_style(tauri::TitleBarStyle::Overlay)
                    .hidden_title(true)
                    .build()
                    .unwrap();
            }

            #[cfg(target_os = "windows")]
            {
                let window = builder.decorations(false).build().unwrap();

                set_shadow(&window, true).unwrap();
            }

            #[cfg(target_os = "linux")]
            {
                let window = builder.decorations(false).build().unwrap();

                set_shadow(&window, true).unwrap();
            }
        }
    }
}
