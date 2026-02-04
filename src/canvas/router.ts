import { Canvas } from "./types.js";
import { renderDiscordEmbed } from "./renderers/discord.js";
import { renderSlackBlocks } from "./renderers/slack.js";
import { renderTelegramMarkdown } from "./renderers/telegram.js";
import { canvasToTeamsAdaptiveCard } from "../teams/canvas-integration.js";
import { canvasToZaloMessage } from "../zalo/canvas-integration.js";

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
      return renderTelegramMarkdown(canvas); // Fallback to markdown
    case "teams":
      return canvasToTeamsAdaptiveCard(canvas);
    case "zalo":
      return canvasToZaloMessage(canvas);
    default: {
      const _exhaustive: never = channel;
      return _exhaustive;
    }
  }
}
