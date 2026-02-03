// Patterns that should trigger Jarvis context lookup
const JARVIS_TRIGGERS = [
  /(?:what|remember|recall).{0,50}(?:discuss|talk|mention)/i,
  /(?:status|progress).{0,30}(?:on|with).{0,30}(?:project|task|decision)/i,
  /(?:pending|outstanding|open).{0,30}(?:decision|follow.?up|commitment)/i,
  /(?:decided|choose|approve).{0,50}(?:last|previously|earlier)/i,
];

export function shouldQueryJarvis(message: string): boolean {
  return JARVIS_TRIGGERS.some((pattern) => pattern.test(message));
}

export function extractSearchTopic(message: string): string {
  // Simple extraction: "what did we discuss about X?" → "X"
  const match = message.match(/(?:discuss|talk|decide|plan).+?(?:about|on|for)?\s+([^?]+)/i);
  return match?.[1]?.trim() || message;
}
