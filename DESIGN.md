# Atelier — Design Manifesto & System

> *"Every element, every interaction, is a transformation —
> from idea to interface, from pixel to feeling."*

A personal portfolio for Charles. Half archive, half playground. The site is a
sketchbook that knows how to behave.

---

## 01 · Core Idea — Transformation

The site has one running metaphor: **a graph paper grid that becomes other things**.

As you scroll, the portrait grid transforms — into a spider web (developer), into
a Venn diagram (researcher), into a planisphere (dreamer), into a polar waveform
(music), into a halftone rosette (digital media), into a banig weave (Waray),
into a blueprint (builder). Each transform mirrors an identity facet. The grid
is the single throughline; everything else is layered on top of it, reverently.

This means:
- **The grid is the base layer.** UI floats *over* it. Decorative rendering
  pauses when hidden and yields to scroll input.
- **Transformation is the verb.** Motion reveals structure, identity, or an
  interaction's result. Settled content stays quiet.
- **The reveal has an order.** Draw the geometry, reveal the identity, then
  place the paper details. Let the eye catch up.

---

## 02 · Aesthetic — Editorial Ink-on-Paper

Black ink. Off-white paper. One reserved accent.

Think: an architect's notebook, a riso-printed zine, a passport stamped at
twelve borders. Refined enough to be taken seriously; warm enough to feel
human.

What this is **not**:
- Glossy SaaS. No vibrant gradients, no purple-to-pink fade, no glassmorphism.
- Sticker-shop kawaii. The personality is in the *details* — a piece of tape,
  a numbered slug, a halftone fade — not in maximalist decoration.
- Brutalist tech-bro. We don't shout in monospace. We whisper in serif.

### Color tokens
| Token         | Value      | Use                                         |
|---------------|------------|---------------------------------------------|
| `--ink`       | `#0a0a0a`  | All text, all strokes, the grid itself      |
| `--paper`     | `#faf9f6`  | Page background, sticker fills              |
| `--vellum`    | `#f5eedc`  | Tape pieces, archival accents (translucent) |
| `--vermilion` | `#dc3522`  | Single accent — stamps, dates, hover only   |
| `--mute-1`    | `#999999`  | Secondary text, inactive indicators         |
| `--mute-2`    | `#e8e6e1`  | Hairline rules, faint borders               |

Vermilion is **rationed**. It appears on date stamps and one or two callouts
per page. Never on body text, never on backgrounds.

### Typography
- **Display:** *Instrument Serif* — italic for prefixes ("I'm a"), upright for
  descriptors ("developer"). The serif is the voice; the mono is the receipt.
- **Body / UI:** *IBM Plex Mono* — used at small sizes (8–11px) with wide
  letter-spacing for taglines, slugs, and metadata.
- **Hierarchy:** descriptor (3.4–4.6rem) → prefix (1rem italic) → subtitle
  (0.72rem mono) → slug (9px mono, 0.28em tracked).

### Google Fonts import
```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
```

---

## 03 · Framework Map

Each page uses the framework best suited to its interaction model:

| Page    | Framework | Reason                                                                      |
|---------|-----------|-----------------------------------------------------------------------------|
| Home    | **Svelte** | Scroll-driven animation, fine-grained reactive state, minimal runtime overhead for 60fps grid morphing |
| Works   | **React**  | Complex state: category filters, per-card hover + IntersectionObserver, modal overlay |
| Contact | **React**  | Native contact links with hover and keyboard connections between sigils |
| Notes   | **Vue / Astro** | Reactive collection filters and static content pages |

Interactive components hydrate as Astro islands inside the shared shell.

---

## 04 · Sections (Home)

Eight identity facets scroll in sequence. Each maps to a grid state + sticker set:

| ID | Descriptor     | Grid State   | Tagline            |
|----|----------------|--------------|--------------------|
| 0  | Charles        | face         | PORTFOLIO / 00     |
| 1  | developer      | web          | WORLD WIDE WEB / 01|
| 2  | researcher     | venn         | BETWEEN FIELDS / 02|
| 3  | big dreamer    | planisphere  | PLANISPHERE / 03   |
| 4  | music          | waveform     | WAVEFORM / 04      |
| 5  | digital media  | rosette      | HALFTONE ROSETTE / 05 |
| 6  | Waray          | banig        | BANIG WEAVE / 06   |
| 7  | building things| blueprint    | BLUEPRINT / 07     |

---

## 05 · Sticker Vocabulary

Each section's identity is reinforced by floating stickers around the nameplate.
Stickers are **marginalia**, like notes in the margin of a textbook:

- Reference the section's content (♪ for music, `{ }` for developer, ◇ for Waray).
- ≤ 4 per section. More than that becomes a craft fair.
- Sit at the four corners of the nameplate, never directly behind text.
- Use one of four formal types — **glyph**, **stamp**, **tape**, **sticker**.

### Sticker card variants
- **Glyph** — Large symbol, opacity 0.55. Pure typographic character.
- **Stamp** — Mono font, 1px solid border, rectangular. For archive/callout text.
- **Tape** — Vellum-colored background, 1px border. For handwritten-label feel.
- **Sticker** — 4px border-radius, 1px border + soft shadow. For rounded die-cut feel.

All types: **rotation ≤ ±14°**. The cards are stickers, but they are pristine
stickers, applied carefully.

---

## 06 · Motion

> *Editorial and precise, with a few dramatic moments. A thoughtful builder
> revealing how things take shape.*

Shared tokens live in `src/styles/global.css`: 120ms feedback, 600ms reveal,
520ms expansion. `--ease-settle` is `cubic-bezier(.16, 1, .3, 1)`;
`--ease-transform` is `cubic-bezier(.65, 0, .35, 1)`.

