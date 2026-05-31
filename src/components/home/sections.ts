// src/components/home/sections.ts
import type { GridStateName } from '../../lib/grid/types';

export interface Sticker {
  text: string;
  x: number;
  y: number;
  rot: number;
  size: number;
  type: 'glyph' | 'stamp' | 'tape' | 'sticker';
  delay: number;
  accent?: boolean;
}

export interface Section {
  id: number;
  prefix: string;
  descriptor: string;
  subtitle: string;
  gridState: GridStateName;
  tagline: string;
  stickers: Sticker[];
}

export const SECTIONS: Section[] = [
  {
    id: 0,
    prefix: "heyo! I'm",
    descriptor: 'Charles',
    subtitle: 'A creative developer working where code, craft, and a little bit of magic overlap.',
    gridState: 'graphPaper',
    tagline: 'PORTFOLIO / 00',
    stickers: [
      { text: '✦', x: -30, y: -20, rot: -14, size: 24, type: 'glyph', delay: 0.7 },
      { text: 'EST 2006', x: 29, y: -22, rot: 8, size: 9, type: 'stamp', delay: 0.85, accent: true },
      { text: 'hello.', x: -31, y: 17, rot: 10, size: 13, type: 'sticker', delay: 1.0 },
    ],
  },
  {
    id: 1,
    prefix: "heyo! I'm a",
    descriptor: 'developer',
    subtitle: 'I build interfaces that feel alive — WebGL, Svelte, and a soft spot for the small details.',
    gridState: 'web',
    tagline: 'WORLD WIDE WEB / 01',
    stickers: [
      { text: '{ }', x: -30, y: -19, rot: -8, size: 18, type: 'glyph', delay: 0.7 },
      { text: 'BUILD', x: 28, y: -21, rot: 6, size: 9, type: 'stamp', delay: 0.85 },
      { text: '~/spells', x: -31, y: 18, rot: 8, size: 9, type: 'tape', delay: 1.0 },
    ],
  },
  {
    id: 2,
    prefix: "heyo! I'm an aspiring",
    descriptor: 'researcher',
    subtitle: 'Measuring what lies between fields — CS, science, humanities, the ideas that refuse to sit in one box.',
    gridState: 'astrolabe',
    tagline: 'ASTROLABE / 02',
    stickers: [
      { text: '†', x: -28, y: -19, rot: -6, size: 26, type: 'glyph', delay: 0.7 },
      { text: 'CS ∩ ?', x: 28, y: -21, rot: 8, size: 10, type: 'stamp', delay: 0.85 },
    ],
  },
  {
    id: 3,
    prefix: "heyo! I'm a",
    descriptor: 'big dreamer',
    subtitle: 'Charting ideas like stars over Leyte — and pinning the far-off ones to the wall.',
    gridState: 'planisphere',
    tagline: 'PLANISPHERE / 03',
    stickers: [
      { text: '✦', x: -30, y: -19, rot: -10, size: 26, type: 'glyph', delay: 0.7 },
      { text: 'NORTH', x: 28, y: -21, rot: 8, size: 9, type: 'stamp', delay: 0.85 },
      { text: '☾ wishlist', x: -32, y: 17, rot: 6, size: 11, type: 'tape', delay: 1.0 },
    ],
  },
  {
    id: 4,
    prefix: "heyo! I'm into",
    descriptor: 'music',
    subtitle: 'Bass loops and low-end experiments. Four strings, mostly — and endless layers.',
    gridState: 'waveform',
    tagline: 'WAVEFORM / 04',
    stickers: [
      { text: '♪', x: -29, y: -19, rot: -10, size: 26, type: 'glyph', delay: 0.7 },
      { text: 'LOOP', x: 28, y: -21, rot: 6, size: 9, type: 'stamp', delay: 0.85 },
      { text: '4-string', x: -31, y: 17, rot: 8, size: 11, type: 'tape', delay: 1.0 },
    ],
  },
  {
    id: 5,
    prefix: "heyo! I'm into",
    descriptor: 'digital media',
    subtitle: 'Pixels, signal, and the beautiful noise between — print artifacts made sacred.',
    gridState: 'rosette',
    tagline: 'HALFTONE ROSETTE / 05',
    stickers: [
      { text: '◉', x: -29, y: -19, rot: -8, size: 22, type: 'glyph', delay: 0.7 },
      { text: 'CMYK', x: 28, y: -21, rot: 6, size: 9, type: 'stamp', delay: 0.85 },
      { text: 'signal/noise', x: -32, y: 17, rot: 6, size: 11, type: 'tape', delay: 1.0 },
    ],
  },
  {
    id: 6,
    prefix: "heyo! I'm",
    descriptor: 'Waray',
    subtitle: 'Leyte-born. The banig weavers of Basey taught me line before I ever touched a pixel.',
    gridState: 'banig',
    tagline: 'BANIG WEAVE / 06',
    stickers: [
      { text: '◇', x: -29, y: -19, rot: -8, size: 24, type: 'glyph', delay: 0.7 },
      { text: 'LEYTE PH', x: 28, y: -21, rot: 8, size: 9, type: 'stamp', delay: 0.85 },
      { text: 'banig', x: -31, y: 17, rot: 6, size: 14, type: 'sticker', delay: 1.0 },
    ],
  },
  {
    id: 7,
    prefix: "heyo! I'm",
    descriptor: 'building things',
    subtitle: 'Drafting, measuring, making — turning a sketch on the grid into something that stands up in the world.',
    gridState: 'blueprint',
    tagline: 'BLUEPRINT / 07',
    stickers: [
      { text: '⚙', x: -29, y: -19, rot: -6, size: 24, type: 'glyph', delay: 0.7 },
      { text: 'SHIP IT', x: 28, y: -21, rot: 8, size: 9, type: 'stamp', delay: 0.85 },
      { text: 'M3×8', x: -31, y: 17, rot: 6, size: 11, type: 'tape', delay: 1.0 },
    ],
  },
];
