use parking_lot::Mutex;
use std::{thread, time::Duration};
use enigo::*;

static SELECT_ALL: Mutex<()> = Mutex::new(());

#[allow(dead_code)]
#[cfg(target_os = "windows")]
pub fn select_all(enigo: &mut Enigo) {
    let _guard = SELECT_ALL.lock();

    crate::utils::up_control_keys(enigo);

    enigo.key_down(Key::Control);
    enigo.key_click(Key::Layout('a'));
    enigo.key_up(Key::Control);
}

#[allow(dead_code)]
#[cfg(target_os = "macos")]
pub fn select_all(enigo: &mut Enigo) {
    use crate::APP_HANDLE;

    let apple_script = APP_HANDLE
        .get()
        .unwrap()
        .path_resolver()
        .resolve_resource("resources/select-all.applescript")
        .expect("failed to resolve select-all.applescript");

    std::process::Command::new("osascript").arg(apple_script).spawn().expect("failed to run applescript").wait().expect("failed to wait");
}

#[allow(dead_code)]
#[cfg(target_os = "linux")]
pub fn select_all(enigo: &mut Enigo) {
    let _guard = SELECT_ALL.lock();

    crate::utils::up_control_keys(enigo);

    enigo.key_down(Key::Control);
    enigo.key_click(Key::Layout('a'));
    enigo.key_up(Key::Control);
}

static INPUT_LOCK: Mutex<()> = Mutex::new(());

pub fn double_backspace_click(enigo: &mut Enigo) {
    let _guard = INPUT_LOCK.lock();

    crate::utils::up_control_keys(enigo);

    enigo.key_click(Key::Backspace);
    enigo.key_click(Key::Backspace);
}

pub fn double_left_click(enigo: &mut Enigo) {
    let _guard = INPUT_LOCK.lock();

    crate::utils::up_control_keys(enigo);

    enigo.key_click(Key::LeftArrow);
    enigo.key_click(Key::LeftArrow);
}

pub fn double_right_click(enigo: &mut Enigo) {
    let _guard = INPUT_LOCK.lock();

    crate::utils::up_control_keys(enigo);

    enigo.key_click(Key::RightArrow);
    enigo.key_click(Key::RightArrow);
}

pub fn get_input_text(enigo: &mut Enigo) -> Result<String, Box<dyn std::error::Error>> {
    select_all(enigo);
    return crate::utils::get_selected_text_by_clipboard(enigo);
}

#[tauri::command]
pub fn writing() {
    let mut enigo = Enigo::new();
    let content = get_input_text(&mut enigo).unwrap_or_default();
    do_write_to_input(&mut enigo, "Translating... ✍️".to_string(), false);
    crate::utils::writing_text(content);
}

static START_WRITING: Mutex<bool> = Mutex::new(false);

fn do_write_to_input(enigo: &mut Enigo, text: String, animation: bool) {
    let _guard = INPUT_LOCK.lock();
    if animation {
        for c in text.chars() {
            let char = c.to_string();
            if char == "\n" {
                if let Ok(config) = crate::config::get_config() {
                    if let Some(writing_newline_hotkey) = config.writing_newline_hotkey {
                        let keys = writing_newline_hotkey.split("+").map(|c| c.trim()).collect::<Vec<&str>>();
                        for key in &keys {
                            if key.len() == 1 {
                                enigo.key_down(Key::Layout(key.chars().next().unwrap()));
                            } else {
                                match *key {
                                    "ctrl" => enigo.key_down(Key::Control),
                                    "alt" => enigo.key_down(Key::Alt),
                                    "shift" => enigo.key_down(Key::Shift),
                                    "meta" => enigo.key_down(Key::Meta),
                                    "caps_lock" => enigo.key_down(Key::CapsLock),
                                    "escape" => enigo.key_down(Key::Escape),
                                    "enter" => enigo.key_down(Key::Return),
                                    _ => {}
                                }
                            }
                        }
                        for key in keys.iter().rev() {
                            if key.len() == 1 {
                                enigo.key_up(Key::Layout(key.chars().next().unwrap()));
                            } else {
                                match *key {
                                    "ctrl" => enigo.key_up(Key::Control),
                                    "alt" => enigo.key_up(Key::Alt),
                                    "shift" => enigo.key_up(Key::Shift),
                                    "meta" => enigo.key_up(Key::Meta),
                                    "caps_lock" => enigo.key_up(Key::CapsLock),
                                    "escape" => enigo.key_up(Key::Escape),
                                    "enter" => enigo.key_up(Key::Return),
                                    _ => {}
                                }
                            }
                        }
                        continue;
                    }
                }
            }
            enigo.key_sequence(&char);
            thread::sleep(Duration::from_millis(20));
        }
    } else {
        enigo.key_sequence(&text);
    }
}

#[tauri::command]
pub fn write_to_input(text: String) {
    let mut start_writing = START_WRITING.lock();
    let mut enigo = Enigo::new();
    let is_first_writing = !*start_writing;
    if is_first_writing {
        select_all(&mut enigo);
        thread::sleep(Duration::from_millis(50));
    }
    *start_writing = true;
    do_write_to_input(&mut enigo, text, true);
}

#[tauri::command]
pub fn finish_writing() {
    let mut start_writing = START_WRITING.lock();
    let mut enigo = Enigo::new();
    *start_writing = false;

    do_write_to_input(&mut enigo, " ✅".to_string(), true);
    thread::sleep(Duration::from_millis(300));

    double_backspace_click(&mut enigo);
    thread::sleep(Duration::from_millis(50));
}
