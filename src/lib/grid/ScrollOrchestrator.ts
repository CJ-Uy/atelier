// src/lib/grid/ScrollOrchestrator.ts
import type { GridEngine } from './GridEngine';
import type { GridStateName, SectionChangedEvent } from './types';

interface SectionDef {
  gridState: GridStateName;
}

export class ScrollOrchestrator {
  private engine: GridEngine;
  private sections: SectionDef[];
  private _currentIndex = 0;
  private isMorphing = false;

  static readonly PAUSE_MS = 200;
  static readonly MORPH_S = 0.8;

  constructor(engine: GridEngine, sections: SectionDef[]) {
    this.engine = engine;
    this.sections = sections;
  }

  get currentIndex(): number { return this._currentIndex; }

  init(scrollContainer: HTMLElement): void {
    // CSS scroll-snap handles the actual snapping.
    // We just read scrollTop after the snap settles to know which section is active.
    // `scrollend` fires once snap is done; fall back to a debounced `scroll` for
    // browsers that don't support scrollend yet (Safari <17.4).
    const onSnap = () => {
      const sectionHeight = scrollContainer.clientHeight;
      if (sectionHeight === 0) return;
      const index = Math.round(scrollContainer.scrollTop / sectionHeight);
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
    if (this.isMorphing) return;

    this._currentIndex = clamped;
    const stateName = this.sections[clamped]?.gridState ?? 'graphPaper';

    const detail: SectionChangedEvent = { index: clamped, stateName };
    window.dispatchEvent(new CustomEvent('atelier:section-change', { detail }));

    this.engine.resetToBase();
    this.engine.setTargetState(stateName);
    this._animateMorph();
  }

  private async _animateMorph(): Promise<void> {
    this.isMorphing = true;
    let gsap: typeof import('gsap').default;
    try {
      gsap = (await import('gsap')).default;
    } catch {
      this.isMorphing = false;
      return;
    }

    await new Promise<void>((r) => setTimeout(r, ScrollOrchestrator.PAUSE_MS));

    const proxy = { progress: 0 };
    await new Promise<void>((resolve) => {
      gsap.to(proxy, {
        progress: 1,
        duration: ScrollOrchestrator.MORPH_S,
        ease: 'power2.inOut',
        onUpdate:   () => this.engine.setProgress(proxy.progress),
        onComplete: () => { this.isMorphing = false; resolve(); },
      });
    });
  }
}
