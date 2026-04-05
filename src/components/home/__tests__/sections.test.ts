// src/components/home/__tests__/sections.test.ts
import { describe, it, expect } from 'vitest';
import { SECTIONS } from '../sections';
import { GRID_STATE_NAMES } from '../../../lib/grid/GridStates';

describe('SECTIONS', () => {
  it('has the expected number of sections', () => { expect(SECTIONS.length).toBeGreaterThanOrEqual(1); });

  it('each section has id, prefix, descriptor, subtitle, gridState', () => {
    SECTIONS.forEach((s) => {
      expect(typeof s.id).toBe('number');
      expect(typeof s.prefix).toBe('string');
      expect(s.prefix.length).toBeGreaterThan(0);
      expect(typeof s.descriptor).toBe('string');
      expect(s.descriptor.length).toBeGreaterThan(0);
      expect(typeof s.subtitle).toBe('string');
      expect(typeof s.gridState).toBe('string');
    });
  });

  it('ids are sequential from 0', () => {
    SECTIONS.forEach((s, i) => expect(s.id).toBe(i));
  });

  it('every gridState is a known state name', () => {
    SECTIONS.forEach((s) => expect(GRID_STATE_NAMES).toContain(s.gridState));
  });

  it('first section uses graphPaper', () => {
    expect(SECTIONS[0].gridState).toBe('graphPaper');
  });

  it('no two adjacent sections share the same gridState', () => {
    for (let i = 1; i < SECTIONS.length; i++) {
      expect(SECTIONS[i].gridState).not.toBe(SECTIONS[i - 1].gridState);
    }
  });
});
