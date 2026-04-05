// src/components/home/sections.ts
import type { GridStateName } from '../../lib/grid/types';

export interface Section {
  id: number;
  prefix: string;
  descriptor: string;
  subtitle: string;
  gridState: GridStateName;
}

export const SECTIONS: Section[] = [
  {
    id: 0,
    prefix: "Heyo! I'm",
    descriptor: 'Charles',
    subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
    gridState: 'graphPaper',
  },
  {
    id: 1,
    prefix: "Heyo! I'm",
    descriptor: 'CJ-Uy',
    subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
    gridState: 'keyboard',
  },
  {
    id: 2,
    prefix: "Heyo! I'm a",
    descriptor: 'developer',
    subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
    gridState: 'terminal',
  },
  {
    id: 3,
    prefix: "Heyo! I'm an",
    descriptor: 'aspiring researcher',
    subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
    gridState: 'spacetimeWarp',
  },
  {
    id: 4,
    prefix: "Heyo! I'm a",
    descriptor: 'big dreamer',
    subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
    gridState: 'dreamCatcher',
  },
  {
    id: 5,
    prefix: "Heyo! I'm into",
    descriptor: 'music',
    subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
    gridState: 'bassGuitar',
  },
  {
    id: 6,
    prefix: "Heyo! I'm into",
    descriptor: 'sports',
    subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
    gridState: 'volleyball',
  },
  {
    id: 7,
    prefix: "Heyo! I'm into",
    descriptor: 'digital media',
    subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
    gridState: 'pixelGrid',
  },
  {
    id: 8,
    prefix: "Heyo! I'm into",
    descriptor: 'manga',
    subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
    gridState: 'mangaPanels',
  },
  {
    id: 9,
    prefix: "Heyo! I'm a",
    descriptor: 'visual thinker',
    subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
    gridState: 'filmComposition',
  },
  {
    id: 10,
    prefix: "Heyo! I'm",
    descriptor: 'Waray',
    subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
    gridState: 'banigWeaving',
  },
  {
    id: 11,
    prefix: "Heyo! I'm from",
    descriptor: 'Tacloban',
    subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
    gridState: 'topographic',
  },
  {
    id: 12,
    prefix: "Heyo! I'm",
    descriptor: 'building things',
    subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
    gridState: 'mondrian',
  },
];
