# Homepage Performance Design

## Goal

Preserve Atelier's scroll-driven canvas and SVG identity while making slow
scrolling and idle animation fluid on weaker laptops.

## Chosen Approach

Keep Canvas 2D and introduce adaptive fidelity around a single render
scheduler. The visual composition and 56 by 40 portrait grid remain unchanged.
We reduce work that users do not meaningfully perceive: excessive backing-store
resolution, decorative particle count, idle refresh frequency, hidden-tab
frames, per-frame allocation, and duplicate scroll processing.

## Rendering

`GridEngine` receives a quality profile selected from hardware hints and
reduced-motion preference. Profiles cap DPR, set idle frame cadence, and set
sparkle limits. Scroll-driven updates remain eligible for the next display
frame regardless of idle cadence.

The engine reuses numeric buffers for interpolated and screen-space points.
It batches grid lines into a small number of alpha buckets rather than issuing
one stroke per segment. Point dots are built into shared paths per alpha
bucket. The 56 by 40 topology and state generators remain intact.

## Scheduling

One scheduler owns canvas rendering. It renders:

- immediately on state/progress changes, coalesced to one animation frame;
- at the profile's idle cadence when wobble or particles are active;
- once after resize;
- not at all while the document is hidden.

Reduced motion disables wobble, sparkles, pulse animation, rotating SVG
annotations, sticker floating, and perpetual idle frames. User-driven scroll
morphs still render on demand.

`ScrollOrchestrator` stores the latest scroll position and processes it once
per animation frame. Its custom snap starts only after scroll settles and is
cancelled by new wheel, touch, pointer, or key input.

## Adaptive Fidelity

High quality uses a DPR cap of 1.75, full decorative effects, and 60 fps idle
cadence. Balanced quality uses DPR 1.35, fewer sparkles, and 30 fps idle
cadence. Economy quality uses DPR 1, no sparkles, subtle or disabled wobble,
and on-demand rendering.

Selection uses `deviceMemory`, `hardwareConcurrency`, viewport pixel cost, and
reduced-motion preference. Missing browser hints fall back to balanced quality.
The selected tier is exposed as `data-render-quality` on the root element for
debugging and end-to-end tests.

## Validation

Unit tests cover quality selection, render scheduling, hidden-tab behavior,
and scroll-event coalescing. Existing grid-state tests must remain green.
Browser checks confirm eight section controls, initial portrait content,
quality metadata, and scroll-driven active-state changes.

No redesign, route change, copy rewrite, or WebGL migration is included.
