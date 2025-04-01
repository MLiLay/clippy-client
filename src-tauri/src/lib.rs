// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use base64::{engine::general_purpose, Engine as _};
use enigo::{
    Direction::{Click, Press, Release},
    Enigo, Key, Keyboard, Settings,
};
use std::io::Cursor;
use std::thread;
use std::time::Duration;
use xcap::Monitor;

#[tauri::command]
fn get_monitor_count() -> usize {
    Monitor::all().map(|m| m.len()).unwrap_or(1)
}

fn get_platform_modifier_key() -> Key {
    if tauri_plugin_os::platform() == "macos" {
        return Key::Meta;
    } else {
        return Key::Control;
    }
}

#[tauri::command]
fn paste_text() {
    thread::sleep(Duration::from_secs(1));
    let mut enigo = Enigo::new(&Settings::default()).unwrap();

    let modifier_key = get_platform_modifier_key();
    enigo.key(modifier_key, Press).unwrap();
    enigo.key(Key::Unicode('v'), Click).unwrap();
    enigo.key(modifier_key, Release).unwrap();
}

#[tauri::command]
fn type_text(text: String) {
    thread::sleep(Duration::from_secs(1));
    let mut enigo = Enigo::new(&Settings::default()).unwrap();
    enigo.text(&text).unwrap();
}

#[tauri::command]
fn screenshot(monitor_index: usize) -> String {
    let monitors = Monitor::all().unwrap_or_default();
    if let Some(monitor) = monitors.get(monitor_index) {
        if let Ok(image) = monitor.capture_image() {
            let mut buf = Cursor::new(Vec::new());
            if let Ok(_) = image.write_to(&mut buf, image::ImageFormat::WebP) {
                return format!(
                    "data:image/webp;base64,{}",
                    general_purpose::STANDARD.encode(&buf.into_inner())
                );
            }
        }
    }
    "".to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            screenshot,
            get_monitor_count,
            paste_text,
            type_text
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
