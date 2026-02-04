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
      list: vi.fn().mockResolvedValue([]),
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
    const scheduler = await initializeBriefingScheduler(mockCronService, mockConfig);

    expect(scheduler).toBeDefined();
    expect(mockCronService.add).toHaveBeenCalled();
  });

  it("should skip initialization if all briefings disabled", async () => {
    const disabledConfig = {
      ...mockConfig,
      morningBriefingEnabled: false,
      weeklyBriefingEnabled: false,
    };

    const scheduler = await initializeBriefingScheduler(mockCronService, disabledConfig);

    expect(scheduler).toBeDefined();
    expect(mockCronService.add).not.toHaveBeenCalled();
  });
});
