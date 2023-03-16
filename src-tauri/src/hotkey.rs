use crate::config::get_config;
use crate::windows::show_main_window_with_selected_text;
use crate::APP_HANDLE;
use tauri::GlobalShortcutManager;

#[allow(unused, dead_code)]
pub fn do_bind_hotkey() -> Result<(), Box<dyn std::error::Error>> {
    let config = get_config()?;
    let handle = APP_HANDLE.get().ok_or("can't get app handle")?;
    if let Some(hotkey) = config.hotkey {
        if !handle.global_shortcut_manager().is_registered(&hotkey)? {
            handle.global_shortcut_manager().unregister(&hotkey)?;
        }
        handle
            .global_shortcut_manager()
            .register(hotkey.as_str(), show_main_window_with_selected_text)?;
    }
    Ok(())
}

#[allow(unused, dead_code)]
#[tauri::command]
pub fn bind_hotkey() -> Result<(), String> {
    do_bind_hotkey().map_err(|e| e.to_string())
}
