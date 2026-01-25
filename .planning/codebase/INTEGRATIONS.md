# External Integrations

**Analysis Date:** 2026-01-25

## APIs & External Services

**Messaging Platforms:**
- **Telegram** - Bot API via `grammy` (1.39.3)
  - SDK: grammy, @grammyjs/runner, @grammyjs/transformer-throttler
  - Auth: `TELEGRAM_BOT_TOKEN` (environment variable)
  - Webhook: Polling (long-polling via Bot.start()) or webhook callback (via `webhookCallback` from grammy)
  - Implementation: `src/telegram/`

- **WhatsApp Web** - Browser-based via Baileys
  - SDK: @whiskeysockets/baileys 7.0.0-rc.9
  - Auth: QR code scan (session storage in `~/.clawdbot/sessions/`)
  - Implementation: `src/web/`, `src/whatsapp/` (provider-web.ts)
  - Session persistence: SQLite or JSON (stored in `~/.clawdbot/sessions/`)

- **Slack** - App framework with Bolt
  - SDK: @slack/bolt (4.6.0), @slack/web-api (7.13.0)
  - Auth: `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` (OAuth tokens)
  - Webhook: Event subscriptions (Slack events push to gateway via webhook)
  - Implementation: `src/slack/monitor/provider.ts`, `src/slack/actions.ts`

- **LINE** - Messaging SDK
  - SDK: @line/bot-sdk (10.6.0)
  - Auth: `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET`
  - Webhook: LINE sends events via HTTP POST to `/channels/line/webhook`
  - Implementation: `src/line/webhook.ts`, `src/line/monitor.ts`

- **Discord** - REST API
  - SDK: discord-api-types (0.38.37) (types only; manual REST calls)
  - Auth: Discord bot token (stored in gateway config)
  - REST: Direct HTTP calls to Discord API (no official SDK)
  - Implementation: `src/discord/api.ts`, `src/discord/send.ts`

- **Signal** - Signal Protocol
  - SDK: Custom implementation via signalCliProxy
  - Auth: Signal account credentials (phone + password)
  - Webhook: N/A (polling-based)
  - Implementation: `src/signal/` (signalCliProxy integration)

- **iMessage** - Apple Messages
  - SDK: Native macOS framework (via Swift)
  - Auth: Local Apple account (authenticated user)
  - Webhook: N/A (local push notifications)
  - Implementation: `apps/macos/Sources/`, `src/imessage/`

- **Matrix** - Matrix protocol (extension)
  - Location: `extensions/matrix/`
  - Implementation: Plugin-based integration

## Data Storage

**Databases:**

- **SQLite** (primary)
  - Connection: Built-in `node:sqlite` (Node 22+)
  - Usage: Session storage, config persistence, memory/embeddings
  - Paths: `~/.clawdbot/sessions/`, `~/.clawdbot/memory/`, `~/.clawdbot/config/`
  - Vector search: Optional `sqlite-vec` extension (0.1.7-alpha.2) for semantic search

**No Traditional ORM:**
- Sessions and config use direct SQLite queries (via node:sqlite DatabaseSync)
- No Prisma, TypeORM, or Sequelize

**File Storage:**

- **Local filesystem only** - No cloud storage integration
  - Session files: `~/.clawdbot/sessions/` (WhatsApp QR/auth)
  - Credentials: `~/.clawdbot/credentials/` (encrypted OAuth tokens, API keys)
  - Workspace: Configured via `CLAWDBOT_AGENT_DIR` or `~/.clawdbot/agents/`
  - Media cache: Temporary files in `~/.clawdbot/media/`

**Caching:**

- None detected (no Redis/Memcached)
- In-memory caches: Built-in via Map/Set for session lookups, message deduplication
- SQLite serves as both persistent + query cache

## Authentication & Identity

**Auth Provider:**

- **Custom multi-provider system** (no single auth provider)

**Implementation:**

- `src/agents/auth-profiles.ts` - Stores API key profiles (Anthropic, OpenAI, Bedrock, etc.)
- `src/agents/cli-credentials.ts` - Syncs with Claude CLI OAuth tokens
- `src/commands/auth-choice.apply.*.ts` - Provider-specific auth flows:
  - `auth-choice.apply.anthropic.ts` - Anthropic API key or OAuth
  - `auth-choice.apply.openai.ts` - OpenAI API key
  - `auth-choice.apply.oauth.ts` - Generic OAuth (Chutes-based)

**OAuth Integrations:**

- **Anthropic OAuth** - Via Claude CLI sync or manual token exchange
  - Env: `ANTHROPIC_OAUTH_TOKEN`
  - Flow: Requires Claude CLI for user consent

- **GitHub Copilot** - Via Copilot provider
  - Auto-detection and token injection in config

**Channel-Specific Auth:**

- Telegram: Token in config
- Slack: OAuth 2.0 scopes (interactive flow, see `src/slack/scopes.ts`)
- LINE: Channel access token + channel secret
- Discord: Bot token (manual setup)
- WhatsApp: QR code scan (session-based)
- Signal: Phone number + password

## Monitoring & Observability

**Error Tracking:**

- None detected (no Sentry, Rollbar, or similar)
- Errors logged to `tslog` (structured JSON logging)

**Logs:**

- **Approach:** tslog (0.4.10.2) - JSON structured logging
- **Levels:** debug, info, warn, error, fatal
- **Output:** stdout (development), file (production via Docker logs)
- **Location:** `src/logging/subsystem.ts` per-subsystem loggers
- **Subsystem tracking:** Logging context per channel/agent/operation

**Debug Flags:**

