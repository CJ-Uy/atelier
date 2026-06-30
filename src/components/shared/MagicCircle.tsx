/**
 * MagicCircle — SVG circle library, 8 variants. Ink-on-paper aesthetic; each
 * circle rotates slowly via CSS animation.
 *
 * Purely geometric / abstract — no text, no occult symbolism. The outer band is
 * an abstract glyph inscription (ticks · beads · dots), and the inner geometry
 * is drawn from sacred-geometry / drafting motifs rather than stars or eyes:
 *
 *   casting   · radiating spokes + core
 *   bloom     · flower-of-life rosette        (was: pentagram star)
 *   lattice   · concentric hexagon web        (was: hexagram / Star of David)
 *   wheel     · concentric rings + spokes
 *   sigil     · single spiral
 *   summoning · pentagon node-array (5 anchors for the Contact charge animation)
 *   binding   · dense radial bind + dashed ring
 *   lens      · hatched vesica / aperture      (was: all-seeing eye)
 */

import React from 'react';

function polarPts(cx: number, cy: number, r: number, n: number, startAngle = -Math.PI / 2) {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = startAngle + (i / n) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

// ── Sub-shape components ──────────────────────────────────────────

function CastingSpokes({ cx, cy, r, spokes = 12 }: { cx: number; cy: number; r: number; spokes?: number }) {
  const inner = r * 0.42;
  return (
    <g>
      <circle cx={cx} cy={cy} r={inner} fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={inner * 0.32} fill="currentColor" />
      {Array.from({ length: spokes }, (_, i) => {
        const a = (i / spokes) * Math.PI * 2;
        return (
          <line key={i}
            x1={cx + Math.cos(a) * inner} y1={cy + Math.sin(a) * inner}
            x2={cx + Math.cos(a) * r}     y2={cy + Math.sin(a) * r}
            stroke="currentColor" strokeWidth="1"
          />
        );
      })}
    </g>
  );
}

// Flower-of-life rosette: a ring of overlapping circles that all pass through a
// shared centre. Ornate, abstract sacred geometry — no star.
function Bloom({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const n = 12;
  const ring = r * 0.5;   // centres of the petal circles
  const petal = r * 0.5;  // petal radius (== ring → petals meet at the centre)
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.45" />
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        return (
          <circle key={i}
            cx={cx + Math.cos(a) * ring} cy={cy + Math.sin(a) * ring}
            r={petal} fill="none" stroke="currentColor" strokeWidth="0.7" opacity="0.8"
          />
        );
      })}
      <circle cx={cx} cy={cy} r={petal} fill="none" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
      <circle cx={cx} cy={cy} r={r * 0.05} fill="currentColor" />
    </g>
  );
}

// Concentric hexagons + radial spokes — a hexagonal lattice / web. Geometric,
// not a six-pointed star.
function Lattice({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const hexPath = (pts: [number, number][]) => `M ${pts.map((p) => `${p[0]} ${p[1]}`).join(' L ')} Z`;
  const outer = polarPts(cx, cy, r, 6);
  const mid = polarPts(cx, cy, r * 0.62, 6);
  const inner = polarPts(cx, cy, r * 0.28, 6);
  return (
    <g>
      <path d={hexPath(outer)} fill="none" stroke="currentColor" strokeWidth="1" />
      <path d={hexPath(mid)} fill="none" stroke="currentColor" strokeWidth="0.7" opacity="0.8" />
      <path d={hexPath(inner)} fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.65" />
      {outer.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke="currentColor" strokeWidth="0.4" opacity="0.45" />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.05} fill="currentColor" />
    </g>
  );
}

function Wheel({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const spokeR = r * 0.95, innerR = r * 0.35, midR = r * 0.62;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r}     fill="none" stroke="currentColor" strokeWidth="0.8" />
      <circle cx={cx} cy={cy} r={midR}  fill="none" stroke="currentColor" strokeWidth="0.6" />
      <circle cx={cx} cy={cy} r={innerR}fill="none" stroke="currentColor" strokeWidth="1" />
      {[0,1,2,3].map(i => {
        const a = (i / 4) * Math.PI * 2;
        return <line key={`c-${i}`}
          x1={cx + Math.cos(a) * innerR} y1={cy + Math.sin(a) * innerR}
          x2={cx + Math.cos(a) * spokeR} y2={cy + Math.sin(a) * spokeR}
          stroke="currentColor" strokeWidth="1.2" />;
      })}
      {[0,1,2,3].map(i => {
        const a = Math.PI / 4 + (i / 4) * Math.PI * 2;
        return <line key={`d-${i}`}
          x1={cx + Math.cos(a) * midR}  y1={cy + Math.sin(a) * midR}
          x2={cx + Math.cos(a) * spokeR} y2={cy + Math.sin(a) * spokeR}
          stroke="currentColor" strokeWidth="0.6" />;
      })}
      <circle cx={cx} cy={cy} r="2.5" fill="currentColor" />
    </g>
  );
}

