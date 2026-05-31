/**
 * WorksPage — "The Grimoire". Filterable project index.
 * Ink-on-paper, crosshair corners, magic circle per card.
 * Framework: React (complex state: filters, per-card reveal, modal).
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import MagicCircle from '../shared/MagicCircle';

const INK = '#0a0a0a';
const PAPER = '#faf9f6';
const VERMILION = '#dc3522';

// ── Categories ────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',      label: 'All Works',       glyph: '✦' },
  { id: 'web',      label: 'Web & Interface', glyph: '{ }' },
  { id: 'research', label: 'Research',        glyph: '†' },
  { id: 'audio',    label: 'Sound',           glyph: '♪' },
  { id: 'tools',    label: 'Tools',           glyph: '⌘' },
  { id: 'systems',  label: 'Systems',         glyph: '⚙' },
];

// ── Projects ──────────────────────────────────────────────────────
const PROJECTS = [
  {
    n: 'I', slug: 'atelier', circle: 'summoning' as const,
    title: 'Atelier', year: '2026', cat: 'web', featured: true,
    blurb: 'The site you\'re on. A canvas grid of ~2,300 points morphs into magic circles — and a portrait — as you scroll.',
    tags: ['Astro', 'Canvas', 'React'], spell: 'self-summoning', accent: true,
    role: 'Design & build', period: 'Jan–Mar 2026', status: 'live' as const,
    links: [{ label: 'Live', href: '/' }, { label: 'Repo', href: 'https://github.com/CJ-Uy' }],
    casting: [
      'A portfolio cast rather than coded — where the same grid of points becomes my face, a spider web, an astrolabe, a blueprint.',
      'The hardest part was registration — getting SVG annotations to land pixel-perfect on a canvas that scales with the viewport.',
    ],
  },
  {
    n: 'II', slug: 'ad-multo', circle: 'hexagram' as const,
    title: 'Ad Multo', year: '2026', cat: 'research', featured: false,
    blurb: 'A scroll-driven reader for academic papers, conjured in 48 hours. Citations bloom in the margin.',
    tags: ['Next.js', 'Reader', 'API'], spell: 'haste', accent: false,
    role: 'Frontend & UX', period: 'Hackathon · 48h', status: 'archived' as const,
    links: [{ label: 'Devpost', href: '#' }, { label: 'Repo', href: '#' }],
    casting: [
      'Built at a 48-hour hackathon. The premise: reading papers shouldn\'t mean ten open tabs.',
      'We didn\'t win, but two professors asked to use it — which felt better than a trophy.',
    ],
  },
  {
    n: 'III', slug: 'blank-board', circle: 'wheel' as const,
    title: 'Blank Board', year: '2025', cat: 'web', featured: false,
    blurb: 'Collaborative whiteboard with a tiny drops API. Stickies land on every client in under 40ms.',
    tags: ['SvelteKit', 'CRDT', 'WS'], spell: 'telepathy', accent: false,
    role: 'Full-stack', period: 'Side project', status: 'live' as const,
    links: [{ label: 'Live', href: '#' }, { label: 'Repo', href: '#' }],
    casting: [
      'A whiteboard where presence feels instant. I wrote a minimal CRDT so two cursors never fight over the same sticky.',
      'It started as an excuse to understand conflict-free replicated data types.',
    ],
  },
  {
    n: 'IV', slug: 'marginalia', circle: 'eye' as const,
    title: 'Marginalia', year: '2025', cat: 'research', featured: false,
    blurb: 'A lay-physicist\'s commonplace book — wormhole metrics, embedding diagrams, light around mass.',
    tags: ['Physics', 'LaTeX', 'Writing'], spell: 'scrying', accent: false,
    role: 'Author', period: 'Ongoing', status: 'in-progress' as const,
    links: [{ label: 'Read', href: '#' }],
    casting: [
      'Not software — a notebook. I keep working through general relativity the slow way, by re-deriving things and drawing them.',
    ],
  },
  {
    n: 'V', slug: 'loopline', circle: 'pentagram' as const,
    title: 'Loopline', year: '2025', cat: 'audio', featured: false,
    blurb: 'A browser looper for bass guitar. Four strings, infinite layers, one big record button.',
    tags: ['Web Audio', 'Canvas'], spell: 'echo', accent: false,
    role: 'Design & build', period: 'Weekend build', status: 'live' as const,
    links: [{ label: 'Live', href: '#' }, { label: 'Repo', href: '#' }],
    casting: [
      'I play bass, and I wanted to stack loops without booting a DAW.',
      'Latency was the whole battle — I ended up pre-scheduling everything against the audio clock.',
    ],
  },
  {
    n: 'VI', slug: 'cli-grimoire', circle: 'binding' as const,
    title: 'CLI Grimoire', year: '2024', cat: 'tools', featured: false,
    blurb: 'Small Rust utilities that earned their keep — a fuzzy mover, a md linter, a dotfile diff.',
    tags: ['Rust', 'CLI'], spell: 'binding', accent: false,
    role: 'Author', period: '2024–', status: 'live' as const,
    links: [{ label: 'crates.io', href: '#' }, { label: 'Repo', href: '#' }],
    casting: [
      'A growing collection of tiny Rust tools I reach for daily.',
      'Writing CLIs in Rust is how I learned the language.',
    ],
  },
];

type Project = typeof PROJECTS[number];
type Status = 'live' | 'archived' | 'in-progress';

const STATUS_LABEL: Record<Status, string> = {
  live: 'Live',
  archived: 'Archived',
  'in-progress': 'In Progress',
};

// ── Reveal on scroll ──────────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) setSeen(true); }),
      { threshold },
    );
    io.observe(el);
    const fb = setTimeout(() => setSeen(true), 1800);
    return () => { io.disconnect(); clearTimeout(fb); };
  }, []);
  return [ref, seen] as const;
}

// ── Crosshair corner marks ────────────────────────────────────────
const CORNERS = [
  { top: 7, left: 7 }, { top: 7, right: 7 },
  { bottom: 7, left: 7 }, { bottom: 7, right: 7 },
] as React.CSSProperties[];

function CrosshairCorners() {
  return (
    <>
      {CORNERS.map((pos, i) => (
        <span key={i} style={{
          position: 'absolute', ...pos, zIndex: 2,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9, opacity: 0.36, fontWeight: 700,
          color: INK,
        }}>+</span>
      ))}
    </>
  );
}

// ── Project card ──────────────────────────────────────────────────
function WPCard({ p, index, onOpen }: { p: Project; index: number; onOpen: (p: Project) => void }) {
  const [ref, seen] = useReveal();
  const [hover, setHover] = useState(false);
  const featured = p.featured;

  return (
    <article
      ref={ref as React.RefObject<HTMLElement>}
      onClick={() => onOpen(p)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        gridColumn: featured ? 'span 2' : 'span 1',
        position: 'relative', background: PAPER, cursor: 'pointer',
        border: `1.6px solid ${INK}`,
        boxShadow: hover
          ? `0 3px 0 ${INK}, 0 18px 38px rgba(10,10,10,0.13)`
          : `0 2px 0 ${INK}`,
        padding: featured ? '34px 38px' : '28px',
        display: 'flex', flexDirection: featured ? 'row' : 'column',
        alignItems: featured ? 'center' : 'stretch',
        gap: featured ? 34 : 18,
        minHeight: featured ? 300 : 360,
        opacity: seen ? 1 : 0,
        transform: seen
          ? (hover ? 'translateY(-5px)' : 'translateY(0)')
          : 'translateY(22px)',
        transition: `opacity 560ms cubic-bezier(0.4,0,0.2,1) ${index * 55}ms, transform 420ms cubic-bezier(0.34,1.1,0.64,1)`,
        overflow: 'hidden',
      }}
    >
      {/* Halftone wash */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.09,
        backgroundImage: 'radial-gradient(circle, #0a0a0a 1.1px, transparent 1.4px)',
        backgroundSize: '5px 5px',
        maskImage: 'linear-gradient(210deg, black 0%, transparent 72%)',
        WebkitMaskImage: 'linear-gradient(210deg, black 0%, transparent 72%)',
        pointerEvents: 'none',
      }} />

      <CrosshairCorners />

      {/* Circle */}
      <div style={{
        flexShrink: 0,
        alignSelf: featured ? 'center' : 'flex-start',
        transform: hover ? 'scale(1.04)' : 'scale(1)',
        transition: 'transform 480ms cubic-bezier(0.34,1.1,0.64,1)',
        position: 'relative', zIndex: 1,
      }}>
        <MagicCircle
          variant={p.circle}
          size={featured ? 184 : 120}
          rotateSpeed={hover ? 16 : 92}
          innerRotateSpeed={hover ? 8 : 52}
          reverseInner runes showCardinals
          style={{ color: INK }}
        />
      </div>

      {/* Text */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5,
            letterSpacing: '0.26em', fontWeight: 700, opacity: 0.55, textTransform: 'uppercase' as const,
          }}>
            OPUS · {p.n} / {p.year}
          </span>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 8,
            letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase' as const,
            padding: '3px 8px', borderRadius: 2,
            border: `0.8px solid ${p.accent ? VERMILION : INK}`,
            color: p.accent ? VERMILION : INK,
            whiteSpace: 'nowrap' as const,
          }}>{p.spell}</span>
        </div>

        <h3 style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: featured ? 'clamp(1.6rem, 3vw, 2.4rem)' : 'clamp(1.2rem, 2vw, 1.7rem)',
          fontWeight: 400, color: INK, letterSpacing: '-0.025em', lineHeight: 1.1,
          margin: '2px 0',
        }}>{p.title}</h3>

        <p style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.75rem', color: '#454543',
          lineHeight: 1.55, opacity: 0.88,
          maxWidth: featured ? '48ch' : '34ch',
        }}>{p.blurb}</p>

        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5, marginTop: 'auto' }}>
          {p.tags.map((tag) => (
            <span key={tag} style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 8,
              padding: '2px 6px', border: `0.7px solid rgba(10,10,10,0.35)`,
              letterSpacing: '0.1em', textTransform: 'uppercase' as const,
            }}>{tag}</span>
          ))}
          <span style={{
            marginLeft: 'auto',
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 8,
            color: p.status === 'live' ? VERMILION : '#888',
            letterSpacing: '0.12em', textTransform: 'uppercase' as const,
            alignSelf: 'center',
          }}>{STATUS_LABEL[p.status]}</span>
        </div>
      </div>
    </article>
  );
}

