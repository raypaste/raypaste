/// Shows a native macOS save panel and writes `content` to the chosen path.
/// Returns `true` if the file was saved, `false` if the user cancelled.
#[tauri::command]
pub fn save_json_file(
    app: tauri::AppHandle,
    default_name: String,
    content: String,
) -> Result<bool, String> {
    let (tx, rx) = std::sync::mpsc::channel::<Result<bool, String>>();

    app.run_on_main_thread(move || {
        let path = rfd::FileDialog::new()
            .set_file_name(&default_name)
            .add_filter("JSON Files", &["json"])
            .save_file();

        match path {
            Some(path) => {
                let result = std::fs::write(&path, content.as_bytes())
                    .map(|_| true)
                    .map_err(|e| e.to_string());
                let _ = tx.send(result);
            }
            None => {
                let _ = tx.send(Ok(false));
            }
        }
    })
    .map_err(|e| format!("{e:?}"))?;

    rx.recv().map_err(|e| e.to_string())?
}
