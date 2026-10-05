/**
 * WorksPage — the grimoire grid. Data lives in works.data.ts; this file is render
 * logic only. Every work shows a layered MagicCircle whose marks are derived from
 * its category + layers (see resolveCircle). Each visit shuffles a varied panel
 * arrangement; category chips and attribute toggles build the search sigil.
 */

import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { flushSync } from 'react-dom';
import MagicCircle, { type Overlay } from '../shared/MagicCircle';
import { WORKS, CATEGORIES, CAT_BASE, sortWorks, shuffleWorks, resolveCircle, isAccent } from './works.data';

const INK = '#0a0a0a';
const PAPER = '#faf9f6';
const VERMILION = '#dc3522';

type Project = ReturnType<typeof sortWorks>[number]; // a Work + computed opus numeral `n`
const PANEL_SPANS = [8, 4, 5, 7, 4, 4, 4, 7, 5, 6, 6];
const PANEL_FORMATS = ['wide', 'tall', 'tall', 'wide', 'compact', 'standard', 'compact', 'wide', 'tall', 'standard', 'standard'];

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

// Native dialogs supply keyboard containment, Escape and focus restoration.
function useModal() {
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = prev;
      opener?.focus({ preventScroll: true });
    };
  }, []);
  return ref;
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
  const dialogRef = useModal();

  const p = project;
  const cc = resolveCircle(p);
  const accent = isAccent(p);
  const origin = p.layers.includes('origin') || p.era === 'highschool';
  const plateCount = p.plates || 0;
  const crossPos = [{ top: 10, left: 10 }, { top: 10, right: 10 }, { bottom: 10, left: 10 }, { bottom: 10, right: 10 }];

  const roleLine = [p.role, p.period, catLabel(p.cat)].filter(Boolean).join(' · ');

  return (
    <dialog ref={dialogRef} className="pm-backdrop" aria-label={p.title}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pm-panel">
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
                size={150} rotateSpeed={60} innerRotateSpeed={34} reverseInner runes={false} showCardinals style={{ color: INK }} />
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
    </dialog>
  );
}

// ── Project card ──────────────────────────────────────────────────
const WPCard = React.memo(function WPCard({ p, index, onOpen }: { p: Project; index: number; onOpen: (p: Project, source: HTMLElement) => void }) {
  const cc = resolveCircle(p);
  const accent = isAccent(p);
  const origin = p.layers.includes('origin') || p.era === 'highschool';

  return (
    <article className={`wp-panel wp-panel--${p.weight}`}
      data-format={PANEL_FORMATS[index % PANEL_FORMATS.length]} data-work={p.slug}
      style={{ '--panel-delay': `${index % 4 * 65}ms`, '--panel-span': PANEL_SPANS[index % PANEL_SPANS.length] } as React.CSSProperties}>
      <svg className="wp-panel-frame" aria-hidden="true">
        <rect x="1.2" y="1.2" width="calc(100% - 2.4px)" height="calc(100% - 2.4px)" pathLength="100" />
      </svg>
      <div className="wp-panel-scene" aria-hidden="true">
        <span className="wp-panel-opus">{p.n}</span>
        <div className="wp-panel-circle">
          <MagicCircle variant={cc.base} overlays={cc.overlays} intensity={cc.intensity}
            state={p.state} origin={origin} size={p.weight === 'archive' ? 100 : 184}
            rotateSpeed={20} innerRotateSpeed={12} reverseInner runes={false} showCardinals
            style={{ color: INK }} />
        </div>
        <span className="wp-panel-spell" style={{ color: accent ? VERMILION : INK }}>{p.spell}</span>
      </div>
      <div className="wp-panel-copy">
        <div className="wp-panel-meta"><span>WORK · {p.n}</span><span>{p.year} / {catLabel(p.cat)}</span></div>
        <h2 className="wp-panel-title">
          <button className="wp-panel-open" onClick={(event) => onOpen(p, event.currentTarget.closest<HTMLElement>('.wp-panel')!)} aria-haspopup="dialog">{p.title}</button>
        </h2>
        <p className="wp-panel-blurb">{p.blurb}</p>
        <div className="wp-panel-bottom">
          <div className="wp-panel-tags">{(p.tags ?? []).map((t) => <span key={t}>{t}</span>)}</div>
          <span className="wp-panel-hint" aria-hidden="true">Read work <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.3" /></svg></span>
        </div>
      </div>
    </article>
  );
});

