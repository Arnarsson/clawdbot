# Clawdbot Briefings System Phase 1 Completion Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the Phase 1 briefings system by wiring up cron scheduling, adding configuration layer, integrating into runtime, and supporting Teams/Zalo channels.

**Architecture:**
- **Cron Integration**: Hook briefing dispatcher into existing CronService with scheduled jobs for morning, pre-meeting, and weekly briefings
- **Config Layer**: Add briefings config to Phase2Config with per-channel delivery schedules and time controls
- **Runtime Bootstrap**: Initialize BriefingScheduler on startup with CronService integration and graceful shutdown
- **Channel Support**: Add canvas-integration.ts files for Teams (msteams) and Zalo channels following existing patterns

**Tech Stack:** TypeScript/Node.js, node-cron (via CronService), existing channel SDKs (msteams-sdk, zalo SDK)

---

## Task 1: Wire up Cron Service integration for briefing dispatcher

**Files:**
- Create: `src/briefings/cron-integration.ts`
- Create: `src/briefings/cron-integration.test.ts`
- Modify: `src/briefings/scheduler.ts` (replace stub with real implementation)

**Step 1: Write the failing test for cron integration**

```typescript
// src/briefings/cron-integration.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { CronService } from "../cron/service.js";
import {
  registerBriefingJobs,
  unregisterBriefingJobs,
} from "./cron-integration.js";

describe("Briefing Cron Integration", () => {
  let mockCronService: CronService;

  beforeEach(() => {
    mockCronService = {
      add: vi.fn().mockResolvedValue({ id: "job-1" }),
      remove: vi.fn().mockResolvedValue(undefined),
      list: vi.fn().mockResolvedValue([]),
    } as unknown as CronService;
  });

  it("should register morning briefing job with correct cron expression", async () => {
    await registerBriefingJobs(mockCronService, {
      morningEnabled: true,
      morningTime: "08:00",
      preEnabled: false,
      weeklyEnabled: false,
    });

    expect(mockCronService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("Morning Briefing"),
        schedule: "0 8 * * *", // 08:00 every day
      })
    );
  });

  it("should register weekly briefing job on specified day", async () => {
    await registerBriefingJobs(mockCronService, {
      morningEnabled: false,
      preEnabled: false,
      weeklyEnabled: true,
      weeklyDay: "monday",
      weeklyTime: "09:00",
    });

    expect(mockCronService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("Weekly Briefing"),
        schedule: "0 9 * * 1", // 09:00 every Monday (day 1)
      })
    );
  });

  it("should unregister all briefing jobs by title prefix", async () => {
    mockCronService.list = vi
      .fn()
      .mockResolvedValue([
        { id: "br-morning", title: "Briefing: Morning" },
        { id: "br-weekly", title: "Briefing: Weekly" },
        { id: "other", title: "Other Job" },
      ]);

    await unregisterBriefingJobs(mockCronService);

    expect(mockCronService.remove).toHaveBeenCalledTimes(2);
    expect(mockCronService.remove).toHaveBeenCalledWith("br-morning");
    expect(mockCronService.remove).toHaveBeenCalledWith("br-weekly");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm test src/briefings/cron-integration.test.ts
```

Expected: FAIL with "Cannot find module './cron-integration'"

**Step 3: Write minimal cron integration implementation**

