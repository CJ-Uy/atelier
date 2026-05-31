<!-- src/components/home/ScrollHint.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  let visible = $state(true);

  onMount(() => {
    const hide = () => { visible = false; window.removeEventListener('atelier:section-change', hide); };
    window.addEventListener('atelier:section-change', hide);
  });
</script>

{#if visible}
  <div
    aria-hidden="true"
    class="hint"
    style="position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:9;display:flex;align-items:center;gap:8px;pointer-events:none;color:#9a9a96;"
  >
    <span style="font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;">
      scroll · cast the circles
    </span>
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" class="chevron" aria-hidden="true">
      <path d="M2 5L7 10L12 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
{/if}

<style>
  .hint { animation: fadeIn 1s ease 2.4s both; }
  .chevron { animation: bounce 1.5s ease-in-out infinite; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(4px); } }
</style>
