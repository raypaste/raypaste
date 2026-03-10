# Developers Getting Started Guide

If you have never run a Tauri app locally before check that you have the [prerequisites here](https://v2.tauri.app/start/prerequisites/)

## Running Raypaste Locally

```bash
# Install dependencies
pnpm install
# Run Raypaste frontend and backend
pnpm tauri dev
```

## API Keys and LLM Connections

Raypate offers 2 ways to get LLM completions **direct-to-provider** and in the future **raypaste-api**.
You can configure your options in the app settings.

### Direct to Provider

You can set one or both of [OpenRouter](https://openrouter.ai/) or [Cerebras](https://www.cerebras.ai/) API keys and select which one you want to route your requests through.

**(Privacy-first):** Your prompt, inputs, and outputs do not pass through Raypaste's servers and are not stored anywhere in our database. Your request goes from the app to OpenRouter or Cerebras directly and returns directly back to you. Please review OpenRouter and Cerebras' privacy policies on how they will interact with your personal/business data—generally when paying for usage and with settings properly configured this means your data stays private.

### Raypaste API

After the main Raypaste app functionalities are built; and running the app locally/privately is in a good spot, the internal Raypaste team will begin building out harnesses to improve our universal AI experience bringing fast, flexible, and most importantly useful AI completions to everyone's workflows.

## Contributing

Interested in adding a feature, fixing a bug, or adding documentation you wish you had? See our [contributing guide](docs/CONTRIBUTING.md).
