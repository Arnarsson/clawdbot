# Phase 2-4: Channel Integration & Completion

> **For Claude:** Use superpowers:subagent-driven-development to execute in parallel batches.

**Goal:** Wire Canvas, Memory, and Briefing infrastructure into all 7 channels with minimal changes to existing code.

**Execution:** Parallel subagent batches for independent channel integrations.

---

## Batch 1: Discord + Slack Canvas Integration (Parallel)

### Task 1a: Discord Canvas Integration
**Files:** `src/discord/canvas-integration.ts`, `src/discord/canvas-integration.test.ts`

Add sendCanvas method to Discord client:
```typescript
import { Canvas } from '../canvas/types.js';
import { renderCanvas } from '../canvas/router.js';

export async function sendDiscordCanvas(
  client: DiscordClient,
  channelId: string,
  canvas: Canvas
): Promise<void> {
  const embed = renderCanvas('discord', canvas);
  await client.channels.cache.get(channelId)?.send({ embeds: [embed as any] });
}
```

### Task 1b: Slack Canvas Integration
**Files:** `src/slack/canvas-integration.ts`, `src/slack/canvas-integration.test.ts`

Add sendCanvas method to Slack client:
```typescript
import { Canvas } from '../canvas/types.js';
import { renderCanvas } from '../canvas/router.js';

export async function sendSlackCanvas(
  client: SlackClient,
  channelId: string,
  canvas: Canvas
): Promise<void> {
  const blocks = renderCanvas('slack', canvas);
  await client.chat.postMessage({ channel: channelId, blocks: blocks as any });
}
```

---

## Batch 2: Telegram + Signal Canvas Integration (Parallel)

### Task 2a: Telegram Canvas Integration
**Files:** `src/telegram/canvas-integration.ts`

```typescript
import { Canvas } from '../canvas/types.js';
import { renderCanvas } from '../canvas/router.js';

export async function sendTelegramCanvas(
  bot: TelegramBot,
  chatId: string,
  canvas: Canvas
): Promise<void> {
  const text = renderCanvas('telegram', canvas);
  await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
}
```

### Task 2b: Signal Canvas Integration
**Files:** `src/signal/canvas-integration.ts`

```typescript
import { Canvas } from '../canvas/types.js';
import { renderCanvas } from '../canvas/router.js';

export async function sendSignalCanvas(
  client: SignalClient,
  recipientId: string,
  canvas: Canvas
): Promise<void> {
  const text = renderCanvas('signal', canvas);
  await client.sendMessage(recipientId, text);
}
```

---

## Batch 3: iMessage + Teams Canvas Integration (Parallel)

### Task 3a: iMessage Canvas Integration
**Files:** `src/imessage/canvas-integration.ts`

```typescript
import { Canvas } from '../canvas/types.js';
import { renderCanvas } from '../canvas/router.js';

export async function sendIMessageCanvas(
  client: IMessageClient,
  recipientId: string,
  canvas: Canvas
): Promise<void> {
  const text = renderCanvas('imessage', canvas);
  await client.sendMessage(recipientId, text);
}
```

### Task 3b: Teams Canvas Integration
**Files:** `src/teams/canvas-integration.ts` (or `extensions/msteams/canvas-integration.ts`)

```typescript
import { Canvas } from '../canvas/types.js';
import { renderCanvas } from '../canvas/router.js';

export async function sendTeamsCanvas(
  client: TeamsClient,
  channelId: string,
  canvas: Canvas
): Promise<void> {
  const text = renderCanvas('teams', canvas);
  await client.sendMessage(channelId, text);
}
```

---

## Batch 4: Zalo Canvas Integration (Solo)

### Task 4: Zalo Canvas Integration
**Files:** `src/zalo/canvas-integration.ts` (or `extensions/zalo/canvas-integration.ts`)

```typescript
import { Canvas } from '../canvas/types.js';
import { renderCanvas } from '../canvas/router.js';

export async function sendZaloCanvas(
  client: ZaloClient,
  userId: string,
  canvas: Canvas
): Promise<void> {
  const text = renderCanvas('zalo', canvas);
  await client.sendMessage(userId, text);
}
```

