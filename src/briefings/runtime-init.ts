import type { CronService } from "../cron/service.js";
import type { BriefingConfig } from "../config/phase2-4-config.js";
import { createBriefingScheduler } from "./scheduler.js";

export interface BriefingRuntimeHandle {
  stop(): Promise<void>;
}

export async function initializeBriefingScheduler(
  cronService: CronService,
  config: BriefingConfig,
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
