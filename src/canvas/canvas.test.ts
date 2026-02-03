// src/canvas/canvas.test.ts
import { describe, it, expect } from "vitest";
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

  it("should throw error when adding action to invalid section index", () => {
    const canvas = createCanvas({ title: "Test" });
    addSection(canvas, { title: "Section", content: "" });

    expect(() => addAction(canvas, 999, { label: "Invalid" })).toThrow();
    expect(() => addAction(canvas, -1, { label: "Invalid" })).toThrow();
  });

  it("should maintain immutability - original canvas unchanged", () => {
    const canvas = createCanvas({ title: "Test" });
    const updated = addSection(canvas, { title: "New", content: "content" });

    expect(canvas.sections).toHaveLength(0);
    expect(updated.sections).toHaveLength(1);
    expect(canvas).not.toBe(updated);
  });

  it("should preserve metadata when adding section", () => {
    const canvas = createCanvas({ title: "Test", description: "Desc" });
    const section = {
      title: "S",
      content: "C",
      metadata: { custom: "value" },
    };
    const updated = addSection(canvas, section);

    expect(updated.sections[0].metadata).toEqual({ custom: "value" });
  });
});
