// src/lib/grid/GridStates.ts
import type { GridStateName, GridStateFunction, GridState } from './types';

// ─── Builder ────────────────────────────────────────────────────
function buildGrid(
  cols: number,
  rows: number,
  posFn: (c: number, r: number, cx: number, cy: number) => [number, number],
  alphaFn?: (c: number, r: number, cx: number, cy: number) => number,
): GridState {
  const n = (cols + 1) * (rows + 1);
  const positions = new Float32Array(n * 2);
  const alphas    = new Float32Array(n);
  const dx = 2 / cols, dy = 2 / rows;
  let pi = 0, ai = 0;
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const cx = -1 + c * dx;
      const cy = -1 + r * dy;
      const [x, y] = posFn(c, r, cx, cy);
      positions[pi++] = x;
      positions[pi++] = y;
      alphas[ai++] = alphaFn ? alphaFn(c, r, cx, cy) : 1.0;
    }
  }
  return { positions, alphas };
}

// ═══════════════════════════════════════════════════════════════
//  1. graphPaper — uniform grid (base / default)
// ═══════════════════════════════════════════════════════════════
export const graphPaper: GridStateFunction = (cols, rows) =>
  buildGrid(cols, rows, (_c, _r, cx, cy) => [cx, cy]);

// ═══════════════════════════════════════════════════════════════
//  2. developerSetup — keyboard (bottom) + terminal screen (top)
//     Keys are separated groups with visible gaps.
//     Screen is a clean monospaced rectangle above a bezel gap.
// ═══════════════════════════════════════════════════════════════
export const developerSetup: GridStateFunction = (cols, rows) => {
  // Monitor dominates (~75% of screen height), keyboard compact at bottom (~18%).
  // Keyboard is HALF the width of the monitor, centered below it.
  const kbTopRow = Math.round(rows * 0.18);   // keyboard uses bottom 18% of rows
  const gapBot = kbTopRow + 1;
  const gapTop = kbTopRow + 2;
  const monStart = gapTop + 1;

  // Monitor: shifted UP so hero text (at viewport center / NDC 0,0) sits near monitor bottom.
  // NDC width = height (1.16) → visually 16:9 on a 16:9 viewport.
  // On portrait/mobile the grid stretches uniformly so the shape stays consistent.
  const monL = -0.58, monR = 0.58;
  const monT = 0.96, monB = monT - 1.16; // -0.20; text at y=0 is near bottom
  // Keyboard: half the monitor width, centered
  const kbL = -0.34, kbR = 0.34;

  // 3 key-rows (compact) separated by gap rows
  const getKeyRow = (r: number): number => {
    if (r > kbTopRow) return -1;
    const block = Math.floor(r / 2);
    return (r % 2 === 0 && block <= 2) ? block : -1;
  };

  const kw = Math.max(2, Math.round(cols / 24));
  const g = 1;

  const makeRanges = (start: number, widths: number[]): [number, number][] => {
    const ranges: [number, number][] = [];
    let x = start;
    for (let i = 0; i < widths.length; i++) {
      ranges.push([x, x + widths[i] - 1]);
      x += widths[i] + g;
    }
    return ranges;
  };

  const sp = Math.round(cols * 0.12);
  const rowDefs: { start: number; widths: number[] }[] = [
    /* 0: bottom row — Ctrl Alt Space Alt Ctrl */
    { start: Math.round(cols * 0.20), widths: [3, 3, sp, 3, 3] },
    /* 1: middle row — letters */
    { start: Math.round(cols * 0.18), widths: [kw, kw, kw, kw, kw, kw, kw, kw, kw, kw] },
    /* 2: top row — number keys */
    { start: Math.round(cols * 0.16), widths: [kw, kw, kw, kw, kw, kw, kw, kw, kw, kw, kw, 3] },
  ];
  const keyRanges: [number, number][][] = rowDefs.map(d => makeRanges(d.start, d.widths));

  // Keyboard box bounds (NDC) — compact at bottom
  const kbBot = -0.98, kbTop = -0.62;
  const bezelX = 0.05, bezelY = 0.06; // slightly thicker vertically to compensate for row spacing
  const scrL = monL + bezelX, scrR = monR - bezelX;
  const scrB = monB + bezelY, scrT = monT - bezelY;

  // Helper: is vertex on the keyboard border?
  const isKbBorder = (x: number, y: number) => {
    const inBox = x >= kbL && x <= kbR && y >= kbBot && y <= kbTop;
    if (!inBox) return false;
    return x <= kbL + 0.03 || x >= kbR - 0.03 || y <= kbBot + 0.03 || y >= kbTop - 0.03;
  };

  return buildGrid(cols, rows,
    (c, r, cx, _cy) => {
      if (r <= kbTopRow) {
        // Map into keyboard box (half monitor width, centered)
        const kt = r / kbTopRow;
        const y = kbBot + kt * (kbTop - kbBot);
        const x = kbL + (c / cols) * (kbR - kbL);
        return [x, y];
      }
      if (r >= gapBot && r <= gapTop) return [cx * 0.15, (kbTop + monB) / 2];
      // Monitor stand
      const monRows = rows - monStart;
      const mr = r - monStart;
      if (mr <= 0) return [(c / cols) * 0.14 - 0.07, monB - 0.02];
      // Monitor body
      const bodyT = (mr - 1) / Math.max(monRows - 1, 1);
      const y = monB + bodyT * (monT - monB);
      const x = monL + (c / cols) * (monR - monL);
      if (x > scrL && x < scrR && y > scrB && y < scrT) {
        return [Math.round(x * 10) / 10, Math.round(y * 7) / 7];
      }
      return [x, y];
    },
    (c, r) => {
      if (r <= kbTopRow) {
        const kt = r / kbTopRow;
        const y = kbBot + kt * (kbTop - kbBot);
        const x = kbL + (c / cols) * (kbR - kbL);

        // Keyboard enclosure border: always visible
        if (isKbBorder(x, y)) return 1;

        // Inside the border: show keys
        const keyRow = getKeyRow(r);
        if (keyRow < 0) return 0;
        const ranges = keyRanges[keyRow];
        if (!ranges) return 0;
        return ranges.some(([lo, hi]) => c >= lo && c <= hi) ? 0.85 : 0;
      }
      if (r >= gapBot && r <= gapTop) return 0;
      const monRows = rows - monStart;
      const mr = r - monStart;
      if (mr <= 0) {
        const x = (c / cols) * 0.14 - 0.07;
        return Math.abs(x) < 0.06 ? 0.6 : 0;
      }
      const bodyT = (mr - 1) / Math.max(monRows - 1, 1);
      const y = monB + bodyT * (monT - monB);
      const x = monL + (c / cols) * (monR - monL);
      if (x < monL - 0.01 || x > monR + 0.01 || y < monB - 0.01 || y > monT + 0.01) return 0;
      if (x <= scrL || x >= scrR || y <= scrB || y >= scrT) return 1;
      return (r % 2 === 0) ? 0.55 : 0.25;
    },
  );
};

