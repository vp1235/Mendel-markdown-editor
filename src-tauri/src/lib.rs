mod menu;

use std::fs;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![read_file_contents, write_file_contents, check_pending_open])
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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
