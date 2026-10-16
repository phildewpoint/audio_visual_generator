import { BaseEngine } from './BaseEngine.js';

/**
 * Standard character ramps ordered from lowest to highest optical density.
 */
const RAMPS = {
  standard: " .:-=+*#%@",
  dense: " ░▒▓█",
  matrix: " 0123456789ABCDEF<>/*+-",
  minimal: " ·:;+xX$"
};

/**
 * High-energy sparkle and glitch glyph pools for audio reactivity.
 */
const SPARKLE_CHARS = ['*', '✦', '·', '•', '+', 'x', '°', '¤', '~', '^'];
const GLITCH_CHARS = ['#', '$', '@', '%', '&', '!', '?', '0', '1', '▓', '▒', '░', '█', '<', '>', '/', '\\'];

/**
 * AsciiEngine
 * Real-time character-mapped visual engine featuring CRT scanlines,
 * bloom glow, phosphor persistence, directional edge glyphs,
 * dynamic color palettes, and deep audio reactivity.
 */
export class AsciiEngine extends BaseEngine {
  /**
   * @param {HTMLCanvasElement} canvas - Target rendering canvas
   * @param {CoreScene} coreScene - Master procedural universe scene
   * @param {State} state - Reactive application state
   */
  constructor(canvas, coreScene, state) {
    super(canvas, coreScene, state);

    this.ctx = this.canvas.getContext('2d');

    // Offscreen character rendering canvas
    this.charCanvas = document.createElement('canvas');
    this.charCanvas.width = this.width;
    this.charCanvas.height = this.height;
    this.charCtx = this.charCanvas.getContext('2d', { alpha: true });

    // Grid metrics
    this.cols = 0;
    this.rows = 0;
    this.cellWidth = 8;
    this.cellHeight = 12;
    this.fontSize = 10;

    // Pre-allocated typed buffers for sampling & edge detection
    this.gridLength = 0;
    this.lumBuffer = null;
    this.rBuffer = null;
    this.gBuffer = null;
    this.bBuffer = null;

    // Palette lookup table (256 color levels)
    this.paletteLut = new Array(256);
    this.lutCacheKey = '';

    // CRT scanline pattern
    this.scanlinePattern = null;
    this.crtRollY = 0;

    // Matrix digital rain streams
    this.matrixStreams = [];

    // Audio reactivity dynamic state
    this.time = 0;
    this.beatFlash = 0.0;
    this.beatGlitch = 0.0;
    this.trebleSparkle = 0.0;

    this.init();
  }

  /**
   * Initialize resources, scanline patterns, and buffers.
   */
  init() {
    this._createScanlinePattern();
    this._updateGridMetrics();
    this._initMatrixStreams();
  }

  /**
   * Handle canvas resize.
   * @param {number} width 
   * @param {number} height 
   */
  resize(width, height) {
    super.resize(width, height);

    if (this.charCanvas) {
      this.charCanvas.width = width;
      this.charCanvas.height = height;
    }

    this._createScanlinePattern();
    this._updateGridMetrics();
    this._initMatrixStreams();
  }

  /**
   * Free all allocated buffers and resources.
   */
  destroy() {
    super.destroy();
    this.charCanvas = null;
    this.charCtx = null;
    this.lumBuffer = null;
    this.rBuffer = null;
    this.gBuffer = null;
    this.bBuffer = null;
    this.paletteLut = null;
    this.matrixStreams = [];
    this.scanlinePattern = null;
  }

  /**
   * Calculate cell dimensions, grid columns/rows, and allocate typed buffers.
   */
  _updateGridMetrics() {
    const asciiOpts = this.state.visual?.ascii || {};
    const baseFontSize = Math.max(6, Math.min(32, asciiOpts.fontSize || 10));
    const density = Math.max(0.4, Math.min(3.0, this.state.visual?.density || 1.0));

    // Cell dimensions: Higher density yields more cells and compact font size
    this.fontSize = Math.max(6, Math.round(baseFontSize / Math.sqrt(density)));
    this.cellHeight = Math.max(6, this.fontSize);
    this.cellWidth = Math.max(4, Math.round(this.cellHeight * 0.58));

    this.cols = Math.ceil(this.width / this.cellWidth);
    this.rows = Math.ceil(this.height / this.cellHeight);

    const length = this.cols * this.rows;
    if (this.gridLength !== length) {
      this.gridLength = length;
      this.lumBuffer = new Float32Array(length);
      this.rBuffer = new Uint8Array(length);
      this.gBuffer = new Uint8Array(length);
      this.bBuffer = new Uint8Array(length);
    }
  }

