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
  class="theme-toggle"
>
  {isDark ? '☀' : '☾'}
</button>

<style>
  .theme-toggle {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-on-surface);
    font-size: 1.25rem;
    line-height: 1;
    padding: 0.3rem;
    pointer-events: auto;
    opacity: 0.7;
    transition: opacity 0.2s;
  }
  .theme-toggle:hover {
    opacity: 1;
  }
</style>