// ═══════════════════════════════════════════════════════════════
//  3. spacetimeWarp — wormhole center + surrounding data charts
//     Strong radial pull toward center creates a funnel/vortex.
//     Outer edges form chart-like rectangular patterns.
// ═══════════════════════════════════════════════════════════════
export const spacetimeWarp: GridStateFunction = (cols, rows) =>
  buildGrid(cols, rows,
    (_c, _r, cx, cy) => {
      // Einstein-Rosen bridge: two funnel mouths connected by a narrow throat.
      // Side view: x = position along the bridge, y = radial displacement.
      // Profile R(x) = throat + (mouth - throat) * (cosh(k*x) - 1) / (cosh(k) - 1)
      const k = 2.8;
      const throat = 0.07;
      const mouth = 0.96;
      const coshK = Math.cosh(k);
      const R = throat + (mouth - throat) * (Math.cosh(k * cx) - 1) / (coshK - 1);

      // y scaled by profile: wide at mouths (x=±1), narrow at throat (x=0)
      return [cx, cy * R];
    },
    (_c, _r, cx, cy) => {
      // Throat center line (the tunnel axis) — faint
      const k = 2.8;
      const R = 0.07 + 0.89 * (Math.cosh(k * cx) - 1) / (Math.cosh(k) - 1);
      const absY = Math.abs(cy * R);
      if (absY < 0.025) return 0.08;
      if (absY < 0.06) return 0.3;
      return 1;
    },
  );

