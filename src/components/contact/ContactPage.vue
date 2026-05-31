<template>
  <!-- The Summoning — contact page with magic circle and sigil nodes -->
  <div class="contact-page">
    <!-- Header -->
    <header class="contact-header">
      <div class="contact-slug">
        <span class="rule" />
        ✦ CONTACT · SUMMON
        <span class="rule" />
      </div>
      <h1 class="contact-title">The Summoning</h1>
      <p class="contact-sub">
        Choose a channel. Trace the sigil. I'll answer.
      </p>
    </header>

    <!-- Desktop: summoning circle -->
    <div class="summoning-wrap" v-if="!isMobile">
      <!-- Charge lines SVG — behind the circle -->
      <svg :width="SIZE" :height="SIZE" class="charge-svg" aria-hidden="true">
        <template v-if="charging && hoveredPos">
          <line
            v-for="(_, i) in Array(5)"
            :key="i"
            :ref="el => { if (el) lineRefs[i] = el as SVGLineElement }"
            :x1="CENTER" :y1="CENTER"
            :x2="hoveredPos[0]" :y2="hoveredPos[1]"
            :stroke="VERMILION" stroke-width="1.5"
            class="cm-flow"
            :style="`animation-delay: ${i * 70}ms`"
          />
          <circle
            :cx="hoveredPos[0]" :cy="hoveredPos[1]"
            :r="DIMS.disc / 2 + 4"
            fill="none" :stroke="VERMILION" stroke-width="1.3"
            class="cm-pulsering"
          />
        </template>
      </svg>

      <!-- The circle -->
      <div class="circle-wrap" ref="circleWrapRef">
        <!-- SVG circle (pure CSS-animated) -->
        <svg
          :width="CIRCLE_SIZE" :height="CIRCLE_SIZE"
          :viewBox="`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`"
          class="mc-svg" aria-hidden="true"
          :style="`color: ${INK}; animation-duration: ${spinPeriod}s`"
        >
          <style>
            @keyframes mc-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes mc-rotate-rev { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
            @keyframes cm-flow-anim {
              0%,100% { stroke-dashoffset: 24; opacity: 0.5; }
              50% { stroke-dashoffset: 0; opacity: 1; }
            }
            @keyframes cm-pulse {
              0% { r: 20; opacity: 0.7; }
              100% { r: 36; opacity: 0; }
            }
            .cm-flow { stroke-dasharray: 4 4; animation: cm-flow-anim 0.6s linear infinite; }
            .cm-pulsering { animation: cm-pulse 0.8s ease-out infinite; }
          </style>

          <!-- Outer rings (rotating) -->
          <g :style="`transform-origin: ${MC}px ${MC}px; animation: mc-rotate linear infinite; animation-duration: ${spinPeriod}s`">
            <circle :cx="MC" :cy="MC" :r="OUTER_R" stroke="currentColor" stroke-width="0.7" opacity="0.6" fill="none" />
            <circle :cx="MC" :cy="MC" :r="OUTER_R * 0.96" stroke="currentColor" stroke-width="0.3" opacity="0.35" stroke-dasharray="2 4" fill="none" />
            <!-- Ticks -->
            <line v-for="i in 12" :key="i"
              :x1="MC + Math.cos((i-1)/12 * TAU) * OUTER_R * 0.90"
              :y1="MC + Math.sin((i-1)/12 * TAU) * OUTER_R * 0.90"
              :x2="MC + Math.cos((i-1)/12 * TAU) * OUTER_R"
              :y2="MC + Math.sin((i-1)/12 * TAU) * OUTER_R"
              stroke="currentColor" :stroke-width="(i-1) % 3 === 0 ? 0.9 : 0.5" opacity="0.7"
            />
            <!-- Rune text -->
            <defs>
              <path :id="runePathId"
                :d="`M ${MC - RUNE_R} ${MC} A ${RUNE_R} ${RUNE_R} 0 1 1 ${MC - RUNE_R + 0.001} ${MC}`"
              />
            </defs>
            <text :font-size="RUNE_R * 0.085" fill="currentColor" opacity="0.65"
              font-family="'IBM Plex Mono',monospace" letter-spacing="0.04em">
              <textPath :href="`#${runePathId}`">{{ contactRunes }}</textPath>
            </text>
          </g>

          <!-- Inner summoning pentagram (counter-rotating) -->
          <g :style="`transform-origin: ${MC}px ${MC}px; animation: mc-rotate-rev linear infinite; animation-duration: ${spinPeriod * 0.55}s`">
            <!-- Pentagram -->
            <circle :cx="MC" :cy="MC" :r="INNER_R * 0.4" fill="none" stroke="currentColor" stroke-width="0.7" />
            <path :d="pentaPath" fill="none" stroke="currentColor" stroke-width="1.2" />
            <!-- 5 satellite nodes -->
            <g v-for="(pt, i) in satPts" :key="i">
              <line :x1="pentaPts[i][0]" :y1="pentaPts[i][1]" :x2="pt[0]" :y2="pt[1]" stroke="currentColor" stroke-width="0.6" />
              <circle :cx="pt[0]" :cy="pt[1]" :r="INNER_R * 0.14" fill="none" stroke="currentColor" stroke-width="0.9" />
              <circle class="mc-summon-node" :cx="pt[0]" :cy="pt[1]" r="1.6" fill="currentColor" />
            </g>
          </g>
        </svg>
      </div>

      <!-- Core monogram (fixed, centred over the spinning circle) -->
      <div class="monogram" :class="{ charging }">
        <div class="monogram-ring" :class="{ charging }">
          <span class="monogram-text">CJ-Uy</span>
        </div>
        <div class="monogram-label" :style="{ color: charging ? VERMILION : '#888' }">
          {{ charging ? 'channelling' : 'summon' }}
        </div>
      </div>

      <!-- Sigil nodes -->
      <component
        v-for="ch in CHANNELS" :key="ch.id"
        :is="ch.href ? 'a' : 'div'"
        v-bind="ch.href ? { href: ch.href, target: ch.href.startsWith('http') ? '_blank' : undefined, rel: 'noopener noreferrer' } : {}"
        class="sigil-node"
        :style="sigilStyle(ch)"
        @mouseenter="hovered = ch.id"
        @mouseleave="hovered = null"
      >
        <!-- Disc -->
        <div class="sigil-disc" :class="{ live: hovered === ch.id && ch.href }" :style="discStyle(ch)">
          {{ ch.sigil }}
        </div>
        <!-- Label -->
        <div class="sigil-label" :style="labelStyle(ch)">
          <div class="sigil-label-name" :style="{ color: hovered === ch.id ? VERMILION : INK }">
            {{ ch.label }}
          </div>
          <div class="sigil-label-handle">{{ ch.handle }}</div>
        </div>
      </component>
    </div>

    <!-- Mobile: stacked list -->
    <div v-else class="mobile-channels">
      <a
        v-for="ch in CHANNELS" :key="ch.id"
        :href="ch.href" target="_blank" rel="noopener noreferrer"
        class="mobile-channel"
      >
        <span class="mobile-sigil" :class="{ accent: ch.accent }">{{ ch.sigil }}</span>
        <div>
          <div class="mobile-channel-label">{{ ch.label }}</div>
          <div class="mobile-channel-handle">{{ ch.handle }}</div>
        </div>
        <span class="mobile-arrow">↗</span>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, useId } from 'vue';

