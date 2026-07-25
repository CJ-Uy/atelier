# Atelier

Charles's personal portfolio: an editorial ink-on-paper site built around a
Canvas 2D grid that transforms into a portrait, web, planisphere, waveform,
banig weave, blueprint, and other identity facets.

## Stack

- Astro 6 with the Cloudflare Workers adapter
- Svelte for the scroll-driven home experience
- React for Works and Contact
- Vue for Notes and a retained contact experiment
- Tailwind CSS 4
- Vitest and Playwright

The multi-framework setup is intentional. Astro supplies the shared shell and
hydrates each interactive surface as an isolated client island.

## Development

Requires Node 22.12 or newer and pnpm.

```sh
pnpm install
pnpm dev
```

The local site runs at `http://localhost:4321`.

## Verification

```sh
pnpm test
pnpm test:e2e
pnpm build
```

The Cloudflare adapter uses Wrangler during development and builds. It needs
write access to Wrangler's user-level log and registry directories.

## CV Publishing

Edit `public/cv/CV_Charles_Joshua_Uy.docx`, export it to
`public/cv/CV_Charles_Joshua_Uy.pdf`, then update the dated download names in
`src/middleware.ts`, `src/pages/cv.pdf.ts`, and `src/pages/cv.docx.ts`. Confirm
the PDF page count and text extraction, run the verification commands above,
and deploy with `pnpm deploy`.

The stable assets are served by the Astro Worker. The `cv.cjuy.dev` custom
domain maps to that Worker, whose middleware serves the PDF inline at `/`;
`/cv.pdf` provides the same inline PDF from the portfolio domain.

## Homepage Architecture

The homepage pipeline lives in `src/lib/grid`:

- `GridStates.ts` generates the fixed 56 by 40 geometry states.
- `GridEngine.ts` interpolates and renders them with Canvas 2D.
- `RenderQuality.ts` chooses adaptive fidelity from hardware and motion hints.
- `RenderScheduler.ts` owns demand-driven and idle canvas frames.
- `ScrollOrchestrator.ts` maps scrolling to morph progress and section events.

`src/layouts/BaseLayout.astro` wires that runtime to the Svelte hero,
annotations, section controls, and closing band.

Do not change the grid dimensions without regenerating
`public/face-data.js`, which contains portrait data for exactly 57 by 41
vertices.

See [DESIGN.md](DESIGN.md) for the visual system and [AGENTS.md](AGENTS.md) for
the implementation guide.

## Graphify

The structural code graph is generated in `graphify-out/`. Open
`graphify-out/graph.html` for the interactive view or read
`graphify-out/GRAPH_REPORT.md` for the architecture summary.
