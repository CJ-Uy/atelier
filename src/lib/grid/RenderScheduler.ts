interface RenderSchedulerOptions {
  idleFps: number;
  decorativeMotion: boolean;
}

export class RenderScheduler {
  private readonly render: (timestamp: number) => void;
  private readonly idleInterval: number;
  private readonly decorativeMotion: boolean;
  private rafId: number | null = null;
  private running = false;
  private visible = true;
  private renderRequested = false;
  private lastRender = Number.NEGATIVE_INFINITY;

  constructor(render: (timestamp: number) => void, options: RenderSchedulerOptions) {
    this.render = render;
    this.idleInterval = options.idleFps > 0 ? 1000 / options.idleFps : Number.POSITIVE_INFINITY;
    this.decorativeMotion = options.decorativeMotion && options.idleFps > 0;
  }

  start(): void {
    this.running = true;
    if (this.decorativeMotion) this.schedule();
  }

  requestRender(): void {
    this.renderRequested = true;
    this.schedule();
  }

  setVisible(visible: boolean): void {
    if (this.visible === visible) return;
    this.visible = visible;

    if (!visible) {
      if (this.rafId !== null) cancelAnimationFrame(this.rafId);
      this.rafId = null;
      return;
    }

    this.requestRender();
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  destroy(): void {
    this.stop();
    this.renderRequested = false;
  }

  private schedule(): void {
    if (!this.visible || this.rafId !== null) return;
    if (!this.renderRequested && !(this.running && this.decorativeMotion)) return;
    this.rafId = requestAnimationFrame(this.onFrame);
  }

  private readonly onFrame = (timestamp: number): void => {
    this.rafId = null;
    if (!this.visible) return;

    const forced = this.renderRequested;
    this.renderRequested = false;
    if (forced || timestamp - this.lastRender >= this.idleInterval) {
      this.lastRender = timestamp;
      this.render(timestamp);
    }

    this.schedule();
  };
}
