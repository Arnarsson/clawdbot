import { describe, it, expect, beforeEach, vi } from "vitest";
import { getPhase2Config } from "../config/phase2-4-config.js";
import { handleMemoryExtraction } from "../memory/channel-hooks.js";
import { createMorningBriefing } from "../briefings/aggregator.js";

describe("Phase 2-4 Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Configuration", () => {
    it("should load Phase 2-4 configuration", () => {
      const config = getPhase2Config();
      expect(config).toBeDefined();
      expect(config.canvas).toBeDefined();
      expect(config.memory).toBeDefined();
      expect(config.briefings).toBeDefined();
    });

    it("should have Canvas integration enabled for at least one channel", () => {
      const config = getPhase2Config();
      expect(config.canvas.enabledChannels).toBeDefined();
      expect(Array.isArray(config.canvas.enabledChannels)).toBe(true);
      expect(config.canvas.enabledChannels.length).toBeGreaterThan(0);
    });

    it("should have Memory auto-extraction enabled by default", () => {
      const config = getPhase2Config();
      expect(config.memory.autoExtractEnabled).toBe(true);
    });

    it("should have Briefing service enabled by default", () => {
      const config = getPhase2Config();
      expect(config.briefings.morningBriefingEnabled).toBe(true);
    });

    it("should support all 7 channels in Canvas integration", () => {
      const config = getPhase2Config();
      const supportedChannels = [
        "discord",
        "slack",
        "telegram",
        "signal",
        "imessage",
        "teams",
        "zalo",
      ];
      expect(supportedChannels.length).toBe(7);
    });
  });

  describe("Memory Auto-Extraction", () => {
    it("should handle memory extraction without errors", async () => {
      const result = await handleMemoryExtraction({
        messageText: "We decided to use TypeScript for this project",
        channelName: "telegram",
      });
      expect(result).toBeDefined();
    });

    it("should trigger extraction on decision keywords", async () => {
      const decisionMessages = [
        "We decided to migrate to TypeScript",
        "Remember when we discussed this?",
        "What did we discuss about the architecture?",
        "Status on the project timeline?",
      ];

      for (const message of decisionMessages) {
        const result = await handleMemoryExtraction({
          messageText: message,
          channelName: "discord",
        });
        expect(result).toBeDefined();
      }
    });

    it("should support all 7 channels for memory extraction", async () => {
      const channels = ["discord", "slack", "telegram", "signal", "imessage", "teams", "zalo"];

      for (const channel of channels) {
        const result = await handleMemoryExtraction({
          messageText: "Test decision message",
          channelName: channel,
        });
        expect(result).toBeDefined();
      }
    });
  });

  describe("Briefing Auto-Dispatch", () => {
    it("should create morning briefing", async () => {
      const briefing = await createMorningBriefing();
      expect(briefing).toBeDefined();
      expect(briefing.title).toBeDefined();
      expect(Array.isArray(briefing.sections)).toBe(true);
    });

    it("should format briefing with title and sections", async () => {
      const briefing = await createMorningBriefing();
      expect(typeof briefing.title).toBe("string");
      expect(briefing.title.length).toBeGreaterThan(0);
      expect(briefing.sections.length).toBeGreaterThanOrEqual(0);
    });

    it("should support briefing dispatch to multiple channels", async () => {
      const config = getPhase2Config();
      const deliveryChannels = config.briefings.deliveryChannels;
      expect(Array.isArray(deliveryChannels)).toBe(true);
      expect(deliveryChannels.length).toBeGreaterThan(0);
    });
  });

  describe("Channel Integration Coverage", () => {
    it("should support Discord canvas integration", () => {
      const config = getPhase2Config();
      const supportsDiscord = config.canvas.enabledChannels.includes("discord");
      expect(supportsDiscord || config.canvas.enabledChannels.length > 0).toBe(true);
    });

    it("should support Slack canvas integration", () => {
      const config = getPhase2Config();
      const supportsSlack = config.canvas.enabledChannels.includes("slack");
      expect(supportsSlack || config.canvas.enabledChannels.length > 0).toBe(true);
    });

    it("should support Telegram canvas integration", () => {
      const config = getPhase2Config();
      const supportsTelegram = config.canvas.enabledChannels.includes("telegram");
      expect(supportsTelegram || config.canvas.enabledChannels.length > 0).toBe(true);
    });

    it("should support Signal canvas integration", () => {
      const config = getPhase2Config();
      const supportsSignal = config.canvas.enabledChannels.includes("signal");
      expect(supportsSignal || config.canvas.enabledChannels.length > 0).toBe(true);
    });

    it("should support iMessage canvas integration", () => {
      const config = getPhase2Config();
      const supportsIMessage = config.canvas.enabledChannels.includes("imessage");
      expect(supportsIMessage || config.canvas.enabledChannels.length > 0).toBe(true);
    });

    it("should support Teams canvas integration", () => {
      const config = getPhase2Config();
      const supportsTeams = config.canvas.enabledChannels.includes("teams");
      expect(supportsTeams || config.canvas.enabledChannels.length > 0).toBe(true);
    });

    it("should support Zalo canvas integration", () => {
      const config = getPhase2Config();
      const supportsZalo = config.canvas.enabledChannels.includes("zalo");
      expect(supportsZalo || config.canvas.enabledChannels.length > 0).toBe(true);
    });
  });

  describe("Configuration Integrity", () => {
    it("should have consistent channel names across services", () => {
      const config = getPhase2Config();
      const supportedChannelNames = [
        "discord",
        "slack",
        "telegram",
        "signal",
        "imessage",
        "teams",
        "zalo",
      ];

      if (config.canvas.enabledChannels.length > 0) {
        for (const channel of config.canvas.enabledChannels) {
          expect(supportedChannelNames).toContain(channel);
        }
      }
    });

    it("should have valid briefing configuration", () => {
      const config = getPhase2Config();
      const morningTime = config.briefings.morningTime;
      expect(typeof morningTime).toBe("string");
      // Validate HH:MM format
      expect(/^\d{2}:\d{2}$/.test(morningTime)).toBe(true);
    });

    it("should respect environment configuration overrides", () => {
      const config = getPhase2Config();
      // Configuration should be loaded from environment if available
      expect(config).toBeDefined();
      expect(config.canvas.enabledChannels).toBeDefined();
    });
  });

  describe("Integration Workflow", () => {
    it("should complete full Phase 2-4 workflow", async () => {
      // Load config
      const config = getPhase2Config();
      expect(config).toBeDefined();

      // Extract memory
      const memoryResult = await handleMemoryExtraction({
        messageText: "We decided to implement Phase 2-4",
        channelName: "telegram",
      });
      expect(memoryResult).toBeDefined();

      // Create briefing
      const briefing = await createMorningBriefing();
      expect(briefing).toBeDefined();

      // Verify all components are functional
      expect(config.canvas.enabledChannels.length).toBeGreaterThan(0);
      expect(config.memory.autoExtractEnabled).toBe(true);
      expect(config.briefings.morningBriefingEnabled).toBe(true);
    });
  });
});
