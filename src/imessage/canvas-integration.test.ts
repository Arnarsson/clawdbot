import { describe, it, expect, vi } from "vitest";
import type { Canvas } from "../canvas/types.js";
import { canvasToIMessageText, sendIMessageCanvas } from "./canvas-integration.js";

describe("iMessage Canvas Integration", () => {
  it("should convert canvas to iMessage text", () => {
    const canvas: Canvas = {
      title: "Reminder",
      sections: [{ title: "Action", content: "Review document" }],
    };

    const text = canvasToIMessageText(canvas);
    expect(typeof text).toBe("string");
    expect(text).toContain("Reminder");
  });

  it("should send text via iMessage", async () => {
    const mockSend = vi.fn().mockResolvedValue(undefined);
    await sendIMessageCanvas("Test", mockSend);
    expect(mockSend).toHaveBeenCalledWith({ body: "Test" });
  });
});