// ── Filter chips (category, single-select) ────────────────────────
function WPFilter({ active, onChange, counts }: { active: string; onChange: (id: string) => void; counts: Record<string, number> }) {
  return (
    <div className="wp-categories" role="group" aria-label="Filter by discipline">
      {CATEGORIES.map((c) => {
        const isActive = c.id === active;
        const count = c.id === 'all' ? counts.all : (counts[c.id] || 0);
        if (c.id !== 'all' && count === 0) return null;
        return (
          <button key={c.id} onClick={() => onChange(c.id)} aria-pressed={isActive} style={{
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
    <div className="wp-attributes" role="group" aria-label="Filter by mark">
      {ATTR_FILTERS.map((a) => {
        const on = active.has(a.id);
        const isAward = a.id === 'award';
        const tint = isAward ? VERMILION : INK;
        return (
          <button key={a.id} onClick={() => onToggle(a.id)} aria-pressed={on} style={{
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

// ── Works page root ───────────────────────────────────────────────
export default function WorksPage() {
  const [filter, setFilter] = useState('all');
  const [attrs, setAttrs] = useState<Set<string>>(() => new Set());
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<{ project: Project; source: HTMLElement } | null>(null);
  const [order, setOrder] = useState<Project[] | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const transition = useRef<ViewTransition | null>(null);
  const transitionSource = useRef<HTMLElement | null>(null);

  const sorted = useMemo(() => sortWorks(WORKS), []);
  const inventory = order ?? sorted;
  useEffect(() => {
    setOrder(shuffleWorks(sorted));
    return () => {
      transition.current?.skipTransition();
      transitionSource.current?.style.removeProperty('view-transition-name');
      transitionSource.current?.querySelector<HTMLElement>('.wp-panel-circle')?.style.removeProperty('view-transition-name');
    };
  }, [sorted]);

  function changeProject(next: typeof active, source: HTMLElement) {
    transition.current?.skipTransition();
    transitionSource.current?.style.removeProperty('view-transition-name');
    transitionSource.current?.querySelector<HTMLElement>('.wp-panel-circle')?.style.removeProperty('view-transition-name');
    const update = () => flushSync(() => setActive(next));
    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      update();
      return;
    }
    const sigil = source.querySelector<HTMLElement>('.wp-panel-circle');
    transitionSource.current = source;
    if (next) {
      source.style.viewTransitionName = 'project-sheet';
      if (sigil) sigil.style.viewTransitionName = 'project-sigil';
    }
    const view = document.startViewTransition(() => {
      source.style.viewTransitionName = next ? 'none' : 'project-sheet';
      if (sigil) sigil.style.viewTransitionName = next ? 'none' : 'project-sigil';
      update();
    });
    transition.current = view;
    const cleanup = () => {
      if (transition.current !== view) return;
      source.style.removeProperty('view-transition-name');
      sigil?.style.removeProperty('view-transition-name');
      transition.current = null;
      transitionSource.current = null;
    };
    void view.ready.catch(() => {}); // Interrupted transitions still commit the dialog update.
    void view.finished.then(cleanup, cleanup);
  }

  const reset = () => { setFilter('all'); setAttrs(new Set()); setQuery(''); };
  const filtered = filter !== 'all' || attrs.size > 0 || query.trim().length > 0;
  const searchMarks: Overlay[] = attrs.has('award') ? ['seal'] : [];
  const searchDescription = [filter !== 'all' ? catLabel(filter) : '', ...ATTR_FILTERS.filter(a => attrs.has(a.id)).map(a => a.label), query.trim() ? `Search: ${query.trim()}` : ''].filter(Boolean).join(' · ');

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: sorted.length };
    sorted.forEach((p) => { c[p.cat] = (c[p.cat] || 0) + 1; });
    return c;
  }, [sorted]);

  const shown = useMemo(() => {
    const activeAttrs = ATTR_FILTERS.filter((a) => attrs.has(a.id));
    const q = query.trim().toLowerCase();
    return inventory.filter((p) => {
      if (filter !== 'all' && p.cat !== filter) return false;
      if (!activeAttrs.every((a) => a.test(p))) return false;
      if (q) {
        const hay = [p.title, p.blurb, p.spell, p.org, catLabel(p.cat), ...(p.tags ?? []), ...p.layers].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [filter, attrs, query, inventory]);

  useEffect(() => {
    const panels = gridRef.current?.querySelectorAll<HTMLElement>('.wp-panel:not([data-reveal="ready"])');
    if (!order || !panels?.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).dataset.reveal = 'ready';
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    panels.forEach((panel) => { panel.dataset.reveal = 'pending'; observer.observe(panel); });
    return () => observer.disconnect();
  }, [shown, order]);

  const toggleAttr = (id: string) =>
    setAttrs((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <>
      {/* Nav */}
      <nav className="wp-nav" aria-label="Main navigation">
        <a href="/" className="wp-brand">atelier</a>
        <div className="wp-links">
          <a href="/" className="wp-link">Home</a>
          <a href="/works" className="wp-link active" aria-current="page">Works</a>
          <a href="/notes" className="wp-link">Notes</a>
          <a href="/contact" className="wp-link">Contact</a>
        </div>
      </nav>

      {/* Header */}
      <header className="ph-header">
        <div className="ph-circlemark">
          <MagicCircle variant="casting" size={104} rotateSpeed={140} style={{ color: INK }} />
        </div>
        <h1 className="ph-title">Things I've conjured</h1>
        <p className="ph-sub">A working index of everything I've made, won, led, taught or contributed to — projects, research, systems, games and small spells. Filter by discipline or mark; open a panel to read its story.</p>
      </header>

      {/* Sticky filter bar */}
      <div className="wp-filterbar">
        <div className="wp-searchrow">
          <div className="wp-searchtools">
          <div className="wp-search">
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 12, opacity: 0.45, pointerEvents: 'none' }}>⌕</span>
            <input
              type="search"
              value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="SEARCH THE GRIMOIRE" aria-label="Search works"
            />
            {query && (
              <button className="wp-clear" onClick={() => setQuery('')} aria-label="Clear search">✕</button>
            )}
          </div>
            <div className="wp-index-tools">
              <button type="button" className="wp-shuffle" onClick={() => setOrder(shuffleWorks(inventory))}>↝ Shuffle panels</button>
              {filtered && <button type="button" className="wp-reset" onClick={reset}>Clear filters</button>}
            </div>
          </div>
          <div className="wp-search-sigil" role="img" aria-label={`Search sigil: ${searchDescription || 'all works, blank circle'}`} data-live={attrs.has('live')}>
            <div className="wp-search-drawing" key={searchDescription} aria-hidden="true">
              <MagicCircle variant={filter === 'all' ? 'blank' : CAT_BASE[filter as keyof typeof CAT_BASE]}
                size={104} runes={false} overlays={searchMarks} origin={attrs.has('early')} showCardinals={query.trim().length > 0} />
            </div>
            <span aria-hidden="true">{shown.length} works</span>
          </div>
        </div>
        <WPFilter active={filter} onChange={setFilter} counts={counts} />
        <WPAttrFilter active={attrs} onToggle={toggleAttr} />
      </div>

      {/* Grid */}
      <main className="wp-gridwrap">
        <div className="wp-grid" ref={gridRef} data-arranged={Boolean(order)} key={filter + '|' + [...attrs].sort().join(',')}>
          {shown.map((p, i) => <WPCard key={p.slug} p={p} index={i} onOpen={(project, source) => changeProject({ project, source }, source)} />)}
        </div>
        {shown.length === 0 && <div className="wp-empty">
          <p>No works match these filters.</p>
          <button onClick={reset}>Show all works</button>
        </div>}
        <div className="wp-count" role="status" aria-live="polite" aria-atomic="true">
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

      {active && <ProjectModal project={active.project} onClose={() => changeProject(null, active.source)} />}
    </>
  );
}
