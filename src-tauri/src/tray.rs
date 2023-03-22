use tauri::Manager;
use tauri::{
    AppHandle, CustomMenuItem, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
};

use crate::ALWAYS_ON_TOP;
use crate::config::get_config;
use crate::windows::{set_main_window_always_on_top, MAIN_WIN_NAME};
use crate::ocr::ocr;
use std::sync::atomic::Ordering;

pub fn menu() -> SystemTray {
    let config = get_config().unwrap();
    let mut ocr_text = String::from("OCR");
    if let Some(ocr_hotkey) = config.ocr_hotkey {
        ocr_text = format!("OCR ({})", ocr_hotkey);
    }
    let ocr: CustomMenuItem = CustomMenuItem::new("ocr".to_string(), ocr_text);
    let show: CustomMenuItem = CustomMenuItem::new("show".to_string(), "Show");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    let mut pin: CustomMenuItem = CustomMenuItem::new("pin".to_string(), "Pin");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    pin.selected = ALWAYS_ON_TOP.load(Ordering::Acquire);
    let tray_menu = SystemTrayMenu::new()
        .add_item(ocr)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(show)
        .add_item(hide)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(pin)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);

    #[cfg(target_os = "macos")]
    {
        SystemTray::new()
            .with_menu(tray_menu)
            .with_menu_on_left_click(false)
    }

    #[cfg(not(target_os = "macos"))]
    {
        SystemTray::new().with_menu(tray_menu)
    }
}

pub fn handler(app: &AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::LeftClick {
            position: _,
            size: _,
            ..
        } => {
            let window = app.get_window(MAIN_WIN_NAME).unwrap();
            window.set_focus().unwrap();
            window.unminimize().unwrap();
            window.show().unwrap();
        }
        SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
            "ocr" => {
                ocr();
            }
            "show" => {
                let window = app.get_window(MAIN_WIN_NAME).unwrap();
                window.set_focus().unwrap();
                window.show().unwrap();
            }
            "hide" => {
                let window = app.get_window(MAIN_WIN_NAME).unwrap();
                window.set_focus().unwrap();
                window.unminimize().unwrap();
                window.hide().unwrap();
            }
            "pin" => {
                set_main_window_always_on_top();
            }
            "quit" => app.exit(0),
            _ => {}
        },
        _ => {}
    }
}
