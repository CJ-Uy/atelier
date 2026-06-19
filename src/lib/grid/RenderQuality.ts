export type RenderQualityName = 'high' | 'balanced' | 'economy';

export interface RenderQualityProfile {
  name: RenderQualityName;
  dprCap: number;
  idleFps: number;
  sparkleCount: number;
  wobbleAmplitude: number;
  motionPulse: boolean;
}

export interface RenderEnvironment {
  prefersReducedMotion: boolean;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  devicePixelRatio: number;
  viewportWidth: number;
  viewportHeight: number;
}

const HIGH: RenderQualityProfile = Object.freeze({
  name: 'high',
  dprCap: 1.75,
  idleFps: 60,
  sparkleCount: 34,
  wobbleAmplitude: 0.002,
  motionPulse: true,
});

const BALANCED: RenderQualityProfile = Object.freeze({
  name: 'balanced',
  dprCap: 1.35,
  idleFps: 30,
  sparkleCount: 14,
  wobbleAmplitude: 0.0012,
  motionPulse: true,
});

const ECONOMY: RenderQualityProfile = Object.freeze({
  name: 'economy',
  dprCap: 1,
  idleFps: 0,
  sparkleCount: 0,
  wobbleAmplitude: 0,
  motionPulse: false,
});

export function selectRenderQuality(environment: RenderEnvironment): RenderQualityProfile {
  if (environment.prefersReducedMotion) return ECONOMY;

  const { deviceMemory, hardwareConcurrency } = environment;
  if ((deviceMemory !== undefined && deviceMemory <= 4)
    || (hardwareConcurrency !== undefined && hardwareConcurrency <= 4)) {
    return ECONOMY;
  }

  if (deviceMemory === undefined || hardwareConcurrency === undefined) {
    return BALANCED;
  }

  const effectiveDpr = Math.min(Math.max(environment.devicePixelRatio, 1), HIGH.dprCap);
  const backingPixels = environment.viewportWidth
    * environment.viewportHeight
    * effectiveDpr
    * effectiveDpr;

  if (deviceMemory >= 8 && hardwareConcurrency >= 8 && backingPixels <= 4_500_000) {
    return HIGH;
  }

  return BALANCED;
}

export function readRenderEnvironment(): RenderEnvironment {
  const navigatorWithMemory = navigator as Navigator & { deviceMemory?: number };
  return {
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    deviceMemory: navigatorWithMemory.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency || undefined,
    devicePixelRatio: window.devicePixelRatio || 1,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  };
}
