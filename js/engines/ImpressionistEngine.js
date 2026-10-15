import { BaseEngine } from './BaseEngine.js';
import { SimplexNoise } from '../core/SimplexNoise.js';

/**
 * ImpressionistEngine
 * High-performance painterly visual engine inspired by Claude Monet, Vincent van Gogh, and J.M.W. Turner.
 * Renders audio-reactive procedural brushstrokes, impasto textures, directional bristles,
 * and swirling atmospheric vector flow fields onto a persistent oil-primed canvas.
 */
export class ImpressionistEngine extends BaseEngine {
  /**
   * @param {HTMLCanvasElement} canvas - Target rendering canvas
   * @param {CoreScene} coreScene - Procedural scene universe generator
   * @param {State} state - Application state
   */
  constructor(canvas, coreScene, state) {
    super(canvas, coreScene, state);

    this.ctx = this.canvas.getContext('2d', { alpha: false, desynchronized: true }) || this.canvas.getContext('2d');
    this.noise = new SimplexNoise(1874); // 1874: First Impressionist exhibition in Paris

    // Particle pool bounds
    this.minParticles = 2000;
    this.maxParticles = 6000;
    this.particles = [];

    // Swirling vortex attractors for Van Gogh bass turbulence
    this.vortices = [
      { xRel: 0.50, yRel: 0.44, radiusRel: 0.38, strength: 2.8, angle: 0, orbitSpeed: 0.35, x: 0, y: 0, radius: 0 },
      { xRel: 0.26, yRel: 0.62, radiusRel: 0.30, strength: -2.4, angle: 2.1, orbitSpeed: -0.28, x: 0, y: 0, radius: 0 },
      { xRel: 0.76, yRel: 0.36, radiusRel: 0.32, strength: 2.5, angle: 4.2, orbitSpeed: 0.42, x: 0, y: 0, radius: 0 }
    ];

    // Glistening highlight specks pool for treble and beat stipples
    this.highlights = [];
    this.maxHighlights = 90;

    // Canvas linen texture pattern
    this.canvasPattern = null;
    this.canvasTextureCanvas = null;

    // Simulation timing
    this.engineTime = 0;
    this.frameCount = 0;

    this.init();
  }

