// src/components/works/__tests__/works.data.test.ts
import { describe, it, expect } from 'vitest';
import { WORKS, CATEGORIES, CAT_BASE, resolveCircle, isAccent, isFeatured, sortWorks, type Work } from '../works.data';

const make = (over: Partial<Work>): Work => ({
  slug: 's', title: 'T', year: '2025', cat: 'web', weight: 'strong', era: 'college',
  state: 'live', layers: [], spell: 'x', blurb: 'b', ...over,
});

describe('derive helpers', () => {
  it('isAccent is true iff an award layer is present', () => {
    expect(isAccent(make({ layers: ['award', 'ai'] }))).toBe(true);
    expect(isAccent(make({ layers: ['ai'] }))).toBe(false);
  });

  it('isFeatured is true only for major weight', () => {
    expect(isFeatured(make({ weight: 'major' }))).toBe(true);
    expect(isFeatured(make({ weight: 'archive' }))).toBe(false);
  });

  it('resolveCircle picks the base from category by default', () => {
    expect(resolveCircle(make({ cat: 'ai' })).base).toBe(CAT_BASE.ai);
    expect(resolveCircle(make({ cat: 'research' })).base).toBe(CAT_BASE.research);
  });

  it('resolveCircle maps layers to the reduced overlay set', () => {
    const { overlays } = resolveCircle(make({ layers: ['award', 'ai', 'research', 'systems', 'community'] }));
    expect(overlays.sort()).toEqual(['circuit', 'nodes', 'orbit', 'seal', 'ticks']);
  });

  it('a multi-person coven adds an orbit overlay (team signal)', () => {
    const solo = resolveCircle(make({ layers: [], coven: [{ name: 'A', role: 'all' }] }));
    const team = resolveCircle(make({ layers: [], coven: [{ name: 'A', role: 'x' }, { name: 'B', role: 'y' }] }));
    expect(solo.overlays).not.toContain('orbit');
    expect(team.overlays).toContain('orbit');
  });

  it('intensity grows with the number of layers but caps at 2', () => {
    expect(resolveCircle(make({ layers: [] })).intensity).toBe(0);
    expect(resolveCircle(make({ layers: ['ai', 'data', 'systems'] })).intensity).toBe(1);
    expect(resolveCircle(make({ layers: ['ai', 'data', 'systems', 'commerce', 'civic', 'map', 'ocr'] })).intensity).toBe(2);
  });

  it('an explicit circle override wins over the derived values', () => {
    const { base, overlays } = resolveCircle(make({ cat: 'ai', layers: ['award'], circle: { base: 'sigil', overlays: [] } }));
    expect(base).toBe('sigil');
    expect(overlays).toEqual([]);
  });
});

describe('sortWorks', () => {
  const sorted = sortWorks(WORKS);

  it('preserves every work', () => {
    expect(sorted.length).toBe(WORKS.length);
  });

  it('orders majors before archives', () => {
    const firstArchive = sorted.findIndex((w) => w.weight === 'archive');
    const lastMajor = sorted.map((w) => w.weight).lastIndexOf('major');
    expect(lastMajor).toBeLessThan(firstArchive);
  });

  it('assigns a roman opus numeral to each entry', () => {
    expect(sorted[0].n).toBe('I');
    sorted.forEach((w) => expect(w.n).toMatch(/^[IVXLCM]+$/));
  });
});

describe('inventory integrity', () => {
  const catIds = new Set(CATEGORIES.map((c) => c.id));

  it('every work has a slug that is unique', () => {
    const slugs = WORKS.map((w) => w.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every work category is a known filter category', () => {
    WORKS.forEach((w) => expect(catIds.has(w.cat)).toBe(true));
  });

  it('every work has copy (spell + blurb)', () => {
    WORKS.forEach((w) => {
      expect(w.spell.length).toBeGreaterThan(0);
      expect(w.blurb.length).toBeGreaterThan(0);
    });
  });
});
