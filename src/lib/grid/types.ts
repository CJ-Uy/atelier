// src/lib/grid/types.ts

export type GridStateName =
  | 'graphPaper'
  | 'keyboard'
  | 'terminal'
  | 'spacetimeWarp'
  | 'chartsData'
  | 'dreamCatcher'
  | 'bassGuitar'
  | 'volleyball'
  | 'topographic'
  | 'pixelGrid'
  | 'mangaPanels'
  | 'filmComposition'
  | 'banigWeaving'
  | 'mondrian';

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

export type GridStateFunction = (cols: number, rows: number) => Float32Array;