  /**
   * Create cached 1x4 scanline pattern for zero-overhead hardware-accelerated drawing.
   */
  _createScanlinePattern() {
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 1;
    pCanvas.height = 4;
    const pCtx = pCanvas.getContext('2d');

    // 2px darkened line, 2px transparent line
    pCtx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    pCtx.fillRect(0, 0, 1, 2);
    pCtx.fillStyle = 'rgba(0, 0, 0, 0.0)';
    pCtx.fillRect(0, 2, 1, 2);

    if (this.ctx) {
      this.scanlinePattern = this.ctx.createPattern(pCanvas, 'repeat');
    }
  }

  /**
   * Initialize matrix falling stream drops for 'matrix' color mode.
   */
  _initMatrixStreams() {
    this.matrixStreams = [];
    for (let c = 0; c < this.cols; c++) {
      this.matrixStreams.push({
        y: Math.random() * this.rows,
        speed: 8 + Math.random() * 20,
        length: Math.floor(6 + Math.random() * 16),
        headChar: this._getRandomMatrixChar(),
        active: Math.random() > 0.35,
        charTimer: 0
      });
    }
  }

  /**
   * Update matrix stream positions.
   */
  _updateMatrixStreams(deltaTime, bass) {
    for (let c = 0; c < this.cols; c++) {
      const s = this.matrixStreams[c];
      if (!s) continue;

      s.y += (s.speed + bass * 26) * deltaTime;
      s.charTimer += deltaTime;
      if (s.charTimer > 0.1) {
        s.charTimer = 0;
        s.headChar = this._getRandomMatrixChar();
      }

      if (s.y - s.length > this.rows) {
        s.y = -Math.random() * 8;
        s.speed = 8 + Math.random() * 20;
        s.length = Math.floor(6 + Math.random() * 16);
        s.active = Math.random() > 0.3;
      }
    }
  }

  _getRandomMatrixChar() {
    const chars = '0123456789ABCDEF<>/*+-XYZ';
    return chars[Math.floor(Math.random() * chars.length)];
  }

  /**
   * Retrieve active character ramp string.
   */
  _getRamp() {
    const rampKey = this.state.visual?.ascii?.ramp || 'dense';
    if (RAMPS[rampKey]) return RAMPS[rampKey];
    if (typeof rampKey === 'string' && rampKey.length > 0) return rampKey;
    return RAMPS.dense;
  }

