import { describe, expect, it } from 'vitest';
import { selectRenderQuality, type RenderEnvironment } from '../RenderQuality';

const capableEnvironment: RenderEnvironment = {
  prefersReducedMotion: false,
  deviceMemory: 16,
  hardwareConcurrency: 12,
  devicePixelRatio: 1.5,
  viewportWidth: 1440,
  viewportHeight: 900,
};

describe('selectRenderQuality', () => {
  it('uses economy quality when reduced motion is requested', () => {
    expect(selectRenderQuality({
      ...capableEnvironment,
      prefersReducedMotion: true,
    }).name).toBe('economy');
  });

  it('uses economy quality on memory-constrained devices', () => {
    expect(selectRenderQuality({
      ...capableEnvironment,
      deviceMemory: 4,
    }).name).toBe('economy');
  });

  it('uses economy quality on low-core devices', () => {
    expect(selectRenderQuality({
      ...capableEnvironment,
      hardwareConcurrency: 4,
    }).name).toBe('economy');
  });

  it('uses balanced quality when hardware hints are unavailable', () => {
    expect(selectRenderQuality({
      ...capableEnvironment,
      deviceMemory: undefined,
      hardwareConcurrency: undefined,
    }).name).toBe('balanced');
  });

  it('uses high quality on capable devices with a reasonable pixel budget', () => {
    const quality = selectRenderQuality(capableEnvironment);

    expect(quality.name).toBe('high');
    expect(quality.dprCap).toBe(1.75);
    expect(quality.idleFps).toBe(60);
  });

  it('avoids high quality for very large high-DPR viewports', () => {
    expect(selectRenderQuality({
      ...capableEnvironment,
      devicePixelRatio: 2,
      viewportWidth: 2560,
      viewportHeight: 1600,
    }).name).toBe('balanced');
  });
});
