// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use base64::{engine::general_purpose, Engine as _};
use std::io::Cursor;
use xcap::Monitor;

#[tauri::command]
fn get_monitor_count() -> usize {
    Monitor::all().map(|m| m.len()).unwrap_or(1)
}

#[tauri::command]
fn screenshot(monitor_index: usize) -> String {
    let monitors = Monitor::all().unwrap_or_default();
    if let Some(monitor) = monitors.get(monitor_index) {
        if let Ok(image) = monitor.capture_image() {
            let mut buf = Cursor::new(Vec::new());
            if let Ok(_) = image.write_to(&mut buf, image::ImageFormat::WebP) {
                return format!("data:image/webp;base64,{}", general_purpose::STANDARD.encode(&buf.into_inner()));
            }
        }
    }
    "".to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            screenshot,
            get_monitor_count
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

