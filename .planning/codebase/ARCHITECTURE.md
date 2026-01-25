# Architecture

**Analysis Date:** 2026-01-25

## Pattern Overview

**Overall:** Multi-layered CLI + daemon gateway with pluggable channel adapters and extensible agent runtime.

**Key Characteristics:**
- **Monolithic codebase** with core functionality in `src/`, extensible via plugins in `extensions/`
- **Channel abstraction layer** enabling multiple messaging platforms (Telegram, WhatsApp, Discord, Slack, Signal, iMessage, Line, Google Chat, etc.)
- **Gateway server pattern** running as daemon/menubar app, serving CLI and web UI control surfaces
- **Plugin-based extensibility** with typed interfaces (`ChannelPlugin`, `ClawdbotPluginApi`) for channels, tools, hooks, and services
- **Agent-first runtime** supporting Pi agents (from @mariozechner) with tool execution, session persistence, and auth profiles
- **Configuration-driven** with Zod schemas, multi-profile support, and hot-reload capabilities

## Layers

**CLI Layer:**
- Purpose: Command-line interface for all user operations (send, agent management, config, onboarding)
- Location: `src/cli/`, `src/commands/`
- Contains: Command handlers, argument parsing, progress/prompt utilities, program builder using Commander.js
- Depends on: Config, routing, channel adapters, infra
- Used by: End users, automation scripts, tests

**Gateway Server:**
- Purpose: Long-running daemon serving real-time channel monitoring, agent execution, and WebSocket connections
- Location: `src/gateway/`, `src/daemon/`
- Contains: WebSocket server, message routing, auth handling, heartbeat runners, protocol handlers
- Depends on: Channels, agents, config, infra, plugins
- Used by: CLI (for remote operations), web UI, mobile apps via WebSocket

**Channel Layer:**
- Purpose: Unified interface for messaging platforms (adapters for each provider)
- Location: `src/telegram/`, `src/discord/`, `src/slack/`, `src/signal/`, `src/imessage/`, `src/line/`, `src/channels/` (shared)
- Contains: Message send/receive, account auth, media handling, mention/reaction gating
- Depends on: Config, types, infra, plugins
- Used by: Gateway, CLI, auto-reply system

**Agent/Provider Layer:**
- Purpose: LLM provider integrations and agent execution runtime
- Location: `src/agents/`, `src/providers/`
- Contains: Pi agent runner (embedded), provider auth (Anthropic, OpenAI, etc.), tool execution, auth profiles
- Depends on: Config, memory, hooks, security
- Used by: Gateway via heartbeat runners, CLI for one-off agent calls

**Configuration Layer:**
- Purpose: Load, validate, and persist user configuration (agents, channels, auth, policies)
- Location: `src/config/`, `src/sessions/`
- Contains: Zod schemas, JSON5 parsing, hot-reload watcher, session store (SQLite)
- Depends on: Types, infra
- Used by: All layers during initialization and at runtime

**Plugin System:**
- Purpose: Enable third-party channels, tools, hooks, and services without modifying core
- Location: `src/plugins/`, `extensions/`
- Contains: Plugin registry (global), interface definitions, HTTP route registration, loader
- Depends on: Types, config
- Used by: Gateway at boot to load and register extensions

**Shared Infrastructure:**
- Purpose: Cross-cutting concerns (logging, env, ports, binaries, security)
- Location: `src/infra/`, `src/logging/`, `src/security/`
- Contains: Exec approvals, heartbeat runners, outbound message delivery, error handling, bonjour discovery
- Depends on: Types, config
- Used by: All layers

**Utilities:**
- Purpose: Helpers and data transformation (media, markdown, memory, TTS)
- Location: `src/media/`, `src/markdown/`, `src/memory/`, `src/tts/`, `src/media-understanding/`, `src/utils.ts`
- Contains: PDF/image processing, emoji parsing, message history, voice generation
- Depends on: Config, types, infra
- Used by: Agent tools, channel adapters, auto-reply

**Auto-Reply Engine:**
- Purpose: Template-based message generation with history context
- Location: `src/auto-reply/`
- Contains: Template evaluation, history management, chunk modes, reply tokens
- Depends on: Config, utils
- Used by: Gateway for generating replies, CLI for message sending

**Routing Layer:**
- Purpose: Map inbound messages to correct agent + session based on config bindings
- Location: `src/routing/`
- Contains: Agent route resolution (by peer/guild/team/account), session key derivation
- Depends on: Config, agents
- Used by: Gateway message handler

## Data Flow

**Inbound (Message Arrival):**

1. Channel adapter receives message (via polling, webhook, or real-time API)
2. Adapter normalizes to `ChannelMessage` type, extracts metadata (sender, target, attachments)
3. Gateway message handler (`src/gateway/server/ws-connection/message-handler.ts`) receives it
4. Route resolver (`src/routing/resolve-route.ts`) maps to agent + session based on bindings
5. If no routing match, responder checks `channels.default` or drops silently
6. Message queued in heartbeat runner for agent processing
7. Auto-reply system generates response with history context
8. Response sent back through same channel adapter

