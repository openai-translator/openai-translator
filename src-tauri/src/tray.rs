use std::sync::atomic::{AtomicBool, Ordering};

use crate::config::get_config;
use crate::ocr::ocr;
use crate::windows::{
    set_translator_window_always_on_top, show_settings_window, show_updater_window,
    TRANSLATOR_WIN_NAME,
};
use crate::{ALWAYS_ON_TOP, UPDATE_RESULT};

use serde::{Deserialize, Serialize};
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::ClickType,
    Manager, Runtime,
};
use tauri_specta::Event;

#[derive(Serialize, Deserialize, Debug, Clone, specta::Type, tauri_specta::Event)]
pub struct PinnedFromTrayEvent {
    pinned: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, specta::Type, tauri_specta::Event)]
pub struct PinnedFromWindowEvent {
    pinned: bool,
}

impl PinnedFromWindowEvent {
    pub fn pinned(&self) -> &bool {
        &self.pinned
    }
}

pub static TRAY_EVENT_REGISTERED: AtomicBool = AtomicBool::new(false);

pub fn create_tray<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<()> {
    let config = get_config().unwrap();
    let check_for_updates_i = MenuItem::with_id(
        app,
        "check_for_updates",
        "Check for Updates...",
        true,
        None::<String>,
    )?;
    if let Some(Some(_)) = *UPDATE_RESULT.lock() {
        check_for_updates_i
            .set_text("💡 New version available!")
            .unwrap();
    }
    let settings_i = MenuItem::with_id(app, "settings", "Settings", true, Some("CmdOrCtrl+,"))?;
    let ocr_i = MenuItem::with_id(app, "ocr", "OCR", true, config.ocr_hotkey)?;
    let show_i = MenuItem::with_id(app, "show", "Show", true, config.display_window_hotkey)?;
    let hide_i = PredefinedMenuItem::hide(app, Some("Hide"))?;
    let pin_i = MenuItem::with_id(app, "pin", "Pin", true, None::<String>)?;
    if ALWAYS_ON_TOP.load(Ordering::Acquire) {
        pin_i.set_text("Unpin").unwrap();
    }
    let quit_i = PredefinedMenuItem::quit(app, Some("Quit"))?;
    let separator_i = PredefinedMenuItem::separator(app)?;
    let menu = Menu::with_items(
        app,
        &[
            &check_for_updates_i,
            &settings_i,
            &ocr_i,
            &show_i,
            &hide_i,
            &pin_i,
            &separator_i,
            &quit_i,
        ],
    )?;

    let tray = app.tray_by_id("tray").unwrap();
    tray.set_menu(Some(menu.clone()))?;
    if TRAY_EVENT_REGISTERED.load(Ordering::Acquire) {
        return Ok(());
    }
    TRAY_EVENT_REGISTERED.store(true, Ordering::Release);
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
            crate::windows::show_translator_window(false, false, true);
        }
        "hide" => {
            if let Some(window) = app.get_webview_window(TRANSLATOR_WIN_NAME) {
                window.set_focus().unwrap();
                window.unminimize().unwrap();
                window.hide().unwrap();
            }
        }
        "pin" => {
            let pinned = set_translator_window_always_on_top();
            let handle = app.app_handle();
            let pinned_from_tray_event = PinnedFromTrayEvent { pinned };
            pinned_from_tray_event.emit(handle).unwrap_or_default();
            create_tray(app).unwrap();
        }
        "quit" => app.exit(0),
        _ => {}
    });
    tray.on_tray_icon_event(|tray, event| {
        if event.click_type == ClickType::Left {
            crate::windows::show_translator_window(false, false, true);
        }
    });
    tray.set_show_menu_on_left_click(false)?;

    Ok(())
}