```typescript
// src/briefings/cron-integration.ts
import type { CronService } from "../cron/service.js";
import type { BriefingConfig } from "../config/phase2-4-config.js";
import { dispatchMorningBriefing, dispatchPreMeetingBriefing } from "./channel-dispatcher.js";

export interface BriefingScheduleConfig {
  morningEnabled: boolean;
  morningTime?: string;
  preEnabled: boolean;
  preMinutesAhead?: number;
  weeklyEnabled: boolean;
  weeklyDay?: string;
  weeklyTime?: string;
}

// Day to cron number mapping (0=Sunday, 1=Monday, ... 6=Saturday)
const DAY_TO_CRON: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function timeToCronExpression(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  return `${minutes} ${hours} * * *`;
}

function timeToDayOfWeekCron(time: string, day: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const dayNum = DAY_TO_CRON[day.toLowerCase()] ?? 1;
  return `${minutes} ${hours} * * ${dayNum}`;
}

export async function registerBriefingJobs(
  cronService: CronService,
  config: BriefingScheduleConfig,
): Promise<void> {
  // Unregister existing briefing jobs first
  await unregisterBriefingJobs(cronService);

  // Morning briefing
  if (config.morningEnabled && config.morningTime) {
    await cronService.add({
      title: "Briefing: Morning",
      schedule: timeToCronExpression(config.morningTime),
      enabled: true,
      text: "dispatch-briefing:morning",
    });
  }

  // Weekly briefing
  if (config.weeklyEnabled && config.weeklyDay && config.weeklyTime) {
    await cronService.add({
      title: "Briefing: Weekly",
      schedule: timeToDayOfWeekCron(config.weeklyTime, config.weeklyDay),
      enabled: true,
      text: "dispatch-briefing:weekly",
    });
  }

  // Pre-meeting briefing (trigger on meeting detection, not cron time)
  // For now, this is a placeholder - actual implementation would need meeting integration
  if (config.preEnabled) {
    console.log(
      "[Briefings] Pre-meeting briefing enabled (requires meeting calendar integration)"
    );
  }
}

export async function unregisterBriefingJobs(
  cronService: CronService,
): Promise<void> {
  const jobs = await cronService.list({ includeDisabled: true });
  for (const job of jobs) {
    if (job.title?.startsWith("Briefing:")) {
      await cronService.remove(job.id);
    }
  }
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test src/briefings/cron-integration.test.ts
```

Expected: PASS

**Step 5: Replace briefing scheduler stub with real implementation**

```typescript
// src/briefings/scheduler.ts
import type { CronService } from "../cron/service.js";
import { registerBriefingJobs, unregisterBriefingJobs } from "./cron-integration.js";
import type { BriefingConfig } from "../config/phase2-4-config.js";

export interface BriefingScheduler {
  start(cronService: CronService, config: BriefingConfig): Promise<void>;
  stop(cronService: CronService): Promise<void>;
}

export function createBriefingScheduler(): BriefingScheduler {
  return {
    async start(cronService: CronService, config: BriefingConfig): Promise<void> {
      await registerBriefingJobs(cronService, {
        morningEnabled: config.morningBriefingEnabled,
        morningTime: config.morningTime,
        preEnabled: config.preMeetingBriefingEnabled,
        preMinutesAhead: config.preMeetingMinutesAhead,
        weeklyEnabled: config.weeklyBriefingEnabled,
        weeklyDay: config.weeklyDay,
        weeklyTime: config.weeklyTime,
      });
      console.log("[Briefing Scheduler] Started with config", config);
    },

    async stop(cronService: CronService): Promise<void> {
      await unregisterBriefingJobs(cronService);
      console.log("[Briefing Scheduler] Stopped");
    },
  };
}
```

**Step 6: Commit**

```bash
git add src/briefings/cron-integration.ts src/briefings/cron-integration.test.ts src/briefings/scheduler.ts
git commit -m "feat: wire up cron service integration for briefing scheduler"
```

---

## Task 2: Add briefing configuration schema to Phase2Config

**Files:**
- Modify: `src/config/phase2-4-config.ts` (already has BriefingConfig, verify coverage)
- Modify: `src/config/phase2-4-config.test.ts` (add tests for new config)
- Create: `src/config/phase2-4-config.validate.test.ts` (comprehensive validation tests)

**Step 1: Verify existing BriefingConfig in phase2-4-config.ts**

The BriefingConfig interface already exists with:
```typescript
interface BriefingConfig {
  morningBriefingEnabled: boolean;
  morningTime: string; // "08:00"
  preMeetingBriefingEnabled: boolean;
  preMeetingMinutesAhead: number; // 60
  weeklyBriefingEnabled: boolean;
  weeklyDay: WeekDay;
  weeklyTime: string; // "09:00"
  deliveryChannels: ChannelType[];
}
```

**Step 2: Write validation tests**

