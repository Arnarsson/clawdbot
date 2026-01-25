# Coding Conventions

**Analysis Date:** 2026-01-25

## Naming Patterns

**Files:**
- Source: kebab-case (e.g., `agent-paths.ts`, `event-mapper.ts`, `send-reactions.ts`)
- Tests: match source with `.test.ts` suffix (e.g., `agent-paths.test.ts`)
- Live tests: `.live.test.ts` suffix for tests requiring real API keys
- E2E tests: `.e2e.test.ts` suffix for end-to-end tests
- Type/interface exports: PascalCase (e.g., `AcpClientOptions`, `GatewayAttachment`)

**Functions:**
- camelCase for all function names
- Exported functions: descriptive verbs (e.g., `extractTextFromPrompt`, `ensureClawdbotAgentEnv`, `resolveClawdbotAgentDir`)
- Private/internal: descriptive, no leading underscore convention
- Format examples from codebase: `formatToolTitle`, `inferToolKind`, `validateSenderIdentity`, `normalizeTestText`

**Variables:**
- camelCase for all variables and constants
- Const arrays/maps: `const pendingPrompts = new Map<string, PendingPrompt>()`
- Boolean flags: `enabled`, `configured`, `verbose` patterns
- Type-keyed maps: use descriptive keys (e.g., `pendingPrompts`, `accounts`)

**Types:**
- PascalCase for all type and interface names (e.g., `AcpClientHandle`, `PendingPrompt`, `MsgContext`, `SessionEntry`)
- Generic types: `T` for single generic, otherwise descriptive (e.g., `GatewayAttachment`, `ChannelOutboundAdapter`)
- Result types: `{ ok: boolean; ... }` pattern for operation results (seen in `applySessionsPatchToStore`)

## Code Style

**Formatting:**
- Tool: Oxfmt (Rust-based formatter for JavaScript/TypeScript)
- Invoked via: `pnpm format` (check mode), `pnpm format:fix` (write mode)
- Run `pnpm lint:fix` for combined oxlint fix + oxfmt
- Configuration: implicitly configured by Oxfmt defaults (no `.oxfmt.json` file needed)

**Linting:**
- Tool: Oxlint (Rust-based linter)
- Config file: `.oxlintrc.json`
- Plugins: `unicorn`, `typescript`, `oxc`
- Strictness: `correctness` category set to `error`
- Run: `pnpm lint` (check mode), `pnpm lint:fix` (auto-fix mode)
- Full type-aware mode: `oxlint --type-aware`
- Pre-commit: enforced via git hooks

**TypeScript Strict Mode:**
- `strict: true` in `tsconfig.json`
- All files must use strict type checking
- Avoid `any` type; use generics, unions, or `unknown` with type narrowing
- Type annotations required for function parameters and returns

## Import Organization

**Order:**
1. Node.js built-in modules (`import ... from "node:..."`; always use `node:` prefix)
2. Third-party packages (e.g., `@agentclientprotocol/sdk`, `vitest`)
3. Internal imports (e.g., `../config/config.js`, `./event-mapper.js`; always use `.js` extension)

**Path Aliases:**
- Alias: `clawdbot/plugin-sdk` → `src/plugin-sdk/index.ts`
- Import format: `import ... from "clawdbot/plugin-sdk"`
- Only used for plugin SDK exports; regular code uses relative paths

**Examples from codebase:**
```typescript
// src/acp/client.ts
import { spawn, type ChildProcess } from "node:child_process";
import * as readline from "node:readline";
import { Readable, Writable } from "node:stream";

import {
  ClientSideConnection,
  PROTOCOL_VERSION,
  ndJsonStream,
  type RequestPermissionRequest,
  type SessionNotification,
} from "@agentclientprotocol/sdk";

import { ensureClawdbotCliOnPath } from "../infra/path-env.js";
```

**Type imports:**
- Use `type` keyword for type-only imports: `import type { SessionEntry } from "..."`
- Separate type imports from value imports (though both in same `import` line OK)

## Error Handling

**Patterns:**
- Throw descriptive errors for exceptional conditions: `throw new Error("Session ${sessionId} not found")`
- Use try/catch for async operations that might fail
- Error messages include context (IDs, values that caused failure)
- No custom error classes observed; use standard `Error`

