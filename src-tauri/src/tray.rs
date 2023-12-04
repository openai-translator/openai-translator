use std::sync::atomic::Ordering;

use crate::ALWAYS_ON_TOP;
use crate::config::get_config;
use crate::ocr::ocr;
use crate::windows::{set_main_window_always_on_top, MAIN_WIN_NAME, show_settings_window, show_updater_window};

use tauri::{
    menu::{Menu, MenuItem},
    tray::ClickType,
    Manager, Runtime,
};

pub fn create_tray<R: Runtime>(app: &tauri::AppHandle<R>, has_updates: bool) -> tauri::Result<()> {
    let config = get_config().unwrap();
    let mut ocr_text = String::from("OCR");
    if let Some(ocr_hotkey) = config.ocr_hotkey {
        ocr_text = format!("OCR ({})", ocr_hotkey);
    }
    let check_for_updates_i = MenuItem::with_id(app, "check_for_updates", "Check for Updates...", true, None);
    if has_updates {
        check_for_updates_i.set_text("💡 New version available!").unwrap();
    }
    let settings_i = MenuItem::with_id(app, "settings", "Settings", true, None);
    let ocr_i = MenuItem::with_id(app, "ocr", ocr_text, true, None);
    let show_i = MenuItem::with_id(app, "show", "Show", true, None);
    let hide_i = MenuItem::with_id(app, "hide", "Hide", true, None);
    let pin_i = MenuItem::with_id(app, "pin", "Pin", true, None);
    if ALWAYS_ON_TOP.load(Ordering::Acquire) {
        pin_i.set_text("Unpin").unwrap();
    }
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None);
    let menu = Menu::with_items(
        app,
        &[
            &check_for_updates_i,
            &settings_i,
            &ocr_i,
            &show_i,
            &hide_i,
            &pin_i,
            &quit_i,
        ],
    )?;

    let tray = app.tray().unwrap();
    tray.set_menu(Some(menu.clone()))?;
    tray.on_menu_event(move |app, event| match event.id.as_ref() {
        "check_for_updates" => {
            show_updater_window();
        }
        "settings" => {
            show_settings_window();
        }
        "ocr" => {
            ocr();
        }
        "show" => {
            let window = app.get_window(MAIN_WIN_NAME).unwrap();
            window.set_focus().unwrap();
            window.unminimize().unwrap();
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
            let text = pin_i.text().unwrap();
            if text == "Pin" {
                pin_i.set_text("Unpin").unwrap();
            } else {
                pin_i.set_text("Pin").unwrap();
            }
        }
        "quit" => app.exit(0),
        _ => {}
    });
    tray.on_tray_icon_event(|tray, event| {
        if event.click_type == ClickType::Left {
            let app = tray.app_handle();
            if let Some(window) = app.get_window(MAIN_WIN_NAME) {
                window.unminimize().unwrap();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
    });
    tray.set_show_menu_on_left_click(false)?;

    Ok(())
}

