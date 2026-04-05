// src/lib/grid/GridEngine.ts
import { Renderer, Program, Geometry, Mesh } from 'ogl';

import type { GridStateName } from './types';
import { getGridState, graphPaper } from './GridStates';

const COLS = 12;
const ROWS = 8;
const VERT_COUNT = (COLS + 1) * (ROWS + 1); // 117

// ─── Shaders ────────────────────────────────────────────────────

const VERT = /* glsl */ `
  attribute vec2 position;
  attribute vec2 aCurrentPos;
  attribute vec2 aTargetPos;

  uniform float uProgress;
  uniform float uTime;
  uniform vec2  uCursor;

  void main() {
    vec2 pos = mix(aCurrentPos, aTargetPos, uProgress);

    pos.x += sin(uTime * 0.8 + aCurrentPos.x * 3.14159) * 0.003;
    pos.y += sin(uTime * 0.6 + aCurrentPos.y * 3.14159 + 1.5708) * 0.003;

    vec2 toCursor = uCursor - pos;
    float d = length(toCursor);
    float strength = max(0.0, 1.0 - d / 0.6);
    strength *= strength;
    pos += normalize(toCursor + vec2(0.0001)) * strength * 0.008;

    gl_Position  = vec4(pos, 0.0, 1.0);
    gl_PointSize = 3.0 + strength * 4.0;
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  uniform vec4 uColor;

  void main() {
    gl_FragColor = uColor;
  }
`;

// ─── Index builders ─────────────────────────────────────────────

function lineIndices(): Uint16Array {
  const idx: number[] = [];
  for (let r = 0; r <= ROWS; r++) {
    for (let c = 0; c <= COLS; c++) {
      const v = r * (COLS + 1) + c;
      if (c < COLS) idx.push(v, v + 1);
      if (r < ROWS) idx.push(v, v + (COLS + 1));
    }
  }
  return new Uint16Array(idx);
}

function pointIndices(): Uint16Array {
  return new Uint16Array(Array.from({ length: VERT_COUNT }, (_, i) => i));
}

// ─── GridEngine ──────────────────────────────────────────────────

export class GridEngine {
  private renderer: any;
  private gl: any;
  private lineMesh!: any;
  private pointMesh!: any;
  private lineUniforms!: Record<string, { value: any }>;
  private pointUniforms!: Record<string, { value: any }>;

  private currentPos: Float32Array;
  private targetPos: Float32Array;
  private basePos: Float32Array;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer({
      canvas,
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      alpha: true,
      antialias: true,
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    this.basePos = graphPaper(COLS, ROWS);
    this.currentPos = graphPaper(COLS, ROWS);
    this.targetPos = graphPaper(COLS, ROWS);

    this._build();
    this._watchResize(canvas);
  }

  private _build(): void {
    const vermillion = [0.863, 0.208, 0.133]; // #DC3522

    this.lineUniforms = {
      uProgress: { value: 0 },
      uTime:     { value: 0 },
      uCursor:   { value: [0, 0] },
      uColor:    { value: [...vermillion, 0.20] },
    };

    this.pointUniforms = {
      uProgress: { value: 0 },
      uTime:     { value: 0 },
      uCursor:   { value: [0, 0] },
      uColor:    { value: [...vermillion, 0.35] },
    };

    const makeGeom = () => new Geometry(this.gl, {
      position:    { size: 2, data: new Float32Array(this.basePos) },
      aCurrentPos: { size: 2, data: new Float32Array(this.currentPos) },
      aTargetPos:  { size: 2, data: new Float32Array(this.targetPos) },
    });

    const lineGeom = makeGeom();
    lineGeom.addAttribute('index', { data: lineIndices() });

    const pointGeom = makeGeom();
    pointGeom.addAttribute('index', { data: pointIndices() });

    this.lineMesh = new Mesh(this.gl, {
      geometry: lineGeom,
      program: new Program(this.gl, { vertex: VERT, fragment: FRAG, uniforms: this.lineUniforms, transparent: true }),
      mode: this.gl.LINES,
    });

    this.pointMesh = new Mesh(this.gl, {
      geometry: pointGeom,
      program: new Program(this.gl, { vertex: VERT, fragment: FRAG, uniforms: this.pointUniforms, transparent: true }),
      mode: this.gl.POINTS,
    });
  }

  private _watchResize(canvas: HTMLCanvasElement): void {
    new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      this.renderer.setSize(width, height);
    }).observe(canvas);
  }

  private _updateAttr(attrName: string, data: Float32Array): void {
    for (const mesh of [this.lineMesh, this.pointMesh]) {
      const attr = mesh.geometry.attributes[attrName];
      if (attr) { attr.data = data; attr.needsUpdate = true; }
    }
  }

  setTargetState(name: GridStateName): void {
    this.targetPos = getGridState(name, COLS, ROWS);
    this._updateAttr('aTargetPos', this.targetPos);
  }

  setCurrentState(name: GridStateName): void {
    this.currentPos = getGridState(name, COLS, ROWS);
    this._updateAttr('aCurrentPos', this.currentPos);
  }

  resetToBase(): void {
    const base = graphPaper(COLS, ROWS);
    this.currentPos = base;
    this.targetPos = base;
    this._updateAttr('aCurrentPos', base);
    this._updateAttr('aTargetPos', base);
    this.setProgress(0);
  }

  setProgress(v: number): void {
    this.lineUniforms.uProgress.value = v;
    this.pointUniforms.uProgress.value = v;
  }

  setTime(t: number): void {
    this.lineUniforms.uTime.value = t;
    this.pointUniforms.uTime.value = t;
  }

  setCursor(x: number, y: number): void {
    this.lineUniforms.uCursor.value = [x, y];
    this.pointUniforms.uCursor.value = [x, y];
  }

  render(): void {
    this.renderer.render({ scene: [this.lineMesh, this.pointMesh] });
  }
}
