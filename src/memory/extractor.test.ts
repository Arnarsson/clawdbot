import { describe, it, expect } from "vitest";
import { extractMemoryItems, shouldExtractMemory } from "./extractor.js";

describe("Memory Extractor", () => {
  it("should detect memory-worthy questions", () => {
    expect(shouldExtractMemory("What did we discuss about the roadmap?")).toBe(true);
    expect(shouldExtractMemory("Remember when we fixed the bug?")).toBe(true);
    expect(shouldExtractMemory("What was the status on the project?")).toBe(true);
  });

  it("should not extract for trivial messages", () => {
    expect(shouldExtractMemory("hello")).toBe(false);
    expect(shouldExtractMemory("thanks")).toBe(false);
  });

  it("should extract key topics from conversation", () => {
    const items = extractMemoryItems({
      message: "We decided to use TypeScript for the new project",
      context: "tech decisions",
    });
    expect(items.length).toBeGreaterThan(0);
  });
});
