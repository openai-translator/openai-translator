use tauri::Manager;
use tauri::{
    AppHandle, CustomMenuItem, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
};

pub fn menu() -> SystemTray {
    let show: CustomMenuItem = CustomMenuItem::new("show".to_string(), "Show");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    let pin: CustomMenuItem = CustomMenuItem::new("pin".to_string(), "Pin");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");

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
        SystemTray::new()
            .with_menu(tray_menu)
    }

}

pub fn handler(app: &AppHandle, event: SystemTrayEvent) {
    static mut ALWAYS_ON_TOP: bool = false;

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
                let window = app.get_window("main").unwrap();
                unsafe {
                    if !ALWAYS_ON_TOP {
                        window.set_always_on_top(true).unwrap();
                        ALWAYS_ON_TOP = true;
                    } else {
                        window.set_always_on_top(false).unwrap();
                        ALWAYS_ON_TOP = false;
                    }
                }
            }
            "quit" => app.exit(0),
            _ => {}
        },
        _ => {}
    }
}
