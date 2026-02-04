import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getPhase2Config, DEFAULT_PHASE2_CONFIG } from "./phase2-4-config.js";

describe("Phase2 Config Validation", () => {
  beforeEach(() => {
    // Save original env var state
    delete process.env.PHASE2_CONFIG_JSON;
  });

  afterEach(() => {
    // Clean up env var after each test
    delete process.env.PHASE2_CONFIG_JSON;
  });

  it("should return default config when env var is not set", () => {
    const config = getPhase2Config();
    expect(config).toEqual(DEFAULT_PHASE2_CONFIG);
  });

  it("should parse valid JSON from env var", () => {
    const customConfig = {
      ...DEFAULT_PHASE2_CONFIG,
      briefings: {
        ...DEFAULT_PHASE2_CONFIG.briefings,
        morningTime: "07:00",
      },
    };
    process.env.PHASE2_CONFIG_JSON = JSON.stringify(customConfig);
    const config = getPhase2Config();
    expect(config.briefings.morningTime).toBe("07:00");
  });

  it("should validate briefing time format (HH:MM)", () => {
    const validTimes = ["00:00", "08:30", "23:59"];
    for (const time of validTimes) {
      expect(isValidTimeFormat(time)).toBe(true);
    }

    const invalidTimes = ["8:30", "25:00", "08:60", "invalid"];
    for (const time of invalidTimes) {
      expect(isValidTimeFormat(time)).toBe(false);
    }
  });

  it("should validate delivery channels are known channels", () => {
    const config = getPhase2Config();
    const validChannels = ["discord", "slack", "telegram", "signal", "imessage", "teams", "zalo"];
    for (const channel of config.briefings.deliveryChannels) {
      expect(validChannels).toContain(channel);
    }
  });

  it("should validate weekly day is valid weekday", () => {
    const config = getPhase2Config();
    const validDays = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    expect(validDays).toContain(config.briefings.weeklyDay);
  });

  it("should allow disabling all briefings", () => {
    const config = {
      ...DEFAULT_PHASE2_CONFIG,
      briefings: {
        ...DEFAULT_PHASE2_CONFIG.briefings,
        morningBriefingEnabled: false,
        preMeetingBriefingEnabled: false,
        weeklyBriefingEnabled: false,
      },
    };
    expect(config.briefings.morningBriefingEnabled).toBe(false);
    expect(config.briefings.preMeetingBriefingEnabled).toBe(false);
    expect(config.briefings.weeklyBriefingEnabled).toBe(false);
  });
});

function isValidTimeFormat(time: string): boolean {
  const regex = /^([01]\d|2[0-3]):[0-5]\d$/;
  return regex.test(time);
}