// ═══════════════════════════════════════════════════════════════
//  4. dreamCatcher — concentric rings + radial web threads
//     Grid transforms into circles with spokes.
// ═══════════════════════════════════════════════════════════════
export const dreamCatcher: GridStateFunction = (cols, rows) =>
  buildGrid(cols, rows,
    (_c, _r, cx, cy) => {
      const dist = Math.sqrt(cx * cx + cy * cy);
      const angle = Math.atan2(cy, cx);

      // Snap to concentric rings (4 rings + center)
      const ringCount = 5;
      const maxR = 0.92;
      const targetR = Math.round(dist * ringCount) / ringCount * maxR;

      // Quantize angle to create spoke structure (12 spokes)
      const spokeCount = 12;
      const snapAngle = Math.round(angle / (Math.PI * 2 / spokeCount)) * (Math.PI * 2 / spokeCount);

      // Strong pull: 85% toward ring position, with spoke influence
      const ringBlend = 0.88;
      const spokeBlend = dist < 0.15 ? 0.9 : 0.15; // center converges strongly
      const finalAngle = angle * (1 - spokeBlend) + snapAngle * spokeBlend;

      return [
        Math.cos(finalAngle) * (dist * (1 - ringBlend) + targetR * ringBlend),
        Math.sin(finalAngle) * (dist * (1 - ringBlend) + targetR * ringBlend),
      ];
    },
    (_c, _r, cx, cy) => {
      // Hide center vertices for the "hole" of the dreamcatcher
      const dist = Math.sqrt(cx * cx + cy * cy);
      if (dist < 0.08) return 0;
      return 1;
    },
  );

// ═══════════════════════════════════════════════════════════════
//  5. musicProduction — DAW timeline (top) + music staff (bottom)
//     Top: horizontal tracks with varying-length clip blocks (like a DAW).
//     Bottom: 5-line music staff with note positions.
// ═══════════════════════════════════════════════════════════════
export const musicProduction: GridStateFunction = (cols, rows) => {
  // Layout: staff takes bottom ~40%, DAW tracks take top ~55%, gap between.
  const staffTop = Math.round(rows * 0.38);
  const dawBot = Math.round(rows * 0.45);

  // ── Staff: 5 lines evenly spaced in the bottom region ──
  const staffLines = [0.08, 0.16, 0.24, 0.32, 0.40]; // fractions of staffTop
  const staffLineRows = staffLines.map(f => Math.round(f * staffTop));

  // ── DAW: 6 horizontal tracks with clip blocks ──
  const trackCount = 6;
  const dawRows = rows - dawBot;

  // Deterministic "clips" per track: [startCol, endCol] pairs
  const clips: [number, number][][] = [
    [[2, Math.round(cols * 0.35)], [Math.round(cols * 0.40), Math.round(cols * 0.72)]],
    [[0, Math.round(cols * 0.18)], [Math.round(cols * 0.22), Math.round(cols * 0.55)], [Math.round(cols * 0.60), Math.round(cols * 0.88)]],
    [[Math.round(cols * 0.10), Math.round(cols * 0.48)], [Math.round(cols * 0.55), cols - 2]],
    [[0, Math.round(cols * 0.28)], [Math.round(cols * 0.65), cols]],
    [[Math.round(cols * 0.05), Math.round(cols * 0.42)], [Math.round(cols * 0.48), Math.round(cols * 0.78)]],
    [[Math.round(cols * 0.15), Math.round(cols * 0.60)], [Math.round(cols * 0.68), cols - 1]],
  ];

  // "Notes" on the staff — column positions where notes appear
  const notePositions = [3, 7, 10, 14, 18, 21, 25, 28, 32, 36, 40, 44].filter(n => n <= cols);

  return buildGrid(cols, rows,
    (c, r, cx, cy) => {
      // ── Staff region (bottom) ──
      if (r <= staffTop) {
        // Compress staff lines tighter for cleaner look
        const staffT = r / staffTop;
        const y = -0.95 + staffT * 0.72;
        return [cx, y];
      }
      // ── Gap between staff and DAW ──
      if (r > staffTop && r < dawBot) {
        return [cx, -0.15];
      }
      // ── DAW region (top) ──
      const dawT = (r - dawBot) / dawRows;
      const y = -0.05 + dawT * 0.98;
      return [cx, y];
    },
    (c, r) => {
      // ── Staff region ──
      if (r <= staffTop) {
        // Staff lines: 5 horizontal lines
        const isStaffLine = staffLineRows.some(sr => Math.abs(r - sr) <= 0);
        // Notes: bright dots at note positions on staff lines
        const isNote = notePositions.some(nc => Math.abs(c - nc) <= 1) && isStaffLine;
        if (isNote) return 1;
        if (isStaffLine) return 0.8;
        // Between staff lines: faint
        if (r >= staffLineRows[0] && r <= staffLineRows[4]) return 0.15;
        return 0;
      }
      // ── Gap ──
      if (r > staffTop && r < dawBot) return 0;
      // ── DAW tracks ──
      const dawT = (r - dawBot) / dawRows;
      const trackIdx = Math.min(Math.floor(dawT * trackCount), trackCount - 1);
      const trackFrac = (dawT * trackCount) - trackIdx;
      const isTrackEdge = trackFrac < 0.08 || trackFrac > 0.92;
      // Check if column is inside a clip
      const trackClips = clips[trackIdx] || [];
      const inClip = trackClips.some(([s, e]) => c >= s && c <= e);
      if (inClip) {
        // Clip border: left/right column edges OR top/bottom track edges
        const isClipLR = trackClips.some(([s, e]) => c === s || c === e);
        if (isClipLR || isTrackEdge) return 1; // border
        return 0.55; // clip interior fill
      }
      // Track separator outside clips: faint
      if (isTrackEdge) return 0.2;
      return 0.05; // empty track space
    },
  );
};

