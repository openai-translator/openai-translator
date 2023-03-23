use cld2::{detect_language, Format};

#[tauri::command]
pub fn detect_lang(text: String) -> String {
    match detect_language(&text, Format::Text) {
        (Some(info), _) => {
            info.0.to_string()
        },
        (None, _) => "".to_string(),
    }
}
