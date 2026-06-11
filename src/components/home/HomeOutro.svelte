<!-- src/components/home/HomeOutro.svelte
     Closing band at the foot of the home scroll. Works lives on its own page;
     this points the way there. Ported from the design's HomeOutro (Atelier.html).
     Elements reveal in a calm stagger as the band scrolls into view; without
     JS everything stays visible. -->
<script lang="ts">
  import { onMount } from 'svelte';

  let root: HTMLElement;
  // armed: JS is present, reveal can be orchestrated. inview: band entered
  // the viewport. Pre-hydration markup stays fully visible (no-JS safe).
  let armed = $state(false);
  let inview = $state(false);

  onMount(() => {
    armed = true;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          inview = true;
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(root);
    return () => io.disconnect();
  });
</script>

<section class="outro" class:armed class:inview bind:this={root}>
  <div class="circlemark reveal" style="--rd: 0s" aria-hidden="true">
    <!-- binding circle: two concentric rings + tick marks, slow spin.
         One vermilion tick — the lodestar — sweeps with it. -->
    <svg width="150" height="150" viewBox="0 0 150 150" class="spin">
      <circle cx="75" cy="75" r="72" fill="none" stroke="#0a0a0a" stroke-width="1" />
      <circle cx="75" cy="75" r="58" fill="none" stroke="#0a0a0a" stroke-width="0.6" stroke-dasharray="2 5" />
      <circle cx="75" cy="75" r="40" fill="none" stroke="#0a0a0a" stroke-width="0.6" />
      {#each Array(24) as _, i}
        <line
          x1="75" y1="3" x2="75" y2={i % 6 === 0 ? 12 : 8}
          stroke="#0a0a0a" stroke-width="0.8"
          transform={`rotate(${i * 15} 75 75)`}
        />
      {/each}
      <line x1="75" y1="3" x2="75" y2="14" stroke="#dc3522" stroke-width="1.5" />
      <circle cx="75" cy="75" r="2.2" fill="#dc3522" />
    </svg>
  </div>

  <div class="slug reveal" style="--rd: 0.08s">✦ THE WORK AWAITS ✦</div>

  <h2 class="line reveal" style="--rd: 0.16s">Every circle was cast for something.</h2>

  <div class="cta-row reveal" style="--rd: 0.26s">
    <a href="/works" class="cta">enter the workshop <span class="cta-arrow" aria-hidden="true">→</span></a>
    <a href="/contact" class="cta-alt">or send a letter</a>
  </div>

  <div class="mail reveal" style="--rd: 0.36s">
    <span class="rule"></span>
    <a href="mailto:charlesjoshuauy@gmail.com">CHARLESJOSHUAUY@GMAIL.COM</a>
    <span class="rule"></span>
  </div>

  <div class="colophon reveal" style="--rd: 0.46s">
    SET IN INSTRUMENT SERIF &amp; IBM PLEX MONO — DRAWN ON GRAPH PAPER — MMXXVI
  </div>
</section>

<style>
  .outro {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 80px 32px;
    position: relative;
    pointer-events: auto;
  }

  .circlemark { opacity: 0.9; margin-bottom: 30px; }
  .spin { animation: outroSpin 120s linear infinite; transform-origin: center; }
  @keyframes outroSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  .slug {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9.5px;
    font-weight: 600;
    letter-spacing: 0.32em;
    opacity: 0.5;
    text-transform: uppercase;
    margin-bottom: 18px;
  }

  .line {
    font-family: 'Instrument Serif', Georgia, serif;
    font-style: italic;
    font-size: clamp(2.2rem, 5vw, 3.4rem);
    font-weight: 400;
    letter-spacing: -0.03em;
    line-height: 1.05;
    margin-bottom: 30px;
    max-width: 18ch;
    color: var(--ink);
  }

  /* ── CTA pair — one inked door, one whispered alternative ───── */
  .cta-row {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 14px 26px;
  }

  .cta {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink);
    text-decoration: none;
    border: 1.4px solid var(--ink);
    padding: 14px 26px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    transition: background 160ms ease, color 160ms ease;
  }
  .cta:hover { background: var(--ink); color: var(--paper); }

  .cta-arrow {
    display: inline-block;
    transition: transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .cta:hover .cta-arrow { transform: translateX(4px); }

  .cta-alt {
    font-family: 'Instrument Serif', Georgia, serif;
    font-style: italic;
    font-size: 1.05rem;
    letter-spacing: -0.01em;
    color: var(--ink);
    text-decoration: none;
    opacity: 0.8;
    padding-bottom: 2px;
    background-image: linear-gradient(var(--ink), var(--ink));
    background-repeat: no-repeat;
    background-position: 0 100%;
    background-size: 0% 1px;
    transition: background-size 280ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease;
  }
  .cta-alt:hover { background-size: 100% 1px; opacity: 1; }

  .mail {
    margin-top: 44px;
    display: flex;
    align-items: center;
    gap: 14px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.26em;
    opacity: 0.55;
    font-weight: 600;
  }
  .mail a { color: var(--ink); text-decoration: none; }
  .mail a:hover { text-decoration: underline; text-underline-offset: 3px; }
  .rule { width: 26px; height: 1px; background: var(--ink); opacity: 0.5; }

  /* ── Colophon — the printer's last word ─────────────────────── */
  .colophon {
    margin-top: 56px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8.5px;
    font-weight: 600;
    letter-spacing: 0.26em;
    opacity: 0.38;
    max-width: 90vw;
  }

  /* ── Staggered reveal — armed by JS, fired on intersection ──── */
  .armed .reveal {
    opacity: 0;
    transform: translateY(18px);
    transition:
      opacity 700ms ease var(--rd, 0s),
      transform 700ms cubic-bezier(0.2, 0, 0, 1) var(--rd, 0s);
  }
  .armed.inview .reveal { transform: translateY(0); }
  .armed.inview .circlemark { opacity: 0.9; }
  .armed.inview .slug      { opacity: 0.5; }
  .armed.inview .line      { opacity: 1; }
  .armed.inview .cta-row   { opacity: 1; }
  .armed.inview .mail      { opacity: 0.55; }
  .armed.inview .colophon  { opacity: 0.38; }
</style>