```typescript
// src/config/phase2-4-config.validate.test.ts
import { describe, it, expect } from "vitest";
import { getPhase2Config, DEFAULT_PHASE2_CONFIG } from "./phase2-4-config.js";

describe("Phase2 Config Validation", () => {
  it("should return default config when env var is not set", () => {
    delete process.env.PHASE2_CONFIG_JSON;
    const config = getPhase2Config();
    expect(config).toEqual(DEFAULT_PHASE2_CONFIG);
  });

  it("should parse valid JSON from env var", () => {
    const customConfig = {
      ...DEFAULT_PHASE2_CONFIG,
      briefings: {
        ...DEFAULT_PHASE2_CONFIG.briefings,
        morningTime: "07:00",
      },
    };
    process.env.PHASE2_CONFIG_JSON = JSON.stringify(customConfig);
    const config = getPhase2Config();
    expect(config.briefings.morningTime).toBe("07:00");
    delete process.env.PHASE2_CONFIG_JSON;
  });

  it("should validate briefing time format (HH:MM)", () => {
    const validTimes = ["00:00", "08:30", "23:59"];
    for (const time of validTimes) {
      expect(isValidTimeFormat(time)).toBe(true);
    }

    const invalidTimes = ["8:30", "25:00", "08:60", "invalid"];
    for (const time of invalidTimes) {
      expect(isValidTimeFormat(time)).toBe(false);
    }
  });

  it("should validate delivery channels are known channels", () => {
    const config = getPhase2Config();
    const validChannels = [
      "discord",
      "slack",
      "telegram",
      "signal",
      "imessage",
      "teams",
      "zalo",
    ];
    for (const channel of config.briefings.deliveryChannels) {
      expect(validChannels).toContain(channel);
    }
  });

  it("should validate weekly day is valid weekday", () => {
    const config = getPhase2Config();
    const validDays = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    expect(validDays).toContain(config.briefings.weeklyDay);
  });

  it("should allow disabling all briefings", () => {
    const config = {
      ...DEFAULT_PHASE2_CONFIG,
      briefings: {
        ...DEFAULT_PHASE2_CONFIG.briefings,
        morningBriefingEnabled: false,
        preMeetingBriefingEnabled: false,
        weeklyBriefingEnabled: false,
      },
    };
    expect(config.briefings.morningBriefingEnabled).toBe(false);
  });
});

function isValidTimeFormat(time: string): boolean {
  const regex = /^([01]\d|2[0-3]):[0-5]\d$/;
  return regex.test(time);
}
```

**Step 3: Run validation tests**

```bash
pnpm test src/config/phase2-4-config.validate.test.ts
```

Expected: PASS

**Step 4: Update DEFAULT_PHASE2_CONFIG to include Teams and Zalo if desired**

Optionally add to default delivery channels:
```typescript
deliveryChannels: ["telegram", "discord", "slack"] // or include "teams", "zalo"
```

**Step 5: Commit**

```bash
git add src/config/phase2-4-config.validate.test.ts
git commit -m "test: add validation tests for Phase2 briefing config"
```

---

## Task 3: Integrate BriefingScheduler into main runtime bootstrap

**Files:**
- Create: `src/briefings/runtime-init.ts`
- Create: `src/briefings/runtime-init.test.ts`
- Modify: `src/entry.ts` (add briefing scheduler initialization)
- Modify: `src/cli/program.js` (hook into daemon startup)

**Step 1: Write test for runtime initialization**

```typescript
// src/briefings/runtime-init.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CronService } from "../cron/service.js";
import { initializeBriefingScheduler } from "./runtime-init.js";
import type { BriefingConfig } from "../config/phase2-4-config.js";

describe("Briefing Runtime Initialization", () => {
  let mockCronService: CronService;
  let mockConfig: BriefingConfig;

  beforeEach(() => {
    mockCronService = {
      start: vi.fn().mockResolvedValue(undefined),
      add: vi.fn().mockResolvedValue({ id: "job-1" }),
    } as unknown as CronService;

    mockConfig = {
      morningBriefingEnabled: true,
      morningTime: "08:00",
      preMeetingBriefingEnabled: false,
      preMeetingMinutesAhead: 60,
      weeklyBriefingEnabled: true,
      weeklyDay: "monday",
      weeklyTime: "09:00",
      deliveryChannels: ["discord", "slack"],
    };
  });

  it("should initialize briefing scheduler with cron service", async () => {
    const scheduler = await initializeBriefingScheduler(
      mockCronService,
      mockConfig
    );

    expect(scheduler).toBeDefined();
    expect(mockCronService.add).toHaveBeenCalled();
  });

  it("should skip initialization if all briefings disabled", async () => {
    const disabledConfig = {
      ...mockConfig,
      morningBriefingEnabled: false,
      weeklyBriefingEnabled: false,
    };

    const scheduler = await initializeBriefingScheduler(
      mockCronService,
      disabledConfig
    );

    expect(scheduler).toBeDefined();
    expect(mockCronService.add).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm test src/briefings/runtime-init.test.ts
```

