use serde::Serialize;
use tauri::Emitter;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

mod commands;

#[derive(Clone, Serialize)]
struct HotkeyPayload {
    app: String,
    selected_text: String,
    target_pid: i32,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        let app = app.clone();
                        // Run entirely on the main thread so AppKit calls are safe,
                        // then emit from there — no channel or timeout needed.
                        app.clone().run_on_main_thread(move || {
                            let bundle_id =
                                commands::focused_app::get_focused_app_inner()
                                    .unwrap_or_default();
                            let pid = commands::focused_app::get_frontmost_pid();
                            let text =
                                commands::text::get_selected_text_inner(pid)
                                    .unwrap_or_default();
                            app.emit(
                                "raypaste://hotkey-triggered",
                                HotkeyPayload {
                                    app: bundle_id,
                                    selected_text: text,
                                    target_pid: pid,
                                },
                            )
                            .ok();
                        })
                        .ok();
                    }
                })
                .build(),
        )
        .setup(|app| {
            app.global_shortcut().register("CmdOrCtrl+Control+R")?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::apps::list_apps,
            commands::focused_app::get_focused_app,
            commands::text::get_selected_text,
            commands::text::write_text_back,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
