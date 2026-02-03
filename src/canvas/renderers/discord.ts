import { Canvas, CanvasSection } from "../types.js";

interface DiscordEmbed {
  title?: string;
  description?: string;
  fields: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  color?: number;
}

export function renderDiscordEmbed(canvas: Canvas): DiscordEmbed {
  const fields = canvas.sections.map((section: CanvasSection) => ({
    name: section.title,
    value: section.content || "(empty)",
    inline: false,
  }));

  return {
    title: canvas.title,
    description: canvas.description,
    fields,
    color: 0x5865f2, // Discord blurple
  };
}
