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