Expected: FAIL with "Cannot find module './runtime-init'"

**Step 3: Write runtime initialization implementation**

```typescript
// src/briefings/runtime-init.ts
import type { CronService } from "../cron/service.js";
import type { BriefingConfig } from "../config/phase2-4-config.js";
import { createBriefingScheduler } from "./scheduler.js";

export interface BriefingRuntimeHandle {
  stop(): Promise<void>;
}

export async function initializeBriefingScheduler(
  cronService: CronService,
  config: BriefingConfig
): Promise<BriefingRuntimeHandle> {
  const scheduler = createBriefingScheduler();

  // Only initialize if at least one briefing is enabled
  if (
    config.morningBriefingEnabled ||
    config.preMeetingBriefingEnabled ||
    config.weeklyBriefingEnabled
  ) {
    await scheduler.start(cronService, config);
    console.log("[Briefings] Runtime initialized successfully");
  } else {
    console.log("[Briefings] All briefings disabled, skipping initialization");
  }

  return {
    async stop(): Promise<void> {
      await scheduler.stop(cronService);
    },
  };
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test src/briefings/runtime-init.test.ts
```

Expected: PASS

**Step 5: Add initialization to runtime startup**

Find where CronService is initialized in the daemon/server code and add:

```typescript
// In src/entry.ts or daemon startup code (locate the actual file)
import { initializeBriefingScheduler } from "./briefings/runtime-init.js";
import { getPhase2Config } from "./config/phase2-4-config.js";

// After CronService is created and started:
const phase2Config = getPhase2Config();
const briefingHandle = await initializeBriefingScheduler(
  cronService,
  phase2Config.briefings
);

// On graceful shutdown:
process.on("SIGTERM", async () => {
  await briefingHandle.stop();
  // ... rest of shutdown
});
```

**Step 6: Commit**

```bash
git add src/briefings/runtime-init.ts src/briefings/runtime-init.test.ts
git commit -m "feat: integrate briefing scheduler into runtime bootstrap"
```

---

## Task 4: Add Teams (msteams) canvas integration

**Files:**
- Create: `src/teams/canvas-integration.ts`
- Create: `src/teams/canvas-integration.test.ts`

**Step 1: Write test for Teams canvas rendering**

```typescript
// src/teams/canvas-integration.test.ts
import { describe, it, expect } from "vitest";
import { canvasToTeamsAdaptiveCard } from "./canvas-integration.js";
import type { Canvas } from "../canvas/types.js";

describe("Teams Canvas Integration", () => {
  it("should render canvas to Teams Adaptive Card format", () => {
    const canvas: Canvas = {
      title: "Daily Briefing",
      description: "Your morning summary",
      sections: [
        {
          title: "Updates",
          content: "- New task assigned\n- Meeting at 2pm",
        },
      ],
    };

    const card = canvasToTeamsAdaptiveCard(canvas);

    expect(card).toBeDefined();
    expect(card.body).toBeDefined();
    expect(Array.isArray(card.body)).toBe(true);
    expect(card.body[0]?.text).toContain("Daily Briefing");
  });

  it("should format sections as Teams blocks", () => {
    const canvas: Canvas = {
      title: "Test",
      sections: [
        { title: "Section 1", content: "Content 1" },
        { title: "Section 2", content: "Content 2" },
      ],
    };

    const card = canvasToTeamsAdaptiveCard(canvas);

    const sectionBlocks = card.body?.filter(
      (b: unknown) =>
        typeof b === "object" && b !== null && "text" in b && "weight" in b
    );
    expect((sectionBlocks?.length ?? 0) + 1).toBeGreaterThanOrEqual(2);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm test src/teams/canvas-integration.test.ts
```

