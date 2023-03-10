use tauri::api::path::config_dir;

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