function Sigil({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const turns = 2.5, steps = 120;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = t * Math.PI * 2 * turns;
    const rad = r * t * 0.95;
    d += (i === 0 ? 'M' : 'L') + ` ${(cx + Math.cos(a) * rad).toFixed(1)} ${(cy + Math.sin(a) * rad).toFixed(1)} `;
  }
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="2.5" fill="currentColor" />
    </g>
  );
}

// Five spokes out to satellite rings, joined at the core by a convex pentagon
// (a polygon — NOT a pentagram star). The five `.mc-summon-node` dots are the
// anchors the Contact page's charge-line animation fires from, so the count and
// class are preserved.
function SummoningInner({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const inner = r * 0.40;
  const ipts = polarPts(cx, cy, inner, 5);
  const opts = polarPts(cx, cy, r * 0.78, 5);
  const pentagon = `M ${ipts.map((p) => `${p[0]} ${p[1]}`).join(' L ')} Z`;
  const satR = r * 0.14;
  return (
    <g>
      {/* abstract concentric core + convex pentagon */}
      <circle cx={cx} cy={cy} r={inner} fill="none" stroke="currentColor" strokeWidth="0.7" />
      <circle cx={cx} cy={cy} r={inner * 0.6} fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
      <path d={pentagon} fill="none" stroke="currentColor" strokeWidth="1" opacity="0.85" />
      <circle cx={cx} cy={cy} r={r * 0.05} fill="currentColor" />
      {/* spokes + satellite rings + animation anchor nodes */}
      {opts.map((p, i) => (
        <g key={i}>
          <line x1={ipts[i][0]} y1={ipts[i][1]} x2={p[0]} y2={p[1]} stroke="currentColor" strokeWidth="0.6" />
          <circle cx={p[0]} cy={p[1]} r={satR} fill="none" stroke="currentColor" strokeWidth="0.9" />
          <circle className="mc-summon-node" cx={p[0]} cy={p[1]} r="1.6" fill="currentColor" />
        </g>
      ))}
    </g>
  );
}

function Binding({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const N = 16, inner = r * 0.38;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r}     fill="none" stroke="currentColor" strokeWidth="0.8" />
      <circle cx={cx} cy={cy} r={inner} fill="none" stroke="currentColor" strokeWidth="0.6" />
      {Array.from({ length: N }, (_, i) => {
        const a = (i / N) * Math.PI * 2;
        return <line key={i}
          x1={cx + Math.cos(a) * inner} y1={cy + Math.sin(a) * inner}
          x2={cx + Math.cos(a) * r}    y2={cy + Math.sin(a) * r}
          stroke="currentColor" strokeWidth="0.5" />;
      })}
      <circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="3 2" />
      <circle cx={cx} cy={cy} r="3" fill="currentColor" />
    </g>
  );
}

