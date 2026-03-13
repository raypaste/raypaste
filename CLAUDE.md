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

1. Rust (`lib.rs`) intercepts via `tauri_plugin_global_shortcut`, calls `commands::focused_app` + `commands::text` on the main thread, emits `raypaste://hotkey-triggered` with `{ app, selected_text, target_pid }`.
2. `src/hooks/useAICompletionListener.ts` listens, resolves active prompt (per-app mapping → `defaultPromptId` fallback), calls LLM client, then either `invoke("write_text_back")` or opens the review overlay.
3. Completion is saved to SQLite; `raypaste://completion-saved` is emitted to refresh `HistoryPage`.

### Overlay system

`src/main.tsx` → `<RenderWindow />` routes on `?overlay` query param:
- _(none)_ → `<App />` (main window)
- `?overlay=review` → `<ReviewPage />` (editable completion, accept/reject)
- `?overlay=toast|progress` → `<NotificationPage />`

Constants live in `src/lib/overlay.ts`. Overlays are created via `src/services/overlayWindows.ts` (`WebviewWindow`). Review overlay passes data via `localStorage` key `raypaste-pending-review` (`REVIEW_STORAGE_KEY`).

### State management

Zustand + `persist` (localStorage), all re-exported from `src/stores/index.ts`:
- `settingsStore` — LLM mode (`"direct"` | `"api"`), provider (`"openrouter"` | `"cerebras"`), API keys, model, `reviewMode`
- `promptsStore` — CRUD; each prompt has `appIds[]`. App assignments are **exclusive** — `assignAppToPrompt` removes the app from all other prompts.
- `appsStore` — macOS installed apps list (via `commands::apps::list_apps`)

### LLM service layer

`src/services/llm/index.ts` exports `getLLMClient()` / `getApiKey()` (read `settingsStore` at call time):
- `mode: "api"` → `raypasteApiClient` (hosted, coming soon)
- `mode: "direct"` + `provider: "cerebras"` → `cerebrasClient`
- `mode: "direct"` + `provider: "openrouter"` → `openrouterClient`

### Database (SQLite via `tauri-plugin-sql`)

Schema: `src/services/db/schema.ts`. `src/services/db/index.ts` exports:
`listCompletions`, `saveCompletion`, `updateCompletionOutcome`, `getUsageStats`, `deleteCompletion`, `clearAllCompletions`.

**Schema changes:** edit schema → `pnpm db:generate` → commit the new `.sql` in `src/services/db/migrations/`. Migrations run automatically at startup via `PRAGMA user_version`. Never edit generated migration files.

### Rust commands

`src-tauri/src/commands/` — three modules:
- `apps::list_apps`
- `focused_app::get_focused_app` / `get_frontmost_pid` — AXUIElement bundle ID + PID
- `text::get_selected_text` / `write_text_back` — AX read/write

All AppKit/AX calls must run on the main thread (`run_on_main_thread`).

**App icons:** `.icns` → PNG conversion + caching pipeline — see `docs/APP_ICONS.md`.

### Frontend conventions

- Path alias: `#` → `./src` (use `#/components/...`, `#/services/...`, etc.)
- Navigation: pure React state in `Layout.tsx` — no router library
- Pages in `src/pages/`, UI primitives in `src/components/ui/` (Radix UI wrappers)
- Tailwind CSS v4; dark-themed, transparent overlay-titlebar window (1200×800, min 900×600)
- `__APP_VERSION__` global injected from `package.json`; Vite dev server on port 1420
