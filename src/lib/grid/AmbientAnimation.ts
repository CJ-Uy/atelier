// src/lib/grid/AmbientAnimation.ts
import type { GridEngine } from './GridEngine';

export class AmbientAnimation {
  private engine: GridEngine;
  private rafId: number | null = null;
  private startTime: number | null = null;

  constructor(engine: GridEngine) {
    this.engine = engine;
  }

  start(): void {
    if (this.rafId !== null) return;
    const tick = (ts: number) => {
      if (this.startTime === null) this.startTime = ts;
      this.engine.setTime((ts - this.startTime) / 1000);
      this.engine.render();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop(): void {
    if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
  }

  isRunning(): boolean { return this.rafId !== null; }
}
