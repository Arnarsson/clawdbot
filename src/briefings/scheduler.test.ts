import { describe, it, expect } from "vitest";
import { startBriefingScheduler, stopBriefingScheduler } from "./scheduler.js";

describe("Briefing Scheduler", () => {
  it("should start and stop scheduler", () => {
    const scheduler = startBriefingScheduler();
    expect(scheduler).toBeDefined();
    stopBriefingScheduler(scheduler);
  });

  it("should have morning briefing cron", () => {
    const scheduler = startBriefingScheduler();
    expect(scheduler.tasks.filter((t) => t.includes("morning")).length).toBeGreaterThan(0);
    stopBriefingScheduler(scheduler);
  });
});
