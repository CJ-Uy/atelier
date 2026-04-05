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

  async init(scrollContainer: HTMLElement): Promise<void> {
    const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]);
    gsap.registerPlugin(ScrollTrigger);

    Array.from(scrollContainer.children).forEach((el, i) => {
      ScrollTrigger.create({
        trigger: el as HTMLElement,
        scroller: scrollContainer,
        start: 'top top',
        end: 'bottom top',
        onEnter:     () => this.goToSection(i),
        onEnterBack: () => this.goToSection(i),
      });
    });
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
