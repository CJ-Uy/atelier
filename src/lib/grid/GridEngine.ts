// src/lib/grid/GridEngine.ts
import type { GridStateName } from './types';
import { getGridState, graphPaper } from './GridStates';

export const COLS = 48;
export const ROWS = 32;
const VERT_COUNT = (COLS + 1) * (ROWS + 1); // 1617

// ─── Shaders ────────────────────────────────────────────────────

const VERT = `
  attribute vec2 aCurrentPos;
  attribute vec2 aTargetPos;
  attribute float aCurrentAlpha;
  attribute float aTargetAlpha;

  uniform float uProgress;
  uniform float uTime;
  uniform vec2  uCursor;

  varying float vAlpha;

  void main() {
    vec2 pos = mix(aCurrentPos, aTargetPos, uProgress);
    vAlpha = mix(aCurrentAlpha, aTargetAlpha, uProgress);

    pos.x += sin(uTime * 0.8 + aCurrentPos.x * 3.14159) * 0.002;
    pos.y += sin(uTime * 0.6 + aCurrentPos.y * 3.14159 + 1.5708) * 0.002;

    vec2 toCursor = uCursor - pos;
    float d = length(toCursor);
    float strength = max(0.0, 1.0 - d / 0.5);
    strength *= strength;
    pos += normalize(toCursor + vec2(0.0001)) * strength * 0.006;

    gl_Position  = vec4(pos, 0.0, 1.0);
    gl_PointSize = 2.0 + strength * 3.0;
  }
`;

const FRAG = `
  precision mediump float;
  uniform vec4 uColor;
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(uColor.rgb, uColor.a * vAlpha);
  }
`;

// ─── Helpers ────────────────────────────────────────────────────

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('[GridEngine] shader compile error:', gl.getShaderInfoLog(s));
  }
  return s;
}

