use parking_lot::Mutex;
use tauri::api::path::config_dir;

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    pub hotkey: Option<String>,
    pub ocr_hotkey: Option<String>,
    pub writing_hotkey: Option<String>,
    pub writing_newline_hotkey: Option<String>,
    pub restore_previous_position: Option<bool>,
    pub always_show_icons: Option<bool>,
    pub allow_using_clipboard_when_selected_text_not_available: Option<bool>,
}

static CONFIG_CACHE: Mutex<Option<Config>> = Mutex::new(None);

pub fn get_config() -> Result<Config, Box<dyn std::error::Error>> {
    if let Some(config_cache) = &*CONFIG_CACHE.lock() {
        return Ok(config_cache.clone());
    }
    let config_content = get_config_content()?;
    let config: Config = serde_json::from_str(&config_content)?;
    CONFIG_CACHE.lock().replace(config.clone());
    Ok(config)
}

#[tauri::command]
pub fn clear_config_cache() {
    CONFIG_CACHE.lock().take();
}

#[tauri::command]
pub fn get_config_content() -> Result<String, String> {
    if let Some(config_dir) = config_dir() {
        let app_config_dir = config_dir.join("xyz.yetone.apps.openai-translator");
        if !app_config_dir.exists() {
            std::fs::create_dir_all(&app_config_dir).unwrap();
        }
        let config_path = app_config_dir.join("config.json");
        if config_path.exists() {
            match std::fs::read_to_string(config_path) {
                Ok(content) => Ok(content),
                Err(_) => Err("Failed to read config file".to_string()),
            }
        } else {
            std::fs::write(config_path, "{}").unwrap();
            Ok("{}".to_string())
        }
    } else {
        Err("Config directory not found".to_string())
    }
}
