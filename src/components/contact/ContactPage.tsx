/**
 * ContactPage — faithful port of contact-page.jsx from the design bundle.
 * CSS classes (.wp-*, .ph-*, .cm-*) are defined in contact.astro <style is:global>.
 * Framework: React (matches the design's React JSX).
 */

import React, { useState, useEffect, useRef } from 'react';
import MagicCircle from '../shared/MagicCircle';

const INKC = '#0a0a0a';
const VERMC = '#dc3522';

const CONTACT_RUNES = '· VOCA · SCRIBE · INVOCO · RESPONDEO · COLLOQVIVM · SOCIETAS · ADSVM ';

const CHANNELS = [
  { id: 'email',    sigil: '✉',  label: 'Email',             handle: 'charlesjoshuauy@gmail.com',     href: 'mailto:charlesjoshuauy@gmail.com',                      angle: -90, accent: true  },
  { id: 'github',   sigil: 'GH', label: 'GitHub',            handle: 'CJ-Uy',                          href: 'https://github.com/CJ-Uy',                              angle: -30 },
  { id: 'linkedin', sigil: 'in', label: 'LinkedIn',          handle: 'in/charles-joshua-uy',            href: 'https://www.linkedin.com/in/charles-joshua-uy-920826274/', angle: 30 },
  { id: 'phone',    sigil: '✆',  label: 'Phone',             handle: '+63 917 150 4686',                href: 'tel:+639171504686',                                     angle: 90  },
  { id: 'cv',       sigil: 'CV', label: 'Curriculum Vitae',  handle: 'Open PDF ↗',                     href: 'https://cv.cjuy.dev',                                   angle: 150 },
  { id: 'facebook', sigil: 'f',  label: 'Facebook',          handle: '/charlesjoshua.uy',               href: 'https://facebook.com/charlesjoshua.uy',                 angle: 210 },
] as const;

type Channel = typeof CHANNELS[number];

// ── Sigil node positioned on circle perimeter ─────────────────────
function SigilNode({ ch, hovered, onHover, dims }: {
  ch: Channel;
  hovered: string | null;
  onHover: (id: string | null) => void;
  dims: { nodeR: number; disc: number; labelGap: number };
}) {
  const { nodeR, disc, labelGap } = dims;
  const rad = (ch.angle * Math.PI) / 180;
  const ux = Math.cos(rad), uy = Math.sin(rad);
  const nx = ux * nodeR, ny = uy * nodeR;
  const labelW = 132, labelH = 44;
  const proj = Math.abs(ux) * (labelW / 2) + Math.abs(uy) * (labelH / 2);
  const labelDist = nodeR + disc / 2 + labelGap + proj;
  const lx = ux * labelDist, ly = uy * labelDist;
  const isHover = hovered === ch.id;
  const live = isHover && ch.href;
  const Tag = ch.href ? 'a' : 'div';
  const props = ch.href
    ? { href: ch.href, target: (ch.href.startsWith('http') ? '_blank' : undefined) as string | undefined, rel: 'noopener noreferrer' }
    : {};

  return (
    <Tag
      {...props}
      onMouseEnter={() => onHover(ch.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        textDecoration: 'none', cursor: ch.href ? 'pointer' : 'default',
        pointerEvents: 'auto', zIndex: 4,
      }}
    >
      {/* disc */}
      <div style={{
        position: 'absolute', left: nx, top: ny, transform: `translate(-50%, -50%) scale(${live ? 1.12 : 1})`,
        width: disc, height: disc, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: live ? VERMC : '#faf9f6',
        border: `1.5px solid ${live ? VERMC : INKC}`,
        color: live ? '#faf9f6' : INKC,
        boxShadow: live ? '0 4px 14px rgba(220,53,34,0.3)' : `0 2px 0 ${INKC}`,
        fontFamily: ch.sigil.length > 1 ? "'IBM Plex Mono', monospace" : 'Georgia, serif',
        fontSize: ch.sigil.length > 1 ? disc * 0.34 : disc * 0.46,
        fontWeight: 600, transition: 'all 220ms cubic-bezier(0.34,1.1,0.64,1)',
        userSelect: 'none',
      }}>{ch.sigil}</div>
      {/* label */}
      <div style={{
        position: 'absolute', left: lx, top: ly,
        transform: 'translate(-50%, -50%)',
        width: labelW, textAlign: 'center', lineHeight: 1.25,
      }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: live ? VERMC : INKC, transition: 'color 200ms ease' }}>{ch.label}</div>
        <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic', fontSize: 14, color: '#555', marginTop: 1, whiteSpace: 'nowrap' }}>{ch.handle}</div>
      </div>
    </Tag>
  );
}

