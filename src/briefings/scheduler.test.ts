import { describe, it, expect, vi } from "vitest";
import { createBriefingScheduler } from "./scheduler.js";
import type { CronService } from "../cron/service.js";

describe("Briefing Scheduler", () => {
  it("should create scheduler with start and stop methods", () => {
    const scheduler = createBriefingScheduler();
    expect(scheduler).toBeDefined();
    expect(scheduler.start).toBeDefined();
    expect(scheduler.stop).toBeDefined();
  });

  it("should call registerBriefingJobs on start", async () => {
    const mockCronService = {
      add: vi.fn().mockResolvedValue({ id: "job-1" }),
      list: vi.fn().mockResolvedValue([]),
    } as unknown as CronService;

    const mockConfig = {
      morningBriefingEnabled: true,
      morningTime: "08:00",
      preMeetingBriefingEnabled: false,
      preMeetingMinutesAhead: 60,
      weeklyBriefingEnabled: false,
      weeklyDay: "monday",
      weeklyTime: "09:00",
      deliveryChannels: ["discord"],
    };

    const scheduler = createBriefingScheduler();
    await scheduler.start(mockCronService, mockConfig);

    expect(mockCronService.add).toHaveBeenCalled();
  });
});
