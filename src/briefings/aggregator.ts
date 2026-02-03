import type { Canvas, CanvasSection } from "../canvas/types.js";

// Lazy-loaded Jarvis skill to avoid rootDir conflicts
let cachedJarvis: {
  getContext: () => Promise<{
    pending_decisions: Array<{ title: string }>;
    open_loops: Array<{ title: string }>;
  }>;
} | null = null;

async function getJarvisSkill() {
  if (cachedJarvis) return cachedJarvis;

  try {
    // Try compiled dist version first
    cachedJarvis = await import("../../skills/jarvis/dist/index.js");
  } catch {
    // Fallback: return mock with empty context
    cachedJarvis = {
      getContext: async () => ({
        pending_decisions: [],
        open_loops: [],
      }),
    };
  }

  return cachedJarvis;
}

export async function createMorningBriefing(): Promise<Canvas> {
  const jarvis = await getJarvisSkill();
  const context = await jarvis.getContext();

  const sections: CanvasSection[] = [];

  if (context.pending_decisions.length > 0) {
    sections.push({
      title: "Pending Decisions",
      content: context.pending_decisions
        .slice(0, 5)
        .map((d) => `• ${d.title}`)
        .join("\n"),
    });
  }

  if (context.open_loops.length > 0) {
    sections.push({
      title: "Open Loops",
      content: context.open_loops
        .slice(0, 5)
        .map((l) => `• ${l.title}`)
        .join("\n"),
    });
  }

  return {
    title: "☀️ Morning Briefing",
    description: "Your daily context and pending items",
    sections,
  };
}

export async function createPreMeetingBriefing(): Promise<Canvas> {
  const jarvis = await getJarvisSkill();
  const context = await jarvis.getContext();

  const sections: CanvasSection[] = [];

  if (context.pending_decisions.length > 0) {
    sections.push({
      title: "Decisions Needed",
      content: context.pending_decisions
        .slice(0, 3)
        .map((d) => `• ${d.title}`)
        .join("\n"),
    });
  }

  return {
    title: "📅 Pre-Meeting Briefing",
    description: "Quick context before your meeting",
    sections,
  };
}
