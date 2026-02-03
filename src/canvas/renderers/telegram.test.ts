import { describe, it, expect } from "vitest";
import { Canvas } from "../types.js";
import { renderTelegramMarkdown } from "./telegram.js";

describe("Telegram Canvas Renderer", () => {
  it("should render canvas to Telegram markdown", () => {
    const canvas: Canvas = {
      title: "Daily Briefing",
      sections: [
        {
          title: "Updates",
          content: "• New task assigned",
        },
      ],
    };

    const text = renderTelegramMarkdown(canvas);
    expect(text).toContain("Daily Briefing");
    expect(text).toContain("Updates");
    expect(typeof text).toBe("string");
  });
});
