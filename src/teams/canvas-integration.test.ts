import { describe, it, expect } from "vitest";
import { canvasToTeamsAdaptiveCard } from "./canvas-integration.js";
import type { Canvas } from "../canvas/types.js";

describe("Teams Canvas Integration", () => {
  it("should render canvas to Teams Adaptive Card format", () => {
    const canvas: Canvas = {
      title: "Daily Briefing",
      description: "Your morning summary",
      sections: [
        {
          title: "Updates",
          content: "- New task assigned\n- Meeting at 2pm",
        },
      ],
    };

    const card = canvasToTeamsAdaptiveCard(canvas);

    expect(card).toBeDefined();
    expect(card.body).toBeDefined();
    expect(Array.isArray(card.body)).toBe(true);
    expect(card.body[0]?.text).toContain("Daily Briefing");
  });

  it("should format sections as Teams blocks", () => {
    const canvas: Canvas = {
      title: "Test",
      sections: [
        { title: "Section 1", content: "Content 1" },
        { title: "Section 2", content: "Content 2" },
      ],
    };

    const card = canvasToTeamsAdaptiveCard(canvas);

    const sectionBlocks = card.body?.filter(
      (b: unknown) => typeof b === "object" && b !== null && "text" in b && "weight" in b,
    );
    expect((sectionBlocks?.length ?? 0) + 1).toBeGreaterThanOrEqual(2);
  });
});
