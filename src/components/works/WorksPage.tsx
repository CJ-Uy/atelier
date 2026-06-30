/**
 * WorksPage — the grimoire grid. Data lives in works.data.ts; this file is render
 * logic only. Every work shows a layered MagicCircle whose marks are derived from
 * its category + layers (see resolveCircle). Weight drives panel size; a two-row
 * filter bar (category chips + attribute toggles) guides the reader.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import MagicCircle from '../shared/MagicCircle';
import { WORKS, CATEGORIES, CAT_BASE, sortWorks, resolveCircle, isAccent } from './works.data';

const INK = '#0a0a0a';
const PAPER = '#faf9f6';
const VERMILION = '#dc3522';

type Project = ReturnType<typeof sortWorks>[number]; // a Work + computed opus numeral `n`

const WP_STATUS: Record<string, { label: string; accent: boolean }> = {
  'live':        { label: 'Live',        accent: true  },
  'prototype':   { label: 'Prototype',   accent: false },
  'archived':    { label: 'Archived',    accent: false },
  'in-progress': { label: 'In Progress', accent: false },
};

// Secondary attribute filters — AND-combined with the active category chip.
const ATTR_FILTERS: { id: string; label: string; glyph: string; test: (p: Project) => boolean }[] = [
  { id: 'award', label: 'Awarded',   glyph: '★', test: (p) => p.layers.includes('award') },
  { id: 'live',  label: 'Live',      glyph: '●', test: (p) => p.state === 'live' },
  { id: 'early', label: 'Early Web', glyph: '◷', test: (p) => p.era === 'highschool' },
];

function catLabel(id: string) {
  const c = CATEGORIES.find((c) => c.id === id);
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
  const cc = resolveCircle(p);
  const accent = isAccent(p);
  const origin = p.layers.includes('origin') || p.era === 'highschool';
  const plateCount = p.plates || 0;
  const crossPos = [{ top: 10, left: 10 }, { top: 10, right: 10 }, { bottom: 10, left: 10 }, { bottom: 10, right: 10 }];

  const roleLine = [p.role, p.period, catLabel(p.cat)].filter(Boolean).join(' · ');

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
              <MagicCircle variant={cc.base} overlays={cc.overlays} intensity={cc.intensity}
                state={p.state} origin={origin}
                size={150} rotateSpeed={60} innerRotateSpeed={34} reverseInner runes showCardinals style={{ color: INK }} />
            </div>
            <div className="pm-head-text">
              <div className="pm-meta-row">
                <span className="pm-opus">WORK · {p.n} / {p.year}</span>
                <span className="pm-spell" style={{ borderColor: accent ? VERMILION : INK, color: accent ? VERMILION : INK }}>{p.spell}</span>
                <StatusPill status={p.state} />
              </div>
              <h2 className="pm-title">{p.title}</h2>
              <p className="pm-rolerow">{roleLine}</p>
              {p.org && <p className="pm-rolerow" style={{ color: VERMILION, marginTop: 4 }}>{p.org}</p>}
              {p.links && p.links.length > 0 && (
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

          {p.casting && p.casting.length > 0 && (
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

          {p.coven && p.coven.length > 0 && (
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

          {p.tags && p.tags.length > 0 && (
            <section className="pm-section">
              <SectionRule label="Apparatus" />
              <div className="pm-tags">
                {p.tags.map((t) => <span key={t} className="pm-tag">{t}</span>)}
              </div>
            </section>
          )}

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

  const big = p.weight === 'major';
  const compact = p.weight === 'archive';
  const cc = resolveCircle(p);
  const accent = isAccent(p);
  const origin = p.layers.includes('origin') || p.era === 'highschool';

  return (
    <article
      ref={ref as React.RefObject<HTMLElement>}
      onClick={() => onOpen(p)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        gridColumn: big ? 'span 2' : 'span 1',
        position: 'relative', background: PAPER, cursor: 'pointer',
        border: `1.6px solid ${INK}`,
        boxShadow: hover ? `0 3px 0 ${INK}, 0 18px 38px rgba(10,10,10,0.13)` : `0 2px 0 ${INK}`,
        padding: big ? '34px 38px' : compact ? '18px 20px' : '28px 28px',
        display: 'flex', flexDirection: big ? 'row' : 'column',
        alignItems: big ? 'center' : 'stretch',
        gap: big ? 34 : compact ? 12 : 18,
        minHeight: big ? 300 : compact ? 208 : 360,
        opacity: seen ? 1 : 0,
        transform: seen ? (hover ? 'translateY(-5px)' : 'translateY(0)') : 'translateY(22px)',
        transition: `opacity 560ms cubic-bezier(0.4,0,0.2,1) ${Math.min(index, 10) * 55}ms, transform 420ms cubic-bezier(0.34,1.1,0.64,1)`,
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
        flexShrink: 0, alignSelf: big ? 'center' : 'flex-start',
        transform: hover ? 'scale(1.04)' : 'scale(1)',
        transition: 'transform 480ms cubic-bezier(0.34,1.1,0.64,1)',
        position: 'relative', zIndex: 1,
      }}>
        <MagicCircle variant={cc.base} overlays={cc.overlays} intensity={cc.intensity}
          state={p.state} origin={origin}
          size={big ? 184 : compact ? 80 : 120}
          rotateSpeed={hover ? 16 : 92} innerRotateSpeed={hover ? 8 : 52}
          reverseInner runes={hover} showCardinals
          style={{ color: INK }} />
      </div>

      {/* text */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, gap: compact ? 7 : 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: '0.26em', fontWeight: 700, opacity: 0.55, textTransform: 'uppercase' as const }}>
            WORK · {p.n} / {p.year}
          </span>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: '0.2em', fontWeight: 700,
            textTransform: 'uppercase' as const, padding: '3px 8px', borderRadius: 2,
            border: `0.8px solid ${accent ? VERMILION : INK}`,
            color: accent ? VERMILION : INK, whiteSpace: 'nowrap' as const,
          }}>{p.spell}</span>
        </div>

        <h3 style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: big ? 'clamp(2.2rem, 3.4vw, 2.9rem)' : compact ? 'clamp(1.3rem, 1.9vw, 1.55rem)' : 'clamp(1.7rem, 2.4vw, 2.1rem)',
          fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.02, margin: 0, color: INK,
        }}>{p.title}</h3>

        <p style={{
          fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic',
          fontSize: big ? 'clamp(1rem, 1.4vw, 1.15rem)' : compact ? 'clamp(0.85rem, 1vw, 0.92rem)' : 'clamp(0.92rem, 1.2vw, 1.02rem)',
          color: '#454545', lineHeight: 1.44, margin: 0, maxWidth: '46ch',
          flex: big ? '0 0 auto' : '1 0 auto',
        }}>{p.blurb}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const, marginTop: 'auto' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8.5, letterSpacing: '0.18em', fontWeight: 700, opacity: 0.5 }}>
            ※ {catLabel(p.cat).toUpperCase()}
          </span>
          {(p.tags ?? []).length > 0 && <span style={{ width: 1, height: 12, background: 'rgba(10,10,10,0.25)' }} />}
          {(p.tags ?? []).map((t) => (
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

// ── Filter chips (category, single-select) ────────────────────────
function WPFilter({ active, onChange, counts }: { active: string; onChange: (id: string) => void; counts: Record<string, number> }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, justifyContent: 'center' }}>
      {CATEGORIES.map((c) => {
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

// ── Attribute toggles (multi-select, AND-combined with category) ───
function WPAttrFilter({ active, onToggle }: { active: Set<string>; onToggle: (id: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 7, justifyContent: 'center', marginTop: 10 }}>
      {ATTR_FILTERS.map((a) => {
        const on = active.has(a.id);
        const isAward = a.id === 'award';
        const tint = isAward ? VERMILION : INK;
        return (
          <button key={a.id} onClick={() => onToggle(a.id)} style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase' as const, cursor: 'pointer',
            padding: '6px 11px', display: 'inline-flex', alignItems: 'center', gap: 6,
            background: on ? tint : 'transparent', color: on ? PAPER : tint,
            border: `1px solid ${tint}`, opacity: on ? 1 : 0.7, transition: 'all 150ms ease',
          }}>
            <span style={{ fontSize: 9 }}>{a.glyph}</span>{a.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Legend / "How to read a circle" ───────────────────────────────
const CAT_MEANING: Record<string, string> = {
  ai: 'Agents, models, machine reasoning',
  systems: 'Admin, workflow, infrastructure, commerce',
  web: 'Sites, apps, interactive front-ends',
  research: 'Science, papers, measurement, inquiry',
  editorial: 'Publication, storytelling, archives',
  play: 'Games and creative graphics',
  practice: 'Roles, teaching, leadership, community',
  tools: 'Small utilities that earn their keep',
};

const OVERLAY_LEGEND: { o: 'seal' | 'orbit' | 'ticks' | 'circuit' | 'nodes'; label: string; meaning: string }[] = [
  { o: 'seal',    label: 'Award',                meaning: 'A win, placement or honour — the one vermilion mark.' },
  { o: 'nodes',   label: 'AI & agents',          meaning: 'Models and agents, a webbed decision path.' },
  { o: 'ticks',   label: 'Research & data',      meaning: 'Citations, measures, annotation brackets.' },
  { o: 'circuit', label: 'Systems & commerce',   meaning: 'Admin, workflow, payments, OCR, realtime.' },
  { o: 'orbit',   label: 'Community & team',     meaning: 'Built with or for people — collaborators, orgs, teaching.' },
];

const STATE_LEGEND: { state: 'live' | 'prototype' | 'archived'; label: string; meaning: string }[] = [
  { state: 'live',      label: 'Live',      meaning: 'Shipped and running — solid ink.' },
  { state: 'prototype', label: 'Prototype', meaning: 'Built but unfinished — a dashed construction ring.' },
  { state: 'archived',  label: 'Archived',  meaning: 'Past work — faded ink.' },
];

function LegendItem({ children, label, meaning }: { children: React.ReactNode; label: string; meaning: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
      <div style={{ height: 76, display: 'flex', alignItems: 'center' }}>{children}</div>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK }}>{label}</span>
      <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic', fontSize: '0.92rem', lineHeight: 1.32, color: '#555', maxWidth: '22ch' }}>{meaning}</span>
    </div>
  );
}

function LegendModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: '22px 14px', marginTop: 18 } as const;
  const mini = { color: INK } as React.CSSProperties;

  return (
    <div className="pm-backdrop" onClick={onClose}>
      <div className="pm-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="How to read a circle">
        {[{ top: 10, left: 10 }, { top: 10, right: 10 }, { bottom: 10, left: 10 }, { bottom: 10, right: 10 }].map((pos, i) => (
          <span key={i} className="pm-cross" style={pos}>+</span>
        ))}
        <button className="pm-close" onClick={onClose} aria-label="Close">
          <span>ESC</span>
          <svg width="13" height="13" viewBox="0 0 14 14"><path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" /></svg>
        </button>

        <div className="pm-scroll">
          <div className="pm-meta-row"><span className="pm-opus">THE KEY · HOW TO READ A CIRCLE</span></div>
          <h2 className="pm-title">Every work is a spell</h2>
          <p className="pm-brief" style={{ marginTop: 14 }}>
            Each circle is built in layers. The base shape is the discipline; marks added on top say what the work did; the line work says where it is in its life. Same base, different marks — so no two read alike.
          </p>

          <section className="pm-section">
            <SectionRule label="Base · the discipline" />
            <div style={grid}>
              {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                <LegendItem key={c.id} label={c.label} meaning={CAT_MEANING[c.id] || ''}>
                  <MagicCircle variant={CAT_BASE[c.id as keyof typeof CAT_BASE]} size={72} rotateSpeed={150} innerRotateSpeed={90} reverseInner runes={false} style={mini} />
                </LegendItem>
              ))}
            </div>
          </section>

          <section className="pm-section">
            <SectionRule label="Marks · what it did" />
            <div style={grid}>
              {OVERLAY_LEGEND.map((m) => (
                <LegendItem key={m.o} label={m.label} meaning={m.meaning}>
                  <MagicCircle variant="wheel" overlays={[m.o]} size={72} rotateSpeed={150} innerRotateSpeed={90} reverseInner runes={false} style={mini} />
                </LegendItem>
              ))}
            </div>
          </section>

          <section className="pm-section">
            <SectionRule label="Line · its life" />
            <div style={grid}>
              {STATE_LEGEND.map((s) => (
                <LegendItem key={s.state} label={s.label} meaning={s.meaning}>
                  <MagicCircle variant="wheel" state={s.state} size={72} rotateSpeed={150} innerRotateSpeed={90} reverseInner runes={false} style={mini} />
                </LegendItem>
              ))}
              <LegendItem label="Complexity" meaning="Denser, nested rings for deeper builds.">
                <MagicCircle variant="wheel" intensity={2} size={72} rotateSpeed={150} innerRotateSpeed={90} reverseInner runes={false} style={mini} />
              </LegendItem>
              <LegendItem label="Early work" meaning="A rougher, ghosted “first spell” ring.">
                <MagicCircle variant="wheel" origin size={72} rotateSpeed={150} innerRotateSpeed={90} reverseInner runes={false} style={mini} />
              </LegendItem>
            </div>
          </section>

          <div className="pm-foot"><span /><span>CLOSE · ESC</span><span /></div>
        </div>
      </div>
    </div>
  );
}

// ── Works page root ───────────────────────────────────────────────
export default function WorksPage() {
  const [filter, setFilter] = useState('all');
  const [attrs, setAttrs] = useState<Set<string>>(() => new Set());
  const [query, setQuery] = useState('');
  const [legendOpen, setLegendOpen] = useState(false);
  const [active, setActive] = useState<Project | null>(null);

  const sorted = useMemo(() => sortWorks(WORKS), []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: sorted.length };
    sorted.forEach((p) => { c[p.cat] = (c[p.cat] || 0) + 1; });
    return c;
  }, [sorted]);

  const shown = useMemo(() => {
    const activeAttrs = ATTR_FILTERS.filter((a) => attrs.has(a.id));
    const q = query.trim().toLowerCase();
    return sorted.filter((p) => {
      if (filter !== 'all' && p.cat !== filter) return false;
      if (!activeAttrs.every((a) => a.test(p))) return false;
      if (q) {
        const hay = [p.title, p.blurb, p.spell, p.org, catLabel(p.cat), ...(p.tags ?? []), ...p.layers].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [filter, attrs, query, sorted]);

  const toggleAttr = (id: string) =>
    setAttrs((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <>
      {/* Nav */}
      <nav className="wp-nav">
        <a href="/" className="wp-brand">atelier</a>
        <div className="wp-links">
          <a href="/" className="wp-link">Home</a>
          <a href="/works" className="wp-link active">Works</a>
          <a href="/notes" className="wp-link">Notes</a>
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
        <p className="ph-sub">A working index of everything I've made, won, led, taught or contributed to — projects, research, systems, games and small spells. Filter by discipline or mark; hover a card to spin up its circle.</p>
      </header>

      {/* Sticky filter bar */}
      <div className="wp-filterbar">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' as const, marginBottom: 14 }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 12, opacity: 0.45, pointerEvents: 'none' }}>⌕</span>
            <input
              value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="SEARCH THE GRIMOIRE" aria-label="Search works"
              style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' as const,
                padding: '9px 30px 9px 28px', width: 268, maxWidth: '72vw', background: 'transparent', color: INK,
                border: `1.4px solid ${INK}`, outline: 'none',
              }}
            />
            {query && (
              <button onClick={() => setQuery('')} aria-label="Clear search" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', background: 'none', border: 'none', color: INK, fontSize: 11, opacity: 0.5 }}>✕</button>
            )}
          </div>
          <button onClick={() => setLegendOpen(true)} style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const,
            cursor: 'pointer', padding: '9px 14px', display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'transparent', color: INK, border: `1.4px solid ${INK}`,
          }}>
            <span style={{ color: VERMILION }}>✦</span> How to read a circle
          </button>
        </div>
        <WPFilter active={filter} onChange={setFilter} counts={counts} />
        <WPAttrFilter active={attrs} onToggle={toggleAttr} />
      </div>

      {/* Grid */}
      <main className="wp-gridwrap">
        <div className="wp-grid" key={filter + '|' + [...attrs].sort().join(',')}>
          {shown.map((p, i) => <WPCard key={p.slug} p={p} index={i} onOpen={setActive} />)}
        </div>
        <div className="wp-count">
          {shown.length} {shown.length === 1 ? 'work' : 'works'}{filter !== 'all' ? ` · ${catLabel(filter)}` : ''} · the grimoire grows
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
      {legendOpen && <LegendModal onClose={() => setLegendOpen(false)} />}
    </>
  );
}