**Examples from codebase:**
```typescript
// src/acp/translator.ts
try {
  const result = await this.gateway.talk(...);
} catch (err) {
  this.log(`failed to handle prompt: ${err}`);
  pending.reject(err);
}
```

**Result objects pattern:**
```typescript
// src/gateway/sessions-patch.ts (seen in tests)
const res = await applySessionsPatchToStore({...});
if (!res.ok) return; // Early exit pattern
expect(res.entry.elevatedLevel).toBe("on");
```

## Logging

**Framework:** console (no external logging library)

**Patterns:**
- `console.log()` for standard output (tool updates, session info)
- `console.error()` for error/debug messages with prefix
- Prefixed format: `[module-name] message` (e.g., `[acp] ready`, `[acp-client] spawning: ...`)
- Conditional logging via options: `const log = verbose ? (msg: string) => console.error(...) : () => {}`
- Logging is opt-in via `verbose` flag in constructor options

**Examples:**
```typescript
// src/acp/translator.ts
this.log = opts.verbose ? (msg: string) => process.stderr.write(`[acp] ${msg}\n`) : () => {};
this.log("ready");
this.log(`gateway disconnected: ${reason}`);

// src/acp/client.ts
console.log(`[tool] ${update.title} (${update.status})`);
```

## Comments

**When to Comment:**
- Non-obvious logic branching (e.g., `if (block.type !== "image") continue;`)
- Workarounds or intentional quirks
- Complex type narrowing or guard conditions
- Not required for straightforward code flow

**JSDoc/TSDoc:**
- Minimal; primary focus on types and signatures
- Not observed as a widespread convention
- When used: describe purpose of exported functions

**Examples from codebase:**
```typescript
// Minimal inline comment for intent
// Ensure Vitest environment is properly set
process.env.VITEST = "true";
```

## Function Design

**Size:**
- Guideline: keep under ~700 LOC per file (not a hard rule, split/refactor for clarity/testability)
- Examples observed: `event-mapper.ts` (73 LOC), `agent-paths.ts` (20 LOC), `translator.ts` (424 LOC)

**Parameters:**
- Prefer object destructuring for multiple parameters
- Type objects explicitly (e.g., `opts: AcpClientOptions`)
- Optional fields use `?` in type definition, not function overloads

**Example:**
```typescript
export function extractAttachmentsFromPrompt(prompt: ContentBlock[]): GatewayAttachment[] {
  const attachments: GatewayAttachment[] = [];
  for (const block of prompt) {
    // ...
  }
  return attachments;
}
```

**Return Values:**
- Explicit return type annotations required
- Use specific types, not `any` or `unknown`
- Early returns preferred for guard conditions

## Module Design

**Exports:**
- Use `export function`, `export type`, `export const`
- Group exports logically at module level
- No default exports observed; use named exports
- Helper functions kept private (no `export` keyword)

**Example structure:**
```typescript
// src/acp/event-mapper.ts
export type GatewayAttachment = { /* ... */ };

export function extractTextFromPrompt(prompt: ContentBlock[]): string {
  // ...
}

export function extractAttachmentsFromPrompt(prompt: ContentBlock[]): GatewayAttachment[] {
  // ...
}
```

**Barrel Files:**
- Not widely used; typically import from specific modules
- Extensions allowed: `extensions/*/index.ts` as module entry point
- Core code imports from individual modules (e.g., `from "../acp/event-mapper.js"`)

## Async Patterns

**Async/await:**
- Preferred over `.then()` chains
- Functions that call async operations must be `async`
- Error handling via try/catch

**Examples:**
```typescript
// src/agents/agent-paths.test.ts
await fs.mkdtemp(path.join(os.tmpdir(), "clawdbot-agent-"));
const resolved = resolveClawdbotAgentDir();

// src/test/helpers/poll.ts
export async function pollUntil<T>(
  fn: () => Promise<T | null | undefined>,
  opts: PollOptions = {},
): Promise<T | undefined> {
  // ...
}
```

## Code Organization by Feature

**Directory-per-feature pattern:**
- Feature code in named directory: `src/acp/`, `src/agents/`, `src/channels/`
- All code for feature in same directory
- Tests colocated with source: `event-mapper.ts` + `event-mapper.test.ts` in same directory
- Helpers in `test-helpers.ts` within `src/` if used across tests

---

*Convention analysis: 2026-01-25*