export const bassGuitar = musicProduction; // legacy alias

// ═══════════════════════════════════════════════════════════════
//  6. volleyball — net mesh (top half) + empty court (bottom)
//     Net sags at center, hung between two posts.
// ═══════════════════════════════════════════════════════════════
export const volleyball: GridStateFunction = (cols, rows) => {
  // Volleyball net with posts extending from net top down to screen bottom.
  const netTop = Math.round(rows * 0.80);
  const netBot = Math.round(rows * 0.38);
  // Wider posts: 4 columns each side
  const postL = 3, postR = cols - 3;
  const topY = 0.62, botY = -0.18;

  const netBaseY = (r: number) => {
    const netT = (r - netBot) / Math.max(netTop - netBot, 1);
    return botY + netT * (topY - botY);
  };

  return buildGrid(cols, rows,
    (c, r, cx, _cy) => {
      // ── Net zone ──
      if (r >= netBot && r <= netTop) {
        const baseY = netBaseY(r);
        // Posts in net zone: wide vertical bands, no sag
        if (c <= postL) {
          const px = -0.92 + (c / postL) * 0.06;
          return [px, baseY];
        }
        if (c >= postR) {
          const px = 0.86 + ((c - postR) / (cols - postR)) * 0.06;
          return [px, baseY];
        }
        // Net mesh with sag
        const postSpan = 0.84;
        const normX = Math.max(-1, Math.min(1, cx / postSpan));
        const netT = (r - netBot) / Math.max(netTop - netBot, 1);
        const sagAmount = (1 - normX * normX) * 0.12 * (1 - netT * 0.8);
        return [cx, baseY - sagAmount];
      }

      // ── Below net zone: posts continue to bottom ──
      if (r < netBot) {
        const postY = -0.98 + (r / netBot) * (botY - (-0.98));
        if (c <= postL) {
          const px = -0.92 + (c / postL) * 0.06;
          return [px, postY];
        }
        if (c >= postR) {
          const px = 0.86 + ((c - postR) / (cols - postR)) * 0.06;
          return [px, postY];
        }
        // Non-post below net: collapse to net bottom position (zero-length lines)
        return [cx, botY];
      }

      // ── Above net zone ──
      return [cx, topY];
    },
    (c, r) => {
      // Net zone
      if (r >= netBot && r <= netTop) {
        if (c <= postL || c >= postR) return 1; // posts
        if (r >= netTop - 1 || r <= netBot + 1) return 1; // top/bottom tape
        return 0.7; // net mesh
      }
      // Below net: posts visible, everything else invisible
      if (r < netBot) {
        if (c <= postL || c >= postR) return 1; // posts extend down
        if (r <= 1) return 0.2; // faint court floor
        return 0;
      }
      // Above net: invisible
      return 0;
    },
  );
};

