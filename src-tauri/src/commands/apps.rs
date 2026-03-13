use serde::{Serialize, Deserialize};
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::time::{SystemTime, UNIX_EPOCH};
use base64::{Engine as _, engine::general_purpose::STANDARD};

#[derive(Debug, Deserialize)]
pub struct GetIconRequest {
    pub path: String,
}

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
    let candidates = if icon_file.ends_with(".icns") {
        vec![resources.join(&icon_file)]
    } else {
        vec![
            resources.join(format!("{}.icns", icon_file)),
            resources.join(&icon_file),
        ]
    };
    let icns_path = candidates.into_iter().find(|p| p.exists())?;
    icns_to_png_path(&icns_path.to_string_lossy())
}

/// Get the app's cache directory for storing converted icons.
fn get_icon_cache_dir() -> std::path::PathBuf {
    let cache_dir = std::env::temp_dir().join("raypaste_icons");
    if !cache_dir.exists() {
        let _ = std::fs::create_dir_all(&cache_dir);
    }
    cache_dir
}

/// Convert an .icns file to a PNG cached in the app's cache directory.
/// Uses macOS's built-in `sips` tool — no extra dependencies.
/// The output path is deterministic (hash of the input path) so it acts as a
/// persistent cache across app restarts.
fn icns_to_png_path(icns_path: &str) -> Option<String> {
    let mut h = DefaultHasher::new();
    icns_path.hash(&mut h);
    let hash = h.finish();
    let cache_dir = get_icon_cache_dir();
    let final_path = cache_dir.join(format!("icon_{:x}.png", hash));

    // Return cached file if it already exists
    if final_path.exists() {
        return Some(final_path.to_string_lossy().into_owned());
    }

    // Use a unique temp file to avoid conflicts during concurrent conversions
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let temp_path = cache_dir.join(format!("icon_{:x}_{}.png", hash, timestamp));

    let status = std::process::Command::new("sips")
        .args([
            "-s", "format", "png",
            "--resampleHeightWidth", "64", "64",
            icns_path,
            "--out", temp_path.to_str()?,
        ])
        .status()
        .ok()?;

    if !status.success() {
        // Clean up temp file on failure
        let _ = std::fs::remove_file(&temp_path);
        return None;
    }

    if !temp_path.exists() {
        return None;
    }

    // Atomically rename temp file to final path
    // If another process already created the file, use that one instead
    match std::fs::rename(&temp_path, &final_path) {
        Ok(()) => Some(final_path.to_string_lossy().into_owned()),
        Err(_) => {
            // Final file likely already exists from another process
            let _ = std::fs::remove_file(&temp_path);
            if final_path.exists() {
                Some(final_path.to_string_lossy().into_owned())
            } else {
                None
            }
        }
    }
}

/// Read an icon file and return it as a base64 data URL for display in the frontend.
#[tauri::command]
pub async fn get_icon_base64(request: GetIconRequest) -> Option<String> {
    let path = std::path::PathBuf::from(&request.path);
    if !path.exists() {
        return None;
    }
    
    let bytes = std::fs::read(&path).ok()?;
    let base64_str = STANDARD.encode(&bytes);
    Some(format!("data:image/png;base64,{}", base64_str))
}
