import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CronService } from "../cron/service.js";
import { registerBriefingJobs, unregisterBriefingJobs } from "./cron-integration.js";

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
        title: "Briefing: Morning",
        schedule: "0 8 * * *", // 08:00 every day
      }),
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
        title: "Briefing: Weekly",
        schedule: "0 9 * * 1", // 09:00 every Monday (day 1)
      }),
    );
  });

  it("should unregister all briefing jobs by title prefix", async () => {
    mockCronService.list = vi.fn().mockResolvedValue([
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
