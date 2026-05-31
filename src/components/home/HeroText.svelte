<!-- src/components/home/HeroText.svelte
     Nameplate + floating stickers for each identity facet.
     Typography: Instrument Serif (display) + IBM Plex Mono (UI). -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { SECTIONS, type Section, type Sticker } from './sections';

  let current: Section = $state(SECTIONS[0]);
  let exiting = $state(false);
  let animateIn = $state(false);

  onMount(() => {
    // Trigger initial pop-in
    setTimeout(() => { animateIn = true; }, 80);

    window.addEventListener('atelier:section-change', (e) => {
      const { index } = (e as CustomEvent<{ index: number }>).detail;
      const next = SECTIONS[index];
      if (!next || next.id === current.id) return;
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
    return [
      `--baseX: ${s.x}px`,
      `--baseY: ${s.y}px`,
      `--baseRot: ${s.rot}deg`,
      `font-size: ${s.size}px`,
      `animation-delay: ${s.delay}s, ${s.delay + 0.3}s`,
    ].join('; ');
  }
</script>

<!-- Nameplate — lower edge of viewport -->
<div
  class="nameplate"
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
    transition: opacity 200ms ease;
  }
  .prefix.out { opacity: 0; }

  /* ── Descriptor ────────────────────────────────────────────── */
  .descriptor-wrap { overflow: hidden; }

  .descriptor {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: clamp(2.6rem, 6.4vw, 4.6rem);
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
    transition: opacity 250ms ease;
  }
  .subtitle.fade-out { opacity: 0; }

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

  /* ── Tape sticker ──────────────────────────────────────────── */
  .sticker-tape {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 500;
    letter-spacing: 0.08em;
    padding: 3px 10px;
    background: rgba(245,238,220,0.9);
    border: 0.8px solid var(--ink);
    color: var(--ink);
  }

  /* ── Die-cut sticker ───────────────────────────────────────── */
  .sticker-sticker {
    font-family: 'Instrument Serif', Georgia, serif;
    font-style: italic;
    padding: 4px 12px;
    background: var(--paper);
    border: 1px solid var(--ink);
    border-radius: 4px;
    color: var(--ink);
    box-shadow: 1px 1px 0 var(--ink), 0 4px 12px rgba(10,10,10,0.08);
  }

  /* ── Mobile ────────────────────────────────────────────────── */
  @media (max-width: 640px) {
    .nameplate {
      width: 94vw;
      bottom: clamp(36px, 7vh, 64px);
    }
    .descriptor { font-size: clamp(2rem, 9vw, 3rem); }
    .subtitle { font-size: 0.72rem; max-width: 34ch; }
    .sticker-field { display: none; }
  }
</style>
