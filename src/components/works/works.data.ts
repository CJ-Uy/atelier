/**
 * works.data.ts — the grimoire inventory + circle-derivation logic.
 *
 * Authoring rule: per work set `cat`, `weight`, `era`, `state`, `layers` + copy.
 * Everything visual is DERIVED so there's one source of truth:
 *   - accent (vermilion)  = layers.includes('award')          → isAccent()
 *   - featured (big panel) = weight === 'major'               → isFeatured()
 *   - circle base shape    = CAT_BASE[cat]                    → resolveCircle()
 *   - circle overlays      = layers mapped via LAYER_OVERLAY  → resolveCircle()
 *   - circle intensity     = ~layers.length                   → resolveCircle()
 * Override the inferred circle only for special pieces via the optional `circle` field.
 *
 * Open questions tracked inline as `// Q#:` (see plan §7). Links are omitted where a
 * public URL isn't confirmed (Q8) and deliberately omitted for private/client work.
 */

export type Category = 'ai' | 'systems' | 'web' | 'research' | 'editorial' | 'play' | 'practice' | 'tools';
export type Variant = 'casting' | 'bloom' | 'lattice' | 'wheel' | 'sigil' | 'summoning' | 'binding' | 'lens' | 'orrery';
export type Overlay = 'seal' | 'orbit' | 'ticks' | 'circuit' | 'nodes';
export type Layer =
  | 'award' | 'ai' | 'systems' | 'commerce' | 'research' | 'data' | 'community' | 'teaching'
  | 'leadership' | 'map' | 'realtime' | 'ocr' | 'game' | 'hardware' | 'civic' | 'origin';
export type Weight = 'major' | 'strong' | 'supporting' | 'archive';
export type Era = 'highschool' | 'college' | 'professional';
export type State = 'live' | 'prototype' | 'archived' | 'in-progress';

export interface Work {
  slug: string;
  title: string;
  year: string;
  cat: Category;
  weight: Weight;
  era: Era;
  state: State;
  layers: Layer[];
  spell: string;
  blurb: string;
  circle?: { base?: Variant; overlays?: Overlay[]; intensity?: 0 | 1 | 2 };
  casting?: string[];
  role?: string;
  period?: string;
  org?: string;
  links?: { label: string; href: string }[];
  tags?: string[];
  plates?: number;
  video?: boolean;
  coven?: { name: string; role: string }[];
}

// ── Category → base circle shape, + filter-chip metadata ──────────────────────
export const CAT_BASE: Record<Category, Variant> = {
  ai: 'lattice',
  systems: 'wheel',
  web: 'casting',
  research: 'orrery',
  editorial: 'sigil',
  play: 'binding',
  practice: 'summoning',
  tools: 'bloom',
};

export const CATEGORIES: { id: string; label: string; glyph: string }[] = [
  { id: 'all', label: 'All Works', glyph: '✦' },
  { id: 'ai', label: 'AI & Agents', glyph: '◈' },
  { id: 'systems', label: 'Systems & Ops', glyph: '⚙' },
  { id: 'web', label: 'Interface & Web', glyph: '{ }' },
  { id: 'research', label: 'Research', glyph: '†' },
  { id: 'editorial', label: 'Editorial', glyph: '¶' },
  { id: 'play', label: 'Play & Graphics', glyph: '◇' },
  { id: 'practice', label: 'Practice & Community', glyph: '✧' },
  { id: 'tools', label: 'Tools', glyph: '⌘' },
];

// ── Layer → overlay reduction (the rich vocab collapses to 5 renderers) ───────
// Layers with no dedicated renderer (map/game/hardware/origin) still serve as
// filter tags; origin additionally drives a rougher base stroke via era.
const LAYER_OVERLAY: Partial<Record<Layer, Overlay>> = {
  award: 'seal',
  ai: 'nodes',
  research: 'ticks',
  data: 'ticks',
  systems: 'circuit',
  commerce: 'circuit',
  ocr: 'circuit',
  realtime: 'circuit',
  community: 'orbit',
  teaching: 'orbit',
  leadership: 'orbit',
  civic: 'orbit',
};

// ── Derive helpers (pure — covered by works.data.test.ts) ─────────────────────
export const isAccent = (w: Work): boolean => w.layers.includes('award');
export const isFeatured = (w: Work): boolean => w.weight === 'major';

export function resolveCircle(w: Work): { base: Variant; overlays: Overlay[]; intensity: 0 | 1 | 2 } {
  const base = w.circle?.base ?? CAT_BASE[w.cat];
  let overlays = w.circle?.overlays;
  if (!overlays) {
    const set = new Set<Overlay>();
    for (const l of w.layers) {
      const o = LAYER_OVERLAY[l];
      if (o) set.add(o);
    }
    // a multi-person coven reads as "team" → orbiting collaborator marks
    if ((w.coven?.length ?? 0) > 1) set.add('orbit');
    overlays = [...set];
  }
  const intensity = w.circle?.intensity ?? (Math.min(2, Math.floor(w.layers.length / 3)) as 0 | 1 | 2);
  return { base, overlays, intensity };
}

