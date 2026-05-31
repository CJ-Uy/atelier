<!-- src/components/home/FacetDiagram.svelte
     ANNOTATION layer for the hero spell circles. The morphing canvas grid forms
     each spell's skeleton (rings, spokes, diamonds, arms); this transparent,
     full-viewport SVG is locked to the grid's exact coordinate space
     (same centre, same scale = min(w,h)*0.48) and inks only what the grid
     cannot: rotating inscription bands, ticks, dimension lines, the lone
     vermilion accent. Faithful port of facet-diagrams.jsx (GridDiagram). -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { SPELL_GEO } from '../../lib/grid/GridStates';

  const INK = '#0a0a0a';
  const VERM = '#dc3522';
  const MONO = "'IBM Plex Mono', monospace";
  const TAU = Math.PI * 2;

  // ── reactive viewport + scroll state ──
  let w = $state(typeof window !== 'undefined' ? window.innerWidth : 1280);
  let h = $state(typeof window !== 'undefined' ? window.innerHeight : 800);
  let variant = $state<string>('face');
  let progress = $state(0);
  let fade = $state(1);
  const accent = true; // vermilion accent on (design default)

  const cx = $derived(w / 2);
  const cy = $derived(h / 2);
  const scale = $derived(Math.min(w, h) * 0.48);
  // settle: 1 at rest (a circle is fully formed), 0 mid-morph
  const settle = $derived(1 - 4 * progress * (1 - progress));
  const op = $derived(Math.max(0, Math.min(1, settle)) * fade);

  // normalized [-1,1] → screen px, sharing the grid engine's transform
  const px = (nx: number) => cx + nx * scale;
  const py = (ny: number) => cy - ny * scale;

  onMount(() => {
    const measure = () => {
      const cv = document.getElementById('grid-canvas');
      w = (cv && cv.clientWidth) || window.innerWidth;
      h = (cv && cv.clientHeight) || window.innerHeight;
    };
    measure();
    setTimeout(measure, 60);
    window.addEventListener('resize', measure);

    window.addEventListener('atelier:grid-progress', (e) => {
      const d = (e as CustomEvent<{ stateName: string; progress: number; fade: number }>).detail;
      variant = d.stateName;
      progress = d.progress;
      fade = d.fade;
    });

    return () => window.removeEventListener('resize', measure);
  });

  // ── geometry helpers (computed per variant) ──
  const uid = Math.random().toString(36).slice(2, 8);

  // web dew droplets riding the capture spiral
  const webDew = $derived.by(() => {
    const G = SPELL_GEO.web;
    const spec: [number, number][] = [[1, 0.34], [4, 0.72], [7, 0.52], [9, 0.92], [12, 0.34], [15, 0.72]];
    return spec.map(([spoke, frac]) => {
      const a = spoke * (TAU / G.N);
      const rr = G.frame[spoke] * frac;
      return { x: px(G.hubX + Math.cos(a) * rr), y: py(G.hubY + Math.sin(a) * rr) };
    });
  });
  const webHub = $derived({ x: px(SPELL_GEO.web.hubX), y: py(SPELL_GEO.web.hubY) });

  // astrolabe degree ticks + cardinal letters
  const astTicks = $derived.by(() => {
    const G = SPELL_GEO.astrolabe;
    const r1 = G.rings[G.rings.length - 1];
    return Array.from({ length: G.N }, (_, i) => {
      const a = i * (TAU / G.N);
      const long = i % 6 === 0;
      const r2 = r1 + (long ? 0.045 : 0.025);
      return {
        x1: px(Math.cos(a) * r1), y1: py(Math.sin(a) * r1),
        x2: px(Math.cos(a) * r2), y2: py(Math.sin(a) * r2),
        long,
      };
    });
  });
  const astCardinals = $derived.by(() => {
    const G = SPELL_GEO.astrolabe;
    const rr = G.rings[G.rings.length - 1] + 0.08;
    return ([['N', 0, -1], ['E', 1, 0], ['S', 0, 1], ['W', -1, 0]] as [string, number, number][])
      .map(([l, dx, dy]) => ({ l, x: px(dx * rr), y: py(dy * rr) }));
  });
  const astAlidadeR = $derived(SPELL_GEO.astrolabe.rings[SPELL_GEO.astrolabe.rings.length - 1] * scale);

  // venn — discipline labels at the three ring centres + centroid accent
  const vennLabels = $derived.by(() => {
    const G = SPELL_GEO.venn;
    const names = ['CS', 'SCI', 'HUM'];
    return G.centers.map((c, i) => ({ l: names[i], x: px(c[0]), y: py(c[1]) }));
  });

  // planisphere stars + ecliptic
  const planStars = $derived.by(() => {
    const spec: [number, number][] = [[0.3, -0.4], [-0.5, 0.2], [0.6, 0.5], [-0.3, -0.6], [0.1, 0.7], [0.45, -0.15], [-0.6, -0.3]];
    return spec.map(([sx, sy], i) => ({ x: px(sx), y: py(sy), r: scale * (i % 3 === 0 ? 0.012 : 0.007) }));
  });
  const planConstellation = $derived.by(() => {
    const s = planStars;
    return s.length >= 6 ? `M ${s[0].x} ${s[0].y} L ${s[5].x} ${s[5].y} L ${s[2].x} ${s[2].y}` : '';
  });

  // rosette CMYK registration dots
  const rosDots = $derived.by(() =>
    ([[VERM, 0], [INK, 90], [INK, 180], [INK, 270]] as [string, number][]).map(([col, deg]) => {
      const a = (deg * Math.PI) / 180, rr = 0.5;
      return { col, x: px(Math.cos(a) * rr), y: py(Math.sin(a) * rr) };
    }),
  );

  // banig diamond-tip crosses
  const banigTips = $derived.by(() => {
    const fr = SPELL_GEO.banig.rings[SPELL_GEO.banig.rings.length - 1];
    return ([[0, fr], [fr, 0], [0, -fr], [-fr, 0]] as [number, number][]).map(([bx, by]) => ({ x: px(bx), y: py(by) }));
  });

  // blueprint corner crosses + dimension line
  const bpCorners = $derived.by(() => {
    const f = SPELL_GEO.blueprint.frame;
    return ([[-f, f], [f, f], [f, -f], [-f, -f]] as [number, number][]).map(([bx, by]) => ({ x: px(bx), y: py(by) }));
  });
  // dimension line along the bottom edge, with arrowheads + measurement
  const bpDim = $derived.by(() => {
    const f = SPELL_GEO.blueprint.frame;
    const ax = px(-f), ay = py(-f), bx = px(f), by = py(-f);
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    const side = 1;
    const nx = (-dy / len) * side, ny = (dx / len) * side;
    const off = scale * 0.1;
    const a2x = ax + nx * off, a2y = ay + ny * off;
    const b2x = bx + nx * off, b2y = by + ny * off;
    const ah = scale * 0.022, ux = dx / len, uy = dy / len;
    const arrow = (tx: number, ty: number, dir: number) =>
      `M ${tx} ${ty} L ${tx - dir * ux * ah + nx * ah * 0.5} ${ty - dir * uy * ah + ny * ah * 0.5} L ${tx - dir * ux * ah - nx * ah * 0.5} ${ty - dir * uy * ah - ny * ah * 0.5} Z`;
    return {
      ax, ay, bx, by, a2x, a2y, b2x, b2y, ah, nx, ny,
      mx: (a2x + b2x) / 2, my: (a2y + b2y) / 2,
      arrowA: arrow(a2x, a2y, -1), arrowB: arrow(b2x, b2y, 1),
    };
  });

  // inscription circle path (rotating rim text)
  const INSCRIPTIONS: Record<string, string> = {
    web: '· WORLD WIDE WEB · DEVELOPER · BUILD · SHIP · ITERATE ',
    venn: '· BETWEEN FIELDS · CS · SCIENCE · HUMANITIES · MEASURE ',
    astrolabe: '· ASTROLABE · MEASURE · OBSERVE · RESEARCH · ',
    planisphere: '· PLANISPHERE · CHART · DREAM · NAVIGATE · ',
    waveform: '· WAVEFORM · BASS · LOW END · LOOP · ',
    rosette: '· HALFTONE · CMYK · SIGNAL · NOISE · ',
    banig: '· BANIG · TIKOG · WEAVE · LEYTE · ',
    blueprint: '· BLUEPRINT · DRAFT · MEASURE · BUILD · ',
  };
  const inscription = $derived(INSCRIPTIONS[variant] ?? '');
  const inscR = $derived(scale * 0.99);
  const inscFs = $derived(scale * 0.03);
  const inscPath = $derived(`M ${cx - inscR},${cy} a ${inscR},${inscR} 0 1,1 ${inscR * 2},0 a ${inscR},${inscR} 0 1,1 ${-inscR * 2},0`);
