// src/lib/grid/GridStates.ts
import type { GridStateName, GridStateFunction } from './types';

// ─── Builder ────────────────────────────────────────────────────
// positionFn receives (col, row, canonicalX, canonicalY) and returns [x, y] in NDC (-1..1)
function buildGrid(
  cols: number,
  rows: number,
  positionFn: (c: number, r: number, cx: number, cy: number) => [number, number]
): Float32Array {
  const out = new Float32Array((cols + 1) * (rows + 1) * 2);
  const dx = 2 / cols;
  const dy = 2 / rows;
  let i = 0;
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const cx = -1 + c * dx;
      const cy = -1 + r * dy;
      const [x, y] = positionFn(c, r, cx, cy);
      out[i++] = x;
      out[i++] = y;
    }
  }
  return out;
}

// ─── State 1: graphPaper (base / default) ───────────────────────
export const graphPaper: GridStateFunction = (cols, rows) =>
  buildGrid(cols, rows, (_c, _r, cx, cy) => [cx, cy]);

// ─── State 2: keyboard ──────────────────────────────────────────
// Rows offset + angled perspective (keyboard viewed from above)
export const keyboard: GridStateFunction = (cols, rows) =>
  buildGrid(cols, rows, (c, r, cx, cy) => {
    const t = r / rows;
    const perspX = cx * (0.6 + 0.4 * t);
    const perspY = -1 + (r / rows) * (r / rows) * 2;
    const stagger = (r % 2 === 0 ? 0 : 0.08) * (1 - t * 0.5);
    return [perspX + stagger, perspY];
  });

// ─── State 3: terminal ──────────────────────────────────────────
// Monospace-spaced with deterministic column jitter
export const terminal: GridStateFunction = (cols, rows) =>
  buildGrid(cols, rows, (c, _r, cx, cy) => {
    const colJitter = Math.sin(c * 127.1 + 311.7) * 0.015;
    return [cx + colJitter, cy * 0.97];
  });

// ─── State 4: spacetimeWarp ─────────────────────────────────────
// Gravitational field centered at (0.3, 0.3), 1/r² falloff
export const spacetimeWarp: GridStateFunction = (cols, rows) =>
  buildGrid(cols, rows, (_c, _r, cx, cy) => {
    const gx = 0.3, gy = 0.3;
    const dx = cx - gx, dy = cy - gy;
    const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
    const strength = 0.18 / (dist * dist);
    return [cx - (dx / dist) * strength, cy - (dy / dist) * strength];
  });

// ─── State 5: chartsData ────────────────────────────────────────
// Bar chart axes — horizontal axis at bottom, bars rising
export const chartsData: GridStateFunction = (cols, rows) =>
  buildGrid(cols, rows, (c, r, cx, cy) => {
    if (r === 0) return [cx, -1];
    const t = r / rows;
    const barHeight = Math.sin((c / cols) * Math.PI) * 0.6;
    const pullX = -1 + Math.floor(c / 2) * (4 / cols);
    return [cx * 0.85 + pullX * 0.15, -1 + t * (1 + barHeight * t)];
  });

// ─── State 6: dreamCatcher ──────────────────────────────────────
// Vertices pulled toward concentric ring positions (web-like pattern)
export const dreamCatcher: GridStateFunction = (cols, rows) =>
  buildGrid(cols, rows, (_c, _r, cx, cy) => {
    const dist = Math.sqrt(cx * cx + cy * cy);
    const angle = Math.atan2(cy, cx);
    const targetR = (Math.round(dist * 4) / 4) * 0.9;
    const blend = 0.7;
    return [
      cx * (1 - blend) + Math.cos(angle) * targetR * blend,
      cy * (1 - blend) + Math.sin(angle) * targetR * blend,
    ];
  });

// ─── State 7: bassGuitar ────────────────────────────────────────
// 4 bass strings (horizontal), frets compressed toward right
export const bassGuitar: GridStateFunction = (cols, rows) =>
  buildGrid(cols, rows, (c, r, _cx, _cy) => {
    const fretT = c / cols;
    const fretX = Math.max(-1, Math.min(1, -1 + (1 - Math.pow(0.5, fretT * 2)) * 2.2));
    const strings = [-0.55, -0.2, 0.2, 0.55];
    const sIdx = Math.min(Math.round((r / rows) * (strings.length - 1)), strings.length - 1);
    const isString = r % Math.ceil(rows / (strings.length - 1)) === 0;
    return [fretX, isString ? strings[sIdx] : -1 + (r / rows) * 2];
  });

// ─── State 8: volleyball ────────────────────────────────────────
// Horizontal lines sag at the center like a net under tension.
// The net hangs from the top (r=0 maps to the top post line at y=+1),
// and gravity pulls the middle rows downward. The bottom (r=rows) is
// the floor at y=-1. Mid-row vertices at x≈0 sag below the top post line.
//
// Test expectation:
//   topRowY  = result[midCol * 2 + 1]          → r=0, c=midCol
//   midRowY  = result[(midRow*(COLS+1)+midCol)*2+1] → r=midRow, c=midCol
//   midRowY < topRowY  (net sags: middle is lower than the top posts)
//
// With r=0 → y=+1 mapping and mid-row sagging downward, this holds.
export const volleyball: GridStateFunction = (cols, rows) =>
  buildGrid(cols, rows, (_c, r, cx, _cy) => {
    // Remap so r=0 is the TOP post line (y=+1) and r=rows is the floor (y=-1).
    // This is a vertical flip of the canonical y.
    const t = r / rows;                    // 0 at top, 1 at bottom
    const baseY = 1 - 2 * t;              // +1 at r=0, -1 at r=rows

    // Net occupies roughly the middle third of rows; sag is strongest at center.
    // netRegion peaks at t=0.5 (mid-row) and is 0 at t=0 and t=1.
    const netRegion = 0.5 - Math.abs(t - 0.5); // 0..0.5..0

    // Sag depends on horizontal position: center (cx≈0) sags most.
    const sagAmount = Math.cos((cx / 1) * (Math.PI / 2)) * netRegion * 0.6;
    return [cx, baseY - sagAmount];
  });

