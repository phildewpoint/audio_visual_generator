import { BaseEngine } from './BaseEngine.js';

/**
 * ConstructEngine
 * High-DPI Native World Construct Renderer.
 * Renders the active World Construct (Blade Runner, Studio Ghibli, 1928 Vintage Cartoon,
 * Dune: Arrakis, or Cosmic Default) at full screen resolution and adds bespoke
 * cinematic post-processing:
 * - Blade Runner    : Anamorphic horizontal lens flares, volumetric fog banks, neon bloom
 * - Studio Ghibli   : Golden-hour crepuscular God-rays, drifting cherry/meadow petals
 * - Vintage Cartoon : 1928 projector gate weave, celluloid dust specks, corner frame mask
 * - Dune: Arrakis   : Coriolis sand-veil gusts, desert heat shimmer, spice-blue bloom
 * - Cosmic Default  : Shooting stars & pulsar corona bloom
 */
export class ConstructEngine extends BaseEngine {
  constructor(canvas, coreScene, state) {
    super(canvas, coreScene, state);
    this.ctx = null;

    // Foreground atmospheric particles for high-DPI polish
    this.foregroundPetals = Array.from({ length: 42 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: 0.06 + Math.random() * 0.08,
      vy: 0.02 + Math.random() * 0.04,
      size: 3 + Math.random() * 4,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 4
    }));

