import { describe, it, expect, vi } from 'vitest';
import * as jarvis from './index.js';

describe('Jarvis Skill', () => {
  it('exports all required functions', () => {
    expect(typeof jarvis.search).toBe('function');
    expect(typeof jarvis.writeTask).toBe('function');
    expect(typeof jarvis.writeDecision).toBe('function');
    expect(typeof jarvis.getContext).toBe('function');
  });

  // Note: Live API tests require JARVIS_API_KEY set
  // Run with: JARVIS_API_KEY=test-key npm test
});
