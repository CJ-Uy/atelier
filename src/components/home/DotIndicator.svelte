<!-- src/components/home/DotIndicator.svelte
     Section indicator: expanding lines with text labels (design system spec). -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { SECTIONS } from './sections';

  let active = $state(0);

  onMount(() => {
    const onSectionChange = (e: Event) => {
      active = (e as CustomEvent<{ index: number }>).detail.index;
    };
    window.addEventListener('atelier:section-change', onSectionChange);
    return () => window.removeEventListener('atelier:section-change', onSectionChange);
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
    width: 28px;
    background: #bbb;
    border-radius: 1px;
    transform: scaleX(0.286);
    transform-origin: right;
    transition: transform 300ms cubic-bezier(0.4,0,0.2,1), background-color 300ms ease;
    flex-shrink: 0;
  }

  .indicator.active .indicator-line {
    transform: scaleX(1);
    background: var(--ink);
  }

  .indicator:hover:not(.active) .indicator-line {
    transform: scaleX(0.571);
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

  @media (pointer: coarse) {
    .indicator { min-height: 44px; min-width: 44px; }
  }

  @media (max-width: 640px) {
    .dot-nav { right: env(safe-area-inset-right, 0px); }
    .indicator { width: 44px; height: 44px; padding: 0 12px; }
    .indicator:focus-visible { outline-offset: -3px; }
    .indicator-label { display: none; }
    .indicator-line { width: 18px; transform: scaleX(0.444); }
  }

  @media (max-height: 560px) and (orientation: landscape) {
    .dot-nav {
      top: auto; right: auto; left: 50%; bottom: env(safe-area-inset-bottom, 0px);
      transform: translateX(-50%); flex-direction: row;
    }
    .indicator { width: 44px; height: 44px; padding: 0 8px; }
    .indicator:focus-visible { outline-offset: -3px; }
    .indicator-label { display: none; }
  }
</style>