// ── Project modal ──────────────────────────────────────────────────
function WPModal({ p, onClose }: { p: Project; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(250,249,246,0.92)',
        backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
        animation: 'fadeIn 180ms ease forwards',
      }}
    >
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: PAPER, border: `1.6px solid ${INK}`,
          boxShadow: `0 4px 0 ${INK}, 0 24px 60px rgba(10,10,10,0.15)`,
          maxWidth: 680, width: '100%',
          maxHeight: '90vh', overflowY: 'auto',
          padding: '44px 48px', position: 'relative',
        }}
      >
        <CrosshairCorners />

        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 18, right: 18,
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11, letterSpacing: '0.14em', opacity: 0.5,
          color: INK,
        }}>ESC</button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 28, marginBottom: 32 }}>
          <MagicCircle variant={p.circle} size={96} rotateSpeed={60} innerRotateSpeed={30} reverseInner runes={false} style={{ color: INK, flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.3em', opacity: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>
              OPUS · {p.n} / {p.year}
            </div>
            <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 400, letterSpacing: '-0.03em', color: INK }}>
              {p.title}
            </h2>
            <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, opacity: 0.6 }}>{p.role}</span>
              <span style={{ opacity: 0.3 }}>·</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, opacity: 0.6 }}>{p.period}</span>
            </div>
          </div>
        </div>

        {/* Casting notes */}
        {p.casting.map((note, i) => (
          <p key={i} style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.78rem', lineHeight: 1.65, color: '#3a3a38',
            marginBottom: 14,
          }}>{note}</p>
        ))}

        {/* Links */}
        {p.links.length > 0 && (
          <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
            {p.links.map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
                padding: '6px 16px', border: `1px solid ${INK}`,
                color: INK, textDecoration: 'none',
                transition: 'background 120ms, color 120ms',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = INK; e.currentTarget.style.color = PAPER; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = INK; }}
              >{link.label} ↗</a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Category chip ──────────────────────────────────────────────────
function CategoryChip({ cat, active, onClick }: { cat: typeof CATEGORIES[number]; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10, letterSpacing: '0.16em', fontWeight: active ? 700 : 400,
      textTransform: 'uppercase',
      padding: '6px 14px',
      border: `1px solid ${active ? INK : 'rgba(10,10,10,0.25)'}`,
      background: active ? INK : 'transparent',
      color: active ? PAPER : INK,
      cursor: 'pointer',
      transition: 'all 160ms ease',
      borderRadius: 2,
    }}>
      <span style={{ opacity: 0.6 }}>{cat.glyph}</span>
      {cat.label}
    </button>
  );
}