const WEIGHT_RANK: Record<Weight, number> = { major: 0, strong: 1, supporting: 2, archive: 3 };

function toRoman(num: number): string {
  const map: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let out = '';
  for (const [v, s] of map) while (num >= v) { out += s; num -= v; }
  return out;
}

/** Sort by weight (major→archive) then year desc, and attach the computed opus numeral `n`. */
export function sortWorks(works: Work[]): (Work & { n: string })[] {
  return [...works]
    .sort((a, b) => WEIGHT_RANK[a.weight] - WEIGHT_RANK[b.weight] || b.year.localeCompare(a.year))
    .map((w, i) => ({ ...w, n: toRoman(i + 1) }));
}

// ══════════════════════════════════════════════════════════════════════════════
// THE INVENTORY
// ══════════════════════════════════════════════════════════════════════════════

export const WORKS: Work[] = [
  // ─── MAJOR ──────────────────────────────────────────────────────────────────
  {
    slug: 'atelier', title: 'Atelier', year: '2026', cat: 'web', weight: 'major', era: 'college',
    state: 'live', layers: ['origin'], spell: 'self-summoning',
    circle: { base: 'summoning' }, // the "you are here" piece keeps its self-reference
    blurb: "The site you're on. A canvas grid of ~2,300 points morphs into magic circles — and a portrait — as you scroll.",
    role: 'Design & build', period: 'Jan–Mar 2026',
    links: [{ label: 'Live', href: '/' }, { label: 'Repo', href: 'https://github.com/CJ-Uy/atelier' }],
    casting: [
      'I wanted a portfolio that felt cast rather than coded — where the same grid of points could become my face, a spider web, an astrolabe, a blueprint. The whole site runs on one idea: a field of ~2,300 vertices morphed between target shapes on scroll, with an annotation layer that inks labels exactly onto the geometry.',
      "The hardest part was registration — getting the SVG annotations to land pixel-perfect on a canvas grid that scales with the viewport. The trick was measuring the canvas's real rendered width rather than the window's.",
    ],
    tags: ['Astro', 'Canvas', 'React'], plates: 3, video: true,
    coven: [{ name: 'Charles J. Uy', role: 'Everything' }],
  },
  {
    slug: 'ally-meera', title: 'Ally → Meera', year: '2026', cat: 'ai', weight: 'major', era: 'college',
    state: 'archived', layers: ['award', 'ai', 'community'], spell: 'evolution',
    blurb: 'Two agents, one bracket — Ally cleared the heats, Meera was conjured for the finals. Third in the nation.',
    role: 'AI / agents', period: 'KPMG · R.G. Manabat AIC 2026', org: 'AIC 2026 — 2nd Runner-Up',
    casting: [
      "Two separate builds for the KPMG / R.G. Manabat Academic Innovation Challenge — Ally for the eliminations, Meera for the finals. The prompts were completely different, so they're distinct projects: same team, same competition, a deliberate evolution from one round to the next.",
      'Second runner-up — third in the nation. The jump from Ally to Meera is the story: what we learned in the heats, rebuilt for the final stage.',
    ],
    tags: ['Agents', 'LLM', 'Next.js'], plates: 2,
    // Q10: add teammates
  },
  {
    slug: 'a-long-walk-back', title: 'A Long Walk Back', year: '2026', cat: 'editorial', weight: 'major', era: 'college',
    state: 'live', layers: ['award', 'community'], spell: 'remembrance',
    blurb: 'A 3D editorial walk through memory, built for The GUIDON. Won Especially Outstanding Interactive.',
    role: 'Project lead · interactive', org: 'The GUIDON', period: 'Editorial interactive',
    casting: [
      "A scroll-driven 3D editorial for The GUIDON — a long walk back through a space rebuilt from memory, with archival TV and photo fragments surfacing as you move.",
      'It won the Especially Outstanding Interactive award. The hardest part was making a heavy 3D scene feel weightless on a phone.',
    ],
    tags: ['Three.js', '3D', 'Editorial'], plates: 3, video: true,
    // Q10: add teammates
  },
  {
    slug: 'arsa-ecosystem', title: 'ARSA Digital Ecosystem', year: '2025', cat: 'systems', weight: 'major', era: 'college',
    state: 'live', layers: ['systems', 'commerce', 'ocr', 'leadership', 'community'], spell: 'dominion',
    blurb: 'The machine that runs an org: shop, ticketing, GCash OCR, admin. ₱250k+ passed through it.',
    role: 'Lead developer', org: 'ARSA', period: '2024–2026',
    casting: [
      'ARSA needed one system instead of ten spreadsheets — a hub with a shop, event management, ticketing, shortlinks, and GCash receipt OCR feeding the admin tools.',
      'Over ₱250k+ has moved through it. Building payments-adjacent tooling for a real org taught me more about edge cases than any class.',
    ],
    tags: ['Full-stack', 'OCR', 'Payments'], plates: 3,
  },
  {
    slug: 'simula', title: 'Sim.ula', year: '2026', cat: 'ai', weight: 'major', era: 'college',
    state: 'archived', layers: ['award', 'ai', 'civic', 'map'], spell: 'augury',
    blurb: 'Feed it a city and a policy; it simulates the fallout. GraphRAG, maps, an LLM oracle.',
    role: 'AI / simulation', org: 'Blue Hacks 2026 — 2nd Runner-Up', period: 'Hackathon',
    casting: [
      'An urban-policy sandbox: describe a policy and Sim.ula projects its second-order effects across a city, grounding an LLM in a GraphRAG knowledge graph and a live map.',
      'Blue Hacks 2026, second runner-up. The graph retrieval is what kept the model honest.',
    ],
    tags: ['GraphRAG', 'LLM', 'Maps'], plates: 2,
    // Q10: add teammates (compsat/bh26-WeJustKen)
  },
  {
    slug: 'readsmart', title: 'READSmart', year: '2026', cat: 'research', weight: 'major', era: 'college',
    state: 'in-progress', layers: ['research', 'ai', 'data', 'community'], spell: 'diction',
    blurb: 'A child reads aloud; it scores fluency, accuracy and WER. A reading workspace for teachers.',
    role: 'Research & build', period: 'Ongoing',
    casting: [
      'An oral-reading-fluency workspace: upload a recording of a student reading, and it computes words-correct-per-minute, accuracy, and word-error-rate against the passage.',
      'The pipeline — audio in, alignment, scoring — is the interesting part. Built so a teacher never sees the machinery, only the numbers that matter.',
    ],
    tags: ['Speech', 'Python', 'Data'], plates: 2,
  },

  // ─── STRONG ───────────────────────────────────────────────────────────────
  {
    slug: 'schrollar', title: 'Schrollar', year: '2026', cat: 'research', weight: 'strong', era: 'college',
    state: 'archived', layers: ['award', 'research', 'community'], spell: 'discourse',
    blurb: 'Papers become posts, citations become replies — academic reading as a feed.',
    role: 'Frontend & UX', org: 'Hackfest 2026: AXIS — 2nd Runner-Up', period: 'Hackathon · 48h',
    casting: [
      "The premise: reading papers shouldn't mean ten open tabs. Schrollar reframes a paper as a post and its citations as a thread of replies — you read the conversation, not the PDF.",
      'Hackfest 2026, second runner-up.',
    ],
    tags: ['Next.js', 'Reader', 'API'], plates: 2,
    // repo: hackfest26-admulto (was titled "Ad Multo" in the original page)
  },
  {
    slug: 'klutch', title: 'Klutch', year: '2025', cat: 'ai', weight: 'strong', era: 'college',
    state: 'archived', layers: ['award', 'ai', 'commerce', 'community'], spell: 'barter',
    blurb: 'A gig marketplace for blue-collar work, with AI that tags jobs to the right hands.',
    role: 'Developer', org: 'DLSU Hacker Cup 2025 — 2nd Runner-Up', period: 'Hackathon',
    tags: ['Marketplace', 'AI tagging'], plates: 1,
  },
  {
    slug: 'qc-loop', title: 'QC Loop', year: '2025', cat: 'ai', weight: 'strong', era: 'college',
    state: 'prototype', layers: ['civic', 'map', 'community'], spell: 'circuit',
    blurb: 'Closing the loop between residents and the city. Startup QC finalist, into Squad 3.',
    role: 'Co-founder / dev', org: 'Startup QC — Finalist', period: 'Mentorship cohort',
    tags: ['Civic tech', 'Maps'], plates: 1,
  },
  {
    slug: 'konsultulong', title: 'KonsulTulong', year: '2025', cat: 'systems', weight: 'strong', era: 'college',
    state: 'prototype', layers: ['research', 'data', 'community'], spell: 'triage',
    blurb: 'Pre-consult intake for small clinics — patients sorted before they reach the doctor.',
    role: 'Developer', period: 'Health-tech build',
    tags: ['Forms', 'Triage', 'Health'], plates: 1,
  },
  {
    slug: 'blank-board', title: 'Blank Board', year: '2025', cat: 'web', weight: 'strong', era: 'college',
    state: 'live', layers: ['realtime', 'systems'], spell: 'telepathy',
    blurb: 'A collaborative whiteboard; stickies land on every client in under 40ms.',
    role: 'Full-stack', period: 'Side project',
    casting: [
      'A whiteboard where presence feels instant. A minimal drops API on Cloudflare Durable Objects + WebSockets keeps round-trips under 40ms, with a pattern-login so there are no passwords to forget.',
      'It started as an excuse to understand Durable Objects. It ended as the tool my study group actually uses.',
    ],
    tags: ['SvelteKit', 'Durable Objects', 'WS'], plates: 3, video: true,
    coven: [{ name: 'Charles J. Uy', role: 'Everything' }],
  },
  {
    slug: 'agila', title: 'Agila', year: '2025', cat: 'systems', weight: 'strong', era: 'professional',
    state: 'live', layers: ['systems', 'leadership'], spell: 'decree',
    blurb: 'Company-wide requests and approvals for AKIVA — forms in, sign-offs out.',
    role: 'Team lead', org: 'AKIVA', period: 'Freelance',
    tags: ['Workflow', 'Enterprise'], plates: 0,
    // private/client — no links
  },
  {
    slug: 'rails', title: 'RAILS', year: '2024', cat: 'systems', weight: 'strong', era: 'highschool',
    state: 'live', layers: ['systems', 'research', 'data'], spell: 'ledger',
    blurb: 'Lab reservations and inventory, run for PSHS-EVC.',
    role: 'Full-stack', org: 'PSHS-EVC', period: 'School system',
    tags: ['Inventory', 'Reservations'], plates: 0,
  },
  {
    slug: 'guidon-archives', title: 'The GUIDON Archives', year: '2025', cat: 'editorial', weight: 'strong', era: 'college',
    state: 'live', layers: ['systems', 'data', 'ocr'], spell: 'recollection',
    blurb: 'Decades of issues parsed and made searchable — PDFs into a queryable archive.',
    role: 'Developer', org: 'The GUIDON', period: 'Archive platform',
    tags: ['PDF', 'Parsing', 'Storage'], plates: 0,
  },
  {
    slug: 'cyber-flag-rush', title: 'Cyber Flag Rush', year: '2025', cat: 'systems', weight: 'strong', era: 'college',
    state: 'archived', layers: ['award', 'community'], spell: 'breach',
    blurb: 'Capture-the-flag at Ateneo. Second runner-up.',
    role: 'Competitor (team Cicada Too)', org: 'Ateneo · Oct 2025', period: 'CTF',
    tags: ['Security', 'CTF'], plates: 0,  },
  {
    slug: 'learn2dev', title: 'Learn2Dev', year: '2026', cat: 'practice', weight: 'strong', era: 'college',
    state: 'live', layers: ['teaching', 'community'], spell: 'tutelage',
    blurb: 'Trainer and module-writer for modern full-stack — teaching the stack I use daily.',
    role: 'Trainer / mentor / module writer', period: '2026',
    tags: ['Teaching', 'Full-stack'], plates: 0,
  },
  {
    slug: 'gdn-redesign', title: 'GDN Main Redesign', year: '2026', cat: 'editorial', weight: 'strong', era: 'college',
    state: 'in-progress', layers: ['community'], spell: 'revision',
    blurb: "A redesign of The GUIDON's website — the org's front page, reimagined.",
    role: 'Developer', org: 'The GUIDON', period: 'Redesign',
    tags: ['Web', 'Redesign'], plates: 0,
  },
  {
    slug: 'common-grounds', title: 'Common Grounds', year: '2025', cat: 'web', weight: 'strong', era: 'college',
    state: 'archived', layers: ['commerce', 'community'], spell: 'commons',
    blurb: 'A community marketplace — DIY projects, merch, events, a book club, commissions.',
    role: 'Full-stack', period: 'Class project',
    tags: ['Django', 'Marketplace'], plates: 0,
    // Q10: team (itsalexi/commongrounds-1)
  },
  {
    slug: 'keybound', title: 'Keybound', year: '2024', cat: 'play', weight: 'strong', era: 'college',
    state: 'archived', layers: ['game'], spell: 'incantation',
    blurb: 'A Java game cast in spells — elements, maps, local and online lobbies.',
    role: 'Developer', period: 'Class project',
    tags: ['Java', 'Game', 'Sockets'], plates: 1,
    // Q10: team (DrawdEA/keybound-game)
  },
  {
    slug: 'project-sinag', title: 'Project Sinag', year: '2025', cat: 'systems', weight: 'strong', era: 'college',
    state: 'archived', layers: ['award', 'civic', 'map', 'community'], spell: 'beacon',
    blurb: 'A disaster-reporting geomap. Blue Hacks 2025 Top 10.',
    role: 'Developer', org: 'Blue Hacks 2025 — Top 10', period: 'Hackathon',
    tags: ['Maps', 'Civic tech'], plates: 0,
    // Q10: team (MCCODERS)
  },
  {
    slug: 'akiva-lead', title: 'AKIVA — Team Lead', year: '2025', cat: 'practice', weight: 'strong', era: 'professional',
    state: 'live', layers: ['leadership', 'systems'], spell: 'stewardship',
    blurb: 'Leading a dev team building custom software that automates a company\'s legacy systems.',
    role: 'Freelance Software Developer & Team Lead', org: 'AKIVA', period: 'Ongoing',
    tags: ['Leadership', 'Systems'], plates: 0,
    // private/client — no links
  },
  {
    slug: 'guidon-staffer', title: 'GUIDON Digital Dev', year: '2025', cat: 'practice', weight: 'strong', era: 'college',
    state: 'live', layers: ['community'], spell: 'service',
    blurb: 'Digital Development staffer — web interactives, and project lead for A Long Walk Back.',
    role: 'Digital Development Staffer', org: 'The GUIDON', period: 'Ongoing',
    tags: ['Interactives', 'Web'], plates: 0,
  },
  {
    slug: 'surtix', title: 'Surtix', year: '2026', cat: 'practice', weight: 'strong', era: 'professional',
    state: 'in-progress', layers: ['leadership'], spell: 'commencement',
    blurb: 'Incoming Operations Analyst — the next chapter, starting July.',
    role: 'Operations Analyst (incoming)', org: 'Surtix', period: 'From July 2026',
    tags: ['Operations'], plates: 0,
    // professional — no links
  },

  // ─── SUPPORTING ─────────────────────────────────────────────────────────────
  {
    slug: 'harbor-ph', title: 'Harbor PH', year: '2025', cat: 'web', weight: 'supporting', era: 'college',
    state: 'archived', layers: ['commerce', 'community'], spell: 'moorage',
    blurb: 'Event discovery and ticketing, with organization management built in.',
    role: 'Contributor', period: 'Platform',
    tags: ['Events', 'Ticketing'], plates: 0,
  },
  {
    slug: 'food-stubs-portal', title: 'Food Stubs Portal', year: '2025', cat: 'systems', weight: 'supporting', era: 'college',
    state: 'live', layers: ['systems', 'community'], spell: 'provision',
    blurb: 'Automating monthly food-stub distribution for the Ateneo Scholarship Office.',
    role: 'Developer', org: 'Ateneo Scholarship Office', period: 'Ops tool',
    tags: ['Sheets', 'Admin'], plates: 0,
    // private/internal — no links
  },
  {
    slug: 'service-hours-portal', title: 'Service Hours Portal', year: '2025', cat: 'systems', weight: 'supporting', era: 'college',
    state: 'live', layers: ['data', 'community'], spell: 'tally',
    blurb: 'A read-only portal where Ateneo scholars track service hours against requirements.',
    role: 'Developer', org: 'Ateneo Scholarship Office', period: 'Ops tool',
    tags: ['Sheets', 'Progress'], plates: 0,
    // private/internal — no links
  },
  {
    slug: 'arsafest-ticketing', title: 'ARSAFest Ticketing', year: '2025', cat: 'systems', weight: 'supporting', era: 'college',
    state: 'live', layers: ['commerce', 'community'], spell: 'passage',
    blurb: 'A QR ticket generator and verifier for ARSA events.',
    role: 'Developer', org: 'ARSA', period: 'Event ops',
    tags: ['QR', 'Ticketing'], plates: 0,
  },
  {
    slug: 'flowerfest-shop', title: 'ARSA FlowerFest Shop', year: '2025', cat: 'systems', weight: 'supporting', era: 'college',
    state: 'live', layers: ['commerce', 'community'], spell: 'bloom-order',
    blurb: 'A seasonal shop for managing and fulfilling flower deliveries.',
    role: 'Developer', org: 'ARSA', period: 'Seasonal ops',
    tags: ['Commerce', 'Orders'], plates: 0,
  },
  {
    slug: 'code-nest', title: 'Ateneo CODE Nest', year: '2025', cat: 'web', weight: 'supporting', era: 'college',
    state: 'live', layers: ['community'], spell: 'roost',
    blurb: "CODE's public site and member portal.",
    role: 'Developer', org: 'Ateneo CODE', period: 'Org platform',
    tags: ['Portal', 'Org'], plates: 0,
  },
  {
    slug: 'ateneo-event-registration', title: 'Ateneo Event Registration', year: '2025', cat: 'systems', weight: 'supporting', era: 'college',
    state: 'archived', layers: ['community'], spell: 'enrolment',
    blurb: 'An event registration system for campus events.',
    role: 'Contributor', period: 'Web app',
    tags: ['Forms', 'Events'], plates: 0,
  },
  {
    slug: 'project-pagsaca', title: 'Project PAGSACA', year: '2023', cat: 'research', weight: 'supporting', era: 'highschool',
    state: 'prototype', layers: ['research', 'hardware'], spell: 'photosynthesis',
    blurb: 'Vertical farming fused with plant microbial fuel cells, electroculture, and organic solar.',
    role: 'Researcher', period: 'Sustainability research',
    tags: ['Agriculture', 'Energy'], plates: 0,
  },
  {
    slug: 'bio-tech-or-terror', title: 'Bio: Tech or Terror', year: '2024', cat: 'web', weight: 'supporting', era: 'college',
    state: 'archived', layers: ['research'], spell: 'contagion',
    blurb: 'A biotech / biowarfare educational site with a COVID scientist simulator.',
    role: 'Developer', period: 'Class project',
    tags: ['Education', 'Science'], plates: 0,
  },
  {
    slug: 'collage-generator', title: 'Collage Generator', year: '2024', cat: 'tools', weight: 'supporting', era: 'college',
    state: 'live', layers: ['data'], spell: 'mosaic',
    blurb: 'A photo-mosaic generator — color matching, date filtering, batch processing.',
    role: 'Author', period: 'Tool',
    tags: ['Python', 'Imaging'], plates: 0,
  },
  {
    slug: 'seam-carver', title: 'Seam Carver', year: '2024', cat: 'tools', weight: 'supporting', era: 'college',
    state: 'archived', layers: ['data'], spell: 'unstitch',
    blurb: 'Content-aware image resizing with a GUI — seams carved by energy.',
    role: 'Developer', period: 'Class project',
    tags: ['Python', 'Algorithm'], plates: 0,
    // Q10: team (itsalexi/CSCI30-Final-Project)
  },
  {
    slug: 'ateneo-zen-garden', title: 'Ateneo Zen Garden', year: '2024', cat: 'play', weight: 'supporting', era: 'college',
    state: 'archived', layers: [], spell: 'stillness',
    blurb: 'A Java scene renderer of campus — custom drawing classes, objects, and music.',
    role: 'Developer', period: 'Creative-code project',
    tags: ['Java', 'Graphics'], plates: 1,
  },
  {
    slug: 'java-sockets-game', title: 'JavaSocketsGame', year: '2024', cat: 'play', weight: 'supporting', era: 'college',
    state: 'prototype', layers: ['game', 'realtime'], spell: 'volley',
    blurb: 'A socket-based shooter + chatroom — a networking learning project.',
    role: 'Author', period: 'Learning project',
    tags: ['Java', 'Sockets'], plates: 0,
  },
  {
    slug: 'nomic', title: 'Nomic', year: '2025', cat: 'tools', weight: 'supporting', era: 'college',
    state: 'live', layers: [], spell: 'voice',
    blurb: 'A Discord text-to-speech bot with persistent per-user voice settings.',
    role: 'Author', period: 'Tool',
    tags: ['Discord', 'TTS'], plates: 0,
  },
  {
    slug: 'jarvis', title: 'Jarvis', year: '2025', cat: 'tools', weight: 'supporting', era: 'college',
    state: 'prototype', layers: ['ai'], spell: 'familiar',
    blurb: 'A personal AI assistant on Cloudflare Workers, powered by the Hermes agent.',
    role: 'Author', period: 'Personal tool',
    tags: ['AI', 'Workers'], plates: 0,
  },
  {
    slug: 'pdf-png', title: 'PDFGetPNG', year: '2025', cat: 'tools', weight: 'supporting', era: 'college',
    state: 'live', layers: [], spell: 'extraction',
    blurb: 'A client-side PDF-page-to-PNG exporter — no upload, all in the browser.',
    role: 'Author', period: 'Tool',
    tags: ['PDF', 'Browser'], plates: 0,
  },
  {
    slug: 'qr-forge', title: 'QR / FORGE', year: '2025', cat: 'tools', weight: 'supporting', era: 'college',
    state: 'live', layers: [], spell: 'encoding',
    blurb: 'A QR generator and customizer.',
    role: 'Author', period: 'Tool',
    tags: ['QR', 'Browser'], plates: 0,
  },
  {
    slug: 'memorize-baybayin', title: 'Memorize Baybayin', year: '2025', cat: 'tools', weight: 'supporting', era: 'college',
    state: 'live', layers: ['teaching'], spell: 'script',
    blurb: 'A Baybayin flashcard trainer — learning the old script, one glyph at a time.',
    role: 'Author', period: 'Tool',
    tags: ['SvelteKit', 'Flashcards'], plates: 0,
  },
  {
    slug: 'dna-barcode-generator', title: 'DNA Barcode Generator', year: '2024', cat: 'research', weight: 'supporting', era: 'highschool',
    state: 'live', layers: ['research', 'data'], spell: 'sequence',
    blurb: 'Fetches mtDNA from NCBI and visualizes it as a barcode — grew out of an earlier team version.',
    role: 'Developer', period: 'Bioinformatics tool',
    tags: ['Bioinformatics', 'Viz'], plates: 0,
  },
  {
    slug: 'navio', title: 'Navio', year: '2025', cat: 'systems', weight: 'supporting', era: 'college',
    state: 'prototype', layers: ['map', 'hardware', 'realtime'], spell: 'wayfinding',
    blurb: 'A wearable GPS tracker — know where someone (or something) is, in real time.',
    role: 'Developer', period: 'Prototype',
    tags: ['GPS', 'Hardware'], plates: 0,
  },
  {
    slug: 'artest-of-fate', title: 'ArTest of Fate', year: '2022', cat: 'editorial', weight: 'supporting', era: 'highschool',
    state: 'archived', layers: ['community', 'origin'], spell: 'gallery',
    blurb: 'An online gallery for a school-wide SportsFest art competition.',
    role: 'Developer', period: 'School event',
    tags: ['Gallery', 'Web'], plates: 0,
  },
  {
    slug: 'ajr-website', title: 'AJR Website', year: '2020', cat: 'web', weight: 'supporting', era: 'highschool',
    state: 'live', layers: ['origin'], spell: 'genesis',
    blurb: 'One of my first spells, still live at ajr.cjuy.dev.',
    role: 'Author', period: 'First website',
    links: [{ label: 'Live', href: 'https://ajr.cjuy.dev' }],
    tags: ['HTML', 'CSS'], plates: 0,
  },
  {
    slug: 'compsat-developer', title: 'CompSAt Developer', year: '2025', cat: 'practice', weight: 'supporting', era: 'college',
    state: 'live', layers: ['community'], spell: 'guild',
    blurb: 'Web projects for clients and student communities, under CompSAt.',
    role: 'Developer', org: 'CompSAt', period: 'Ongoing',
    tags: ['Community', 'Web'], plates: 0,
  },
  {
    slug: 'code-consulting', title: 'CODE Consulting', year: '2025', cat: 'practice', weight: 'supporting', era: 'college',
    state: 'live', layers: ['leadership', 'community'], spell: 'counsel',
    blurb: 'Consultants for Organization Development & Empowerment.',
    role: 'Consultant', org: 'Ateneo CODE', period: 'Ongoing',
    tags: ['Consulting', 'Org dev'], plates: 0,
  },
  {
    slug: 'arsa-operations', title: 'ARSA Operations', year: '2026', cat: 'practice', weight: 'supporting', era: 'college',
    state: 'live', layers: ['leadership', 'community'], spell: 'orchestration',
    blurb: "Running ARSA's flagship events — Seniors' Send-Off, SIDLAK, the Year-End Party.",
    role: 'Operations lead', org: 'ARSA', period: '2025–2026',
    tags: ['Events', 'Leadership'], plates: 0,
  },

  // ─── ARCHIVE (compact) ──────────────────────────────────────────────────────
  {
    slug: 'quick-click', title: 'Quick Click', year: '2021', cat: 'play', weight: 'archive', era: 'highschool',
    state: 'archived', layers: ['game', 'origin'], spell: 'reflex',
    blurb: 'An HTML/CSS/JS reaction game.', period: 'Early web',
  },
  {
    slug: 'game-of-generals', title: 'Game of the Generals', year: '2021', cat: 'play', weight: 'archive', era: 'highschool',
    state: 'prototype', layers: ['game', 'origin'], spell: 'stratagem',
    blurb: 'A browser prototype of Game of the Generals.', period: 'Early web',
  },
  {
    slug: 'harder-hangman', title: 'Moderately Harder Hangman', year: '2021', cat: 'play', weight: 'archive', era: 'highschool',
    state: 'archived', layers: ['game', 'origin'], spell: 'guesswork',
    blurb: 'A hangman variant, tuned to be unfair.', period: 'School project',
  },
  {
    slug: 'dodging-dots', title: 'Dodging Dots', year: '2022', cat: 'play', weight: 'archive', era: 'highschool',
    state: 'archived', layers: ['game', 'origin'], spell: 'evasion',
    blurb: 'A Java Swing game — menu, gameplay, high scores.', period: 'School project',
  },
  {
    slug: 'acre-prototype', title: 'ACRE Prototype', year: '2022', cat: 'systems', weight: 'archive', era: 'highschool',
    state: 'prototype', layers: ['data', 'hardware', 'origin'], spell: 'cultivation',
    blurb: 'A farm dashboard prototype — inventory, calendar, 3D views.', period: 'Early systems',
  },
  {
    slug: 'receipt-processor', title: 'Automated Receipt Processor', year: '2022', cat: 'systems', weight: 'archive', era: 'highschool',
    state: 'archived', layers: ['ocr', 'origin'], spell: 'reckoning',
    blurb: 'Early PTA receipt OCR — the precursor to later GCash work.', period: 'Early systems',
  },
  {
    slug: 'online-amazing-race', title: 'Online Amazing Race', year: '2022', cat: 'play', weight: 'archive', era: 'highschool',
    state: 'archived', layers: ['game', 'origin'], spell: 'pursuit',
    blurb: 'An interactive course-card activity.', period: 'School activity',
  },
  {
    slug: 'sf-freedom-wall', title: 'SF Freedom Wall', year: '2023', cat: 'web', weight: 'archive', era: 'highschool',
    state: 'archived', layers: ['community', 'origin'], spell: 'murmur',
    blurb: 'A hosted freedom wall with bad-word filtering.', period: 'Social web',
  },
  {
    slug: 'coke-bottle-equation', title: 'Coke Bottle Equation', year: '2024', cat: 'research', weight: 'archive', era: 'highschool',
    state: 'archived', layers: ['data', 'origin'], spell: 'modeling',
    blurb: 'A math-modeling artifact — graphs and 3D-ish curves of a Coke bottle.', period: 'School artifact',
  },
  {
    slug: 'website-survey', title: 'A Website Survey', year: '2021', cat: 'web', weight: 'archive', era: 'highschool',
    state: 'archived', layers: ['data', 'origin'], spell: 'preference',
    blurb: 'A survey that restyles itself based on your answers.', period: 'Early web',
  },
  {
    slug: 'csci-30-midterm', title: 'CSCI 30 Midterm', year: '2024', cat: 'tools', weight: 'archive', era: 'college',
    state: 'archived', layers: [], spell: 'coursework',
    blurb: 'A CSCI 30 midterm project.', period: 'Class project',
    // TODO: distinguish from the other CSCI midterm — add specifics
  },
  {
    slug: 'csci-midterm', title: 'CSCI Midterm Project', year: '2024', cat: 'tools', weight: 'archive', era: 'college',
    state: 'archived', layers: [], spell: 'coursework',
    blurb: 'A CSCI midterm project.', period: 'Class project',
    // TODO: distinguish from the CSCI 30 midterm — add specifics
  },
  {
    slug: 'recipebook', title: 'Recipebook', year: '2024', cat: 'tools', weight: 'archive', era: 'college',
    state: 'archived', layers: [], spell: 'recipe',
    blurb: 'A Python class project — a recipe book.', period: 'Class project',
  },
  {
    slug: 'sari-sari-checkout', title: 'Sari-Sari Self Checkout', year: '2025', cat: 'systems', weight: 'archive', era: 'college',
    state: 'prototype', layers: ['commerce'], spell: 'tally-store',
    blurb: 'A self-checkout prototype for a neighborhood store.', period: 'Prototype',
  },
  {
    slug: 'sample-pdf-generator', title: 'Sample PDF Generator', year: '2025', cat: 'tools', weight: 'archive', era: 'college',
    state: 'live', layers: [], spell: 'document',
    blurb: 'A small document-automation utility for sample PDFs/forms.', period: 'Utility',
  },
  {
    slug: 'dont-leaf-it-to-chance', title: "Don't Leaf It to Chance", year: '2023', cat: 'research', weight: 'archive', era: 'highschool',
    state: 'archived', layers: ['research', 'origin'], spell: 'toxicology',
    blurb: 'DNA-barcoding toxicology research (from CV).', period: 'Research',  },
  {
    slug: 'tab-propellers', title: 'TaB Propellers', year: '2022', cat: 'research', weight: 'archive', era: 'highschool',
    state: 'archived', layers: ['research', 'hardware', 'origin'], spell: 'thrust',
    blurb: 'Physics/engineering research on propellers and flow (from CV).', period: 'Research',  },
  {
    slug: 'spin-battery', title: 'SPIn Battery', year: '2022', cat: 'research', weight: 'archive', era: 'highschool',
    state: 'archived', layers: ['research', 'hardware', 'origin'], spell: 'inertia',
    blurb: 'An energy-storage mechanical concept (from CV).', period: 'Research',  },
  {
    slug: 'good-bad-medium', title: 'The Good, the Bad, and the Medium', year: '2023', cat: 'research', weight: 'archive', era: 'highschool',
    state: 'archived', layers: ['research', 'origin'], spell: 'study',
    blurb: 'An education / social-study research piece (from CV).', period: 'Research',
  },
  {
    slug: 'botos', title: 'Botos', year: '2022', cat: 'systems', weight: 'archive', era: 'highschool',
    state: 'archived', layers: ['civic', 'community', 'origin'], spell: 'suffrage',
    blurb: 'A Django election system I forked and self-hosted so the whole school could run its elections.',
    role: 'Forked & self-hosted', period: 'School elections · G11–12',
    tags: ['Django', 'Self-hosted'], plates: 0,
  },
];
