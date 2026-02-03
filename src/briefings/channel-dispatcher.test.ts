import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  dispatchMorningBriefing,
  dispatchPreMeetingBriefing,
  type ChannelType,
  type ChannelSender,
  type BriefingDispatcherOptions,
} from "./channel-dispatcher.js";

// Mock the aggregator
vi.mock("./aggregator.js", () => ({
  createMorningBriefing: vi.fn().mockResolvedValue({
    title: "☀️ Morning Briefing",
    description: "Your daily context",
    sections: [{ title: "Pending Decisions", content: "Decision 1\nDecision 2" }],
  }),
  createPreMeetingBriefing: vi.fn().mockResolvedValue({
    title: "📅 Pre-Meeting Briefing",
    description: "Quick context before meeting",
    sections: [{ title: "Decisions Needed", content: "Quick decision 1" }],
  }),
}));

// Mock the canvas router
vi.mock("../canvas/router.js", () => ({
  renderCanvas: vi.fn((channel: string, canvas: unknown) => ({
    channel,
    canvas,
    rendered: true,
  })),
}));

describe("Briefing Channel Dispatcher", () => {
  let mockSender: ChannelSender;
  let mockLogger: { info: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let opts: BriefingDispatcherOptions;

  beforeEach(() => {
    mockSender = { send: vi.fn().mockResolvedValue(undefined) };
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
    };
    opts = {
      enabledChannels: ["discord", "slack", "telegram"],
      logger: mockLogger,
    };
  });

  describe("dispatchMorningBriefing", () => {
    it("should dispatch morning briefing to all enabled channels", async () => {
      const senders: Record<ChannelType, ChannelSender> = {
        discord: mockSender,
        slack: mockSender,
        telegram: mockSender,
        signal: { send: vi.fn() },
        imessage: { send: vi.fn() },
        teams: { send: vi.fn() },
        zalo: { send: vi.fn() },
      };

      await dispatchMorningBriefing(senders, {
        ...opts,
        enabledChannels: ["discord", "slack", "telegram"],
      });

      expect(mockSender.send).toHaveBeenCalledTimes(3);
      expect(mockLogger.info).toHaveBeenCalledWith("[Briefing] Generating morning briefing");
    });

    it("should handle dispatch errors gracefully", async () => {
      const errorSender: ChannelSender = {
        send: vi.fn().mockRejectedValue(new Error("Network error")),
      };

      const senders: Record<ChannelType, ChannelSender> = {
        discord: errorSender,
        slack: mockSender,
        telegram: mockSender,
        signal: { send: vi.fn() },
        imessage: { send: vi.fn() },
        teams: { send: vi.fn() },
        zalo: { send: vi.fn() },
      };

      await dispatchMorningBriefing(senders, {
        ...opts,
        enabledChannels: ["discord"],
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to send morning briefing to discord"),
      );
      // Should not throw
    });

    it("should skip disabled channels", async () => {
      const senders: Record<ChannelType, ChannelSender> = {
        discord: mockSender,
        slack: mockSender,
        telegram: mockSender,
        signal: { send: vi.fn() },
        imessage: { send: vi.fn() },
        teams: { send: vi.fn() },
        zalo: { send: vi.fn() },
      };

      await dispatchMorningBriefing(senders, {
        ...opts,
        enabledChannels: ["discord"],
      });

      expect(mockSender.send).toHaveBeenCalledTimes(1);
    });

    it("should log success for each channel", async () => {
      const senders: Record<ChannelType, ChannelSender> = {
        discord: mockSender,
        slack: mockSender,
        telegram: mockSender,
        signal: { send: vi.fn() },
        imessage: { send: vi.fn() },
        teams: { send: vi.fn() },
        zalo: { send: vi.fn() },
      };

      await dispatchMorningBriefing(senders, {
        ...opts,
        enabledChannels: ["discord", "slack"],
      });

      expect(mockLogger.info).toHaveBeenCalledWith("[Briefing] Morning briefing sent to discord");
      expect(mockLogger.info).toHaveBeenCalledWith("[Briefing] Morning briefing sent to slack");
    });
  });

  describe("dispatchPreMeetingBriefing", () => {
    it("should dispatch pre-meeting briefing to all enabled channels", async () => {
      const senders: Record<ChannelType, ChannelSender> = {
        discord: mockSender,
        slack: mockSender,
        telegram: mockSender,
        signal: { send: vi.fn() },
        imessage: { send: vi.fn() },
        teams: { send: vi.fn() },
        zalo: { send: vi.fn() },
      };

      await dispatchPreMeetingBriefing(senders, {
        ...opts,
        enabledChannels: ["discord", "slack"],
      });

      expect(mockSender.send).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith("[Briefing] Generating pre-meeting briefing");
    });

    it("should handle pre-meeting briefing errors gracefully", async () => {
      const errorSender: ChannelSender = {
        send: vi.fn().mockRejectedValue(new Error("Service unavailable")),
      };

      const senders: Record<ChannelType, ChannelSender> = {
        discord: errorSender,
        slack: mockSender,
        telegram: mockSender,
        signal: { send: vi.fn() },
        imessage: { send: vi.fn() },
        teams: { send: vi.fn() },
        zalo: { send: vi.fn() },
      };

      await dispatchPreMeetingBriefing(senders, {
        ...opts,
        enabledChannels: ["discord"],
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to send pre-meeting briefing to discord"),
      );
      // Should not throw
    });

    it("should log success messages", async () => {
      const senders: Record<ChannelType, ChannelSender> = {
        discord: mockSender,
        slack: mockSender,
        telegram: mockSender,
        signal: { send: vi.fn() },
        imessage: { send: vi.fn() },
        teams: { send: vi.fn() },
        zalo: { send: vi.fn() },
      };

      await dispatchPreMeetingBriefing(senders, {
        ...opts,
        enabledChannels: ["telegram"],
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        "[Briefing] Pre-meeting briefing sent to telegram",
      );
    });
  });

  describe("without logger", () => {
    it("should work without logger", async () => {
      const senders: Record<ChannelType, ChannelSender> = {
        discord: mockSender,
        slack: mockSender,
        telegram: mockSender,
        signal: { send: vi.fn() },
        imessage: { send: vi.fn() },
        teams: { send: vi.fn() },
        zalo: { send: vi.fn() },
      };

      await dispatchMorningBriefing(senders, {
        enabledChannels: ["discord"],
        // no logger
      });

      expect(mockSender.send).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should handle aggregator errors", async () => {
      vi.resetModules();
      vi.doMock("./aggregator.js", () => ({
        createMorningBriefing: vi.fn().mockRejectedValue(new Error("Aggregation failed")),
        createPreMeetingBriefing: vi.fn().mockResolvedValue({}),
      }));

      // Re-import with mocked aggregator
      const { dispatchMorningBriefing: dispatch } = await import("./channel-dispatcher.js");

      const senders: Record<ChannelType, ChannelSender> = {
        discord: mockSender,
        slack: mockSender,
        telegram: mockSender,
        signal: { send: vi.fn() },
        imessage: { send: vi.fn() },
        teams: { send: vi.fn() },
        zalo: { send: vi.fn() },
      };

      // Should not throw even with aggregator error
      await dispatch(senders, opts);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
