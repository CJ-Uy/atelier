import { describe, expect, it } from 'vitest';
import { facetReveal } from '../facetMotion';

describe('facet choreography', () => {
  it('keeps settled identities readable and hides both identities at the handoff', () => {
    expect(facetReveal(0, 0.2, 0.8)).toBe(1);
    expect(facetReveal(1, 0.2, 0.8)).toBe(1);
    expect(facetReveal(0.49, 0.2, 0.8)).toBe(0);
    expect(facetReveal(0.51, 0.2, 0.8)).toBe(0);
  });

  it('retraces the same reveal when scrolling backwards', () => {
    expect(facetReveal(0.2, 0.2, 0.8)).toBeCloseTo(facetReveal(0.8, 0.2, 0.8));
    expect(facetReveal(0.35, 0.2, 0.8)).toBeCloseTo(facetReveal(0.65, 0.2, 0.8));
  });

  it('constructs ink before the title and places marginalia last', () => {
    const ink = facetReveal(0.75, 0.05, 0.6);
    const title = facetReveal(0.75, 0.2, 0.8);
    const paper = facetReveal(0.75, 0.5, 1);
    expect(ink).toBeGreaterThan(title);
    expect(title).toBeGreaterThan(paper);
    expect(paper).toBe(0);
  });
});
