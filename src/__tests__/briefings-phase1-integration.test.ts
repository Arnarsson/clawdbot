import { describe, it, expect, vi } from "vitest";
import type { Canvas } from "../canvas/types.js";
import { renderCanvas } from "../canvas/router.js";
import { canvasToTeamsAdaptiveCard, sendTeamsCanvas } from "../teams/canvas-integration.js";
import { canvasToZaloMessage, sendZaloCanvas } from "../zalo/canvas-integration.js";
import { getPhase2Config } from "../config/phase2-4-config.js";
import type { BriefingScheduler } from "../briefings/scheduler.js";
import { createBriefingScheduler } from "../briefings/scheduler.js";
import { initializeBriefingScheduler } from "../briefings/runtime-init.js";

describe("Briefings Phase 1 Integration", () => {
  const mockCanvas: Canvas = {
    title: "Test Briefing",
    description: "Integration test",
    sections: [
      {
        title: "Updates",
        content: "Test content",
        actions: [{ label: "View", url: "https://example.com" }],
      },
    ],
  };

  it("should render canvas to all supported channel formats", () => {
    const channels: Array<
      "discord" | "slack" | "telegram" | "teams" | "zalo" | "signal" | "imessage"
    > = ["discord", "slack", "telegram", "teams", "zalo", "signal", "imessage"];

    for (const channel of channels) {
      const result = renderCanvas(channel, mockCanvas);
      expect(result).toBeDefined();
    }
  });

  it("should render Teams Adaptive Card with proper structure", () => {
    const card = canvasToTeamsAdaptiveCard(mockCanvas);
    expect(card.$schema).toBe("http://adaptivecards.io/schemas/adaptive-card.json");
    expect(card.body.length).toBeGreaterThan(0);
  });

  it("should render Zalo message with proper formatting", () => {
    const message = canvasToZaloMessage(mockCanvas);
    expect(message.text).toContain("Test Briefing");
    expect(message.text).toContain("Updates");
  });

  it("should load valid Phase2 config", () => {
    const config = getPhase2Config();
    expect(config.briefings).toBeDefined();
    expect(config.briefings.deliveryChannels).toBeDefined();
    expect(Array.isArray(config.briefings.deliveryChannels)).toBe(true);
  });

  it("should create briefing scheduler", () => {
    const scheduler = createBriefingScheduler();
    expect(scheduler).toBeDefined();
    expect(scheduler.start).toBeDefined();
    expect(scheduler.stop).toBeDefined();
  });

  it("should support all Phase2 channel types in config", () => {
    const config = getPhase2Config();
    const validChannels = ["discord", "slack", "telegram", "signal", "imessage", "teams", "zalo"];
    for (const channel of config.briefings.deliveryChannels) {
      expect(validChannels).toContain(channel);
    }
  });

  it("should initialize briefing scheduler from config", async () => {
    const mockCronService = {
      add: vi.fn().mockResolvedValue({ id: "job-1" }),
      list: vi.fn().mockResolvedValue([]),
      remove: vi.fn().mockResolvedValue(undefined),
    };

    const config = getPhase2Config();
    const handle = await initializeBriefingScheduler(mockCronService as any, config.briefings);

    expect(handle).toBeDefined();
    expect(handle.stop).toBeDefined();
  });

  it("should properly format canvas with multiple sections", () => {
    const complexCanvas: Canvas = {
      title: "Weekly Summary",
      description: "Week of Feb 4, 2026",
      sections: [
        {
          title: "Completed",
          content: "• Task 1\n• Task 2\n• Task 3",
        },
        {
          title: "In Progress",
          content: "• Feature A\n• Bug Fix B",
        },
        {
          title: "Blocked",
          content: "• Waiting on review",
          actions: [{ label: "Check Status", url: "https://example.com/status" }],
        },
      ],
    };

    // Verify all renderers handle complex canvas
    const discord = renderCanvas("discord", complexCanvas);
    const slack = renderCanvas("slack", complexCanvas);
    const telegram = renderCanvas("telegram", complexCanvas);
    const teams = renderCanvas("teams", complexCanvas);
    const zalo = renderCanvas("zalo", complexCanvas);

    expect(discord).toBeDefined();
    expect(slack).toBeDefined();
    expect(telegram).toBeDefined();
    expect(teams).toBeDefined();
    expect(zalo).toBeDefined();
  });

  it("should handle empty canvas gracefully", () => {
    const emptyCanvas: Canvas = {
      title: "Empty",
      sections: [],
    };

    const discord = renderCanvas("discord", emptyCanvas);
    const slack = renderCanvas("slack", emptyCanvas);
    const telegram = renderCanvas("telegram", emptyCanvas);
    const teams = renderCanvas("teams", emptyCanvas);
    const zalo = renderCanvas("zalo", emptyCanvas);

    expect(discord).toBeDefined();
    expect(slack).toBeDefined();
    expect(telegram).toBeDefined();
    expect(teams).toBeDefined();
    expect(zalo).toBeDefined();
  });
});
