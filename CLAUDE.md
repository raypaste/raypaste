# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (starts Vite + Tauri dev window)
pnpm tauri dev

# Production build
pnpm tauri build

# Lint
pnpm lint
pnpm lint:fix

# Format
pnpm format

# Lint + format together
pnpm check
```

There are no automated tests at this time.

## Architecture

This is a **Tauri 2.0** desktop app: a Rust backend exposes commands via `src-tauri/src/lib.rs`, and a React 19 + TypeScript frontend lives in `src/`.

### Core data flow

The hotkey **Cmd+Ctrl+R** triggers the entire pipeline:

1. Rust (`lib.rs`) intercepts the global shortcut via `tauri_plugin_global_shortcut`, calls into `commands::focused_app` and `commands::text` on the main thread, then emits `raypaste://hotkey-triggered` with `{ app, selected_text, target_pid }`.
2. Frontend (`src/hooks/useHotkeyListener.ts`) listens for that event, looks up the active prompt (per-app mapping → fallback to `"formal"` built-in → first prompt), calls the configured LLM client, then either writes back directly (`invoke("write_text_back")`) or opens the review overlay.

### Overlay system

`src/main.tsx` renders `<RenderWindow />`, which reads the `?overlay` query param and routes to the appropriate UI (`src/components/RenderWindow.tsx`):

- No params → main app (`<App />`)
- `?overlay=review` → `<ReviewPage />` (editable completion, accept/reject)
- `?overlay=toast` or `?overlay=progress` → `<NotificationPage />`

Overlay types are defined as constants in `src/lib/overlay.ts` (`OVERLAY.review`, `OVERLAY.toast`, `OVERLAY.progress`). Only valid known values are accepted — unknown strings fall through to `NotificationPage`.

Overlay windows are created programmatically via `src/services/overlayWindows.ts` using `WebviewWindow`. The review overlay passes data through `localStorage` using key `raypaste-pending-review` (exported as `REVIEW_STORAGE_KEY`).

### State management

All stores use Zustand with `persist` middleware (localStorage):

- `settingsStore` — LLM mode (`"direct"` | `"api"`), provider (`"openrouter"` | `"cerebras"`), API keys, model (currently hardcoded to `openai/gpt-oss-120b`), reviewMode
- `promptsStore` — CRUD for prompts; each prompt has `appIds[]` for per-app mapping; `defaultPromptId` for fallback. App assignments are **exclusive** — `assignAppToPrompt` removes the app from all other prompts; `unassignApp` removes from all.
- `appsStore` — installed macOS apps list (populated via `commands::apps::list_apps`)

All stores are re-exported from `src/stores/index.ts`.

### LLM service layer

`src/services/llm/index.ts` exports `getLLMClient()` and `getApiKey()` which read from `settingsStore` at call time.

- `mode: "api"` → `raypasteApiClient` (Raypaste hosted API, coming soon)
- `mode: "direct"` + `provider: "cerebras"` → `cerebrasClient`
- `mode: "direct"` + `provider: "openrouter"` → `openrouterClient`

### Rust commands

`src-tauri/src/commands/` contains three modules registered in `invoke_handler`:

- `apps::list_apps` — lists installed macOS apps
- `focused_app::get_focused_app` / `get_focused_app_inner` / `get_frontmost_pid` — AXUIElement bundle ID + PID
- `text::get_selected_text` / `get_selected_text_inner` / `write_text_back` — AX read/write of selected text

All AppKit/AX calls must run on the main thread — the hotkey handler uses `run_on_main_thread` for this.

### Frontend structure

- `src/components/RenderWindow.tsx` — entry point; routes to `App`, `ReviewPage`, or `NotificationPage` based on `?overlay` param
- `src/components/Layout.tsx` — main app shell: holds `activePage` + `selectedPromptId` state, mounts `useHotkeyListener`
- `src/components/Sidebar/` — nav; `SidebarNav.tsx` defines the `Page` type
- `src/pages/` — one file per page (`NewPromptPage`, `PromptPage`, `AppsPage`, `HistoryPage`, `SettingsPage`, `ReviewPage`, `NotificationPage`)
- `src/components/ui/` — low-level UI primitives (Radix UI wrappers)
- `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)

Navigation is pure React state in `Layout` — no router library.

### Path alias

`#` resolves to `./src`. Use `#/components/...`, `#/lib/...`, etc. for all internal imports.

### Styling

Tailwind CSS v4 (Vite plugin). Prettier sorts Tailwind classes automatically on format. Dark-themed UI with a transparent, overlay-titlebar.

### Key config

- Window: 1200x800, transparent, `titleBarStyle: "Overlay"`, min 900x600
- Vite dev server: port 1420 (strict)
- `__APP_VERSION__` global injected from `package.json`
