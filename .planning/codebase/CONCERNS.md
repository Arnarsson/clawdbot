# Codebase Concerns

**Analysis Date:** 2026-01-25

## Tech Debt

**Workspace Dependencies in Extensions:**
- Issue: 7 extensions use `"clawdbot": "workspace:*"` in `dependencies` instead of `devDependencies` or `peerDependencies`. According to CLAUDE.md, this breaks `npm install --omit=dev` during plugin installation.
- Files: `extensions/nostr/package.json`, `extensions/zalo/package.json`, `extensions/zalouser/package.json`, `extensions/msteams/package.json`, `extensions/googlechat/package.json`, `extensions/line/package.json`, `extensions/matrix/package.json`
- Impact: Extension runtime dependencies break when installed via `npm install --omit=dev`; plugin startup fails with missing `clawdbot` module references
- Fix approach: Move `clawdbot` to `devDependencies` or `peerDependencies` in affected extensions; ensure plugin SDK imports use `jiti` alias fallback

**Type Safety Casting:**
- Issue: 96 instances of `as any` across 30 files bypass TypeScript type checking
- Files: `src/gateway/tools-invoke-http.ts` (4), `src/tui/tui-event-handlers.test.ts` (12), `src/gateway/client.ts` (1), and others
- Impact: Type errors slip through undetected; tool invocation, event handling, and client operations lack compile-time validation
- Fix approach: Replace `as any` with proper generic types or type guards; add stricter TSConfig settings

**Synchronous File I/O:**
- Issue: 1164 occurrences of `readFileSync`, `writeFileSync`, `existsSync` across 374 files
- Files: Primary concern in `src/config/`, `src/infra/`, `src/agents/` modules
- Impact: Blocks event loop during file operations; can cause gateway hangs during large session reads/writes or high concurrency
- Fix approach: Audit hot paths for sync I/O; prioritize gateway operations and session management; prefer async alternatives where possible

## Known Bugs

**Voice Call Incomplete Hangup:**
- Symptoms: Inbound calls may not be properly hung up when rejected
- Files: `extensions/voice-call/src/manager.ts` (line 564), `extensions/voice-call/src/manager/events.ts` (line 92)
- Trigger: Incoming call from non-allowlisted number; call record created but hangup not invoked
- Workaround: Manual call termination from platform side; may require service restart

**MS Teams Large File Upload:**
- Symptoms: Files >4MB cannot be uploaded to MS Teams
- Files: `extensions/msteams/src/graph-upload.ts` (line 27)
- Trigger: Attempting to send files larger than 4MB
- Workaround: Compress or split files before upload; resumable upload session not implemented

## Security Considerations

**Shell Command Allowlist Validation:**
- Risk: Bash command execution relies on allowlist patterns; insufficient validation on dynamic command composition
- Files: `src/agents/bash-tools.exec.ts` (1495 LOC), `src/infra/exec-approvals.ts` (1267 LOC)
- Current mitigation: Allowlist pattern matching with `evaluateShellAllowlist()`, approval request system with socket-based token verification
- Recommendations: Add AST-level command parsing for complex shell pipelines; log all approval decisions with timestamps; audit allowlist patterns quarterly; consider rate limiting exec requests

**Sync Token & Password Storage:**
- Risk: Gateway auth tokens and passwords stored in `exec-approvals.json` as plaintext
- Files: `src/infra/exec-approvals.ts` (config file: `~/.clawdbot/exec-approvals.json`)
- Current mitigation: File permissions should be restrictive (600); socket-based approval forwarding for remote execution
- Recommendations: Use native credential storage (`libsecret` on Linux, Keychain on macOS); add `--secure` mode to encrypt tokens at rest

**Device Pairing Public Key Validation:**
- Risk: Device public keys used for authentication; signature skew tolerance is 10 minutes
- Files: `src/gateway/server/ws-connection/message-handler.ts` (line 61: `DEVICE_SIGNATURE_SKEW_MS = 10 * 60 * 1000`)
- Current mitigation: `verifyDeviceSignature()` checks timestamp; `normalizeDevicePublicKeyBase64Url()` validates format
- Recommendations: Add nonce replay detection; implement cert pinning for known devices; audit skew tolerance in high-security deployments

**Web Auto-Reply Message Timeout:**
- Risk: WhatsApp Web auto-reply session can hang indefinitely if no messages arrive after 30 minutes
- Files: `src/web/auto-reply/monitor.ts` (line 156: `MESSAGE_TIMEOUT_MS = 30 * 60 * 1000`)
- Current mitigation: Timeout defined but not actively enforced in all code paths
- Recommendations: Add explicit session watchdog; implement heartbeat polling; validate timeout enforcement in all auto-reply branches

