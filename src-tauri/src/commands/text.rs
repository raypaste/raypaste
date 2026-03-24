use core_graphics::event::{CGEvent, CGEventFlags, CGEventTapLocation};
use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};

use super::focused_app::activate_app_inner;

// macOS key codes
const KEY_C: u16 = 8;
const KEY_V: u16 = 9;

fn read_clipboard() -> String {
    use objc2::runtime::AnyObject;
    use objc2::{class, msg_send};
    use objc2_foundation::NSString;

    unsafe {
        let pb: *mut AnyObject = msg_send![class!(NSPasteboard), generalPasteboard];
        if pb.is_null() {
            return String::new();
        }
        let type_str = NSString::from_str("public.utf8-plain-text");
        let result: *mut NSString = msg_send![pb, stringForType: &*type_str];
        if result.is_null() {
            String::new()
        } else {
            (*result).to_string()
        }
    }
}

fn write_clipboard(text: &str) {
    use objc2::runtime::AnyObject;
    use objc2::{class, msg_send};
    use objc2_foundation::NSString;

    unsafe {
        let pb: *mut AnyObject = msg_send![class!(NSPasteboard), generalPasteboard];
        if pb.is_null() {
            return;
        }
        let _count: i64 = msg_send![pb, clearContents];
        let text_str = NSString::from_str(text);
        let type_str = NSString::from_str("public.utf8-plain-text");
        let _: bool = msg_send![pb, setString: &*text_str forType: &*type_str];
    }
}

fn post_key(key: u16, down: bool, flags: CGEventFlags) {
    if let Ok(source) = CGEventSource::new(CGEventSourceStateID::HIDSystemState) {
        if let Ok(event) = CGEvent::new_keyboard_event(source, key, down) {
            event.set_flags(flags);
            event.post(CGEventTapLocation::HID);
        }
    }
}

fn simulate_cmd_c() {
    post_key(KEY_C, true, CGEventFlags::CGEventFlagCommand);
    post_key(KEY_C, false, CGEventFlags::CGEventFlagCommand);
}

fn simulate_cmd_v() {
    post_key(KEY_V, true, CGEventFlags::CGEventFlagCommand);
    post_key(KEY_V, false, CGEventFlags::CGEventFlagCommand);
}

fn restore_clipboard_async(text: String) {
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(150));
        write_clipboard(&text);
    });
}

/// Captures selected text from the frontmost app using clipboard.
/// Saves and restores clipboard contents around the capture.
pub fn get_selected_text_inner(_pid: i32) -> Option<String> {
    let original = read_clipboard();
    write_clipboard("");
    simulate_cmd_c();
    std::thread::sleep(std::time::Duration::from_millis(200));
    let captured = read_clipboard();
    // Restore original clipboard asynchronously to avoid a visible flash
    let orig_clone = original.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(100));
        write_clipboard(&orig_clone);
    });
    if captured.is_empty() {
        None
    } else {
        Some(captured)
    }
}

#[tauri::command]
pub fn get_selected_text(target_pid: i32) -> Option<String> {
    get_selected_text_inner(target_pid)
}

/// Writes text back to the frontmost app by placing it on the clipboard and simulating Cmd+V.
#[tauri::command]
pub fn write_text_back(app: tauri::AppHandle, text: String, target_pid: i32) -> Result<(), String> {
    let (tx, rx) = std::sync::mpsc::channel();

    app.run_on_main_thread(move || {
        let original_clipboard = read_clipboard();
        write_clipboard(&text);
        std::thread::sleep(std::time::Duration::from_millis(60));

        if !activate_app_inner(target_pid) {
            restore_clipboard_async(original_clipboard);
            let _ = tx.send(Err(format!(
                "Could not activate target app for pid {}",
                target_pid
            )));
            return;
        }

        std::thread::sleep(std::time::Duration::from_millis(120));
        simulate_cmd_v();
        restore_clipboard_async(original_clipboard);
        let _ = tx.send(Ok(()));
    })
    .map_err(|err| err.to_string())?;

    rx.recv()
        .map_err(|_| "Failed to receive paste result".to_string())?
}
