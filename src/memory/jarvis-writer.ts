// Lazy-loaded Jarvis skill to avoid rootDir conflicts
let cachedJarvis: {
  writeDecision: (payload: unknown) => Promise<{ id: string }>;
  writeTask: (payload: unknown) => Promise<{ id: string }>;
} | null = null;

async function getJarvisSkill() {
  if (cachedJarvis) return cachedJarvis;

  try {
    // Try compiled dist version first
    cachedJarvis = await import("../../skills/jarvis/dist/index.js");
  } catch {
    // Fallback: dynamic import with type stubs
    cachedJarvis = {
      writeDecision: async (payload: unknown) => {
        console.warn("[Jarvis] Not initialized, using mock decision write");
        return { id: `mock-decision-${Date.now()}` };
      },
      writeTask: async (payload: unknown) => {
        console.warn("[Jarvis] Not initialized, using mock task write");
        return { id: `mock-task-${Date.now()}` };
      },
    };
  }

  return cachedJarvis;
}

export async function writeDecisionToJarvis(
  content: string,
  _context: string,
): Promise<{ id: string }> {
  const jarvis = await getJarvisSkill();

  const title = content.split("\n")[0].substring(0, 100);
  return jarvis.writeDecision({
    title,
    description: content,
    priority: "medium",
  });
}

export async function writeCommitmentToJarvis(
  content: string,
  _context: string,
): Promise<{ id: string }> {
  const jarvis = await getJarvisSkill();

  const title = content.split("\n")[0].substring(0, 100);
  return jarvis.writeTask({
    title,
    description: content,
    priority: "high",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
}
