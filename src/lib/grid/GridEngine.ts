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
import type { RenderQualityProfile } from './RenderQuality';

export const COLS = 56;
export const ROWS = 40;

const ALPHA_BUCKETS = 6;

const DEFAULT_QUALITY: RenderQualityProfile = {
  name: 'balanced',
  dprCap: 1.35,
  idleFps: 30,
  sparkleCount: 14,
  wobbleAmplitude: 0.0012,
  motionPulse: true,
};

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

  private currentState: GridState;
  private targetState: GridState;
  private screenX: Float32Array;
  private screenY: Float32Array;
  private screenAlpha: Float32Array;
  private quality: RenderQualityProfile;

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
  constructor(canvas: HTMLCanvasElement, quality: RenderQualityProfile = DEFAULT_QUALITY) {
    this.canvas = canvas;
    this.quality = quality;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('[GridEngine] Canvas 2D not supported');
    this.ctx = ctx;

    this.resizeCanvas();

    this.ro = new ResizeObserver(() => {
      this.resizeCanvas();
    });
    this.ro.observe(canvas);

    const base = graphPaper(COLS, ROWS);
    this.currentState = base;
    this.targetState = base;
    const pointCount = base.alphas.length;
    this.screenX = new Float32Array(pointCount);
    this.screenY = new Float32Array(pointCount);
    this.screenAlpha = new Float32Array(pointCount);
  }

  // ── Public API (same surface as old WebGL engine) ──────────────

  setTarget(name: GridStateName): void {
    this.targetState = getGridState(name, COLS, ROWS);
    // Trigger pulse if we were settled
    if (Math.abs(this.progress - 1) < 0.02 || Math.abs(this.progress) < 0.02) {
      this._triggerPulse();
    }
  }

  setCurrent(name: GridStateName): void {
    this.currentState = getGridState(name, COLS, ROWS);
  }

  promoteTargetToCurrent(): void {
    this.currentState = this.targetState;
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

  hasActiveDecorations(): boolean {
    return this.quality.wobbleAmplitude > 0
      || this.quality.sparkleCount > 0
      || this.quality.motionPulse;
  }

  // Backwards compat aliases
  setTargetState(name: GridStateName): void { this.setTarget(name); }
  setCurrentState(name: GridStateName): void { this.setCurrent(name); }
  resetToBase(): void {
    this.setCurrent('graphPaper');
    this.setTarget('graphPaper');
    this.progress = 0;
  }

  destroy(): void {
    this.ro.disconnect();
  }

  // ── Internal ───────────────────────────────────────────────────

  private _triggerPulse(): void {
    if (!this.quality.motionPulse) return;
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.pulseStart = performance.now();
    this.pulseX = w / 2;
    this.pulseY = h / 2;
  }

  private resizeCanvas(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, this.quality.dprCap);
    const width = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    const height = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== width) this.canvas.width = width;
    if (this.canvas.height !== height) this.canvas.height = height;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
    const cx = w / 2, cy = h / 2;
    const scale = Math.min(w, h) * 0.48;

    // Reuse typed buffers so the hot loop creates no point objects or arrays.
    const currentPositions = this.currentState.positions;
    const targetPositions = this.targetState.positions;
    const currentAlphas = this.currentState.alphas;
    const targetAlphas = this.targetState.alphas;
    const wobble = this.quality.wobbleAmplitude;
    for (let i = 0; i < this.screenAlpha.length; i++) {
      const pi = i * 2;
      const x = currentPositions[pi] + (targetPositions[pi] - currentPositions[pi]) * prog;
      const y = currentPositions[pi + 1] + (targetPositions[pi + 1] - currentPositions[pi + 1]) * prog;
      const wobX = wobble > 0 ? Math.sin(time * 0.8 + x * Math.PI) * wobble : 0;
      const wobY = wobble > 0 ? Math.sin(time * 0.6 + y * Math.PI + Math.PI / 2) * wobble : 0;
      this.screenX[i] = cx + (x + wobX) * scale;
      this.screenY[i] = cy - (y + wobY) * scale;
      this.screenAlpha[i] = currentAlphas[i] + (targetAlphas[i] - currentAlphas[i]) * prog;
    }

    const gridColor = this.gridColor;
    const baseOpacity = this.gridOpacity * fadeMul;
    const lineW = this.lineWeight;

    // Draw a bounded number of paths instead of issuing thousands of
    // beginPath/stroke/fill calls per frame.
    ctx.lineWidth = lineW;
    ctx.strokeStyle = gridColor;
    for (let bucket = 0; bucket < ALPHA_BUCKETS; bucket++) {
      ctx.beginPath();
      let hasSegments = false;
      for (let r = 0; r <= ROWS; r++) {
        for (let c = 0; c <= COLS; c++) {
          const idx = r * (COLS + 1) + c;
          if (c < COLS) {
            const next = idx + 1;
            const alpha = Math.min(this.screenAlpha[idx], this.screenAlpha[next]);
            if (this.alphaBucket(alpha) === bucket) {
              ctx.moveTo(this.screenX[idx], this.screenY[idx]);
              ctx.lineTo(this.screenX[next], this.screenY[next]);
              hasSegments = true;
            }
          }
          if (r < ROWS) {
            const below = idx + COLS + 1;
            const alpha = Math.min(this.screenAlpha[idx], this.screenAlpha[below]);
            if (this.alphaBucket(alpha) === bucket) {
              ctx.moveTo(this.screenX[idx], this.screenY[idx]);
              ctx.lineTo(this.screenX[below], this.screenY[below]);
              hasSegments = true;
            }
          }
        }
      }
      if (hasSegments) {
        ctx.globalAlpha = ((bucket + 0.5) / ALPHA_BUCKETS) * baseOpacity;
        ctx.stroke();
      }
    }

    if (this.showPoints) {
      ctx.fillStyle = gridColor;
      for (let bucket = 0; bucket < ALPHA_BUCKETS; bucket++) {
        ctx.beginPath();
        let hasPoints = false;
        for (let i = 0; i < this.screenAlpha.length; i++) {
          if (this.screenAlpha[i] <= 0.05 || this.alphaBucket(this.screenAlpha[i]) !== bucket) continue;
          ctx.moveTo(this.screenX[i] + 1.2, this.screenY[i]);
          ctx.arc(this.screenX[i], this.screenY[i], 1.2, 0, Math.PI * 2);
          hasPoints = true;
        }
        if (hasPoints) {
          ctx.globalAlpha = ((bucket + 0.5) / ALPHA_BUCKETS) * baseOpacity * 1.2;
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;

    // ── Sparkle particles ──
    // Density: strongest when a morph just settled (prog near 0 or 1)
    const settle = 1 - 4 * prog * (1 - prog);
    if (this.quality.sparkleCount > 0 && fadeMul > 0.05) {
      const targetCount = Math.round(this.quality.sparkleCount * (0.3 + 0.7 * settle));
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
    if (this.quality.motionPulse && this.pulseStart > 0) {
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

  private alphaBucket(alpha: number): number {
    if (alpha <= 0.01) return -1;
    return Math.min(ALPHA_BUCKETS - 1, Math.floor(Math.min(alpha, 1) * ALPHA_BUCKETS));
  }
}
