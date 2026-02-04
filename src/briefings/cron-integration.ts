import type { CronService } from "../cron/service.js";

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
    console.log("[Briefings] Pre-meeting briefing enabled (requires meeting calendar integration)");
  }
}

export async function unregisterBriefingJobs(cronService: CronService): Promise<void> {
  const jobs = await cronService.list({ includeDisabled: true });
  for (const job of jobs) {
    if (job.title?.startsWith("Briefing:")) {
      await cronService.remove(job.id);
    }
  }
}
