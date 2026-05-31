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
      <span class="indicator-line"></span>
      {#if i === active}
        <span class="indicator-label">{section.tagline.split(' / ')[0]}</span>
      {/if}
    </button>
  {/each}
</nav>

<style>
  .dot-nav {
    position: fixed;
    right: 1.75rem;
    top: 50%;
    transform: translateY(-50%);
    z-index: 50;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    pointer-events: auto;
  }

  .indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: flex-end;
    background: none;
    border: none;
    padding: 2px 0;
    cursor: pointer;
    position: relative;
  }

  .indicator-line {
    display: block;
    height: 1px;
    width: 12px;
    background: var(--ink);
    opacity: 0.25;
    transition:
      width 280ms cubic-bezier(0.4,0,0.2,1),
      opacity 200ms ease;
    flex-shrink: 0;
  }

  .indicator.active .indicator-line {
    width: 28px;
    opacity: 1;
  }

  .indicator:hover:not(.active) .indicator-line {
    width: 18px;
    opacity: 0.5;
  }

  .indicator-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--ink);
    opacity: 0.7;
    white-space: nowrap;
    animation: fadeLabel 200ms ease forwards;
  }

  @keyframes fadeLabel {
    from { opacity: 0; transform: translateX(4px); }
    to   { opacity: 0.7; transform: translateX(0); }
  }

  .indicator:focus-visible { outline: 2px solid var(--vermilion); outline-offset: 3px; border-radius: 2px; }

  @media (max-width: 640px) {
    .dot-nav { right: 0.75rem; gap: 0.4rem; }
    .indicator-label { display: none; }
  }
</style>
