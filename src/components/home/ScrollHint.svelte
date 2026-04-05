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
    style="position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);z-index:10;display:flex;flex-direction:column;align-items:center;gap:0.5rem;pointer-events:none;color:var(--color-muted);"
  >
    <span style="font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;">
      scroll to explore
    </span>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="chevron" aria-hidden="true">
      <path d="M3 5.5L8 10.5L13 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
{/if}

<style>
  .hint { animation: fadeIn 1s ease 2s both; }
  .chevron { animation: bounce 1.5s ease-in-out infinite; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(4px); } }
</style>
