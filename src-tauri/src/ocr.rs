use debug_print::debug_println;
#[cfg(target_os = "windows")]
use std::path::Path;
use tauri::path::BaseDirectory;
use tauri::Manager;

#[tauri::command(async)]
#[specta::specta]
pub fn cut_image(left: u32, top: u32, width: u32, height: u32) {
    use image::GenericImage;
    let app_handle = crate::APP_HANDLE.get().unwrap();
    let image_dir = app_handle
        .path()
        .resolve("ocr_images", BaseDirectory::AppCache)
        .unwrap();
    let image_file_path = image_dir.join("fullscreen.png");
    if !image_file_path.exists() {
        return;
    }
    let mut img = match image::open(&image_file_path) {
        Ok(v) => v,
        Err(e) => {
            eprintln!("error: {}", e);
            return;
        }
    };
    let img2 = img.sub_image(left, top, width, height);
    let new_image_file_path = image_dir.join("cut.png");
    match img2.to_image().save(&new_image_file_path) {
        Ok(_) => {}
        Err(e) => {
            eprintln!("{:?}", e.to_string());
            return;
        }
    }
}

#[tauri::command]
#[specta::specta]
pub fn screenshot(x: i32, y: i32) {
    use screenshots::{Compression, Screen};
    use std::fs;

    let screens = Screen::all().unwrap();
    for screen in screens {
        let info = screen.display_info;
        if info.x == x && info.y == y {
            let app_handle = crate::APP_HANDLE.get().unwrap();
            let image_dir = app_handle
                .path()
                .resolve("ocr_images", BaseDirectory::AppCache)
                .unwrap();
            if !image_dir.exists() {
                std::fs::create_dir_all(&image_dir).unwrap();
            }
            let image_file_path = image_dir.join("fullscreen.png");
            let image = screen.capture().unwrap();
            let buffer = image.to_png(Compression::Fast).unwrap();
            debug_println!("image_file_path: {:?}", image_file_path);
            fs::write(image_file_path, buffer).unwrap();
            break;
        }
    }
}

#[cfg(target_os = "linux")]
pub fn do_ocr() -> Result<(), Box<dyn std::error::Error>> {
    Ok(())
}

#[cfg(target_os = "windows")]
pub fn do_ocr() -> Result<(), Box<dyn std::error::Error>> {
    use crate::windows::show_screenshot_window;
    show_screenshot_window();
    Ok(())
}

#[cfg(target_os = "windows")]
pub fn do_ocr_with_cut_file_path(image_file_path: &Path) {
    use windows::core::HSTRING;
    use windows::Globalization::Language;
    use windows::Graphics::Imaging::BitmapDecoder;
    use windows::Media::Ocr::OcrEngine;
    use windows::Storage::{FileAccessMode, StorageFile};

    let path = image_file_path.to_string_lossy().replace("\\\\?\\", "");
    debug_println!("ocr image file path: {:?}", path);

    let file = StorageFile::GetFileFromPathAsync(&HSTRING::from(path))
        .unwrap()
        .get()
        .unwrap();

    let bitmap = BitmapDecoder::CreateWithIdAsync(
        BitmapDecoder::PngDecoderId().unwrap(),
        &file.OpenAsync(FileAccessMode::Read).unwrap().get().unwrap(),
    )
    .unwrap()
    .get()
    .unwrap();

    let bitmap = bitmap.GetSoftwareBitmapAsync().unwrap().get().unwrap();

    let engine = OcrEngine::TryCreateFromUserProfileLanguages();

    match engine {
        Ok(engine) => {
            let result = engine.RecognizeAsync(&bitmap).unwrap().get().unwrap();

            let mut content = String::new();
            for line in result.Lines().unwrap() {
                content.push_str(&line.Text().unwrap().to_string_lossy().trim());
                content.push('\n');
            }

            debug_println!("ocr content: {:?}", content);
            crate::utils::send_text(content);
            crate::windows::show_translator_window(false, true, true);
        }
        Err(e) => {
            debug_println!("ocr error: {:?}", e);
            if e.to_string().contains("0x00000000") {
                eprintln!("{}", "Language package not installed!\n\nSee: https://learn.microsoft.com/zh-cn/windows/powertoys/text-extractor#supported-languages".to_string());
            } else {
                eprintln!("{}", e.to_string());
            }
        }
    }
}

#[cfg(target_os = "macos")]
pub fn do_ocr() -> Result<(), Box<dyn std::error::Error>> {
    use crate::{APP_HANDLE, CPU_VENDOR};

    let mut rel_path = "resources/bin/ocr_intel".to_string();
    if *CPU_VENDOR.lock() == "Apple" {
        rel_path = "resources/bin/ocr_apple".to_string();
    }

    let app = APP_HANDLE.get().unwrap();

    let bin_path = app
        .path()
        .resolve(rel_path, BaseDirectory::Resource)
        .expect("failed to resolve ocr binary resource");

    let output = std::process::Command::new(bin_path)
        .args(["-l", "zh"])
        .output()
        .expect("failed to execute ocr binary");

    // check exit code
    if output.status.success() {
        // get output content
        let content = String::from_utf8_lossy(&output.stdout);
        crate::utils::send_text(content.to_string());
        crate::windows::show_translator_window(false, true, true);
        Ok(())
    } else {
        Err("ocr binary failed".into())
    }
}

#[tauri::command(async)]
#[specta::specta]
pub fn start_ocr() {
    ocr();
}

pub fn ocr() {
    do_ocr().unwrap();
}

#[tauri::command(async)]
#[specta::specta]
pub fn finish_ocr() {
    do_finish_ocr();
}

#[cfg(target_os = "windows")]
fn do_finish_ocr() {
    let app_handle = crate::APP_HANDLE.get().unwrap();
    let image_dir = app_handle
        .path()
        .resolve("ocr_images", BaseDirectory::AppCache)
        .unwrap();
    let image_file_path = image_dir.join("cut.png");
    do_ocr_with_cut_file_path(&image_file_path);
}

#[cfg(target_os = "linux")]
fn do_finish_ocr() {}

#[cfg(target_os = "macos")]
fn do_finish_ocr() {}
