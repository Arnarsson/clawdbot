import { describe, it, expect, vi } from "vitest";
import type { Canvas } from "../canvas/types.js";
import { canvasToSlackBlocks, sendSlackCanvas } from "./canvas-integration.js";

describe("Slack Canvas Integration", () => {
  it("should convert canvas to Slack blocks format", () => {
    const canvas: Canvas = {
      title: "Test Briefing",
      sections: [{ title: "Updates", content: "Item 1" }],
    };

    const blocks = canvasToSlackBlocks(canvas);
    expect(Array.isArray(blocks)).toBe(true);
    expect(blocks[0].type).toBe("header");
  });

  it("should include title in header block", () => {
    const canvas: Canvas = {
      title: "Daily Standup",
      sections: [],
    };

    const blocks = canvasToSlackBlocks(canvas);
    expect(blocks[0]).toEqual({
      type: "header",
      text: {
        type: "plain_text",
        text: "Daily Standup",
      },
    });
  });

  it("should include description as section block", () => {
    const canvas: Canvas = {
      title: "Test",
      description: "This is a description",
      sections: [],
    };

    const blocks = canvasToSlackBlocks(canvas);
    expect(blocks[1]).toEqual({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "This is a description",
      },
    });
  });

  it("should convert sections to Slack blocks", () => {
    const canvas: Canvas = {
      title: "Test",
      sections: [
        { title: "Section 1", content: "Content 1" },
        { title: "Section 2", content: "Content 2" },
      ],
    };

    const blocks = canvasToSlackBlocks(canvas);
    expect(blocks.length).toBe(3); // header + 2 sections
    expect(blocks[1].type).toBe("section");
    expect(blocks[2].type).toBe("section");
  });

  it("should format section title in bold", () => {
    const canvas: Canvas = {
      title: "Test",
      sections: [{ title: "Updates", content: "• Item 1\n• Item 2" }],
    };

    const blocks = canvasToSlackBlocks(canvas);
    const sectionBlock = blocks[1];
    expect(sectionBlock.text.text).toContain("*Updates*");
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

    const blocks = canvasToSlackBlocks(canvas);
    expect(blocks.length).toBe(4); // header + 3 sections
  });

  it("should send blocks to Slack channel", async () => {
    const blocks = [{ type: "header", text: { type: "plain_text", text: "Test" } }];
    const mockPost = vi.fn().mockResolvedValue(undefined);

    await sendSlackCanvas(blocks, mockPost);
    expect(mockPost).toHaveBeenCalledWith({ blocks });
  });

  it("should handle empty sections gracefully", () => {
    const canvas: Canvas = {
      title: "Empty Sections",
      sections: [{ title: "Empty", content: "" }],
    };

    const blocks = canvasToSlackBlocks(canvas);
    const sectionBlock = blocks[1];
    expect(sectionBlock.text.text).toContain("*Empty*");
  });
});
