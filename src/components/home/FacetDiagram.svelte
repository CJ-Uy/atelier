<!-- src/components/home/FacetDiagram.svelte
     ANNOTATION layer for the hero spell circles. The morphing canvas grid forms
     each spell's skeleton (rings, spokes, diamonds, arms); this transparent,
     full-viewport SVG is locked to the grid's exact coordinate space
     (same centre, same scale = min(w,h)*0.48) and inks only what the grid
     cannot: rotating inscription bands, degree/label text, fine ticks, discipline
     crossings, dimension lines, the lone vermilion accent.

     Faithful port of the design's facet-diagrams.jsx (GridDiagram) — every
     annotation body (web · astrolabe · venn · planisphere · waveform · rosette ·
     banig · blueprint) reproduced so each facet reads exactly as the reference. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { SPELL_GEO } from '../../lib/grid/GridStates';

  const INK = '#0a0a0a';
  const VERM = '#dc3522';
  // "living"/moving parts — vermilion, drawn on top with a paper halo + bolder
  // stroke so they read over the dense grid. (Matches the reference's INK2.)
  const INK2 = '#dc3522';
  const PAPER = '#faf9f6';
  const MONO = "'IBM Plex Mono', monospace";
  const TAU = Math.PI * 2;
  const accent = true; // vermilion accent on (design default)

  // ── reactive viewport + scroll state ──
  let w = $state(typeof window !== 'undefined' ? window.innerWidth : 1280);
  let h = $state(typeof window !== 'undefined' ? window.innerHeight : 800);
  let variant = $state<string>('face');
  let progress = $state(0);
  let fade = $state(1);

  const cx = $derived(w / 2);
  const cy = $derived(h / 2);
  const scale = $derived(Math.min(w, h) * 0.48);
  // settle: 1 at rest (a circle is fully formed), 0 mid-morph
  const settle = $derived(1 - 4 * progress * (1 - progress));
  const op = $derived(Math.max(0, Math.min(1, settle)) * fade);

  // normalized grid units [-1,1] → screen px, sharing the grid engine's transform
  const P = (gx: number, gy: number): [number, number] => [cx + gx * scale, cy - gy * scale];

  const uid = Math.random().toString(36).slice(2, 8);

  onMount(() => {
    const measure = () => {
      const cv = document.getElementById('grid-canvas');
      w = (cv && cv.clientWidth) || window.innerWidth;
      h = (cv && cv.clientHeight) || window.innerHeight;
    };
    measure();
    const t = setTimeout(measure, 60);
    window.addEventListener('resize', measure);

    const onProg = (e: Event) => {
      const d = (e as CustomEvent<{ stateName: string; progress: number; fade: number }>).detail;
      variant = d.stateName;
      progress = d.progress;
      fade = d.fade;
    };
    window.addEventListener('atelier:grid-progress', onProg);

    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
      window.removeEventListener('atelier:grid-progress', onProg);
    };
  });

  // ── Inscription band — rotating rim text, one per spell ──
  const GD_INSCRIPTION: Record<string, { text: string; speed: number }> = {
    web:         { text: ' OH WHAT A TANGLED WEB WE WEAVE · WORLD WIDE WEB · DEVELOPER ·', speed: 240 },
    astrolabe:   { text: ' ASPIRING RESEARCHER · WHAT LIES BETWEEN † KNOWN & UNKNOWN †', speed: 280 },
    venn:        { text: ' ASPIRING RESEARCHER · CS ∩ SCIENCE ∩ HUMANITIES · WHAT LIES BETWEEN ·', speed: 280 },
    planisphere: { text: ' BIG DREAMER ✦ NAVIGATOR ✦ LEYTE ✦ 14·XI·2006 ✦', speed: 320 },
    waveform:    { text: ' INTO MUSIC · 音楽 · LOW END THEORY · FOUR STRINGS ·', speed: 280 },
    rosette:     { text: ' DIGITAL MEDIA ◉ PIXELS ◉ SIGNAL ◉ NOISE ◉', speed: 250 },
    banig:       { text: ' LEYTE · WARAY · KABISAY-AN · BASEY · BURI ·', speed: 320 },
    blueprint:   { text: ' MEASURE TWICE · CUT ONCE · BUILDING THINGS · DRAFT · MAKE ·', speed: 240 },
  };
  const inscription = $derived(GD_INSCRIPTION[variant]);
  const inscR = $derived(scale * 0.99);
  const inscFs = $derived(scale * 0.030);
  const inscPath = $derived(
    `M ${cx - inscR},${cy} a ${inscR},${inscR} 0 1,1 ${inscR * 2},0 a ${inscR},${inscR} 0 1,1 ${-inscR * 2},0`,
  );

  // ── helpers ──
  function mulberry32(seed: number) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function waveAmp(i: number, N: number): number {
    const t = i / N;
    return Math.abs(
      Math.sin(t * TAU * 9) * 0.5 + Math.sin(t * TAU * 23 + 1) * 0.3 + Math.sin(t * TAU * 4) * 0.2,
    ) * (0.45 + 0.55 * Math.abs(Math.sin(t * TAU)));
  }

  // ── web (developer) — dew highlights + hub accent ──
  const webDewSpec: [number, number][] = [[1, 0.34], [4, 0.72], [7, 0.52], [9, 0.92], [12, 0.34], [15, 0.72]];
  function webDew() {
    const G = SPELL_GEO.web;
    return webDewSpec.map(([spoke, frac]) => {
      const a = spoke * (TAU / G.N);
      const rr = G.frame[spoke] * frac;
      const [x, y] = P(G.hubX + Math.cos(a) * rr, G.hubY + Math.sin(a) * rr);
      return { x, y };
    });
  }

  // ── astrolabe (researcher · alt) — protractor + rete + measured-angle ──
  function astTicks() {
    const G = SPELL_GEO.astrolabe;
    const outR = G.rings[G.rings.length - 1];
    const out: { x1: number; y1: number; x2: number; y2: number; long: boolean }[] = [];
    for (let d = 0; d < 360; d += 15) {
      const a = (d / 360) * TAU - Math.PI / 2;
      const long = d % 45 === 0;
      const r1 = outR, r2 = outR - (long ? 0.05 : 0.028);
      const [x1, y1] = P(Math.cos(a) * r1, Math.sin(a) * r1);
      const [x2, y2] = P(Math.cos(a) * r2, Math.sin(a) * r2);
      out.push({ x1, y1, x2, y2, long });
    }
    return out;
  }
  function astLabels() {
    const G = SPELL_GEO.astrolabe;
    const outR = G.rings[G.rings.length - 1];
    const out: { x: number; y: number; d: number }[] = [];
    for (let d = 0; d < 360; d += 30) {
      const a = (d / 360) * TAU - Math.PI / 2;
      const [x, y] = P(Math.cos(a) * (outR - 0.10), Math.sin(a) * (outR - 0.10));
      out.push({ x, y, d });
    }
    return out;
  }
  const AST_RETE = [0, 0.5, 1.0, 1.5].map((k) => k * Math.PI + 0.2);

  // ── venn (researcher · default) — field labels + "you are here" ──
  const VENN_FIELDS = ['CS', 'SCIENCE', 'HUMANITIES'];
  function vennCentroid(): [number, number] {
    const c = SPELL_GEO.venn.centers;
    return [(c[0][0] + c[1][0] + c[2][0]) / 3, (c[0][1] + c[1][1] + c[2][1]) / 3];
  }

  // ── planisphere (big dreamer) — seeded star field + constellations ──
  const PLAN_OUTR = 0.86;
  const PLAN_STARS = (() => {
    const rng = mulberry32(20061114);
    const arr: { a: number; rr: number; mag: number }[] = [];
    for (let i = 0; i < 48; i++) {
      const a = rng() * TAU, rr = Math.sqrt(rng()) * PLAN_OUTR * 0.94, mag = rng();
      arr.push({ a, rr, mag });
    }
    return arr;
  })();
  const PLAN_BRIGHT = PLAN_STARS.reduce((bi, s, i, arr) => (s.mag > arr[bi].mag ? i : bi), 0);
  const PLAN_CONSTS = [[2, 9, 17, 23, 28], [5, 12, 19, 26, 33], [38, 41, 44, 46]];
  const PLAN_INCONST = new Set(PLAN_CONSTS.flat());
  const PLAN_CARDS: [string, number][] = [['S', -Math.PI / 2], ['E', 0], ['N', Math.PI / 2], ['W', Math.PI]];
  function planStarXY(i: number): [number, number] {
    const s = PLAN_STARS[i];
    return P(Math.cos(s.a) * s.rr, Math.sin(s.a) * s.rr);
  }
  function constPath(group: number[]): string {
    return 'M ' + group.map((i) => { const [x, y] = planStarXY(i); return `${x.toFixed(1)} ${y.toFixed(1)}`; }).join(' L ');
  }

  // ── waveform (music) — groove rings + peak accent + stamps ──
  const WAVE_STAMPS: [string, number][] = [
    ['120 BPM', -Math.PI * 0.75], ['4/4', -Math.PI * 0.25], ['A min', Math.PI * 0.25], ['33⅓', Math.PI * 0.75],
  ];
  function wavePeak() {
    const G = SPELL_GEO.waveform;
    let peakI = 0, peakV = 0;
    for (let i = 0; i < G.N; i++) { const v = waveAmp(i, G.N); if (v > peakV) { peakV = v; peakI = i; } }
    const pa = (peakI / G.N) * TAU;
    const pr = G.inner + Math.min(1, peakV) * (G.outer - G.inner);
    const [x, y] = P(Math.cos(pa) * pr, Math.sin(pa) * pr);
    return { x, y };
  }

  // ── rosette (digital media) — offset halftone screens ──
  function rosetteDots() {
    const outR = 0.96 * scale;
    const step = scale * 0.075;
    const dotR = step * 0.40;
    const angles = [0, 15, 75, 45];
    const dots: { x: number; y: number; r: number; fill: boolean }[] = [];
    angles.forEach((ang) => {
      const rad = (ang * Math.PI) / 180, cos = Math.cos(rad), sin = Math.sin(rad);
      const n = Math.ceil(outR / step) + 1;
      for (let gx = -n; gx <= n; gx++) for (let gy = -n; gy <= n; gy++) {
        const lx = gx * step, ly = gy * step;
        const x = cx + lx * cos - ly * sin, y = cy + lx * sin + ly * cos;
        const dc = Math.hypot(x - cx, y - cy);
        if (dc > outR) continue;
        dots.push({ x, y, r: dotR, fill: dc < outR * 0.16 });
      }
    });
    return dots;
  }

  // ── banig (Waray) — cardinal knots + Baybayin band + centre diamond ──
  const BANIG_KNOTS = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];

  // ── blueprint (building things) — dimension lines + title block ──
  function dimLine(ax: number, ay: number, bx: number, by: number, side: number) {
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * side, ny = (dx / len) * side;
    const off = scale * 0.10;
    const a2x = ax + nx * off, a2y = ay + ny * off;
    const b2x = bx + nx * off, b2y = by + ny * off;
    const ah = scale * 0.022, ux = dx / len, uy = dy / len;
    const arrow = (tx: number, ty: number, dir: number) =>
      `M ${tx} ${ty} L ${tx - dir * ux * ah + nx * ah * 0.5} ${ty - dir * uy * ah + ny * ah * 0.5} L ${tx - dir * ux * ah - nx * ah * 0.5} ${ty - dir * uy * ah - ny * ah * 0.5} Z`;
    return {
      a2x, a2y, b2x, b2y, ah, nx, ny,
      mx: (a2x + b2x) / 2, my: (a2y + b2y) / 2,
      arrowA: arrow(a2x, a2y, -1), arrowB: arrow(b2x, b2y, 1),
    };
  }
