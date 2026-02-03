import type { Canvas } from '../../src/canvas/types.js';
import { renderCanvas } from '../../src/canvas/router.js';

export function canvasToZaloText(canvas: Canvas): string {
  const rendered = renderCanvas('zalo', canvas);
  return rendered as string;
}

export function sendZaloCanvas(
  text: string,
  userSendMessage: (options: any) => Promise<void>
): Promise<void> {
  return userSendMessage({ message: text });
}
