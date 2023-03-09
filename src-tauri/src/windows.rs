use enigo::Enigo;
use crate::utils::copy;
use crate::APP_HANDLE;
use tauri::{Manager, PhysicalPosition};

const TRANSLATOR_WIN_NAME: &str = "translator";

pub fn show_translate_window() {
    let (x, y): (i32, i32) = Enigo::mouse_location();
    copy();
    let handle = APP_HANDLE.get().unwrap();
    match handle.get_window(TRANSLATOR_WIN_NAME) {
        Some(window) => {
            window.set_position(PhysicalPosition { x: x as f64, y: y as f64 }).unwrap();
            window.set_focus().unwrap();
            window.show().unwrap();
        }
        None => {
             let mut builder = tauri::WindowBuilder::new(
                handle,
                TRANSLATOR_WIN_NAME,
                tauri::WindowUrl::App("index.html".into()),
            )
            .fullscreen(false)
            .inner_size(600.0, 700.0)
            .min_inner_size(560.0, 600.0)
            .resizable(true)
            .skip_taskbar(true)
            .center()
            .focused(true)
            .title("OpenAI Translator")
            .title_bar_style(tauri::TitleBarStyle::Overlay)
            .hidden_title(true);

             // if is windows or linux
             if cfg!(target_os = "windows") || cfg!(target_os = "linux") {
                 builder = builder.decorations(false)
             }

             let window = builder.build().unwrap();

             #[cfg(target_os = "windows")]
             set_shadow(&window, true).unwrap();

             #[cfg(target_os = "linux")]
             set_shadow(&window, true).unwrap();
        }
    }
}
