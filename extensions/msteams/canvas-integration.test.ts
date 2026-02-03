import { describe, it, expect, vi } from 'vitest';
import type { Canvas } from '../../src/canvas/types.js';
import { canvasToTeamsAdaptiveCard, sendTeamsCanvas } from './canvas-integration.js';

describe('Teams Canvas Integration', () => {
  it('should convert canvas to Teams format', () => {
    const canvas: Canvas = {
      title: 'Update',
      sections: [{ title: 'Info', content: 'New announcement' }],
    };

    const text = canvasToTeamsAdaptiveCard(canvas);
    expect(typeof text).toBe('string');
    expect(text).toContain('Update');
  });

  it('should send to Teams channel', async () => {
    const mockPost = vi.fn().mockResolvedValue(undefined);
    await sendTeamsCanvas('*Bold*', mockPost);
    expect(mockPost).toHaveBeenCalledWith({
      body: '*Bold*',
      contentType: 'text/markdown',
    });
  });
});