</script>

<svg class="facet-diagram" width={w} height={h} style={`opacity:${op}`} aria-hidden="true">
  <!-- rotating inscription band, shared by all spells -->
  {#if inscription}
    <g class="spin" style={`transform-origin:${cx}px ${cy}px; --dur:${inscription.speed}s`}>
      <defs><path id={`ins-${uid}`} d={inscPath} fill="none" /></defs>
      <text font-family={MONO} font-size={inscFs} fill={INK} letter-spacing={inscFs * 0.22} font-weight="600">
        <textPath href={`#ins-${uid}`} startOffset="0">{inscription.text}</textPath>
      </text>
    </g>
  {/if}

  {#if variant === 'web'}
    {@const G = SPELL_GEO.web}
    {@const hub = P(G.hubX, G.hubY)}
    {#each webDew() as d}
      <circle cx={d.x} cy={d.y} r={scale * 0.011} fill={PAPER} stroke={INK2} stroke-width="0.9" />
      <circle cx={d.x - scale * 0.003} cy={d.y - scale * 0.003} r={scale * 0.003} fill={INK2} opacity="0.5" />
    {/each}
    <circle cx={hub[0]} cy={hub[1]} r={scale * 0.016} fill={accent ? VERM : INK} />
    <circle cx={hub[0]} cy={hub[1]} r={scale * 0.032} fill="none" stroke={accent ? VERM : INK} stroke-width="1.2" />

  {:else if variant === 'astrolabe'}
    {@const G = SPELL_GEO.astrolabe}
    {@const outR = G.rings[G.rings.length - 1]}
    {@const fs = scale * 0.020}
    {@const measureDeg = 52}
    {@const armR = outR * 0.98}
    {@const sightA = (-measureDeg * Math.PI) / 180}
    {@const ref = P(Math.cos(0) * armR, 0)}
    {@const z = P(0, 0)}
    {@const sA = P(Math.cos(sightA) * armR, Math.sin(sightA) * armR)}
    {@const sB = P(-Math.cos(sightA) * armR * 0.5, -Math.sin(sightA) * armR * 0.5)}
    {@const arcR = 0.40}
    {@const a0 = P(arcR, 0)}
    {@const a1 = P(Math.cos(sightA) * arcR, Math.sin(sightA) * arcR)}
    {@const rd = P(Math.cos(sightA / 2) * (arcR + 0.13), Math.sin(sightA / 2) * (arcR + 0.13))}
    {@const lbl = P(0.40, 0.52)}
    {#each astTicks() as t}
      <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={INK} stroke-width={t.long ? 1.1 : 0.6} opacity="0.65" />
    {/each}
    {#each astLabels() as l}
      <text x={l.x} y={l.y} text-anchor="middle" dominant-baseline="central" font-family={MONO} font-size={fs * 0.9} fill={INK} opacity="0.5">{l.d}°</text>
    {/each}
    <line x1={z[0]} y1={z[1]} x2={ref[0]} y2={ref[1]} stroke={INK} stroke-width="1" stroke-dasharray="4 4" opacity="0.55" />
    <!-- rotating rete star-pointer -->
    <g class="spin" style={`transform-origin:${cx}px ${cy}px; --dur:150s`}>
      {#each AST_RETE as a}
        {@const tip = P(Math.cos(a) * 0.66, Math.sin(a) * 0.66)}
        {@render halo(`M ${cx} ${cy} L ${tip[0]} ${tip[1]}`, INK2, 1.4, 0.9, 2.6)}
        <path d={`M ${tip[0]} ${tip[1]} l -4 -4 l 8 0 z`} fill={INK2} />
        <circle cx={tip[0]} cy={tip[1]} r={scale * 0.009} fill={PAPER} stroke={INK2} stroke-width="1" />
      {/each}
    </g>
    <!-- measured-angle arc + readout -->
    {@const arcPath = `M ${a0[0]} ${a0[1]} A ${arcR * scale} ${arcR * scale} 0 0 0 ${a1[0]} ${a1[1]}`}
    <path d={arcPath} fill="none" stroke={PAPER} stroke-width="4" stroke-opacity="0.7" />
    <path d={arcPath} fill="none" stroke={accent ? VERM : INK} stroke-width="1.6" />
    <rect x={rd[0] - scale * 0.05} y={rd[1] - scale * 0.022} width={scale * 0.10} height={scale * 0.044} fill={PAPER} opacity="0.92" />
    <text x={rd[0]} y={rd[1]} text-anchor="middle" dominant-baseline="central" font-family={MONO} font-size={scale * 0.03} font-weight="700" fill={accent ? VERM : INK}>{measureDeg}°</text>
    <!-- bold sighting arm (alidade) -->
    <line x1={sB[0]} y1={sB[1]} x2={sA[0]} y2={sA[1]} stroke={PAPER} stroke-width="6" stroke-opacity="0.7" />
    <line x1={sB[0]} y1={sB[1]} x2={sA[0]} y2={sA[1]} stroke={INK} stroke-width="2.4" stroke-linecap="round" />
    <rect x={sA[0] - 4} y={sA[1] - 9} width="8" height="18" fill={PAPER} stroke={INK} stroke-width="1.2" transform={`rotate(${(sightA * 180) / Math.PI + 90} ${sA[0]} ${sA[1]})`} />
    <circle cx={sA[0]} cy={sA[1]} r={scale * 0.008} fill={INK} />
    <!-- discipline-crossing label -->
    <rect x={lbl[0] - scale * 0.078} y={lbl[1] - scale * 0.022} width={scale * 0.156} height={scale * 0.044} rx="2" fill={PAPER} stroke={INK} stroke-width="0.6" opacity="0.95" />
    <text x={lbl[0]} y={lbl[1]} text-anchor="middle" dominant-baseline="central" font-family={MONO} font-size={fs} font-weight="600" fill={INK}>CS ∩ HCI</text>
    <!-- centre pivot -->
    <circle cx={z[0]} cy={z[1]} r={scale * 0.03} fill={PAPER} stroke={INK} stroke-width="1.4" />
    <circle cx={z[0]} cy={z[1]} r={scale * 0.008} fill={INK} />

  {:else if variant === 'venn'}
    {@const G = SPELL_GEO.venn}
    {@const fs = scale * 0.024}
    {@const centroid = vennCentroid()}
    {#each G.centers as ct, i}
      {@const vx = ct[0] - centroid[0]}
      {@const vy = ct[1] - centroid[1]}
      {@const len = Math.hypot(vx, vy) || 1}
      {@const lp = P(ct[0] + (vx / len) * 0.34, ct[1] + (vy / len) * 0.34)}
      {@const boxW = VENN_FIELDS[i].length * fs * 0.6 + scale * 0.036}
      <rect x={lp[0] - boxW / 2} y={lp[1] - scale * 0.024} width={boxW} height={scale * 0.048} rx="3" fill={PAPER} stroke={INK} stroke-width="0.7" opacity="0.95" />
      <text x={lp[0]} y={lp[1]} text-anchor="middle" dominant-baseline="central" font-family={MONO} font-size={fs} font-weight="700" fill={INK}>{VENN_FIELDS[i]}</text>
    {/each}
    {#each [[0, 1], [1, 2], [0, 2]] as pair}
      {@const mp = P((G.centers[pair[0]][0] + G.centers[pair[1]][0]) / 2, (G.centers[pair[0]][1] + G.centers[pair[1]][1]) / 2)}
      <text x={mp[0]} y={mp[1]} text-anchor="middle" dominant-baseline="central" font-family={MONO} font-size={fs * 0.6} fill={INK2} font-weight="600">∩</text>
    {/each}
    {@const ctr = P(centroid[0], centroid[1])}
    <circle cx={ctr[0]} cy={ctr[1]} r={scale * 0.05} fill={accent ? VERM : INK} opacity="0.12" />
    <circle cx={ctr[0]} cy={ctr[1]} r={scale * 0.013} fill={accent ? VERM : INK} />
    <text x={ctr[0]} y={ctr[1] + scale * 0.075} text-anchor="middle" font-family={MONO} font-size={fs * 0.62} font-weight="700" fill={accent ? VERM : INK} stroke={PAPER} stroke-width="2.6" paint-order="stroke">you are here</text>
    {@const note = P(-0.92, -0.86)}
    <text x={note[0]} y={note[1]} font-family={MONO} font-size={fs * 0.6} fill={INK} opacity="0.55">A ∩ B ∩ C ≠ ∅</text>

  {:else if variant === 'planisphere'}
    {@const fs = scale * 0.026}
    {@const lode = planStarXY(PLAN_BRIGHT)}
    {@const ea = P(-PLAN_OUTR, 0)}
    {@const eb = P(PLAN_OUTR, 0)}
    <defs><clipPath id={`pln-${uid}`}><circle cx={cx} cy={cy} r={PLAN_OUTR * scale} /></clipPath></defs>
    <g clip-path={`url(#pln-${uid})`}>
      <g class="spin" style={`transform-origin:${cx}px ${cy}px; --dur:300s`}>
        <!-- ecliptic -->
        <line x1={ea[0]} y1={ea[1]} x2={eb[0]} y2={eb[1]} stroke={INK} stroke-width="0.7" stroke-dasharray="5 5" opacity="0.4" transform={`rotate(-13 ${cx} ${cy})`} />
        <!-- constellation lines -->
        {#each PLAN_CONSTS as ch}
          {@render halo(constPath(ch), INK2, 1.5, 0.95, 3)}
        {/each}
        <!-- field stars -->
        {#each PLAN_STARS as s, i}
          {#if i !== PLAN_BRIGHT}
            {@const xy = planStarXY(i)}
            {@const charted = PLAN_INCONST.has(i)}
            {@const rr = charted ? scale * 0.011 : Math.max(1, (0.6 + s.mag * (scale * 0.006)) * 1.5)}
            {#if charted}<circle cx={xy[0]} cy={xy[1]} r={rr + 1.4} fill={PAPER} opacity="0.8" />{/if}
            <circle cx={xy[0]} cy={xy[1]} r={rr} fill={charted ? INK2 : INK} opacity={charted ? 1 : 0.5 + s.mag * 0.5} />
          {/if}
        {/each}
        <!-- lodestar (vermilion accent) -->
        <circle cx={lode[0]} cy={lode[1]} r={scale * 0.018} fill={PAPER} opacity="0.85" />
        <circle cx={lode[0]} cy={lode[1]} r={scale * 0.013} fill={accent ? VERM : INK2} />
        <text x={lode[0] + 7} y={lode[1] - 6} font-family={MONO} font-size={fs * 0.6} font-weight="700" fill={accent ? VERM : INK2} stroke={PAPER} stroke-width="2.4" paint-order="stroke" opacity="0.95">POLARIS</text>
      </g>
    </g>
    {#each PLAN_CARDS as card}
      {@const xy = P(Math.cos(card[1]) * (PLAN_OUTR + 0.10), Math.sin(card[1]) * (PLAN_OUTR + 0.10))}
      <text x={xy[0]} y={xy[1]} text-anchor="middle" dominant-baseline="central" font-family={MONO} font-size={fs} font-weight="700" fill={INK} opacity="0.7">{card[0]}</text>
    {/each}

  {:else if variant === 'waveform'}
    {@const G = SPELL_GEO.waveform}
    {@const fs = scale * 0.020}
    {@const o = P(0, 0)}
    {@const peak = wavePeak()}
    <circle cx={o[0]} cy={o[1]} r={G.inner * scale} fill="none" stroke={INK} stroke-width="0.8" opacity="0.7" />
    <circle cx={o[0]} cy={o[1]} r={G.inner * scale * 0.62} fill="none" stroke={INK} stroke-width="0.45" opacity="0.45" />
    <circle cx={o[0]} cy={o[1]} r={scale * 0.012} fill={INK} />
    {#if accent}<circle cx={peak.x} cy={peak.y} r={scale * 0.013} fill={VERM} />{/if}
    {#each WAVE_STAMPS as st}
      {@const xy = P(Math.cos(st[1]) * 1.05, Math.sin(st[1]) * 1.05)}
      <text x={xy[0]} y={xy[1]} text-anchor="middle" dominant-baseline="central" font-family={MONO} font-size={fs} fill={INK} opacity="0.6">{st[0]}</text>
    {/each}

  {:else if variant === 'rosette'}
    {@const o = P(0, 0)}
    {@const lbl = P(0.66, 0.66)}
    <defs><clipPath id={`ros-${uid}`}><circle cx={cx} cy={cy} r={0.96 * scale} /></clipPath></defs>
    <g clip-path={`url(#ros-${uid})`}>
      {#each rosetteDots() as d}
        <circle cx={d.x} cy={d.y} r={d.r} fill={d.fill ? INK : 'none'} stroke={INK} stroke-width="0.45" opacity="0.4" />
      {/each}
    </g>
    {@render cross(o[0], o[1], scale * 0.04, 1.4, accent ? VERM : INK, 1)}
    <circle cx={o[0]} cy={o[1]} r={scale * 0.024} fill="rgba(250,249,246,0.85)" stroke={accent ? VERM : INK} stroke-width="1.2" />
    <text x={lbl[0]} y={lbl[1]} font-family={MONO} font-size={scale * 0.020} fill={INK} opacity="0.6" text-anchor="middle">CMYK</text>

  {:else if variant === 'banig'}
    {@const baybayin = P(0, 1.16)}
    {@const ctr = P(0, 0)}
    {@const d = scale * 0.07}
    {#each BANIG_KNOTS as a}
      {@const xy = P(Math.cos(a) * 1.0, Math.sin(a) * 1.0)}
      <rect x={xy[0] - 5} y={xy[1] - 5} width="10" height="10" fill="rgba(250,249,246,0.85)" stroke={INK} stroke-width="1" transform={`rotate(45 ${xy[0]} ${xy[1]})`} />
      <circle cx={xy[0]} cy={xy[1]} r="2" fill={INK} />
    {/each}
    <text x={baybayin[0]} y={baybayin[1]} text-anchor="middle" dominant-baseline="central" font-family="'Noto Sans Tagalog', 'IBM Plex Mono', monospace" font-size={scale * 0.085} fill={INK} opacity="0.8">ᜏᜇᜌ᜔</text>
    <polygon points={`${ctr[0]},${ctr[1] - d} ${ctr[0] + d},${ctr[1]} ${ctr[0]},${ctr[1] + d} ${ctr[0] - d},${ctr[1]}`} fill={accent ? VERM : INK} />

  {:else if variant === 'blueprint'}
    {@const G = SPELL_GEO.blueprint}
    {@const V = G.verts}
    {@const fs = scale * 0.018}
    {@const top = P(V.top[0], V.top[1])}
    {@const ur = P(V.ur[0], V.ur[1])}
    {@const lr = P(V.lr[0], V.lr[1])}
    {@const ll = P(V.ll[0], V.ll[1])}
    {@const ul = P(V.ul[0], V.ul[1])}
    {@const bot = P(V.bot[0], V.bot[1])}
    {@const ctr = P(V.ctr[0], V.ctr[1])}
    <!-- dimension lines on the cube silhouette -->
    {@render dim(ur[0], ur[1], lr[0], lr[1], '85', 1)}
    {@render dim(bot[0], bot[1], ll[0], ll[1], '60', 1)}
    {@render dim(ul[0], ul[1], ll[0], ll[1], '85', -1)}
    <!-- 30° isometric angle callout at the top vertex -->
    {@const r = scale * 0.12}
    {@const ang0 = Math.atan2(ur[1] - top[1], ur[0] - top[0])}
    {@const ang1 = Math.atan2(ul[1] - top[1], ul[0] - top[0])}
    {@const s0 = [top[0] + Math.cos(ang0) * r, top[1] + Math.sin(ang0) * r]}
    {@const s1 = [top[0] + Math.cos(ang1) * r, top[1] + Math.sin(ang1) * r]}
    {@const amx = top[0]}
    {@const amy = top[1] + r * 1.5}
    <path d={`M ${s0[0]} ${s0[1]} A ${r} ${r} 0 0 1 ${s1[0]} ${s1[1]}`} fill="none" stroke={INK2} stroke-width="1.2" />
    <rect x={amx - scale * 0.04} y={amy - scale * 0.016} width={scale * 0.08} height={scale * 0.032} fill={PAPER} opacity="0.9" />
    <text x={amx} y={amy} text-anchor="middle" dominant-baseline="central" font-family={MONO} font-size={fs} font-weight="600" fill={INK2}>120°</text>
    <!-- centre-mark on the near-vertical edge -->
    {@render cross(ctr[0], ctr[1], scale * 0.018, 0.9, INK, 0.7)}
    <!-- revision balloon (vermilion accent) -->
    <circle cx={lr[0]} cy={lr[1]} r={scale * 0.024} fill={PAPER} stroke={accent ? VERM : INK} stroke-width="1.4" />
    <text x={lr[0]} y={lr[1]} text-anchor="middle" dominant-baseline="central" font-family={MONO} font-size={fs} font-weight="700" fill={accent ? VERM : INK}>A</text>
    <!-- title block, lower-right of the drawing sheet -->
    {@const tb = P(G.fr - 0.005, -G.fr + 0.005)}
    {@const tbW = scale * 0.46}
    {@const tbH = scale * 0.20}
    {@const tbX = tb[0] - tbW}
    {@const tbY = tb[1] - tbH}
    {@const rowH = tbH / 3}
    <g font-family={MONO}>
      <rect x={tbX} y={tbY} width={tbW} height={tbH} fill={PAPER} stroke={INK} stroke-width="1.1" opacity="0.96" />
      <line x1={tbX} y1={tbY + rowH} x2={tbX + tbW} y2={tbY + rowH} stroke={INK} stroke-width="0.6" />
      <line x1={tbX} y1={tbY + rowH * 2} x2={tbX + tbW} y2={tbY + rowH * 2} stroke={INK} stroke-width="0.6" />
      <line x1={tbX + tbW * 0.62} y1={tbY} x2={tbX + tbW * 0.62} y2={tbY + tbH} stroke={INK} stroke-width="0.6" />
      <text x={tbX + tbW * 0.31} y={tbY + rowH * 0.5} text-anchor="middle" dominant-baseline="central" font-size={fs * 1.05} font-weight="700" fill={INK}>BUILDING THINGS</text>
      <text x={tbX + tbW * 0.81} y={tbY + rowH * 0.5} text-anchor="middle" dominant-baseline="central" font-size={fs * 0.85} fill={INK} opacity="0.7">REV · A</text>
      <text x={tbX + tbW * 0.31} y={tbY + rowH * 1.5} text-anchor="middle" dominant-baseline="central" font-size={fs * 0.85} fill={INK} opacity="0.8">C. J. UY · DRAFTSMAN</text>
      <text x={tbX + tbW * 0.81} y={tbY + rowH * 1.5} text-anchor="middle" dominant-baseline="central" font-size={fs * 0.85} fill={INK} opacity="0.7">ISO · A3</text>
      <text x={tbX + tbW * 0.31} y={tbY + rowH * 2.5} text-anchor="middle" dominant-baseline="central" font-size={fs * 0.85} fill={INK} opacity="0.8">SCALE 1:2</text>
      <text x={tbX + tbW * 0.81} y={tbY + rowH * 2.5} text-anchor="middle" dominant-baseline="central" font-size={fs * 0.85} fill={INK} opacity="0.7">SHT 07</text>
    </g>
    <!-- sheet label, top-left -->
    {@const sl = P(-G.fr + 0.03, G.fr - 0.05)}
    <text x={sl[0]} y={sl[1]} font-family={MONO} font-size={fs * 0.95} font-weight="600" fill={INK} opacity="0.6">ISOMETRIC · NTS</text>
  {/if}
</svg>

<!-- ── reusable bits ──────────────────────────────────────────── -->
{#snippet halo(d: string, stroke: string, width: number, opacity: number, haloW: number)}
  <path d={d} fill="none" stroke={PAPER} stroke-width={width + haloW} stroke-opacity="0.72" stroke-linecap="round" />
  <path d={d} fill="none" stroke={stroke} stroke-width={width} stroke-opacity={opacity} stroke-linecap="round" />
{/snippet}

{#snippet cross(x: number, y: number, s: number, wd: number, color: string, opacity: number)}
  <g stroke={color} stroke-width={wd} opacity={opacity}>
    <line x1={x - s} y1={y} x2={x + s} y2={y} />
    <line x1={x} y1={y - s} x2={x} y2={y + s} />
  </g>
{/snippet}

{#snippet dim(ax: number, ay: number, bx: number, by: number, label: string, side: number)}
  {@const d = dimLine(ax, ay, bx, by, side)}
  <line x1={ax} y1={ay} x2={d.a2x + d.nx * d.ah * 0.6} y2={d.a2y + d.ny * d.ah * 0.6} stroke={INK2} stroke-width="0.6" opacity="0.6" />
  <line x1={bx} y1={by} x2={d.b2x + d.nx * d.ah * 0.6} y2={d.b2y + d.ny * d.ah * 0.6} stroke={INK2} stroke-width="0.6" opacity="0.6" />
  <line x1={d.a2x} y1={d.a2y} x2={d.b2x} y2={d.b2y} stroke={PAPER} stroke-width="3.4" stroke-opacity="0.7" />
  <line x1={d.a2x} y1={d.a2y} x2={d.b2x} y2={d.b2y} stroke={INK2} stroke-width="1.3" />
  <path d={d.arrowA} fill={INK2} />
  <path d={d.arrowB} fill={INK2} />
  <rect x={d.mx - scale * 0.05} y={d.my - scale * 0.018} width={scale * 0.10} height={scale * 0.036} fill={PAPER} opacity="0.9" />
  <text x={d.mx} y={d.my} text-anchor="middle" dominant-baseline="central" font-family={MONO} font-size={scale * 0.024} font-weight="600" fill={INK2}>{label}</text>
{/snippet}

<style>
  .facet-diagram {
    position: fixed;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    color: #0a0a0a;
    transition: opacity 140ms linear;
  }
  /* rotating layers — duration set per-spell via the --dur custom property so
     the keyframe stays scoped (inline `animation` would escape Svelte's rename). */
  .spin {
    animation: fdRotate var(--dur, 240s) linear infinite;
  }
  @keyframes fdRotate {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  :global(html[data-render-quality='economy']) .spin {
    animation: none;
  }
</style>
