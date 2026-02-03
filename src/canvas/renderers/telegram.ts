import { Canvas, CanvasSection } from "../types.js";

export function renderTelegramMarkdown(canvas: Canvas): string {
  let text = `*${escapeMarkdown(canvas.title)}*\n`;

  if (canvas.description) {
    text += `${escapeMarkdown(canvas.description)}\n\n`;
  }

  canvas.sections.forEach((section: CanvasSection) => {
    text += `*${escapeMarkdown(section.title)}*\n`;
    text += `${escapeMarkdown(section.content)}\n\n`;
  });

  return text;
}

function escapeMarkdown(text: string): string {
  return text
    .replace(/\*/g, "\\*")
    .replace(/_/g, "\\_")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\./g, "\\.")
    .replace(/!/g, "\\!");
}
