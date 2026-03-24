import { invoke } from "@tauri-apps/api/core";

export async function fetchWebsiteIcon(domain: string): Promise<string | null> {
  return invoke<string | null>("fetch_website_icon", {
    request: { domain },
  }).catch(() => null);
}
