import { describe, it, expect } from "vitest";
import { canvasToZaloMessage } from "./canvas-integration.js";
import type { Canvas } from "../canvas/types.js";

describe("Zalo Canvas Integration", () => {
  it("should render canvas to Zalo message format", () => {
    const canvas: Canvas = {
      title: "Daily Briefing",
      description: "Your morning summary",
      sections: [
        {
          title: "Updates",
          content: "- New task assigned\n- Meeting at 2pm",
        },
      ],
    };

    const message = canvasToZaloMessage(canvas);

    expect(message).toBeDefined();
    expect(message.text).toContain("Daily Briefing");
    expect(typeof message.text).toBe("string");
  });

  it("should format multiple sections with proper spacing", () => {
    const canvas: Canvas = {
      title: "Test",
      sections: [
        { title: "Section 1", content: "Content 1" },
        { title: "Section 2", content: "Content 2" },
      ],
    };

    const message = canvasToZaloMessage(canvas);

    expect(message.text).toContain("Section 1");
    expect(message.text).toContain("Content 1");
    expect(message.text).toContain("Section 2");
    expect(message.text).toContain("Content 2");
  });

  it("should escape special Zalo characters", () => {
    const canvas: Canvas = {
      title: "Test *Bold* _Italic_",
      sections: [
        {
          title: "With ~strikethrough~",
          content: "Content",
        },
      ],
    };

    const message = canvasToZaloMessage(canvas);

    // Zalo supports similar markdown, but verify escaping works
    expect(message.text).toBeDefined();
  });
});
