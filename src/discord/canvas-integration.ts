import type { Canvas } from "../canvas/types.js";
import { renderCanvas } from "../canvas/router.js";

interface DiscordEmbedInput {
  title?: string;
  description?: string;
  fields: Array<{ name: string; value: string; inline?: boolean }>;
  color?: number;
}

export function sendDiscordCanvas(
  embed: DiscordEmbedInput,
  channelSendMessage: (options: unknown) => Promise<void>,
): Promise<void> {
  return channelSendMessage({ embeds: [embed] });
}

export function canvasToDiscordEmbed(canvas: Canvas): DiscordEmbedInput {
  const rendered = renderCanvas("discord", canvas);
  // rendered is already in DiscordEmbedInput format from renderDiscordEmbed
  return rendered as DiscordEmbedInput;
}