// ── Desktop summoning apparatus ───────────────────────────────────
function SummoningCircle() {
  const [hovered, setHovered] = useState<string | null>(null);
  const hoveredRef = useRef<string | null>(null);
  useEffect(() => { hoveredRef.current = hovered; }, [hovered]);

  const charging = !!CHANNELS.find((x) => x.id === hovered && x.href);

  const size = 680;
  const circleSize = 372;
  const dims = { nodeR: 238, disc: 52, labelGap: 16 };
  const c = size / 2;
  const N = 5;

  const wrapRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const animsRef = useRef<Animation[] | null>(null);
  const rateRef = useRef(1);

  let hp: [number, number] | null = null;
  if (charging) {
    const ch = CHANNELS.find((x) => x.id === hovered)!;
    const r = (ch.angle * Math.PI) / 180;
    hp = [c + Math.cos(r) * dims.nodeR, c + Math.sin(r) * dims.nodeR];
  }

  useEffect(() => {
    let raf: number;
    const tick = () => {
      try {
        const hv = hoveredRef.current;
        const ch = CHANNELS.find((x) => x.id === hv && x.href);
        const targetRate = ch ? 4.2 : 1;
        rateRef.current += (targetRate - rateRef.current) * 0.08;

        if ((!animsRef.current || !animsRef.current.length) && wrapRef.current) {
          const list = wrapRef.current.getAnimations({ subtree: true });
          if (list && list.length) animsRef.current = list;
        }
        if (animsRef.current) {
          for (const a of animsRef.current) { try { a.playbackRate = rateRef.current; } catch (_) {} }
        }

        if (ch && wrapRef.current) {
          const crect = wrapRef.current.parentElement!.getBoundingClientRect();
          const r = (ch.angle * Math.PI) / 180;
          const tx = c + Math.cos(r) * dims.nodeR, ty = c + Math.sin(r) * dims.nodeR;
          const nodes = wrapRef.current.querySelectorAll<SVGCircleElement>('.mc-summon-node');
          for (let i = 0; i < N; i++) {
            const ln = lineRefs.current[i];
            const nd = nodes[i];
            if (ln && nd) {
              const nr = nd.getBoundingClientRect();
              const nx = nr.left + nr.width / 2 - crect.left;
              const ny = nr.top + nr.height / 2 - crect.top;
              ln.setAttribute('x1', nx.toFixed(2)); ln.setAttribute('y1', ny.toFixed(2));
              ln.setAttribute('x2', tx.toFixed(2)); ln.setAttribute('y2', ty.toFixed(2));
            }
          }
        }
      } catch (_) {}
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [c]);

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      {/* charge lines */}
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible', zIndex: 0 }} aria-hidden="true">
        {charging && Array.from({ length: N }, (_, i) => (
          <line key={i} ref={(el) => { lineRefs.current[i] = el; }}
            x1={c} y1={c} x2={hp ? hp[0] : c} y2={hp ? hp[1] : c}
            stroke={VERMC} strokeWidth="1.5" className="cm-flow"
            style={{ animationDelay: `${i * 70}ms` }}
          />
        ))}
        {hp && <circle cx={hp[0]} cy={hp[1]} r={dims.disc / 2 + 4} fill="none" stroke={VERMC} strokeWidth="1.3" className="cm-pulsering" />}
      </svg>

      {/* the circle */}
      <div ref={wrapRef} style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 1 }}>
        <MagicCircle variant="summoning" size={circleSize}
          rotateSpeed={150} innerRotateSpeed={80}
          reverseInner runes runeText={CONTACT_RUNES} showCardinals
          style={{ color: INKC }} />
      </div>

      {/* core monogram */}
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none', zIndex: 3 }}>
        <div style={{
          width: 102, height: 102, borderRadius: '50%', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#faf9f6',
          border: `1.5px solid ${charging ? VERMC : INKC}`,
          boxShadow: charging ? `0 0 0 4px rgba(220,53,34,0.10), 0 2px 0 ${INKC}` : `0 2px 0 ${INKC}`,
          transition: 'border-color 220ms ease, box-shadow 260ms ease',
        }}>
          <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 27, color: INKC, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>CJ-Uy</span>
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8.5, fontWeight: 700, letterSpacing: '0.3em', color: charging ? VERMC : '#888', marginTop: 11, textTransform: 'uppercase', transition: 'color 200ms ease' }}>
          {charging ? 'channelling' : 'summon'}
        </div>
      </div>

      {/* nodes */}
      {CHANNELS.map((ch) => <SigilNode key={ch.id} ch={ch} hovered={hovered} onHover={setHovered} dims={dims} />)}
    </div>
  );
}