---

## Batch 5: Memory Extraction Hooks (Parallel - All Channels)

Hook into message handlers to auto-extract memory:

### Task 5: Add memory extraction to all channel message handlers

**Pattern for each channel:**
```typescript
// In channel message handler (after receiving message)
import { shouldExtractMemory, extractMemoryItems } from '../memory/extractor.js';
import { writeDecisionToJarvis } from '../memory/jarvis-writer.js';

if (shouldExtractMemory(messageText)) {
  const items = extractMemoryItems({ message: messageText });
  for (const item of items) {
    if (item.type === 'decision') {
      await writeDecisionToJarvis(item.content, `${channelName}-extracted`).catch(err =>
        log.debug(`Memory write failed: ${err}`)
      );
    }
  }
}
```

---

## Batch 6: Briefing Dispatch (Parallel - All Channels)

### Task 6: Wire briefing delivery to all channels

**Pattern for each channel:**
```typescript
// In scheduled task/cron handler
import { createMorningBriefing, createPreMeetingBriefing } from '../briefings/aggregator.js';
import { sendCanvas } from './{channel}/canvas-integration.js';

export async function deliverMorningBriefing() {
  const briefing = await createMorningBriefing();
  // Send to all configured channels
  for (const channelId of CONFIGURED_CHANNELS) {
    await sendCanvas(client, channelId, briefing).catch(err =>
      log.warn(`Failed to send briefing to ${channelId}: ${err}`)
    );
  }
}
```

---

## Batch 7: Configuration Layer

### Task 7a: Briefing Schedule Config
**File:** `src/config/briefings.ts`

```typescript
export interface BriefingConfig {
  morningTime: string; // "08:00"
  preMeetingMinutes: number; // 60
  weeklyDay: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  weeklyTime: string; // "09:00"
  enabledChannels: string[]; // ['discord', 'slack', 'telegram']
}

export const DEFAULT_BRIEFING_CONFIG: BriefingConfig = {
  morningTime: '08:00',
  preMeetingMinutes: 60,
  weeklyDay: 'monday',
  weeklyTime: '09:00',
  enabledChannels: ['telegram', 'discord'],
};
```

### Task 7b: Memory Extraction Config
**File:** `src/config/memory.ts`

```typescript
export interface MemoryConfig {
  autoExtractEnabled: boolean;
  extractionChannels: string[]; // which channels to extract from
  jarvisIntegrationEnabled: boolean;
}

export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  autoExtractEnabled: true,
  extractionChannels: ['telegram', 'discord', 'slack'],
  jarvisIntegrationEnabled: true,
};
```

---

## Batch 8: Documentation & Setup

### Task 8a: Integration Guide
**File:** `docs/PHASE2-4-INTEGRATION.md`

Quick setup guide showing how Canvas, Memory, Briefings are wired.

### Task 8b: API Documentation
**File:** `docs/CANVAS-API.md`

Document Canvas rendering API and channel integration.

---

## Execution Strategy

**Parallel Batches:**
1. **Batch 1 (2 subagents):** Discord + Slack canvas
2. **Batch 2 (2 subagents):** Telegram + Signal canvas
3. **Batch 3 (2 subagents):** iMessage + Teams canvas
4. **Batch 4 (1 subagent):** Zalo canvas
5. **Batch 5 (6 subagents):** Memory hooks for all channels
6. **Batch 6 (6 subagents):** Briefing dispatch for all channels
7. **Batch 7 (2 subagents):** Configuration layer
8. **Batch 8 (2 subagents):** Documentation

**Total: ~20+ parallel subagents deployed across phases**

Each subagent:
- Implements integration with zero breaking changes
- Adds tests
- Follows TDD pattern
- Gets spec + quality review
- Commits work

**Success Criteria:**
- ✅ All 7 channels can render Canvas messages
- ✅ Memory auto-extracts from all channels
- ✅ Briefings deliver to all channels
- ✅ Config layer working
- ✅ Full test coverage
- ✅ Documentation complete
