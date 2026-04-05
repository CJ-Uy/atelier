// src/lib/grid/ScrollOrchestrator.ts
import type { GridEngine } from './GridEngine';
import type { GridStateName, SectionChangedEvent } from './types';

interface SectionDef {
  gridState: GridStateName;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class ScrollOrchestrator {
  private engine: GridEngine;
  private sections: SectionDef[];
  private _currentIndex = 0;
  private _currentStateName: GridStateName = 'graphPaper';
  private morphRafId = 0;            // >0 while animating
  private morphPhase: 'idle' | 'reverse' | 'forward' = 'idle';

  static readonly REVERSE_MS = 500;  // unmorph back to grid
  static readonly FORWARD_MS = 700;  // morph into new shape

  constructor(engine: GridEngine, sections: SectionDef[]) {
    this.engine = engine;
    this.sections = sections;
  }

  get currentIndex(): number { return this._currentIndex; }

  init(scrollContainer: HTMLElement): void {
    const onSnap = () => {
      const h = scrollContainer.clientHeight;
      if (h === 0) return;
      const index = Math.round(scrollContainer.scrollTop / h);
      this.goToSection(index);
    };

    if ('onscrollend' in window) {
      scrollContainer.addEventListener('scrollend', onSnap);
    } else {
      let timer: ReturnType<typeof setTimeout>;
      scrollContainer.addEventListener('scroll', () => {
        clearTimeout(timer);
        timer = setTimeout(onSnap, 80);
      });
    }
  }

  goToSection(index: number): void {
    const clamped = Math.max(0, Math.min(index, this.sections.length - 1));
    if (clamped === this._currentIndex) return;

    // If already animating, cancel and start fresh from wherever we are
    if (this.morphRafId) {
      cancelAnimationFrame(this.morphRafId);
      this.morphRafId = 0;
      // Snap the engine to wherever the interrupted morph left off
      this.engine.promoteTargetToCurrent();
      this.engine.setProgress(0);
    }

    const prevState = this._currentStateName;
    this._currentIndex = clamped;
    const newState = this.sections[clamped]?.gridState ?? 'graphPaper';
    this._currentStateName = newState;

    // Dispatch UI event
    const detail: SectionChangedEvent = { index: clamped, stateName: newState };
    window.dispatchEvent(new CustomEvent('atelier:section-change', { detail }));

    // ── Phase 1: reverse current shape back to graphPaper ──
    // Set current = the shape we're showing, target = graphPaper
    this.engine.setCurrent(prevState);
    this.engine.setTarget('graphPaper');
    this.engine.setProgress(0);
    this.morphPhase = 'reverse';

    const reverseStart = performance.now();

    const tickReverse = (now: number) => {
      const t = Math.min((now - reverseStart) / ScrollOrchestrator.REVERSE_MS, 1);
      this.engine.setProgress(easeInOut(t));
      if (t < 1) {
        this.morphRafId = requestAnimationFrame(tickReverse);
      } else {
        // ── Phase 2: morph graphPaper into the new shape ──
        this.engine.setCurrent('graphPaper');
        this.engine.setTarget(newState);
        this.engine.setProgress(0);
        this.morphPhase = 'forward';

        const forwardStart = performance.now();

        const tickForward = (now2: number) => {
          const t2 = Math.min((now2 - forwardStart) / ScrollOrchestrator.FORWARD_MS, 1);
          this.engine.setProgress(easeInOut(t2));
          if (t2 < 1) {
            this.morphRafId = requestAnimationFrame(tickForward);
          } else {
            this.morphRafId = 0;
            this.morphPhase = 'idle';
          }
        };
        this.morphRafId = requestAnimationFrame(tickForward);
      }
    };

    this.morphRafId = requestAnimationFrame(tickReverse);
  }
}
