<!-- src/components/home/HeroText.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { SECTIONS, type Section } from './sections';

  let current: Section = $state(SECTIONS[0]);
  let exiting = $state(false);

  onMount(() => {
    window.addEventListener('atelier:section-change', (e) => {
      const { index } = (e as CustomEvent<{ index: number }>).detail;
      const next = SECTIONS[index];
      if (!next || next.id === current.id) return;
      exiting = true;
      setTimeout(() => { current = next; exiting = false; }, 300);
    });
  });
</script>

<div
  aria-live="polite"
  aria-atomic="true"
  style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1;text-align:center;pointer-events:none;user-select:none;"
>
  <p style="font-family:'Host Grotesk',sans-serif;font-size:clamp(1rem,2.5vw,1.375rem);font-weight:400;color:var(--color-muted);letter-spacing:-0.01em;margin-bottom:0.25rem;">
    {current.prefix}
  </p>

  <div style="overflow:hidden;">
    <h1
      class:slide-out={exiting}
      style="font-family:'Host Grotesk',sans-serif;font-size:clamp(2.5rem,7vw,5rem);font-weight:700;color:var(--color-on-surface);letter-spacing:-0.04em;line-height:1.05;white-space:nowrap;"
    >
      {current.descriptor}
    </h1>
  </div>

  <p
    class:fade-out={exiting}
    style="font-family:'Host Grotesk',sans-serif;font-size:clamp(0.875rem,1.5vw,1rem);color:var(--color-muted);margin-top:0.75rem;max-width:40ch;"
  >
    {current.subtitle}
  </p>
</div>

<style>
  h1 {
    display: block;
    transform: translateY(0);
    opacity: 1;
    transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1),
                opacity 300ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  h1.slide-out { transform: translateY(-120%); opacity: 0; }

  @keyframes slideIn {
    from { transform: translateY(120%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  h1:not(.slide-out) {
    animation: slideIn 350ms cubic-bezier(0.2, 0, 0, 1) forwards;
  }

  p { transition: opacity 200ms ease; }
  p.fade-out { opacity: 0; }
</style>
