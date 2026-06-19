import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RenderScheduler } from '../RenderScheduler';

describe('RenderScheduler', () => {
  let callbacks: FrameRequestCallback[];
  let nextId: number;

  beforeEach(() => {
    callbacks = [];
    nextId = 1;
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      callbacks.push(callback);
      return nextId++;
    }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function flushFrame(timestamp = 16) {
    const frame = callbacks.shift();
    frame?.(timestamp);
  }

  it('coalesces repeated render requests into one frame', () => {
    const render = vi.fn();
    const scheduler = new RenderScheduler(render, {
      idleFps: 0,
      decorativeMotion: false,
    });

    scheduler.requestRender();
    scheduler.requestRender();
    scheduler.requestRender();

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    flushFrame();
    expect(render).toHaveBeenCalledTimes(1);
  });

  it('does not render while hidden and renders once when visible again', () => {
    const render = vi.fn();
    const scheduler = new RenderScheduler(render, {
      idleFps: 60,
      decorativeMotion: true,
    });

    scheduler.setVisible(false);
    scheduler.requestRender();
    expect(requestAnimationFrame).not.toHaveBeenCalled();

    scheduler.setVisible(true);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    flushFrame();
    expect(render).toHaveBeenCalledTimes(1);
  });

  it('is demand-only when decorative motion is disabled', () => {
    const render = vi.fn();
    const scheduler = new RenderScheduler(render, {
      idleFps: 0,
      decorativeMotion: false,
    });

    scheduler.start();
    expect(requestAnimationFrame).not.toHaveBeenCalled();

    scheduler.requestRender();
    flushFrame();
    expect(render).toHaveBeenCalledTimes(1);
    expect(callbacks).toHaveLength(0);
  });

  it('continues idle rendering at the configured cadence', () => {
    const render = vi.fn();
    const scheduler = new RenderScheduler(render, {
      idleFps: 30,
      decorativeMotion: true,
    });

    scheduler.start();
    flushFrame(0);
    flushFrame(16);
    flushFrame(34);

    expect(render).toHaveBeenCalledTimes(2);
    expect(callbacks).toHaveLength(1);
  });
});
