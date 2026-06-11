<!-- src/components/home/HeroText.svelte
     Nameplate + floating stickers for each identity facet.
     Typography: Instrument Serif (display) + IBM Plex Mono (UI). -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { SECTIONS, type Section, type Sticker } from './sections';

  let current: Section = $state(SECTIONS[0]);
  let exiting = $state(false);
  let animateIn = $state(false);
  // First-load entrance: each nameplate line rises in sequence while the
  // portrait develops on the grid. Cleared after the ritual settles (or on
  // the first section change) so per-section transitions take over.
  let intro = $state(true);

  onMount(() => {
    // Trigger initial pop-in
    setTimeout(() => { animateIn = true; }, 80);
    const introTimer = setTimeout(() => { intro = false; }, 2600);

    window.addEventListener('atelier:section-change', (e) => {
      const { index } = (e as CustomEvent<{ index: number }>).detail;
      const next = SECTIONS[index];
      if (!next || next.id === current.id) return;
      intro = false;
      clearTimeout(introTimer);
      exiting = true;
      animateIn = false;
      setTimeout(() => {
        current = next;
        exiting = false;
        setTimeout(() => { animateIn = true; }, 40);
      }, 280);
    });
  });

  function stickerStyle(s: Sticker): string {
    // x/y are viewport-height units (vh) so marginalia flings out to the
    // corners around the centred circle — matching the design's FloatingSticker.
    return [
      `--baseX: ${s.x}vh`,
      `--baseY: ${s.y}vh`,
      `--baseRot: ${s.rot}deg`,
      `font-size: ${s.size}px`,
      `animation-delay: ${s.delay}s, ${s.delay + 0.3}s`,
    ].join('; ');
  }
</script>

<!-- Nameplate — lower edge of viewport -->
<div
  class="nameplate"
  class:intro
  aria-live="polite"
  aria-atomic="true"
>
  <!-- Paper glow so text stays legible over the grid -->
  <div class="nameplate-glow" aria-hidden="true"></div>

  <!-- Tagline slug -->
  <div class="tagline" class:visible={animateIn && !exiting}>
    <span class="tagline-rule"></span>
    ✦ {current.tagline}
    <span class="tagline-rule"></span>
  </div>

  <!-- Prefix (italic serif) -->
  <p class="prefix" class:out={exiting}>{current.prefix}</p>

  <!-- Descriptor (large serif) -->
  <div class="descriptor-wrap">
    <h1 class="descriptor" class:slide-out={exiting} class:slide-in={!exiting && animateIn}>
      {current.descriptor}
    </h1>
  </div>

  <!-- Subtitle (mono) -->
  <p class="subtitle" class:fade-out={exiting}>{current.subtitle}</p>

  <!-- Mobile marginalia — the sticker field folds into an inline chip row -->
  <div class="chip-row" class:visible={animateIn && !exiting} aria-hidden="true">
    {#each current.stickers.filter((s) => s.type !== 'glyph') as s, i (current.id + '-chip-' + i)}
      <span class="chip chip-{s.type}" class:chip-accent={s.accent}>{s.text}</span>
    {/each}
  </div>
</div>

<!-- Floating stickers around the card -->
{#if animateIn && !exiting}
  <div class="sticker-field" aria-hidden="true">
    {#each current.stickers as s, i (current.id + '-' + i)}
      <span
        class="sticker sticker-{s.type}"
        class:sticker-accent={s.accent}
        style={stickerStyle(s)}
      >{s.text}</span>
    {/each}
  </div>
{/if}

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
    opacity: 0;
    transition: opacity 250ms ease;
    white-space: nowrap;
  }
  .tagline.visible { opacity: 0.5; }

  .tagline-rule {
    width: 16px;
    height: 1px;
    background: var(--ink);
    opacity: 0.6;
  }

  /* ── Prefix ────────────────────────────────────────────────── */
  .prefix {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: clamp(1rem, 1.7vw, 1.18rem);
    font-style: italic;
    color: #6a6a68;
    margin: 14px 0 0;
    opacity: 1;
    /* staggered re-entry: prefix settles just after the descriptor lands */
    transition: opacity 220ms ease 60ms;
  }
  .prefix.out { opacity: 0; transition-delay: 0ms; }

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
    transform: translateY(0);
    opacity: 1;
    transition:
      transform 320ms cubic-bezier(0.5,0,0.2,1.2),
      opacity 280ms ease;
  }

  .descriptor.slide-out {
    transform: translateY(-120%);
    opacity: 0;
  }

  @keyframes slideIn {
    from { transform: translateY(120%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  .descriptor.slide-in {
    animation: slideIn 350ms cubic-bezier(0.2,0,0,1) forwards;
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
    opacity: 0.92;
    transform: translateY(0);
    transition: opacity 250ms ease 90ms, transform 250ms ease 90ms;
  }
  .subtitle.fade-out { opacity: 0; transform: translateY(6px); transition-delay: 0ms; }

  /* ── First-load entrance — lines rise while the portrait develops ── */
  .nameplate.intro .tagline,
  .nameplate.intro .prefix,
  .nameplate.intro .descriptor,
  .nameplate.intro .subtitle,
  .nameplate.intro .chip-row {
    animation: heroRise 640ms cubic-bezier(0.2, 0, 0, 1) both;
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
    animation:
      stickerPop 0.55s cubic-bezier(0.5,0,0.2,1.4) both,
      stickerFloat 4s ease-in-out infinite;
  }

  @keyframes stickerPop {
    0%   { opacity: 0; transform: translate(var(--baseX), var(--baseY)) rotate(var(--baseRot)) scale(0.4); }
    60%  { opacity: 1; transform: translate(var(--baseX), var(--baseY)) rotate(calc(var(--baseRot) - 6deg)) scale(1.12); }
    100% { opacity: 1; transform: translate(var(--baseX), var(--baseY)) rotate(var(--baseRot)) scale(1); }
  }

  @keyframes stickerFloat {
    0%, 100% { transform: translate(var(--baseX), var(--baseY)) rotate(var(--baseRot)) translateY(0); }
    50%       { transform: translate(var(--baseX), var(--baseY)) rotate(calc(var(--baseRot) + 2deg)) translateY(-6px); }
  }

  /* ── Glyph sticker ─────────────────────────────────────────── */
  .sticker-glyph {
    font-family: 'Instrument Serif', Georgia, serif;
    color: var(--ink);
    opacity: 0.55;
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
      width: 94vw;
      bottom: clamp(36px, 7vh, 64px);
    }
    .descriptor { font-size: clamp(2.2rem, 10vw, 3.2rem); }
    .subtitle { font-size: 0.72rem; max-width: 34ch; }
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
      opacity: 0;
      transition: opacity 250ms ease 120ms;
    }
    .chip-row.visible { opacity: 1; }

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
</style>
