<p align="center">
  <img src="src-tauri/icons/icon.png" width="72" alt="Raypaste logo" />
</p>

<h1 align="center">Raypaste</h1>

<p align="center">
  AI-powered text transformations in any app — triggered by a single hotkey.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey?style=flat-square" alt="Platform: macOS, Windows, Linux" />
  <img src="https://img.shields.io/badge/built%20with-Tauri%202.0-blue?style=flat-square" alt="Built with Tauri 2.0" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT License" />
  <img src="https://img.shields.io/badge/version-0.2.0-orange?style=flat-square" alt="Version 0.2.0" />
</p>

---

## What is Raypaste?

Raypaste is a native desktop app built with **Tauri 2.0** that brings fast, customizable, and intelligent AI responses to any text input — in any application.

Select text anywhere, hit **`Cmd+Ctrl+R`**, and Raypaste transforms it using your configured AI prompts. Results are written back inline or surfaced in a review overlay before you accept.

## Platform Support

| Platform | Status       | Notes                                                                                    |
| -------- | ------------ | ---------------------------------------------------------------------------------------- |
| macOS    | ✅ Supported | Full functionality                                                                       |
| Windows  | 🚧 Planned   | Requires porting focused-app detection and text read/write from macOS Accessibility APIs |
| Linux    | 🚧 Planned   | Same as Windows — AX/AppKit APIs need platform-specific replacements                     |

The core hotkey pipeline, LLM layer, and UI are cross-platform. The macOS-specific work is isolated to three Rust commands in `src-tauri/src/commands/`: `focused_app`, `text`, and `apps`. Contributions to add Windows/Linux support are very welcome — see [CONTRIBUTING.md](docs/CONTRIBUTING.md).

## Features

- **Universal** — works with any app: editors, browsers, terminals, design tools
- **Hotkey-driven** — `Cmd+Ctrl+R` triggers the full AI pipeline instantly
- **Per-app prompts** — assign different prompts to different applications
- **Review mode** — optionally preview and edit the AI output before accepting
- **Privacy-first direct mode** — your text goes straight to OpenRouter or Cerebras, never through Raypaste servers
- **Prompt library** — create, edit, and manage reusable prompt templates

## Tech Stack

| Layer         | Technology                               |
| ------------- | ---------------------------------------- |
| Desktop shell | [Tauri 2.0](https://v2.tauri.app) (Rust) |
| Frontend      | React 19 + TypeScript                    |
| Styling       | Tailwind CSS v4                          |
| State         | Zustand                                  |
| LLM providers | OpenRouter, Cerebras                     |

## Quick Start

```bash
# Install dependencies
pnpm install

# Start dev server + native window
pnpm tauri dev
```

For full setup instructions including prerequisites, see the **[getting started guide](docs/DEV_GETTING_STARTED.md)**.

## LLM Providers

Raypaste currently supports two **direct-to-provider** modes (your data never touches Raypaste servers):

- **[OpenRouter](https://openrouter.ai/)** — access to a wide range of models
- **[Cerebras](https://www.cerebras.ai/)** — ultra-fast inference

Configure your API keys in the app's Settings page.

## Contributing

Contributions are welcome — code, docs, bug reports, and feature ideas.
See **[CONTRIBUTING.md](docs/CONTRIBUTING.md)** to get started.

## License

MIT — see [LICENSE](LICENSE).
