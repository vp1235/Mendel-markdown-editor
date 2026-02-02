use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::{AppHandle, Emitter, Runtime};

pub fn build_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<tauri::menu::Menu<R>> {
    let app_menu = SubmenuBuilder::new(app, "Mendel")
        .about(None)
        .separator()
        .services()
        .separator()
        .hide()
        .hide_others()
        .show_all()
        .separator()
        .quit()
        .build()?;

    let open = MenuItemBuilder::with_id("open", "Open...")
        .accelerator("CmdOrCtrl+O")
        .build(app)?;
    let save = MenuItemBuilder::with_id("save", "Save")
        .accelerator("CmdOrCtrl+S")
        .build(app)?;
    let save_as = MenuItemBuilder::with_id("save_as", "Save As...")
        .accelerator("CmdOrCtrl+Shift+S")
        .build(app)?;

    let export_pdf = MenuItemBuilder::with_id("export_pdf", "Export as PDF")
        .accelerator("CmdOrCtrl+Shift+E")
        .build(app)?;
    let export_html = MenuItemBuilder::with_id("export_html", "Export as HTML")
        .build(app)?;
    let export_docx = MenuItemBuilder::with_id("export_docx", "Export as DOCX")
        .build(app)?;
    let export_rtf = MenuItemBuilder::with_id("export_rtf", "Export as RTF")
        .build(app)?;
    let export_png = MenuItemBuilder::with_id("export_png", "Export as PNG")
        .build(app)?;
    let export_jpg = MenuItemBuilder::with_id("export_jpg", "Export as JPG")
        .build(app)?;
    let export_txt = MenuItemBuilder::with_id("export_txt", "Export as TXT")
        .build(app)?;

    let export_menu = SubmenuBuilder::new(app, "Export")
        .items(&[&export_pdf, &export_html, &export_docx, &export_rtf, &export_png, &export_jpg, &export_txt])
        .build()?;

    let file_menu = SubmenuBuilder::new(app, "File")
        .items(&[&open, &save, &save_as])
        .separator()
        .item(&export_menu)
        .separator()
        .close_window()
        .build()?;

    let insert_image = MenuItemBuilder::with_id("insert_image", "Insert Image...")
        .accelerator("CmdOrCtrl+Shift+I")
        .build(app)?;

    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .separator()
        .item(&insert_image)
        .build()?;

    let view_menu = SubmenuBuilder::new(app, "View")
        .fullscreen()
        .build()?;

    let menu = MenuBuilder::new(app)
        .items(&[&app_menu, &file_menu, &edit_menu, &view_menu])
        .build()?;

    Ok(menu)
}

pub fn handle_menu_event(app: &AppHandle, id: &str) {
    match id {
        "open" => { let _ = app.emit("menu-open", ()); }
        "save" => { let _ = app.emit("menu-save", ()); }
        "save_as" => { let _ = app.emit("menu-save-as", ()); }
        "export_pdf" => { let _ = app.emit("menu-export-pdf", ()); }
        "export_html" => { let _ = app.emit("menu-export-html", ()); }
        "export_docx" => { let _ = app.emit("menu-export-docx", ()); }
        "export_rtf" => { let _ = app.emit("menu-export-rtf", ()); }
        "export_png" => { let _ = app.emit("menu-export-png", ()); }
        "export_jpg" => { let _ = app.emit("menu-export-jpg", ()); }
        "export_txt" => { let _ = app.emit("menu-export-txt", ()); }
        "insert_image" => { let _ = app.emit("menu-insert-image", ()); }
        _ => {}
    }
}
