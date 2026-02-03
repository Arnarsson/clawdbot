import { describe, it, expect, vi } from 'vitest';
import type { Canvas } from '../../src/canvas/types.js';
import { canvasToZaloText, sendZaloCanvas } from './canvas-integration.js';

describe('Zalo Canvas Integration', () => {
  it('should convert canvas to Zalo text', () => {
    const canvas: Canvas = {
      title: 'Notice',
      sections: [{ title: 'Details', content: 'Important update' }],
    };

    const text = canvasToZaloText(canvas);
    expect(typeof text).toBe('string');
    expect(text).toContain('Notice');
  });

  it('should send text to Zalo user', async () => {
    const mockSend = vi.fn().mockResolvedValue(undefined);
    await sendZaloCanvas('Hello', mockSend);
    expect(mockSend).toHaveBeenCalledWith({ message: 'Hello' });
  });
});
