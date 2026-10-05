import React, { useEffect, useRef, useState } from 'react';
import MagicCircle from '../shared/MagicCircle';

const CHANNELS = [
  { id: 'email', sigil: '✉', label: 'Email', handle: 'charlesjoshuauy@gmail.com', href: 'mailto:charlesjoshuauy@gmail.com', angle: -90 },
  { id: 'github', sigil: 'GH', label: 'GitHub', handle: 'CJ-Uy', href: 'https://github.com/CJ-Uy', angle: -30 },
  { id: 'linkedin', sigil: 'in', label: 'LinkedIn', handle: 'in/charles-joshua-uy', href: 'https://www.linkedin.com/in/charles-joshua-uy-920826274/', angle: 30 },
  { id: 'phone', sigil: '✆', label: 'Phone', handle: '+63 917 150 4686', href: 'tel:+639171504686', angle: 90 },
  { id: 'cv', sigil: 'CV', label: 'Curriculum Vitae', handle: 'Open PDF ↗', href: 'https://cv.cjuy.dev', angle: 150 },
  { id: 'facebook', sigil: 'f', label: 'Facebook', handle: '/charlesjoshua.uy', href: 'https://facebook.com/charlesjoshua.uy', angle: 210 },
] as const;

type Channel = typeof CHANNELS[number];

export default function ContactPage() {
  const [hovered, setHovered] = useState<Channel | null>(null);
  const [focused, setFocused] = useState<Channel | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const circle = useRef<HTMLDivElement>(null);
  const lines = useRef<(SVGLineElement | null)[]>([]);
  const active = hovered ?? focused;

  function cancel() {
    setHovered(null);
    setFocused(null);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') cancel(); };
    const onVisibility = () => {
      if (stage.current) stage.current.dataset.paused = String(document.hidden);
      if (document.hidden) cancel();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVisibility);
    onVisibility();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // CSS owns idle rotation. Only a visible, charging circle needs JS frames.
  useEffect(() => {
    const wrap = circle.current;
    const board = stage.current;
    if (!wrap || !board) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animations = wrap.getAnimations?.({ subtree: true }) ?? [];
    animations.forEach((animation) => { animation.playbackRate = active && !motion.matches ? 4.2 : 1; });
    if (!active || document.hidden) return;

    const nodes = wrap.querySelectorAll<SVGCircleElement>('.mc-summon-node');
    const target = board.querySelector<HTMLElement>(`[data-channel="${active.id}"] .cm-sigil-disc`);
    let frame = 0;
    let visible = false;
    const draw = () => {
      if (!visible || document.hidden || !target) return;
      const bounds = board.getBoundingClientRect();
      const end = target.getBoundingClientRect();
      const scale = 680 / bounds.width;
      const tx = (end.left + end.width / 2 - bounds.left) * scale;
      const ty = (end.top + end.height / 2 - bounds.top) * scale;
      nodes.forEach((node, index) => {
        const line = lines.current[index];
        if (!line) return;
        const rect = node.getBoundingClientRect();
        line.setAttribute('x1', String((rect.left + rect.width / 2 - bounds.left) * scale));
        line.setAttribute('y1', String((rect.top + rect.height / 2 - bounds.top) * scale));
        line.setAttribute('x2', String(tx));
        line.setAttribute('y2', String(ty));
      });
      if (!motion.matches) frame = requestAnimationFrame(draw);
    };
    const update = () => {
      cancelAnimationFrame(frame);
      board.dataset.paused = String(!visible || document.hidden);
      animations.forEach((animation) => { animation.playbackRate = motion.matches ? 1 : 4.2; });
      if (visible && !document.hidden) draw();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(wrap);
    motion.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      motion.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', update);
      board.dataset.paused = String(document.hidden);
      animations.forEach((animation) => { animation.playbackRate = 1; });
    };
  }, [active]);

  return (
    <>
      <nav className="wp-nav" aria-label="Main navigation">
        <a href="/" className="wp-brand">atelier</a>
        <div className="wp-links">
          <a href="/" className="wp-link">Home</a>
          <a href="/works" className="wp-link">Works</a>
          <a href="/notes" className="wp-link">Notes</a>
          <a href="/contact" className="wp-link active" aria-current="page">Contact</a>
        </div>
      </nav>

      <header className="ph-header cm-header">
        <div className="ph-eyebrow">✦ THE SUMMONING · RITE NO. VIII ✦</div>
        <h1 className="ph-title">Contact Me</h1>
        <p className="ph-sub">Every circle on this site was cast for something. This one summons me — choose a sigil to open the channel.</p>
        <div className="cm-status"><span className="cm-dot" />OPEN TO OPPORTUNITIES &amp; COLLABORATIONS</div>
      </header>

      <main className="cm-stage" aria-label="Contact channels">
        <div ref={stage} className={`cm-apparatus${active ? ' is-charging' : ''}`}>
          <svg className="cm-connections" viewBox="0 0 680 680" aria-hidden="true">
            {active && Array.from({ length: 5 }, (_, i) => (
              <line key={active.id + i} pathLength="1" style={{ '--line-delay': `${i * 25}ms` } as React.CSSProperties} ref={(element) => { lines.current[i] = element; }}
                x1="340" y1="340" x2="340" y2="340" className="cm-flow" />
            ))}
          </svg>
          <div ref={circle} className="cm-circle">
            <MagicCircle variant="summoning" size={372} rotateSpeed={150} innerRotateSpeed={80}
              reverseInner runes style={{ width: '100%', height: '100%' }} />
          </div>
          <div className="cm-core" aria-hidden="true">
            <span className="cm-monogram">CJ-Uy</span>
            <span className="cm-core-label">{active ? 'channelling' : 'summon'}</span>
          </div>
          {CHANNELS.map((channel, index) => {
            const radians = channel.angle * Math.PI / 180;
            return (
              <a key={channel.id} data-channel={channel.id}
                className={`cm-sigil${active?.id === channel.id ? ' is-active' : ''}`}
                href={channel.href} target={channel.href.startsWith('https:') ? '_blank' : undefined}
                rel="noopener noreferrer" aria-label={`${channel.label}: ${channel.handle}${channel.href.startsWith('https:') ? ' (opens in a new tab)' : ''}`}
                onPointerEnter={(event) => { if (event.pointerType === 'mouse') setHovered(channel); }}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setFocused(channel)} onBlur={() => setFocused(null)}
                style={{ '--node-delay': `${index * 45}ms`, left: `${50 + Math.cos(radians) * 39}%`, top: `${50 + Math.sin(radians) * 39}%` } as React.CSSProperties}>
                <span className={`cm-sigil-disc${channel.sigil.length === 1 ? ' cm-glyph' : ''}`}>{channel.sigil}</span>
                <span className="cm-sigil-label">{channel.id === 'cv' ? <><span className="cm-label-full">Curriculum Vitae</span><span className="cm-label-short">CV</span></> : channel.label}</span>
                <span className="cm-sigil-handle">{channel.handle}</span>
              </a>
            );
          })}
        </div>
        <div className="cm-channel-status">
          <p role="status" aria-live="polite" aria-atomic="true">{active ? `${active.label} · ${active.handle}` : 'Six ways to get in touch.'}</p>
        </div>
      </main>
      <footer className="cm-foot"><span /><span>RESPONDS WITHIN A MOON&apos;S TURN · TYPICALLY ~48H</span><span /></footer>
    </>
  );
}
