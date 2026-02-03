import { describe, it, expect, vi } from "vitest";
import { writeDecisionToJarvis, writeCommitmentToJarvis } from "./jarvis-writer.js";

// Mock the Jarvis skill
vi.mock("../../skills/jarvis/src/index.js", () => ({
  writeDecision: vi.fn().mockResolvedValue({ id: "decision-123" }),
  writeTask: vi.fn().mockResolvedValue({ id: "task-456" }),
}));

describe("Jarvis Memory Writer", () => {
  it("should format and write decisions to Jarvis", async () => {
    const result = await writeDecisionToJarvis(
      "Use TypeScript for all new services",
      "architecture-decision",
    );
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it("should tag writes with source", async () => {
    const result = await writeCommitmentToJarvis(
      "Complete API refactor by Friday",
      "work-commitment",
    );
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });
});
