import type { Canvas } from "../canvas/types.js";
import { renderCanvas } from "../canvas/router.js";

export function canvasToTelegramMarkdown(canvas: Canvas): string {
  const rendered = renderCanvas("telegram", canvas);
  return rendered as string;
}

export function sendTelegramCanvas(
  text: string,
  chatSendMessage: (options: any) => Promise<void>,
): Promise<void> {
  return chatSendMessage({
    text,
    parse_mode: "Markdown",
  });
}
