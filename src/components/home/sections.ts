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
    prefix: "Heyo! I'm a",
    descriptor: 'developer',
    subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
    gridState: 'developerSetup',
  },
  {
    id: 2,
    prefix: "Heyo! I'm an",
    descriptor: 'aspiring researcher',
    subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
    gridState: 'spacetimeWarp',
  },
  {
    id: 3,
    prefix: "Heyo! I'm a",
    descriptor: 'big dreamer',
    subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
    gridState: 'dreamCatcher',
  },
  {
    id: 4,
    prefix: "Heyo! I'm into",
    descriptor: 'music',
    subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
    gridState: 'musicProduction',
  },
  {
    id: 5,
    prefix: "Heyo! I'm into",
    descriptor: 'sports',
    subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
    gridState: 'volleyball',
  },
  {
    id: 6,
    prefix: "Heyo! I'm into",
    descriptor: 'digital media',
    subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
    gridState: 'mangaPanels',
  },
  {
    id: 7,
    prefix: "Heyo! I'm",
    descriptor: 'Waray',
    subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
    gridState: 'banigWeaving',
  },
  {
    id: 8,
    prefix: "Heyo! I'm",
    descriptor: 'building things',
    subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
    gridState: 'cityscape',
  },
];
