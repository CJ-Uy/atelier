<!-- src/components/home/HomeOutro.svelte
     Closing band at the foot of the home scroll. Works lives on its own page;
     this points the way there. Ported from the design's HomeOutro (Atelier.html). -->
<script lang="ts">
  // static content; the grid/hero fade is driven from BaseLayout's scroll handler
</script>

<section class="outro">
  <div class="circlemark" aria-hidden="true">
    <!-- binding circle: two concentric rings + tick marks, slow spin -->
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
    </svg>
  </div>

  <div class="slug">✦ THE WORK AWAITS ✦</div>

  <h2 class="line">Every circle was cast for something.</h2>

  <a href="/works" class="cta">enter the workshop →</a>

  <div class="mail">
    <span class="rule"></span>
    <a href="mailto:charlesjoshuauy@gmail.com">CHARLESJOSHUAUY@GMAIL.COM</a>
    <span class="rule"></span>
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
    margin-bottom: 28px;
    max-width: 18ch;
    color: var(--ink);
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
  .rule { width: 26px; height: 1px; background: var(--ink); opacity: 0.5; }
</style>
