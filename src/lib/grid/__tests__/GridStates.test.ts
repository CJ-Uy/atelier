// src/lib/grid/__tests__/GridStates.test.ts
import { describe, it, expect } from 'vitest';
import type { GridStateName } from '../types';
import { getGridState, GRID_STATE_NAMES, graphPaper } from '../GridStates';

const COLS = 12;
const ROWS = 8;
const FLOAT_COUNT = (COLS + 1) * (ROWS + 1) * 2; // 117 vertices × 2 = 234

describe('GRID_STATE_NAMES', () => {
  it('has exactly 14 entries', () => {
    expect(GRID_STATE_NAMES).toHaveLength(14);
  });

  it('contains no duplicates', () => {
    expect(new Set(GRID_STATE_NAMES).size).toBe(GRID_STATE_NAMES.length);
  });
});

describe('graphPaper', () => {
  it('produces FLOAT_COUNT floats', () => {
    expect(graphPaper(COLS, ROWS).length).toBe(FLOAT_COUNT);
  });

  it('first vertex is at (-1, -1) in NDC', () => {
    const r = graphPaper(COLS, ROWS);
    expect(r[0]).toBeCloseTo(-1, 5);
    expect(r[1]).toBeCloseTo(-1, 5);
  });

  it('last vertex is at (1, 1) in NDC', () => {
    const r = graphPaper(COLS, ROWS);
    expect(r[FLOAT_COUNT - 2]).toBeCloseTo(1, 5);
    expect(r[FLOAT_COUNT - 1]).toBeCloseTo(1, 5);
  });
});

describe('getGridState', () => {
  it('returns Float32Array of correct length for every state', () => {
    GRID_STATE_NAMES.forEach((name) => {
      const result = getGridState(name as GridStateName, COLS, ROWS);
      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(FLOAT_COUNT);
    });
  });

  it('throws for unknown state name', () => {
    expect(() => getGridState('nonexistent' as GridStateName, COLS, ROWS)).toThrow();
  });

  it('volleyball: mid-row y < top-row y (net sags)', () => {
    const result = getGridState('volleyball', COLS, ROWS);
    const midCol = Math.floor(COLS / 2);
    const topRowY = result[midCol * 2 + 1];
    const midRow = Math.floor(ROWS / 2);
    const midRowY = result[(midRow * (COLS + 1) + midCol) * 2 + 1];
    expect(midRowY).toBeLessThan(topRowY);
  });

  it('spacetimeWarp: differs from graphPaper', () => {
    const base = graphPaper(COLS, ROWS);
    const warped = getGridState('spacetimeWarp', COLS, ROWS);
    const hasDiff = Array.from(base).some((v, i) => Math.abs(v - warped[i]) > 0.01);
    expect(hasDiff).toBe(true);
  });
});
