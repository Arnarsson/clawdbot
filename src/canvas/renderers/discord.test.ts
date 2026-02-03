import { describe, it, expect } from "vitest";
import { Canvas } from "../types.js";
import { renderDiscordEmbed } from "./discord.js";

describe("Discord Canvas Renderer", () => {
  it("should render canvas to Discord embed format", () => {
    const canvas: Canvas = {
      title: "Daily Briefing",
      description: "Your morning summary",
      sections: [
        {
          title: "Updates",
          content: "- New task assigned\n- Meeting at 2pm",
          actions: [{ label: "View All", url: "https://example.com" }],
        },
      ],
    };

    const embed = renderDiscordEmbed(canvas);
    expect(embed.title).toBe("Daily Briefing");
    expect(embed.description).toBe("Your morning summary");
    expect(embed.fields).toHaveLength(1);
    expect(embed.fields[0].name).toBe("Updates");
  });

  it("should include action buttons in embed", () => {
    const canvas: Canvas = {
      title: "Actions",
      sections: [
        {
          title: "Pending",
          content: "Review pending items",
          actions: [{ label: "Open", url: "https://example.com" }],
        },
      ],
    };

    const embed = renderDiscordEmbed(canvas);
    expect(embed.fields).toBeDefined();
  });
});
