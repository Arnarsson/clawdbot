import { describe, it, expect, vi } from "vitest";
import type { Canvas } from "../canvas/types.js";
import { canvasToTelegramMarkdown, sendTelegramCanvas } from "./canvas-integration.js";

describe("Telegram Canvas Integration", () => {
  it("should convert canvas to Telegram markdown", () => {
    const canvas: Canvas = {
      title: "Test",
      sections: [{ title: "Items", content: "Item 1" }],
    };

    const text = canvasToTelegramMarkdown(canvas);
    expect(typeof text).toBe("string");
    expect(text).toContain("Test");
  });

  it("should send markdown to Telegram", async () => {
    const mockSend = vi.fn().mockResolvedValue(undefined);
    await sendTelegramCanvas("*Test*", mockSend);

    expect(mockSend).toHaveBeenCalledWith({
      text: "*Test*",
      parse_mode: "Markdown",
    });
  });
});