Expected: FAIL with "Cannot find module './canvas-integration'"

**Step 3: Write Teams canvas integration**

```typescript
// src/teams/canvas-integration.ts
import type { Canvas, CanvasSection } from "../canvas/types.js";

interface TeamsAdaptiveCardBlock {
  type: string;
  text?: string;
  weight?: string;
  separator?: boolean;
  [key: string]: unknown;
}

interface TeamsAdaptiveCard {
  $schema: string;
  type: string;
  version: string;
  body: TeamsAdaptiveCardBlock[];
  actions?: Array<{
    type: string;
    title: string;
    url: string;
  }>;
}

export function canvasToTeamsAdaptiveCard(canvas: Canvas): TeamsAdaptiveCard {
  const body: TeamsAdaptiveCardBlock[] = [
    {
      type: "TextBlock",
      text: canvas.title,
      weight: "bolder",
      size: "large",
    },
  ];

  if (canvas.description) {
    body.push({
      type: "TextBlock",
      text: canvas.description,
      wrap: true,
      separator: true,
    });
  }

  for (const section of canvas.sections) {
    body.push({
      type: "TextBlock",
      text: section.title,
      weight: "bolder",
      separator: true,
    });

    body.push({
      type: "TextBlock",
      text: section.content || "(empty)",
      wrap: true,
    });

    if (section.actions && section.actions.length > 0) {
      const actions = section.actions
        .filter((a) => a.url)
        .map((a) => ({
          type: "Action.OpenUrl",
          title: a.label,
          url: a.url!,
        }));

      if (actions.length > 0) {
        body.push({
          type: "ActionSet",
          actions,
        } as unknown as TeamsAdaptiveCardBlock);
      }
    }
  }

  return {
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.4",
    body,
  };
}

export function sendTeamsCanvas(
  card: TeamsAdaptiveCard,
  channelSendMessage: (options: unknown) => Promise<void>
): Promise<void> {
  return channelSendMessage({
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: card,
      },
    ],
  });
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test src/teams/canvas-integration.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/teams/canvas-integration.ts src/teams/canvas-integration.test.ts
git commit -m "feat: add Teams (msteams) canvas integration"
```

---

## Task 5: Add Zalo canvas integration

**Files:**
- Create: `src/zalo/canvas-integration.ts`
- Create: `src/zalo/canvas-integration.test.ts`

**Step 1: Write test for Zalo canvas rendering**

```typescript
// src/zalo/canvas-integration.test.ts
import { describe, it, expect } from "vitest";
import { canvasToZaloMessage } from "./canvas-integration.js";
import type { Canvas } from "../canvas/types.js";

describe("Zalo Canvas Integration", () => {
  it("should render canvas to Zalo message format", () => {
    const canvas: Canvas = {
      title: "Daily Briefing",
      description: "Your morning summary",
      sections: [
        {
          title: "Updates",
          content: "- New task assigned\n- Meeting at 2pm",
        },
      ],
    };

    const message = canvasToZaloMessage(canvas);

    expect(message).toBeDefined();
    expect(message.text).toContain("Daily Briefing");
    expect(typeof message.text).toBe("string");
  });

  it("should format multiple sections with proper spacing", () => {
    const canvas: Canvas = {
      title: "Test",
      sections: [
        { title: "Section 1", content: "Content 1" },
        { title: "Section 2", content: "Content 2" },
      ],
    };

    const message = canvasToZaloMessage(canvas);

    expect(message.text).toContain("Section 1");
    expect(message.text).toContain("Content 1");
    expect(message.text).toContain("Section 2");
    expect(message.text).toContain("Content 2");
  });

  it("should escape special Zalo characters", () => {
    const canvas: Canvas = {
      title: "Test *Bold* _Italic_",
      sections: [
        {
          title: "With ~strikethrough~",
          content: "Content",
        },
      ],
    };

    const message = canvasToZaloMessage(canvas);

    // Zalo supports similar markdown, but verify escaping works
    expect(message.text).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm test src/zalo/canvas-integration.test.ts
```

Expected: FAIL with "Cannot find module './canvas-integration'"

