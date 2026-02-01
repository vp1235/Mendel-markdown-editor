mod menu;

use std::fs;
use std::sync::Mutex;
use tauri::{Emitter, Manager};

#[tauri::command]
fn read_file_contents(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read {}: {}", path, e))
}

#[tauri::command]
fn write_file_contents(path: String, contents: String) -> Result<(), String> {
    fs::write(&path, &contents).map_err(|e| format!("Failed to write {}: {}", path, e))
}

const SIGNAL_FILE: &str = "/tmp/.markdowneditor-open";

#[tauri::command]
fn check_pending_open() -> Option<String> {
    if let Ok(path) = fs::read_to_string(SIGNAL_FILE) {
        let _ = fs::remove_file(SIGNAL_FILE);
        let path = path.trim().to_string();
        if !path.is_empty() { Some(path) } else { None }
    } else {
        None
    }
}

struct OpenedFile(Mutex<Option<String>>);

#[tauri::command]
fn take_opened_file(state: tauri::State<OpenedFile>) -> Option<String> {
    state.0.lock().unwrap().take()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(OpenedFile(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![read_file_contents, write_file_contents, check_pending_open, take_opened_file])
        .setup(|app| {
            let handle = app.handle();
            let menu = menu::build_menu(handle)?;
            app.set_menu(menu)?;

            let handle_clone = handle.clone();
            app.on_menu_event(move |_app_handle, event| {
                menu::handle_menu_event(&handle_clone, event.id().as_ref());
            });

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|handle, event| {
        if let tauri::RunEvent::Opened { urls } = event {
            for url in urls {
                if let Ok(path) = url.to_file_path() {
                    let path_str = path.to_string_lossy().to_string();
                    let _ = handle.emit("open-file", &path_str);
                    if let Some(state) = handle.try_state::<OpenedFile>() {
                        *state.0.lock().unwrap() = Some(path_str);
                    }
                }
            }
        }
    });
}
