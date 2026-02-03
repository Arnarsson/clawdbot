import { describe, it, expect } from "vitest";
import { Canvas } from "../types.js";
import { renderSlackBlocks } from "./slack.js";

describe("Slack Canvas Renderer", () => {
  it("should render canvas to Slack block format", () => {
    const canvas: Canvas = {
      title: "Daily Briefing",
      description: "Your morning summary",
      sections: [
        {
          title: "Updates",
          content: "• New task assigned\n• Meeting at 2pm",
        },
      ],
    };

    const blocks = renderSlackBlocks(canvas);
    expect(Array.isArray(blocks)).toBe(true);
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks[0].type).toBe("header");
  });
});
