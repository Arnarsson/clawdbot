export async function writeDecisionToJarvis(
  content: string,
  context: string,
): Promise<{ id: string }> {
  const jarvis = await import("../../skills/jarvis/src/index.js");

  const title = content.split("\n")[0].substring(0, 100);
  return jarvis.writeDecision({
    title,
    description: content,
    priority: "medium",
  });
}

export async function writeCommitmentToJarvis(
  content: string,
  context: string,
): Promise<{ id: string }> {
  const jarvis = await import("../../skills/jarvis/src/index.js");

  const title = content.split("\n")[0].substring(0, 100);
  return jarvis.writeTask({
    title,
    description: content,
    priority: "high",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
}
