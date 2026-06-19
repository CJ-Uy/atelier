# Atelier Agent Guide

## Project

Atelier is Charles's personal portfolio: an Astro 6 application deployed to
Cloudflare Workers. The visual system is editorial ink on paper. Preserve the
single vermilion accent, Instrument Serif display type, IBM Plex Mono UI type,
and the graph-grid transformation metaphor described in `DESIGN.md`.

The repository intentionally uses several UI frameworks behind Astro islands:

- Home: Svelte components plus a custom Canvas 2D renderer.
- Works: React.
- Contact: React. `ContactPage.vue` is a retained alternate implementation,
  but `src/pages/contact.astro` mounts `ContactPage.tsx`.
- Notes: Vue and Astro content collections.

Do not consolidate frameworks unless the user explicitly requests an
architecture migration.

## Commands

Use pnpm and Node 22.12 or newer.

```text
pnpm dev          Local Astro server on http://localhost:4321
pnpm test         Vitest unit tests
pnpm test:e2e     Playwright browser tests
pnpm build        Cloudflare production build
pnpm deploy       Build and deploy with Wrangler
```

`pnpm build` initializes the Cloudflare adapter and may need permission to
write Wrangler state outside the repository. A sandbox-only failure in
Wrangler's log or registry directory is environmental, not automatically a
source-code failure.

## Architecture

`src/layouts/BaseLayout.astro` is the shared shell and the homepage bootstrap.
For the home route it creates the fixed canvas, Svelte annotation layers,
section navigation, scroll container, opening portrait ritual, and outro.

The homepage animation pipeline is:

1. `src/components/home/sections.ts` defines the eight identity facets.
2. `src/lib/grid/GridStates.ts` generates normalized grid-state geometry.
3. `src/lib/grid/GridEngine.ts` interpolates and draws the Canvas 2D grid.
4. `src/lib/grid/AmbientAnimation.ts` schedules decorative idle frames.
5. `src/lib/grid/ScrollOrchestrator.ts` maps scroll position to state pairs and
   emits `atelier:section-change` and `atelier:grid-progress`.
6. `src/components/home/FacetDiagram.svelte` draws SVG annotations aligned to
   the canvas coordinate system.
7. `HeroText.svelte` and `DotIndicator.svelte` respond to the custom events.

The portrait source in `public/face-data.js` is generated specifically for a
56 by 40 grid. Do not change `COLS` or `ROWS` without regenerating that asset
and checking every grid state.

## Homepage Performance Invariants

- Scroll position is the source of truth for morph progress.
- Coalesce repeated scroll events into at most one visual update per animation
  frame.
- Pause continuous rendering while the document is hidden.
- Keep scroll-driven frames responsive; reduce decorative idle work first.
- Cap backing-store pixel density instead of changing CSS canvas dimensions.
- Avoid arrays, objects, and path allocations inside the hot render loop.
- Preserve `prefers-reduced-motion`; it must not run a perpetual render loop.
- Any custom event listener, observer, timeout, and animation frame needs a
  cleanup path.
- Do not add another independent requestAnimationFrame loop to the homepage.

## Styling and Content

Global tokens and shared page chrome live in `src/styles/global.css`.
Page-specific large style blocks currently live beside `works.astro` and
`contact.astro`; follow the existing pattern for focused fixes.

Preserve route slugs, navigation labels, contact details, content voice, and
the paper/ink/vermilion palette unless explicitly asked to change them.

Use `100dvh` for new viewport-sized layouts. Keep focus-visible styles and
reduced-motion behavior intact.

## Tests

Unit tests live beside source under `src/**/__tests__`. Add a failing Vitest
test before changing grid scheduling, quality selection, or scroll behavior.

Browser tests live in `tests/`. Some homepage selectors in
`tests/homepage.spec.ts` predate the current eight-section indicator markup;
update stale expectations when touching that file rather than preserving
obsolete behavior.

Before handing off a change, run:

```text
pnpm test
pnpm build
```

Run `pnpm test:e2e` when changing navigation, scroll behavior, hydration, or
visible homepage state.

## Graphify

The structural project graph is in `graphify-out/`:

- `graph.html`: interactive graph.
- `GRAPH_REPORT.md`: architecture report.
- `graph.json`: machine-readable graph.

The current graph excludes generated `worker-configuration.d.ts`, which
otherwise dominates the graph with Cloudflare vendor declarations. The current
run is structural-only because semantic extraction was unavailable; rerun
Graphify with semantic extraction when a Gemini key or authorized extraction
agents are available.
