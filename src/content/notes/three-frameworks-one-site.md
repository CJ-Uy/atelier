---
title: Three Frameworks, One Site
date: 2026-06-11
excerpt: Why this portfolio runs Svelte, React, and Vue simultaneously — and how Astro's island model makes it a feature rather than a mess.
tags: [astro, svelte, react, vue]
draft: false
---

This site runs three JavaScript frameworks at the same time. The home page is Svelte, the Works page is React, and you're reading this on a Vue island. That sounds like a red flag. It isn't — and the reason it isn't is worth writing down.

## Islands, not a monolith

Astro's model is simple: the server renders HTML. Interactivity is shipped as isolated *islands* — self-contained framework instances hydrated on the client. Each island is independent: its own runtime, its own component tree, its own event loop.

This means Svelte 5's rune-based reactivity and React 19's reconciler never meet. They're parallel DOM subtrees. The only shared ground is the HTML shell and a few global CSS classes.

```astro
<!-- Home: Svelte -->
<HeroText client:only="svelte" />

<!-- Works: React -->
<WorksPage client:only="react" />

<!-- Field Notes: Vue -->
<NotesIndex :posts={posts} client:visible />
```

## Why different frameworks per page

Each framework was chosen for a specific task, not for variety's sake.

**Svelte** handles the home page because fine-grained reactivity with minimal bundle overhead is exactly what you want driving a 60fps canvas animation. Svelte's compiled output doesn't carry a runtime — every kilobyte counts when the page also ships 2,300 point coordinates.

**React** handles Works because it has a mature ecosystem for the kind of stateful UI patterns the works grid needs: filter state, hover tracking, modal open/close, keyboard traps. The component model maps naturally to the problem.

**Vue** handles this notes index because the tag-filter interaction is a perfect fit for the Options API — or in this case, `<script setup>` with `ref` and `computed`. Clean, readable, no ceremony.

## The shared visual layer

The frameworks look identical because the visual language lives in plain CSS, not in any framework. `.wp-nav`, `.ph-title`, `.ph-eyebrow`, `--vermilion` — these are global custom properties and class names. Every framework reads from the same stylesheet. A Vue component renders pixel-identical to a React one because the aesthetic is carried by CSS tokens, not by component primitives.

This is the practical argument for design tokens: framework-agnosticism isn't just about design systems at scale. It's about being able to swap the rendering engine without rewriting the look.
