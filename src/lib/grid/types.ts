// src/lib/grid/types.ts

export interface GridState {
  positions: Float32Array; // 2 floats per vertex (x, y)
  alphas: Float32Array;    // 1 float per vertex (0 = hidden, 1 = visible)
}

export type GridStateName =
  | 'graphPaper'
  | 'keyboard'
  | 'terminal'
  | 'spacetimeWarp'
  | 'chartsData'
  | 'dreamCatcher'
  | 'bassGuitar'
  | 'musicProduction'
  | 'volleyball'
  | 'topographic'
  | 'pixelGrid'
  | 'mangaPanels'
  | 'filmComposition'
  | 'banigWeaving'
  | 'mondrian'
  | 'developerSetup'
  | 'cityscape';

export interface GridConfig {
  cols: number;
  rows: number;
}

export interface GridUniforms {
  uProgress: number;
  uTime: number;
  uCursor: [number, number];
}

export interface SectionChangedEvent {
  index: number;
  stateName: GridStateName;
}

export type GridStateFunction = (cols: number, rows: number) => GridState;
