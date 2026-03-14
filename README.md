<h1 align="center">
  <img src="public/raypaste-logo.png" width="48" alt="Raypaste logo" valign="middle" />
  Raypaste
</h1>

<p align="center">
  Fast and flexible AI responses in any app — triggered by a single hotkey.
</p>

<!-- Badges -->
<p align="center">
  <a href="docs/PLATFORM_COMPATIBILITY.md">
    <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey?style=flat-square" alt="Platform: macOS, Windows, Linux" />
  </a>
  <a href="https://v2.tauri.app/" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/built%20with-Tauri%202.0-blue?style=flat-square" alt="Built with Tauri 2.0" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT License" />
  </a>
</p>

---

## What is Raypaste?

Raypaste is a native desktop app built with **Tauri 2.0** that brings fast, customizable, and intelligent AI responses to any text input — in any application.

Select text anywhere, on Mac use hotkey `⌘ + Ctrl + R`, and Raypaste transforms it using your configured AI prompts. Results are written back inline or surfaced in a review overlay where you can accept, modify, or decline the changes.

## Platform Support

| Platform | Status                 | Notes                                                |
| -------- | ---------------------- | ---------------------------------------------------- |
| macOS    | ✅ **Fully supported** | Complete functionality                               |
| Windows  | ❌ Not supported       | Planned — requires platform-specific implementations |
| Linux    | ❌ Not supported       | Planned — requires platform-specific implementations |

Raypaste is currently **macOS-only**. While the UI and LLM layer are cross-platform, core integrations (app discovery, focused app detection, selected text capture, and text writeback) rely on macOS-specific APIs.

For detailed compatibility information and contributor guidance on cross-platform support, see **[PLATFORM_COMPATIBILITY.md](docs/PLATFORM_COMPATIBILITY.md)**.

## Features

- **Universal** — works with any app: editors, browsers, terminals, design tools
- **Hotkey-driven** — `⌘ + Ctrl + R` allows you to get an AI response in-place instantly.
- **Per-app prompts** — assign different prompts to different applications for custom repeated workflows
- **Review mode** — optionally preview and edit the AI output before accepting
- **Privacy-first direct mode** — for those wanting to keep data between you and your AI provider only, you can do so with direct-mode. Your prompt and input text goes straight to OpenRouter or Cerebras, never through Raypaste servers, and the output is returned only to your device
- **Prompt library** — create, edit, and manage reusable prompts for your needs
- **History** - view your usage stats and past AI responses (inputs, outputs, prompt used, etc)

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

For full setup instructions see the **[getting started guide](docs/DEV_GETTING_STARTED.md)**.

## LLM Providers

Raypaste currently supports two **direct-to-provider** modes (your data never touches Raypaste servers):

- **[OpenRouter](https://openrouter.ai/)** — access to a wide range of models
- **[Cerebras](https://www.cerebras.ai/)** — ultra-fast inference

Configure your API keys in the app's Settings page (API keys are stored on your device).

## Contributing

Contributions are welcome — code, docs, bug reports, and feature ideas.
See **[CONTRIBUTING.md](docs/CONTRIBUTING.md)** to get started.

## License

MIT — see [LICENSE](LICENSE).
