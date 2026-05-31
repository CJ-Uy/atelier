/**
 * Canvas 2D grid engine — faithful port of useGridCanvas from the Claude Design
 * (Atelier.html grid-engine.jsx). Replaces the old WebGL implementation.
 *
 * Renders the morphing grid with:
 * - Ink-on-paper line drawing with per-segment alpha
 * - Vertex point dots
 * - Sparkle particle system
 * - Cursor magnetic-field distortion + casting ring
 * - Motion pulse ring on morph settle
 * - Gentle idle wobble on every vertex
 * - Cinematic draw-in on first load (~1.1s ease)
 */

import type { GridStateName, GridState } from './types';
import { getGridState, graphPaper } from './GridStates';

export const COLS = 56;
export const ROWS = 40;

// ── Point representation ─────────────────────────────────────────

interface Pt { x: number; y: number; a: number; }

function toPoints(state: GridState): Pt[] {
  const n = state.alphas.length;
  const pts: Pt[] = new Array(n);
  for (let i = 0; i < n; i++) {
    pts[i] = { x: state.positions[i * 2], y: state.positions[i * 2 + 1], a: state.alphas[i] };
  }
  return pts;
}

function lerpPoints(from: Pt[], to: Pt[], t: number): Pt[] {
  return from.map((f, i) => ({
    x: f.x + (to[i].x - f.x) * t,
    y: f.y + (to[i].y - f.y) * t,
    a: f.a + (to[i].a - f.a) * t,
  }));
}

// ── Sparkle particles ─────────────────────────────────────────────

interface Spark {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number; phase: number; twspeed: number;
}

function makeSpark(cx: number, cy: number, scale: number): Spark {
  const ang = Math.random() * Math.PI * 2;
  const r0 = scale * (0.15 + Math.random() * 0.75);
  const speed = 0.15 + Math.random() * 0.5;
  return {
    x: cx + Math.cos(ang) * r0,
    y: cy - Math.sin(ang) * r0,
    vx: Math.cos(ang) * speed,
    vy: -Math.sin(ang) * speed,
    life: 0,
    maxLife: 1.0 + Math.random() * 1.6,
    size: 1.2 + Math.random() * 2.4,
    phase: Math.random() * Math.PI * 2,
    twspeed: 5 + Math.random() * 6,
  };
}

function drawSpark(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s * 0.28, y - s * 0.28);
  ctx.lineTo(x + s, y);
  ctx.lineTo(x + s * 0.28, y + s * 0.28);
  ctx.lineTo(x, y + s);
  ctx.lineTo(x - s * 0.28, y + s * 0.28);
  ctx.lineTo(x - s, y);
  ctx.lineTo(x - s * 0.28, y - s * 0.28);
  ctx.closePath();
  ctx.fill();
}

// ── GridEngine ────────────────────────────────────────────────────