// ═══════════════════════════════════════════════════════════════
//  7. mangaPanels — irregular panel layout with gutters
//     3 rows of panels, asymmetric widths, clear white gutters.
// ═══════════════════════════════════════════════════════════════
export const mangaPanels: GridStateFunction = (cols, rows) => {
  // Single page, 7 panels across 3 tiers with proportional gutters.
  const C = cols, R = rows;
  const gw = Math.max(2, Math.round(C * 0.04));  // horizontal gutter
  const gh = Math.max(2, Math.round(R * 0.05));  // vertical gutter

  // 3 tiers (bottom-up since row 0 = bottom in NDC)
  const tier1Top = Math.round(R * 0.30);                       // bottom tier
  const tier2Bot = tier1Top + gh;
  const tier2Top = Math.round(R * 0.62);                       // middle tier
  const tier3Bot = tier2Top + gh;                               // top tier

  type Panel = { c0: number; c1: number; r0: number; r1: number };
  const panels: Panel[] = [
    // ── Bottom tier (2 panels): wide + narrow ──
    { c0: 0, c1: Math.round(C * 0.62), r0: 0, r1: tier1Top },
    { c0: Math.round(C * 0.62) + gw, c1: C, r0: 0, r1: tier1Top },

    // ── Middle tier (3 panels) ──
    { c0: 0, c1: Math.round(C * 0.30), r0: tier2Bot, r1: tier2Top },
    { c0: Math.round(C * 0.30) + gw, c1: Math.round(C * 0.65), r0: tier2Bot, r1: tier2Top },
    { c0: Math.round(C * 0.65) + gw, c1: C, r0: tier2Bot, r1: tier2Top },

    // ── Top tier (2 panels): wide + medium ──
    { c0: 0, c1: Math.round(C * 0.55), r0: tier3Bot, r1: R },
    { c0: Math.round(C * 0.55) + gw, c1: C, r0: tier3Bot, r1: R },
  ];

  const findPanel = (c: number, r: number): Panel | undefined =>
    panels.find(p => c >= p.c0 && c <= p.c1 && r >= p.r0 && r <= p.r1);

  return buildGrid(cols, rows,
    (c, r, cx, cy) => {
      const panel = findPanel(c, r);
      if (!panel) return [cx, cy];
      const pc = (c - panel.c0) / Math.max(panel.c1 - panel.c0, 1);
      const pr = (r - panel.r0) / Math.max(panel.r1 - panel.r0, 1);
      const pL = -1 + (panel.c0 / C) * 2;
      const pR = -1 + (panel.c1 / C) * 2;
      const pB = -1 + (panel.r0 / R) * 2;
      const pT = -1 + (panel.r1 / R) * 2;
      const inset = 0.02;
      return [
        (pL + inset) + pc * (pR - pL - inset * 2),
        (pB + inset) + pr * (pT - pB - inset * 2),
      ];
    },
    (c, r) => {
      const panel = findPanel(c, r);
      if (!panel) return 0; // gutter: invisible
      const onEdge = c === panel.c0 || c === panel.c1 || r === panel.r0 || r === panel.r1;
      return onEdge ? 1 : 0.65;
    },
  );
};

// ═══════════════════════════════════════════════════════════════
//  8. banigWeaving — diagonal chevron/diamond weave pattern
//     Based on traditional Leyte tikog grass banig.
//     Creates a diamond lattice with V-shaped chevron strips.
// ═══════════════════════════════════════════════════════════════
export const banigWeaving: GridStateFunction = (cols, rows) => {
  const dx = 2 / cols;
  const dy = 2 / rows;

  return buildGrid(cols, rows,
    (c, r, cx, cy) => {
      // Large-scale chevron: V-shapes pointing up and down
      // Creates the diamond motif seen in the banig image
      const centerC = cols / 2;
      const centerR = rows / 2;

      // Distance from center column (0 at center, 1 at edges)
      const distC = Math.abs(c - centerC) / centerC;

      // Diagonal offset: shift vertices along diagonals to create diamond lattice
      const phase = (c + r) % 2 === 0 ? 1 : -1;
      const diagOffset = phase * dx * 0.42;

      // Chevron warp: rows bend into V-shapes pointing toward center
      // The amount of V-bend depends on how far from center row
      const rowFromCenter = (r - centerR) / centerR; // -1 to +1
      const chevronBend = distC * dy * 2.0 * Math.sign(rowFromCenter);

      // Weave over/under effect: alternating strip offset
      const strip = Math.floor((c + r) / 2) % 3;
      const weaveOffset = strip === 0 ? 0.008 : strip === 1 ? -0.008 : 0;

      return [
        cx + diagOffset + weaveOffset,
        cy + chevronBend + phase * dy * 0.25,
      ];
    },
    (c, r) => {
      // Create the lattice pattern: hide every other diagonal connection
      // This emphasizes the woven strips
      const diag = (c + r) % 4;
      if (diag === 2) return 0.3; // faint secondary strips
      return 1;
    },
  );
};

