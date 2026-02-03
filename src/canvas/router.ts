import { Canvas } from "./types.js";
import { renderDiscordEmbed } from "./renderers/discord.js";
import { renderSlackBlocks } from "./renderers/slack.js";
import { renderTelegramMarkdown } from "./renderers/telegram.js";

type ChannelType = "discord" | "slack" | "telegram" | "signal" | "imessage" | "teams" | "zalo";

export function renderCanvas(channel: ChannelType, canvas: Canvas): unknown {
  switch (channel) {
    case "discord":
      return renderDiscordEmbed(canvas);
    case "slack":
      return renderSlackBlocks(canvas);
    case "telegram":
      return renderTelegramMarkdown(canvas);
    case "signal":
    case "imessage":
    case "teams":
    case "zalo":
      return renderTelegramMarkdown(canvas); // Fallback to markdown
    default:
      throw new Error(`Unknown channel type: ${channel}`);
  }
}
