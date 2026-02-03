export interface BriefingScheduler {
  tasks: string[];
}

export function startBriefingScheduler(): BriefingScheduler {
  const tasks: string[] = [];

  // Morning briefing at 8 AM
  tasks.push("morning-briefing-08:00");

  // Pre-meeting briefing at 1 hour before meetings (simulated)
  tasks.push("pre-meeting-briefing");

  // Weekly briefing on Monday at 9 AM
  tasks.push("weekly-briefing-monday-09:00");

  console.log("[Briefing Scheduler] Started with tasks:", tasks);

  return { tasks };
}

export function stopBriefingScheduler(scheduler: BriefingScheduler): void {
  console.log("[Briefing Scheduler] Stopped");
}
