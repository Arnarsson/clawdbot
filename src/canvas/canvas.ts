// src/canvas/canvas.ts
import { Canvas, CanvasSection, CanvasAction } from "./types";

export function createCanvas(opts: { title: string; description?: string }): Canvas {
  return {
    title: opts.title,
    description: opts.description,
    sections: [],
  };
}

export function addSection(canvas: Canvas, section: CanvasSection): Canvas {
  return {
    ...canvas,
    sections: [...canvas.sections, { ...section, actions: [] }],
  };
}

export function addAction(canvas: Canvas, sectionIndex: number, action: CanvasAction): Canvas {
  const sections = [...canvas.sections];
  sections[sectionIndex] = {
    ...sections[sectionIndex],
    actions: [...(sections[sectionIndex].actions ?? []), action],
  };
  return { ...canvas, sections };
}
