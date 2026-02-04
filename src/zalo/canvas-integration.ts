import type { Canvas, CanvasSection } from "../canvas/types.js";

export interface ZaloMessage {
  text: string;
  attachments?: Array<{
    type: string;
    url: string;
    title?: string;
  }>;
}

export function canvasToZaloMessage(canvas: Canvas): ZaloMessage {
  let text = `*${escapeZaloText(canvas.title)}*\n`;

  if (canvas.description) {
    text += `${escapeZaloText(canvas.description)}\n\n`;
  }

  for (const section of canvas.sections) {
    text += `*${escapeZaloText(section.title)}*\n`;
    text += `${escapeZaloText(section.content)}\n`;

    if (section.actions && section.actions.length > 0) {
      for (const action of section.actions) {
        if (action.url) {
          text += `[${action.label}](${action.url})\n`;
        }
      }
    }

    text += "\n";
  }

  return { text };
}

function escapeZaloText(text: string): string {
  // Zalo uses markdown-like formatting but with some differences
  // For safety, we'll use minimal escaping and let the API handle most formatting
  return text.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\|/g, "\\|");
}

export function sendZaloCanvas(
  message: ZaloMessage,
  channelSendMessage: (options: unknown) => Promise<void>,
): Promise<void> {
  return channelSendMessage({
    text: message.text,
    attachments: message.attachments,
  });
}
