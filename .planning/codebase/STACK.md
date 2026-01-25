# Technology Stack

**Analysis Date:** 2026-01-25

## Languages

**Primary:**
- TypeScript 5.9.3 - All source code (`src/**/*.ts`), ESM modules
- JavaScript - Build scripts, Node.js runtime

**Secondary:**
- Swift - macOS app (`apps/macos/Sources/**/*.swift`)
- Kotlin - Android app (`apps/android/**/*.kt`)
- Shell - Deployment and CLI wrappers (`scripts/**/*.sh`)

## Runtime

**Environment:**
- Node.js 22.12.0 or later (required in `package.json`)
- Bun (optional, preferred for local development and script execution)

**Package Manager:**
- pnpm 10.23.0
- Lockfile: `pnpm-lock.yaml` (present and required)
- Workspace: Monorepo via `pnpm-workspace.yaml` (root + `ui/`, `extensions/`)

## Frameworks

**Core:**
- @mariozechner/pi-agent-core 0.49.3 - AI agent orchestration and runtime
- @mariozechner/pi-ai 0.49.3 - AI provider integrations
- @mariozechner/pi-coding-agent 0.49.3 - Code execution sandbox agent
- @mariozechner/pi-tui 0.49.3 - Terminal UI components

**Messaging Channels:**
- @whiskeysockets/baileys 7.0.0-rc.9 - WhatsApp Web client (Baileys)
- grammy 1.39.3 - Telegram Bot API client
- @grammyjs/runner 2.0.3 - Telegram bot sequential message handling
- @grammyjs/transformer-throttler 1.2.1 - Telegram API rate limiting
- @slack/bolt 4.6.0 - Slack app framework
- @slack/web-api 7.13.0 - Slack Web API client
- @line/bot-sdk 10.6.0 - LINE messaging platform SDK

**HTTP & Servers:**
- express 5.2.1 - Browser bridge and media server (`src/browser/`, `src/media/`)
- hono 4.11.4 - Lightweight HTTP framework
- ws 8.19.0 - WebSocket server
- body-parser 2.2.2 - Express middleware for request parsing

**Testing:**
- vitest 4.0.18 - Test runner (unit + integration)
- @vitest/coverage-v8 - V8 coverage provider
- Coverage thresholds: 70% lines/branches/functions/statements

**Build/Dev:**
- typescript 5.9.3 - TypeScript compiler
- oxlint 1.41.0 - Fast ESM linter (with type awareness)
- oxfmt 0.26.0 - Code formatter
- tsx 4.21.0 - TypeScript execution (development)
- rolldown 1.0.0-rc.1 - Bundler for plugin SDK

## Key Dependencies

**Critical:**

