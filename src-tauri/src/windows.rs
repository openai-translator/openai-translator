use crate::utils;
use crate::APP_HANDLE;
use tauri::{Manager, LogicalPosition, PhysicalPosition};
#[cfg(target_os = "windows")]
use window_shadows::set_shadow;
#[cfg(target_os = "linux")]
use window_shadows::set_shadow;

pub const MAIN_WIN_NAME: &str = "main";

#[cfg(target_os = "linux")]
fn get_mouse_location() -> Result<(i32, i32), String> {
    use std::process::Command;
    let output: String = match Command::new("xdotool").arg("getmouselocation").output() {
        Ok(v) => String::from_utf8(v.stdout).unwrap(),
        Err(e) => return Err(format!("xsel failed: {}", e.to_string())),
    };
    let output: Vec<&str> = output.split_whitespace().collect();
    let x = output
        .get(0)
        .unwrap()
        .replace("x:", "")
        .parse::<i32>()
        .unwrap();
    let y = output
        .get(1)
        .unwrap()
        .replace("y:", "")
        .parse::<i32>()
        .unwrap();
    return Ok((x, y));
}

#[cfg(target_os = "windows")]
fn get_mouse_location() -> Result<(i32, i32), String> {
    use windows::Win32::Foundation::POINT;
    use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;
    let mut point = POINT { x: 0, y: 0 };
    unsafe {
        if GetCursorPos(&mut point).as_bool() {
            return Ok((point.x, point.y));
        } else {
            return Err("error".to_string());
        }
    }
}

#[cfg(target_os = "macos")]
fn get_mouse_location() -> Result<(i32, i32), String> {
    use device_query::{DeviceQuery, DeviceState, MouseState};
    let device_state = DeviceState::new();
    let mouse: MouseState = device_state.get_mouse();
    Ok(mouse.coords)
}

#[tauri::command]
pub fn show_main_window_with_selected_text() {
    let selected_text = utils::get_selected_text().unwrap_or_default();
    show_main_window();
    if !selected_text.is_empty() {
        utils::send_text(selected_text);
    }
}

#[tauri::command]
pub fn show_main_window() {
    let (x, y): (i32, i32) = get_mouse_location().unwrap();
    let handle = APP_HANDLE.get().unwrap();
    match handle.get_window(MAIN_WIN_NAME) {
        Some(window) => {
            if cfg!(target_os = "macos") {
                window
                    .set_position(LogicalPosition::new(x as f64, y as f64))
                    .unwrap();
            } else {
                window
                    .set_position(PhysicalPosition::new(x as f64, y as f64))
                    .unwrap();
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
            .title("Traductor OpenAI");

            if cfg!(target_os = "windows") || cfg!(target_os = "linux") {
            } else {
            }

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
