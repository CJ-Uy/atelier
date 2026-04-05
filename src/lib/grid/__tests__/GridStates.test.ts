// src/lib/grid/__tests__/GridStates.test.ts
import { describe, it, expect } from 'vitest';
import type { GridStateName } from '../types';
import { getGridState, GRID_STATE_NAMES, graphPaper } from '../GridStates';

const COLS = 12;
const ROWS = 8;
const VERT_COUNT = (COLS + 1) * (ROWS + 1); // 117

describe('GRID_STATE_NAMES', () => {
  it('has exactly 17 entries', () => {
    expect(GRID_STATE_NAMES).toHaveLength(17);
  });

  it('contains no duplicates', () => {
    expect(new Set(GRID_STATE_NAMES).size).toBe(GRID_STATE_NAMES.length);
  });
});

describe('graphPaper', () => {
  it('produces correct number of position floats', () => {
    const r = graphPaper(COLS, ROWS);
    expect(r.positions.length).toBe(VERT_COUNT * 2);
  });

  it('produces correct number of alpha floats', () => {
    const r = graphPaper(COLS, ROWS);
    expect(r.alphas.length).toBe(VERT_COUNT);
  });

  it('first vertex is at (-1, -1) in NDC', () => {
    const r = graphPaper(COLS, ROWS);
    expect(r.positions[0]).toBeCloseTo(-1, 5);
    expect(r.positions[1]).toBeCloseTo(-1, 5);
  });

  it('last vertex is at (1, 1) in NDC', () => {
    const r = graphPaper(COLS, ROWS);
    expect(r.positions[VERT_COUNT * 2 - 2]).toBeCloseTo(1, 5);
    expect(r.positions[VERT_COUNT * 2 - 1]).toBeCloseTo(1, 5);
  });

  it('all alphas are 1', () => {
    const r = graphPaper(COLS, ROWS);
    for (let i = 0; i < r.alphas.length; i++) {
      expect(r.alphas[i]).toBe(1);
    }
  });
});

describe('getGridState', () => {
  it('returns GridState with correct lengths for every state', () => {
    GRID_STATE_NAMES.forEach((name) => {
      const result = getGridState(name as GridStateName, COLS, ROWS);
      expect(result.positions).toBeInstanceOf(Float32Array);
      expect(result.positions.length).toBe(VERT_COUNT * 2);
      expect(result.alphas).toBeInstanceOf(Float32Array);
      expect(result.alphas.length).toBe(VERT_COUNT);
    });
  });

  it('throws for unknown state name', () => {
    expect(() => getGridState('nonexistent' as GridStateName, COLS, ROWS)).toThrow();
  });

  it('volleyball: net center sags below net edge (center col y < edge col y in same row)', () => {
    const result = getGridState('volleyball', COLS, ROWS);
    // Pick a net row (roughly middle of the grid)
    const netRow = Math.round(ROWS * 0.6);
    const centerCol = Math.floor(COLS / 2);
    const edgeCol = 1;
    const centerY = result.positions[(netRow * (COLS + 1) + centerCol) * 2 + 1];
    const edgeY   = result.positions[(netRow * (COLS + 1) + edgeCol) * 2 + 1];
    // Center should sag lower than edges
    expect(centerY).toBeLessThan(edgeY);
  });

  it('spacetimeWarp: differs from graphPaper', () => {
    const base = graphPaper(COLS, ROWS);
    const warped = getGridState('spacetimeWarp', COLS, ROWS);
    const hasDiff = Array.from(base.positions).some((v, i) => Math.abs(v - warped.positions[i]) > 0.01);
    expect(hasDiff).toBe(true);
  });
});