// ═══════════════════════════════════════════════════════════════
//  9. cityscape — building silhouettes + construction crane
//     Buildings of varying heights with clear street gaps.
//     Crane tower with horizontal jib.
// ═══════════════════════════════════════════════════════════════
export const cityscape: GridStateFunction = (cols, rows) => {
  // Buildings of varying heights with street gaps + construction crane on the right.

  // Building profile: maps column fraction (0..1) to building height fraction (0..1).
  // 0 = street gap.
  const profile = (ct: number): number => {
    if (ct < 0.04) return 0;           // left margin
    if (ct < 0.15) return 0.50;       // building A (short)
    if (ct < 0.19) return 0;           // street
    if (ct < 0.36) return 0.78;       // building B (tall, wide)
    if (ct < 0.40) return 0;           // street
    if (ct < 0.52) return 0.60;       // building C
    if (ct < 0.56) return 0;           // street
    if (ct < 0.65) return 0.42;       // building D (short)
    if (ct < 0.69) return 0;           // street
    if (ct < 0.78) return 0.68;       // building E
    if (ct < 0.82) return 0;           // street (crane base gap)
    return 0;                          // crane zone (handled separately)
  };

  // Crane geometry: tower + jib + counter-jib + cable
  const craneTowerL = 0.86, craneTowerR = 0.90; // tower column range (fraction)
  const craneH = 0.92;          // tower height (fraction of rows)
  const jibL = 0.44;            // jib extends left to here
  const jibR = craneTowerR;     // jib right = tower right
  const counterJibR = 0.98;     // counter-jib extends right
  const jibRowFrac = craneH;    // jib is at the top of the tower
  // Cable: hangs from jib tip down
  const cableTipX = 0.46;       // cable hangs from left end of jib
  const cableBottomH = 0.35;    // cable drops to this height

  const isCraneTower = (ct: number) => ct >= craneTowerL && ct <= craneTowerR;
  const isCraneJib = (ct: number, rt: number) => {
    const jibRow = Math.abs(rt - jibRowFrac) < 0.03;
    return jibRow && ct >= jibL && ct <= counterJibR;
  };
  const isCraneCable = (ct: number, rt: number) => {
    // Diagonal cable from jib tip to lower point
    if (ct < cableTipX - 0.02 || ct > cableTipX + 0.02) return false;
    return rt >= cableBottomH && rt <= jibRowFrac;
  };

  return buildGrid(cols, rows,
    (c, r, cx, cy) => {
      const t = r / rows;
      const ct = c / cols;

      // Crane tower: tall narrow vertical
      if (isCraneTower(ct)) {
        const towerX = -1 + (craneTowerL + craneTowerR) / 2 * 2;
        const towerW = (craneTowerR - craneTowerL) * 2;
        const x = towerX + ((ct - craneTowerL) / (craneTowerR - craneTowerL) - 0.5) * towerW;
        if (t <= craneH) return [x, cy];
        return [x, -1 + craneH * 2]; // snap above tower to roof
      }

      // Crane jib + counter-jib: horizontal bar at tower top
      if (isCraneJib(ct, t)) {
        const jibY = -1 + jibRowFrac * 2;
        return [cx, jibY];
      }

      // Cable: vertical line from jib down
      if (isCraneCable(ct, t)) {
        const cableX = -1 + cableTipX * 2;
        return [cableX, cy];
      }

      // Building zone
      const bh = profile(ct);
      if (bh === 0) {
        // Street: compress to ground level
        return [cx, -1 + t * 0.15];
      }
      if (t <= bh) return [cx, cy]; // building face
      return [cx, -1 + bh * 2];     // above roof: snap to rooftop
    },
    (c, r) => {
      const t = r / rows;
      const ct = c / cols;

      // Crane tower
      if (isCraneTower(ct)) {
        if (t <= craneH) return 1;
        return 0; // above tower
      }
      // Crane jib
      if (isCraneJib(ct, t)) return 0.9;
      // Cable
      if (isCraneCable(ct, t)) return 0.7;

      // Buildings
      const bh = profile(ct);
      if (bh === 0) {
        if (t <= 0.04) return 0.35; // ground line
        return 0; // street sky: invisible
      }
      if (t <= bh) return 1; // building face
      return 0; // above roof: invisible
    },
  );
};

