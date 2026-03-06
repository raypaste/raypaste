use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
pub struct InstalledApp {
    pub name: String,
    #[serde(rename = "bundleId")]
    pub bundle_id: String,
    #[serde(rename = "iconPath")]
    pub icon_path: Option<String>,
}

#[tauri::command]
pub async fn list_apps() -> Vec<InstalledApp> {
    tauri::async_runtime::spawn_blocking(|| {
        let home = std::env::var("HOME").unwrap_or_default();
        let dirs = [
            std::path::PathBuf::from("/Applications"),
            std::path::PathBuf::from(format!("{}/Applications", home)),
        ];

        let mut apps = Vec::new();

        for dir in &dirs {
            let Ok(entries) = std::fs::read_dir(dir) else {
                continue;
            };
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|e| e.to_str()) != Some("app") {
                    continue;
                }
                let info_plist = path.join("Contents/Info.plist");
                let Ok(val) = plist::Value::from_file(&info_plist) else {
                    continue;
                };
                let Some(dict) = val.as_dictionary() else {
                    continue;
                };
                let bundle_id = dict
                    .get("CFBundleIdentifier")
                    .and_then(|v| v.as_string())
                    .unwrap_or_default()
                    .to_string();
                if bundle_id.is_empty() {
                    continue;
                }
                let name = dict
                    .get("CFBundleName")
                    .and_then(|v| v.as_string())
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| {
                        path.file_stem()
                            .and_then(|s| s.to_str())
                            .unwrap_or("")
                            .to_string()
                    });
                let icon_path = resolve_icon_path(&path, dict);
                apps.push(InstalledApp { name, bundle_id, icon_path });
            }
        }

        apps.sort_by(|a, b| a.name.cmp(&b.name));
        apps
    })
    .await
    .unwrap_or_default()
}

fn resolve_icon_path(app_path: &std::path::Path, dict: &plist::Dictionary) -> Option<String> {
    let resources = app_path.join("Contents/Resources");
    let icon_file = dict
        .get("CFBundleIconFile")
        .and_then(|v| v.as_string())
        .unwrap_or("")
        .to_string();
    if icon_file.is_empty() {
        return None;
    }
    // Try with .icns extension if not already present
    let candidates = if icon_file.ends_with(".icns") {
        vec![resources.join(&icon_file)]
    } else {
        vec![
            resources.join(format!("{}.icns", icon_file)),
            resources.join(&icon_file),
        ]
    };
    candidates
        .into_iter()
        .find(|p| p.exists())
        .map(|p| p.to_string_lossy().into_owned())
}