// Hatched vesica / lens — an almond filled with parallel chords and a nested
// smaller almond. Reads as an abstract aperture, not an eye (no iris or pupil).
function Lens({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const lensH = r * 0.62;
  const almond = (rad: number, h: number) =>
    `M ${cx - rad} ${cy} Q ${cx} ${cy - h} ${cx + rad} ${cy} Q ${cx} ${cy + h} ${cx - rad} ${cy} Z`;
  const N = 9;
  const hatch: React.ReactElement[] = [];
  for (let i = 1; i < N; i++) {
    const y = cy - lensH + (i / N) * 2 * lensH;
    const k = 1 - Math.pow((y - cy) / lensH, 2); // half-width of the almond at this y
    const hw = r * Math.sqrt(Math.max(0, k));
    hatch.push(<line key={i} x1={cx - hw} y1={y} x2={cx + hw} y2={y} stroke="currentColor" strokeWidth="0.5" opacity="0.4" />);
  }
  return (
    <g>
      <path d={almond(r, lensH)} fill="none" stroke="currentColor" strokeWidth="1.1" />
      {hatch}
      <path d={almond(r * 0.6, lensH * 0.6)} fill="none" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
    </g>
  );
}

// Orrery — tilted orbital ellipses around a core, each carrying a node. Reads as
// the study / observation of a system; used for research (replaces the vesica lens).
function Orrery({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const rx = r * 0.95, ry = r * 0.38;
  return (
    <g>
      {[0, 60, 120].map((deg, i) => (
        <g key={i} transform={`rotate(${deg} ${cx} ${cy})`}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="currentColor" strokeWidth="0.7" opacity={0.85 - i * 0.12} />
          <circle cx={cx + rx} cy={cy} r={r * 0.05} fill="currentColor" />
        </g>
      ))}
      <circle cx={cx} cy={cy} r={r * 0.4} fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
      <circle cx={cx} cy={cy} r={r * 0.08} fill="currentColor" />
    </g>
  );
}

// ── Inner shape selector ──────────────────────────────────────────

type Variant = 'casting' | 'bloom' | 'lattice' | 'wheel' | 'sigil' | 'summoning' | 'binding' | 'lens' | 'orrery';

function InnerShape({ variant, cx, cy, r }: { variant: Variant; cx: number; cy: number; r: number }) {
  switch (variant) {
    case 'casting':   return <CastingSpokes cx={cx} cy={cy} r={r} />;
    case 'bloom':     return <Bloom cx={cx} cy={cy} r={r} />;
    case 'lattice':   return <Lattice cx={cx} cy={cy} r={r} />;
    case 'wheel':     return <Wheel cx={cx} cy={cy} r={r} />;
    case 'sigil':     return <Sigil cx={cx} cy={cy} r={r} />;
    case 'summoning': return <SummoningInner cx={cx} cy={cy} r={r} />;
    case 'binding':   return <Binding cx={cx} cy={cy} r={r} />;
    case 'lens':      return <Lens cx={cx} cy={cy} r={r} />;
    case 'orrery':    return <Orrery cx={cx} cy={cy} r={r} />;
  }
}

// ── Cardinal marks (geometric — small diamonds, no letters) ───────

function CardinalMarks({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const d = r * 0.05;
  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
        const cos = Math.cos(a), sin = Math.sin(a);
        const px = cx + cos * (r * 1.16), py = cy + sin * (r * 1.16);
        return (
          <g key={i} opacity="0.55">
            <line
              x1={cx + cos * (r * 1.04)} y1={cy + sin * (r * 1.04)}
              x2={cx + cos * (r * 1.10)} y2={cy + sin * (r * 1.10)}
              stroke="currentColor" strokeWidth="0.9"
            />
            <polygon
              points={`${px},${py - d} ${px + d},${py} ${px},${py + d} ${px - d},${py}`}
              fill="none" stroke="currentColor" strokeWidth="0.9"
            />
          </g>
        );
      })}
    </>
  );
}

// ── Glyph ring (abstract inscription band — ticks · beads · dots) ──

function GlyphRing({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const count = 48;
  const marks: React.ReactElement[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    const cos = Math.cos(a), sin = Math.sin(a);
    const mod = i % 4;
    if (mod === 0) {
      // short radial tick spanning the band
      marks.push(
        <line key={i}
          x1={cx + cos * (r - r * 0.05)} y1={cy + sin * (r - r * 0.05)}
          x2={cx + cos * (r + r * 0.05)} y2={cy + sin * (r + r * 0.05)}
          stroke="currentColor" strokeWidth="0.7" opacity="0.6"
        />,
      );
    } else if (mod === 2) {
      // small open bead
      marks.push(<circle key={i} cx={cx + cos * r} cy={cy + sin * r} r={r * 0.022} fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.55" />);
    } else {
      // fine dot
      marks.push(<circle key={i} cx={cx + cos * r} cy={cy + sin * r} r={r * 0.012} fill="currentColor" opacity="0.5" />);
    }
  }
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + r * 0.06} fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.4" />
      <circle cx={cx} cy={cy} r={r - r * 0.06} fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.4" />
      {marks}
    </g>
  );
}

// ── Overlay layers (additive aspect marks composed on top of the base) ────────
// A work's rich attribute tags are reduced (in works.data.ts) to this small set,
// so two projects with the same base shape still read differently.

const VERMILION = '#dc3522';
const PAPER = '#faf9f6';

export type Overlay = 'seal' | 'orbit' | 'ticks' | 'circuit' | 'nodes';

