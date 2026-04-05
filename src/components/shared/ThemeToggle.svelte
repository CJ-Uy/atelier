<!-- src/components/shared/ThemeToggle.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  let isDark = $state(true);

  onMount(() => {
    isDark = document.documentElement.dataset.theme !== 'light';
  });

  function toggle() {
    isDark = !isDark;
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  }
</script>

<button
  onclick={toggle}
  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
  style="background:none;border:1px solid color-mix(in srgb, var(--color-on-surface) 30%, transparent);border-radius:6px;padding:0.4rem 0.75rem;cursor:pointer;color:var(--color-on-surface);font-size:0.75rem;font-family:'JetBrains Mono',monospace;letter-spacing:0.05em;pointer-events:auto;transition:border-color 0.2s;"
>
  {isDark ? 'light' : 'dark'}
</button>