  /**
   * Recompute 256-level palette lookup table when settings, audio energy, or beat flash change.
   */
  _updatePaletteLut(colorMode, paletteShift, beatFlash, energy) {
    const cacheKey = `${colorMode}_${Math.round(paletteShift)}_${Math.round(beatFlash * 30)}_${Math.round(energy * 20)}`;
    if (cacheKey === this.lutCacheKey) return;
    this.lutCacheKey = cacheKey;

    const shift = (paletteShift % 360 + 360) % 360;

    for (let i = 0; i < 256; i++) {
      let t = i / 255;
      // Audio beat brightness boost
      t = Math.min(1.0, t + beatFlash * 0.35);

      let r = 0, g = 0, b = 0;

      switch (colorMode) {
        case 'neon': {
          // Cyberpunk neon pink (330), cyan (185), electric violet (275)
          const hViolet = (275 + shift) % 360;
          const hPink = (330 + shift) % 360;
          const hCyan = (185 + shift) % 360;

          if (t < 0.28) {
            const k = t / 0.28;
            const rgb = this.hslToRgb(hViolet, 0.95, k * 0.42);
            r = rgb[0]; g = rgb[1]; b = rgb[2];
          } else if (t < 0.65) {
            const k = (t - 0.28) / 0.37;
            const rgbA = this.hslToRgb(hViolet, 0.95, 0.42);
            const rgbB = this.hslToRgb(hPink, 1.0, 0.58);
            r = Math.round(rgbA[0] * (1 - k) + rgbB[0] * k);
            g = Math.round(rgbA[1] * (1 - k) + rgbB[1] * k);
            b = Math.round(rgbA[2] * (1 - k) + rgbB[2] * k);
          } else if (t < 0.92) {
            const k = (t - 0.65) / 0.27;
            const rgbA = this.hslToRgb(hPink, 1.0, 0.58);
            const rgbB = this.hslToRgb(hCyan, 1.0, 0.68);
            r = Math.round(rgbA[0] * (1 - k) + rgbB[0] * k);
            g = Math.round(rgbA[1] * (1 - k) + rgbB[1] * k);
            b = Math.round(rgbA[2] * (1 - k) + rgbB[2] * k);
          } else {
            const k = (t - 0.92) / 0.08;
            const rgbA = this.hslToRgb(hCyan, 1.0, 0.68);
            r = Math.round(rgbA[0] * (1 - k) + 255 * k);
            g = Math.round(rgbA[1] * (1 - k) + 255 * k);
            b = Math.round(rgbA[2] * (1 - k) + 255 * k);
          }
          break;
        }

        case 'matrix': {
          // Iconic digital phosphor green (#00ff46, #03a062) with radiant white-green peak
          const hGreen = (135 + shift * 0.1) % 360;
          if (t < 0.2) {
            const k = t / 0.2;
            r = Math.round(k * 8);
            g = Math.round(k * 65);
            b = Math.round(k * 22);
          } else if (t < 0.72) {
            const k = (t - 0.2) / 0.52;
            r = Math.round(8 + k * 25);
            g = Math.round(65 + k * 145);
            b = Math.round(22 + k * 45);
          } else if (t < 0.94) {
            const k = (t - 0.72) / 0.22;
            r = Math.round(33 + k * 140);
            g = Math.round(210 + k * 45);
            b = Math.round(67 + k * 130);
          } else {
            const k = (t - 0.94) / 0.06;
            r = Math.round(173 + k * 82);
            g = 255;
            b = Math.round(197 + k * 58);
          }
          break;
        }

        case 'amber': {
          // Retro amber monochrome CRT terminal (P3 phosphor)
          if (t < 0.22) {
            const k = t / 0.22;
            r = Math.round(k * 95);
            g = Math.round(k * 42);
            b = 0;
          } else if (t < 0.72) {
            const k = (t - 0.22) / 0.50;
            r = Math.round(95 + k * 160);
            g = Math.round(42 + k * 135);
            b = Math.round(k * 10);
          } else if (t < 0.93) {
            const k = (t - 0.72) / 0.21;
            r = 255;
            g = Math.round(177 + k * 55);
            b = Math.round(10 + k * 80);
          } else {
            const k = (t - 0.93) / 0.07;
            r = 255;
            g = Math.round(232 + k * 23);
            b = Math.round(90 + k * 130);
          }
          break;
        }

        case 'mono': {
          // High-contrast cool silver/white terminal
          if (t < 0.25) {
            const k = t / 0.25;
            r = Math.round(15 + k * 45);
            g = Math.round(18 + k * 50);
            b = Math.round(24 + k * 60);
          } else if (t < 0.75) {
            const k = (t - 0.25) / 0.50;
            r = Math.round(60 + k * 135);
            g = Math.round(68 + k * 140);
            b = Math.round(84 + k * 145);
          } else {
            const k = (t - 0.75) / 0.25;
            r = Math.round(195 + k * 60);
            g = Math.round(208 + k * 47);
            b = Math.round(229 + k * 26);
          }
          break;
        }

        default: // Fallback / monochrome
          r = Math.round(t * 255);
          g = Math.round(t * 255);
          b = Math.round(t * 255);
      }

      this.paletteLut[i] = `rgb(${r}, ${g}, ${b})`;
    }
  }