const INK = '#0a0a0a';
const VERMILION = '#dc3522';
const TAU = Math.PI * 2;

const CONTACT_RUNES = '· VOCA · SCRIBE · INVOCO · RESPONDEO · COLLOQVIVM · SOCIETAS · ADSVM ';

const CHANNELS = [
  { id: 'email',    sigil: '✉',  label: 'Email',    handle: 'charlesjoshuauy@gmail.com',     href: 'mailto:charlesjoshuauy@gmail.com', angle: -90, accent: true },
  { id: 'github',   sigil: 'GH', label: 'GitHub',   handle: 'CJ-Uy',                          href: 'https://github.com/CJ-Uy',         angle: -30 },
  { id: 'linkedin', sigil: 'in', label: 'LinkedIn', handle: 'in/charles-joshua-uy',            href: 'https://www.linkedin.com/in/charles-joshua-uy-920826274/', angle: 30 },
  { id: 'phone',    sigil: '✆',  label: 'Phone',    handle: '+63 917 150 4686',                href: 'tel:+639171504686',                angle: 90 },
  { id: 'cv',       sigil: 'CV', label: 'CV',       handle: 'Open PDF ↗',                     href: 'https://cv.cjuy.dev',              angle: 150 },
  { id: 'facebook', sigil: 'f',  label: 'Facebook', handle: '/charlesjoshua.uy',               href: 'https://facebook.com/charlesjoshua.uy', angle: 210 },
] as const;

// Layout dimensions
const SIZE = 680;
const CIRCLE_SIZE = 372;
const CENTER = SIZE / 2;
const MC = CIRCLE_SIZE / 2;
const OUTER_R = MC * 0.88;
const RUNE_R = MC * 0.78;
const INNER_R = MC * 0.58;
const DIMS = { nodeR: 238, disc: 52, labelGap: 16 };