**Outbound (CLI Send):**

1. CLI command validates target and channel
2. Creates deps object (`src/cli/deps.ts`) with send functions for all channels
3. Calls appropriate `sendMessage*` function (e.g., `sendMessageWhatsApp`)
4. Channel adapter connects to provider API, sends message
5. Returns success/failure result to CLI

**Agent Execution:**

1. Heartbeat runner processes message for agent
2. Pi agent receives message history + tools
3. Agent reasons and calls tools via `src/agents/tools/` handlers
4. Tool results fed back to agent in loop
5. Final response text extracted
6. Auto-reply engine applies chunking and templates
7. Outbound message delivery (`src/infra/outbound/`) sends to channels

**State Management:**

- **Session state:** `~/.clawdbot/sessions/` (SQLite) stores agent conversations per session key
- **Config state:** `~/.clawdbot/` stores config.json5, credentials, OAuth tokens
- **Plugin registry:** Global singleton (`src/plugins/runtime.ts`) populated at boot
- **Channel state:** In-memory per-channel (e.g., Discord session token, WhatsApp listeners)

## Key Abstractions

**ChannelPlugin:**
- Purpose: Interface for channels to hook into gateway lifecycle
- Examples: `extensions/discord/`, `extensions/slack/`, `src/channels/web/`
- Pattern: Define adapters (`ChannelMessagingAdapter`, `ChannelAuthAdapter`, etc.), register via plugin system

**ChannelAdapter Types:**
- `ChannelMessagingAdapter`: Send/receive messages
- `ChannelAuthAdapter`: Login/logout flow
- `ChannelOutboundAdapter`: Deliver messages to provider
- `ChannelGatewayAdapter`: Participate in gateway lifecycle
- `ChannelSecurityAdapter`: Allowlist/mention gating
- Tools/commands/reactions adapters for platform-specific capabilities

**Routing Bindings:**
- Purpose: Declarative mapping of messages to agents
- Structure: Array of `{ channel?, peer?, guild?, team?, account?, agentId }` objects
- Resolution order: peer-specific → guild/team-specific → account → channel default → global default

**Auth Profiles:**
- Purpose: Multiple credential sets for same provider, with fallback ordering
- Types: API key, OAuth (with refresh), custom vendor auth
- Located in: `src/agents/auth-profiles/`

## Entry Points

**CLI Entry:**
- Location: `src/entry.ts`
- Triggers: User runs `clawdbot <command>`
- Responsibilities: Respawn with proper NODE_OPTIONS, normalize Windows argv, apply profile env, load CLI program

**CLI Main:**
- Location: `src/cli/run-main.ts`
- Triggers: After entry.ts respawn validation
- Responsibilities: Parse commands, dispatch to handler, exit with code

**Gateway Boot:**
- Location: `src/gateway/boot.ts`
- Triggers: User runs `clawdbot gateway run`
- Responsibilities: Load config, initialize channels, load plugins, start WebSocket server, attach cleanup handlers

**Plugin Loader:**
- Location: `src/plugins/` (jiti-based dynamic import)
- Triggers: Gateway boot
- Responsibilities: Discover extensions, call plugin factory functions, register adapters in global registry

**Index Module:**
- Location: `src/index.ts`
- Triggers: Package import or direct execution
- Responsibilities: Install error handlers, set up logging capture, parse profile args, build program, run CLI

## Error Handling

**Strategy:** Fail-fast validation at CLI entry with detailed error messages; graceful degradation at runtime (log and continue).

**Patterns:**
- `assertSupportedRuntime()`: Check Node version before any work
- `PortInUseError`: Handled with port retry logic and advice
- `ChannelAuthError`: Triggers re-auth flow in gateway; safe retry in CLI
- Unhandled rejections: Caught globally, logged with context, exit code 1
- Channel adapter errors: Logged to channel-specific sink, retry on next heartbeat

## Cross-Cutting Concerns

**Logging:** Dual approach
- `src/logging.ts`: Captures all console output to structured logs
- `src/logger.ts`: Named logger with verbose mode via `CLAWDBOT_VERBOSE=1`
- Channel-specific sinks for message handler errors

**Validation:** Zod schemas throughout
- Core config: `src/config/zod-schema.js` (providers, channels, agents)
- Plugin config: `ChannelConfigSchema` type in each plugin
- Request payloads: Zod in gateway handlers

**Authentication:** Multi-provider, multi-profile
- Config-driven: `config.agents.profiles` lists available auth
- Fallback: If first profile fails, try next in order
- Refresh: OAuth tokens auto-refreshed before expiry
- Device auth: macOS menubar app handles sensitive flows

**Concurrency:** Session-based message serialization
- Each agent session is single-threaded via heartbeat runner
- Multiple sessions can run in parallel (per agent, per peer, etc.)
- Channel adapters may buffer messages (e.g., Telegram bot polling)
- WebSocket handlers are async but stateless