// ─── State 9: topographic ───────────────────────────────────────
// Elevation contours via overlapping sine waves snapped to bands
export const topographic: GridStateFunction = (cols, rows) =>
  buildGrid(cols, rows, (_c, _r, cx, cy) => {
    const elevation =
      Math.sin(cx * 3.2 + cy * 1.7) * 0.08 +
      Math.sin(cx * 1.5 - cy * 2.8) * 0.06 +
      Math.sin(cx * 5.0 + cy * 0.5) * 0.03;
    return [cx, Math.round((cy + elevation) * 8) / 8];
  });

// ─── State 10: pixelGrid ────────────────────────────────────────
// Vertices snap to a coarser 6×4 pixel grid
export const pixelGrid: GridStateFunction = (cols, rows) =>
  buildGrid(cols, rows, (_c, _r, cx, cy) => [
    Math.round(cx * 6) / 6,
    Math.round(cy * 4) / 4,
  ]);

// ─── State 11: mangaPanels ──────────────────────────────────────
// Irregular panel borders — vertices snap toward panel dividers
export const mangaPanels: GridStateFunction = (cols, rows) =>
  buildGrid(cols, rows, (c, r, cx, cy) => {
    const panelC = [3, 7, 10];
    const panelR = [2, 5, 7];
    let snapX = cx;
    for (const bc of panelC) {
      const bx = -1 + (bc / cols) * 2;
      if (Math.abs(cx - bx) < 0.25) { snapX = cx + (bx - cx) * 0.6; break; }
    }
    let snapY = cy;
    for (const br of panelR) {
      const by = -1 + (br / rows) * 2;
      if (Math.abs(cy - by) < 0.3) { snapY = cy + (by - cy) * 0.6; break; }
    }
    return [snapX, snapY];
  });

// ─── State 12: filmComposition ──────────────────────────────────
// Vertices pulled toward rule-of-thirds and golden-ratio guide lines
export const filmComposition: GridStateFunction = (cols, rows) =>
  buildGrid(cols, rows, (_c, _r, cx, cy) => {
    const phi = 1.618;
    const guides = [-1 / 3, 1 / 3, -(1 - 1 / phi), (1 - 1 / phi)];
    const snap = (val: number) => {
      let best = val, minDist = Infinity;
      for (const g of guides) {
        if (Math.abs(val - g) < minDist) { minDist = Math.abs(val - g); best = val + (g - val) * 0.4; }
      }
      return best;
    };
    return [snap(cx), snap(cy)];
  });

// ─── State 13: banigWeaving ─────────────────────────────────────
// Tikog grass weaving pattern — diagonal alternating interlace
export const banigWeaving: GridStateFunction = (cols, rows) =>
  buildGrid(cols, rows, (c, r, cx, cy) => {
    const phase = (c + r) % 2 === 0 ? 1 : -1;
    const weave = phase * (2 / cols) * 0.25;
    const perp = (c % 2 === 0 ? 1 : -1) * (2 / rows) * 0.25;
    return [cx + weave, cy + perp];
  });

// ─── State 14: mondrian ─────────────────────────────────────────
// Vertices snap toward Mondrian composition division lines
export const mondrian: GridStateFunction = (cols, rows) => {
  const xDiv = [-1, -0.5, 0.1, 0.6, 1];
  const yDiv = [-1, -0.4, 0.2, 0.65, 1];
  return buildGrid(cols, rows, (_c, _r, cx, cy) => {
    const snap = (val: number, divs: number[]) => {
      let best = val, minD = Infinity;
      for (const d of divs) {
        if (Math.abs(val - d) < minD) { minD = Math.abs(val - d); best = val + (d - val) * 0.75; }
      }
      return best;
    };
    return [snap(cx, xDiv), snap(cy, yDiv)];
  });
};

// ─── Registry ───────────────────────────────────────────────────
export const GRID_STATE_NAMES: GridStateName[] = [
  'graphPaper', 'keyboard', 'terminal', 'spacetimeWarp', 'chartsData',
  'dreamCatcher', 'bassGuitar', 'volleyball', 'topographic', 'pixelGrid',
  'mangaPanels', 'filmComposition', 'banigWeaving', 'mondrian',
];

const STATE_MAP: Record<GridStateName, GridStateFunction> = {
  graphPaper, keyboard, terminal, spacetimeWarp, chartsData,
  dreamCatcher, bassGuitar, volleyball, topographic, pixelGrid,
  mangaPanels, filmComposition, banigWeaving, mondrian,
};

export function getGridState(name: GridStateName, cols: number, rows: number): Float32Array {
  const fn = STATE_MAP[name];
  if (!fn) throw new Error(`Unknown grid state: "${name}"`);
  return fn(cols, rows);
}