// ── Mobile stacked list ───────────────────────────────────────────
function SummoningList() {
  return (
    <div style={{ maxWidth: 420, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 34 }}>
        <MagicCircle variant="summoning" size={180} rotateSpeed={150} innerRotateSpeed={80} reverseInner runeText={CONTACT_RUNES} showCardinals style={{ color: INKC }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {CHANNELS.map((ch) => {
          const Tag = ch.href ? 'a' : 'div';
          const props = ch.href ? { href: ch.href, target: (ch.href.startsWith('http') ? '_blank' : undefined) as string | undefined, rel: 'noopener noreferrer' } : {};
          return (
            <Tag key={ch.id} {...props} className="cm-row" style={{ textDecoration: 'none', color: INKC }}>
              <span className="cm-row-disc" style={{ fontFamily: ch.sigil.length > 1 ? "'IBM Plex Mono', monospace" : 'Georgia, serif', fontSize: ch.sigil.length > 1 ? 15 : 20 }}>{ch.sigil}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{ch.label}</span>
                <span style={{ display: 'block', fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic', fontSize: 15, color: '#555' }}>{ch.handle}</span>
              </span>
              {ch.href && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, opacity: 0.5 }}>↗</span>}
            </Tag>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────
export default function ContactPage() {
  const [narrow, setNarrow] = useState(
    typeof window !== 'undefined' && window.innerWidth < 820,
  );
  useEffect(() => {
    const on = () => setNarrow(window.innerWidth < 820);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  return (
    <>
      <nav className="wp-nav">
        <a href="/" className="wp-brand">atelier</a>
        <div className="wp-links">
          <a href="/" className="wp-link">Home</a>
          <a href="/works" className="wp-link">Works</a>
          <a href="/contact" className="wp-link active">Contact</a>
        </div>
      </nav>

      <header className="ph-header">
        <div className="ph-circlemark">
          <MagicCircle variant="summoning" size={104} rotateSpeed={140} innerRotateSpeed={70} reverseInner runeText={CONTACT_RUNES} style={{ color: INKC }} />
        </div>
        <div className="ph-eyebrow">✦ THE SUMMONING · RITE NO. VIII ✦</div>
        <h1 className="ph-title">Contact Me</h1>
        <p className="ph-sub">Every circle on this site was cast for something. This one summons me — trace a sigil to open the channel.</p>
        <div className="cm-status">
          <span className="cm-dot" />
          OPEN TO OPPORTUNITIES &amp; COLLABORATIONS
        </div>
      </header>

      <main className="cm-stage">
        {narrow ? <SummoningList /> : <SummoningCircle />}
      </main>

      <footer className="cm-foot">
        <span /><span>RESPONDS WITHIN A MOON&apos;S TURN · TYPICALLY ~48H</span><span />
      </footer>
    </>
  );
}
