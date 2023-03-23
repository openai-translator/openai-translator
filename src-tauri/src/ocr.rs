#[cfg(not(target_os = "macos"))]
pub fn do_ocr() -> Result<(), Box<dyn std::error::Error>> {
    Ok(())
}

#[cfg(target_os = "macos")]
pub fn do_ocr() -> Result<(), Box<dyn std::error::Error>> {
    use crate::{APP_HANDLE, CPU_VENDOR};

    let mut rel_path = "resources/bin/ocr_intel".to_string();
    if *CPU_VENDOR.lock() == "Apple" {
        rel_path = "resources/bin/ocr_apple".to_string();
    }

    let bin_path = APP_HANDLE
        .get()
        .unwrap()
        .path_resolver()
        .resolve_resource(rel_path)
        .expect("failed to resolve ocr binary resource");

    let output = std::process::Command::new(bin_path)
        .args(["-l", "zh"])
        .output()
        .expect("failed to execute ocr binary");

    // check exit code
    if output.status.success() {
        // get output content
        let content = String::from_utf8(output.stdout).expect("failed to parse ocr binary output");
        crate::utils::send_text(content);
        crate::windows::show_main_window(false);
        Ok(())
    } else {
        Err("ocr binary failed".into())
    }
}

#[tauri::command]
pub fn ocr() {
    do_ocr().unwrap();
}
