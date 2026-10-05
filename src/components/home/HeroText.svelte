<!-- src/components/home/HeroText.svelte
     Nameplate + placed paper marginalia for each identity facet.
     Typography: Instrument Serif (display) + IBM Plex Mono (UI). -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { SECTIONS, type Section, type Sticker } from './sections';
  import { facetReveal } from './facetMotion';

  let current: Section = $state(SECTIONS[0]);
  let progress = $state(0);
  let reduced = $state(false);
  // First-load entrance: each nameplate line rises in sequence while the
  // portrait develops on the grid. Cleared after the ritual settles (or on
  // the first section change) so per-section transitions take over.
  let intro = $state(true);
  const titleReveal = $derived(reduced ? 1 : facetReveal(progress, 0.2, 0.8));
  const detailReveal = $derived(reduced ? 1 : facetReveal(progress, 0.35, 0.95));
  const paperReveal = $derived(reduced ? 1 : facetReveal(progress, 0.5, 1));
  const travel = $derived((progress < 0.5 ? -1 : 1) * (1 - titleReveal));

  onMount(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => { reduced = motion.matches; };
    updateMotion();
    motion.addEventListener('change', updateMotion);
    const introTimer = setTimeout(() => { intro = false; }, 2600);

    const onProgress = (e: Event) => {
      const { index, progress: p } = (e as CustomEvent<{ index: number; progress: number }>).detail;
      const next = SECTIONS[index];
      if (!next) return;
      if (index !== 0 || p > 0) {
        intro = false;
        clearTimeout(introTimer);
      }
      current = next;
      progress = p;
    };
    window.addEventListener('atelier:grid-progress', onProgress);
    // Islands can hydrate after the initial orchestrator event.
    const container = document.querySelector<HTMLElement>('.scroll-container');
    const fraction = container?.clientHeight ? container.scrollTop / container.clientHeight : 0;
    if (fraction > 0) onProgress(new CustomEvent('atelier:grid-progress', {
      detail: { index: Math.min(Math.round(fraction), SECTIONS.length - 1), progress: fraction % 1 },
    }));
    return () => {
      clearTimeout(introTimer);
      motion.removeEventListener('change', updateMotion);
      window.removeEventListener('atelier:grid-progress', onProgress);
    };
  });

  function stickerStyle(s: Sticker): string {
    // x/y are viewport-height units (vh) so marginalia flings out to the
    // corners around the centred circle — matching the design's FloatingSticker.
    return [
      `--baseX: ${s.x}vh`,
      `--baseY: ${s.y}vh`,
      `--baseRot: ${s.rot}deg`,
      `font-size: ${s.size}px`,
      `--place-delay: ${s.delay}s`,
    ].join('; ');
  }
</script>

<!-- Nameplate — lower edge of viewport -->
<div
  class="nameplate"
  class:intro
  style={`--title-reveal:${titleReveal}; --detail-reveal:${detailReveal}; --paper-reveal:${paperReveal}; --travel:${travel}`}
  aria-live="polite"
  aria-atomic="true"
