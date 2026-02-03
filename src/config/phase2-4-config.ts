export type ChannelType =
  | "discord"
  | "slack"
  | "telegram"
  | "signal"
  | "imessage"
  | "teams"
  | "zalo";

export type WeekDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface CanvasConfig {
  enabledChannels: ChannelType[];
}

export interface MemoryConfig {
  autoExtractEnabled: boolean;
  extractionChannels: ChannelType[];
  jarvisIntegrationEnabled: boolean;
}

export interface BriefingConfig {
  morningBriefingEnabled: boolean;
  morningTime: string; // "08:00"
  preMeetingBriefingEnabled: boolean;
  preMeetingMinutesAhead: number; // 60
  weeklyBriefingEnabled: boolean;
  weeklyDay: WeekDay;
  weeklyTime: string; // "09:00"
  deliveryChannels: ChannelType[];
}

export interface Phase2Config {
  canvas: CanvasConfig;
  memory: MemoryConfig;
  briefings: BriefingConfig;
}

export const DEFAULT_PHASE2_CONFIG: Phase2Config = {
  canvas: {
    enabledChannels: ["telegram", "discord", "slack"],
  },
  memory: {
    autoExtractEnabled: true,
    extractionChannels: ["telegram", "discord", "slack"],
    jarvisIntegrationEnabled: true,
  },
  briefings: {
    morningBriefingEnabled: true,
    morningTime: "08:00",
    preMeetingBriefingEnabled: true,
    preMeetingMinutesAhead: 60,
    weeklyBriefingEnabled: true,
    weeklyDay: "monday",
    weeklyTime: "09:00",
    deliveryChannels: ["telegram", "discord"],
  },
};

export function getPhase2Config(): Phase2Config {
  // Allow env var overrides in production
  if (process.env.PHASE2_CONFIG_JSON) {
    try {
      return JSON.parse(process.env.PHASE2_CONFIG_JSON) as Phase2Config;
    } catch {
      console.warn("Invalid PHASE2_CONFIG_JSON, falling back to defaults");
    }
  }
  return DEFAULT_PHASE2_CONFIG;
}
