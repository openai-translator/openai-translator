use tauri::Manager;
use tauri::{
    AppHandle, CustomMenuItem, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
};

use crate::windows::set_main_window_always_on_top;
use crate::ALWAYS_ON_TOP;

pub fn menu() -> SystemTray {
    let show: CustomMenuItem = CustomMenuItem::new("show".to_string(), "Show");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    let mut pin: CustomMenuItem = CustomMenuItem::new("pin".to_string(), "Pin");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    unsafe {
        pin.selected = ALWAYS_ON_TOP;
    }
    let tray_menu = SystemTrayMenu::new()
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
            let window = app.get_window("main").unwrap();
            window.show().unwrap();
        }
        SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
            "show" => {
                let window = app.get_window("main").unwrap();
                window.show().unwrap();
            }
            "hide" => {
                let window = app.get_window("main").unwrap();
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
