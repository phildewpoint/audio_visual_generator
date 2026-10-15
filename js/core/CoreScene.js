import { SimplexNoise } from './SimplexNoise.js';

/**
 * CoreScene
 * The master procedural universe engine.
 * Computes a unified abstract cosmic landscape with a glowing celestial pulsar/sun,
 * undulating audio-reactive terrain, cosmic nebula, and dynamic flow field vectors.
 * Provides both analytical mathematical sampling and a high-performance offscreen buffer.
 */
export class CoreScene {
  constructor() {
    this.noise = new SimplexNoise(42);
    this.time = 0;

    // Offscreen buffer for fast raster sampling by ASCII, Impressionist & Stained Glass
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = 480;
    this.offscreenCanvas.height = 270;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    this.offscreenData = null;

    // Starfield points
    this.starCount = 180;
    this.stars = [];
    for (let i = 0; i < this.starCount; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random() * 0.65, // Mostly in upper sky
        size: Math.random() * 1.8 + 0.4,
        twinkleSpeed: Math.random() * 3 + 1,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Geometry ribbons
    this.ribbonCount = 5;
  }

  /**
   * Advance continuous procedural time.
   */
  update(deltaTime, speed = 1.0) {
    this.time += deltaTime * speed;
  }

  /**
   * Analytical 3D height/elevation of terrain at coordinates (x, y)
   */
  getElevation(x, y, time = this.time, chaos = 1.0, audioBass = 0) {
    const scale = 0.0035 * chaos;
    const warpX = this.noise.noise2D(x * scale * 0.5, y * scale * 0.5 + time * 0.2) * 1.5;
    const warpY = this.noise.noise2D(x * scale * 0.5 + 50, y * scale * 0.5 + time * 0.2) * 1.5;

    const base = this.noise.fbm2D(x * scale + warpX, (y + time * 60) * scale + warpY, 4, 2.0, 0.55);
    const audioBoost = audioBass * 0.45 * Math.sin(x * scale * 4 + time * 3);
    return base + audioBoost;
  }

  /**
   * Flow field vector (angle and magnitude) at (x, y) for fluid brushstrokes and particles.
   */
  getFlowVector(x, y, time = this.time, chaos = 1.0) {
    const scale = 0.0025 * chaos;
    const eps = 2.0;
    const n1 = this.noise.noise3D(x * scale, y * scale, time * 0.35);
    const n2 = this.noise.noise3D((x + eps) * scale, y * scale, time * 0.35);
    const n3 = this.noise.noise3D(x * scale, (y + eps) * scale, time * 0.35);

    const dx = (n2 - n1) / eps;
    const dy = (n3 - n1) / eps;
    // Curl vector: (-dy, dx)
    const angle = Math.atan2(dx, -dy);
    const speed = Math.sqrt(dx * dx + dy * dy) * 45 + 0.5;
    return { angle, speed };
  }

  /**
   * Update and render the offscreen semantic buffer representing the cosmic landscape.
   */
  renderOffscreen(state, audioData = {}) {
    const ctx = this.offscreenCtx;
    const w = this.offscreenCanvas.width;
    const h = this.offscreenCanvas.height;
    const t = this.time;
    const chaos = state.visual.chaos || 1.0;
    const paletteShift = state.visual.paletteShift || 0;
    const bass = Math.max(audioData.bass || 0, (audioData.bassActivity || 0) * 0.75);
    const mid = Math.max(audioData.mid || 0, (audioData.padActivity || 0) * 0.7);
    const treble = Math.max(audioData.treble || 0, (audioData.leadActivity || 0) * 0.85);
    const beat = audioData.beat || (audioData.drumsActivity || 0) > 0.5;

    // Clear background: Deep space gradient
    const skyHue = (250 + paletteShift) % 360;
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, `hsl(${skyHue}, 75%, 4%)`);
    skyGrad.addColorStop(0.5, `hsl(${(skyHue + 40) % 360}, 65%, 9%)`);
    skyGrad.addColorStop(0.75, `hsl(${(skyHue + 80) % 360}, 75%, 16%)`);
    skyGrad.addColorStop(1, `hsl(${(skyHue + 120) % 360}, 85%, 22%)`);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Render twinkling starfield
    for (const star of this.stars) {
      const alpha = 0.4 + 0.6 * Math.sin(t * star.twinkleSpeed + star.phase);
      const sx = star.x * w;
      const sy = star.y * h;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, alpha)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, star.size * (1 + treble * 0.8), 0, Math.PI * 2);
      ctx.fill();
    }

    // Render Cosmic Pulsar / Glowing Sun
    const sunX = w * 0.5;
    const sunY = h * 0.46;
    const baseRadius = h * 0.22;
    const sunRadius = baseRadius * (1.0 + bass * 0.35 + (beat ? 0.08 : 0));

    // Sun outer corona rays / glow
    const coronaGrad = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.2, sunX, sunY, sunRadius * 2.2);
    const sunHue = (320 + paletteShift) % 360;
    coronaGrad.addColorStop(0, `hsla(${sunHue}, 100%, 75%, 0.85)`);
    coronaGrad.addColorStop(0.4, `hsla(${(sunHue + 45) % 360}, 95%, 60%, 0.45)`);
    coronaGrad.addColorStop(0.7, `hsla(${(sunHue + 90) % 360}, 90%, 40%, 0.15)`);
    coronaGrad.addColorStop(1, `hsla(${(sunHue + 120) % 360}, 90%, 20%, 0)`);
    ctx.fillStyle = coronaGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Sun disc with horizontal segmented scanlines
    ctx.save();
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.clip();

    const sunDiscGrad = ctx.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
    sunDiscGrad.addColorStop(0, '#ffffff');
    sunDiscGrad.addColorStop(0.2, `hsl(${(sunHue + 50) % 360}, 100%, 75%)`);
    sunDiscGrad.addColorStop(0.65, `hsl(${sunHue}, 100%, 55%)`);
    sunDiscGrad.addColorStop(1, `hsl(${(sunHue - 30 + 360) % 360}, 95%, 45%)`);
    ctx.fillStyle = sunDiscGrad;
    ctx.fillRect(sunX - sunRadius, sunY - sunRadius, sunRadius * 2, sunRadius * 2);

    // Blinds / shutter stripes on bottom half of sun
    const stripeCount = 14;
    for (let i = 0; i < stripeCount; i++) {
      const sy = sunY + (i / stripeCount) * sunRadius;
      const stripeHeight = Math.max(1.5, (i / stripeCount) * 5.0);
      ctx.fillStyle = `hsl(${skyHue}, 80%, 6%)`;
      ctx.fillRect(sunX - sunRadius, sy, sunRadius * 2, stripeHeight);
    }
    ctx.restore();

    // Render Cosmic Energy Waves / Aurora ribbons
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let r = 0; r < 3; r++) {
      ctx.beginPath();
      const rHue = (sunHue + r * 60 + mid * 80) % 360;
      ctx.strokeStyle = `hsla(${rHue}, 90%, 65%, ${0.25 + mid * 0.3})`;
      ctx.lineWidth = 3 + r * 2;
      for (let x = 0; x <= w; x += 10) {
        const nx = x * 0.008 * chaos;
        const ny = t * 0.8 + r * 1.5;
        const wave = this.noise.noise2D(nx, ny) * (25 + bass * 30);
        const y = h * 0.4 + wave + Math.sin(x * 0.02 + t * 2 + r) * 12;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();

    // Render Layered 3D Mountains / Terrain Horizons
    const horizonY = h * 0.54;
    const layers = 3;
    for (let l = 0; l < layers; l++) {
      const layerDist = (l + 1) / layers; // 0.33, 0.66, 1.0
      const layerHue = (220 + l * 45 + paletteShift) % 360;
      ctx.beginPath();
      ctx.moveTo(0, h);

      for (let x = 0; x <= w; x += 6) {
        const worldX = (x - w * 0.5) * (1.0 / layerDist);
        const worldY = (1.0 - layerDist) * 300;
        const elev = this.getElevation(worldX, worldY, t * (0.8 + l * 0.4), chaos, l === layers - 1 ? bass : 0);
        const peakHeight = (50 + l * 35) * (1.0 + (l === 2 ? bass * 0.6 : mid * 0.3));
        const y = horizonY + (l * 28) - elev * peakHeight;
        ctx.lineTo(x, Math.max(horizonY - 80, y));
      }
      ctx.lineTo(w, h);
      ctx.closePath();

      // Mountain fill gradient
      const mGrad = ctx.createLinearGradient(0, horizonY - 40, 0, h);
      const lum = 14 + l * 8;
      mGrad.addColorStop(0, `hsl(${layerHue}, 75%, ${lum}%)`);
      mGrad.addColorStop(1, `hsl(${(layerHue + 30) % 360}, 85%, ${Math.max(4, lum - 8)}%)`);
      ctx.fillStyle = mGrad;
      ctx.fill();

      // Ridge highlight line
      ctx.strokeStyle = `hsla(${(layerHue + 60) % 360}, 95%, 70%, ${0.5 + treble * 0.4})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Cache image data for rapid sampling
    this.offscreenData = ctx.getImageData(0, 0, w, h);
    return this.offscreenCanvas;
  }

  /**
   * Sample color and luminance from the offscreen semantic buffer at normalized (u, v) in [0, 1]
   */
  sampleBuffer(u, v) {
    if (!this.offscreenData) return { r: 0, g: 0, b: 0, lum: 0 };
    const w = this.offscreenCanvas.width;
    const h = this.offscreenCanvas.height;
    const px = Math.floor(Math.max(0, Math.min(1, u)) * (w - 1));
    const py = Math.floor(Math.max(0, Math.min(1, v)) * (h - 1));
    const idx = (py * w + px) * 4;
    const r = this.offscreenData.data[idx];
    const g = this.offscreenData.data[idx + 1];
    const b = this.offscreenData.data[idx + 2];
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return { r, g, b, lum };
  }
}
