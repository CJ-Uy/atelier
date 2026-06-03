/**
 * WorksPage — faithful port of works-page.jsx + works-modal.jsx from the design bundle.
 * CSS classes (.wp-*, .ph-*, .pm-*) are defined in works.astro <style is:global>.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import MagicCircle from '../shared/MagicCircle';

const INK = '#0a0a0a';
const PAPER = '#faf9f6';
const VERMILION = '#dc3522';

// ── Categories ────────────────────────────────────────────────────
const WP_CATEGORIES = [
  { id: 'all',      label: 'All Works',       glyph: '✦' },
  { id: 'web',      label: 'Web & Interface', glyph: '{ }' },
  { id: 'research', label: 'Research',        glyph: '†' },
  { id: 'audio',    label: 'Sound',           glyph: '♪' },
  { id: 'tools',    label: 'Tools',           glyph: '⌘' },
  { id: 'systems',  label: 'Systems',         glyph: '⚙' },
];

// ── Projects ──────────────────────────────────────────────────────
const WP_PROJECTS = [
  { n: 'I', slug: 'atelier', circle: 'summoning' as const, title: 'Atelier', year: '2026', cat: 'web', featured: true,
    blurb: "The site you're on. A canvas grid of ~2,300 points morphs into magic circles — and a portrait — as you scroll.",
    tags: ['Astro', 'Canvas', 'React'], spell: 'self-summoning', accent: true,
    role: 'Design & build', period: 'Jan–Mar 2026', status: 'live' as const,
    links: [{ label: 'Live', href: '/' }, { label: 'Repo', href: 'https://github.com/CJ-Uy' }],
    casting: [
      "I wanted a portfolio that felt cast rather than coded — where the same grid of points could become my face, a spider web, an astrolabe, a blueprint. The whole site runs on one idea: a field of ~2,300 vertices that I morph between target shapes on scroll, with an annotation layer that inks labels exactly onto the geometry.",
      "The hardest part was registration — getting the SVG annotations to land pixel-perfect on a canvas grid that scales with the viewport. The trick was measuring the canvas's real rendered width rather than the window's.",
    ],
    plates: 3, video: true,
    coven: [{ name: 'Charles J. Uy', role: 'Everything' }] },

  { n: 'II', slug: 'ad-multo', circle: 'lattice' as const, title: 'Ad Multo', year: '2026', cat: 'research',
    blurb: 'A scroll-driven reader for academic papers, conjured in 48 hours. Citations bloom in the margin.',
    tags: ['Next.js', 'Reader', 'API'], spell: 'haste', accent: false,
    role: 'Frontend & UX', period: 'Hackathon · 48h', status: 'archived' as const,
    links: [{ label: 'Devpost', href: '#' }, { label: 'Repo', href: '#' }],
    casting: [
      "Built at a 48-hour hackathon. The premise: reading papers shouldn't mean ten open tabs. Citations expand inline as marginalia, and a focus mode dims everything but the current claim.",
      "We didn't win, but two professors asked to use it — which felt better than a trophy.",
    ],
    plates: 2, video: false,
    coven: [{ name: 'A. Reyes', role: 'Backend' }, { name: 'M. Santos', role: 'ML / parsing' }, { name: 'Charles J. Uy', role: 'Frontend' }] },

  { n: 'III', slug: 'blank-board', circle: 'wheel' as const, title: 'Blank Board', year: '2025', cat: 'web',
    blurb: 'Collaborative whiteboard with a tiny drops API. Stickies land on every client in under 40ms.',
    tags: ['SvelteKit', 'CRDT', 'WS'], spell: 'telepathy', accent: false,
    role: 'Full-stack', period: 'Side project', status: 'live' as const,
    links: [{ label: 'Live', href: '#' }, { label: 'Repo', href: '#' }],
    casting: [
      "A whiteboard where presence feels instant. I wrote a minimal CRDT so two cursors never fight over the same sticky, and a websocket layer that keeps round-trips under 40ms on a cheap VPS.",
      "It started as an excuse to understand conflict-free replicated data types. It ended as the tool my study group actually uses.",
    ],
    plates: 3, video: true,
    coven: [{ name: 'Charles J. Uy', role: 'Everything' }] },

  { n: 'IV', slug: 'marginalia', circle: 'lens' as const, title: 'Marginalia', year: '2025', cat: 'research',
    blurb: "A lay-physicist's commonplace book — wormhole metrics, embedding diagrams, light around mass.",
    tags: ['Physics', 'LaTeX', 'Writing'], spell: 'scrying', accent: false,
    role: 'Author', period: 'Ongoing', status: 'in-progress' as const,
    links: [{ label: 'Read', href: '#' }],
    casting: [
      "Not software — a notebook. I keep working through general relativity the slow way, by re-deriving things and drawing them until they make sense. Embedding diagrams, the Schwarzschild metric, why light bends.",
      "I publish the cleaned-up pages here. It's the most personal thing I make.",
    ],
    plates: 2, video: false,
    coven: [] },

  { n: 'V', slug: 'loopline', circle: 'bloom' as const, title: 'Loopline', year: '2025', cat: 'audio',
    blurb: 'A browser looper for bass guitar. Four strings, infinite layers, one big record button.',
    tags: ['Web Audio', 'Canvas'], spell: 'echo', accent: false,
    role: 'Design & build', period: 'Weekend build', status: 'live' as const,
    links: [{ label: 'Live', href: '#' }, { label: 'Repo', href: '#' }],
    casting: [
      "I play bass, and I wanted to stack loops without booting a DAW. Loopline is one giant record button and a waveform that grows as you layer. Web Audio for the engine, canvas for the visual.",
      "Latency was the whole battle — I ended up pre-scheduling everything against the audio clock instead of trusting setTimeout.",
    ],
    plates: 2, video: true,
    coven: [{ name: 'Charles J. Uy', role: 'Everything' }] },

  { n: 'VI', slug: 'cli-grimoire', circle: 'binding' as const, title: 'CLI Grimoire', year: '2024', cat: 'tools',
    blurb: 'Small Rust utilities that earned their keep — a fuzzy mover, a md linter, a dotfile diff.',
    tags: ['Rust', 'CLI'], spell: 'binding', accent: false,
    role: 'Author', period: '2024–', status: 'live' as const,
    links: [{ label: 'crates.io', href: '#' }, { label: 'Repo', href: '#' }],
    casting: [
      "A growing collection of tiny Rust tools I reach for daily. Nothing flashy — a fuzzy file mover, a markdown linter tuned to my taste, a dotfile diff that respects symlinks.",
      "Writing CLIs in Rust is how I learned the language. Each one is small enough to finish in an evening, which is exactly why the collection keeps growing.",
    ],
    plates: 1, video: false,
    coven: [{ name: 'Charles J. Uy', role: 'Everything' }] },
];

type Project = typeof WP_PROJECTS[number];

const WP_STATUS: Record<string, { label: string; accent: boolean }> = {
  'live':        { label: 'Live',        accent: true  },
  'archived':    { label: 'Archived',    accent: false },
  'in-progress': { label: 'In Progress', accent: false },
};

function catLabel(id: string) {
  const c = WP_CATEGORIES.find((c) => c.id === id);
  return c ? c.label : id;
}

// ── Reveal on scroll ──────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) setSeen(true); }),
      { threshold: 0.12 },
    );
    io.observe(el);
    const fb = setTimeout(() => setSeen(true), 1800);
    return () => { io.disconnect(); clearTimeout(fb); };
  }, []);
  return [ref, seen] as const;
}

// ── Status pill ───────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const s = WP_STATUS[status] || { label: status, accent: false };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: "'IBM Plex Mono', monospace", fontSize: 8.5, fontWeight: 700,
      letterSpacing: '0.18em', textTransform: 'uppercase', padding: '3px 9px',
      border: `0.8px solid ${s.accent ? VERMILION : INK}`, color: s.accent ? VERMILION : INK,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.accent ? VERMILION : INK,
        boxShadow: s.accent ? `0 0 0 2px rgba(220,53,34,0.2)` : 'none' }} />
      {s.label}
    </span>
  );
}

// ── Section rule ✦ ─── LABEL ── ──────────────────────────────────
function SectionRule({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '6px 0 2px' }}>
      <span style={{ color: VERMILION, fontSize: 11 }}>✦</span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: INK }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: 'rgba(10,10,10,0.18)' }} />
    </div>
  );
}

// ── Project modal — "The Plate" ───────────────────────────────────
function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const p = project;
  const plateCount = p.plates || 0;
  const crossPos = [{ top: 10, left: 10 }, { top: 10, right: 10 }, { bottom: 10, left: 10 }, { bottom: 10, right: 10 }];

  return (
    <div className="pm-backdrop" onClick={onClose}>
      <div className="pm-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={p.title}>
        {crossPos.map((pos, i) => <span key={i} className="pm-cross" style={pos}>+</span>)}

        <button className="pm-close" onClick={onClose} aria-label="Close">
          <span>ESC</span>
          <svg width="13" height="13" viewBox="0 0 14 14">
            <path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
          </svg>
        </button>

        <div className="pm-scroll">
          <header className="pm-head">
            <div className="pm-circle">
              <MagicCircle variant={p.circle} size={150} rotateSpeed={60} innerRotateSpeed={34} reverseInner runes showCardinals style={{ color: INK }} />
            </div>
            <div className="pm-head-text">
              <div className="pm-meta-row">
                <span className="pm-opus">OPUS · {p.n} / {p.year}</span>
                <span className="pm-spell" style={{ borderColor: p.accent ? VERMILION : INK, color: p.accent ? VERMILION : INK }}>{p.spell}</span>
                <StatusPill status={p.status} />
              </div>
              <h2 className="pm-title">{p.title}</h2>
              <p className="pm-rolerow">{p.role} · {p.period} · {catLabel(p.cat)}</p>
              {p.links.length > 0 && (
                <div className="pm-links">
                  {p.links.map((l) => (
                    <a key={l.label} href={l.href}
                      target={l.href.startsWith('http') ? '_blank' : undefined}
                      rel="noopener noreferrer" className="pm-link">{l.label} ↗</a>
                  ))}
                </div>
              )}
            </div>
          </header>

          <p className="pm-brief">{p.blurb}</p>

          {p.casting.length > 0 && (
            <section className="pm-section">
              <SectionRule label="Field Notes" />
              <div className="pm-prose">
                {p.casting.map((para, i) => (
                  <p key={i} className={i === 0 ? 'pm-dropcap' : ''}>{para}</p>
                ))}
              </div>
            </section>
          )}

          {(plateCount > 0 || p.video) && (
            <section className="pm-section">
              <SectionRule label="Plates" />
              <div className="pm-plates">
                {p.video && <div className="pm-plate pm-plate-wide" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, opacity: 0.35 }}>video still</span></div>}
                {Array.from({ length: plateCount }, (_, i) => (
                  <div key={i} className="pm-plate" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, opacity: 0.35 }}>plate {i + 1}</span>
                  </div>
                ))}
              </div>
              <p className="pm-platehint">Plates — screenshots and stills to be added.</p>
            </section>
          )}

          {p.coven.length > 0 && (
            <section className="pm-section">
              <SectionRule label="The Coven" />
              <div className="pm-coven">
                {p.coven.map((m, i) => (
                  <div key={i} className="pm-covenrow">
                    <span className="pm-covensig">{m.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}</span>
                    <span className="pm-covenname">{m.name}</span>
                    <span className="pm-covenrole">{m.role}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="pm-section">
            <SectionRule label="Apparatus" />
            <div className="pm-tags">
              {p.tags.map((t) => <span key={t} className="pm-tag">{t}</span>)}
            </div>
          </section>

          <div className="pm-foot">
            <span /><span>INSCRIBED · {p.year} · ESC TO CLOSE THE PAGE</span><span />
          </div>
        </div>
      </div>
    </div>
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
        boxShadow: hover ? `0 3px 0 ${INK}, 0 18px 38px rgba(10,10,10,0.13)` : `0 2px 0 ${INK}`,
        padding: featured ? '34px 38px' : '28px 28px',
        display: 'flex', flexDirection: featured ? 'row' : 'column',
        alignItems: featured ? 'center' : 'stretch',
        gap: featured ? 34 : 18,
        minHeight: featured ? 300 : 360,
        opacity: seen ? 1 : 0,
        transform: seen ? (hover ? 'translateY(-5px)' : 'translateY(0)') : 'translateY(22px)',
        transition: `opacity 560ms cubic-bezier(0.4,0,0.2,1) ${index * 55}ms, transform 420ms cubic-bezier(0.34,1.1,0.64,1)`,
        overflow: 'hidden',
      }}
    >
      {/* halftone wash */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.09,
        backgroundImage: 'radial-gradient(circle, #0a0a0a 1.1px, transparent 1.4px)',
        backgroundSize: '5px 5px',
        maskImage: 'linear-gradient(210deg, black 0%, transparent 72%)',
        WebkitMaskImage: 'linear-gradient(210deg, black 0%, transparent 72%)',
        pointerEvents: 'none',
      }} />

      {/* crosshair corners */}
      {([{ top: 7, left: 7 }, { top: 7, right: 7 }, { bottom: 7, left: 7 }, { bottom: 7, right: 7 }] as React.CSSProperties[]).map((pos, i) => (
        <span key={i} style={{ position: 'absolute', ...pos, zIndex: 2, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, opacity: 0.36, fontWeight: 700 }}>+</span>
      ))}

      {/* circle */}
      <div style={{
        flexShrink: 0, alignSelf: featured ? 'center' : 'flex-start',
        transform: hover ? 'scale(1.04)' : 'scale(1)',
        transition: 'transform 480ms cubic-bezier(0.34,1.1,0.64,1)',
        position: 'relative', zIndex: 1,
      }}>
        <MagicCircle variant={p.circle} size={featured ? 184 : 120}
          rotateSpeed={hover ? 16 : 92} innerRotateSpeed={hover ? 8 : 52}
          reverseInner runes={hover} showCardinals
          style={{ color: INK }} />
      </div>

      {/* text */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: '0.26em', fontWeight: 700, opacity: 0.55, textTransform: 'uppercase' as const }}>
            OPUS · {p.n} / {p.year}
          </span>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: '0.2em', fontWeight: 700,
            textTransform: 'uppercase' as const, padding: '3px 8px', borderRadius: 2,
            border: `0.8px solid ${p.accent ? VERMILION : INK}`,
            color: p.accent ? VERMILION : INK, whiteSpace: 'nowrap' as const,
          }}>{p.spell}</span>
        </div>

        <h3 style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: featured ? 'clamp(2.2rem, 3.4vw, 2.9rem)' : 'clamp(1.7rem, 2.4vw, 2.1rem)',
          fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.02, margin: 0, color: INK,
        }}>{p.title}</h3>

        <p style={{
          fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic',
          fontSize: featured ? 'clamp(1rem, 1.4vw, 1.15rem)' : 'clamp(0.92rem, 1.2vw, 1.02rem)',
          color: '#454545', lineHeight: 1.44, margin: 0, maxWidth: '46ch',
          flex: featured ? '0 0 auto' : '1 0 auto',
        }}>{p.blurb}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const, marginTop: 'auto' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8.5, letterSpacing: '0.18em', fontWeight: 700, opacity: 0.5 }}>
            ※ {catLabel(p.cat).toUpperCase()}
          </span>
          <span style={{ width: 1, height: 12, background: 'rgba(10,10,10,0.25)' }} />
          {p.tags.map((t) => (
            <span key={t} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8.5, padding: '3px 8px', border: '1px solid rgba(10,10,10,0.3)', letterSpacing: '0.05em', whiteSpace: 'nowrap' as const }}>{t}</span>
          ))}
        </div>
      </div>

      {/* cast hint on hover */}
      <div style={{ position: 'absolute', bottom: 9, right: 13, zIndex: 3, fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: '0.18em', fontWeight: 700, opacity: hover ? 0.55 : 0, transition: 'opacity 280ms ease', textTransform: 'uppercase' as const }}>
        cast ↗
      </div>
    </article>
  );
}

