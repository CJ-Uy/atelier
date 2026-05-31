/**
 * MagicCircle — SVG magic circle library, 8 variants.
 * Ink-on-paper aesthetic. Each circle rotates slowly via CSS animation.
 * Outer ring carries rune text. Inner geometry is variant-specific.
 *
 * Variants: casting · pentagram · hexagram · wheel · sigil · summoning · binding · eye
 */

import React from 'react';

const LATIN_RUNES = '· FIAT · LUX · ARS · NOTA · OPVS · INVOCO · SIGILLVM · ATRAMENTVM ';

let _uidCounter = 0;
function uid(prefix: string) {
  return `${prefix}-${++_uidCounter}`;
}

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

function Pentagram({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const pts = polarPts(cx, cy, r, 5);
  const path = `M ${pts[0][0]} ${pts[0][1]} L ${pts[2][0]} ${pts[2][1]} L ${pts[4][0]} ${pts[4][1]} L ${pts[1][0]} ${pts[1][1]} L ${pts[3][0]} ${pts[3][1]} Z`;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.55" />
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="miter" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.2" fill="currentColor" />)}
    </g>
  );
}

function Hexagram({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const pts = polarPts(cx, cy, r, 6);
  const tri1 = `M ${pts[0][0]} ${pts[0][1]} L ${pts[2][0]} ${pts[2][1]} L ${pts[4][0]} ${pts[4][1]} Z`;
  const tri2 = `M ${pts[1][0]} ${pts[1][1]} L ${pts[3][0]} ${pts[3][1]} L ${pts[5][0]} ${pts[5][1]} Z`;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.55" />
      <path d={tri1} fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d={tri2} fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx={cx} cy={cy} r="3" fill="currentColor" />
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

function SummoningInner({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const inner = r * 0.40;
  const ipts = polarPts(cx, cy, inner, 5);
  const opts = polarPts(cx, cy, r * 0.78, 5);
  const path = `M ${ipts[0][0]} ${ipts[0][1]} L ${ipts[2][0]} ${ipts[2][1]} L ${ipts[4][0]} ${ipts[4][1]} L ${ipts[1][0]} ${ipts[1][1]} L ${ipts[3][0]} ${ipts[3][1]} Z`;
  const satR = r * 0.14;
  return (
    <g>
      <circle cx={cx} cy={cy} r={inner} fill="none" stroke="currentColor" strokeWidth="0.7" />
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.2" />
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

function Eye({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const eyePath = `M ${cx - r} ${cy} Q ${cx} ${cy - r * 0.6} ${cx + r} ${cy} Q ${cx} ${cy + r * 0.6} ${cx - r} ${cy} Z`;
  return (
    <g>
      <path d={eyePath} fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={r * 0.32} fill="none" stroke="currentColor" strokeWidth="0.8" />
      <circle cx={cx} cy={cy} r={r * 0.12} fill="currentColor" />
      {[0,1,2,3].map(i => {
        const a = (i / 4) * Math.PI * 2;
        return <line key={i}
          x1={cx + Math.cos(a) * r * 1.06} y1={cy + Math.sin(a) * r * 0.66}
          x2={cx + Math.cos(a) * r * 1.22} y2={cy + Math.sin(a) * r * 0.78}
          stroke="currentColor" strokeWidth="0.6" />;
      })}
    </g>
  );
}

// ── Inner shape selector ──────────────────────────────────────────

type Variant = 'casting' | 'pentagram' | 'hexagram' | 'wheel' | 'sigil' | 'summoning' | 'binding' | 'eye';

function InnerShape({ variant, cx, cy, r }: { variant: Variant; cx: number; cy: number; r: number }) {
  switch (variant) {
    case 'casting':   return <CastingSpokes cx={cx} cy={cy} r={r} />;
    case 'pentagram': return <Pentagram cx={cx} cy={cy} r={r} />;
    case 'hexagram':  return <Hexagram cx={cx} cy={cy} r={r} />;
    case 'wheel':     return <Wheel cx={cx} cy={cy} r={r} />;
    case 'sigil':     return <Sigil cx={cx} cy={cy} r={r} />;
    case 'summoning': return <SummoningInner cx={cx} cy={cy} r={r} />;
    case 'binding':   return <Binding cx={cx} cy={cy} r={r} />;
    case 'eye':       return <Eye cx={cx} cy={cy} r={r} />;
  }
}

// ── Cardinal marks ────────────────────────────────────────────────

function Cardinals({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <>
      {['N','E','S','W'].map((label, i) => {
        const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
        const lx = cx + Math.cos(a) * (r * 1.18);
        const ly = cy + Math.sin(a) * (r * 1.18);
        return (
          <text key={label} x={lx} y={ly}
            textAnchor="middle" dominantBaseline="middle"
            fontFamily="'IBM Plex Mono',monospace" fontSize={r * 0.12}
            fontWeight="600" letterSpacing="0.1em"
            fill="currentColor" opacity="0.5"
          >{label}</text>
        );
      })}
    </>
  );
}

// ── Rune text ring ────────────────────────────────────────────────

function RuneRing({ id, cx, cy, r, text }: { id: string; cx: number; cy: number; r: number; text: string }) {
  const pathId = `rune-path-${id}`;
  const circumference = 2 * Math.PI * r;
  const runes = text.repeat(Math.ceil(circumference / (text.length * r * 0.09)));
  return (
    <g>
      <defs>
        <path id={pathId}
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx - r + 0.001} ${cy}`}
        />
      </defs>
      <text fontSize={r * 0.085} fill="currentColor" opacity="0.65"
        fontFamily="'IBM Plex Mono',monospace" letterSpacing="0.04em">
        <textPath href={`#${pathId}`}>{runes}</textPath>
      </text>
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
  runes?: boolean;
  runeText?: string;
  showCardinals?: boolean;
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
  runeText = LATIN_RUNES,
  showCardinals = false,
  style,
  className,
}: MagicCircleProps) {
  const id = React.useId().replace(/:/g, '');
  const c = size / 2;
  const outerR = c * 0.88;
  const runeR = c * 0.78;
  const innerR = c * 0.58;

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
      style={{ color: '#0a0a0a', display: 'block', ...style }}
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
        {/* Rune text */}
        {runes && <RuneRing id={id} cx={c} cy={c} r={runeR} text={runeText} />}
      </g>

      {/* Inner shape (counter-rotating or same direction) */}
      <g style={innerAnim}>
        <InnerShape variant={variant} cx={c} cy={c} r={innerR} />
      </g>

      {showCardinals && <Cardinals cx={c} cy={c} r={c * 0.95} />}
    </svg>
  );
}