- @mariozechner/* (pi-agent-core, pi-ai, pi-coding-agent, pi-tui) - Agent runtime and provider support; pinned to 0.49.3
- @whiskeysockets/baileys 7.0.0-rc.9 - WhatsApp client; pre-release but critical for web-based WhatsApp support
- @agentclientprotocol/sdk 0.13.1 - Agent protocol for RPC communication
- zod 4.3.6 - Runtime schema validation and type safety
- @sinclair/typebox 0.34.47 - JSON schema generation (overridden to exact version in pnpm)

**Infrastructure:**

- @aws-sdk/client-bedrock 3.975.0 - AWS Bedrock for model discovery and inference
- sqlite-vec 0.1.7-alpha.2 - Vector search via SQLite extension (optional, requires libc detection)
- node:sqlite - Built-in Node.js SQLite database (Node 22+)
- sharp 0.34.5 - Image processing and codec detection
- pdfjs-dist 5.4.530 - PDF document parsing
- playwright-core 1.58.0 - Browser automation
- @napi-rs/canvas 0.1.88 (optional) - Canvas rendering for graphics
- node-llama-cpp 3.15.0 (optional) - Local LLM inference
- linkedom 0.18.12 - DOM parsing for link understanding
- @mozilla/readability 0.6.0 - Web content extraction

**Utilities & CLI:**

- commander 14.0.2 - CLI argument parsing
- @clack/prompts 0.11.0 - Interactive CLI prompts
- chalk 5.6.2 - Terminal color output
- osc-progress 0.3.0 - Progress spinner for CLI
- yaml 2.8.2 - YAML parsing/generation
- json5 2.2.3 - JSON5 support (comments, trailing commas)
- chokidar 5.0.0 - File system watcher (config reloading)
- tslog 4.10.2 - Structured logging

**Audio & Media:**

- node-edge-tts 1.2.9 - Text-to-speech synthesis (Edge TTS)
- file-type 21.3.0 - File type detection
- jszip 3.10.1 - ZIP archive handling

**Security & Auth:**

- proper-lockfile 4.1.2 - File-based locks for session safety
- detect-libc 2.1.2 - Detect system libc (for optional deps)
- undici 7.19.0 - HTTP client with connection pooling

**Device/Network:**

- @homebridge/ciao 1.3.4 - mDNS/Bonjour service discovery
- @lydell/node-pty 1.2.0-beta.3 - Pseudo-terminal support (for remote shells)

**Other:**

- jiti 2.6.1 - Runtime module loading (for plugin SDK)
- tar 7.5.4 - Tar archive handling
- croner 9.1.0 - Cron job scheduling
- qrcode-terminal 0.12.0 - QR code generation for terminal
- long 5.3.2 - 64-bit integer support
- markdown-it 14.1.0 - Markdown parsing
- chromium-bidi 13.0.1 - Chromium DevTools Protocol bridge
- cli-highlight 2.1.11 - Syntax highlighting in terminal
- ajv 8.17.1 - JSON Schema validator
- dotenv 17.2.3 - `.env` file loading
- @buape/carbon 0.14.0 - Pinned exact (0.14.0) - internal utility

## Optional Dependencies

- `@napi-rs/canvas` - Native canvas for rendering (complex graphics)
- `node-llama-cpp` - Local LLM inference (Llama 2/Mistral)

## Configuration

**Environment:**

Built via `loadConfig()` (`src/config/config.ts`). Config precedence:
1. CLI flags
2. `~/.clawdbot/config.json` (or `CLAWDBOT_CONFIG_PATH`)
3. Environment variables (e.g., `TELEGRAM_BOT_TOKEN`, `LINE_CHANNEL_ACCESS_TOKEN`)
4. Defaults in `src/config/defaults.ts`

**Key Configs Required:**

- `TELEGRAM_BOT_TOKEN` - Telegram bot token (channel activation)
- `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET` - LINE messaging
- `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` - Slack workspace
- `ANTHROPIC_API_KEY` - Anthropic Claude models (or OAuth via `ANTHROPIC_OAUTH_TOKEN`)
- `OPENAI_API_KEY` - OpenAI API (optional, for GPT models)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` - AWS Bedrock
- `CLAUDE_AI_SESSION_KEY`, `CLAUDE_WEB_SESSION_KEY`, `CLAUDE_WEB_COOKIE` - Web-based Claude access

**Build:**

- TypeScript: `tsconfig.json` (target: ES2022, module: NodeNext, strict mode)
- Linting: `.oxlintrc.json` (oxlint config with type-aware rules)
- Pre-commit: `.pre-commit-config.yaml` (automated format/lint checks)

## Platform Requirements

**Development:**

- Node.js 22.12+
- pnpm 10.23+
- macOS/Linux/Windows (with WSL support)
- Git for version control
- Optional: Bun for faster script execution

**Production:**

- Node.js 22.12+ runtime
- Docker (via `Dockerfile` - Node 22 + Bun)
- Fly.io (via `fly.toml` for hosted deployments)
- Optional: SQLite extension (`sqlite-vec`) for vector search
- Optional: Playwright browser instance for web automation

**Architecture-Specific:**

- x86_64 (primary, used in CI/Fly.io)
- ARM64 (supported; Docker build handles architecture detection)
- Synology/ARM systems note: Force pnpm for UI build (Bun may fail)

---

*Stack analysis: 2026-01-25*