// ── Filter chips ──────────────────────────────────────────────────
function WPFilter({ active, onChange, counts }: { active: string; onChange: (id: string) => void; counts: Record<string, number> }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, justifyContent: 'center' }}>
      {WP_CATEGORIES.map((c) => {
        const isActive = c.id === active;
        const count = c.id === 'all' ? counts.all : (counts[c.id] || 0);
        if (c.id !== 'all' && count === 0) return null;
        return (
          <button key={c.id} onClick={() => onChange(c.id)} style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600,
            letterSpacing: '0.12em', textTransform: 'uppercase' as const, cursor: 'pointer',
            padding: '9px 15px', display: 'inline-flex', alignItems: 'center', gap: 8,
            background: isActive ? INK : 'transparent',
            color: isActive ? PAPER : INK,
            border: `1.4px solid ${INK}`, transition: 'all 160ms ease',
          }}>
            <span style={{ opacity: 0.7, fontSize: 9 }}>{c.glyph}</span>
            {c.label}
            <span style={{ opacity: 0.5, fontSize: 8.5 }}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Works page root ───────────────────────────────────────────────
export default function WorksPage() {
  const [filter, setFilter] = useState('all');
  const [active, setActive] = useState<Project | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: WP_PROJECTS.length };
    WP_PROJECTS.forEach((p) => { c[p.cat] = (c[p.cat] || 0) + 1; });
    return c;
  }, []);

  const shown = useMemo(
    () => filter === 'all' ? WP_PROJECTS : WP_PROJECTS.filter((p) => p.cat === filter),
    [filter],
  );

  return (
    <>
      {/* Nav */}
      <nav className="wp-nav">
        <a href="/" className="wp-brand">atelier</a>
        <div className="wp-links">
          <a href="/" className="wp-link">Home</a>
          <a href="/works" className="wp-link active">Works</a>
          <a href="/contact" className="wp-link">Contact</a>
        </div>
      </nav>

      {/* Header */}
      <header className="ph-header">
        <div className="ph-circlemark">
          <MagicCircle variant="casting" size={104} rotateSpeed={140} style={{ color: INK }} />
        </div>
        <div className="ph-eyebrow">✦ THE GRIMOIRE · COLLECTED WORKS ✦</div>
        <h1 className="ph-title">Things I've conjured</h1>
        <p className="ph-sub">A working index of projects, experiments and small spells — research, interfaces, sound and tools. Filter by discipline; hover a card to spin up its circle.</p>
      </header>

      {/* Sticky filter bar */}
      <div className="wp-filterbar">
        <WPFilter active={filter} onChange={setFilter} counts={counts} />
      </div>

      {/* Grid */}
      <main className="wp-gridwrap">
        <div className="wp-grid" key={filter}>
          {shown.map((p, i) => <WPCard key={p.title} p={p} index={i} onOpen={setActive} />)}
        </div>
        <div className="wp-count">
          {shown.length} {shown.length === 1 ? 'work' : 'works'}{filter !== 'all' ? ` · ${catLabel(filter)}` : ''} · more inscribed soon
        </div>
      </main>

      {/* Footer */}
      <footer className="wp-footer">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 30 }}>
          <MagicCircle variant="binding" size={170} rotateSpeed={110} style={{ color: PAPER }} />
        </div>
        <p className="wp-foot-line">let's make something magic.</p>
        <a href="mailto:charlesjoshuauy@gmail.com" className="wp-foot-mail">charlesjoshuauy@gmail.com</a>
        <div className="wp-colophon">
          <span />&copy; MMXXVI · CHARLES<span />
        </div>
      </footer>

      {active && <ProjectModal project={active} onClose={() => setActive(null)} />}
    </>
  );
}