- `CLAWDBOT_CLAUDE_CLI_LOG_OUTPUT=1` - Claude CLI output
- `CLAWDBOT_DEBUG_MEMORY_EMBEDDINGS=1` - Memory/embedding debug
- `CLAWDBOT_DEBUG_TELEGRAM_ACCOUNTS=1` - Telegram auth debug
- `CLAWDBOT_DEBUG_HEALTH=1` - Health check verbosity

## CI/CD & Deployment

**Hosting:**

- **Fly.io** (via `fly.toml`)
  - Region: iad (primary; configurable)
  - VM: shared-cpu-2x, 2048MB
  - Storage: `clawdbot_data` volume for persistent state
  - Env: `NODE_ENV=production`, `CLAWDBOT_STATE_DIR=/data`

- **Docker** (via `Dockerfile`)
  - Base: Node 22-bookworm
  - Build: pnpm install, TypeScript build, UI build
  - Runtime: `node dist/index.js`

**CI Pipeline:**

- GitHub Actions (`.github/workflows/`)
- Pre-commit checks: oxlint, oxfmt (via `.pre-commit-config.yaml`)
- Tests: Vitest (unit + e2e + integration)
- Live tests: Real API keys (Anthropic, OpenAI, etc.) for provider validation

## Environment Configuration

**Required env vars:**

- `ANTHROPIC_API_KEY` or `ANTHROPIC_OAUTH_TOKEN` - Claude models
- `TELEGRAM_BOT_TOKEN` - Telegram channel
- `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` - Slack workspace
- `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET` - LINE channel
- `CLAWDBOT_GATEWAY_TOKEN` - Gateway authentication (auto-generated if missing)

**Optional env vars (model providers):**

- `OPENAI_API_KEY` - OpenAI GPT models
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_PROFILE` - Bedrock
- `OPENROUTER_API_KEY` - OpenRouter (multi-model)
- `BRAVE_API_KEY` - Brave Search (web search tool)
- `MINIMAX_API_KEY`, `MINIMAX_BASE_URL` - Minimax (via Anthropic Messages API)
- `PERPLEXITY_API_KEY` - Perplexity (web search)
- `ZAI_API_KEY`, `Z_AI_API_KEY` - Z.AI (various aliases)
- `KIMICODE_API_KEY` - KimiCode
- `VENICE_API_KEY` - Venice AI
- `SYNTHETIC_API_KEY` - Synthetic API

**Claude Web Access (browser-based):**

- `CLAUDE_AI_SESSION_KEY` - claude.ai session (browser automation)
- `CLAUDE_WEB_SESSION_KEY` - claude.ai web session
- `CLAUDE_WEB_COOKIE` - claude.ai cookie (for authenticated requests)

**Secrets location:**

- `.env` file (optional, loaded via `dotenv`)
- GitHub Secrets (for Actions)
- Environment at runtime (Fly.io, Docker, local shell)
- `~/.clawdbot/credentials/` - Encrypted OAuth tokens (web provider only)

**Build/Runtime Env:**

- `NODE_ENV=production` (production) or development
- `CLAWDBOT_STATE_DIR=/data` (Docker) or `~/.clawdbot` (default)
- `CLAWDBOT_PREFER_PNPM=1` - Force pnpm on ARM (Synology)
- `NODE_OPTIONS=--max-old-space-size=1536` - Memory limit (production)

## Webhooks & Callbacks

**Incoming Webhooks:**

- **Telegram:** Via `grammy` webhook callback (optional; polling default)
  - Endpoint: `POST /channels/telegram/webhook` (if configured)
  - Validation: Telegram signature verification

- **Slack:** Event subscriptions
  - Endpoint: `POST /slack/events` (auto-subscribed via OAuth flow)
  - Validation: Slack signing secret (`X-Slack-Signature`)

- **LINE:** Message webhook
  - Endpoint: `POST /channels/line/webhook`
  - Validation: X-Line-Signature header

- **Discord:** N/A (polling via REST)

- **WhatsApp Web:** N/A (polling via Baileys)

- **iMessage:** N/A (local push notifications)

**Outgoing Webhooks/Callbacks:**

- **Chutes OAuth:** Custom OAuth redirect handler
  - Callback: `clawdbot://oauth/callback` or `http://localhost:PORT/callback`
  - Location: `src/commands/chutes-oauth.ts`

- **Google Gemini OAuth:** CLI-based auth
  - Callback: Browser-based (user manually authorizes in Google Cloud Console)

- **GitHub Copilot:** Environment-based token retrieval (no callback)

## Gateway Architecture

**Gateway Server** (`src/gateway/`):

- Listens on `localhost:18789` (default) or configured port
- Accepts incoming messages from all channels
- Routes to agent for processing
- Sends replies back to origin channel
- Optional: Fly.io hosted (force_https, persistent connections)

**Browser Bridge Server** (`src/browser/`):

- Express server (port 18790 default)
- Manages Playwright browser sessions
- Agent contract execution via JSON schema
- Canvas rendering support (optional)

**Canvas Host** (`src/canvas-host/`):

- Node.js HTTP server for graphics rendering
- Serves rendered UI components to agents

## Plugin/Extension System

**Plugin Discovery:**

- Bundled plugins: `dist/plugins/bundled/` → `src/plugins/bundled-dir.ts`
- Workspace plugins: `~/.clawdbot/plugins/` (runtime-installed)
- Extensions: Monorepo packages in `extensions/` (e.g., `extensions/matrix`, `extensions/msteams`)

**Plugin SDK:**

- Exported from `dist/plugin-sdk/` (TypeScript types + runtime)
- Plugins use `jiti` for runtime module loading
- Runtime deps in plugin `package.json`, dev deps in root

---

*Integration audit: 2026-01-25*
