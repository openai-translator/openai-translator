#[cfg(target_os = "macos")]
use accessibility_sys_ng::{kAXErrorSuccess, AXError};
#[cfg(target_os = "macos")]
use core_graphics::geometry::CGRect;
use enigo::*;
use parking_lot::Mutex;
#[cfg(target_os = "macos")]
use std::mem::MaybeUninit;
use std::{thread, time::Duration};
use tauri::path::BaseDirectory;
use tauri::Manager;

use crate::APP_HANDLE;

static SELECT_ALL: Mutex<()> = Mutex::new(());

#[allow(dead_code)]
#[cfg(not(target_os = "macos"))]
pub fn select_all(enigo: &mut Enigo) {
    let _guard = SELECT_ALL.lock();

    up_control_keys(enigo);

    enigo.key(Key::Control, Direction::Press).unwrap();
    #[cfg(target_os = "windows")]
    enigo.key(Key::A, Direction::Click).unwrap();
    #[cfg(target_os = "linux")]
    enigo.key(Key::Unicode('a'), Direction::Click).unwrap();
    enigo.key(Key::Control, Direction::Release).unwrap();
}

#[allow(dead_code)]
#[cfg(target_os = "macos")]
pub fn select_all(enigo: &mut Enigo) {
    let _guard = SELECT_ALL.lock();

    let apple_script = APP_HANDLE
        .get()
        .unwrap()
        .path()
        .resolve("resources/select-all.applescript", BaseDirectory::Resource)
        .expect("failed to resolve select-all.applescript");

    std::process::Command::new("osascript")
        .arg(apple_script)
        .spawn()
        .expect("failed to run applescript")
        .wait()
        .expect("failed to wait");
}

pub static INPUT_LOCK: Mutex<()> = Mutex::new(());

#[cfg(not(target_os = "macos"))]
pub fn left_arrow_click(enigo: &mut Enigo, n: usize) {
    let _guard = INPUT_LOCK.lock();

    for _ in 0..n {
        enigo.key(Key::LeftArrow, Direction::Click).unwrap();
    }
}

#[cfg(target_os = "macos")]
pub fn left_arrow_click(enigo: &mut Enigo, n: usize) {
    let _guard = INPUT_LOCK.lock();

    let apple_script = APP_HANDLE
        .get()
        .unwrap()
        .path()
        .resolve("resources/left.applescript", BaseDirectory::Resource)
        .expect("failed to resolve left.applescript");

    std::process::Command::new("osascript")
        .arg(apple_script)
        .arg(n.to_string())
        .spawn()
        .expect("failed to run applescript")
        .wait()
        .expect("failed to wait");
}

#[cfg(not(target_os = "macos"))]
pub fn right_arrow_click(enigo: &mut Enigo, n: usize) {
    let _guard = INPUT_LOCK.lock();

    for _ in 0..n {
        enigo.key(Key::RightArrow, Direction::Click).unwrap();
    }
}

#[cfg(target_os = "macos")]
pub fn right_arrow_click(enigo: &mut Enigo, n: usize) {
    let _guard = INPUT_LOCK.lock();

    let apple_script = APP_HANDLE
        .get()
        .unwrap()
        .path()
        .resolve("resources/right.applescript", BaseDirectory::Resource)
        .expect("failed to resolve right.applescript");

    std::process::Command::new("osascript")
        .arg(apple_script)
        .arg(n.to_string())
        .spawn()
        .expect("failed to run applescript")
        .wait()
        .expect("failed to wait");
}

#[cfg(not(target_os = "macos"))]
pub fn backspace_click(enigo: &mut Enigo, n: usize) {
    let _guard = INPUT_LOCK.lock();

    for _ in 0..n {
        enigo.key(Key::Backspace, Direction::Click).unwrap();
    }
}

#[cfg(target_os = "macos")]
pub fn backspace_click(enigo: &mut Enigo, n: usize) {
    let _guard = INPUT_LOCK.lock();

    let apple_script = APP_HANDLE
        .get()
        .unwrap()
        .path()
        .resolve("resources/backspace.applescript", BaseDirectory::Resource)
        .expect("failed to resolve backspace.applescript");

    std::process::Command::new("osascript")
        .arg(apple_script)
        .arg(n.to_string())
        .spawn()
        .expect("failed to run applescript")
        .wait()
        .expect("failed to wait");
}

