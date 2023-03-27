use whatlang::detect;

#[tauri::command]
pub fn detect_lang(text: String) -> String {
    match detect(&text) {
        Some(info) => info.lang().to_string(),
        None => "".to_string(),
    }
}
