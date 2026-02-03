export interface MemoryItem {
  type: "decision" | "fact" | "commitment" | "insight";
  content: string;
  context?: string;
}

export function shouldExtractMemory(message: string): boolean {
  const patterns = [
    /(?:what|remember|recall).{0,50}(?:discuss|talk|mention|decide|fixed|bug)/i,
    /(?:status|progress).{0,30}(?:on|with).{0,30}(?:project|task)/i,
    /(?:we decided|we chose|we agreed).{0,50}/i,
    /(?:important|key|critical).{0,30}(?:decision|insight|finding)/i,
  ];
  return patterns.some((p) => p.test(message));
}

export function extractMemoryItems(opts: { message: string; context?: string }): MemoryItem[] {
  const items: MemoryItem[] = [];

  if (opts.message.includes("decided") || opts.message.includes("chose")) {
    items.push({
      type: "decision",
      content: opts.message,
      context: opts.context,
    });
  }

  return items;
}
