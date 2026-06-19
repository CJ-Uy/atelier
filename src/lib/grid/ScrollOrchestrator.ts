// src/lib/grid/ScrollOrchestrator.ts
import type { GridEngine } from './GridEngine';
import type { GridStateName, SectionChangedEvent } from './types';

interface SectionDef {
  gridState: GridStateName;
}

/**
 * Scroll-position-mapped morphing with JS-based snap.
 *
 * Every pixel of scroll = visible grid morph. Direct A→B interpolation.
 * No CSS scroll-snap (causes directional resistance / dead zones).
 * Instead: on scroll-end, smooth-animate to nearest section.
 */
export class ScrollOrchestrator {
  private engine: GridEngine;
  private sections: SectionDef[];
  private _currentIndex = 0;
  private _currentStateName: GridStateName = 'graphPaper';

  // GPU upload tracking — only upload when section pair changes
  private loadedFrom = -1;
  private loadedTo = -1;
  private lastDispatchedIndex = -1;
  private requestRender: () => void;
  private container: HTMLElement | null = null;
  private scrollRaf = 0;

  // JS snap: debounce timer for scroll-end detection
  private snapTimer = 0;
  private isSnapping = false;
  private snapRaf = 0;
  private static readonly SNAP_DELAY = 180; // tolerate brief trackpad pauses
  private static readonly SNAP_DURATION = 350; // ms for snap animation

  constructor(engine: GridEngine, sections: SectionDef[], requestRender: () => void = () => {}) {
    this.engine = engine;
    this.sections = sections;
    this.requestRender = requestRender;
  }

  get currentIndex(): number { return this._currentIndex; }

  init(scrollContainer: HTMLElement): void {
    if (this.container === scrollContainer) return;
    this.destroy();
    this.container = scrollContainer;
    scrollContainer.addEventListener('scroll', this.onScroll, { passive: true });
    scrollContainer.addEventListener('wheel', this.cancelSnap, { passive: true });
    scrollContainer.addEventListener('touchstart', this.cancelSnap, { passive: true });
    scrollContainer.addEventListener('pointerdown', this.cancelSnap, { passive: true });

    // Initial render
    this._onScroll(scrollContainer);
    this.requestRender();
  }

  destroy(): void {
    if (this.container) {
      this.container.removeEventListener('scroll', this.onScroll);
      this.container.removeEventListener('wheel', this.cancelSnap);
      this.container.removeEventListener('touchstart', this.cancelSnap);
      this.container.removeEventListener('pointerdown', this.cancelSnap);
    }
    this.container = null;
    clearTimeout(this.snapTimer);
    if (this.scrollRaf) window.cancelAnimationFrame(this.scrollRaf);
    if (this.isSnapping) window.cancelAnimationFrame(this.snapRaf);
    this.scrollRaf = 0;
    this.isSnapping = false;
  }

  /** Programmatic jump (from dot indicator clicks) */
  goToSection(index: number): void {
    const container = this.container
      ?? document.querySelector('.scroll-container') as HTMLElement | null;
    if (!container) return;
    const clamped = Math.max(0, Math.min(index, this.sections.length - 1));
    this._animateScrollTo(container, clamped * container.clientHeight);
  }

  private _onScroll(container: HTMLElement): void {
    const h = container.clientHeight;
    if (h === 0) return;

    const fraction = container.scrollTop / h;
    const maxIndex = this.sections.length - 1;

    const fromIdx = Math.min(Math.floor(fraction), maxIndex);
    const toIdx = Math.min(fromIdx + 1, maxIndex);
    const progress = Math.min(fraction - fromIdx, 1);

    const fromState = this.sections[fromIdx]?.gridState ?? 'graphPaper';
    const toState = this.sections[toIdx]?.gridState ?? 'graphPaper';

    // Only re-upload GPU buffers when the section pair changes
    if (fromIdx !== this.loadedFrom || toIdx !== this.loadedTo) {
      this.loadedFrom = fromIdx;
      this.loadedTo = toIdx;
      this.engine.setCurrent(fromState);
      this.engine.setTarget(toState);
    }

    // Every scroll tick → progress update (cheap uniform, no GPU upload)
    this.engine.setProgress(progress);

    // Dispatch section-change for HeroText at nearest section
    const nearestIdx = Math.min(Math.round(fraction), maxIndex);
    if (nearestIdx !== this.lastDispatchedIndex) {
      this.lastDispatchedIndex = nearestIdx;
      this._currentIndex = nearestIdx;
      this._currentStateName = this.sections[nearestIdx]?.gridState ?? 'graphPaper';
      const detail: SectionChangedEvent = {
        index: nearestIdx,
        stateName: this._currentStateName,
      };
      window.dispatchEvent(new CustomEvent('atelier:section-change', { detail }));
    }

    // Continuous progress for the FacetDiagram annotation layer: which state is
    // active at the nearest section, how settled it is (0 mid-morph → 1 at rest),
    // and the outro fade so the ink dissolves with the grid.
    const fade = fraction <= maxIndex ? 1 : Math.max(0, 1 - (fraction - maxIndex));
    window.dispatchEvent(new CustomEvent('atelier:grid-progress', {
      detail: {
        index: nearestIdx,
        stateName: this.sections[nearestIdx]?.gridState ?? 'graphPaper',
        progress,
        fade,
      },
    }));
  }

  private readonly onScroll = (): void => {
    if (!this.container || this.isSnapping) return;

    if (!this.scrollRaf) {
      this.scrollRaf = window.requestAnimationFrame(() => {
        this.scrollRaf = 0;
        if (!this.container) return;
        this._onScroll(this.container);
        this.requestRender();
      });
    }

    clearTimeout(this.snapTimer);
    this.snapTimer = window.setTimeout(() => {
      if (this.container) this._snapToNearest(this.container);
    }, ScrollOrchestrator.SNAP_DELAY);
  };

  private readonly cancelSnap = (): void => {
    if (!this.isSnapping) return;
    window.cancelAnimationFrame(this.snapRaf);
    this.isSnapping = false;
  };

  /** Smooth-scroll to nearest section after user stops scrolling */
  private _snapToNearest(container: HTMLElement): void {
    const h = container.clientHeight;
    if (h === 0) return;

    const nearestIndex = Math.round(container.scrollTop / h);
    const targetScroll = nearestIndex * h;

    // Skip if already at target
    if (Math.abs(container.scrollTop - targetScroll) < 1) return;

    this._animateScrollTo(container, targetScroll);
  }

  /** Animate scroll position to target with easing */
  private _animateScrollTo(container: HTMLElement, target: number): void {
    this.isSnapping = true;
    const start = container.scrollTop;
    const distance = target - start;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / ScrollOrchestrator.SNAP_DURATION, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);

      container.scrollTop = start + distance * eased;
      this._onScroll(container);
      this.requestRender();

      if (t < 1) {
        this.snapRaf = window.requestAnimationFrame(tick);
      } else {
        this.isSnapping = false;
        container.scrollTop = target; // exact final position
        this._onScroll(container); // final state
        this.requestRender();
      }
    };

    this.snapRaf = window.requestAnimationFrame(tick);
  }
}
