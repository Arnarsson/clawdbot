import type { Canvas } from "../canvas/types.js";
import { renderCanvas } from "../canvas/router.js";

export function canvasToIMessageText(canvas: Canvas): string {
  const rendered = renderCanvas("imessage", canvas);
  return rendered as string;
}

export function sendIMessageCanvas(
  text: string,
  recipientSendMessage: (options: any) => Promise<void>,
): Promise<void> {
  return recipientSendMessage({ body: text });
}