## Performance Bottlenecks

**Memory Embedding Batch Processing:**
- Problem: OpenAI/Gemini embedding requests processed in single-threaded batch loops with polling
- Files: `src/memory/batch-openai.ts` (208-242: infinite `while(true)` poll loop), `src/memory/batch-gemini.ts` (similar pattern)
- Cause: Polling interval defaults to 30 seconds; 50k request batches serialized; no parallel batch submission
- Improvement path: Implement batch submission queuing; pre-allocate request chunks; reduce poll interval for smaller batches; cache embeddings aggressively

**Large File Parsing:**
- Problem: Session transcript chunking and memory indexing load entire files into memory then re-chunk
- Files: `src/memory/internal.ts` (lines 73-196: chunking logic), `src/memory/manager.ts` (line 703: `BEGIN` transaction for bulk insert)
- Cause: No streaming parser; re-chunking during sync; transaction writes all vectors before commit
- Improvement path: Implement streaming parser for large transcripts; use incremental sync with checkpoints; batch vector inserts by page size

**Concurrent Embedding Index Concurrency:**
- Problem: Embedding index concurrency hardcoded to 4 workers
- Files: `src/memory/manager.ts` (line 99: `EMBEDDING_INDEX_CONCURRENCY = 4`)
- Cause: Fixed value doesn't adapt to CPU cores or available memory; may be too low for machines with many cores
- Improvement path: Make configurable; detect CPU cores dynamically; implement backpressure when memory usage exceeds threshold

**Database Query Without Indexes:**
- Problem: Session filename search and chunk path filtering missing targeted indexes
- Files: `src/memory/manager.ts` (lines 470-480: path/source filtering)
- Cause: `idx_chunks_path` and `idx_chunks_source` created after table creation; query planner may not use efficiently
- Improvement path: Add composite index on `(source, path)` for most common queries; analyze query plans quarterly

## Fragile Areas

**Error Handling in Silent Catch Blocks:**
- Files: `src/security/fix.ts` (lines 240, 269, 335, 349, 362, 369 use `.catch(() => null/[])`)
- Why fragile: Errors silently return empty results; caller can't distinguish between "not found" and "error occurred"
- Safe modification: Add logging to catch blocks; return error tuples instead of empty values; distinguish expected vs unexpected errors
- Test coverage: Minimal; no negative test cases for most `.catch()` blocks

**Device ID Derivation:**
- Files: `src/gateway/server/ws-connection/message-handler.ts` (lines 6-8: device identity imports), `src/infra/device-identity.ts`
- Why fragile: Public key format normalization is complex; small parsing changes break device mapping
- Safe modification: Add round-trip tests for key normalization; test with real device keys from each platform; version the format explicitly
- Test coverage: Unit tests exist but may lack edge cases for malformed keys

**Plugin Package Resolution at Runtime:**
- Files: `src/plugins/runtime/index.ts`, `src/agents/clawdbot-tools.ts`
- Why fragile: Plugins resolved via `require.resolve()` and `jiti` with workspace fallback; no validation that all deps are available
- Safe modification: Pre-validate plugin manifest during load; test plugin in isolation before adding to agent tools; add plugin health check on startup
- Test coverage: Plugin integration tests exist but may not cover missing dependency scenarios

**Memory Index Schema Migrations:**
- Files: `src/memory/memory-schema.ts` (lines 77-93: `ensureColumn()` with `ALTER TABLE`)
- Why fragile: Schema migrations run without versioning; no rollback mechanism; concurrent access during migration can deadlock
- Safe modification: Implement schema versioning; add migration guards (exclusive lock); test migrations on large databases (10GB+)
- Test coverage: Basic schema creation tested but not concurrent writes during migration

**WebSocket Message Framing:**
- Files: `src/gateway/server/ws-connection/message-handler.ts` (1-200: message parsing)
- Why fragile: Protocol version validation minimal; malformed frames may cause parsing errors without clear recovery
- Safe modification: Add frame validation before deserialization; implement strict schema validation; add protocol version negotiation
- Test coverage: Happy path tested; malformed frame handling not explicitly covered

## Scaling Limits

**Embedding Batch API Limits:**
- Current capacity: OpenAI batches limited to 50,000 requests; Gemini similar
- Limit: Single memory sync hitting limit requires batching logic; max batch size ~8000 tokens
- Scaling path: Implement request queue with dynamic batching; add retry backoff with exponential delay; cache embeddings to avoid duplicate requests

