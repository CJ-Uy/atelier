# Homepage Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the scroll-driven homepage fluid on weaker laptops while preserving its visual identity.

**Architecture:** Add an explicit render-quality profile and a single demand-aware canvas scheduler. Keep the fixed 56 by 40 grid, but eliminate hot-loop allocation, batch canvas paths, coalesce scroll events, and pause decorative work when it cannot be seen.

**Tech Stack:** Astro 6, TypeScript, Canvas 2D, Svelte 5, Vitest, Playwright, Cloudflare Workers

## Global Constraints

- Preserve the 56 by 40 portrait topology and `public/face-data.js`.
- Scroll position remains the source of truth for morph progress.
- Reduced motion keeps user-driven morphs but disables perpetual decorative animation.
- Add no dependencies.
- Preserve routes, page copy, palette, typography, and section count.

---

### Task 1: Render quality selection

**Files:**
- Create: `src/lib/grid/RenderQuality.ts`
- Create: `src/lib/grid/__tests__/RenderQuality.test.ts`

**Interfaces:**
- Produces: `RenderQualityProfile`, `RenderEnvironment`, and `selectRenderQuality(environment): RenderQualityProfile`.

- [ ] Write tests proving reduced motion selects economy, low-memory or low-core devices select economy, missing hints select balanced, and capable devices select high.
- [ ] Run `pnpm test:unit -- src/lib/grid/__tests__/RenderQuality.test.ts` and confirm the new tests fail because the module does not exist.
- [ ] Implement the three immutable profiles with DPR caps `1.75`, `1.35`, and `1`.
- [ ] Run the focused test and confirm it passes.

### Task 2: Demand-aware animation scheduler

**Files:**
- Create: `src/lib/grid/RenderScheduler.ts`
- Create: `src/lib/grid/__tests__/RenderScheduler.test.ts`
- Modify: `src/lib/grid/AmbientAnimation.ts`

**Interfaces:**
- Consumes: a render callback, idle FPS, and an `isDecorativeMotionEnabled` flag.
- Produces: `requestRender()`, `start()`, `stop()`, `setVisible(visible)`, and `destroy()`.

- [ ] Write fake-timer tests proving repeated `requestRender()` calls coalesce, hidden state cancels frames, economy mode is demand-only, and balanced idle frames respect their interval.
- [ ] Run the focused tests and confirm they fail because `RenderScheduler` is missing.
- [ ] Implement one requestAnimationFrame owner and adapt `AmbientAnimation` into a compatibility wrapper or remove it from the bootstrap.
- [ ] Run the focused tests and confirm they pass.

### Task 3: GridEngine hot-loop optimization

**Files:**
- Modify: `src/lib/grid/GridEngine.ts`
- Create: `src/lib/grid/__tests__/GridEngine.test.ts`

**Interfaces:**
- Constructor becomes `new GridEngine(canvas, qualityProfile)`.
- Produces: `hasActiveDecorations(): boolean` and preserves existing state/progress methods.

- [ ] Write tests with a recording Canvas 2D stub proving DPR is capped by profile and `setProgress()` does not allocate replacement state arrays.
- [ ] Run the focused tests and confirm the DPR expectation fails against the current uncapped implementation.
- [ ] Replace `Pt[]` interpolation and `map()` calls with reusable typed arrays.
- [ ] Batch line and point paths into bounded alpha buckets.
- [ ] Scale sparkle count, wobble amplitude, and pulse behavior from the quality profile.
- [ ] Run all grid unit tests and confirm they pass.

### Task 4: Coalesced scroll orchestration

**Files:**
- Modify: `src/lib/grid/ScrollOrchestrator.ts`
- Modify: `src/lib/grid/__tests__/ScrollOrchestrator.test.ts`

**Interfaces:**
- Constructor accepts an optional `requestRender` callback.
- Produces: `destroy()` for listener, timer, and animation-frame cleanup.

- [ ] Add tests proving multiple scroll events in one frame produce one progress update and new user input cancels a running snap.
- [ ] Run the focused test and confirm the coalescing assertion fails.
- [ ] Store latest scroll state and process it from one requestAnimationFrame callback.
- [ ] Replace anonymous listeners with removable handlers and implement `destroy()`.
- [ ] Run the focused tests and confirm they pass.

### Task 5: Homepage bootstrap and reduced motion

**Files:**
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/styles/global.css`
- Modify: `src/components/home/FacetDiagram.svelte`
- Modify: `src/components/home/HeroText.svelte`

**Interfaces:**
- Root HTML exposes `data-render-quality="high|balanced|economy"`.
- Bootstrap wires the engine, scheduler, orchestrator, visibility changes, resize requests, and cleanup.

- [ ] Add browser assertions for quality metadata and the current eight indicator buttons.
- [ ] Run the relevant Playwright test and confirm the metadata assertion fails.
- [ ] Select quality before creating `GridEngine`, remove no-op pointer listeners, and replace the reduced-motion perpetual loop with on-demand rendering.
- [ ] Pause SVG rotations and sticker floating for economy and reduced-motion modes.
- [ ] Replace homepage `100vh` sizing with `100dvh` while retaining fallbacks where needed.
- [ ] Run unit and browser tests.

### Task 6: Documentation and final verification

**Files:**
- Modify: `README.md`
- Review: `AGENTS.md`
- Review: `graphify-out/GRAPH_REPORT.md`

- [ ] Replace the Astro starter README with project-specific setup, architecture, and command notes.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build` with Wrangler write access.
- [ ] Run `pnpm test:e2e`.
- [ ] Inspect the homepage at desktop and a throttled/low-power emulation profile for scroll continuity, section snapping, portrait fidelity, and outro transition.
