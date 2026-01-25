# Testing Patterns

**Analysis Date:** 2026-01-25

## Test Framework

**Runner:**
- Vitest
- Multiple config files for different test suites:
  - `vitest.config.ts` - Main config (unit + integration tests)
  - `vitest.unit.config.ts` - Unit tests only (excludes `src/gateway/**`, `extensions/**`)
  - `vitest.e2e.config.ts` - End-to-end tests
  - `vitest.live.config.ts` - Live tests (real API keys via `CLAWDBOT_LIVE_TEST=1`)
  - `vitest.gateway.config.ts` - Gateway-specific tests
  - `vitest.extensions.config.ts` - Extension tests

**Assertion Library:**
- Vitest's built-in `expect()` (Jest-compatible)

**Run Commands:**
```bash
pnpm test                     # Run all tests (via test-parallel.mjs, respects CI workers)
pnpm test:watch              # Watch mode
pnpm test:coverage           # Coverage report with V8 provider
pnpm test:e2e                # End-to-end tests only
pnpm test:live               # Live tests (requires CLAWDBOT_LIVE_TEST=1)
pnpm test:live               # Also supports LIVE=1 for provider tests
pnpm test:docker:live-models # Docker-based live model tests
pnpm test:docker:live-gateway # Docker-based live gateway tests
pnpm test:docker:onboard     # Docker-based onboarding E2E tests
```

## Test File Organization

**Location:**
- Colocated with source code in same directory
- Example: `src/acp/event-mapper.ts` + `src/acp/event-mapper.test.ts`
- E2E tests in `test/` directory: `test/gateway.multi.e2e.test.ts`, `test/inbound-contract.providers.test.ts`

**Naming:**
- Unit/integration: `*.test.ts` (e.g., `agent-paths.test.ts`)
- E2E tests: `*.e2e.test.ts` (e.g., `gateway.multi.e2e.test.ts`)
- Live tests: `*.live.test.ts` (e.g., `anthropic.setup-token.live.test.ts`)

**Structure:**
```
src/
├── acp/
│   ├── event-mapper.ts
│   ├── event-mapper.test.ts
│   ├── translator.ts
│   ├── session-mapper.ts
│   └── session-mapper.test.ts
├── agents/
│   ├── agent-paths.ts
│   ├── agent-paths.test.ts
│   └── agent-scope.test.ts
└── ... (949 test files total)

test/
├── setup.ts           # Global test setup/fixtures
├── global-setup.ts    # Vitest global setup hook
├── test-env.ts        # Test environment initialization
├── fixtures/          # Test data and fixtures
├── helpers/           # Test helper utilities
├── mocks/             # Mock implementations
└── *.e2e.test.ts      # E2E test files
```

## Test Configuration Details

**Vitest Settings** (`vitest.config.ts`):
```typescript
test: {
  testTimeout: 120_000,           // 2 minutes per test
  hookTimeout: 180_000 (Windows) / 120_000 (Unix)
  pool: "forks",                  // Process isolation per test file
  maxWorkers: 3 (CI) / 4-16 (local, based on CPU count)
  setupFiles: ["test/setup.ts"],  // Global setup
  include: [
    "src/**/*.test.ts",
    "extensions/**/*.test.ts",
    "test/format-error.test.ts",
  ],
  exclude: [
    "**/*.live.test.ts",          // Require explicit CLAWDBOT_LIVE_TEST=1
    "**/*.e2e.test.ts",           // Require explicit vitest.e2e.config.ts
  ],
}
```

**Coverage Configuration:**
- Provider: V8
- Thresholds (enforced):
  - Lines: 70%
  - Functions: 70%
  - Branches: 55%
  - Statements: 70%
