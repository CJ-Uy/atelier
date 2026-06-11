<template>
  <div class="notes-page">
    <!-- Nav -->
    <nav class="wp-nav" aria-label="Main navigation">
      <a href="/" class="wp-brand">atelier</a>
      <div class="wp-links">
        <a href="/" class="wp-link">Home</a>
        <a href="/works" class="wp-link">Works</a>
        <a href="/notes" class="wp-link active">Notes</a>
        <a href="/contact" class="wp-link">Contact</a>
      </div>
    </nav>

    <!-- Page header -->
    <header class="ph-header">
      <div class="ph-eyebrow">✦ LOG · FIELD NOTES ✦</div>
      <h1 class="ph-title">Notes</h1>
      <p class="ph-sub">Observations from the workbench — on craft, code, and whatever refuses to stay in the margins.</p>
    </header>

    <!-- Tag filter -->
    <div class="fn-filters" role="group" aria-label="Filter by tag">
      <button
        class="fn-chip"
        :class="{ active: activeTag === null }"
        @click="activeTag = null"
      >All</button>
      <button
        v-for="tag in allTags"
        :key="tag"
        class="fn-chip"
        :class="{ active: activeTag === tag }"
        @click="activeTag = activeTag === tag ? null : tag"
      >{{ tag }}</button>
    </div>

    <!-- Entry list -->
    <main class="fn-list">
      <TransitionGroup name="fn-fade">
        <a
          v-for="post in filteredPosts"
          :key="post.slug"
          :href="`/notes/${post.slug}`"
          class="fn-entry"
        >
          <div class="fn-entry-meta">
            <span class="fn-date">{{ formatDate(post.date) }}</span>
            <div class="fn-tags">
              <span v-for="tag in post.tags" :key="tag" class="fn-tag">{{ tag }}</span>
            </div>
          </div>
          <h2 class="fn-title">{{ post.title }}</h2>
          <p class="fn-excerpt">{{ post.excerpt }}</p>
          <span class="fn-read">read →</span>
        </a>
      </TransitionGroup>

      <div v-if="filteredPosts.length === 0" class="fn-empty">
        No notes filed under <em>{{ activeTag }}</em> yet.
      </div>
    </main>

    <!-- Footer -->
    <footer class="cm-foot">
      <span></span>
      FIELD NOTES · ATELIER
      <span></span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface NotePreview {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
}

const props = defineProps<{ posts: NotePreview[] }>();

const activeTag = ref<string | null>(null);

const allTags = computed(() => {
  const set = new Set<string>();
  for (const p of props.posts) p.tags.forEach((t) => set.add(t));
  return [...set].sort();
});

const filteredPosts = computed(() =>
  activeTag.value
    ? props.posts.filter((p) => p.tags.includes(activeTag.value!))
    : props.posts
);

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}
</script>

<style scoped>
.notes-page {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ── Tag filter ── */
.fn-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 720px;
  margin: 0 auto;
  padding: 0 32px 40px;
  animation: cmFadeUp 700ms cubic-bezier(0.4,0,0.2,1) 80ms both;
}

.fn-chip {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #0a0a0a;
  background: transparent;
  border: 1.2px solid rgba(10,10,10,0.3);
  padding: 5px 12px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.fn-chip:hover { border-color: #0a0a0a; }
.fn-chip.active {
  background: #0a0a0a;
  color: #faf9f6;
  border-color: #0a0a0a;
}

/* ── Entry list ── */
.fn-list {
  flex: 1;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  padding: 0 32px 48px;
}

.fn-entry {
  display: block;
  text-decoration: none;
  color: inherit;
  padding: 24px 20px;
  border: 1.6px solid #0a0a0a;
  box-shadow: 2px 2px 0 #0a0a0a;
  margin-bottom: 16px;
  background: #faf9f6;
  transition: transform 0.18s cubic-bezier(0.4,0,0.2,1), box-shadow 0.18s;
  animation: cmFadeUp 600ms cubic-bezier(0.4,0,0.2,1) both;
}
.fn-entry:hover {
  transform: translateY(-5px);
  box-shadow: 2px 7px 0 #0a0a0a;
}

.fn-entry-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 10px;
}

.fn-date {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #dc3522;
}

.fn-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.fn-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 8.5px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.45;
  border: 1px solid rgba(10,10,10,0.25);
  padding: 2px 7px;
}

.fn-title {
  font-family: 'Instrument Serif', Georgia, serif;
  font-weight: 400;
  font-size: clamp(1.25rem, 3vw, 1.6rem);
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: #0a0a0a;
  margin-bottom: 10px;
}

.fn-excerpt {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  line-height: 1.65;
  color: #454545;
  margin-bottom: 16px;
}

.fn-read {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.45;
  transition: opacity 0.15s;
}
.fn-entry:hover .fn-read { opacity: 1; }

.fn-empty {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  opacity: 0.5;
  padding: 48px 0;
  text-align: center;
}

/* ── Transition ── */
.fn-fade-enter-active,
.fn-fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fn-fade-enter-from,
.fn-fade-leave-to { opacity: 0; transform: translateY(8px); }

@media (max-width: 600px) {
  .fn-filters { padding: 0 20px 32px; }
  .fn-list { padding: 0 20px 40px; }
  .fn-entry { padding: 18px 14px; }
}
</style>