// ── Works page root ───────────────────────────────────────────────
export default function WorksPage() {
  const [activeCat, setActiveCat] = useState('all');
  const [modal, setModal] = useState<Project | null>(null);

  const filtered = useMemo(
    () => activeCat === 'all' ? PROJECTS : PROJECTS.filter((p) => p.cat === activeCat),
    [activeCat],
  );

  return (
    <div style={{ background: PAPER, minHeight: '100vh', color: INK }}>
      {/* Header */}
      <header style={{ textAlign: 'center', padding: '7rem 2rem 3rem', position: 'relative' }}>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9.5, letterSpacing: '0.32em', fontWeight: 700,
          textTransform: 'uppercase', opacity: 0.5, marginBottom: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <span style={{ width: 20, height: 1, background: INK, opacity: 0.6, display: 'inline-block' }} />
          ✦ OPUS · WORKS
          <span style={{ width: 20, height: 1, background: INK, opacity: 0.6, display: 'inline-block' }} />
        </div>
        <h1 style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: 'clamp(2.4rem, 6vw, 4rem)',
          fontWeight: 400, letterSpacing: '-0.04em', color: INK,
        }}>The Grimoire</h1>
        <p style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.72rem', color: '#6a6a68',
          marginTop: 14, maxWidth: '38ch', marginInline: 'auto', lineHeight: 1.6,
        }}>
          A record of conjured interfaces, research incantations, and tools cast in code.
        </p>
      </header>

      {/* Category filter */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
        padding: '0 2rem 2.5rem',
      }}>
        {CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat.id} cat={cat}
            active={cat.id === activeCat}
            onClick={() => setActiveCat(cat.id)}
          />
        ))}
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
        maxWidth: 960, marginInline: 'auto',
        padding: '0 1.5rem 6rem',
      }}>
        {filtered.map((p, i) => (
          <WPCard key={p.slug} p={p} index={i} onOpen={setModal} />
        ))}
      </div>

      {modal && <WPModal p={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