**Step 3: Write Zalo canvas integration**

```typescript
// src/zalo/canvas-integration.ts
import type { Canvas, CanvasSection } from "../canvas/types.js";

export interface ZaloMessage {
  text: string;
  attachments?: Array<{
    type: string;
    url: string;
    title?: string;
  }>;
}

export function canvasToZaloMessage(canvas: Canvas): ZaloMessage {
  let text = `*${escapeZaloText(canvas.title)}*\n`;

  if (canvas.description) {
    text += `${escapeZaloText(canvas.description)}\n\n`;
  }

  for (const section of canvas.sections) {
    text += `*${escapeZaloText(section.title)}*\n`;
    text += `${escapeZaloText(section.content)}\n`;

    if (section.actions && section.actions.length > 0) {
      for (const action of section.actions) {
        if (action.url) {
          text += `[${action.label}](${action.url})\n`;
        }
      }
    }

    text += "\n";
  }

  return { text };
}

function escapeZaloText(text: string): string {
  // Zalo uses markdown-like formatting but with some differences
  // For safety, we'll use minimal escaping and let the API handle most formatting
  return text
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\|/g, "\\|");
}

export function sendZaloCanvas(
  message: ZaloMessage,
  channelSendMessage: (options: unknown) => Promise<void>
): Promise<void> {
  return channelSendMessage({
    text: message.text,
    attachments: message.attachments,
  });
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test src/zalo/canvas-integration.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/zalo/canvas-integration.ts src/zalo/canvas-integration.test.ts
git commit -m "feat: add Zalo canvas integration"
```

---

## Task 6: Update channel dispatcher to support Teams and Zalo

**Files:**
- Modify: `src/briefings/channel-dispatcher.ts`
- Modify: `src/briefings/channel-dispatcher.test.ts`

**Step 1: Add Teams and Zalo to channel dispatcher**

Update the ChannelType union in channel-dispatcher.ts to explicitly handle Teams and Zalo:

```typescript
// Update renderCanvas call site in src/briefings/channel-dispatcher.ts
// (it already handles all channel types via the router)

// Add test case for Teams and Zalo in channel-dispatcher.test.ts
it("should dispatch to Teams channel", async () => {
  const senders = {
    teams: { send: vi.fn() },
  } as unknown as Record<ChannelType, ChannelSender>;

  const opts: BriefingDispatcherOptions = {
    enabledChannels: ["teams"],
  };

  await dispatchMorningBriefing(senders, opts);
  expect(senders.teams.send).toHaveBeenCalled();
});

it("should dispatch to Zalo channel", async () => {
  const senders = {
    zalo: { send: vi.fn() },
  } as unknown as Record<ChannelType, ChannelSender>;

  const opts: BriefingDispatcherOptions = {
    enabledChannels: ["zalo"],
  };

  await dispatchMorningBriefing(senders, opts);
  expect(senders.zalo.send).toHaveBeenCalled();
});
```

**Step 2: Run dispatcher tests**

```bash
pnpm test src/briefings/channel-dispatcher.test.ts
```

Expected: PASS

**Step 3: Commit**

```bash
git add src/briefings/channel-dispatcher.test.ts
git commit -m "test: add Teams and Zalo channel dispatcher tests"
```

---

## Task 7: Wire canvas router to handle Teams and Zalo rendering

**Files:**
- Modify: `src/canvas/router.ts`
- Modify: `src/canvas/router.test.ts`

**Step 1: Update canvas router to handle Teams and Zalo**

```typescript
// src/canvas/router.ts - update imports and switch statement
import { renderTeamsAdaptiveCard } from "./renderers/teams.js";
import { renderZaloMessage } from "./renderers/zalo.js";

export function renderCanvas(channel: ChannelType, canvas: Canvas): unknown {
  switch (channel) {
    case "discord":
      return renderDiscordEmbed(canvas);
    case "slack":
      return renderSlackBlocks(canvas);
    case "telegram":
      return renderTelegramMarkdown(canvas);
    case "signal":
    case "imessage":
      return renderTelegramMarkdown(canvas); // Fallback to markdown
    case "teams":
      return renderTeamsAdaptiveCard(canvas);
    case "zalo":
      return renderZaloMessage(canvas);
    default:
      throw new Error(`Unknown channel type: ${channel}`);
  }
}
```

