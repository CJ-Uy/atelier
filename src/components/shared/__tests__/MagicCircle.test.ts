import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import MagicCircle from '../MagicCircle';

afterEach(() => vi.restoreAllMocks());

it('serializes the same geometry despite tiny runtime trigonometry differences', () => {
  const draw = () => renderToStaticMarkup(React.createElement(MagicCircle, {
    variant: 'summoning', size: 184, runes: true, showCardinals: true, overlays: ['circuit', 'orbit', 'ticks', 'nodes'],
  }));
  const original = draw();
  const cos = Math.cos;
  const sin = Math.sin;
  vi.spyOn(Math, 'cos').mockImplementation(angle => cos(angle) + 1e-15);
  vi.spyOn(Math, 'sin').mockImplementation(angle => sin(angle) - 1e-15);
  expect(draw()).toBe(original);
});

it('a blank search sigil has one ring and no inner geometry', () => {
  const markup = renderToStaticMarkup(React.createElement(MagicCircle, { variant: 'blank', runes: false }));
  expect(markup.match(/<circle /g)).toHaveLength(1);
  expect(markup).not.toMatch(/<(line|path|polygon) /);
});