- Includes: `src/**/*.ts`
- Excludes:
  - Test files themselves (`src/**/*.test.ts`)
  - Entrypoints/CLI (covered via CI smoke + manual/e2e)
  - `src/cli/**`, `src/commands/**`, `src/daemon/**`, `src/hooks/**`, `src/macos/**`
  - Agent integrations validated via manual/e2e: `src/agents/model-scan.ts`, `src/agents/sandbox.ts`, etc.
  - Gateway server integration surfaces: `src/gateway/control-ui.ts`, `src/gateway/server-*.ts`
  - Channel surfaces (integration-tested separately): `src/discord/**`, `src/slack/**`, `src/telegram/**`, etc.
  - TUI/wizard (interactive, validated via manual/e2e): `src/tui/**`, `src/wizard/**`

## Test Structure

**Suite Organization:**
```typescript
// src/acp/event-mapper.test.ts
import { describe, expect, it } from "vitest";

import { extractAttachmentsFromPrompt, extractTextFromPrompt } from "./event-mapper.js";

describe("acp event mapper", () => {
  it("extracts text and resource blocks into prompt text", () => {
    const text = extractTextFromPrompt([
      { type: "text", text: "Hello" },
      { type: "resource", resource: { text: "File contents" } },
    ]);

    expect(text).toBe("Hello\nFile contents\n[Resource link (Spec)] https://example.com");
  });

  it("extracts image blocks into gateway attachments", () => {
    const attachments = extractAttachmentsFromPrompt([
      { type: "image", data: "abc", mimeType: "image/png" },
      { type: "text", text: "ignored" },
    ]);

    expect(attachments).toEqual([
      { type: "image", mimeType: "image/png", content: "abc" },
    ]);
  });
});
```

**Patterns:**
- Setup: `beforeEach()` for test-local state
- Teardown: `afterEach()` for cleanup (env vars, temp files)
- Global teardown: `afterAll()` in setup file
- Isolation: Each test function is independent

**Example with env var cleanup:**
```typescript
// src/agents/agent-paths.test.ts
describe("resolveClawdbotAgentDir", () => {
  const previousStateDir = process.env.CLAWDBOT_STATE_DIR;
  const previousAgentDir = process.env.CLAWDBOT_AGENT_DIR;
  let tempStateDir: string | null = null;

  afterEach(async () => {
    if (tempStateDir) {
      await fs.rm(tempStateDir, { recursive: true, force: true });
      tempStateDir = null;
    }
    // Restore original env vars
    if (previousStateDir === undefined) {
      delete process.env.CLAWDBOT_STATE_DIR;
    } else {
      process.env.CLAWDBOT_STATE_DIR = previousStateDir;
    }
  });

  it("defaults to the multi-agent path when no overrides are set", async () => {
    tempStateDir = await fs.mkdtemp(path.join(os.tmpdir(), "clawdbot-agent-"));
    process.env.CLAWDBOT_STATE_DIR = tempStateDir;
    delete process.env.CLAWDBOT_AGENT_DIR;

    const resolved = resolveClawdbotAgentDir();

    expect(resolved).toBe(path.join(tempStateDir, "agents", "main", "agent"));
  });
});
```

## Mocking

**Framework:** Vitest's `vi` module (compatible with Jest)

**Patterns:**
```typescript
// src/signal/send-reactions.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const rpcMock = vi.fn();

vi.mock("../config/config.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../config/config.js")>();
  return {
    ...actual,
    loadConfig: () => ({}),
  };
});

vi.mock("./client.js", () => ({
  signalRpcRequest: (...args: unknown[]) => rpcMock(...args),
}));

describe("sendReactionSignal", () => {
  beforeEach(() => {
    rpcMock.mockReset().mockResolvedValue({ timestamp: 123 });
    vi.resetModules();
  });

  it("uses recipients array and targetAuthor for uuid dms", async () => {
    const { sendReactionSignal } = await loadSendReactions();
    await sendReactionSignal("uuid:123e4567-e89b-12d3-a456-426614174000", 123, "🔥");

    expect(rpcMock).toHaveBeenCalledWith("sendReaction", expect.any(Object), expect.any(Object));
    const params = rpcMock.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(params.recipients).toEqual(["123e4567-e89b-12d3-a456-426614174000"]);
  });
});
```

