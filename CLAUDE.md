# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm tauri dev        # Development (starts Vite + Tauri dev window)
pnpm tauri build      # Production build
pnpm lint / lint:fix  # Lint
pnpm format           # Format (Prettier sorts Tailwind classes)
pnpm check            # Lint + format together
pnpm db:generate      # Generate migration after editing src/services/db/schema.ts
```

No automated tests.

## Architecture

**Tauri 2.0** desktop app — Rust backend (`src-tauri/src/lib.rs`) + React 19/TypeScript frontend (`src/`).

### Core data flow

Hotkey **Cmd+Ctrl+R** triggers the pipeline:

1. **Hotkey intercept** (Rust): `lib.rs` intercepts via `tauri_plugin_global_shortcut`, calls `commands::focused_app` + `commands::text` on the main thread, emits `raypaste://hotkey-triggered` with `{ app, selected_text, target_pid }`.

2. **Completion flow** (`src/hooks/useAICompletionListener.ts`):
   - Resolves active prompt (per-app mapping → `formal` fallback → first prompt in list)
   - Creates `AbortController` for cancellation support
   - Branches to **review mode** or **instant mode**:
     - **Review mode**: Opens review overlay in loading state → streams completion chunks via `raypaste://stream-chunk` → emits `raypaste://stream-done` when complete → ReviewPage transitions to edit state
     - **Instant mode**: Opens progress overlay → streams completion → writes text back via `invoke("write_text_back")` → closes progress overlay directly via `progressWin.close()`

3. **Cancellation**: User presses Esc → overlay emits `raypaste://[stream|instant]-cancel` → main window aborts controller → in-flight stream throws `AbortError` → window closes gracefully

4. **Persistence**: Completion saved to SQLite; `raypaste://completion-saved` emitted to refresh `HistoryPage`.

### Overlay system

`src/main.tsx` → `<RenderWindow />` routes on `?overlay` query param:

- _(none)_ → `<App />` (main window)
- `?overlay=review` → `<ReviewPage />` (streaming text, editable, accept/reject)
- `?overlay=progress` → `<ProgressPage />` (instant mode: centered spinner + Esc-to-cancel)
- `?overlay=toast` → `<NotificationPage />` (error/success toast)

**Overlay creation** (`src/services/overlayWindows.ts`):

- `showReviewOverlay()` — creates 560×460 centered window for review mode
- `showProgressOverlay()` — creates 280×52 centered window for instant mode loading
- `showToastOverlay()` — creates small notification at bottom-right

**Data passing:**

- **Review mode**: Initial loading state written to `localStorage[REVIEW_STORAGE_KEY]` before window opens. Main window streams chunks via `raypaste://stream-chunk` events. Final state committed via `raypaste://stream-done`.
- **Instant mode**: Main window directly closes the progress overlay via `progressWin.close()` when done (no cross-window events needed).

**Window lifecycle:** Main window holds the `WebviewWindow` handle and is responsible for cleanup. Overlays can emit cancel events (`raypaste://stream-cancel`, `raypaste://instant-cancel`) to trigger abort.

**Tauri capabilities** (`src-tauri/capabilities/`):

- `default.json` — main window permissions including `core:window:allow-close` (to close overlays)
- `overlay.json` — `notification-*` and `progress-*` windows with `core:window:allow-close` + `core:event:allow-emit`
- `review.json` — `review-*` windows with event emission and dragging

### State management

Zustand + `persist` (localStorage), all re-exported from `src/stores/index.ts`:

- `settingsStore` — LLM mode (`"direct"` | `"api"`), provider (`"openrouter"` | `"cerebras"`), API keys, model, `reviewMode`, `themeMode` (`"light"` | `"dark"` | `"auto"`)
- `promptsStore` — CRUD; each prompt has `appIds[]`. App assignments are **exclusive** — `assignAppToPrompt` removes the app from all other prompts.
- `appsStore` — macOS installed apps list (via `commands::apps::list_apps`)

### LLM service layer

`src/services/llm/index.ts` exports `getLLMClient()` / `getApiKey()` (read `settingsStore` at call time):

- `VITE_DRY_RUN=true` → `dryRunClient` (takes priority over all other settings; `getApiKey()` returns `"dry-run"`)
- `mode: "api"` → `raypasteApiClient` (hosted, coming soon — throws on any call)
- `mode: "direct"` + `provider: "cerebras"` → `cerebrasClient`
- `mode: "direct"` + `provider: "openrouter"` → `openrouterClient`

**Streaming & Cancellation** (`src/services/llm/*.ts`):

- Both clients implement `.stream(req, apiKey, onChunk, signal)` for real-time token delivery
- `signal: AbortSignal` passed from main window's `AbortController`
- OpenRouter/Cerebras: SSE stream parsing with abort support (fetch signal interrupts connection)
- Dry run: simulates streaming with abort checking between word delays
- Usage data not available during streaming (null placeholder); full stats captured in completion record

### Database (SQLite via `tauri-plugin-sql`)

Schema: `src/services/db/schema.ts`. `src/services/db/index.ts` exports:
`listCompletions`, `saveCompletion`, `updateCompletionOutcome`, `getUsageStats`, `deleteCompletion`, `clearAllCompletions`.

**Schema changes:** edit schema → `pnpm db:generate` → commit the new `.sql` in `src/services/db/migrations/`. Migrations run automatically at startup via `PRAGMA user_version`. Never edit generated migration files.

### Rust commands

`src-tauri/src/commands/` — three modules:

- `apps::list_apps` / `get_icon_base64` / `get_icon_base64_for_icns`
- `focused_app::get_focused_app` / `get_frontmost_pid` — NSWorkspace/NSRunningApplication (ObjC2) bundle ID + PID
- `focused_app::activate_app` — re-activates a target app by PID (used in instant mode to return focus)
- `text::get_selected_text` / `write_text_back` — AX read/write

All AppKit/AX calls must run on the main thread (`run_on_main_thread`).

**App icons:** `.icns` → PNG conversion + caching pipeline — see `docs/APP_ICONS.md`.

### Frontend conventions

- Path alias: `#` → `./src` (use `#/components/...`, `#/services/...`, etc.)
- Navigation: pure React state in `Layout.tsx` — no router library
- Pages in `src/pages/`, UI primitives in `src/components/ui/` (Radix UI wrappers)
- Tailwind CSS v4; dark-themed, transparent overlay-titlebar window (1200×800, min 900×600)
- `__APP_VERSION__` global injected from `package.json`; Vite dev server on port 1420