export class GridEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ro: ResizeObserver;

  private currentPts: Pt[];
  private targetPts: Pt[];

  private progress = 0;
  private time = 0;
  private startTime = performance.now();

  // cursor fields removed — no cursor interaction

  // Pulse: fired when the grid settles to a new state
  private pulseStart = -9999;
  private pulseX = 0;
  private pulseY = 0;

  // Sparks
  private sparks: Spark[] = [];

  private gridColor = '#0a0a0a';
  private gridOpacity = 0.55;
  private lineWeight = 0.8;
  private showPoints = true;
  private sparklesEnabled = true;
  private motionPulse = true;

  private rafId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('[GridEngine] Canvas 2D not supported');
    this.ctx = ctx;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    this.ro.observe(canvas);

    const base = toPoints(graphPaper(COLS, ROWS));
    this.currentPts = base;
    this.targetPts = [...base];
  }

  // ── Public API (same surface as old WebGL engine) ──────────────

  setTarget(name: GridStateName): void {
    const prev = this.targetPts;
    this.targetPts = toPoints(getGridState(name, COLS, ROWS));
    // Trigger pulse if we were settled
    if (Math.abs(this.progress - 1) < 0.02 || Math.abs(this.progress) < 0.02) {
      this._triggerPulse();
    }
    void prev;
  }

  setCurrent(name: GridStateName): void {
    this.currentPts = toPoints(getGridState(name, COLS, ROWS));
  }

  promoteTargetToCurrent(): void {
    this.currentPts = [...this.targetPts];
  }

  setProgress(v: number): void {
    const prev = this.progress;
    this.progress = v;
    // Trigger pulse when settling (crossing 0 or 1)
    if ((prev < 0.98 && v >= 0.98) || (prev > 0.02 && v <= 0.02)) {
      this._triggerPulse();
    }
  }

  setTime(t: number): void { this.time = t; }

  // cursor methods kept as no-ops for backwards compatibility
  setCursor(_x: number, _y: number): void {}
  setCursorPx(_px: number, _py: number): void {}
  setCursorInactive(): void {}

  render(): void { this._draw(); }

  // Backwards compat aliases
  setTargetState(name: GridStateName): void { this.setTarget(name); }
  setCurrentState(name: GridStateName): void { this.setCurrent(name); }
  resetToBase(): void {
    this.setCurrent('graphPaper');
    this.setTarget('graphPaper');
    this.progress = 0;
  }

  destroy(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.ro.disconnect();
  }

  // ── Internal ───────────────────────────────────────────────────

  private _triggerPulse(): void {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.pulseStart = performance.now();
    this.pulseX = w / 2;
    this.pulseY = h / 2;
  }

  private _draw(): void {
    const canvas = this.canvas;
    const ctx = this.ctx;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w === 0 || h === 0) return;

    ctx.clearRect(0, 0, w, h);

    const time = this.time;

    // Cinematic draw-in: ease over first ~1.1s
    const ageSec = (performance.now() - this.startTime) / 1000;
    const introEased = 1 - Math.pow(1 - Math.min(1, ageSec / 1.1), 3);
    const fadeMul = introEased;

    const prog = this.progress;
    const pts = lerpPoints(this.currentPts, this.targetPts, prog);
    const cx = w / 2, cy = h / 2;
    const scale = Math.min(w, h) * 0.48;

    // ── Screen-space points with idle wobble only ──
    const screenPts = pts.map((p) => {
      const wobX = Math.sin(time * 0.8 + p.x * 3.14159) * 0.002;
      const wobY = Math.sin(time * 0.6 + p.y * 3.14159 + 1.5708) * 0.002;
      const sx = cx + (p.x + wobX) * scale;
      const sy = cy - (p.y + wobY) * scale;
      return { sx, sy, a: p.a };
    });

    const gridColor = this.gridColor;
    const baseOpacity = this.gridOpacity * fadeMul;
    const lineW = this.lineWeight;

    // ── Draw lines ──
    ctx.lineWidth = lineW;
    for (let r = 0; r <= ROWS; r++) {
      for (let c = 0; c <= COLS; c++) {
        const idx = r * (COLS + 1) + c;
        const p = screenPts[idx];
        if (c < COLS) {
          const next = screenPts[idx + 1];
          const a = Math.min(p.a, next.a) * baseOpacity;
          if (a > 0.01) {
            ctx.strokeStyle = gridColor;
            ctx.globalAlpha = a;
            ctx.beginPath();
            ctx.moveTo(p.sx, p.sy);
            ctx.lineTo(next.sx, next.sy);
            ctx.stroke();
          }
        }
        if (r < ROWS) {
          const below = screenPts[idx + COLS + 1];
          const a = Math.min(p.a, below.a) * baseOpacity;
          if (a > 0.01) {
            ctx.strokeStyle = gridColor;
            ctx.globalAlpha = a;
            ctx.beginPath();
            ctx.moveTo(p.sx, p.sy);
            ctx.lineTo(below.sx, below.sy);
            ctx.stroke();
          }
        }
        if (this.showPoints && p.a > 0.05) {
          ctx.globalAlpha = p.a * baseOpacity * 1.2;
          ctx.fillStyle = gridColor;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;

    // ── Sparkle particles ──
    // Density: strongest when a morph just settled (prog near 0 or 1)
    const settle = 1 - 4 * prog * (1 - prog);
    if (this.sparklesEnabled && fadeMul > 0.05) {
      const targetCount = Math.round(34 * (0.3 + 0.7 * settle));
      while (this.sparks.length < targetCount) {
        this.sparks.push(makeSpark(cx, cy, scale));
      }
      for (let i = this.sparks.length - 1; i >= 0; i--) {
        const s = this.sparks[i];
        s.life += 0.016;
        if (s.life > s.maxLife) { this.sparks.splice(i, 1); continue; }
        s.x += s.vx; s.y += s.vy;
        const lt = s.life / s.maxLife;
        const twk = 0.45 + 0.55 * Math.sin(s.life * s.twspeed + s.phase);
        const alpha = Math.sin(Math.PI * lt) * twk * (0.35 + 0.5 * settle) * fadeMul;
        if (alpha <= 0.01) continue;
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.fillStyle = gridColor;
        drawSpark(ctx, s.x, s.y, s.size);
      }
      // Trim when target drops
      if (this.sparks.length > targetCount + 12) {
        this.sparks.splice(0, this.sparks.length - targetCount);
      }
      ctx.globalAlpha = 1;
    }

    // ── Motion pulse ring ──
    if (this.motionPulse && this.pulseStart > 0) {
      const dt = (performance.now() - this.pulseStart) / 1000;
      if (dt >= 0 && dt < 0.9) {
        const pe = dt / 0.9;
        const eased = 1 - Math.pow(1 - pe, 2);
        const pr = scale * (0.2 + eased * 0.95);
        ctx.globalAlpha = (1 - pe) * 0.5 * fadeMul;
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(this.pulseX, this.pulseY, pr, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = (1 - pe) * 0.3 * fadeMul;
        ctx.beginPath(); ctx.arc(this.pulseX, this.pulseY, pr * 0.7, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

  }
}