**What to Mock:**
- External API calls (Signal RPC, Discord API, etc.)
- File system operations (fs.mkdtemp, fs.rm in fixture setup)
- Config loading
- Service dependencies injected as options
- Process/child process interactions

**What NOT to Mock:**
- Pure utility functions (formatting, parsing, validation)
- Business logic that's tested
- Date/time only if specific behavior required (use real current time in most cases)
- Internal module imports unless they cross boundaries (channels, services)

**Hoisting pattern:**
```typescript
const rpcMock = vi.fn();

const loadSendReactions = async () => await import("./send-reactions.js");

beforeEach(() => {
  rpcMock.mockReset().mockResolvedValue({ timestamp: 123 });
  vi.resetModules();  // Reset module cache for fresh import
});
```

## Fixtures and Factories

**Test Data:**
```typescript
// test/setup.ts - Global stubs for channels
const createStubPlugin = (params: {
  id: ChannelId;
  label?: string;
  aliases?: string[];
  deliveryMode?: ChannelOutboundAdapter["deliveryMode"];
  preferSessionLookupForAnnounceTarget?: boolean;
}): ChannelPlugin => ({
  id: params.id,
  meta: {
    id: params.id,
    label: params.label ?? String(params.id),
    selectionLabel: params.label ?? String(params.id),
    docsPath: `/channels/${params.id}`,
    blurb: "test stub.",
    aliases: params.aliases,
    preferSessionLookupForAnnounceTarget: params.preferSessionLookupForAnnounceTarget,
  },
  // ...
});
```

**Location:**
- `test/setup.ts` - Global fixtures and setup (runs for all tests)
- `test/fixtures/` - Test data files
- `test/helpers/` - Utility functions for tests (e.g., `poll.ts`, `envelope-timestamp.ts`)
- `test/mocks/` - Mock implementations
- Colocated test data: test file can define local test data

**Helper examples:**
```typescript
// test/helpers/poll.ts
export type PollOptions = {
  timeoutMs?: number;
  intervalMs?: number;
};

export async function pollUntil<T>(
  fn: () => Promise<T | null | undefined>,
  opts: PollOptions = {},
): Promise<T | undefined> {
  const timeoutMs = opts.timeoutMs ?? 2000;
  const intervalMs = opts.intervalMs ?? 25;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const value = await fn();
    if (value) return value;
    await sleep(intervalMs);
  }
  return undefined;
}

// test/helpers/normalize-text.ts
export function normalizeTestText(input: string): string {
  return stripAnsi(input)
    .replaceAll("\r\n", "\n")
    .replaceAll("…", "...")
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "?");
}

// test/helpers/inbound-contract.ts
export function expectInboundContextContract(ctx: MsgContext) {
  expect(validateSenderIdentity(ctx)).toEqual([]);
  expect(ctx.Body).toBeTypeOf("string");
  // ...
}
```

## Async Testing

**Pattern:**
- Mark test function as `async`
- Use `await` for async operations
- Errors bubble up naturally

```typescript
// src/agents/agent-paths.test.ts
it("defaults to the multi-agent path when no overrides are set", async () => {
  tempStateDir = await fs.mkdtemp(path.join(os.tmpdir(), "clawdbot-agent-"));
  process.env.CLAWDBOT_STATE_DIR = tempStateDir;

  const resolved = resolveClawdbotAgentDir();

  expect(resolved).toBe(path.join(tempStateDir, "agents", "main", "agent"));
});
```

## Error Testing

**Pattern:**
- Use `expect(...).toThrow()` or `expect(...).rejects.toThrow()`
- Test error messages with regex matching

```typescript
// Gateway sessions patch test (inferred pattern)
test("rejects invalid elevatedLevel values", async () => {
  const res = await applySessionsPatchToStore({
    cfg: {} as ClawdbotConfig,
    store: {},
    storeKey: "agent:main:main",
    patch: { elevatedLevel: "invalid" },
  });
  expect(res.ok).toBe(false);
  // Verify error details in res
});
```

