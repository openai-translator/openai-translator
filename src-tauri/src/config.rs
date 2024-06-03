use parking_lot::Mutex;
use tauri::Manager;
use tauri::{path::BaseDirectory, AppHandle};

use serde::{Deserialize, Serialize};

use crate::APP_HANDLE;

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone, specta::Type, tauri_specta::Event)]
pub struct ConfigUpdatedEvent;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ProxyProtocol {
    HTTP,
    HTTPS,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BasicAuth {
    pub username: Option<String>,
    pub password: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProxyConfig {
    pub enabled: Option<bool>,
    pub protocol: Option<ProxyProtocol>,
    pub server: Option<String>,
    pub port: Option<String>,
    pub basic_auth: Option<BasicAuth>,
    pub no_proxy: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    pub hotkey: Option<String>,
    pub display_window_hotkey: Option<String>,
    pub ocr_hotkey: Option<String>,
    pub writing_hotkey: Option<String>,
    pub writing_newline_hotkey: Option<String>,
    pub restore_previous_position: Option<bool>,
    pub always_show_icons: Option<bool>,
    pub allow_using_clipboard_when_selected_text_not_available: Option<bool>,
    pub automatic_check_for_updates: Option<bool>,
    pub hide_the_icon_in_the_dock: Option<bool>,
    pub proxy: Option<ProxyConfig>,
}

static CONFIG_CACHE: Mutex<Option<Config>> = Mutex::new(None);

pub fn get_config() -> Result<Config, Box<dyn std::error::Error>> {
    let app_handle = APP_HANDLE.get().unwrap();
    get_config_by_app(app_handle)
}

pub fn get_config_by_app(app: &AppHandle) -> Result<Config, Box<dyn std::error::Error>> {
    let conf = _get_config_by_app(app);
    match conf {
        Ok(conf) => Ok(conf),
        Err(e) => {
            println!("get config failed: {}", e);
            Err(e)
        }
    }
}

pub fn _get_config_by_app(app: &AppHandle) -> Result<Config, Box<dyn std::error::Error>> {
    if let Some(config_cache) = &*CONFIG_CACHE.lock() {
        return Ok(config_cache.clone());
    }
    let config_content = get_config_content_by_app(app)?;
    let config: Config = serde_json::from_str(&config_content)?;
    CONFIG_CACHE.lock().replace(config.clone());
    Ok(config)
}

#[tauri::command]
#[specta::specta]
pub fn clear_config_cache() {
    CONFIG_CACHE.lock().take();
}

#[tauri::command]
#[specta::specta]
pub fn get_config_content() -> String {
    if let Some(app) = APP_HANDLE.get() {
        return get_config_content_by_app(app).unwrap();
    } else {
        return "{}".to_string();
    }
}

pub fn get_config_content_by_app(app: &AppHandle) -> Result<String, String> {
    let app_config_dir = app
        .path()
        .resolve("xyz.yetone.apps.openai-translator", BaseDirectory::Config)
        .unwrap();
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
}
