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
//  3. spacetimeWarp — 3D wormhole portal (front view)
//     Looking INTO the wormhole mouth. Rectangular grid warps to
//     polar coords: horizontal lines → concentric rings,
//     vertical lines → radial spokes. Power-curve radial mapping
//     compresses center → depth/tunnel illusion.
// ═══════════════════════════════════════════════════════════════
export const spacetimeWarp: GridStateFunction = (cols, rows) =>
  buildGrid(cols, rows,
    (_c, _r, cx, cy) => {
      const r = Math.sqrt(cx * cx + cy * cy);
      if (r < 0.001) return [0, 0];
      const theta = Math.atan2(cy, cx);

      const maxR = Math.SQRT2; // diagonal corner distance
      const t = Math.min(r / maxR, 1); // normalize 0→1

      // Wormhole radial profile: power curve compresses center (depth illusion)
      // throat = small central circle, mouth = outer ring
      const throat = 0.06;
      const mouth = 0.95;
      const mapped = throat + (mouth - throat) * Math.pow(t, 1.8);

      return [Math.cos(theta) * mapped, Math.sin(theta) * mapped];
    },
    (_c, _r, cx, cy) => {
      const r = Math.sqrt(cx * cx + cy * cy);
      const maxR = Math.SQRT2;
      const t = r / maxR;

      // Throat center: dark void
      if (t < 0.04) return 0.05;
      if (t < 0.10) return 0.2;

      // Depth-based brightness: brighter at mouth, dimmer deep in tunnel
      const depthAlpha = 0.35 + 0.65 * Math.pow(t, 0.6);

      // Concentric ring emphasis (grid horizontal lines naturally form these)
      // Radial spoke emphasis (grid vertical lines naturally form these)
      // Both come for free from the grid topology — alpha just controls brightness
      return depthAlpha;
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
//  5. musicProduction — bass fretboard (12 frets)
//     Position fn: clean rectangle map — no clustering.
//     Alpha fn: fret bars + circular dots (2D Gaussian in NDC) + blank gaps.
//     Dots at 3,5,7,9; double-dot at 12. Non-dot zones = alpha 0.
// ═══════════════════════════════════════════════════════════════
export const musicProduction: GridStateFunction = (cols, rows) => {
  const yBot = -0.94, yTop = 0.92;
  const hw = 0.15; // half-width: fretboard = 15% screen width (total 0.30 NDC of 2.0)

  // Nut at top (t=0.97). fret 12 = half scale → fretSpan = 0.94/0.5 = 1.88
  const nutT = 0.97;
  const fretSpan = 0.94 / (1 - Math.pow(2, -12 / 12)); // 1.88

  // fretTs[n-1] = t-position of fret bar n (bars 1–12)
  const fretTs: number[] = [];
  for (let n = 1; n <= 12; n++) {
    fretTs.push(nutT - (1 - Math.pow(2, -n / 12)) * fretSpan);
  }

  const DOT_FRETS = new Set([3, 5, 7, 9, 12]);

  // Zone n+1 = space between fret bar n and fret bar n+1 (where you press to play fret n+1)
  const getZone = (t: number) => {
    for (let n = 0; n < 12; n++) {
      const top = n === 0 ? nutT : fretTs[n - 1];
      const bot = fretTs[n];
      if (t <= top && t > bot) {
        const fretNum = n + 1;
        return { hasDot: DOT_FRETS.has(fretNum), isDouble: fretNum === 12, top, bot };
      }
    }
    return null;
  };

  // Dot Gaussian: aspect-corrected for round dots on ~16:9 screen
  // sigX in NDC ≈ 15px on 1280w;  sigY = sigX * (16/9) for circular appearance
  const sigX = 0.022;
  const sigY = sigX * (16 / 9); // ≈ 0.039

  return buildGrid(cols, rows,
    // ── Position: clean rectangle. No clustering needed. ──
    (c, r, cx, cy) => {
      const targetX = -hw + (c / cols) * 2 * hw;
      const targetY = yBot + (r / rows) * (yTop - yBot);
      const blend = 0.95;
      return [cx * (1 - blend) + targetX * blend, cy * (1 - blend) + targetY * blend];
    },
    // ── Alpha: fret bars + round dot Gaussians + blank gaps ──
    (c, r) => {
      const t = r / rows;
      const cFrac = c / cols;

      // Fretboard left/right edges (2 columns each side for bold outline)
      if (c <= 1 || c >= cols - 1) return 1;

      // Nut — thick line at top of fretboard
      if (Math.abs(t - nutT) < 1.5 / rows) return 1;

      // Fret bars — 1 row thick each
      if (fretTs.some(ft => Math.abs(t - ft) < 1.0 / rows)) return 1;

      // Outside fretboard bounds → invisible
      if (t >= nutT || t <= fretTs[11]) return 0;

      // Inside fretboard: check zone
      const zone = getZone(t);
      if (!zone || !zone.hasDot) return 0; // blank gap between non-dot frets

      // Map vertex to fretboard NDC for Gaussian evaluation
      const vx = -hw + cFrac * 2 * hw;
      const vy = yBot + t * (yTop - yBot);
      const dotY = yBot + ((zone.top + zone.bot) / 2) * (yTop - yBot);
      const dy = vy - dotY;

      if (zone.isDouble) {
        // Two dots symmetrically placed at ±42% of half-width
        const xl = -hw * 0.42, xr = hw * 0.42;
        const gL = Math.exp(-((vx - xl) ** 2) / (2 * sigX * sigX) - (dy * dy) / (2 * sigY * sigY));
        const gR = Math.exp(-((vx - xr) ** 2) / (2 * sigX * sigX) - (dy * dy) / (2 * sigY * sigY));
        return Math.max(gL, gR);
      }
      // Single dot at center x=0
      return Math.exp(-(vx * vx) / (2 * sigX * sigX) - (dy * dy) / (2 * sigY * sigY));
    },
  );
};

export const bassGuitar = musicProduction; // legacy alias

// ═══════════════════════════════════════════════════════════════
//  5b. headphones — two elliptical ear cups (taller than wide,
//      like cups viewed side-on) + a tall headband arc overhead.
//      Ellipse semi-axes a_x/b_y replace the old aspect-circle so
//      rings snap onto true concentric ovals in NDC space.
// ═══════════════════════════════════════════════════════════════
export const headphones: GridStateFunction = (cols, rows) => {
  const lcx = -0.55, cupY = 0.0;
  const rcx =  0.55;
  // Ellipse semi-axes: narrow width (sideways cup look), taller height
  const a_x = 0.14;   // NDC x half-width
  const b_y = 0.36;   // NDC y half-height  (≈ 2.6:1 tall ratio on 16:9)
  const innerNorm = 0.20;  // normalized inner-hole cutoff (0 = centre, 1 = edge)
  const ringCount  = 3;
  const spokeCount = 16;
  const ringBlend  = 0.88;

  // Headband: circular arc from cup tops (±lcx, b_y) arching to peak (0, ~0.90)
  // Arc circle centre (0, hbCY), outer radius hbR_outer — solved analytically
  const hbCY      = 0.35;
  const hbR_outer = 0.55;   // connects exactly to cup tops
  const hbR_inner = 0.41;   // inner edge of band (creates band thickness)
  const hbAngleL  = Math.atan2(b_y - hbCY, lcx);   // ≈ 177° (nearly horizontal left)
  const hbAngleR  = Math.atan2(b_y - hbCY, rcx);   // ≈   3° (nearly horizontal right)

  // Headband zone: top-centre strip above the cups
  const inBand = (cx: number, cy: number) => cy > 0.33 && Math.abs(cx) < 0.55;

  return buildGrid(cols, rows,
    (_c, _r, cx, cy) => {
      if (inBand(cx, cy)) {
        const t     = (cx + 0.55) / 1.10;
        const angle = hbAngleL + t * (hbAngleR - hbAngleL);
        const cy_t  = (cy - 0.33) / 0.67;
        const r     = hbR_inner + cy_t * (hbR_outer - hbR_inner);
        return [Math.cos(angle) * r, hbCY + Math.sin(angle) * r];
      }

      // Elliptical cup — work in normalised (circular) coordinate space
      const [ccx, ccy] = cx < 0 ? [lcx, cupY] : [rcx, cupY];
      const nx = (cx - ccx) / a_x;
      const ny = (cy - ccy) / b_y;
      const ell  = Math.sqrt(nx * nx + ny * ny);
      const angle = Math.atan2(ny, nx);

      // Ring snap in normalised space → maps back to concentric ellipses in NDC
      const targetNorm = Math.round(ell * ringCount) / ringCount;
      const snapAngle  = Math.round(angle / (Math.PI * 2 / spokeCount)) * (Math.PI * 2 / spokeCount);
      const spokeBlend = ell < 0.15 ? 0.9 : 0.20;
      const finalAngle = angle * (1 - spokeBlend) + snapAngle * spokeBlend;
      const finalNorm  = ell * (1 - ringBlend) + targetNorm * ringBlend;

      return [
        ccx + Math.cos(finalAngle) * finalNorm * a_x,
        ccy + Math.sin(finalAngle) * finalNorm * b_y,
      ];
    },
    (_c, _r, cx, cy) => {
      if (inBand(cx, cy)) return 1;

      const [ccx, ccy] = cx < 0 ? [lcx, cupY] : [rcx, cupY];
      const nx   = (cx - ccx) / a_x;
      const ny   = (cy - ccy) / b_y;
      const ell  = Math.sqrt(nx * nx + ny * ny);

      if (ell < innerNorm || ell > 1.0) return 0;
      return 1;
    },
  );
};

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
//  9. cityscape — tall buildings skyline + construction crane
//     Clean city silhouette: varied-height buildings with clear
//     outlines, one tower crane on the right. Simple and readable.
// ═══════════════════════════════════════════════════════════════
export const cityscape: GridStateFunction = (cols, rows) => {
  // Building definitions: [leftFrac, rightFrac, heightFrac]
  // Fraction of cols / rows. Heights create a recognizable skyline.
  const buildings: [number, number, number][] = [
    [0.02, 0.10, 0.38],  // A: short wide
    [0.12, 0.20, 0.62],  // B: medium
    [0.22, 0.28, 0.48],  // C: short narrow
    [0.30, 0.42, 0.82],  // D: tallest skyscraper (wide)
    [0.44, 0.52, 0.55],  // E: medium
    [0.54, 0.60, 0.70],  // F: tall narrow
    [0.62, 0.72, 0.45],  // G: short wide
  ];

  // Crane: tower at right side, jib extends left over buildings
  const craneTL = 0.78, craneTR = 0.82; // tower column range
  const craneH = 0.92;                   // tower height
  const jibLeft = 0.50, jibRight = 0.95; // jib horizontal extent
  const cableX = 0.52;                   // cable hangs from near jib left end
  const cableBot = 0.40;                 // cable bottom

  // Which building is the column in? Returns height or 0.
  const getBuildingHeight = (ct: number): number => {
    for (const [l, r, h] of buildings) {
      if (ct >= l && ct <= r) return h;
    }
    return 0;
  };

  return buildGrid(cols, rows,
    (c, r, cx, cy) => {
      const t = r / rows; // 0=bottom, 1=top
      const ct = c / cols;

      // ── Crane tower ──
      if (ct >= craneTL && ct <= craneTR) {
        const towerX = -1 + (craneTL + craneTR);
        const localX = ((ct - craneTL) / (craneTR - craneTL) - 0.5) * (craneTR - craneTL) * 2;
        if (t <= craneH) return [towerX + localX, cy];
        return [towerX + localX, -1 + craneH * 2]; // above tower → snap to top
      }

      // ── Crane jib: horizontal bar at tower top ──
      if (ct >= jibLeft && ct <= jibRight && Math.abs(t - craneH) < 0.03) {
        return [cx, -1 + craneH * 2];
      }

      // ── Cable: vertical line from jib tip down ──
      if (Math.abs(ct - cableX) < 0.015 && t >= cableBot && t <= craneH) {
        return [-1 + cableX * 2, cy];
      }

      // ── Buildings ──
      const bh = getBuildingHeight(ct);
      if (bh === 0) {
        // Street / gap: compress vertices to ground
        return [cx, -1 + t * 0.08];
      }
      if (t <= bh) return [cx, cy]; // within building
      return [cx, -1 + bh * 2];     // above roof: snap to roofline
    },
    (c, r) => {
      const t = r / rows;
      const ct = c / cols;

      // ── Crane tower ──
      if (ct >= craneTL && ct <= craneTR) {
        return t <= craneH ? 1 : 0;
      }
      // ── Crane jib ──
      if (ct >= jibLeft && ct <= jibRight && Math.abs(t - craneH) < 0.03) return 0.85;
      // ── Cable ──
      if (Math.abs(ct - cableX) < 0.015 && t >= cableBot && t <= craneH) return 0.6;

      // ── Buildings ──
      const bh = getBuildingHeight(ct);
      if (bh === 0) {
        return t <= 0.025 ? 0.35 : 0; // ground line or empty
      }
      if (t > bh) return 0; // above roof

      // Building outline: left/right edges + rooftop
      const isLeftEdge = buildings.some(([l]) => Math.abs(ct - l) < 0.015);
      const isRightEdge = buildings.some(([, r2]) => Math.abs(ct - r2) < 0.015);
      const isRoof = Math.abs(t - bh) < 0.03;
      if (isLeftEdge || isRightEdge || isRoof) return 1;

      // Windows: grid pattern inside buildings
      const winRow = r % 3 === 1;
      const winCol = c % 3 === 1;
      if (winRow && winCol && t > 0.06 && t < bh - 0.04) return 0.7;

      return 0.25; // building face fill
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
  'dreamCatcher', 'bassGuitar', 'musicProduction', 'headphones', 'volleyball', 'topographic', 'pixelGrid',
  'mangaPanels', 'filmComposition', 'banigWeaving', 'mondrian',
  'developerSetup', 'cityscape',
];

const STATE_MAP: Record<GridStateName, GridStateFunction> = {
  graphPaper, keyboard, terminal, spacetimeWarp, chartsData,
  dreamCatcher, bassGuitar, musicProduction, headphones, volleyball, topographic, pixelGrid,
  mangaPanels, filmComposition, banigWeaving, mondrian,
  developerSetup, cityscape,
};

export function getGridState(name: GridStateName, cols: number, rows: number): GridState {
  const fn = STATE_MAP[name];
  if (!fn) throw new Error(`Unknown grid state: "${name}"`);
  return fn(cols, rows);
}