#[allow(dead_code)]
#[cfg(not(target_os = "macos"))]
pub fn up_control_keys(enigo: &mut Enigo) {
    enigo.key(Key::Control, Direction::Release).unwrap();
    enigo.key(Key::Alt, Direction::Release).unwrap();
    enigo.key(Key::Shift, Direction::Release).unwrap();
    enigo.key(Key::Space, Direction::Release).unwrap();
    enigo.key(Key::Tab, Direction::Release).unwrap();
}

#[allow(dead_code)]
#[cfg(target_os = "macos")]
pub fn up_control_keys(enigo: &mut Enigo) {
    enigo.key(Key::Control, Direction::Release).unwrap();
    enigo.key(Key::Meta, Direction::Release).unwrap();
    enigo.key(Key::Alt, Direction::Release).unwrap();
    enigo.key(Key::Shift, Direction::Release).unwrap();
    enigo.key(Key::Space, Direction::Release).unwrap();
    enigo.key(Key::Tab, Direction::Release).unwrap();
    enigo.key(Key::Option, Direction::Release).unwrap();
}

static COPY_PASTE: Mutex<()> = Mutex::new(());

#[allow(dead_code)]
#[cfg(not(target_os = "macos"))]
pub fn copy(enigo: &mut Enigo) {
    let _guard = COPY_PASTE.lock();

    up_control_keys(enigo);

    enigo.key(Key::Control, Direction::Press).unwrap();
    #[cfg(target_os = "windows")]
    enigo.key(Key::C, Direction::Click).unwrap();
    #[cfg(target_os = "linux")]
    enigo.key(Key::Unicode('c'), Direction::Click).unwrap();
    enigo.key(Key::Control, Direction::Release).unwrap();
}

#[allow(dead_code)]
#[cfg(target_os = "macos")]
pub fn copy(enigo: &mut Enigo) {
    let _guard = COPY_PASTE.lock();

    let apple_script = APP_HANDLE
        .get()
        .unwrap()
        .path()
        .resolve("resources/copy.applescript", BaseDirectory::Resource)
        .expect("failed to resolve copy.applescript");

    std::process::Command::new("osascript")
        .arg(apple_script)
        .spawn()
        .expect("failed to run applescript")
        .wait()
        .expect("failed to wait");
}

#[allow(dead_code)]
#[cfg(not(target_os = "macos"))]
pub fn paste(enigo: &mut Enigo) {
    let _guard = COPY_PASTE.lock();

    up_control_keys(enigo);

    enigo.key(Key::Control, Direction::Press).unwrap();
    #[cfg(target_os = "windows")]
    enigo.key(Key::V, Direction::Click).unwrap();
    #[cfg(target_os = "linux")]
    enigo.key(Key::Unicode('v'), Direction::Click).unwrap();
    enigo.key(Key::Control, Direction::Release).unwrap();
}

#[allow(dead_code)]
#[cfg(target_os = "macos")]
pub fn paste(enigo: &mut Enigo) {
    let _guard = COPY_PASTE.lock();

    let apple_script = APP_HANDLE
        .get()
        .unwrap()
        .path()
        .resolve("resources/paste.applescript", BaseDirectory::Resource)
        .expect("failed to resolve paste.applescript");

    std::process::Command::new("osascript")
        .arg(apple_script)
        .spawn()
        .expect("failed to run applescript")
        .wait()
        .expect("failed to wait");
}

pub fn get_selected_text_by_clipboard(
    enigo: &mut Enigo,
    cancel_select: bool,
) -> Result<String, Box<dyn std::error::Error>> {
    use arboard::Clipboard;

    let old_clipboard = (Clipboard::new()?.get_text(), Clipboard::new()?.get_image());

    let mut write_clipboard = Clipboard::new()?;

    let not_selected_placeholder = "";

    write_clipboard.set_text(not_selected_placeholder)?;

    thread::sleep(Duration::from_millis(50));

    copy(enigo);

    if cancel_select {
        right_arrow_click(enigo, 1);
    }

    thread::sleep(Duration::from_millis(100));

    let new_text = Clipboard::new()?.get_text();

    match old_clipboard {
        (Ok(old_text), _) => {
            // Old Content is Text
            write_clipboard.set_text(old_text.clone())?;
            if let Ok(new) = new_text {
                if new.trim() == not_selected_placeholder.trim() {
                    Ok(String::new())
                } else {
                    Ok(new)
                }
            } else {
                Ok(String::new())
            }
        }
        (_, Ok(image)) => {
            // Old Content is Image
            write_clipboard.set_image(image)?;
            if let Ok(new) = new_text {
                if new.trim() == not_selected_placeholder.trim() {
                    Ok(String::new())
                } else {
                    Ok(new)
                }
            } else {
                Ok(String::new())
            }
        }
        _ => {
            // Old Content is Empty
            write_clipboard.clear()?;
            if let Ok(new) = new_text {
                if new.trim() == not_selected_placeholder.trim() {
                    Ok(String::new())
                } else {
                    Ok(new)
                }
            } else {
                Ok(String::new())
            }
        }
    }
}

