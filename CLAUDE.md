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

# Generate a new DB migration after changing src/services/db/schema.ts
pnpm db:generate
```

There are no automated tests at this time.

## Architecture

This is a **Tauri 2.0** desktop app: a Rust backend exposes commands via `src-tauri/src/lib.rs`, and a React 19 + TypeScript frontend lives in `src/`.

### Core data flow

The hotkey **Cmd+Ctrl+R** triggers the entire pipeline:

1. Rust (`lib.rs`) intercepts the global shortcut via `tauri_plugin_global_shortcut`, calls into `commands::focused_app` and `commands::text` on the main thread, then emits `raypaste://hotkey-triggered` with `{ app, selected_text, target_pid }`.
2. Frontend (`src/hooks/useAICompletionListener.ts`) listens for that event, looks up the active prompt (per-app mapping → falls back to first prompt), calls the configured LLM client, then either writes back directly (`invoke("write_text_back")`) or opens the review overlay.
3. Completion is saved to local SQLite database and `raypaste://completion-saved` is emitted to notify observers (e.g., `HistoryPage`).

### Overlay system

`src/main.tsx` renders `<RenderWindow />`, which reads the `?overlay` query param and routes to the appropriate UI (`src/components/RenderWindow.tsx`):

- No params → main app (`<App />`)
- `?overlay=review` → `<ReviewPage />` (editable completion, accept/reject)
- `?overlay=toast` or `?overlay=progress` → `<NotificationPage />`

Overlay types are defined as constants in `src/lib/overlay.ts` (`OVERLAY.review`, `OVERLAY.toast`, `OVERLAY.progress`). Only valid known values are accepted — unknown strings fall through to `NotificationPage`.

Overlay windows are created programmatically via `src/services/overlayWindows.ts` using `WebviewWindow`. The review overlay passes data through `localStorage` using key `raypaste-pending-review` (exported as `REVIEW_STORAGE_KEY`).

### Local history & analytics

All completions are stored in a local SQLite database (`raypaste.db`) with full context:
- **Input/output** — original text, AI response, user edits (if review mode)
- **Metadata** — timestamp, app ID, prompt used, model, provider, tokens, duration
- **Status** — whether applied, dismissed, or error
- **Aggregates** — per-prompt and per-app statistics

Database is managed via Tauri's `tauri-plugin-sql` with schema in `src/services/db/schema.ts`.

`src/services/db/index.ts` exports:
- `listCompletions(limit, offset)` — paginated retrieval
- `saveCompletion(entry)` — persist + update aggregates
- `updateCompletionOutcome(id, finalText, wasApplied)` — record review action
- `getUsageStats()` — aggregate stats
- `deleteCompletion(id)` / `clearAllCompletions()` — cleanup

After each completion is saved, `useAICompletionListener` emits `raypaste://completion-saved`, which triggers `HistoryPage` to refresh.

#### Database migrations

Migrations use **drizzle-kit** for generation and run automatically at app startup via `PRAGMA user_version`.

**To make a schema change:**

1. Edit `src/services/db/schema.ts`
2. Run `pnpm db:generate` — drizzle-kit diffs the schema and writes a new `.sql` file to `src/services/db/migrations/`
3. Vite bundles the migration files as raw strings via `import.meta.glob`
4. On next app launch, `runMigrations()` in `db/index.ts` checks `PRAGMA user_version`, applies any pending migrations in order, and increments the version after each one

**Key details:**
- Migration files live in `src/services/db/migrations/` and are committed to the repo
- The drizzle-kit CLI only _generates_ SQL — it never connects to the runtime DB (which is accessed through Tauri's IPC bridge, not directly)
- `drizzle.config.ts` at the project root configures the generator
- Never edit generated migration files; create a new one instead

For details, see [LOCAL_HISTORY_STORAGE.md](docs/LOCAL_HISTORY_STORAGE.md).

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
- `src/components/Layout.tsx` — main app shell: holds `activePage` + `selectedPromptId` state, mounts `useAICompletionListener`
- `src/components/Sidebar/` — nav; `SidebarNav.tsx` defines the `Page` type
- `src/pages/`
  - `HistoryPage.tsx` — paginated completion log with stats bar, filtering, detail view, delete actions
  - `NewPromptPage.tsx` — create new prompt
  - `PromptPage.tsx` — edit/delete existing prompt
  - `AppsPage.tsx` — assign prompts to specific apps
  - `SettingsPage.tsx` — LLM provider/key config, review mode toggle
  - `ReviewPage.tsx` — overlay for reviewing AI output before applying
  - `NotificationPage.tsx` — toast + progress overlays
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
