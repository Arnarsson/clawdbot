import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getPhase2Config, DEFAULT_PHASE2_CONFIG } from "./phase2-4-config.js";

describe("Phase 2-4 Configuration", () => {
  beforeEach(() => {
    delete process.env.PHASE2_CONFIG_JSON;
  });

  afterEach(() => {
    delete process.env.PHASE2_CONFIG_JSON;
  });

  it("should return default config when no env var is set", () => {
    const config = getPhase2Config();
    expect(config).toEqual(DEFAULT_PHASE2_CONFIG);
  });

  it("should have canvas configuration", () => {
    const config = getPhase2Config();
    expect(config.canvas).toBeDefined();
    expect(config.canvas.enabledChannels).toContain("telegram");
    expect(config.canvas.enabledChannels).toContain("discord");
    expect(config.canvas.enabledChannels).toContain("slack");
  });

  it("should have memory configuration", () => {
    const config = getPhase2Config();
    expect(config.memory).toBeDefined();
    expect(config.memory.autoExtractEnabled).toBe(true);
    expect(config.memory.extractionChannels).toContain("telegram");
    expect(config.memory.jarvisIntegrationEnabled).toBe(true);
  });

  it("should have briefing configuration", () => {
    const config = getPhase2Config();
    expect(config.briefings).toBeDefined();
    expect(config.briefings.morningBriefingEnabled).toBe(true);
    expect(config.briefings.morningTime).toBe("08:00");
    expect(config.briefings.preMeetingBriefingEnabled).toBe(true);
    expect(config.briefings.preMeetingMinutesAhead).toBe(60);
    expect(config.briefings.weeklyBriefingEnabled).toBe(true);
    expect(config.briefings.weeklyDay).toBe("monday");
    expect(config.briefings.weeklyTime).toBe("09:00");
    expect(config.briefings.deliveryChannels).toContain("telegram");
    expect(config.briefings.deliveryChannels).toContain("discord");
  });

  it("should load config from env var", () => {
    const customConfig = {
      canvas: {
        enabledChannels: ["signal" as const],
      },
      memory: {
        autoExtractEnabled: false,
        extractionChannels: ["discord" as const],
        jarvisIntegrationEnabled: false,
      },
      briefings: {
        morningBriefingEnabled: false,
        morningTime: "07:00",
        preMeetingBriefingEnabled: false,
        preMeetingMinutesAhead: 30,
        weeklyBriefingEnabled: false,
        weeklyDay: "friday" as const,
        weeklyTime: "10:00",
        deliveryChannels: ["slack" as const],
      },
    };

    process.env.PHASE2_CONFIG_JSON = JSON.stringify(customConfig);
    const config = getPhase2Config();

    expect(config.canvas.enabledChannels).toEqual(["signal"]);
    expect(config.memory.autoExtractEnabled).toBe(false);
    expect(config.briefings.morningBriefingEnabled).toBe(false);
    expect(config.briefings.weeklyDay).toBe("friday");
  });

  it("should gracefully handle invalid JSON in env var", () => {
    process.env.PHASE2_CONFIG_JSON = "invalid json {";
    const config = getPhase2Config();
    expect(config).toEqual(DEFAULT_PHASE2_CONFIG);
  });

  it("should have all required fields in default config", () => {
    const config = DEFAULT_PHASE2_CONFIG;
    expect(config.canvas).toBeDefined();
    expect(config.memory).toBeDefined();
    expect(config.briefings).toBeDefined();

    // Canvas checks
    expect(Array.isArray(config.canvas.enabledChannels)).toBe(true);
    expect(config.canvas.enabledChannels.length).toBeGreaterThan(0);

    // Memory checks
    expect(typeof config.memory.autoExtractEnabled).toBe("boolean");
    expect(Array.isArray(config.memory.extractionChannels)).toBe(true);
    expect(typeof config.memory.jarvisIntegrationEnabled).toBe("boolean");

    // Briefing checks
    expect(typeof config.briefings.morningBriefingEnabled).toBe("boolean");
    expect(typeof config.briefings.morningTime).toBe("string");
    expect(typeof config.briefings.preMeetingBriefingEnabled).toBe("boolean");
    expect(typeof config.briefings.preMeetingMinutesAhead).toBe("number");
    expect(typeof config.briefings.weeklyBriefingEnabled).toBe("boolean");
    expect(typeof config.briefings.weeklyDay).toBe("string");
    expect(typeof config.briefings.weeklyTime).toBe("string");
    expect(Array.isArray(config.briefings.deliveryChannels)).toBe(true);
  });

  it("should validate channel types", () => {
    const config = getPhase2Config();
    const validChannels = ["discord", "slack", "telegram", "signal", "imessage", "teams", "zalo"];

    for (const channel of config.canvas.enabledChannels) {
      expect(validChannels).toContain(channel);
    }

    for (const channel of config.memory.extractionChannels) {
      expect(validChannels).toContain(channel);
    }

    for (const channel of config.briefings.deliveryChannels) {
      expect(validChannels).toContain(channel);
    }
  });

  it("should have valid time formats", () => {
    const config = getPhase2Config();
    const timeRegex = /^\d{2}:\d{2}$/;

    expect(config.briefings.morningTime).toMatch(timeRegex);
    expect(config.briefings.weeklyTime).toMatch(timeRegex);
  });

  it("should have valid weekday values", () => {
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
});
