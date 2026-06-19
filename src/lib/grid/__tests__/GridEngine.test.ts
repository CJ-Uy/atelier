import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GridEngine } from '../GridEngine';
import type { RenderQualityProfile } from '../RenderQuality';

const economy: RenderQualityProfile = {
  name: 'economy',
  dprCap: 1,
  idleFps: 0,
  sparkleCount: 0,
  wobbleAmplitude: 0,
  motionPulse: false,
};

function createCanvas() {
  const context = {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    closePath: vi.fn(),
    globalAlpha: 1,
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
  } as unknown as CanvasRenderingContext2D;

  const canvas = {
    width: 0,
    height: 0,
    clientWidth: 200,
    clientHeight: 100,
    getContext: vi.fn(() => context),
  } as unknown as HTMLCanvasElement;

  return { canvas, context };
}

describe('GridEngine quality controls', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() {}
    });
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: 2,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('caps the canvas backing store DPR using the quality profile', () => {
    const { canvas, context } = createCanvas();

    new GridEngine(canvas, economy);

    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(100);
    expect(context.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
  });

  it('reports no active decorative animation in economy mode', () => {
    const { canvas } = createCanvas();
    const engine = new GridEngine(canvas, economy);

    expect(engine.hasActiveDecorations()).toBe(false);
  });
});
