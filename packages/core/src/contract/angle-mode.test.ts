// Enum-shape and default tests for the angle mode (CALC-F02).

import { describe, expect, it } from 'vitest';

import { AngleMode, DEFAULT_ANGLE_MODE } from './angle-mode.js';

describe('AngleMode', () => {
  it('exposes exactly Degrees and Radians for v0', () => {
    expect(Object.keys(AngleMode).sort()).toEqual(['Degrees', 'Radians']);
  });

  it('defaults to Degrees (FR19, least-surprise divergence from the device)', () => {
    expect(DEFAULT_ANGLE_MODE).toBe(AngleMode.Degrees);
  });

  it('maps each mode to its own readable string token', () => {
    expect(AngleMode.Degrees).toBe('Degrees');
    expect(AngleMode.Radians).toBe('Radians');
  });
});