function makeProgram(gl: WebGLRenderingContext): WebGLProgram {
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('[GridEngine] program link error:', gl.getProgramInfoLog(prog));
  }
  return prog;
}

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
  private gl: WebGLRenderingContext;
  private prog: WebGLProgram;

  // attribute locations
  private aCurrentPos: number;
  private aTargetPos: number;
  private aCurrentAlpha: number;
  private aTargetAlpha: number;

  // uniform locations
  private uProgress: WebGLUniformLocation;
  private uTime: WebGLUniformLocation;
  private uCursor: WebGLUniformLocation;
  private uColor: WebGLUniformLocation;

  // position buffers
  private bufCurrentPos: WebGLBuffer;
  private bufTargetPos: WebGLBuffer;
  // alpha buffers
  private bufCurrentAlpha: WebGLBuffer;
  private bufTargetAlpha: WebGLBuffer;
  // index buffers
  private iboLines: WebGLBuffer;
  private iboPoints: WebGLBuffer;

  private lineIndexCount: number;
  private pointIndexCount: number;

  // state
  private currentPos: Float32Array;
  private targetPos: Float32Array;
  private currentAlpha: Float32Array;
  private targetAlpha: Float32Array;
  private progress = 0;
  private time = 0;
  private cursorX = 0;
  private cursorY = 0;

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true })
      ?? canvas.getContext('experimental-webgl', { alpha: true, antialias: true }) as WebGLRenderingContext | null;
    if (!gl) throw new Error('[GridEngine] WebGL not supported');
    this.gl = gl as WebGLRenderingContext;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = canvas.clientWidth  * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    new ResizeObserver(resize).observe(canvas);

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.prog = makeProgram(gl);
    gl.useProgram(this.prog);

    this.aCurrentPos   = gl.getAttribLocation(this.prog, 'aCurrentPos');
    this.aTargetPos    = gl.getAttribLocation(this.prog, 'aTargetPos');
    this.aCurrentAlpha = gl.getAttribLocation(this.prog, 'aCurrentAlpha');
    this.aTargetAlpha  = gl.getAttribLocation(this.prog, 'aTargetAlpha');

    this.uProgress = gl.getUniformLocation(this.prog, 'uProgress')!;
    this.uTime     = gl.getUniformLocation(this.prog, 'uTime')!;
    this.uCursor   = gl.getUniformLocation(this.prog, 'uCursor')!;
    this.uColor    = gl.getUniformLocation(this.prog, 'uColor')!;

    // Initial state: graphPaper
    const base = graphPaper(COLS, ROWS);
    this.currentPos   = new Float32Array(base.positions);
    this.targetPos    = new Float32Array(base.positions);
    this.currentAlpha = new Float32Array(base.alphas);
    this.targetAlpha  = new Float32Array(base.alphas);

    // Upload position VBOs
    this.bufCurrentPos = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCurrentPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.currentPos, gl.DYNAMIC_DRAW);

    this.bufTargetPos = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTargetPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.targetPos, gl.DYNAMIC_DRAW);

    // Upload alpha VBOs
    this.bufCurrentAlpha = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCurrentAlpha);
    gl.bufferData(gl.ARRAY_BUFFER, this.currentAlpha, gl.DYNAMIC_DRAW);

    this.bufTargetAlpha = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTargetAlpha);
    gl.bufferData(gl.ARRAY_BUFFER, this.targetAlpha, gl.DYNAMIC_DRAW);

    // Index buffers
    const li = lineIndices();
    this.lineIndexCount = li.length;
    this.iboLines = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iboLines);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, li, gl.STATIC_DRAW);

    const pi = pointIndices();
    this.pointIndexCount = pi.length;
    this.iboPoints = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iboPoints);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, pi, gl.STATIC_DRAW);
  }

  // ── Buffer uploads ──────────────────────────────────────────────

  private _upload(buf: WebGLBuffer, data: Float32Array): void {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
  }

  private _bindAttribs(): void {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCurrentPos);
    gl.enableVertexAttribArray(this.aCurrentPos);
    gl.vertexAttribPointer(this.aCurrentPos, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTargetPos);
    gl.enableVertexAttribArray(this.aTargetPos);
    gl.vertexAttribPointer(this.aTargetPos, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCurrentAlpha);
    gl.enableVertexAttribArray(this.aCurrentAlpha);
    gl.vertexAttribPointer(this.aCurrentAlpha, 1, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTargetAlpha);
    gl.enableVertexAttribArray(this.aTargetAlpha);
    gl.vertexAttribPointer(this.aTargetAlpha, 1, gl.FLOAT, false, 0, 0);
  }

  // ── Public API ──────────────────────────────────────────────────

  setTarget(name: GridStateName): void {
    const s = getGridState(name, COLS, ROWS);
    this.targetPos = s.positions;
    this.targetAlpha = s.alphas;
    this._upload(this.bufTargetPos, this.targetPos);
    this._upload(this.bufTargetAlpha, this.targetAlpha);
  }

  setCurrent(name: GridStateName): void {
    const s = getGridState(name, COLS, ROWS);
    this.currentPos = s.positions;
    this.currentAlpha = s.alphas;
    this._upload(this.bufCurrentPos, this.currentPos);
    this._upload(this.bufCurrentAlpha, this.currentAlpha);
  }

  /** Copy whatever the target currently holds into current (for chaining morphs). */
  promoteTargetToCurrent(): void {
    this.currentPos.set(this.targetPos);
    this.currentAlpha.set(this.targetAlpha);
    this._upload(this.bufCurrentPos, this.currentPos);
    this._upload(this.bufCurrentAlpha, this.currentAlpha);
  }

  setProgress(v: number): void { this.progress = v; }
  setTime(t: number):     void { this.time = t; }
  setCursor(x: number, y: number): void { this.cursorX = x; this.cursorY = y; }

  render(): void {
    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.prog);

    gl.uniform1f(this.uProgress, this.progress);
    gl.uniform1f(this.uTime,     this.time);
    gl.uniform2f(this.uCursor,   this.cursorX, this.cursorY);

    this._bindAttribs();

    const isLight = document.documentElement.dataset.theme === 'light';
    const lineAlpha  = isLight ? 0.90 : 0.32;
    const pointAlpha = isLight ? 1.0 : 0.50;

    gl.uniform4f(this.uColor, 0.863, 0.208, 0.133, lineAlpha);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iboLines);
    gl.drawElements(gl.LINES, this.lineIndexCount, gl.UNSIGNED_SHORT, 0);

    gl.uniform4f(this.uColor, 0.863, 0.208, 0.133, pointAlpha);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iboPoints);
    gl.drawElements(gl.POINTS, this.pointIndexCount, gl.UNSIGNED_SHORT, 0);
  }

  // Kept for backward compat with old orchestrator API
  setTargetState(name: GridStateName): void { this.setTarget(name); }
  setCurrentState(name: GridStateName): void { this.setCurrent(name); }
  resetToBase(): void {
    this.setCurrent('graphPaper');
    this.setTarget('graphPaper');
    this.progress = 0;
  }
}