// Pentagram geometry (inner shape)
function polarPts(cx: number, cy: number, r: number, n: number, start = -Math.PI / 2) {
  return Array.from({ length: n }, (_, i) => {
    const a = start + (i / n) * TAU;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as [number, number];
  });
}
const pentaPts = polarPts(MC, MC, INNER_R * 0.4, 5);
const satPts   = polarPts(MC, MC, INNER_R * 0.78, 5);
const pentaPath = `M ${pentaPts[0][0]} ${pentaPts[0][1]} L ${pentaPts[2][0]} ${pentaPts[2][1]} L ${pentaPts[4][0]} ${pentaPts[4][1]} L ${pentaPts[1][0]} ${pentaPts[1][1]} L ${pentaPts[3][0]} ${pentaPts[3][1]} Z`;

// Reactive state
const hovered = ref<string | null>(null);
const isMobile = ref(false);
const lineRefs = ref<SVGLineElement[]>([]);
const circleWrapRef = ref<HTMLElement | null>(null);

const runePathId = `rune-path-${Math.random().toString(36).slice(2, 8)}`;
const contactRunes = CONTACT_RUNES.repeat(8);

const charging = computed(() =>
  !!CHANNELS.find((c) => c.id === hovered.value && c.href),
);

const hoveredPos = computed<[number, number] | null>(() => {
  if (!charging.value) return null;
  const ch = CHANNELS.find((c) => c.id === hovered.value)!;
  const rad = (ch.angle * Math.PI) / 180;
  return [CENTER + Math.cos(rad) * DIMS.nodeR, CENTER + Math.sin(rad) * DIMS.nodeR];
});

// Spin period: normal 150s, charging 36s (4.2× faster)
const spinPeriod = computed(() => charging.value ? 36 : 150);

// Sigil node positioning
function sigilStyle(ch: typeof CHANNELS[number]): Record<string, string> {
  const rad = (ch.angle * Math.PI) / 180;
  const nx = Math.cos(rad) * DIMS.nodeR;
  const ny = Math.sin(rad) * DIMS.nodeR;
  return {
    position: 'absolute',
    left: `${CENTER + nx}px`,
    top: `${CENTER + ny}px`,
    transform: 'translate(-50%, -50%)',
    textDecoration: 'none',
    cursor: ch.href ? 'pointer' : 'default',
    zIndex: '4',
  };
}

function discStyle(ch: typeof CHANNELS[number]): Record<string, string> {
  const live = hovered.value === ch.id && ch.href;
  return {
    width: `${DIMS.disc}px`, height: `${DIMS.disc}px`,
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: live ? VERMILION : '#faf9f6',
    border: `1.5px solid ${live ? VERMILION : INK}`,
    color: live ? '#faf9f6' : INK,
    boxShadow: live ? '0 4px 14px rgba(220,53,34,0.3)' : `0 2px 0 ${INK}`,
    fontFamily: ch.sigil.length > 1 ? "'IBM Plex Mono', monospace" : 'Georgia, serif',
    fontSize: `${ch.sigil.length > 1 ? DIMS.disc * 0.34 : DIMS.disc * 0.46}px`,
    fontWeight: '600',
    transition: 'all 220ms cubic-bezier(0.34,1.1,0.64,1)',
    transform: live ? 'scale(1.12)' : 'scale(1)',
    userSelect: 'none',
  };
}

function labelStyle(ch: typeof CHANNELS[number]): Record<string, string> {
  const rad = (ch.angle * Math.PI) / 180;
  const ux = Math.cos(rad), uy = Math.sin(rad);
  const labelW = 132, labelH = 44;
  const proj = Math.abs(ux) * (labelW / 2) + Math.abs(uy) * (labelH / 2);
  const labelDist = DIMS.nodeR + DIMS.disc / 2 + DIMS.labelGap + proj;
  const lx = Math.cos(rad) * labelDist - Math.cos(rad) * DIMS.nodeR;
  const ly = Math.sin(rad) * labelDist - Math.sin(rad) * DIMS.nodeR;
  return {
    position: 'absolute',
    left: `${lx}px`, top: `${ly}px`,
    transform: 'translate(-50%, -50%)',
    width: `${labelW}px`, textAlign: 'center', lineHeight: '1.25',
    pointerEvents: 'none',
  };
}

