<!-- src/components/home/DotIndicator.svelte
     Section indicator: expanding lines with text labels (design system spec). -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { SECTIONS } from './sections';

  let active = $state(0);

  onMount(() => {
    window.addEventListener('atelier:section-change', (e) => {
      active = (e as CustomEvent<{ index: number }>).detail.index;
    });
  });

  function jump(index: number) {
    window.dispatchEvent(new CustomEvent('atelier:jump-to-section', { detail: { index } }));
  }
</script>

<nav aria-label="Section navigation" class="dot-nav">
  {#each SECTIONS as section, i}
    <button
      class="indicator"
      class:active={i === active}
      aria-label="Go to {section.descriptor}"
      aria-current={i === active ? 'true' : undefined}
      onclick={() => jump(i)}
    >
      <!-- descriptor label: always rendered (reserves width, no layout shift),
           inked only when active — matches the design's SectionIndicator -->
      <span class="indicator-label">{section.descriptor}</span>
      <span class="indicator-line"></span>
    </button>
  {/each}
</nav>

<style>
  .dot-nav {
    position: fixed;
    right: 28px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 50;
    display: flex;
    flex-direction: column;
    gap: 0;
    align-items: flex-end;
    pointer-events: auto;
  }

  .indicator {
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: flex-end;
    background: none;
    border: none;
    padding: 7px 0;
    cursor: pointer;
    position: relative;
  }

  .indicator-line {
    display: block;
    height: 2px;
    width: 8px;
    background: #bbb;
    border-radius: 1px;
    transition: all 300ms cubic-bezier(0.4,0,0.2,1);
    flex-shrink: 0;
  }

  .indicator.active .indicator-line {
    width: 28px;
    background: var(--ink);
  }

  .indicator:hover:not(.active) .indicator-line {
    width: 16px;
    background: var(--mute-1);
  }

  .indicator-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: transparent;
    transition: color 300ms ease;
    white-space: nowrap;
  }

  .indicator.active .indicator-label { color: var(--ink); }

  /* Hover preview: whisper the destination before commitment */
  .indicator:hover:not(.active) .indicator-label { color: var(--mute-1); }

  .indicator:focus-visible { outline: 2px solid var(--vermilion); outline-offset: 3px; border-radius: 2px; }

  @media (max-width: 640px) {
    .dot-nav { right: 12px; }
    .indicator { padding: 9px 4px; }
    .indicator-label { display: none; }
    .indicator.active .indicator-line { width: 18px; }
  }
</style>
