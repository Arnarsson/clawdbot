import { describe, it, expect, vi } from "vitest";
import type { Canvas } from "../canvas/types.js";
import { canvasToSignalText, sendSignalCanvas } from "./canvas-integration.js";

describe("Signal Canvas Integration", () => {
  it("should convert canvas to Signal text format", () => {
    const canvas: Canvas = {
      title: "Alert",
      sections: [{ title: "Status", content: "OK" }],
    };

    const text = canvasToSignalText(canvas);
    expect(typeof text).toBe("string");
    expect(text).toContain("Alert");
  });

  it("should send text to Signal recipient", async () => {
    const mockSend = vi.fn().mockResolvedValue(undefined);
    await sendSignalCanvas("Test message", mockSend);

    expect(mockSend).toHaveBeenCalledWith({ body: "Test message" });
  });
});