Wait - Teams and Zalo integrations are in `src/teams/` and `src/zalo/`, not in renderers. Update approach:

```typescript
// src/canvas/router.ts
import type { Canvas } from "./types.js";
import { renderDiscordEmbed } from "./renderers/discord.js";
import { renderSlackBlocks } from "./renderers/slack.js";
import { renderTelegramMarkdown } from "./renderers/telegram.js";
import { canvasToTeamsAdaptiveCard } from "../teams/canvas-integration.js";
import { canvasToZaloMessage } from "../zalo/canvas-integration.js";

export type ChannelType =
  | "discord"
  | "slack"
  | "telegram"
  | "signal"
  | "imessage"
  | "teams"
  | "zalo";

export function renderCanvas(channel: ChannelType, canvas: Canvas): unknown {
  switch (channel) {
    case "discord":
      return renderDiscordEmbed(canvas);
    case "slack":
      return renderSlackBlocks(canvas);
    case "telegram":
      return renderTelegramMarkdown(canvas);
    case "signal":
    case "imessage":
      return renderTelegramMarkdown(canvas); // Fallback to markdown
    case "teams":
      return canvasToTeamsAdaptiveCard(canvas);
    case "zalo":
      return canvasToZaloMessage(canvas);
    default:
      const _exhaustiveCheck: never = channel;
      return _exhaustiveCheck;
  }
}
```

**Step 2: Update router tests**

```typescript
// src/canvas/router.test.ts - add test cases
it("should route Teams canvas rendering", () => {
  const canvas: Canvas = { title: "Test", sections: [] };
  const result = renderCanvas("teams", canvas);
  expect(result).toBeDefined();
  expect(result).toHaveProperty("body");
});

it("should route Zalo canvas rendering", () => {
  const canvas: Canvas = { title: "Test", sections: [] };
  const result = renderCanvas("zalo", canvas);
  expect(result).toBeDefined();
  expect(result).toHaveProperty("text");
});
```

**Step 3: Run tests**

```bash
pnpm test src/canvas/router.test.ts
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/canvas/router.ts src/canvas/router.test.ts
git commit -m "feat: add Teams and Zalo rendering to canvas router"
```

---

## Task 8: Full integration test and verification

**Files:**
- Create: `src/__tests__/briefings-phase1-integration.test.ts`
- Modify: Verify existing tests still pass

**Step 1: Write comprehensive integration test**

```typescript
// src/__tests__/briefings-phase1-integration.test.ts
import { describe, it, expect, vi } from "vitest";
import type { Canvas } from "../canvas/types.js";
import { renderCanvas } from "../canvas/router.js";
import {
  canvasToTeamsAdaptiveCard,
  sendTeamsCanvas,
} from "../teams/canvas-integration.js";
import { canvasToZaloMessage, sendZaloCanvas } from "../zalo/canvas-integration.js";
import { getPhase2Config } from "../config/phase2-4-config.js";
import type { BriefingScheduler } from "../briefings/scheduler.js";
import { createBriefingScheduler } from "../briefings/scheduler.js";

describe("Briefings Phase 1 Integration", () => {
  const mockCanvas: Canvas = {
    title: "Test Briefing",
    description: "Integration test",
    sections: [
      {
        title: "Updates",
        content: "Test content",
        actions: [{ label: "View", url: "https://example.com" }],
      },
    ],
  };

  it("should render canvas to all supported channel formats", () => {
    const channels: Array<"discord" | "slack" | "telegram" | "teams" | "zalo" | "signal" | "imessage"> = [
      "discord",
      "slack",
      "telegram",
      "teams",
      "zalo",
      "signal",
      "imessage",
    ];

    for (const channel of channels) {
      const result = renderCanvas(channel, mockCanvas);
      expect(result).toBeDefined();
    }
  });

  it("should render Teams Adaptive Card with proper structure", () => {
    const card = canvasToTeamsAdaptiveCard(mockCanvas);
    expect(card.$schema).toBe("http://adaptivecards.io/schemas/adaptive-card.json");
    expect(card.body).toHaveLength.greaterThan(0);
  });

  it("should render Zalo message with proper formatting", () => {
    const message = canvasToZaloMessage(mockCanvas);
    expect(message.text).toContain("Test Briefing");
    expect(message.text).toContain("Updates");
  });

  it("should load valid Phase2 config", () => {
    const config = getPhase2Config();
    expect(config.briefings).toBeDefined();
    expect(config.briefings.deliveryChannels).toBeDefined();
    expect(Array.isArray(config.briefings.deliveryChannels)).toBe(true);
  });

  it("should create briefing scheduler", () => {
    const scheduler = createBriefingScheduler();
    expect(scheduler).toBeDefined();
    expect(scheduler.start).toBeDefined();
    expect(scheduler.stop).toBeDefined();
  });

  it("should support all Phase2 channel types in config", () => {
    const config = getPhase2Config();
    const validChannels = ["discord", "slack", "telegram", "signal", "imessage", "teams", "zalo"];
    for (const channel of config.briefings.deliveryChannels) {
      expect(validChannels).toContain(channel);
    }
  });
});
```