  /**
   * Initialize resources, canvas grain texture, and particle pool.
   */
  init() {
    this._createCanvasTexture();
    this._syncParticlePool();
    this._updateVortices(0, 0);

    // Prime the canvas with an initial rich dark oil ground
    if (this.ctx) {
      this.ctx.fillStyle = '#0a0a14';
      this.ctx.fillRect(0, 0, this.width, this.height);
      if (this.canvasPattern) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.12;
        this.ctx.fillStyle = this.canvasPattern;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.restore();
      }
    }
  }

  /**
   * Handle viewport resize and re-adjust simulation boundaries.
   * @param {number} width 
   * @param {number} height 
   */
  resize(width, height) {
    super.resize(width, height);

    if (this.ctx && this.canvasTextureCanvas) {
      this.canvasPattern = this.ctx.createPattern(this.canvasTextureCanvas, 'repeat');
    }

    this._updateVortices(0, 0);

    // Keep particles within new boundaries
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.x > width || p.y > height) {
        p.x = Math.random() * width;
        p.y = Math.random() * height;
        p.px = p.x;
        p.py = p.y;
        p.ppx = p.x;
        p.ppy = p.y;
      }
    }
  }

  /**
   * Render painterly impressionist frame.
   * @param {number} deltaTime - Frame delta time in seconds
   * @param {Object} audioData - Realtime audio data: { bass, mid, treble, energy, beat, ... }
   */
  render(deltaTime, audioData = {}) {
    if (!this.active || !this.ctx) return;

    // Normalize inputs
    const dt = Math.max(0.001, Math.min(0.08, deltaTime || 0.016));
    const bass = audioData.bass || 0;
    const mid = audioData.mid || 0;
    const treble = audioData.treble || 0;
    const energy = audioData.energy || 0;
    const beat = Boolean(audioData.beat);

    const visualSpeed = this.state.visual?.speed ?? 1.0;
    const chaos = this.state.visual?.chaos ?? 1.0;
    const paletteShift = this.state.visual?.paletteShift ?? 0;
    const paletteName = this.state.visual?.paletteName ?? 'monet';
    const impressionistConfig = this.state.visual?.impressionist || {};

    const baseBrushSize = impressionistConfig.brushSize ?? 7;
    const baseStrokeLength = impressionistConfig.strokeLength ?? 16;
    const blendMode = impressionistConfig.blendMode ?? 'soft';

    this.engineTime += dt * visualSpeed;
    this.frameCount++;

    // Ensure offscreen semantic scene buffer is ready for color and flow sampling
    if (!this.coreScene.offscreenData) {
      this.coreScene.renderOffscreen(this.state, audioData);
    }

    // 1. Soft trail accumulation & canvas texturing (oil-paint glaze buildup)
    this._accumulateCanvasTrails(chaos, visualSpeed);

    // 2. Adjust particle pool size to current state density
    this._syncParticlePool();

    // 3. Update dynamic swirling vortex attractors driven by bass
    this._updateVortices(dt, bass);

    // 4. Update and render impressionist brushstrokes
    this._renderBrushstrokes({
      dt,
      visualSpeed,
      chaos,
      bass,
      mid,
      treble,
      energy,
      beat,
      baseBrushSize,
      baseStrokeLength,
      paletteName,
      paletteShift,
      blendMode
    });

    // 5. Render audio-reactive luminous stipples and glistening highlight specks
    this._renderGlisteningHighlights({
      dt,
      treble,
      beat,
      paletteShift,
      paletteName
    });
  }

  /**
   * Cleanup resources on engine switch or destroy.
   */
  destroy() {
    super.destroy();
    this.particles = [];
    this.highlights = [];
    this.canvasPattern = null;
    this.canvasTextureCanvas = null;
  }

  /**
   * Soft trail accumulation to build up rich, layered oil paint persistence.
   */
  _accumulateCanvasTrails(chaos, visualSpeed) {
    const ctx = this.ctx;
    // Dynamic fade alpha strictly within [0.05, 0.12]
    const fadeAlpha = Math.max(0.05, Math.min(0.12, 0.072 + (chaos - 1.0) * 0.018 + (1.0 - visualSpeed) * 0.015));

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(10, 10, 20, ${fadeAlpha})`;
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle physical canvas linen grain retention
    if (this.canvasPattern && this.frameCount % 2 === 0) {
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.018;
      ctx.fillStyle = this.canvasPattern;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    ctx.restore();
  }

  /**
   * Calculate target particle count and balance the particle pool.
   */
  _syncParticlePool() {
    const baseCount = this.state.visual?.impressionist?.particles ?? 3500;
    const density = this.state.visual?.density ?? 1.0;
    const target = Math.floor(Math.min(this.maxParticles, Math.max(this.minParticles, baseCount * density)));

    while (this.particles.length < target) {
      this.particles.push(this._createParticle());
    }
    if (this.particles.length > target) {
      this.particles.length = target;
    }
  }

  /**
   * Create or respawn an individual painterly particle.
   */
  _createParticle(p = null) {
    if (!p) p = {};

    p.x = Math.random() * this.width;
    p.y = Math.random() * this.height;
    p.px = p.x;
    p.py = p.y;
    p.ppx = p.x;
    p.ppy = p.y;
    p.vx = 0;
    p.vy = 0;

    p.life = Math.floor(Math.random() * 110 + 50);
    p.maxLife = p.life;

    // Idiosyncratic brush traits
    p.sizeRatio = 0.65 + Math.random() * 0.75;
    p.lengthRatio = 0.7 + Math.random() * 0.65;
    p.speedMult = 0.8 + Math.random() * 0.45;

    // Broken-color jitter (Monet divisionist color dabs)
    p.hueJitter = (Math.random() - 0.5) * 18; // -9 to +9 deg hue jitter
    p.lumJitter = (Math.random() - 0.5) * 0.12; // -0.06 to +0.06 luminance jitter

    // Multi-layered stroke role: 'wash' (broad base), 'body' (impasto brush), 'detail' (fine bristles)
    const layerRoll = Math.random();
    if (layerRoll < 0.22) {
      p.layer = 'wash';
      p.bristleCount = 1;
    } else if (layerRoll < 0.78) {
      p.layer = 'body';
      p.bristleCount = Math.floor(Math.random() * 2) + 2; // 2 or 3 bristles
    } else {
      p.layer = 'detail';
      p.bristleCount = 1;
    }

    return p;
  }

  /**
   * Respawn particle either across canvas or wrapping borders.
   */
  _respawnParticle(p) {
    if (Math.random() < 0.45) {
      // Re-seed around high visual energy zones (pulsar sun / horizon / canvas center)
      const centerX = this.width * 0.5;
      const centerY = this.height * 0.46;
      const spreadX = this.width * 0.35;
      const spreadY = this.height * 0.3;
      p.x = centerX + (Math.random() - 0.5) * spreadX * 2;
      p.y = centerY + (Math.random() - 0.5) * spreadY * 2;
    } else {
      // Wrap coordinates
      if (p.x < -30) p.x = this.width + 10;
      else if (p.x > this.width + 30) p.x = -10;

      if (p.y < -30) p.y = this.height + 10;
      else if (p.y > this.height + 30) p.y = -10;
    }

    p.px = p.x;
    p.py = p.y;
    p.ppx = p.x;
    p.ppy = p.y;
    p.vx = 0;
    p.vy = 0;
    p.life = Math.floor(Math.random() * 110 + 50);
    p.maxLife = p.life;
  }

  /**
   * Update bass-driven swirling vortex centers (Van Gogh Starry Night spirals).
   */
  _updateVortices(dt, bass) {
    const w = this.width;
    const h = this.height;

    for (let i = 0; i < this.vortices.length; i++) {
      const v = this.vortices[i];
      v.angle += v.orbitSpeed * dt * (1.0 + bass * 2.2);

      const orbitRadiusX = w * 0.08 * (1.0 + bass * 0.6);
      const orbitRadiusY = h * 0.06 * (1.0 + bass * 0.6);

      v.x = v.xRel * w + Math.cos(v.angle) * orbitRadiusX;
      v.y = v.yRel * h + Math.sin(v.angle) * orbitRadiusY;
      v.radius = v.radiusRel * Math.min(w, h) * (1.0 + bass * 0.85);
    }
  }

  /**
   * Main brushstroke physics and painterly rendering pass.
   */
  _renderBrushstrokes(params) {
    const {
      dt,
      visualSpeed,
      chaos,
      bass,
      mid,
      treble,
      energy,
      beat,
      baseBrushSize,
      baseStrokeLength,
      paletteName,
      paletteShift,
      blendMode
    } = params;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const time = this.coreScene.time;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (blendMode === 'vivid') {
      ctx.globalCompositeOperation = 'lighter';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Sample color from the core scene universe buffer
      const u = Math.max(0, Math.min(1, p.x / w));
      const v = Math.max(0, Math.min(1, p.y / h));
      const rawSample = this.coreScene.sampleBuffer(u, v);

      // Compute dynamic color harmony
      const color = this._applyPaletteHarmony(rawSample, p, paletteName, paletteShift);

      // Query underlying vector flow field from CoreScene
      const flow = this.coreScene.getFlowVector(p.x, p.y, time, chaos);
      let angle = flow.angle;
      let speed = flow.speed * visualSpeed * p.speedMult;

      // Bass swirling vortexes influence
      if (bass > 0.04) {
        for (let j = 0; j < this.vortices.length; j++) {
          const vortex = this.vortices[j];
          const dx = p.x - vortex.x;
          const dy = p.y - vortex.y;
          const distSq = dx * dx + dy * dy;
          const rSq = vortex.radius * vortex.radius;

          if (distSq < rSq && distSq > 80) {
            const dist = Math.sqrt(distSq);
            const factor = 1.0 - dist / vortex.radius;
            const swirlForce = factor * vortex.strength * (1.0 + bass * 3.8);

            // Tangential angle perpendicular to radius
            const tangAngle = Math.atan2(dx, -dy) * (vortex.strength > 0 ? 1 : -1);
            const angleDiff = Math.atan2(Math.sin(tangAngle - angle), Math.cos(tangAngle - angle));

            angle += angleDiff * Math.min(0.85, Math.abs(swirlForce) * 0.28);
            speed += Math.abs(swirlForce) * 16 * bass;
          }
        }
      }

      // Compute stroke length and movement step
      const strokeLength = baseStrokeLength * p.lengthRatio * (0.8 + speed * 0.12) * (1.0 + energy * 0.35);
      const stepDist = Math.max(2.5, Math.min(strokeLength, speed * 2.8 * dt * 60));

      // Advance particle position
      p.ppx = p.px;
      p.ppy = p.py;
      p.px = p.x;
      p.py = p.y;
      p.x += Math.cos(angle) * stepDist;
      p.y += Math.sin(angle) * stepDist;
      p.life--;

      // Check boundary conditions or lifetime expiration
      if (p.x < -35 || p.x > w + 35 || p.y < -35 || p.y > h + 35 || p.life <= 0) {
        this._respawnParticle(p);
        continue;
      }

      // Avoid drawing large jump lines if particle wrapped or respawned
      const distFromPrev = Math.hypot(p.x - p.px, p.y - p.py);
      if (distFromPrev > 60) continue;

      // Brush width varies with luminance (finer dabs in light, broader washes in dark) and audio mid
      let brushWidth = baseBrushSize * p.sizeRatio * (0.85 + (1.0 - color.lum) * 0.4) * (1.0 + mid * 0.3);

      // Treble / Beat audio reaction: Luminous stippled paint dabs
      const isStippleTriggered = (beat && Math.random() < 0.28) || (treble > 0.42 && (i % 7 === 0));
      if (isStippleTriggered) {
        this._drawStippledDab(ctx, p, color, brushWidth, angle, treble, beat);
      } else {
        // Draw directional curved dabs with impasto multi-layered bristles
        this._drawImpastoStroke(ctx, p, color, brushWidth, angle);
      }

      // Queue potential glistening highlight speck in luminous areas
      if ((beat || treble > 0.38) && color.lum > 0.62 && Math.random() < 0.08) {
        this._spawnHighlight(p.x, p.y, color, treble, beat);
      }
    }

    ctx.restore();
  }

  /**
   * Draw directional curved dabs with physical impasto bristles.
   */
  _drawImpastoStroke(ctx, p, color, brushWidth, angle) {
    const midX = (p.px + p.x) * 0.5;
    const midY = (p.py + p.y) * 0.5;
    const ctrlX = p.px;
    const ctrlY = p.py;

    const perp = angle + Math.PI / 2;
    const nx = Math.cos(perp);
    const ny = Math.sin(perp);

    if (p.layer === 'wash') {
      // Broad translucent foundation wash
      const alpha = 0.22 + color.lum * 0.12;
      ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
      ctx.lineWidth = brushWidth * 1.5;
      ctx.beginPath();
      ctx.moveTo(p.ppx, p.ppy);
      ctx.quadraticCurveTo(ctrlX, ctrlY, midX, midY);
      ctx.stroke();
    } else if (p.layer === 'detail') {
      // Crisp, high-definition calligraphic bristle
      const alpha = 0.85;
      ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
      ctx.lineWidth = Math.max(1.2, brushWidth * 0.48);
      ctx.beginPath();
      ctx.moveTo(p.ppx, p.ppy);
      ctx.quadraticCurveTo(ctrlX, ctrlY, midX, midY);
      ctx.stroke();
    } else {
      // 'body' impasto: 2 to 3 micro-bristles with 3D ridge highlight and shadow
      const bodyAlpha = 0.58 + (1.0 - color.lum) * 0.22;

      // 1. Center main stroke
      ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${bodyAlpha})`;
      ctx.lineWidth = brushWidth * 0.72;
      ctx.beginPath();
      ctx.moveTo(p.ppx, p.ppy);
      ctx.quadraticCurveTo(ctrlX, ctrlY, midX, midY);
      ctx.stroke();

      if (brushWidth > 2.8) {
        const bristleOffset = brushWidth * 0.32;

        // 2. Upper sunlit impasto ridge (light catching raised oil paint)
        ctx.strokeStyle = `rgba(${color.lightR}, ${color.lightG}, ${color.lightB}, ${bodyAlpha * 0.75})`;
        ctx.lineWidth = brushWidth * 0.42;
        ctx.beginPath();
        ctx.moveTo(p.ppx + nx * bristleOffset, p.ppy + ny * bristleOffset);
        ctx.quadraticCurveTo(ctrlX + nx * bristleOffset, ctrlY + ny * bristleOffset, midX + nx * bristleOffset, midY + ny * bristleOffset);
        ctx.stroke();

        // 3. Lower shadow furrow (cast shadow from thick paint edge)
        ctx.strokeStyle = `rgba(${color.darkR}, ${color.darkG}, ${color.darkB}, ${bodyAlpha * 0.65})`;
        ctx.lineWidth = brushWidth * 0.35;
        ctx.beginPath();
        ctx.moveTo(p.ppx - nx * bristleOffset, p.ppy - ny * bristleOffset);
        ctx.quadraticCurveTo(ctrlX - nx * bristleOffset, ctrlY - ny * bristleOffset, midX - nx * bristleOffset, midY - ny * bristleOffset);
        ctx.stroke();
      }
    }
  }

  /**
   * Draw luminous stippled paint dabs triggered by audio treble/beat (Pointillist technique).
   */
  _drawStippledDab(ctx, p, color, brushWidth, angle, treble, beat) {
    const dabRadius = brushWidth * (0.65 + Math.random() * 0.7) * (1.0 + treble * 0.5);
    const dabAlpha = Math.min(1.0, 0.75 + (beat ? 0.22 : treble * 0.2));

    // Stipple colors are higher in lightness and saturation
    const dabLum = Math.min(0.98, color.l + 0.22);
    const [dr, dg, db] = this.hslToRgb(color.h, Math.min(1.0, color.s * 1.25), dabLum);

    ctx.fillStyle = `rgba(${dr}, ${dg}, ${db}, ${dabAlpha})`;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, dabRadius * 1.35, dabRadius * 0.8, angle, 0, Math.PI * 2);
    ctx.fill();

    // Hot specular core
    if (color.lum > 0.55 || beat) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.65 + treble * 0.3})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, dabRadius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Spawn a glistening highlight speck for water/sky/sun reflections.
   */
  _spawnHighlight(x, y, color, treble, beat) {
    if (this.highlights.length >= this.maxHighlights) {
      this.highlights.shift();
    }

    this.highlights.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      size: (1.5 + Math.random() * 2.8) * (1.0 + treble * 1.2 + (beat ? 0.6 : 0)),
      alpha: 1.0,
      decay: 0.035 + Math.random() * 0.045,
      twinkleFreq: 12 + Math.random() * 15,
      color: color,
      isMajor: beat && color.lum > 0.72
    });
  }

  /**
   * Render active glistening highlight specks.
   */
  _renderGlisteningHighlights(params) {
    if (this.highlights.length === 0) return;

    const ctx = this.ctx;
    const t = this.engineTime;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let i = this.highlights.length - 1; i >= 0; i--) {
      const h = this.highlights[i];
      h.alpha -= h.decay;

      if (h.alpha <= 0) {
        this.highlights.splice(i, 1);
        continue;
      }

      const twinkle = 0.7 + 0.3 * Math.sin(t * h.twinkleFreq);
      const curAlpha = h.alpha * twinkle;
      const curSize = h.size * (0.8 + 0.2 * twinkle);

      // Radiant white/gold pointillist fleck
      ctx.fillStyle = `rgba(255, 255, 245, ${Math.min(1.0, curAlpha)})`;
      ctx.beginPath();
      ctx.arc(h.x, h.y, curSize, 0, Math.PI * 2);
      ctx.fill();

      // Four-point celestial star glint on major solar highlights
      if (h.isMajor) {
        ctx.strokeStyle = `rgba(255, 250, 220, ${curAlpha * 0.75})`;
        ctx.lineWidth = 1;
        const arm = curSize * 3.2;
        ctx.beginPath();
        ctx.moveTo(h.x - arm, h.y); ctx.lineTo(h.x + arm, h.y);
        ctx.moveTo(h.x, h.y - arm); ctx.lineTo(h.x, h.y + arm);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  /**
   * Apply impressionist color harmonies, broken color jitter, and impasto light/dark shading.
   */
  _applyPaletteHarmony(sample, particle, paletteName, paletteShift) {
    let [h, s, l] = this._rgbToHsl(sample.r, sample.g, sample.b);

    // Broken-color jitter (Divisionist non-uniform pigment)
    h += particle.hueJitter;
    l = Math.max(0.04, Math.min(0.96, l + particle.lumJitter));

    // Dynamic color harmony styling based on paletteName
    switch (paletteName) {
      case 'monet': {
        // French Impressionism: warm apricot/golden sun highlights, lavender/cerulean shadows
        if (l > 0.52) {
          h = h * 0.65 + 42 * 0.35; // Golden amber warmth
          s = Math.min(1.0, s * 1.3 + 0.08);
          l = Math.min(0.95, l * 1.08);
        } else {
          h = h * 0.55 + 242 * 0.45; // Soft lilac / cobalt coolness
          s = Math.min(0.88, s * 1.15);
        }
        break;
      }
      case 'cosmic': {
        // Turner / deep space: deep indigo, cosmic magenta, electric solar cyan, celestial gold
        if (l > 0.6) {
          h = (h + 28) % 360;
          s = Math.min(1.0, s * 1.25);
        } else {
          h = (h * 0.7 + 280 * 0.3) % 360;
          s = Math.min(0.92, s * 1.2);
        }
        break;
      }
      case 'cyberpunk': {
        // Electric neon impasto: cyan (180°), magenta (315°), electric amber (45°)
        if (h > 150 && h < 240) h = 182;
        else if (h >= 240 && h < 340) h = 315;
        else h = 42;
        s = Math.min(1.0, s * 1.4 + 0.2);
        l = Math.max(0.15, Math.min(0.85, l * 1.15));
        break;
      }
      case 'cathedral': {
        // Stained glass jewel tones: ruby (350°), sapphire (225°), amber (40°), emerald (145°)
        s = Math.min(1.0, s * 1.35 + 0.15);
        l = Math.max(0.12, Math.min(0.88, l * 1.08));
        break;
      }
      case 'matrix': {
        // Phosphor jade, viridian, emerald, lime and deep cyber-teal accents
        h = 135 + particle.hueJitter * 1.5;
        s = Math.min(1.0, s * 1.3 + 0.2);
        break;
      }
      default:
        s = Math.min(1.0, s * 1.1);
        break;
    }

    // Hue rotation from state.visual.paletteShift
    if (paletteShift) {
      h = (h + paletteShift) % 360;
    }
    if (h < 0) h += 360;

    // Base body color
    const [r, g, b] = this.hslToRgb(h, s, l);

    // Impasto highlight color (lighter tint for raised paint ridge)
    const lightLum = Math.min(0.98, l + 0.14);
    const [lightR, lightG, lightB] = this.hslToRgb(h, Math.min(1.0, s * 1.1), lightLum);

    // Impasto shadow color (deeper shade for paint ridge furrow)
    const darkLum = Math.max(0.03, l - 0.12);
    const [darkR, darkG, darkB] = this.hslToRgb(h, s, darkLum);

    return {
      r, g, b,
      lightR, lightG, lightB,
      darkR, darkG, darkB,
      h, s, l,
      lum: sample.lum
    };
  }

  /**
   * Helper: Convert RGB [0..255] to HSL [h: 0..360, s: 0..1, l: 0..1]
   */
  _rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
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
   * Generate procedural linen canvas pattern for tactile physical oil ground.
   */
  _createCanvasTexture() {
    if (typeof document === 'undefined') return;

    const size = 128;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    // Primed canvas ground
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, size, size);

    // Woven linen threads (warp & weft)
    ctx.lineWidth = 1;
    for (let i = 0; i < size; i += 3) {
      // Warp (vertical threads)
      const warpLum = Math.sin(i * 1.8) * 8 + 18;
      ctx.strokeStyle = `rgba(${warpLum + 6}, ${warpLum + 4}, ${warpLum + 10}, 0.28)`;
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();

      // Weft (horizontal threads)
      const weftLum = Math.cos(i * 1.8) * 8 + 18;
      ctx.strokeStyle = `rgba(${weftLum + 8}, ${weftLum + 5}, ${weftLum + 12}, 0.28)`;
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }

    // Micro linen flecks
    for (let j = 0; j < 250; j++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const alpha = Math.random() * 0.15 + 0.05;
      ctx.fillStyle = `rgba(255, 250, 240, ${alpha})`;
      ctx.fillRect(x, y, 1, 1);
    }

    this.canvasTextureCanvas = c;
    if (this.ctx) {
      this.canvasPattern = this.ctx.createPattern(c, 'repeat');
    }
  }
}