>
  <!-- Paper glow so text stays legible over the grid -->
  <div class="nameplate-glow" aria-hidden="true"></div>

  <!-- Tagline slug -->
  <div class="tagline">
    <span class="tagline-rule"></span>
    ✦ {current.tagline}
    <span class="tagline-rule"></span>
  </div>

  <!-- Prefix (italic serif) -->
  <p class="prefix">{current.prefix}</p>

  <!-- Descriptor (large serif) -->
  <div class="descriptor-wrap">
    <h1 class="descriptor">
      {current.descriptor}
    </h1>
  </div>

  <!-- Subtitle (mono) -->
  <p class="subtitle">{current.subtitle}</p>

  <!-- Mobile marginalia — the sticker field folds into an inline chip row -->
  <div class="chip-row" aria-hidden="true">
    {#each current.stickers.filter((s) => s.type !== 'glyph') as s, i (current.id + '-chip-' + i)}
      <span class="chip chip-{s.type}" class:chip-accent={s.accent}>{s.text}</span>
    {/each}
  </div>
</div>

<!-- Paper details share the scroll clock; only the opening has a timed placement. -->
  <div class="sticker-field" class:intro style={`--paper-reveal:${paperReveal}`} aria-hidden="true">
    {#each current.stickers as s, i (current.id + '-' + i)}
      <span
        class="sticker sticker-{s.type}"
        class:sticker-accent={s.accent}
        style={stickerStyle(s)}
      >{s.text}</span>
    {/each}
  </div>

<style>
  /* ── Nameplate ─────────────────────────────────────────────── */
  .nameplate {
    position: fixed;
    left: 50%;
    bottom: clamp(48px, 9vh, 96px);
    transform: translateX(-50%);
    z-index: 10;
    width: min(92vw, 600px);
    text-align: center;
    pointer-events: none;
    user-select: none;
  }

  .nameplate-glow {
    position: absolute;
    inset: -26px -40px -34px;
    background: radial-gradient(
      ellipse 62% 78% at 50% 52%,
      rgba(250,249,246,0.94) 0%,
      rgba(250,249,246,0.82) 46%,
      rgba(250,249,246,0) 100%
    );
    z-index: -1;
  }

  /* ── Tagline slug ──────────────────────────────────────────── */
  .tagline {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9.5px;
    font-weight: 600;
    letter-spacing: 0.3em;
    color: var(--ink);
    text-transform: uppercase;
    opacity: calc(var(--detail-reveal) * 0.5);
    white-space: nowrap;
  }

  .tagline-rule {
    width: 16px;
    height: 1px;
    background: var(--ink);
    opacity: 0.6;
    transform: scaleX(var(--detail-reveal));
  }

  /* ── Prefix ────────────────────────────────────────────────── */
  .prefix {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: clamp(1rem, 1.7vw, 1.18rem);
    font-style: italic;
    color: #6a6a68;
    margin: 14px 0 0;
    opacity: var(--title-reveal);
  }

  /* ── Descriptor ────────────────────────────────────────────── */
  .descriptor-wrap { overflow: hidden; }

  .descriptor {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: clamp(2.8rem, 7vw, 5.1rem);
    font-weight: 400;
    color: var(--ink);
    letter-spacing: -0.038em;
    line-height: 1.02;
    margin: 2px 0 0;
    white-space: nowrap;
    display: block;
    transform: translateY(calc(var(--travel) * 24px));
    opacity: var(--title-reveal);
  }

  /* ── Subtitle ──────────────────────────────────────────────── */
  .subtitle {
    font-family: 'IBM Plex Mono', monospace;
    font-size: clamp(0.7rem, 0.98vw, 0.78rem);
    color: #454543;
    margin: 16px auto 0;
    max-width: 42ch;
    letter-spacing: 0.01em;
    line-height: 1.6;
    opacity: calc(var(--detail-reveal) * 0.92);
    transform: translateY(calc((1 - var(--detail-reveal)) * 8px));
  }

  /* ── First-load entrance — lines rise while the portrait develops ── */
  .nameplate.intro .tagline,
  .nameplate.intro .prefix,
  .nameplate.intro .descriptor,
  .nameplate.intro .subtitle,
  .nameplate.intro .chip-row {
    animation: heroRise var(--motion-reveal) var(--ease-settle) backwards;
  }
  .nameplate.intro .tagline    { --rise-o: 0.5;  animation-delay: 0.55s; }
  .nameplate.intro .prefix     { --rise-o: 1;    animation-delay: 0.7s; }
  .nameplate.intro .descriptor { --rise-o: 1;    animation-delay: 0.82s; }
  .nameplate.intro .subtitle   { --rise-o: 0.92; animation-delay: 1s; }
  .nameplate.intro .chip-row   { --rise-o: 1;    animation-delay: 1.15s; }

  @keyframes heroRise {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: var(--rise-o, 1); transform: translateY(0); }
  }

  /* ── Sticker field ─────────────────────────────────────────── */
  .sticker-field {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 6;
    pointer-events: none;
    user-select: none;
  }

  /* All sticker types are positioned via CSS custom props */
  .sticker {
    position: absolute;
    white-space: nowrap;
    opacity: var(--paper-reveal);
    transform: translate(var(--baseX), var(--baseY))
      translateY(calc((1 - var(--paper-reveal)) * -12px))
      rotate(calc(var(--baseRot) - (1 - var(--paper-reveal)) * 3deg))
      scale(calc(0.96 + var(--paper-reveal) * 0.04));
  }
  .sticker-field.intro .sticker {
    animation: stickerPlace var(--motion-reveal) var(--ease-settle) var(--place-delay) backwards;
  }
  @keyframes stickerPlace {
    from { opacity: 0; transform: translate(var(--baseX), var(--baseY)) translateY(-14px) rotate(calc(var(--baseRot) - 4deg)) scale(0.96); }
    to { opacity: 1; transform: translate(var(--baseX), var(--baseY)) rotate(var(--baseRot)) scale(1); }
  }

  /* ── Glyph sticker ─────────────────────────────────────────── */
  .sticker-glyph {
    font-family: 'Instrument Serif', Georgia, serif;
    color: var(--ink);
    opacity: calc(var(--paper-reveal) * 0.55);
  }

  /* ── Stamp sticker ─────────────────────────────────────────── */
  .sticker-stamp {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 600;
    letter-spacing: 0.14em;
    padding: 2px 7px;
    border: 0.8px solid var(--ink);
    color: var(--ink);
    background: rgba(250,249,246,0.96);
  }

  .sticker-stamp.sticker-accent {
    color: var(--vermilion);
    border-color: var(--vermilion);
  }

  /* ── Tape sticker — vellum strip, top/bottom edges only ─────── */
  .sticker-tape {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 500;
    letter-spacing: 0.05em;
    padding: 2px 8px;
    background: rgba(245,238,220,0.85);
    border-top: 0.5px solid rgba(10,10,10,0.25);
    border-bottom: 0.5px solid rgba(10,10,10,0.25);
    color: var(--ink);
  }

  /* ── Die-cut sticker ───────────────────────────────────────── */
  .sticker-sticker {
    font-family: 'Instrument Serif', Georgia, serif;
    font-style: italic;
    padding: 3px 10px;
    background: rgba(250,249,246,0.96);
    border: 0.8px solid var(--ink);
    border-radius: 2px;
    color: var(--ink);
    box-shadow: 0 1px 0 rgba(10,10,10,0.85);
  }

  /* ── Mobile chip row — hidden on desktop (sticker field covers it) ── */
  .chip-row { display: none; }

  /* ── Mobile ────────────────────────────────────────────────── */
  @media (max-width: 640px) {
    .nameplate {
      width: calc(100% - 64px);
      bottom: calc(28px + env(safe-area-inset-bottom));
    }
    .descriptor { font-size: clamp(2.2rem, 10vw, 3.2rem); }
    .subtitle { font-size: 0.8125rem; max-width: 34ch; margin-top: 12px; }
    .sticker-field { display: none; }

    /* Stickers fold into a centred chip row under the subtitle so mobile
       keeps the desk-marginalia charm without absolute positioning. */
    .chip-row {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
      opacity: var(--paper-reveal);
    }

    .chip {
      font-size: 9px;
      letter-spacing: 0.12em;
      padding: 3px 8px;
      color: var(--ink);
      white-space: nowrap;
    }
    .chip-stamp {
      font-family: 'IBM Plex Mono', monospace;
      font-weight: 600;
      text-transform: uppercase;
      border: 0.8px solid var(--ink);
      background: rgba(250,249,246,0.96);
    }
    .chip-stamp.chip-accent {
      color: var(--vermilion);
      border-color: var(--vermilion);
    }
    .chip-tape {
      font-family: 'IBM Plex Mono', monospace;
      font-weight: 500;
      letter-spacing: 0.05em;
      background: rgba(245,238,220,0.85);
      border-top: 0.5px solid rgba(10,10,10,0.25);
      border-bottom: 0.5px solid rgba(10,10,10,0.25);
    }
    .chip-sticker {
      font-family: 'Instrument Serif', Georgia, serif;
      font-style: italic;
      font-size: 11px;
      letter-spacing: 0.02em;
      border: 0.8px solid var(--ink);
      border-radius: 2px;
      background: rgba(250,249,246,0.96);
      box-shadow: 0 1px 0 rgba(10,10,10,0.85);
    }
  }

  @media (max-height: 560px) and (orientation: landscape) {
    .nameplate { bottom: calc(52px + env(safe-area-inset-bottom)); }
    .descriptor { font-size: 2.4rem; }
    .prefix { margin-top: 6px; }
    .subtitle { margin-top: 8px; }
    .tagline, .chip-row { display: none; }
  }
</style>
