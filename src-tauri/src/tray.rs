use std::sync::atomic::Ordering;

use crate::ALWAYS_ON_TOP;
use crate::config::get_config;
use crate::ocr::ocr;
use crate::windows::{set_main_window_always_on_top, MAIN_WIN_NAME};

use tauri::{
    Icon,
    menu::{Menu, MenuItem},
    tray::{ClickType, TrayIconBuilder},
    Manager, Runtime,
};

pub fn create_tray<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<()> {
    let config = get_config().unwrap();
    let mut ocr_text = String::from("OCR");
    if let Some(ocr_hotkey) = config.ocr_hotkey {
        ocr_text = format!("OCR ({})", ocr_hotkey);
    }
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
            &ocr_i,
            &show_i,
            &hide_i,
            &pin_i,
            &quit_i,
        ],
    )?;

    let _ = TrayIconBuilder::with_id("tray")
        .tooltip("OpenAI Translator")
        .icon(Icon::File("./icons/favicon.ico".into()))
        .menu(&menu)
        .menu_on_left_click(false)
        .on_menu_event(move |app, event| match event.id.as_ref() {
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
                let text = pin_i.text().unwrap();
                if text == "Pin" {
                    pin_i.set_text("Unpin").unwrap();
                } else {
                    pin_i.set_text("Pin").unwrap();
                }
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if event.click_type == ClickType::Left {
                let app = tray.app_handle();
                if let Some(window) = app.get_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app);

    Ok(())
}