</script>

<svg
  class="facet-diagram"
  width={w}
  height={h}
  style={`opacity:${op}`}
  aria-hidden="true"
>
  <!-- rotating inscription band, shared by all spells -->
  {#if inscription}
    <g class="spin-slow" style={`transform-origin:${cx}px ${cy}px`}>
      <defs><path id={`ins-${uid}`} d={inscPath} fill="none" /></defs>
      <text font-family={MONO} font-size={inscFs} fill={INK} letter-spacing={inscFs * 0.22} font-weight="600">
        <textPath href={`#ins-${uid}`} startOffset="0">{inscription}</textPath>
      </text>
    </g>
  {/if}

  {#if variant === 'web'}
    {#each webDew as d}
      <circle cx={d.x} cy={d.y} r={scale * 0.011} fill="#faf9f6" stroke={VERM} stroke-width="0.9" />
      <circle cx={d.x - scale * 0.003} cy={d.y - scale * 0.003} r={scale * 0.003} fill={VERM} opacity="0.5" />
    {/each}
    <circle cx={webHub.x} cy={webHub.y} r={scale * 0.016} fill={accent ? VERM : INK} />

  {:else if variant === 'venn'}
    {#each vennLabels as v}
      <text x={v.x} y={v.y} text-anchor="middle" dominant-baseline="central"
        font-family={MONO} font-size={scale * 0.04} font-weight="700" fill={INK}>{v.l}</text>
    {/each}
    <circle cx={cx} cy={cy} r={scale * 0.018} fill={accent ? VERM : INK} />

  {:else if variant === 'astrolabe'}
    {#each astTicks as t}
      <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={INK} stroke-width={t.long ? 1 : 0.5} opacity="0.8" />
    {/each}
    {#each astCardinals as c}
      <text x={c.x} y={c.y} text-anchor="middle" dominant-baseline="central"
        font-family={MONO} font-size={scale * 0.04} font-weight="700" fill={INK}>{c.l}</text>
    {/each}
    <g class="spin-med" style={`transform-origin:${cx}px ${cy}px`}>
      <line x1={cx - astAlidadeR} y1={cy} x2={cx + astAlidadeR} y2={cy} stroke={accent ? VERM : INK} stroke-width="1.5" />
      <circle cx={cx} cy={cy} r={scale * 0.02} fill="none" stroke={accent ? VERM : INK} stroke-width="1" />
    </g>

  {:else if variant === 'planisphere'}
    <ellipse cx={cx} cy={cy} rx={scale * 0.82} ry={scale * 0.34}
      fill="none" stroke={accent ? VERM : INK} stroke-width="1.2"
      transform={`rotate(-18 ${cx} ${cy})`} opacity="0.85" />
    {#each planStars as s}
      <circle cx={s.x} cy={s.y} r={s.r} fill={INK} />
    {/each}
    <path d={planConstellation} fill="none" stroke={INK} stroke-width="0.6" opacity="0.5" />

  {:else if variant === 'waveform'}
    <circle cx={cx} cy={cy} r={scale * 0.05} fill="none" stroke={INK} stroke-width="1" />
    <circle cx={cx} cy={cy} r={scale * 0.008} fill={INK} />
    <g class="spin-fast" style={`transform-origin:${cx}px ${cy}px`}>
      <line x1={cx} y1={cy} x2={cx + scale * 0.96} y2={cy} stroke={accent ? VERM : INK} stroke-width="1.2" opacity="0.9" />
    </g>

  {:else if variant === 'rosette'}
    {#each rosDots as d}
      <circle cx={d.x} cy={d.y} r={scale * 0.02} fill={d.col} opacity="0.85" />
    {/each}
    <g stroke={accent ? VERM : INK} stroke-width="1">
      <line x1={cx - scale * 0.05} y1={cy} x2={cx + scale * 0.05} y2={cy} />
      <line x1={cx} y1={cy - scale * 0.05} x2={cx} y2={cy + scale * 0.05} />
    </g>
    <circle cx={cx} cy={cy} r={scale * 0.05} fill="none" stroke={accent ? VERM : INK} stroke-width="0.8" />

  {:else if variant === 'banig'}
    {#each banigTips as t}
      <g stroke={INK} stroke-width="1">
        <line x1={t.x - scale * 0.03} y1={t.y} x2={t.x + scale * 0.03} y2={t.y} />
        <line x1={t.x} y1={t.y - scale * 0.03} x2={t.x} y2={t.y + scale * 0.03} />
      </g>
    {/each}
    <rect x={cx - scale * 0.04} y={cy - scale * 0.04} width={scale * 0.08} height={scale * 0.08}
      fill="none" stroke={INK} stroke-width="1" transform={`rotate(45 ${cx} ${cy})`} />

  {:else if variant === 'blueprint'}
    <!-- dimension line -->
    <line x1={bpDim.ax} y1={bpDim.ay} x2={bpDim.a2x + bpDim.nx * bpDim.ah * 0.6} y2={bpDim.a2y + bpDim.ny * bpDim.ah * 0.6} stroke={VERM} stroke-width="0.6" opacity="0.6" />
    <line x1={bpDim.bx} y1={bpDim.by} x2={bpDim.b2x + bpDim.nx * bpDim.ah * 0.6} y2={bpDim.b2y + bpDim.ny * bpDim.ah * 0.6} stroke={VERM} stroke-width="0.6" opacity="0.6" />
    <line x1={bpDim.a2x} y1={bpDim.a2y} x2={bpDim.b2x} y2={bpDim.b2y} stroke="#faf9f6" stroke-width="3.4" stroke-opacity="0.7" />
    <line x1={bpDim.a2x} y1={bpDim.a2y} x2={bpDim.b2x} y2={bpDim.b2y} stroke={VERM} stroke-width="1.3" />
    <path d={bpDim.arrowA} fill={VERM} />
    <path d={bpDim.arrowB} fill={VERM} />
    <rect x={bpDim.mx - scale * 0.05} y={bpDim.my - scale * 0.018} width={scale * 0.1} height={scale * 0.036} fill="#faf9f6" opacity="0.9" />
    <text x={bpDim.mx} y={bpDim.my} text-anchor="middle" dominant-baseline="central" font-family={MONO} font-size={scale * 0.024} font-weight="600" fill={VERM}>1.00</text>
    <!-- corner crosses -->
    {#each bpCorners as c}
      <g stroke={INK} stroke-width="1">
        <line x1={c.x - scale * 0.03} y1={c.y} x2={c.x + scale * 0.03} y2={c.y} />
        <line x1={c.x} y1={c.y - scale * 0.03} x2={c.x} y2={c.y + scale * 0.03} />
      </g>
    {/each}
    <circle cx={cx} cy={cy} r={scale * 0.014} fill={accent ? VERM : INK} />
  {/if}
</svg>

<style>
  .facet-diagram {
    position: fixed;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    transition: opacity 200ms ease;
  }
  /* rotating layers — keyframes scoped here so the diagram is self-contained */
  .spin-slow { animation: fdRotate 240s linear infinite; }
  .spin-med  { animation: fdRotate 80s linear infinite; }
  .spin-fast { animation: fdRotate 12s linear infinite; }
  @keyframes fdRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
