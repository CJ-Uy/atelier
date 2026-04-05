<!-- src/components/home/DotIndicator.svelte -->
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

<nav
  aria-label="Section navigation"
  style="position:fixed;right:1.5rem;top:50%;transform:translateY(-50%);z-index:10;display:flex;flex-direction:column;gap:0.6rem;pointer-events:auto;"
>
  {#each SECTIONS as section, i}
    <button
      class="dot"
      class:active={i === active}
      aria-label="Go to {section.descriptor}"
      aria-current={i === active ? 'true' : undefined}
      onclick={() => jump(i)}
    ></button>
  {/each}
</nav>

<style>
  .dot {
    width: 8px; height: 8px;
    border-radius: 50%; border: none; padding: 0; cursor: pointer;
    background: color-mix(in srgb, #DC3522 20%, transparent);
    transition: background 0.3s, transform 0.3s;
  }
  .dot.active { background: #DC3522; transform: scale(1.25); }
  .dot:hover:not(.active) { background: color-mix(in srgb, #DC3522 50%, transparent); }
  .dot:focus-visible { outline: 2px solid #DC3522; outline-offset: 3px; }
</style>
