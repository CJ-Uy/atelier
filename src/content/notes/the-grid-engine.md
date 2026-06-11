---
title: The Grid Engine
date: 2026-04-22
excerpt: How a canvas of 2,300 dots became the structural backbone of this portfolio — and what I learned writing a morphing animation system from scratch.
tags: [canvas, animation, typescript]
draft: false
---

Every page on this site sits on top of a dot grid rendered to a `<canvas>` element. What looks decorative is actually the primary interface — it morphs between eight distinct states as you scroll, including a recognisable portrait of my face.

Here's how that works.

## The point cloud

The grid is 2,300 named points stored in `face-data.js`. Each point has a logical identity — "this is the pupil of the left eye", "this is the background fill at column 14, row 7" — plus a set of `(x, y)` positions: one per named state (`face`, `venn`, `graphPaper`, `constellation`, and so on).

```ts
type GridPoint = {
  id: string;
  states: Record<StateName, [number, number]>;
};
```

The engine holds a *current* state and a *target* state plus a `progress` value from 0→1. Every animation frame, each point's rendered position is linearly interpolated between its current and target coordinates.

## The morph loop

```ts
function tick() {
  ctx.clearRect(0, 0, w, h);
  for (const pt of points) {
    const [cx, cy] = pt.states[current];
    const [tx, ty] = pt.states[target];
    const x = cx + (tx - cx) * progress;
    const y = cy + (ty - cy) * progress;
    ctx.fillRect(x - 1, y - 1, 2, 2);
  }
  requestAnimationFrame(tick);
}
```

Lerp at the render site, not the data site. That way `progress` can be driven by anything — scroll position, a timed ritual, an easing function — without touching the point data.

## The scroll orchestrator

`ScrollOrchestrator` maps the scroll container's `scrollTop` to a fractional section index, then sets `current`, `target`, and `progress` on the engine. Section boundaries snap with a 350ms ease-out-cubic so morphs feel intentional rather than chaotic.

The hardest part was the *opening ritual*: on page load, the grid develops from graph paper into a face over 2.4 seconds — but any scroll or keypress should abort immediately and hand control to the orchestrator. Two competing timers, one abort path. The key insight: the orchestrator doesn't `.init()` until the ritual is finished or interrupted, so they never fight over `progress`.

## Ambient wobble

Even while stationary the grid breathes. `AmbientAnimation` applies a 0.2% sine-based positional offset to each point, phased by point index. At 60fps this reads as a living surface rather than a frozen graphic.

The effect cost almost nothing to implement and added more perceived quality than anything else I tried.