// RAF loop for charge-line endpoints
let raf = 0;
function animLoop() {
  if (charging.value && circleWrapRef.value) {
    const crect = circleWrapRef.value.getBoundingClientRect();
    const ch = CHANNELS.find((c) => c.id === hovered.value);
    if (ch && hoveredPos.value) {
      const tx = hoveredPos.value[0], ty = hoveredPos.value[1];
      const nodes = circleWrapRef.value.querySelectorAll<SVGCircleElement>('.mc-summon-node');
      nodes.forEach((nd, i) => {
        const ln = lineRefs.value[i];
        if (!ln) return;
        const nr = nd.getBoundingClientRect();
        const nx = nr.left + nr.width / 2 - crect.left + CENTER - CIRCLE_SIZE / 2;
        const ny = nr.top + nr.height / 2 - crect.top + CENTER - CIRCLE_SIZE / 2;
        ln.setAttribute('x1', nx.toFixed(1));
        ln.setAttribute('y1', ny.toFixed(1));
        ln.setAttribute('x2', tx.toFixed(1));
        ln.setAttribute('y2', ty.toFixed(1));
      });
    }
  }
  raf = requestAnimationFrame(animLoop);
}

onMounted(() => {
  isMobile.value = window.innerWidth < 640;
  window.addEventListener('resize', () => { isMobile.value = window.innerWidth < 640; });
  raf = requestAnimationFrame(animLoop);
});

onUnmounted(() => cancelAnimationFrame(raf));
</script>

<style scoped>
.contact-page {
  min-height: 100vh;
  background: var(--paper);
  color: var(--ink);
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── Header ──────────────────────────────────────────────────── */
.contact-header {
  text-align: center;
  padding: 7rem 2rem 2rem;
}

.contact-slug {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  opacity: 0.5;
  margin-bottom: 12px;
}

.rule {
  display: inline-block;
  width: 20px;
  height: 1px;
  background: var(--ink);
  opacity: 0.6;
}

.contact-title {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: clamp(2.2rem, 5.5vw, 3.8rem);
  font-weight: 400;
  letter-spacing: -0.04em;
  color: var(--ink);
}

.contact-sub {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  color: #6a6a68;
  margin-top: 14px;
  max-width: 32ch;
  margin-inline: auto;
  line-height: 1.6;
}

/* ── Summoning wrap ───────────────────────────────────────────── */
.summoning-wrap {
  position: relative;
  width: 680px;
  height: 680px;
  margin: 2rem auto 4rem;
  flex-shrink: 0;
}

.charge-svg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: visible;
  z-index: 0;
}

.circle-wrap {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
}

.mc-svg {
  display: block;
}

/* ── Monogram ─────────────────────────────────────────────────── */
.monogram {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
  z-index: 3;
}

.monogram-ring {
  width: 102px;
  height: 102px;
  border-radius: 50%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--paper);
  border: 1.5px solid var(--ink);
  box-shadow: 0 2px 0 var(--ink);
  transition: border-color 220ms ease, box-shadow 260ms ease;
}

.monogram-ring.charging {
  border-color: var(--vermilion);
  box-shadow: 0 0 0 4px rgba(220,53,34,0.10), 0 2px 0 var(--ink);
}

.monogram-text {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 27px;
  color: var(--ink);
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.monogram-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.3em;
  margin-top: 11px;
  text-transform: uppercase;
  transition: color 200ms ease;
}

/* ── Sigil nodes ──────────────────────────────────────────────── */
.sigil-node {
  position: absolute;
}

.sigil-disc {
  cursor: pointer;
}

.sigil-label-name {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  transition: color 200ms ease;
}

.sigil-label-handle {
  font-family: 'Instrument Serif', Georgia, serif;
  font-style: italic;
  font-size: 14px;
  color: #555;
  margin-top: 1px;
  white-space: nowrap;
}

/* ── Mobile channels ──────────────────────────────────────────── */
.mobile-channels {
  width: 100%;
  max-width: 420px;
  padding: 1rem 1.5rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.mobile-channel {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 0;
  border-bottom: 1px solid var(--mute-2);
  text-decoration: none;
  color: var(--ink);
  transition: background 120ms;
}

.mobile-channel:hover { background: rgba(10,10,10,0.03); }

.mobile-sigil {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1.5px solid var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.mobile-sigil.accent {
  border-color: var(--vermilion);
  color: var(--vermilion);
}

.mobile-channel-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.mobile-channel-handle {
  font-family: 'Instrument Serif', Georgia, serif;
  font-style: italic;
  font-size: 14px;
  color: #555;
  margin-top: 2px;
}

.mobile-arrow {
  margin-left: auto;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 14px;
  opacity: 0.4;
}
</style>