#[cfg(target_os = "macos")]
unsafe fn ax_call<F, V>(f: F) -> Result<V, AXError>
where
    F: Fn(*mut V) -> AXError,
{
    let mut result = MaybeUninit::uninit();
    let err = (f)(result.as_mut_ptr());

    if err != kAXErrorSuccess {
        return Err(err);
    }

    Ok(result.assume_init())
}

#[cfg(target_os = "macos")]
fn get_selected_text_frame_by_ax() -> Result<CGRect, Box<dyn std::error::Error>> {
    use accessibility_ng::{AXAttribute, AXUIElement, AXValue};
    use accessibility_sys_ng::{
        kAXBoundsForRangeParameterizedAttribute, kAXFocusedUIElementAttribute,
        kAXSelectedTextRangeAttribute,
    };
    use core_foundation::string::CFString;

    let system_element = AXUIElement::system_wide();
    let Some(focused_element) = system_element
        .attribute(&AXAttribute::new(&CFString::from_static_string(
            kAXFocusedUIElementAttribute,
        )))
        .map(|element| element.downcast_into::<AXUIElement>())
        .ok()
        .flatten()
    else {
        return Ok(CGRect::default());
    };
    let Some(selection_range_value) = focused_element
        .attribute(&AXAttribute::new(&CFString::from_static_string(
            kAXSelectedTextRangeAttribute,
        )))
        .map(|value| value.downcast_into::<AXValue>())
        .ok()
        .flatten()
    else {
        return Ok(CGRect::default());
    };
    let Some(selection_bounds_value) = focused_element
        .parameterized_attribute(
            &AXAttribute::new(&CFString::from_static_string(
                kAXBoundsForRangeParameterizedAttribute,
            )),
            &selection_range_value,
        )
        .map(|value| value.downcast_into::<AXValue>())
        .ok()
        .flatten()
    else {
        return Ok(CGRect::default());
    };
    selection_bounds_value
        .get_value::<CGRect>()
        .map_err(|err| err.into())
}

#[cfg(target_os = "macos")]
pub fn is_valid_selected_frame() -> Result<bool, Box<dyn std::error::Error>> {
    use crate::windows::get_mouse_location;
    use core_graphics::geometry::{CGPoint, CGSize};
    use debug_print::debug_println;

    unsafe {
        match get_selected_text_frame_by_ax() {
            Ok(selected_frame) => {
                if selected_frame.size.width == 0.0 && selected_frame.size.height == 0.0 {
                    debug_println!("Selected frame is empty");
                    return Ok(true);
                }

                let expand_value = 40.0;
                let origin = CGPoint::new(
                    selected_frame.origin.x - expand_value,
                    selected_frame.origin.y - expand_value,
                );
                let size = CGSize::new(
                    selected_frame.size.width + expand_value * 2.0,
                    selected_frame.size.height + expand_value * 2.0,
                );
                let expanded_selected_text_frame = CGRect::new(&origin, &size);
                let (mouse_x, mouse_y) = get_mouse_location()?;
                let mouse_position_point = CGPoint::new(mouse_x as f64, mouse_y as f64);
                debug_println!(
                    "selected_frame: {:?}, expanded_selected_text_frame: {:?}, mouse_position_point: {:?}",
                    selected_frame,
                    expanded_selected_text_frame,
                    mouse_position_point
                );
                Ok(expanded_selected_text_frame.contains(&mouse_position_point))
            }
            Err(err) => {
                debug_println!("get_selected_text_frame_by_ax error: {}", err);
                Err(err)
            }
        }
    }
}

pub fn send_text(text: String) {
    match APP_HANDLE.get() {
        Some(handle) => handle.emit("change-text", text).unwrap_or_default(),
        None => {}
    }
}

pub fn writing_text(text: String) {
    match APP_HANDLE.get() {
        Some(handle) => handle.emit("writing-text", text).unwrap_or_default(),
        None => {}
    }
}

pub fn show() {
    match APP_HANDLE.get() {
        Some(handle) => handle.emit("show", "").unwrap_or_default(),
        None => {}
    }
}
