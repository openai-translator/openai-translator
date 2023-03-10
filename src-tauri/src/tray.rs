use tauri::Manager;
use tauri::{AppHandle, SystemTrayEvent, SystemTray, CustomMenuItem, SystemTrayMenu, SystemTrayMenuItem};

pub fn menu() -> SystemTray {
    let show: CustomMenuItem = CustomMenuItem::new("show".to_string(), "Show");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");

    let tray_menu = SystemTrayMenu::new()
    .add_item(show)
    .add_item(hide)
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(quit);

    SystemTray::new().with_menu(tray_menu).with_menu_on_left_click(false)
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
        SystemTrayEvent::MenuItemClick { id, .. } => {
            match id.as_str() {
                "show" => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                },
                "hide" => {
                    let window = app.get_window("main").unwrap();
                    window.hide().unwrap();
                },
                "quit" => app.exit(0),
                _ => {}
            }
        }
        _ => {}
    }
}