- **Home:** scroll progress directly controls a reversible sequence. Geometry
  settles first, the identity follows, then marginalia. At the midpoint between
  facets, labels clear so the transforming grid can speak. Scrubbing backwards
  reverses the same sequence; no delayed section-switch timers.
- **Works:** panel outlines draw before their contents print onto the paper.
  The selected sigil travels into an expanding project sheet using native view
  transitions, with a short CSS entrance when that API is unavailable.
- **Search:** begin with a blank ring. Discipline adds the base geometry;
  Awarded adds a seal, Early Web adds an origin mark, Live strengthens the ring,
  and text search adds cardinal marks. Clearing filters returns to the ring.
- **Contact:** the apparatus settles into place. Hover or keyboard focus draws
  connections to a channel. Activation opens the native link immediately.
- **Reduced motion:** content remains readable, project sheets open directly,
  and decorative motion stops. Hidden documents pause continuous work.

---

## 07 · Grid States

The canvas grid uses Canvas 2D (not WebGL). Each state is a function that maps
a grid vertex `(c, r)` to `(x, y, alpha)` in normalized `[-1, 1]` space.

### Grimoire states (active)
| State       | Description                                           |
|-------------|-------------------------------------------------------|
| face        | Portrait developed on the 56 × 40 grid                 |
| graphPaper  | Uniform grid — the blank page                         |
| web         | Spider web: off-center hub, radial spokes, irregular frame, anchor threads |
| astrolabe   | Measurement rings + 24 index lines                    |
| venn        | Overlapping fields — CS, science, and humanities       |
| planisphere | Celestial sphere: 12-spoke graticule + 3 horizon rings |
| waveform    | Polar vinyl waveform: 132 radial bars, amplitude-modulated |
| rosette     | Halftone rosette: 36 spokes + 8 concentric rings      |
| banig       | Concentric Manhattan (L1) diamond rings               |
| blueprint   | Isometric cube wireframe + drawing-sheet border       |

### Key helper functions (in `GridStates.ts`)
- `snapAngle(angle, N, blend)` — quantize angle to nearest of N evenly-spaced steps
- `snapToRings(dist, rings, blend)` — attract distance to nearest ring in list
- `closestOnSeg(px, py, ax, ay, bx, by)` — nearest point on line segment
- `waveAmp(i, N)` — deterministic audio-ish amplitude for spoke `i`

---

## 08 · Works Page

Grimoire-styled project index. Key elements:

- **Header:** "Things I've conjured".
- **Arrangement:** a fresh shuffle on each visit, with a small Shuffle panels
  control. Wide, tall, standard, and compact scenes alternate across a 12-column
  page. Project numbers stay stable; DOM and keyboard order follow the panels.
- **Search:** the sigil beside the field builds from active criteria. Category
  and attribute controls expose their selected state without a separate legend.
- **Panels:** ink frames, halftone scenes, and layered project sigils. Hover and
  focus straighten the sigil and move the reading arrow.
- **Project sheet:** casting notes, plates, coven, and apparatus appear in a native
  dialog. Escape closes it; focus returns to the selected project.
- **Shuffle:** changes the arrangement while preserving the active search.

---

## 09 · Contact Page

"The Summoning" — a central spinning magic circle with 6 contact channels
placed as sigil nodes on the perimeter.

- **Circle variant**: `summoning` (pentagon + 5 satellite nodes)
- **Ring text**: `· VOCA · SCRIBE · INVOCO · RESPONDEO · COLLOQVIVM · SOCIETAS · ADSVM`
- **Channels** (clockwise from top): Email · GitHub · LinkedIn · Phone · CV · Facebook
- **Hover / focus (charging)**: disc fills vermilion, circle spin accelerates 4.2×,
  connections draw from satellite nodes to the sigil, and the monogram label
  changes to "channelling". Escape clears the connection.
- **Activation:** touch, mouse, keyboard, and modified clicks retain native link
  behavior. The decorative gesture never delays the destination.
- **Center monogram**: "CJ-Uy" in Instrument Serif, vermilion ring border while charging

---

## 10 · Interaction

The first thing a visitor lands on must be **interactive within 2 seconds**.

- **Section 0 (face):** the opening portrait is drawn on the same 56 × 40 grid
  used by the identity transformations.
- **Sections 1–7:** scroll-driven. The grid morphs continuously between states.
  Section indicators on the right show position with expanding lines + labels.
- **Works page:** filter to build the search sigil, shuffle the panels, and open
  a project sheet from its sigil.
- **Contact:** hover or focus a sigil to connect the circle; activate to open
  the channel immediately.

---

## 11 · Content Voice

Conversational. First-person. Quietly confident. Never marketing-speak.

- ✓ "I build interfaces that feel alive — WebGL, Svelte, and a soft spot for the small details."
- ✗ "Innovative solutions for next-gen experiences."
- ✓ "Constructing the future, one project at a time."
- ✗ "Empowering brands through cutting-edge digital strategies."

Section taglines use **archive nomenclature** (PORTFOLIO / 00, ASTROLABE / 02).
It's a body of work, not a marketing site.

---

## 12 · Don't List

Things this site explicitly does not have:
- A loading splash screen
- Cookie banners
- "Hire me" CTAs in the hero
- Testimonials carousel
- Skill bars / language proficiency percentages
- Auto-playing music or video
- Cursor trails
- More than one accent color (vermilion only)
- Dark mode (the paper/ink palette is its own thing)

---

## 13 · Authorship

When in doubt, choose the option that looks like **one person made this on
purpose**, not the option that looks like a template was filled in.

— *Charles, May 2026*
