> Structural ingestion only: semantic extraction for documents and images was unavailable in this session. Generated `worker-configuration.d.ts` was excluded because it overwhelmed the project graph with vendor declarations.

# Graph Report - .  (2026-06-19)

## Corpus Check
- 68 files · ~99,140 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 303 nodes · 410 edges · 23 communities (19 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Grid Runtime and Canvas|Grid Runtime and Canvas]]
- [[_COMMUNITY_Grid Geometry States|Grid Geometry States]]
- [[_COMMUNITY_Astro Homepage Integration|Astro Homepage Integration]]
- [[_COMMUNITY_Testing and Toolchain|Testing and Toolchain]]
- [[_COMMUNITY_Magic Circles and Contact|Magic Circles and Contact]]
- [[_COMMUNITY_Facet SVG Annotations|Facet SVG Annotations]]
- [[_COMMUNITY_Works Portfolio|Works Portfolio]]
- [[_COMMUNITY_Render Scheduling|Render Scheduling]]
- [[_COMMUNITY_Runtime Dependencies|Runtime Dependencies]]
- [[_COMMUNITY_Notes Content System|Notes Content System]]
- [[_COMMUNITY_Vue Contact Interaction|Vue Contact Interaction]]
- [[_COMMUNITY_Adaptive Render Quality|Adaptive Render Quality]]
- [[_COMMUNITY_Scroll Orchestration|Scroll Orchestration]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_Manga Grid Layout|Manga Grid Layout]]
- [[_COMMUNITY_Cloudflare Runtime Types|Cloudflare Runtime Types]]
- [[_COMMUNITY_Bass Guitar Geometry|Bass Guitar Geometry]]

## God Nodes (most connected - your core abstractions)
1. `GridEngine` - 29 edges
2. `buildGrid()` - 27 edges
3. `../layouts/BaseLayout.astro` - 19 edges
4. `../components/home/FacetDiagram.svelte` - 18 edges
5. `GridStateName` - 14 edges
6. `ScrollOrchestrator` - 13 edges
7. `scripts` - 11 edges
8. `../components/home/HeroText.svelte` - 11 edges
9. `RenderScheduler` - 10 edges
10. `../components/home/DotIndicator.svelte` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Section` --references--> `GridStateName`  [EXTRACTED]
  src/components/home/sections.ts → src/lib/grid/types.ts
- `ScrollOrchestrator` --references--> `GridEngine`  [EXTRACTED]
  src/lib/grid/ScrollOrchestrator.ts → src/lib/grid/GridEngine.ts
- `SectionDef` --references--> `GridStateName`  [EXTRACTED]
  src/lib/grid/ScrollOrchestrator.ts → src/lib/grid/types.ts
- `ScrollOrchestrator` --references--> `GridStateName`  [EXTRACTED]
  src/lib/grid/ScrollOrchestrator.ts → src/lib/grid/types.ts
- `AmbientAnimation` --references--> `GridEngine`  [EXTRACTED]
  src/lib/grid/AmbientAnimation.ts → src/lib/grid/GridEngine.ts

## Import Cycles
- None detected.

## Communities (23 total, 4 thin omitted)

### Community 0 - "Grid Runtime and Canvas"
Cohesion: 0.07
Nodes (17): AmbientAnimation, DEFAULT_QUALITY, drawSpark(), GridEngine, makeSpark(), Spark, getGridState(), graphPaper() (+9 more)

### Community 1 - "Grid Geometry States"
Cohesion: 0.07
Nodes (38): AST_RINGS, astrolabe(), banig(), BANIG_RINGS, banigWeaving(), blueprint(), BP_SEGS, BP_VERTS (+30 more)

### Community 2 - "Astro Homepage Integration"
Cohesion: 0.08
Nodes (27): ../components/contact/ContactPage, ../components/home/sections, ../lib/grid/GridEngine, ../lib/grid/RenderQuality, ../lib/grid/RenderScheduler, ../lib/grid/ScrollOrchestrator, ../styles/global.css, GRID_STATE_NAMES (+19 more)

### Community 3 - "Testing and Toolchain"
Cohesion: 0.07
Nodes (28): devDependencies, jsdom, @playwright/test, @sveltejs/vite-plugin-svelte, @testing-library/svelte, @types/react, @types/react-dom, vitest (+20 more)

### Community 4 - "Magic Circles and Contact"
Cohesion: 0.09
Nodes (7): Channel, Lattice(), MagicCircleProps, polarPts(), SummoningInner(), Variant, CHANNELS

### Community 5 - "Facet SVG Annotations"
Cohesion: 0.14
Nodes (6): ../../lib/grid/GridStates, SPELL_GEO, ../components/home/FacetDiagram.svelte, P(), waveAmp(), wavePeak()

### Community 6 - "Works Portfolio"
Cohesion: 0.17
Nodes (10): ../components/works/WorksPage, catLabel(), Project, ProjectModal(), useReveal(), WorksPage(), WP_CATEGORIES, WP_PROJECTS (+2 more)

### Community 8 - "Runtime Dependencies"
Cohesion: 0.15
Nodes (13): dependencies, astro, @astrojs/cloudflare, @astrojs/react, @astrojs/svelte, @astrojs/vue, gsap, ogl (+5 more)

### Community 9 - "Notes Content System"
Cohesion: 0.18
Nodes (5): posts, ../../components/notes/NotesIndex.vue, dateStr, collections, notes

### Community 10 - "Vue Contact Interaction"
Cohesion: 0.20
Nodes (8): charging, contactRunes, DIMS, isMobile, pentaPts, satPts, spinPeriod, CHANNELS

### Community 11 - "Adaptive Render Quality"
Cohesion: 0.24
Nodes (7): BALANCED, ECONOMY, HIGH, RenderEnvironment, RenderQualityName, selectRenderQuality(), capableEnvironment

### Community 13 - "TypeScript Configuration"
Cohesion: 0.33
Nodes (5): compilerOptions, types, exclude, extends, include

### Community 14 - "Manga Grid Layout"
Cohesion: 0.33
Nodes (4): large, medium, panels, small

## Knowledge Gaps
- **99 isolated node(s):** `name`, `type`, `version`, `node`, `dev` (+94 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `../layouts/BaseLayout.astro` connect `Astro Homepage Integration` to `Notes Content System`, `Facet SVG Annotations`, `Works Portfolio`?**
  _High betweenness centrality (0.291) - this node is a cross-community bridge._
- **Why does `../components/home/FacetDiagram.svelte` connect `Facet SVG Annotations` to `Grid Geometry States`, `Astro Homepage Integration`?**
  _High betweenness centrality (0.289) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Runtime Dependencies` to `Astro Homepage Integration`, `Testing and Toolchain`?**
  _High betweenness centrality (0.204) - this node is a cross-community bridge._
- **What connects `name`, `type`, `version` to the rest of the system?**
  _99 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Grid Runtime and Canvas` be split into smaller, more focused modules?**
  _Cohesion score 0.06711915535444947 - nodes in this community are weakly interconnected._
- **Should `Grid Geometry States` be split into smaller, more focused modules?**
  _Cohesion score 0.07419712070874862 - nodes in this community are weakly interconnected._
- **Should `Astro Homepage Integration` be split into smaller, more focused modules?**
  _Cohesion score 0.0761904761904762 - nodes in this community are weakly interconnected._