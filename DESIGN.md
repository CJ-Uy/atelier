# Atelier — Design Manifesto & System

> *"Every element, every interaction, is a transformation —
> from idea to interface, from pixel to feeling."*

A personal portfolio for Charles. Half archive, half playground. The site is a
sketchbook that knows how to behave.

---

## 01 · Core Idea — Transformation

The site has one running metaphor: **a graph paper grid that becomes other things**.

As you scroll, the grid transforms — into a spider web (developer), into an
astrolabe (researcher), into a planisphere (dreamer), into a polar waveform
(music), into a halftone rosette (digital media), into a banig weave (Waray),
into a blueprint (builder). Each transform mirrors an identity facet. The grid
is the single throughline; everything else is layered on top of it, reverently.

This means:
- **The grid is sacred.** It is always visible, always animated, always the
  base layer. UI never competes with it — UI floats *over* it.
- **Transformation is the verb.** Static elements are suspect. If something
  doesn't morph, fade, or shift on interaction or scroll, ask whether it
  earns its place.
- **The reveal is slow.** No element appears all at once. Stagger entries.
  Let the eye catch up.

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
| Contact | **Vue**    | Declarative template for sigil node positioning, computed charge state, clean two-way binding |

All three are mounted as Astro islands (`client:only`) inside the same Astro shell.

---

## 04 · Sections (Home)

Eight identity facets scroll in sequence. Each maps to a grid state + sticker set:

| ID | Descriptor     | Grid State   | Tagline            |
|----|----------------|--------------|--------------------|
| 0  | Charles        | graphPaper   | PORTFOLIO / 00     |
| 1  | developer      | web          | WORLD WIDE WEB / 01|
| 2  | researcher     | astrolabe    | ASTROLABE / 02     |
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

> *Snappy and energetic, never frantic.*

- **Easings:** `cubic-bezier(0.4, 0, 0.2, 1)` for ordinary transitions.
  `cubic-bezier(0.5, 0, 0.2, 1.4)` (slight overshoot) for entries.
- **Durations:** 200–350ms for state changes, 400–600ms for hero entries,
  ≤120ms for hover.
- **Scroll snap:** custom JS-driven snap at 350ms ease-out-cubic.
- **Idle wobble:** every grid point has a sine-driven 0.2% positional wobble.
  Subtle. The page should always feel slightly alive.
- **No parallax for parallax's sake.** Motion serves the metaphor of
  transformation; if it doesn't, kill it.

---

## 07 · Grid States

The canvas grid uses Canvas 2D (not WebGL). Each state is a function that maps
a grid vertex `(c, r)` to `(x, y, alpha)` in normalized `[-1, 1]` space.

### Grimoire states (active)
| State       | Description                                           |
|-------------|-------------------------------------------------------|
| graphPaper  | Uniform grid — the blank page                         |
| web         | Spider web: off-center hub, radial spokes, irregular frame, anchor threads |
| astrolabe   | Measurement rings + 24 index lines                    |
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

- **Header**: "The Grimoire" / "OPUS · WORKS" slug
- **Category chips**: All · Web & Interface · Research · Sound · Tools · Systems
- **Cards**: `border: 1.6px solid var(--ink)`, `box-shadow: 0 2px 0 var(--ink)`, corner `+` crosshairs, halftone wash overlay
- **Featured card**: spans 2 columns, row layout (circle left, text right)
- **Circle**: SVG magic circle variant per project, spins up on hover (`rotateSpeed` drops from 92s → 16s period)
- **Hover**: card lifts `translateY(-5px)`, circle scales 1.04x
- **Modal**: click to open project detail (casting notes, plates, coven)

### Magic circle variants
`summoning`, `hexagram`, `wheel`, `eye`, `pentagram`, `binding`, `casting`, `sigil`

---

## 09 · Contact Page

"The Summoning" — a central spinning magic circle with 6 contact channels
placed as sigil nodes on the perimeter.

- **Circle variant**: `summoning` (pentagon + 5 satellite nodes)
- **Ring text**: `· VOCA · SCRIBE · INVOCO · RESPONDEO · COLLOQVIVM · SOCIETAS · ADSVM`
- **Channels** (clockwise from top): Email · GitHub · LinkedIn · Phone · CV · Facebook
- **Hover (charging)**: disc fills vermilion, circle spin accelerates 4.2×, dotted charge-lines from satellite nodes to sigil, monogram label changes to "channelling"
- **Center monogram**: "CJ-Uy" in Instrument Serif, vermilion ring border while charging

---

## 10 · Interaction

The first thing a visitor lands on must be **interactive within 2 seconds**.

- **Section 0 (graphPaper):** the cursor distorts the grid like a magnetic
  field. Points within ~22% of the viewport's smaller dimension pull toward
  the cursor with a bell-curve falloff and brighten.
- **Sections 1–7:** scroll-driven. The grid morphs continuously between states.
  Section indicators on the right show position with expanding lines + labels.
- **Works page:** hover to lift card + spin up circle. Click to open modal.
- **Contact:** hover sigil to charge the circle.

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
- Cursor trails (the cursor distortion *is* the cursor effect)
- More than one accent color (vermilion only)
- Dark mode (the paper/ink palette is its own thing)

---

## 13 · Authorship

When in doubt, choose the option that looks like **one person made this on
purpose**, not the option that looks like a template was filled in.

— *Charles, May 2026*