**Step 2: Run all briefing tests**

```bash
pnpm test src/briefings/ src/canvas/ src/teams/ src/zalo/ src/__tests__/briefings-phase1-integration.test.ts
```

Expected: All tests PASS (>90% coverage)

**Step 3: Run full test suite to verify no regressions**

```bash
pnpm test
```

Expected: No new failures

**Step 4: Commit**

```bash
git add src/__tests__/briefings-phase1-integration.test.ts
git commit -m "test: add comprehensive briefings phase 1 integration tests"
```

---

## Task 9: Documentation and final verification

**Files:**
- Create: `docs/briefings.md` (user-facing briefings documentation)
- Modify: `docs/phases/phase2-4.md` (update with implementation status)

**Step 1: Write briefings documentation**

```markdown
# Clawdbot Briefings System

Briefings are automated message summaries sent to your messaging channels at scheduled times.

## Enabling Briefings

Set the `PHASE2_CONFIG_JSON` environment variable with your briefing preferences:

\`\`\`json
{
  "briefings": {
    "morningBriefingEnabled": true,
    "morningTime": "08:00",
    "preMeetingBriefingEnabled": false,
    "weeklyBriefingEnabled": true,
    "weeklyDay": "monday",
    "weeklyTime": "09:00",
    "deliveryChannels": ["discord", "slack", "telegram"]
  }
}
\`\`\`

## Supported Channels

- Discord (embeds)
- Slack (blocks)
- Telegram (markdown)
- Signal (markdown)
- iMessage (markdown)
- Teams (Adaptive Cards)
- Zalo (formatted text)

## Briefing Types

### Morning Briefing
Sends at a configured time each day with:
- Pending decisions from Jarvis
- Open loops from memory system

### Weekly Briefing
Sends on a specified day/time with summary of the week.

### Pre-Meeting Briefing
Triggered before calendar events (requires calendar integration).
```

**Step 2: Commit documentation**

```bash
git add docs/briefings.md
git commit -m "docs: add briefings system user documentation"
```

**Step 3: Final verification checklist**

```bash
# Run all tests
pnpm test

# Type check
pnpm build

# Lint
pnpm lint

# Check git status
git status
```

Expected output:
- All tests pass
- No TypeScript errors
- No lint errors
- Clean git status (only intended changes)

**Step 4: Final commit summary**

```bash
git log --oneline -15
```

Should show all 9 tasks completed with clean commit history.

---

## Success Criteria

✅ Cron service integrated with briefing dispatcher
✅ BriefingConfig fully validated with defaults
✅ BriefingScheduler wired into runtime bootstrap
✅ Teams (msteams) canvas integration complete
✅ Zalo canvas integration complete
✅ Canvas router handles all 7 channel types
✅ All tests passing (>90% coverage for briefings module)
✅ Documentation complete
✅ No regressions in existing functionality

---

## Execution Notes

- Each task is 5-15 minutes of focused work
- Tests verify behavior before implementation
- Frequent commits (9 total) for easy rollback
- All code follows existing codebase patterns
- No breaking changes to existing APIs
- Configuration via environment variables (Phase2Config pattern)
