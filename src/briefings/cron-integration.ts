import type { CronService } from "../cron/service.js";
import type { CronJobCreate, CronSchedule } from "../cron/types.js";

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

function timeToCronSchedule(time: string): CronSchedule {
  const [hours, minutes] = time.split(":").map(Number);
  return { kind: "cron", expr: `${minutes} ${hours} * * *` };
}

function timeToDayOfWeekCronSchedule(time: string, day: string): CronSchedule {
  const [hours, minutes] = time.split(":").map(Number);
  const dayNum = DAY_TO_CRON[day.toLowerCase()] ?? 1;
  return { kind: "cron", expr: `${minutes} ${hours} * * ${dayNum}` };
}

export async function registerBriefingJobs(
  cronService: CronService,
  config: BriefingScheduleConfig,
): Promise<void> {
  // Unregister existing briefing jobs first
  await unregisterBriefingJobs(cronService);

  // Morning briefing
  if (config.morningEnabled && config.morningTime) {
    const job: CronJobCreate = {
      name: "Briefing: Morning",
      schedule: timeToCronSchedule(config.morningTime),
      enabled: true,
      sessionTarget: "main",
      wakeMode: "now",
      payload: { kind: "systemEvent", text: "dispatch-briefing:morning" },
    };
    await cronService.add(job);
  }

  // Weekly briefing
  if (config.weeklyEnabled && config.weeklyDay && config.weeklyTime) {
    const job: CronJobCreate = {
      name: "Briefing: Weekly",
      schedule: timeToDayOfWeekCronSchedule(config.weeklyTime, config.weeklyDay),
      enabled: true,
      sessionTarget: "main",
      wakeMode: "now",
      payload: { kind: "systemEvent", text: "dispatch-briefing:weekly" },
    };
    await cronService.add(job);
  }

  // Pre-meeting briefing (trigger on meeting detection, not cron time)
  // For now, this is a placeholder - actual implementation would need meeting integration
  if (config.preEnabled) {
    console.log("[Briefings] Pre-meeting briefing enabled (requires meeting calendar integration)");
  }
}

export async function unregisterBriefingJobs(cronService: CronService): Promise<void> {
  const jobs = await cronService.list({ includeDisabled: true });
  for (const job of jobs) {
    if (job.name?.startsWith("Briefing:")) {
      await cronService.remove(job.id);
    }
  }
}