// ═══════════════════════════════════════════════════════════════
//  Legacy states (kept in registry but not in active sections)
// ═══════════════════════════════════════════════════════════════

export const keyboard: GridStateFunction = (cols, rows) =>
  buildGrid(cols, rows, (c, r, cx, _cy) => {
    const t = r / rows;
    return [cx * (0.6 + 0.4 * t) + (r % 2 === 0 ? 0 : 0.08) * (1 - t * 0.5), -1 + t * t * 2];
  });

export const terminal: GridStateFunction = (cols, rows) =>
  buildGrid(cols, rows, (c, _r, cx, cy) => [cx + Math.sin(c * 127.1 + 311.7) * 0.015, cy * 0.97]);

export const chartsData: GridStateFunction = (cols, rows) =>
  buildGrid(cols, rows, (c, r, cx, _cy) => {
    if (r === 0) return [cx, -1];
    const t = r / rows;
    return [cx * 0.85 + (-1 + Math.floor(c / 2) * (4 / cols)) * 0.15, -1 + t * (1 + Math.sin((c / cols) * Math.PI) * 0.6 * t)];
  });

export const topographic: GridStateFunction = (cols, rows) =>
  buildGrid(cols, rows, (_c, _r, cx, cy) => {
    const e = Math.sin(cx * 3.2 + cy * 1.7) * 0.08 + Math.sin(cx * 1.5 - cy * 2.8) * 0.06 + Math.sin(cx * 5 + cy * 0.5) * 0.03;
    return [cx, Math.round((cy + e) * 8) / 8];
  });

export const pixelGrid: GridStateFunction = (cols, rows) =>
  buildGrid(cols, rows, (_c, _r, cx, cy) => [Math.round(cx * 6) / 6, Math.round(cy * 4) / 4]);

export const filmComposition: GridStateFunction = (cols, rows) =>
  buildGrid(cols, rows, (_c, _r, cx, cy) => {
    const guides = [-1 / 3, 1 / 3, -(1 - 1 / 1.618), 1 - 1 / 1.618];
    const snap = (v: number) => { let b = v, m = Infinity; for (const g of guides) { if (Math.abs(v - g) < m) { m = Math.abs(v - g); b = v + (g - v) * 0.4; } } return b; };
    return [snap(cx), snap(cy)];
  });

export const mondrian: GridStateFunction = (cols, rows) => {
  const xD = [-1, -0.5, 0.1, 0.6, 1], yD = [-1, -0.4, 0.2, 0.65, 1];
  return buildGrid(cols, rows, (_c, _r, cx, cy) => {
    const snap = (v: number, ds: number[]) => { let b = v, m = Infinity; for (const d of ds) { if (Math.abs(v - d) < m) { m = Math.abs(v - d); b = v + (d - v) * 0.75; } } return b; };
    return [snap(cx, xD), snap(cy, yD)];
  });
};

// ─── Registry ───────────────────────────────────────────────────
export const GRID_STATE_NAMES: GridStateName[] = [
  'graphPaper', 'keyboard', 'terminal', 'spacetimeWarp', 'chartsData',
  'dreamCatcher', 'bassGuitar', 'musicProduction', 'volleyball', 'topographic', 'pixelGrid',
  'mangaPanels', 'filmComposition', 'banigWeaving', 'mondrian',
  'developerSetup', 'cityscape',
];

const STATE_MAP: Record<GridStateName, GridStateFunction> = {
  graphPaper, keyboard, terminal, spacetimeWarp, chartsData,
  dreamCatcher, bassGuitar, musicProduction, volleyball, topographic, pixelGrid,
  mangaPanels, filmComposition, banigWeaving, mondrian,
  developerSetup, cityscape,
};

export function getGridState(name: GridStateName, cols: number, rows: number): GridState {
  const fn = STATE_MAP[name];
  if (!fn) throw new Error(`Unknown grid state: "${name}"`);
  return fn(cols, rows);
}