**SQLite Vector Extension Load:**
- Current capacity: sqlite-vec extension loads in-memory; no limit documented
- Limit: Large vector tables (>1M embeddings) may exceed available RAM; extension load timeout is hardcoded to 10 seconds
- Scaling path: Implement lazy loading; add compression for vector storage; migrate to dedicated vector DB for >10M embeddings

**Heartbeat Queue Processing:**
- Current capacity: Single heartbeat runner processes all agents sequentially
- Limit: With >50 agents, heartbeat delivery may lag; approvals block the queue
- Scaling path: Implement agent-level heartbeat workers; parallelize delivery within concurrency limits; add queue metrics

**WebSocket Connection Buffering:**
- Current capacity: `MAX_BUFFERED_BYTES` and `MAX_PAYLOAD_BYTES` limits defined in `src/gateway/server-constants.js`
- Limit: Large tool outputs or media streaming may exceed buffer; behavior on overflow not documented
- Scaling path: Add streaming support for large messages; implement message chunking; queue overflow mitigation

## Dependencies at Risk

**workspace:\* in Extension Dependencies:**
- Risk: Using workspace protocol in `dependencies` breaks npm install; affects plugin distribution
- Impact: Users installing extensions via npm get broken plugins missing core runtime
- Migration plan: Remove all `workspace:*` from extension `dependencies`; move to `devDependencies` for testing; use jiti alias for runtime resolution

**TypeScript `as any` Patterns:**
- Risk: Type safety erosion increases refactoring risk; future type changes not caught
- Impact: Tool invocation errors, client bugs, event handler failures surface at runtime
- Migration plan: Audit top 10 files by `as any` count; add stricter type boundaries; implement type-checking CI gate

**Infinite Polling Loops:**
- Risk: `while (true)` in batch processing may hang indefinitely if timeout logic fails
- Impact: Embedding operations freeze; memory indexing stalls
- Migration plan: Add explicit iteration counters; implement circuit breaker on repeated failures; add structured logging for loop exits

## Missing Critical Features

**Resumable Upload for Large Files:**
- Problem: MS Teams file uploads limited to 4MB due to missing resumable session implementation
- Blocks: Users cannot send files >4MB to Teams; team collaboration scenarios hindered
- Related: `extensions/msteams/src/graph-upload.ts`

**Streaming Response Support:**
- Problem: Responses with large tool outputs or media may buffer entirely before sending
- Blocks: Progressive response delivery to users (streaming partial results)
- Related: Gateway response handling; no explicit streaming framework in place

**Plugin Health Check on Startup:**
- Problem: Plugins loaded without validation that all dependencies are available
- Blocks: Runtime errors from missing plugin deps discovered late; affects stability
- Related: `src/plugins/loader.ts`, plugin runtime resolution

## Test Coverage Gaps

**Silent Error Paths:**
- What's not tested: Error branches in `.catch(() => null/[])` throughout security and file modules
- Files: `src/security/fix.ts`, `src/security/audit.ts`, `src/web/session.ts` (15+ instances)
- Risk: File I/O failures, permission errors, config loading errors not caught by tests
- Priority: High - affects user onboarding and recovery

**Device Pairing Edge Cases:**
- What's not tested: Signature skew boundary conditions; expired keys; key rotation scenarios
- Files: `src/infra/device-pairing.ts`, `src/gateway/server/ws-connection/message-handler.ts`
- Risk: Device auth bypass or false rejections in edge cases
- Priority: High - security-critical path

**Plugin Dependency Resolution Failure:**
- What's not tested: Plugin load failure when dependencies missing; circular dependency detection
- Files: `src/plugins/loader.ts`, `src/plugins/runtime/index.ts`
- Risk: Plugins fail silently or crash gateway at startup
- Priority: Medium - affects plugin ecosystem stability

**Concurrent SQLite Access During Migration:**
- What's not tested: Schema migration under concurrent reads/writes; table locking behavior
- Files: `src/memory/memory-schema.ts`
- Risk: Data corruption or deadlock during live indexing
- Priority: Medium - affects memory system reliability

**Embedding Batch Retry Logic:**
- What's not tested: Retry behavior on partial batch failure; token limit exceeded scenarios
- Files: `src/memory/batch-openai.ts`, `src/memory/batch-gemini.ts`
- Risk: Incomplete embeddings; memory search returns stale results
- Priority: Medium - affects search quality

---

*Concerns audit: 2026-01-25*