    this.init();
  }

  init() {
    this.ctx = this.canvas.getContext('2d');
  }

  resize(width, height) {
    super.resize(width, height);
  }

  destroy() {
    super.destroy();
    this.ctx = null;
  }

  render(deltaTime, audioData = {}) {
    if (!this.ctx) {
      this.ctx = this.canvas.getContext('2d');
      if (!this.ctx) return;
    }

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const t = this.coreScene.time;
    const construct = this.state.visual.construct || 'blade_runner';
    const density = this.state.visual.density || 1.0;
    const shift = this.state.visual.paletteShift || 0;

    const bass = Math.max(audioData.bass || 0, (audioData.bassActivity || 0) * 0.75);
    const mid = Math.max(audioData.mid || 0, (audioData.padActivity || 0) * 0.7);
    const treble = Math.max(audioData.treble || 0, (audioData.leadActivity || 0) * 0.85);
    const beat = audioData.beat || (audioData.drumsActivity || 0) > 0.5;

    ctx.save();

    // Subtle 1928 projector gate weave for Vintage Cartoon
    if (construct === 'vintage_cartoon') {
      const jx = Math.sin(t * 24) * 1.4;
      const jy = Math.cos(t * 31) * 1.6;
      ctx.translate(jx, jy);
    }

    // 1. Render Core High-Res World Construct Scene
    this.coreScene.renderConstructToContext(ctx, w, h, this.state, audioData, true);

    // 2. Apply Bespoke Cinematic Post-Effects per Construct
    switch (construct) {
      case 'blade_runner':
        this._postBladeRunner(ctx, w, h, t, bass, mid, treble, beat, shift);
        break;
      case 'studio_ghibli':
        this._postStudioGhibli(ctx, w, h, t, deltaTime, bass, mid, treble, density);
        break;
      case 'vintage_cartoon':
        this._postVintageCartoon(ctx, w, h, t, bass, beat);
        break;
      case 'dune_arrakis':
        this._postDuneArrakis(ctx, w, h, t, bass, mid, treble, shift);
        break;
      default:
        break;
    }

    ctx.restore();
  }

  /**
   * Blade Runner Post-Processing: Anamorphic horizontal cyan/amber lens flares & smog drift
   */
  _postBladeRunner(ctx, w, h, t, bass, mid, treble, beat, shift) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const cyanHue = (188 + shift) % 360;
    const amberHue = (28 + shift) % 360;

    // Anamorphic horizontal lens streaks across the megastructure horizon
    const streakPositions = [
      { x: w * 0.52, y: h * 0.20, w: w * 0.38, hue: 350, alpha: 0.35 + (beat ? 0.35 : 0) },
      { x: w * 0.72, y: h * 0.55, w: w * 0.32, hue: cyanHue, alpha: 0.28 + treble * 0.35 },
      { x: w * 0.25, y: h * 0.62, w: w * 0.28, hue: amberHue, alpha: 0.25 + mid * 0.3 }
    ];

    for (const st of streakPositions) {
      const grad = ctx.createLinearGradient(st.x - st.w * 0.5, st.y, st.x + st.w * 0.5, st.y);
      grad.addColorStop(0, `hsla(${st.hue}, 100%, 65%, 0)`);
      grad.addColorStop(0.5, `hsla(${st.hue}, 100%, 75%, ${st.alpha})`);
      grad.addColorStop(1, `hsla(${st.hue}, 100%, 65%, 0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(st.x - st.w * 0.5, st.y - 2.5, st.w, 5);
    }

    // Drifting low-altitude volumetric smog bands
    for (let i = 0; i < 3; i++) {
      const fy = h * (0.58 + i * 0.12);
      const fGrad = ctx.createLinearGradient(0, fy - h * 0.06, 0, fy + h * 0.06);
      fGrad.addColorStop(0, 'rgba(0,0,0,0)');
      fGrad.addColorStop(0.5, `hsla(${amberHue}, 80%, 35%, ${0.08 + bass * 0.08})`);
      fGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = fGrad;
      ctx.fillRect(0, fy - h * 0.06, w, h * 0.12);
    }

    ctx.restore();
  }

  /**
   * Studio Ghibli Post-Processing: Golden-hour God-rays & wind-blown meadow petals
   */
  _postStudioGhibli(ctx, w, h, t, dt, bass, mid, treble, density) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // Diagonal Sunlit Crepuscular Rays from upper-left sky
    for (let r = 0; r < 4; r++) {
      const rx = w * (0.12 + r * 0.2) + Math.sin(t * 0.4 + r) * 30;
      const rayW = w * (0.07 + (r % 2) * 0.04);
      const rGrad = ctx.createLinearGradient(rx, 0, rx + w * 0.22, h * 0.85);
      rGrad.addColorStop(0, `rgba(255, 252, 220, ${0.14 + mid * 0.1})`);
      rGrad.addColorStop(0.6, `rgba(255, 248, 200, ${0.06 + bass * 0.05})`);
      rGrad.addColorStop(1, 'rgba(255, 248, 200, 0)');

      ctx.fillStyle = rGrad;
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx + rayW, 0);
      ctx.lineTo(rx + rayW + w * 0.25, h);
      ctx.lineTo(rx + w * 0.18, h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Floating cherry blossom / meadow petals in the wind
    ctx.save();
    const pCount = Math.min(this.foregroundPetals.length, Math.floor(32 * density));
    for (let i = 0; i < pCount; i++) {
      const p = this.foregroundPetals[i];
      p.x = (p.x + p.vx * dt * (1 + bass * 0.8)) % 1.05;
      p.y = (p.y + (p.vy + Math.sin(t * 2 + i) * 0.015) * dt) % 1.05;
      p.rot += p.rotSpeed * dt;

      const px = p.x * w;
      const py = p.y * h;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(p.rot);
      ctx.fillStyle = i % 3 === 0 ? 'rgba(255, 210, 220, 0.85)' : 'rgba(245, 255, 225, 0.8)';
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  /**
   * Vintage 1928 Cartoon Post-Processing: Rounded Sound-Era Projector Mask & Film Dust
   */
  _postVintageCartoon(ctx, w, h, t, bass, beat) {
    ctx.save();

    // Random vintage celluloid dust blotches
    if (Math.random() < 0.35) {
      const dx = Math.random() * w;
      const dy = Math.random() * h;
      ctx.strokeStyle = 'rgba(25, 20, 15, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(dx, dy, 3 + Math.random() * 8, 0, Math.PI * 1.4);
      ctx.stroke();
    }

    // Thick rounded 1928 projector aperture border
    ctx.strokeStyle = '#0e0c0a';
    const borderW = Math.max(18, Math.min(w, h) * 0.035);
    ctx.lineWidth = borderW;
    ctx.strokeRect(borderW * 0.3, borderW * 0.3, w - borderW * 0.6, h - borderW * 0.6);

    ctx.restore();
  }

  /**
   * Dune: Arrakis Post-Processing: Sweeping Coriolis Sand-Veils & Ibad Blue Spice Glow
   */
  _postDuneArrakis(ctx, w, h, t, bass, mid, treble, shift) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const ochreHue = (28 + shift) % 360;
    const spiceBlue = (195 + shift) % 360;

    // Sweeping diagonal sand-veil gusts across the desert floor
    for (let i = 0; i < 3; i++) {
      const sy = h * (0.55 + i * 0.14);
      const sGrad = ctx.createLinearGradient(0, sy - h * 0.08, w, sy + h * 0.08);
      const offset = (t * 0.25 + i * 0.33) % 1.0;
      sGrad.addColorStop(0, `hsla(${ochreHue}, 85%, 50%, 0)`);
      sGrad.addColorStop(Math.max(0.05, Math.min(0.95, offset)), `hsla(${(ochreHue + 12) % 360}, 90%, 60%, ${0.12 + bass * 0.12})`);
      sGrad.addColorStop(1, `hsla(${ochreHue}, 85%, 50%, 0)`);

      ctx.fillStyle = sGrad;
      ctx.fillRect(0, sy - h * 0.08, w, h * 0.16);
    }

    // Subtle Fremen Spice-Blue atmospheric horizon flare on high treble
    if (treble > 0.15) {
      const bGrad = ctx.createRadialGradient(w * 0.38, h * 0.28, 10, w * 0.38, h * 0.28, w * 0.28);
      bGrad.addColorStop(0, `hsla(${spiceBlue}, 100%, 65%, ${treble * 0.28})`);
      bGrad.addColorStop(1, `hsla(${spiceBlue}, 100%, 50%, 0)`);
      ctx.fillStyle = bGrad;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  }
}
