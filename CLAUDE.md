# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (starts Vite + Tauri dev window)
pnpm tauri dev

# Production build
pnpm tauri build

# Frontend only (Vite, no Tauri window)
pnpm dev

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

### Frontend structure

- `src/main.tsx` — React root mount
- `src/App.tsx` — renders `<Layout />`
- `src/components/Layout.tsx` — top-level shell: holds `activePage` state, renders `<TitleBar>`, `<Sidebar>`, and the active page component
- `src/components/Sidebar/` — sidebar nav; `SidebarNav.tsx` defines the `Page` type (`"new-prompt" | "apps" | "history"`)
- `src/pages/` — one file per page (`NewPromptPage`, `AppsPage`, `HistoryPage`)
- `src/components/ui/` — low-level UI primitives (Radix UI wrappers)
- `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)

Navigation is pure React state in `Layout` — no router library.

### Path alias

`#` resolves to `./src`. Use `#/components/...`, `#/lib/...`, etc. for all internal imports.

### Styling

Tailwind CSS v4 (Vite plugin). Prettier sorts Tailwind classes automatically on format. Dark-themed UI with a transparent, overlay-titlebar window (macOS traffic lights on right side).

### Rust backend

`src-tauri/src/lib.rs` registers Tauri commands with `invoke_handler`. Add new commands here and call them from the frontend via `@tauri-apps/api`.

### Key config

- Window: 1200x800, transparent, `titleBarStyle: "Overlay"`, min 900x600
- Vite dev server: port 1420 (strict)
- `__APP_VERSION__` global injected from `package.json`
- React Compiler enabled via `babel-plugin-react-compiler`
