<!-- src/components/home/ScrollHint.svelte
     Quiet wayfinding at the foot of the hero: mono slug over a hairline
     track with a descending ink dot. Fades in after the opening ritual,
     dissolves once the visitor actually moves to another facet. -->
<script lang="ts">
  import { onMount } from 'svelte';
  let visible = $state(true);

  onMount(() => {
    // Only hide once the visitor leaves the first facet — orchestrator.init()
    // dispatches an index-0 event on startup that must not dismiss the hint.
    const hide = (e: Event) => {
      if ((e as CustomEvent<{ index: number }>).detail.index === 0) return;
      visible = false;
      window.removeEventListener('atelier:section-change', hide);
    };
    window.addEventListener('atelier:section-change', hide);
  });
</script>

{#if visible}
  <div class="hint" aria-hidden="true">
    <span class="hint-label">scroll · cast the circles</span>
    <span class="hint-track">
      <span class="hint-dot"></span>
    </span>
  </div>
{/if}

<style>
  .hint {
    position: fixed;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    pointer-events: none;
    color: #9a9a96;
    animation: hintFadeIn 1s ease 2.4s both;
  }

  .hint-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  .hint-track {
    position: relative;
    width: 1px;
    height: 22px;
    background: rgba(10, 10, 10, 0.18);
    overflow: hidden;
  }

  .hint-dot {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--ink);
    opacity: 0.6;
    animation: hintDescend 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  @keyframes hintFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes hintDescend {
    0%   { transform: translate(-50%, -4px); opacity: 0; }
    35%  { opacity: 0.6; }
    100% { transform: translate(-50%, 23px); opacity: 0; }
  }

  /* Short viewports: the nameplate needs every pixel — drop the hint */
  @media (max-height: 480px) {
    .hint { display: none; }
  }
</style>
