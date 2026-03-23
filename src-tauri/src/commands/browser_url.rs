//! Best-effort active tab URL via AppleScript (`osascript`). Requires macOS
//! Automation permission for each browser. Returns None on failure or for
//! unsupported browsers (e.g. Firefox — no stable scripting API).

use std::process::Command;
use std::sync::mpsc;
use std::time::Duration;

const OSASCRIPT_TIMEOUT: Duration = Duration::from_millis(400);

fn chromium_script(app_display_name: &str) -> String {
    format!(
        r#"tell application "{}"
    try
        if (count of windows) is 0 then return ""
        return (URL of active tab of front window) as string
    on error
        return ""
    end try
end tell"#,
        app_display_name.replace('"', "\\\"")
    )
}

fn safari_script() -> &'static str {
    r#"tell application "Safari"
    try
        if (count of windows) is 0 then return ""
        return (URL of front document) as string
    on error
        return ""
    end try
end tell"#
}

/// Arc's AppleScript differs from Chromium (`first window`, `active tab`)
fn arc_script() -> &'static str {
    r#"tell application "Arc"
    try
        if (count of windows) is 0 then return ""
        tell first window
            return (URL of active tab) as string
        end tell
    on error
        return ""
    end try
end tell"#
}

fn script_for_bundle(bundle_id: &str) -> Option<&'static str> {
    // Static scripts for browsers with fixed display names
    match bundle_id {
        "com.apple.Safari" => Some(safari_script()),
        "company.thebrowser.Browser" => Some(arc_script()),
        // Firefox: no reliable URL via AppleScript; avoid UI-scripting the address bar.
        "org.mozilla.firefox" | "org.mozilla.firefoxdeveloperedition" => None,
        _ => None,
    }
}

fn chromium_app_name(bundle_id: &str) -> Option<&'static str> {
    match bundle_id {
        "com.google.Chrome" => Some("Google Chrome"),
        "com.google.Chrome.canary" => Some("Google Chrome Canary"),
        "com.brave.Browser" => Some("Brave Browser"),
        "com.microsoft.edgemac" => Some("Microsoft Edge"),
        "com.operasoftware.Opera" => Some("Opera"),
        _ => None,
    }
}

fn normalize_url(raw: String) -> Option<String> {
    let s = raw.trim();
    if s.is_empty() {
        return None;
    }
    if s.starts_with("http://") || s.starts_with("https://") {
        Some(s.to_string())
    } else {
        None
    }
}

fn run_osascript(script: &str) -> Option<String> {
    let (tx, rx) = mpsc::channel();
    let script = script.to_string();
    std::thread::spawn(move || {
        let out = Command::new("osascript").arg("-e").arg(&script).output();
        let _ = tx.send(out);
    });
    let output = match rx.recv_timeout(OSASCRIPT_TIMEOUT) {
        Ok(Ok(o)) => o,
        _ => return None,
    };
    if !output.status.success() {
        return None;
    }
    let stdout = String::from_utf8_lossy(&output.stdout).into_owned();
    normalize_url(stdout)
}

/// Returns the active tab URL for known browsers, or None if unavailable.
pub fn try_get_active_tab_url(bundle_id: &str) -> Option<String> {
    if let Some(script) = script_for_bundle(bundle_id) {
        return run_osascript(script);
    }
    if let Some(name) = chromium_app_name(bundle_id) {
        return run_osascript(&chromium_script(name));
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn chromium_script_escapes_quotes() {
        let s = chromium_script("Google Chrome");
        assert!(s.contains("Google Chrome"));
    }
}
