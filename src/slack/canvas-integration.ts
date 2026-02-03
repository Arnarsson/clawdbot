import type { Canvas } from "../canvas/types.js";
import { renderCanvas } from "../canvas/router.js";

interface SlackBlock {
  type: string;
  [key: string]: unknown;
}

export function canvasToSlackBlocks(canvas: Canvas): SlackBlock[] {
  const rendered = renderCanvas("slack", canvas);
  // rendered is already in SlackBlock[] format from renderSlackBlocks
  return rendered as SlackBlock[];
}

export function sendSlackCanvas(
  blocks: SlackBlock[],
  channelPostMessage: (options: unknown) => Promise<void>,
): Promise<void> {
  return channelPostMessage({ blocks });
}