## Test Types

**Unit Tests:**
- Scope: Single function or module in isolation
- Mocking: External dependencies, file system
- Location: `src/**/*.test.ts`
- Included in: `pnpm test` (via vitest.config.ts, excluding e2e/live)

**Integration Tests:**
- Scope: Multiple modules working together
- Mocking: External APIs only (Discord RPC, Signal RPC, etc.), not inter-module calls
- Location: `src/**/*.test.ts` (same pattern as unit tests)
- Example: `test/inbound-contract.providers.test.ts` tests channel providers with config

**E2E Tests:**
- Scope: Full end-to-end flows (gateway startup, message routing, etc.)
- Mocking: Minimal, uses actual code paths
- Location: `test/*.e2e.test.ts` or `src/**/*.e2e.test.ts`
- Config: `vitest.e2e.config.ts`
- Run: `pnpm test:e2e`
- Examples: `test/gateway.multi.e2e.test.ts`, `test/media-understanding.auto.e2e.test.ts`

**Live Tests:**
- Scope: Real API calls with actual credentials
- When to run: Integration environment, local validation
- Location: `src/**/*.live.test.ts`
- Config: `vitest.live.config.ts`
- Env var: `CLAWDBOT_LIVE_TEST=1` or `LIVE=1`
- Run: `pnpm test:live`
- Excluded from CI: `**/*.live.test.ts` in default vitest.config.ts

## Coverage

**Requirements:** 70% minimum (lines, functions, statements); 55% branches

**View Coverage:**
```bash
pnpm test:coverage    # Generate coverage report
# Output: text + lcov (open coverage/index.html in browser)
```

**Excluded from coverage (intentionally):**
- Entrypoints: `src/entry.ts`, `src/index.ts`, `src/runtime.ts`
- CLI: `src/cli/**`, `src/commands/**` (covered by smoke tests + manual)
- Infrastructure: `src/daemon/**`, `src/hooks/**`, `src/macos/**`
- Agent integrations: `src/agents/model-scan.ts`, `src/agents/sandbox.ts` (validated via e2e)
- Channel surfaces: `src/discord/**`, `src/slack/**`, `src/telegram/**`, `src/imessage/**` (integration-tested)
- Gateway server: `src/gateway/server*.ts`, `src/gateway/protocol/**` (e2e validated)
- Interactive UI: `src/tui/**`, `src/wizard/**` (manual validation)

## Common Test Patterns

**Setting/restoring env vars:**
```typescript
const previousValue = process.env.VAR_NAME;

afterEach(() => {
  if (previousValue === undefined) {
    delete process.env.VAR_NAME;
  } else {
    process.env.VAR_NAME = previousValue;
  }
});

it("test", () => {
  process.env.VAR_NAME = "test-value";
  // ...
});
```

**Temp file cleanup:**
```typescript
let tempDir: string | null = null;

afterEach(async () => {
  if (tempDir) {
    await fs.rm(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
});

it("test", async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "prefix-"));
  // ...
});
```

**Result object pattern (result.ok check):**
```typescript
it("test result handling", async () => {
  const res = await someOperation();
  expect(res.ok).toBe(true);
  if (!res.ok) return;  // Early exit on failure
  expect(res.entry.field).toBe("value");
});
```

**Mocking with partial overrides:**
```typescript
vi.mock("../module.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../module.js")>();
  return {
    ...actual,                    // Keep other exports
    loadConfig: () => ({...}),    // Override specific exports
  };
});
```

## Testing Guidelines (from CLAUDE.md)

- Run `pnpm test` before pushing changes to logic
- Do not set test workers above 16 (causes issues)
- Pure test additions/fixes generally do NOT need changelog entries
- Mobile app testing: check for connected real devices (iOS + Android) before using simulators
- Prefer Bun for TypeScript test execution when possible
- Docker-based tests for full integration validation

---

*Testing analysis: 2026-01-25*
