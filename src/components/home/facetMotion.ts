/** A reversible reveal: geometry first, identity next, paper details last. */
export function facetReveal(progress: number, start: number, end: number): number {
  const settled = Math.abs(1 - 2 * Math.max(0, Math.min(1, progress)));
  const t = Math.max(0, Math.min(1, (settled - start) / (end - start)));
  return t * t * (3 - 2 * t);
}