// award → a static vermilion wax-seal stamp at the top of the band. THE accent.
function SealMark({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const sx = cx, sy = cy - r, sr = r * 0.135;
  return (
    <g>
      <path d={`M ${sx - sr * 0.55} ${sy} L ${sx} ${sy + sr * 1.7} L ${sx + sr * 0.55} ${sy} Z`} fill={VERMILION} opacity="0.85" />
      <circle cx={sx} cy={sy} r={sr} fill={VERMILION} />
      <circle cx={sx} cy={sy} r={sr * 0.6} fill="none" stroke={PAPER} strokeWidth="0.9" />
      <circle cx={sx} cy={sy} r={sr * 0.16} fill={PAPER} />
    </g>
  );
}

// community / teaching / leadership / civic / team → satellite nodes orbiting outside.
function OrbitNodes({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const orb = r * 1.12, dot = r * 0.05;
  return (
    <g opacity="0.7">
      {polarPts(cx, cy, orb, 6).map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={dot} fill="none" stroke="currentColor" strokeWidth="0.9" />
      ))}
    </g>
  );
}

// research / data → drafting corner brackets + a row of measure ticks.
function TickBrackets({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const br = r * 1.07, len = r * 0.1;
  const corner = (a: number) => {
    const px = cx + Math.cos(a) * br, py = cy + Math.sin(a) * br;
    const tx = Math.cos(a + Math.PI / 2), ty = Math.sin(a + Math.PI / 2);
    const rx = Math.cos(a), ry = Math.sin(a);
    return `M ${px - tx * len} ${py - ty * len} L ${px} ${py} L ${px - rx * len} ${py - ry * len}`;
  };
  return (
    <g opacity="0.6">
      {[1, 3, 5, 7].map((k) => (
        <path key={k} d={corner((k / 4) * Math.PI)} fill="none" stroke="currentColor" strokeWidth="0.8" />
      ))}
    </g>
  );
}

// systems / commerce / ocr / realtime → short circuit traces ending in node pads.
function CircuitTrace({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const pad = r * 0.045;
  return (
    <g opacity="0.55">
      {[0.2, 0.85, 1.55].map((frac, i) => {
        const a = frac * Math.PI * 2;
        const x1 = cx + Math.cos(a) * (r * 0.7), y1 = cy + Math.sin(a) * (r * 0.7);
        const x2 = cx + Math.cos(a) * r, y2 = cy + Math.sin(a) * r;
        const tx = x2 + Math.cos(a + Math.PI / 2) * (r * 0.18), ty = y2 + Math.sin(a + Math.PI / 2) * (r * 0.18);
        return (
          <g key={i}>
            <path d={`M ${x1} ${y1} L ${x2} ${y2} L ${tx} ${ty}`} fill="none" stroke="currentColor" strokeWidth="0.7" />
            <rect x={tx - pad} y={ty - pad} width={pad * 2} height={pad * 2} fill="none" stroke="currentColor" strokeWidth="0.7" />
          </g>
        );
      })}
    </g>
  );
}

// ai → a webbed interior node-mesh with one lit decision path.
function NodesMesh({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const pts = polarPts(cx, cy, r * 0.72, 5, -Math.PI / 2 + 0.3);
  return (
    <g opacity="0.7">
      {pts.map((p, i) => {
        const q = pts[(i + 2) % pts.length];
        return <line key={`e${i}`} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="currentColor" strokeWidth="0.4" opacity="0.5" />;
      })}
      <path
        d={`M ${pts[0][0]} ${pts[0][1]} L ${pts[2][0]} ${pts[2][1]} L ${pts[4][0]} ${pts[4][1]}`}
        fill="none" stroke="currentColor" strokeWidth="1.1"
      />
      {pts.map((p, i) => <circle key={`n${i}`} cx={p[0]} cy={p[1]} r={r * 0.05} fill="currentColor" />)}
    </g>
  );
}

// ── Main MagicCircle component ────────────────────────────────────

interface MagicCircleProps {
  variant?: Variant;
  size?: number;
  /** Outer ring rotation period in seconds (larger = slower) */
  rotateSpeed?: number;
  /** Inner shape rotation period in seconds */
  innerRotateSpeed?: number;
  reverseInner?: boolean;
  /** Show the abstract glyph inscription band on the outer ring */
  runes?: boolean;
  /** Show geometric cardinal marks (diamonds) just outside the ring */
  showCardinals?: boolean;
  /** Additive aspect layers stacked on top of the base shape */
  overlays?: Overlay[];
  /** Lifecycle → stroke style: archived fades, prototype/in-progress adds a dashed construction ring */
  state?: 'live' | 'prototype' | 'archived' | 'in-progress';
  /** Complexity 0–2 → extra concentric sub-rings + denser glyph band */
  intensity?: 0 | 1 | 2;
  /** Early-work "first spell" → a rougher ghosted base ring */
  origin?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export default function MagicCircle({
  variant = 'casting',
  size = 200,
  rotateSpeed = 80,
  innerRotateSpeed = 40,
  reverseInner = false,
  runes = true,
  showCardinals = false,
  overlays = [],
  state = 'live',
  intensity = 0,
  origin = false,
  style,
  className,
}: MagicCircleProps) {
  const c = size / 2;
  const outerR = c * 0.88;
  const bandR = c * 0.78;
  const innerR = c * 0.58;

  const faded = state === 'archived';
  const dashed = state === 'prototype' || state === 'in-progress';
  const showRunes = runes || intensity > 0;
  const has = (o: Overlay) => overlays.includes(o);

  const outerAnim: React.CSSProperties = {
    transformOrigin: `${c}px ${c}px`,
    animation: `mc-rotate ${rotateSpeed}s linear infinite`,
  };
  const innerAnim: React.CSSProperties = {
    transformOrigin: `${c}px ${c}px`,
    animation: `mc-rotate${reverseInner ? '-rev' : ''} ${innerRotateSpeed}s linear infinite`,
  };

  return (
    <svg
      width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      fill="none" overflow="visible" aria-hidden="true"
      style={{ color: '#0a0a0a', display: 'block', opacity: faded ? 0.5 : 1, ...style }}
      className={className}
    >
      <style>{`
        @keyframes mc-rotate     { from { transform: rotate(0deg);    } to { transform: rotate(360deg);  } }
        @keyframes mc-rotate-rev { from { transform: rotate(0deg);    } to { transform: rotate(-360deg); } }
        @keyframes mc-appear     { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      {/* Outer rings (rotating) */}
      <g style={outerAnim}>
        <circle cx={c} cy={c} r={outerR} stroke="currentColor" strokeWidth="0.7" opacity="0.6" />
        <circle cx={c} cy={c} r={outerR * 0.96} stroke="currentColor" strokeWidth="0.3" opacity="0.35" strokeDasharray="2 4" />
        {/* 12 tick marks */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const isMajor = i % 3 === 0;
          const r1 = outerR * (isMajor ? 0.90 : 0.93);
          return (
            <line key={i}
              x1={c + Math.cos(a) * r1} y1={c + Math.sin(a) * r1}
              x2={c + Math.cos(a) * outerR} y2={c + Math.sin(a) * outerR}
              stroke="currentColor" strokeWidth={isMajor ? 0.9 : 0.5} opacity="0.7"
            />
          );
        })}
        {/* Abstract glyph inscription band (no text) */}
        {showRunes && <GlyphRing cx={c} cy={c} r={bandR} />}
        {/* origin "first spell" → a rougher ghosted ring offset off the true circle */}
        {origin && (
          <circle cx={c + 1.4} cy={c + 1} r={outerR} stroke="currentColor" strokeWidth="0.6" opacity="0.3" />
        )}
      </g>

      {/* complexity → extra static concentric sub-rings between inner and band */}
      {Array.from({ length: intensity }, (_, i) => (
        <circle key={`int-${i}`} cx={c} cy={c}
          r={innerR + ((i + 1) * (bandR - innerR)) / (intensity + 1)}
          stroke="currentColor" strokeWidth="0.35" opacity="0.3" strokeDasharray="1.5 3" />
      ))}

      {/* prototype / in-progress → dashed construction ring */}
      {dashed && (
        <circle cx={c} cy={c} r={outerR * 1.02} stroke="currentColor" strokeWidth="0.7" opacity="0.6" strokeDasharray="5 4" />
      )}

      {/* Inner shape (counter-rotating or same direction) */}
      <g style={innerAnim}>
        <InnerShape variant={variant} cx={c} cy={c} r={innerR} />
        {has('nodes') && <NodesMesh cx={c} cy={c} r={innerR} />}
      </g>

      {/* Overlays — circuit/ticks static; orbit on its own slow spin; seal last + upright */}
      {has('circuit') && <CircuitTrace cx={c} cy={c} r={bandR} />}
      {has('ticks') && <TickBrackets cx={c} cy={c} r={outerR} />}
      {has('orbit') && (
        <g style={{ transformOrigin: `${c}px ${c}px`, animation: 'mc-rotate 140s linear infinite' }}>
          <OrbitNodes cx={c} cy={c} r={outerR} />
        </g>
      )}

      {showCardinals && <CardinalMarks cx={c} cy={c} r={c * 0.95} />}

      {has('seal') && <SealMark cx={c} cy={c} r={outerR} />}
    </svg>
  );
}
