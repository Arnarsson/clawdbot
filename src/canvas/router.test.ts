import { describe, it, expect } from "vitest";
import { Canvas } from "./types.js";
import { renderCanvas } from "./router.js";

describe("Canvas Router", () => {
  it("should route Discord canvas rendering", () => {
    const canvas: Canvas = {
      title: "Test",
      sections: [],
    };
    const result = renderCanvas("discord", canvas);
    expect(result.title).toBe("Test");
  });

  it("should route Slack canvas rendering", () => {
    const canvas: Canvas = {
      title: "Test",
      sections: [],
    };
    const result = renderCanvas("slack", canvas);
    expect(Array.isArray(result)).toBe(true);
  });

  it("should route Telegram canvas rendering", () => {
    const canvas: Canvas = {
      title: "Test",
      sections: [],
    };
    const result = renderCanvas("telegram", canvas);
    expect(typeof result).toBe("string");
  });

  it("should route Teams canvas rendering", () => {
    const canvas: Canvas = { title: "Test", sections: [] };
    const result = renderCanvas("teams", canvas);
    expect(result).toBeDefined();
    expect(result).toHaveProperty("body");
  });

  it("should route Zalo canvas rendering", () => {
    const canvas: Canvas = { title: "Test", sections: [] };
    const result = renderCanvas("zalo", canvas);
    expect(result).toBeDefined();
    expect(result).toHaveProperty("text");
  });
});
