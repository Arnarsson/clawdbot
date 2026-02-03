import type { Canvas } from "../canvas/types.js";
import { renderCanvas } from "../canvas/router.js";

export function canvasToSignalText(canvas: Canvas): string {
  // Signal uses plain markdown like Telegram fallback
  const rendered = renderCanvas("signal", canvas);
  return rendered as string;
}

export function sendSignalCanvas(
  text: string,
  recipientSendMessage: (options: any) => Promise<void>,
): Promise<void> {
  return recipientSendMessage({ body: text });
}
