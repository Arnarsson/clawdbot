import { describe, it, expect, vi } from "vitest";
import type { Canvas } from "../canvas/types.js";
import { canvasToDiscordEmbed, sendDiscordCanvas } from "./canvas-integration.js";

describe("Discord Canvas Integration", () => {
  it("should convert canvas to Discord embed format", () => {
    const canvas: Canvas = {
      title: "Test Briefing",
      description: "Morning briefing",
      sections: [{ title: "Updates", content: "• Task 1\n• Task 2" }],
    };

    const embed = canvasToDiscordEmbed(canvas);
    expect(embed.title).toBe("Test Briefing");
    expect(embed.description).toBe("Morning briefing");
    expect(embed.fields.length).toBe(1);
    expect(embed.fields[0]).toEqual({
      name: "Updates",
      value: "• Task 1\n• Task 2",
      inline: false,
    });
  });

  it("should include color in Discord embed", () => {
    const canvas: Canvas = {
      title: "Test",
      sections: [{ title: "Section", content: "Content" }],
    };

    const embed = canvasToDiscordEmbed(canvas);
    expect(embed.color).toBe(0x5865f2); // Discord blurple
  });

  it("should handle multiple sections", () => {
    const canvas: Canvas = {
      title: "Multi-section",
      sections: [
        { title: "Section 1", content: "Content 1" },
        { title: "Section 2", content: "Content 2" },
        { title: "Section 3", content: "Content 3" },
      ],
    };

    const embed = canvasToDiscordEmbed(canvas);
    expect(embed.fields.length).toBe(3);
    expect(embed.fields[1].name).toBe("Section 2");
  });

  it("should send embed to Discord channel", async () => {
    const embed = { title: "Test", fields: [] };
    const mockSend = vi.fn().mockResolvedValue(undefined);

    await sendDiscordCanvas(embed, mockSend);
    expect(mockSend).toHaveBeenCalledWith({ embeds: [embed] });
  });

  it("should handle empty sections gracefully", () => {
    const canvas: Canvas = {
      title: "Empty Sections",
      sections: [{ title: "Empty", content: "" }],
    };

    const embed = canvasToDiscordEmbed(canvas);
    expect(embed.fields[0].value).toBe("(empty)");
  });
});
