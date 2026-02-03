import type { Canvas } from '../../src/canvas/types.js';
import { renderCanvas } from '../../src/canvas/router.js';

export function canvasToTeamsAdaptiveCard(canvas: Canvas): string {
  // Teams can render markdown in adaptive cards, use the markdown fallback
  const rendered = renderCanvas('teams', canvas);
  return rendered as string;
}

export function sendTeamsCanvas(
  text: string,
  channelPostMessage: (options: any) => Promise<void>
): Promise<void> {
  return channelPostMessage({
    body: text,
    contentType: 'text/markdown',
  });
}