  /**
   * Helper to convert RGB to HSL.
   */
  _rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h *= 60;
    }
    return [h, s, l];
  }

  /**
   * Determine background clear color for phosphor persistence trails.
   */
  _getClearColor(colorMode, crtEffect, beatFlash) {
    if (!crtEffect) {
      // Solid opaque clear when CRT persistence is disabled
      return '#06050a';
    }

    // Phosphor persistence decay rates:
    // Matrix has lower alpha (0.42) for elongated falling code trails.
    // Amber, Neon, and Mono have slightly higher alpha (0.65-0.78) for retro persistence.
    switch (colorMode) {
      case 'matrix':
        return `rgba(2, 9, 3, ${Math.max(0.32, 0.44 - beatFlash * 0.15)})`;
      case 'amber':
        return `rgba(12, 6, 0, ${Math.max(0.62, 0.72 - beatFlash * 0.15)})`;
      case 'neon':
        return `rgba(7, 4, 15, ${Math.max(0.60, 0.70 - beatFlash * 0.15)})`;
      case 'mono':
        return `rgba(8, 10, 14, ${Math.max(0.65, 0.76 - beatFlash * 0.15)})`;
      case 'fullcolor':
      default:
        return `rgba(5, 5, 8, ${Math.max(0.70, 0.80 - beatFlash * 0.15)})`;
    }
  }

  /**
   * Master Render Pass.
   * @param {number} deltaTime - Frame delta time in seconds
   * @param {Object} audioData - Realtime audio data: { bass, mid, treble, energy, beat, waveform, spectrum }
   */
  render(deltaTime, audioData = {}) {
    if (!this.active || !this.ctx || !this.charCtx) return;

    this.time += deltaTime;

    // Ensure metrics are current
    this._updateGridMetrics();

    const cols = this.cols;
    const rows = this.rows;
    const cellW = this.cellWidth;
    const cellH = this.cellHeight;
    const halfW = cellW * 0.5;
    const halfH = cellH * 0.5;

    // Extract audio reactivity signals
    const bass = audioData.bass || 0;
    const mid = audioData.mid || 0;
    const treble = audioData.treble || 0;
    const energy = audioData.energy || 0;
    const beat = audioData.beat || false;

    // Audio reactivity triggers
    if (beat || bass > 0.65) {
      this.beatFlash = 1.0;
      this.beatGlitch = 1.0;
    } else {
      this.beatFlash = Math.max(0, this.beatFlash - deltaTime * 4.2);
      this.beatGlitch = Math.max(0, this.beatGlitch - deltaTime * 3.6);
    }
    this.trebleSparkle = treble;

    // Ensure core scene offscreen raster is populated
    if (!this.coreScene.offscreenData) {
      this.coreScene.renderOffscreen(this.state, audioData);
    }

    const asciiOpts = this.state.visual?.ascii || {};
    const isMatrixPreset = this.state.visual?.paletteName === 'matrix';
    const colorMode = isMatrixPreset ? 'matrix' : (asciiOpts.colorMode === 'matrix' ? 'matrix' : 'fullcolor');
    const crtEffect = asciiOpts.crtEffect !== false;
    const paletteShift = this.state.visual?.paletteShift || 0;
    const ramp = this._getRamp();
    const rampMaxIdx = ramp.length - 1;

    // Update palette LUT if applicable
    if (colorMode !== 'fullcolor') {
      this._updatePaletteLut(colorMode, paletteShift, this.beatFlash, energy);
    }

    // Update matrix rain if in matrix mode
    if (colorMode === 'matrix') {
      if (this.matrixStreams.length !== cols) {
        this._initMatrixStreams();
      }
      this._updateMatrixStreams(deltaTime, bass);
    }

    // Step 1: Rapid sampling into flat typed buffers
    for (let r = 0; r < rows; r++) {
      const v = (r + 0.5) / rows;
      const rowOffset = r * cols;
      for (let c = 0; c < cols; c++) {
        const u = (c + 0.5) / cols;
        const sample = this.coreScene.sampleBuffer(u, v);
        const idx = rowOffset + c;
        this.lumBuffer[idx] = sample.lum;
        this.rBuffer[idx] = sample.r;
        this.gBuffer[idx] = sample.g;
        this.bBuffer[idx] = sample.b;
      }
    }

    // Step 2: Clear offscreen character canvas with phosphor trail clear color
    const charCtx = this.charCtx;
    charCtx.fillStyle = this._getClearColor(colorMode, crtEffect, this.beatFlash);
    charCtx.fillRect(0, 0, this.width, this.height);

    // Set font properties once for the character pass
    charCtx.font = `${this.fontSize}px "JetBrains Mono", "Cascadia Code", "Fira Code", monospace, "Courier New"`;
    charCtx.textAlign = 'center';
    charCtx.textBaseline = 'middle';

    let activeColor = '';
    const edgeThreshold = 0.17;

    // Step 3: Character mapping & directional edge glyph pass
    for (let r = 0; r < rows; r++) {
      const rowOffset = r * cols;
      const cy = r * cellH + halfH;

      // Bass beat horizontal glitch slice offset
      let rowGlitchX = 0;
      if (this.beatGlitch > 0.08) {
        const slice = Math.sin(r * 14.7 + this.time * 28);
        if (slice > 0.65) {
          rowGlitchX = Math.round((Math.random() - 0.5) * cellW * 4.5 * this.beatGlitch);
        }
      }

      for (let c = 0; c < cols; c++) {
        const idx = rowOffset + c;
        let lum = this.lumBuffer[idx];
        let char = ' ';
        let isMatrixHead = false;

        // Directional Edge Detection & Gradient Orientation
        let isEdge = false;
        let edgeChar = null;

        if (c > 0 && c < cols - 1 && r > 0 && r < rows - 1) {
          const dx = (this.lumBuffer[idx + 1] - this.lumBuffer[idx - 1]) * 0.5;
          const dy = (this.lumBuffer[idx + cols] - this.lumBuffer[idx - cols]) * 0.5;
          const gradMag = Math.sqrt(dx * dx + dy * dy);

          if (gradMag > edgeThreshold) {
            isEdge = true;
            // Contour tangent is perpendicular to gradient vector (-dy, dx)
            let tangentAngle = Math.atan2(-dx, dy);
            // Normalize to [0, PI)
            tangentAngle = ((tangentAngle % Math.PI) + Math.PI) % Math.PI;

            // Map tangent angle to directional glyph:
            // 0 or PI -> Horizontal '-'
            // PI/4 -> Diagonal '\'
            // PI/2 -> Vertical '|'
            // 3PI/4 -> Diagonal '/'
            if (tangentAngle < Math.PI * 0.125 || tangentAngle >= Math.PI * 0.875) {
              edgeChar = '-';
            } else if (tangentAngle < Math.PI * 0.375) {
              edgeChar = '\\';
            } else if (tangentAngle < Math.PI * 0.625) {
              edgeChar = '|';
            } else {
              edgeChar = '/';
            }
          }
        }

        // Matrix Digital Rain stream interaction
        if (colorMode === 'matrix' && this.matrixStreams[c]?.active) {
          const stream = this.matrixStreams[c];
          const dist = stream.y - r;
          if (dist >= 0 && dist < 1.0) {
            isMatrixHead = true;
            char = stream.headChar;
            lum = 1.0;
          } else if (dist >= 1.0 && dist <= stream.length) {
            const trailBoost = (1.0 - dist / stream.length) * 0.45;
            lum = Math.min(1.0, lum + trailBoost);
          }
        }

        // Character selection (if not already assigned by matrix stream head)
        if (!isMatrixHead) {
          if (isEdge && edgeChar) {
            char = edgeChar;
            lum = Math.min(1.0, lum + 0.15);
          } else {
            const rampIndex = Math.min(rampMaxIdx, Math.max(0, Math.floor(lum * rampMaxIdx)));
            char = ramp[rampIndex];
          }
        }

        // Treble sparkle glyph mutation
        if (this.trebleSparkle > 0.25 && (lum > 0.35 || isEdge)) {
          if (Math.random() < this.trebleSparkle * 0.12) {
            char = SPARKLE_CHARS[Math.floor(Math.random() * SPARKLE_CHARS.length)];
            lum = Math.min(1.0, lum + 0.35);
          }
        }

        // Bass beat momentary character mutation
        if (this.beatGlitch > 0.18 && Math.random() < this.beatGlitch * 0.10) {
          char = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          lum = Math.min(1.0, lum + 0.4);
        }

        // Skip blank whitespace to maximize rendering throughput
        if (!char || char === ' ') continue;

        // Resolve cell color
        let colorStr = '';
        if (isMatrixHead) {
          colorStr = 'rgb(230, 255, 235)'; // Radiant glowing white-green for matrix head
        } else if (colorMode === 'fullcolor') {
          let cr = this.rBuffer[idx];
          let cg = this.gBuffer[idx];
          let cb = this.bBuffer[idx];

          if (paletteShift !== 0) {
            const [h, s, l] = this._rgbToHsl(cr, cg, cb);
            const shiftedRgb = this.hslToRgb((h + paletteShift) % 360, s, l);
            cr = shiftedRgb[0];
            cg = shiftedRgb[1];
            cb = shiftedRgb[2];
          }

          if (this.beatFlash > 0 || energy > 0.2) {
            const boost = 1.0 + this.beatFlash * 0.35 + energy * 0.25;
            cr = Math.min(255, Math.round(cr * boost));
            cg = Math.min(255, Math.round(cg * boost));
            cb = Math.min(255, Math.round(cb * boost));
          }
          colorStr = `rgb(${cr}, ${cg}, ${cb})`;
        } else {
          const lumIdx = Math.min(255, Math.max(0, Math.floor(lum * 255)));
          colorStr = this.paletteLut[lumIdx];
        }

        // Minimize canvas context state mutations
        if (colorStr !== activeColor) {
          charCtx.fillStyle = colorStr;
          activeColor = colorStr;
        }

        const cx = c * cellW + halfW + rowGlitchX;
        charCtx.fillText(char, cx, cy);
      }
    }

    // Step 4: Final composite to target canvas with Bloom and CRT post-processing
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Bloom Glow Pass
    const bloom = Math.max(0, this.state.visual?.bloom ?? 0.6);
    if (bloom > 0.05) {
      ctx.save();
      const blurRadius = Math.round(4 + bloom * 8);
      ctx.filter = `blur(${blurRadius}px)`;
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = Math.min(1.0, bloom * 0.75 + this.beatFlash * 0.3);
      ctx.drawImage(this.charCanvas, 0, 0);
      ctx.restore();
    }

    // Sharp Character Pass
    ctx.drawImage(this.charCanvas, 0, 0);

    // Bass beat chromatic aberration shockwave
    if (this.beatGlitch > 0.08 && crtEffect) {
      const shift = Math.round(this.beatGlitch * 7 * (Math.random() > 0.5 ? 1 : -1));
      if (shift !== 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = this.beatGlitch * 0.45;
        ctx.drawImage(this.charCanvas, shift, 0);
        ctx.drawImage(this.charCanvas, -shift, 0);
        ctx.restore();
      }
    }

    // CRT Post-Processing (Scanlines, Rolling Refresh Bar, Tube Curvature Vignette)
    if (crtEffect) {
      this._renderCrtScanlines(ctx);
      this._renderCrtRollBar(ctx, deltaTime, bass);
      this._renderCrtVignette(ctx);
    }
  }

  /**
   * Render horizontal CRT scanlines overlay.
   */
  _renderCrtScanlines(ctx) {
    if (!this.scanlinePattern) return;
    ctx.save();
    ctx.fillStyle = this.scanlinePattern;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }

  /**
   * Render analog CRT vertical refresh roll bar.
   */
  _renderCrtRollBar(ctx, deltaTime, bass) {
    this.crtRollY = (this.crtRollY + deltaTime * (45 + bass * 90)) % this.height;

    const barHeight = Math.max(50, this.height * 0.12);
    const grad = ctx.createLinearGradient(0, this.crtRollY - barHeight, 0, this.crtRollY + barHeight);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(0.5, `rgba(255, 255, 255, ${0.035 + bass * 0.04})`);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(0, this.crtRollY - barHeight, this.width, barHeight * 2);
    ctx.restore();
  }

  /**
   * Render curved CRT glass tube vignette.
   */
  _renderCrtVignette(ctx) {
    const cx = this.width * 0.5;
    const cy = this.height * 0.5;
    const radius = Math.sqrt(cx * cx + cy * cy);

    const vignette = ctx.createRadialGradient(cx, cy, radius * 0.58, cx, cy, radius * 1.05);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(0.75, 'rgba(0, 0, 0, 0.28)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.85)');

    ctx.save();
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }
}
