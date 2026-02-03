// src/canvas/canvas.test.ts
import { describe, it, expect } from "vitest";
import { Canvas, CanvasSection, CanvasAction } from "./types";
import { createCanvas, addSection, addAction } from "./canvas";

describe("Canvas", () => {
  it("should create a canvas with title and sections", () => {
    const canvas = createCanvas({ title: "Daily Briefing" });
    expect(canvas.title).toBe("Daily Briefing");
    expect(canvas.sections).toHaveLength(0);
  });

  it("should add sections to canvas", () => {
    const canvas = createCanvas({ title: "Test" });
    const updated = addSection(canvas, {
      title: "Updates",
      content: "New items",
    });
    expect(updated.sections).toHaveLength(1);
    expect(updated.sections[0].title).toBe("Updates");
  });

  it("should add actions to sections", () => {
    const canvas = createCanvas({ title: "Test" });
    let updated = addSection(canvas, { title: "Actions", content: "" });
    updated = addAction(updated, 0, {
      label: "View All",
      url: "https://example.com",
    });
    expect(updated.sections[0].actions).toHaveLength(1);
  });
});
