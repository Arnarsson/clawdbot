// src/canvas/canvas.ts
import { Canvas, CanvasSection, CanvasAction } from "./types.js";

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
  if (sectionIndex < 0 || sectionIndex >= canvas.sections.length) {
    throw new Error(
      `Section index ${sectionIndex} out of bounds (canvas has ${canvas.sections.length} sections)`,
    );
  }
  const sections = [...canvas.sections];
  sections[sectionIndex] = {
    ...sections[sectionIndex],
    actions: [...(sections[sectionIndex].actions ?? []), action],
  };
  return { ...canvas, sections };
}
