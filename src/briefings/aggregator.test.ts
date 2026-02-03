import { describe, it, expect, vi } from "vitest";
import { createMorningBriefing, createPreMeetingBriefing } from "./aggregator.js";

// Mock the Jarvis skill
vi.mock("../../skills/jarvis/src/index.js", () => ({
  getContext: vi.fn().mockResolvedValue({
    pending_decisions: [
      { id: "dec1", title: "API design decision", status: "pending" as const },
      { id: "dec2", title: "Tech stack choice", status: "pending" as const },
    ],
    open_loops: [
      {
        id: "loop1",
        title: "Waiting on deployment",
        status: "open" as const,
        type: "waiting_on" as const,
      },
      {
        id: "loop2",
        title: "Follow up with team",
        status: "open" as const,
        type: "follow_up" as const,
      },
    ],
    recent_memory_count: 42,
  }),
}));

describe("Briefing Aggregator", () => {
  it("should create morning briefing canvas", async () => {
    const briefing = await createMorningBriefing();
    expect(briefing.title).toContain("Morning");
    expect(briefing.sections.length).toBeGreaterThan(0);
  });

  it("should create pre-meeting briefing", async () => {
    const briefing = await createPreMeetingBriefing();
    expect(briefing.title).toContain("Meeting");
    expect(briefing.sections.length).toBeGreaterThan(0);
  });
});
