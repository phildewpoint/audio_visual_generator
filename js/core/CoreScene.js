import { SimplexNoise } from './SimplexNoise.js';

/**
 * CoreScene
 * The master procedural universe & World Construct engine.
 * Supports 5 distinct themed constructs:
 * - 'blade_runner'    : Neo-Noir 2049 Megacity (Tyrell pyramids, flying spinners, neon rain, searchlights)
 * - 'studio_ghibli'   : Pastoral Miyazaki Sky (Towering cumulonimbus clouds, floating sky-castle, wind-swept grass meadow, spirit motes)
 * - 'vintage_cartoon' : 1928 Rubber-Hose Steamboat (Squash-and-stretch riverboat, rubber-hose captain, puffing smokestacks, musical notes, 35mm film grain)
 * - 'dune_arrakis'    : Arrakis Desert Monolith (Twin moons, orbital monolith, razor sand dunes, sandworm seismic shockwaves, glowing spice dust)
 * - 'cosmic_default'  : Cosmic Nebula & Pulsar (Segmented synthwave sun, aurora ribbons, layered cosmic peaks)
 *
 * Provides both:
 * 1. Full high-DPI native canvas rendering via renderConstructToContext()
 * 2. Fast 480x270 offscreen semantic buffer + analytical getElevation() & getFlowVector() for ASCII, Impressionist, Stained Glass & Wireframe engines.
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

    // 1. Cosmic Stars
    this.stars = Array.from({ length: 180 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.65,
      size: Math.random() * 1.8 + 0.4,
      twinkleSpeed: Math.random() * 3 + 1,
      phase: Math.random() * Math.PI * 2
    }));

    // 2. Blade Runner Spinners & Rain
    this.spinners = Array.from({ length: 28 }, (_, i) => ({
      x: Math.random(),
      y: 0.15 + Math.random() * 0.65,
      z: 0.2 + Math.random() * 0.8,
      speed: (0.04 + Math.random() * 0.12) * (i % 2 === 0 ? 1 : -1),
      size: 2 + Math.random() * 4,
      isPolice: i % 5 === 0
    }));
    this.rainDrops = Array.from({ length: 220 }, () => ({
      x: Math.random(),
      y: Math.random(),
      len: 0.03 + Math.random() * 0.06,
      speed: 0.6 + Math.random() * 0.8,
      alpha: 0.15 + Math.random() * 0.35
    }));

    // 3. Studio Ghibli Clouds, Grass Tufts & Spirit Motes
    this.ghibliClouds = [
      { cx: 0.22, cy: 0.34, scale: 1.15, seed: 10 },
      { cx: 0.55, cy: 0.28, scale: 1.45, seed: 25 },
      { cx: 0.84, cy: 0.36, scale: 1.05, seed: 42 }
    ];
    this.spiritMotes = Array.from({ length: 55 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 1.5 + Math.random() * 3.5,
      speedX: 0.02 + Math.random() * 0.04,
      speedY: -0.015 - Math.random() * 0.03,
      phase: Math.random() * Math.PI * 2
    }));

    // 4. Vintage 1928 Cartoon Steam Puffs & Musical Notes
    this.steamPuffs = [];
    this.musicalNotes = [];
    this.lastBeatTime = -1;
    this.lastNoteSpawn = 0;
    this.bounceEnv = 0;

    // 5. Dune Spice Dust & Seismic Ripples
    this.spiceParticles = Array.from({ length: 140 }, (_, i) => ({
      x: Math.random(),
      y: 0.2 + Math.random() * 0.8,
      size: 1.0 + Math.random() * 2.5,
      speed: 0.05 + Math.random() * 0.14,
      isBlueSpice: i % 4 === 0,
      phase: Math.random() * Math.PI * 2
    }));
    this.seismicRipples = [];
  }

  /**
   * Advance continuous procedural time.
   */
  update(deltaTime, speed = 1.0) {
    const dt = deltaTime * speed;
    this.time += dt;
    this.bounceEnv = Math.max(0, this.bounceEnv - dt * 4.5);

    // Update Vintage Cartoon steam puffs & notes
    for (let i = this.steamPuffs.length - 1; i >= 0; i--) {
      const p = this.steamPuffs[i];
      p.age += dt;
      p.x -= dt * 0.09;
      p.y -= dt * 0.07;
      p.r += dt * 0.025;
      if (p.age > p.maxAge) this.steamPuffs.splice(i, 1);
    }

    for (let i = this.musicalNotes.length - 1; i >= 0; i--) {
      const n = this.musicalNotes[i];
      n.age += dt;
      n.x += n.vx * dt;
      n.y += n.vy * dt + Math.sin(this.time * 6 + n.phase) * 0.04 * dt;
      if (n.age > n.maxAge) this.musicalNotes.splice(i, 1);
    }

    // Update Dune seismic ripples
    for (let i = this.seismicRipples.length - 1; i >= 0; i--) {
      const r = this.seismicRipples[i];
      r.age += dt;
      r.radius += dt * 0.28;
      if (r.age > r.maxAge) this.seismicRipples.splice(i, 1);
    }
  }

  /**
   * Analytical 3D height/elevation of terrain at coordinates (x, y)
   * Adapts to the active World Construct so 3D Wireframe and terrain sampling match.
   */
  getElevation(x, y, time = this.time, chaos = 1.0, audioBass = 0, construct = 'cosmic_default') {
    const scale = 0.0035 * chaos;

    if (construct === 'blade_runner') {
      // Stepped urban ziggurat / megastructure grid blocks
      const bx = Math.floor(x * 0.012);
      const by = Math.floor((y + time * 50) * 0.012);
      const cellNoise = this.noise.noise2D(bx * 0.7, by * 0.7);
      const stepped = Math.floor(Math.max(0, cellNoise + 0.3) * 4) / 4;
      return stepped * (1.2 + audioBass * 0.5);
    }

    if (construct === 'dune_arrakis') {
      // Sharp wind-carved sand dune ridges (absridge FBM)
      const nx = x * scale * 0.8;
      const ny = (y + time * 35) * scale * 0.8;
      const raw = this.noise.noise2D(nx, ny);
      const ridge = 1.0 - Math.abs(raw); // Sharp dune crest
      const ripple = Math.sin(x * 0.04 + y * 0.02 - time * 6) * 0.15 * audioBass;
      return ridge * ridge * 1.3 + ripple;
    }

    if (construct === 'studio_ghibli') {
      // Soft rolling pastoral hills with gentle wind waves
      const gentle = this.noise.fbm2D(x * scale * 0.6, (y + time * 30) * scale * 0.6, 3, 2.0, 0.45);
      const windWave = Math.sin(x * 0.01 + y * 0.01 - time * 2.5) * 0.18;
      return gentle * 0.85 + windWave + audioBass * 0.25;
    }

    if (construct === 'vintage_cartoon') {
      // Bouncing rubber-hose sine waves
      const bounce = Math.sin(time * 8) * (0.3 + audioBass * 0.5);
      return Math.sin(x * 0.015 + time * 4) * Math.cos(y * 0.015 - time * 3) * (0.7 + bounce);
    }

    // Default Cosmic elevation
    const warpX = this.noise.noise2D(x * scale * 0.5, y * scale * 0.5 + time * 0.2) * 1.5;
    const warpY = this.noise.noise2D(x * scale * 0.5 + 50, y * scale * 0.5 + time * 0.2) * 1.5;
    const base = this.noise.fbm2D(x * scale + warpX, (y + time * 60) * scale + warpY, 4, 2.0, 0.55);
    const audioBoost = audioBass * 0.45 * Math.sin(x * scale * 4 + time * 3);
    return base + audioBoost;
  }

  /**
   * Flow field vector (angle and magnitude) at (x, y) for fluid brushstrokes and particles.
   * Adapts to the active World Construct so Impressionist & Stained Glass modes reflect the construct's motion.
   */
  getFlowVector(x, y, time = this.time, chaos = 1.0, construct = null) {
    const activeConstruct = construct || this.lastConstruct || 'cosmic_default';

    if (activeConstruct === 'blade_runner') {
      // Slanted cyberpunk rain streaks + horizontal spinner traffic highways
      const isTrafficBand = Math.sin(y * 0.025 + time) > 0.55;
      if (isTrafficBand) {
        return { angle: 0.0, speed: 32 * chaos };
      }
      return { angle: Math.PI * 0.62, speed: 28 * chaos };
    }

    if (activeConstruct === 'studio_ghibli') {
      // Gentle sweeping meadow breeze & billowing cloud thermals
      const scale = 0.002 * chaos;
      const n = this.noise.noise3D(x * scale, y * scale, time * 0.25);
      const angle = n * 0.8 - 0.15; // Predominantly sweeping right-upward breeze
      return { angle, speed: 18 + Math.abs(n) * 20 };
    }

    if (activeConstruct === 'vintage_cartoon') {
      // Bouncing rhythmic arcs
      const angle = Math.sin(x * 0.01 + time * 5) * 0.9;
      return { angle, speed: 24 * chaos };
    }

    if (activeConstruct === 'dune_arrakis') {
      // Sweeping desert Coriolis sandstorm + radial sandworm ripples
      const scale = 0.0022 * chaos;
      const n = this.noise.noise3D(x * scale, y * scale * 0.5, time * 0.3);
      const angle = n * 0.5 + 0.12;
      return { angle, speed: 26 + Math.abs(n) * 25 };
    }

    // Cosmic Default curl noise
    const scale = 0.0025 * chaos;
    const eps = 2.0;
    const n1 = this.noise.noise3D(x * scale, y * scale, time * 0.35);
    const n2 = this.noise.noise3D((x + eps) * scale, y * scale, time * 0.35);
    const n3 = this.noise.noise3D(x * scale, (y + eps) * scale, time * 0.35);

    const dx = (n2 - n1) / eps;
    const dy = (n3 - n1) / eps;
    const angle = Math.atan2(dx, -dy);
    const speed = Math.sqrt(dx * dx + dy * dy) * 45 + 0.5;
    return { angle, speed };
  }

  /**
   * Update and render the offscreen semantic buffer (480x270) for filter engines (ASCII, Impressionist, Stained Glass).
   */
  renderOffscreen(state, audioData = {}) {
    const ctx = this.offscreenCtx;
    const w = this.offscreenCanvas.width;
    const h = this.offscreenCanvas.height;

    this.lastConstruct = state.visual.construct || 'blade_runner';
    this.renderConstructToContext(ctx, w, h, state, audioData, false);

    // Cache image data for rapid sampling by ASCII, Impressionist, and Stained Glass engines
    this.offscreenData = ctx.getImageData(0, 0, w, h);
    return this.offscreenCanvas;
  }

  /**
   * Render the active World Construct onto any target 2D canvas context at resolution (w, h).
   */
  renderConstructToContext(ctx, w, h, state, audioData = {}, isHighRes = true) {
    const construct = state.visual.construct || 'blade_runner';
    const bass = Math.max(audioData.bass || 0, (audioData.bassActivity || 0) * 0.75);
    const mid = Math.max(audioData.mid || 0, (audioData.padActivity || 0) * 0.7);
    const treble = Math.max(audioData.treble || 0, (audioData.leadActivity || 0) * 0.85);
    const beat = audioData.beat || (audioData.drumsActivity || 0) > 0.5;

    if (beat && this.time - this.lastBeatTime > 0.18) {
      this.lastBeatTime = this.time;
      this.bounceEnv = 1.0;

      // Spawn vintage steam puffs on beat
      if (construct === 'vintage_cartoon' && this.steamPuffs.length < 18) {
        [0, 1, 2].forEach((stackIdx) => {
          this.steamPuffs.push({
            x: 0.44 + stackIdx * 0.045,
            y: 0.42 - stackIdx * 0.02,
            r: 0.016 + stackIdx * 0.004,
            age: 0,
            maxAge: 1.8
          });
        });
      }

      // Spawn Dune seismic shockwave on beat/bass
      if (construct === 'dune_arrakis' && this.seismicRipples.length < 6) {
        this.seismicRipples.push({
          x: 0.5,
          y: 0.76,
          radius: 0.02,
          age: 0,
          maxAge: 2.2
        });
      }
    }

    // Spawn musical notes on lead activity in Vintage Cartoon
    if (construct === 'vintage_cartoon' && treble > 0.25 && this.time - this.lastNoteSpawn > 0.22) {
      this.lastNoteSpawn = this.time;
      const glyphs = ['♪', '♫', '♬', '♩'];
      this.musicalNotes.push({
        x: 0.45 + Math.random() * 0.12,
        y: 0.38,
        vx: (Math.random() - 0.35) * 0.12,
        vy: -0.08 - Math.random() * 0.06,
        glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
        phase: Math.random() * Math.PI * 2,
        age: 0,
        maxAge: 2.4
      });
    }

    const audio = { bass, mid, treble, beat };

    switch (construct) {
      case 'blade_runner':
        this._renderBladeRunner(ctx, w, h, state, audio, isHighRes);
        break;
      case 'studio_ghibli':
        this._renderStudioGhibli(ctx, w, h, state, audio, isHighRes);
        break;
      case 'vintage_cartoon':
        this._renderVintageCartoon(ctx, w, h, state, audio, isHighRes);
        break;
      case 'dune_arrakis':
        this._renderDuneArrakis(ctx, w, h, state, audio, isHighRes);
        break;
      case 'cosmic_default':
      default:
        this._renderCosmicDefault(ctx, w, h, state, audio, isHighRes);
        break;
    }
  }

  // ============================================================================
  // 1. BLADE RUNNER CONSTRUCT (Neo-Noir 2049 Megacity)
  // ============================================================================
  _renderBladeRunner(ctx, w, h, state, audio, isHighRes) {
    const t = this.time;
    const shift = state.visual.paletteShift || 0;
    const density = state.visual.density || 1.0;
    const { bass, mid, treble, beat } = audio;

    const skyHue = (200 + shift) % 360;
    const smogHue = (28 + shift) % 360;
    const neonCyan = (186 + shift) % 360;
    const neonPink = (335 + shift) % 360;

    // 1. Dystopian Smog & Sodium-Vapor Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, `hsl(${skyHue}, 70%, 4%)`);
    skyGrad.addColorStop(0.42, `hsl(${skyHue}, 55%, 10%)`);
    skyGrad.addColorStop(0.72, `hsl(${smogHue}, 85%, ${18 + bass * 8}%)`);
    skyGrad.addColorStop(1, `hsl(${skyHue}, 65%, 6%)`);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Sweeping Volumetric Searchlights
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const beamCount = 4;
    for (let i = 0; i < beamCount; i++) {
      const bx = w * (0.18 + i * 0.22);
      const by = h * 0.68;
      const angle = -Math.PI * 0.5 + Math.sin(t * (0.4 + i * 0.15) + i * 2) * 0.55;
      const beamLen = h * 0.85;
      const spread = w * 0.08;

      const bGrad = ctx.createLinearGradient(bx, by, bx + Math.cos(angle) * beamLen, by + Math.sin(angle) * beamLen);
      const bHue = i % 2 === 0 ? neonCyan : smogHue;
      bGrad.addColorStop(0, `hsla(${bHue}, 95%, 70%, ${0.22 + mid * 0.2})`);
      bGrad.addColorStop(1, `hsla(${bHue}, 95%, 60%, 0)`);

      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(angle - 0.12) * beamLen - spread * 0.3, by + Math.sin(angle - 0.12) * beamLen);
      ctx.lineTo(bx + Math.cos(angle + 0.12) * beamLen + spread * 0.3, by + Math.sin(angle + 0.12) * beamLen);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 3. Brutalist Tyrell / Wallace Megastructure Pyramids
    const horizonY = h * 0.66;
    const pyramids = [
      { cx: w * 0.18, baseW: w * 0.34, topW: w * 0.07, height: h * 0.32, z: 0.6 },
      { cx: w * 0.52, baseW: w * 0.48, topW: w * 0.11, height: h * 0.46, z: 1.0 },
      { cx: w * 0.85, baseW: w * 0.32, topW: w * 0.06, height: h * 0.29, z: 0.7 }
    ];

    for (const pyr of pyramids) {
      const topY = horizonY - pyr.height * (1 + bass * 0.06);
      const leftBase = pyr.cx - pyr.baseW * 0.5;
      const rightBase = pyr.cx + pyr.baseW * 0.5;
      const leftTop = pyr.cx - pyr.topW * 0.5;
      const rightTop = pyr.cx + pyr.topW * 0.5;

      // Left dark concrete slope
      ctx.fillStyle = `hsl(${skyHue}, 40%, ${6 + pyr.z * 3}%)`;
      ctx.beginPath();
      ctx.moveTo(leftBase, horizonY);
      ctx.lineTo(leftTop, topY);
      ctx.lineTo(pyr.cx, topY);
      ctx.lineTo(pyr.cx, horizonY);
      ctx.closePath();
      ctx.fill();

      // Right smog-lit slope
      const rightGrad = ctx.createLinearGradient(pyr.cx, topY, rightBase, horizonY);
      rightGrad.addColorStop(0, `hsl(${skyHue}, 35%, 12%)`);
      rightGrad.addColorStop(1, `hsl(${smogHue}, 65%, 16%)`);
      ctx.fillStyle = rightGrad;
      ctx.beginPath();
      ctx.moveTo(pyr.cx, horizonY);
      ctx.lineTo(pyr.cx, topY);
      ctx.lineTo(rightTop, topY);
      ctx.lineTo(rightBase, horizonY);
      ctx.closePath();
      ctx.fill();

      // Glowing structural ribs
      ctx.strokeStyle = `hsla(${smogHue}, 90%, 55%, ${0.35 + mid * 0.3})`;
      ctx.lineWidth = isHighRes ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(leftBase, horizonY);
      ctx.lineTo(leftTop, topY);
      ctx.lineTo(rightTop, topY);
      ctx.lineTo(rightBase, horizonY);
      ctx.moveTo(pyr.cx, topY);
      ctx.lineTo(pyr.cx, horizonY);
      ctx.stroke();

      // Tiered Micro-Window Grids across the pyramid face
      const rows = isHighRes ? Math.floor(14 * pyr.z) : 7;
      for (let r = 1; r < rows; r++) {
        const frac = r / rows;
        const wy = topY + frac * (horizonY - topY);
        const spanLeft = leftTop + frac * (leftBase - leftTop);
        const spanRight = rightTop + frac * (rightBase - rightTop);
        const winCount = Math.floor((isHighRes ? 18 : 8) * frac * density);

        for (let c = 1; c < winCount; c++) {
          const nVal = this.noise.noise2D(c * 1.7 + pyr.cx, r * 2.3 + Math.floor(t * 2));
          if (nVal > -0.1) {
            const wx = spanLeft + (c / winCount) * (spanRight - spanLeft);
            const isCyan = (c + r) % 5 === 0;
            ctx.fillStyle = isCyan
              ? `hsla(${neonCyan}, 100%, 70%, ${0.5 + treble * 0.45})`
              : `hsla(${smogHue}, 100%, 68%, ${0.45 + mid * 0.4})`;
            const ww = isHighRes ? 3 : 1.5;
            const wh = isHighRes ? 2 : 1.2;
            ctx.fillRect(wx, wy, ww, wh);
          }
        }
      }

      // Red Aviation Warning Beacons on Pyramid Peaks
      const beaconPulse = 0.5 + 0.5 * Math.sin(t * 6 + pyr.cx) + (beat ? 0.5 : 0);
      for (const bx of [leftTop, pyr.cx, rightTop]) {
        const bGrad = ctx.createRadialGradient(bx, topY, 1, bx, topY, (isHighRes ? 16 : 7) * beaconPulse);
        bGrad.addColorStop(0, '#ffffff');
        bGrad.addColorStop(0.3, 'rgba(255, 30, 60, 0.95)');
        bGrad.addColorStop(1, 'rgba(255, 0, 40, 0)');
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(bx, topY, (isHighRes ? 16 : 7) * beaconPulse, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Giant Translucent Hologram Projection (Right-Center Plaza)
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const holoX = w * 0.72;
    const holoBaseY = horizonY + h * 0.05;
    const holoH = h * (0.36 + bass * 0.06);
    const holoW = w * 0.09;
    const glitchX = beat ? (Math.random() - 0.5) * 8 : 0;

    const holoGrad = ctx.createLinearGradient(holoX, holoBaseY - holoH, holoX, holoBaseY);
    holoGrad.addColorStop(0, `hsla(${neonPink}, 100%, 65%, 0)`);
    holoGrad.addColorStop(0.3, `hsla(${neonPink}, 100%, 65%, ${0.35 + treble * 0.35})`);
    holoGrad.addColorStop(0.8, `hsla(${neonCyan}, 100%, 65%, ${0.4 + mid * 0.3})`);
    holoGrad.addColorStop(1, `hsla(${neonCyan}, 100%, 75%, 0.7)`);
    ctx.fillStyle = holoGrad;

    // Segmented hologram scan-bars
    const holoSlices = isHighRes ? 22 : 10;
    for (let s = 0; s < holoSlices; s++) {
      const sf = s / holoSlices;
      const sy = holoBaseY - sf * holoH;
      const sliceW = holoW * (0.4 + 0.6 * Math.sin(sf * Math.PI)) * (1 + 0.15 * Math.sin(t * 8 + s));
      ctx.fillRect(holoX - sliceW * 0.5 + glitchX, sy, sliceW, (holoH / holoSlices) * 0.68);
    }
    ctx.restore();

    // 5. Lower Megacity Street Canyons & Wet Neon Reflections
    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);
    groundGrad.addColorStop(0, `hsl(${smogHue}, 75%, 12%)`);
    groundGrad.addColorStop(0.35, `hsl(${skyHue}, 65%, 6%)`);
    groundGrad.addColorStop(1, `hsl(${skyHue}, 80%, 3%)`);
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizonY, w, h - horizonY);

    // Shimmering wet pavement reflection strips
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const reflCount = isHighRes ? 28 : 12;
    for (let i = 0; i < reflCount; i++) {
      const frac = i / reflCount;
      const ry = horizonY + frac * (h - horizonY);
      const rw = w * (0.06 + frac * 0.25) * (0.7 + 0.3 * Math.sin(t * 4 + i));
      const rx = w * (0.15 + ((i * 0.29) % 0.7)) + Math.sin(t * 2 + i) * 15;
      const rHue = i % 3 === 0 ? neonPink : (i % 2 === 0 ? neonCyan : smogHue);
      ctx.fillStyle = `hsla(${rHue}, 95%, 60%, ${(1 - frac * 0.5) * (0.25 + bass * 0.25)})`;
      ctx.fillRect(rx - rw * 0.5, ry, rw, isHighRes ? 2.5 : 1.5);
    }

    // 6. Flying Spinner Traffic Streams (Headlights & Tail-Light Ribbons)
    for (const sp of this.spinners) {
      const sx = ((sp.x + t * sp.speed) % 1.2 + 1.2) % 1.2 - 0.1;
      const sy = sp.y * h + Math.sin(t * 3 + sp.z * 10) * 4;
      const px = sx * w;
      const dir = sp.speed >= 0 ? 1 : -1;
      const trailLen = (isHighRes ? 45 : 22) * sp.z * (1 + bass * 0.5);
      const spHue = dir > 0 ? neonCyan : (sp.isPolice ? 355 : smogHue);

      const tGrad = ctx.createLinearGradient(px, sy, px - dir * trailLen, sy);
      tGrad.addColorStop(0, '#ffffff');
      tGrad.addColorStop(0.25, `hsla(${spHue}, 100%, 65%, 0.9)`);
      tGrad.addColorStop(1, `hsla(${spHue}, 100%, 50%, 0)`);

      ctx.strokeStyle = tGrad;
      ctx.lineWidth = (isHighRes ? 2.5 : 1.5) * sp.z;
      ctx.beginPath();
      ctx.moveTo(px, sy);
      ctx.lineTo(px - dir * trailLen, sy);
      ctx.stroke();

      // Police Spinner Strobe Flash
      if (sp.isPolice && Math.sin(t * 18 + sp.z * 20) > 0.3) {
        ctx.fillStyle = 'rgba(0, 220, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(px, sy, isHighRes ? 4 : 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 7. Heavy Slanted Cyberpunk Rain
    if (isHighRes) {
      ctx.strokeStyle = `hsla(${neonCyan}, 80%, 80%, ${0.22 + treble * 0.2})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      const dropLimit = Math.min(this.rainDrops.length, Math.floor(150 * density));
      for (let i = 0; i < dropLimit; i++) {
        const d = this.rainDrops[i];
        const dy = ((d.y + t * d.speed) % 1.0) * h;
        const dx = ((d.x - t * d.speed * 0.18) % 1.0 + 1.0) % 1.0 * w;
        const len = d.len * h;
        ctx.moveTo(dx, dy);
        ctx.lineTo(dx - len * 0.2, dy + len);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // ============================================================================
  // 2. STUDIO GHIBLI CONSTRUCT (Pastoral Miyazaki Sky & Floating Castle)
  // ============================================================================
  _renderStudioGhibli(ctx, w, h, state, audio, isHighRes) {
    const t = this.time;
    const shift = state.visual.paletteShift || 0;
    const density = state.visual.density || 1.0;
    const { bass, mid, treble, beat } = audio;

    const skyHue = (206 + shift) % 360;
    const meadowHue = (118 + shift) % 360;

    // 1. Vivid Cerulean Summer Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.68);
    skyGrad.addColorStop(0, `hsl(${skyHue}, 78%, 36%)`);
    skyGrad.addColorStop(0.5, `hsl(${(skyHue - 6 + 360) % 360}, 82%, 58%)`);
    skyGrad.addColorStop(1, `hsl(${(skyHue - 18 + 360) % 360}, 70%, 84%)`);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Towering Hand-Painted Cumulonimbus Clouds
    for (const cloud of this.ghibliClouds) {
      const cx = ((cloud.cx + t * 0.008) % 1.3 - 0.15) * w;
      const cy = cloud.cy * h + Math.sin(t * 0.7 + cloud.seed) * 4;
      const baseR = h * 0.13 * cloud.scale * (1 + bass * 0.08);

      // Cloud shadow base (soft lavender-blue)
      ctx.fillStyle = `hsl(${skyHue}, 38%, 74%)`;
      this._drawCloudCluster(ctx, cx, cy + baseR * 0.18, baseR * 0.95, cloud.seed, isHighRes);

      // Cloud mid-body (warm ivory)
      ctx.fillStyle = `hsl(${(48 + shift) % 360}, 65%, 92%)`;
      this._drawCloudCluster(ctx, cx, cy, baseR, cloud.seed, isHighRes);

      // Cloud sunlit top rim (radiant cream-white)
      ctx.fillStyle = `hsl(${(52 + shift) % 360}, 90%, 98%)`;
      this._drawCloudCluster(ctx, cx - baseR * 0.06, cy - baseR * 0.12, baseR * 0.85, cloud.seed + 7, isHighRes);
    }

    // 3. Floating Sky-Castle / Airship Silhouette (Laputa / Howl Inspired)
    const castleX = ((0.62 - t * 0.015) % 1.2 + 1.2) % 1.2 * w - w * 0.1;
    const castleY = h * 0.27 + Math.sin(t * 1.4) * (h * 0.015);
    const cScale = h * 0.0012;

    ctx.save();
    ctx.translate(castleX, castleY);
    ctx.scale(cScale, cScale);

    // Trailing white steam puffs behind airship
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    for (let p = 1; p <= 5; p++) {
      const px = p * 22 + Math.sin(t * 4 + p) * 4;
      const py = -8 + Math.cos(t * 3 + p) * 5;
      ctx.beginPath();
      ctx.arc(px, py, 6 + p * 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lower stone island inverted cone
    ctx.fillStyle = '#3b4a54';
    ctx.beginPath();
    ctx.moveTo(-48, 0);
    ctx.lineTo(48, 0);
    ctx.lineTo(22, 34);
    ctx.lineTo(-18, 38);
    ctx.closePath();
    ctx.fill();

    // Terraced green garden dome
    ctx.fillStyle = `hsl(${meadowHue}, 58%, 38%)`;
    ctx.beginPath();
    ctx.arc(0, 0, 46, Math.PI, 0);
    ctx.fill();

    // Citadel towers & domes
    ctx.fillStyle = '#d4c5a9';
    ctx.fillRect(-26, -42, 16, 30);
    ctx.fillRect(10, -38, 15, 26);
    ctx.fillRect(-10, -58, 20, 45);
    // Warm glowing tower windows
    ctx.fillStyle = `rgba(255, 230, 130, ${0.7 + treble * 0.3})`;
    ctx.fillRect(-4, -48, 8, 12);
    ctx.restore();

    // 4. Rolling Wind-Swept Grass Meadow Hills (4 Layers)
    const hillLayers = [
      { yBase: 0.56, amp: 0.05, sat: 48, lum: 42, speed: 0.3 },
      { yBase: 0.64, amp: 0.06, sat: 58, lum: 36, speed: 0.5 },
      { yBase: 0.74, amp: 0.07, sat: 66, lum: 30, speed: 0.8 },
      { yBase: 0.85, amp: 0.06, sat: 72, lum: 24, speed: 1.2 }
    ];

    hillLayers.forEach((hl, idx) => {
      const baseY = h * hl.yBase;
      const hillGrad = ctx.createLinearGradient(0, baseY - h * 0.08, 0, h);
      hillGrad.addColorStop(0, `hsl(${(meadowHue - 8 + idx * 4) % 360}, ${hl.sat + 12}%, ${hl.lum + 14 + mid * 8}%)`);
      hillGrad.addColorStop(1, `hsl(${meadowHue}, ${hl.sat}%, ${hl.lum}%)`);

      ctx.fillStyle = hillGrad;
      ctx.beginPath();
      ctx.moveTo(0, h);
      const step = isHighRes ? 8 : 16;
      for (let x = 0; x <= w + step; x += step) {
        const n = this.noise.noise2D(x * 0.0025 + idx * 10, t * 0.15 * hl.speed);
        const windRipple = Math.sin(x * 0.012 - t * (2.2 + idx * 0.5)) * (6 + bass * 10);
        const y = baseY + n * h * hl.amp + windRipple;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Traveling sunlit wind-gust ribbons across the grass
      ctx.strokeStyle = `hsla(${(meadowHue - 18 + 360) % 360}, 85%, 68%, ${0.32 + mid * 0.25})`;
      ctx.lineWidth = isHighRes ? 2.5 : 1.5;
      ctx.stroke();

      // Foreground individual swaying grass blades & wildflowers
      if (isHighRes && idx >= 2) {
        const bladeCount = Math.floor(48 * density);
        const windBend = (12 + bass * 18) * (0.6 + 0.4 * Math.sin(t * 2.5 + idx));
        ctx.strokeStyle = `hsl(${(meadowHue - 12 + 360) % 360}, 75%, ${hl.lum + 18}%)`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let b = 0; b < bladeCount; b++) {
          const bx = ((b / bladeCount) * w + idx * 37) % w;
          const by = baseY + (b % 5) * 14 + 10;
          const bHeight = 14 + (b % 4) * 5;
          ctx.moveTo(bx, by);
          ctx.quadraticCurveTo(bx + windBend * 0.5, by - bHeight * 0.6, bx + windBend, by - bHeight);
        }
        ctx.stroke();

        // Wildflowers (soft coral pink, sunny yellow, white)
        for (let f = 0; f < Math.floor(bladeCount * 0.35); f++) {
          const fx = ((f * 73 + idx * 50) % w) + windBend * 0.8;
          const fy = baseY + (f % 4) * 16 + 4;
          ctx.fillStyle = f % 3 === 0 ? '#ff7b89' : (f % 2 === 0 ? '#ffe66d' : '#ffffff');
          ctx.beginPath();
          ctx.arc(fx, fy, 2.8 + (beat ? 1.2 : 0), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    // 5. Floating Kodama / Spirit Motes & Dandelion Seeds
    ctx.save();
    for (const m of this.spiritMotes) {
      const mx = ((m.x + t * m.speedX) % 1.0) * w;
      const my = ((m.y + t * m.speedY) % 1.0 + 1.0) % 1.0 * h;
      const pulse = 0.5 + 0.5 * Math.sin(t * 4 + m.phase) + treble * 0.6;
      const r = m.size * (isHighRes ? 1.5 : 0.9) * (0.8 + pulse * 0.4);

      const mGrad = ctx.createRadialGradient(mx, my, 0, mx, my, r * 2.5);
      mGrad.addColorStop(0, `rgba(255, 255, 240, ${Math.min(1, 0.75 * pulse)})`);
      mGrad.addColorStop(0.5, `rgba(190, 255, 210, ${0.35 * pulse})`);
      mGrad.addColorStop(1, 'rgba(190, 255, 210, 0)');
      ctx.fillStyle = mGrad;
      ctx.beginPath();
      ctx.arc(mx, my, r * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _drawCloudCluster(ctx, cx, cy, baseR, seed, isHighRes) {
    const puffs = isHighRes ? 9 : 5;
    ctx.beginPath();
    for (let i = 0; i < puffs; i++) {
      const angle = (i / puffs) * Math.PI * 1.4 - Math.PI * 1.2;
      const dist = baseR * (0.35 + 0.45 * Math.cos(i * 1.9 + seed));
      const px = cx + Math.cos(angle) * dist * 1.35;
      const py = cy + Math.sin(angle) * dist * 0.7;
      const pr = baseR * (0.48 + 0.25 * Math.sin(i * 2.3 + seed));
      ctx.moveTo(px + pr, py);
      ctx.arc(px, py, pr, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  // ============================================================================
  // 3. VINTAGE 1928 CARTOON CONSTRUCT ("Steamboat" Rubber-Hose Ink & Cel)
  // ============================================================================
  _renderVintageCartoon(ctx, w, h, state, audio, isHighRes) {
    const t = this.time;
    const shift = state.visual.paletteShift || 0;
    const { bass, mid, treble, beat } = audio;

    // 1928 Silver-Nitrate Sepia / Monochrome Palette (tintable via Palette Shift)
    const baseHue = (38 + shift) % 360;
    const sat = shift === 0 ? 18 : 45;
    const flicker = 0.96 + 0.04 * Math.sin(t * 28) * Math.cos(t * 19);

    const paperLight = `hsl(${baseHue}, ${sat}%, ${Math.min(95, 88 * flicker)}%)`;
    const paperMid = `hsl(${baseHue}, ${sat}%, ${Math.min(85, 72 * flicker)}%)`;
    const celGrayDark = `hsl(${baseHue}, ${Math.floor(sat * 0.6)}%, 36%)`;
    const celGrayMid = `hsl(${baseHue}, ${Math.floor(sat * 0.6)}%, 54%)`;
    const inkBlack = `hsl(${baseHue}, 15%, 10%)`;

    // 1. Vintage Paper Cel Sky Background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.7);
    skyGrad.addColorStop(0, paperMid);
    skyGrad.addColorStop(1, paperLight);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Bouncing Retro Sun with Smiling Pie-Cut Eyes
    const bounce = Math.sin(t * 8.5) * (0.12 + bass * 0.22) + this.bounceEnv * 0.2;
    const sunX = w * 0.2;
    const sunY = h * 0.22 - Math.abs(bounce) * h * 0.04;
    const sunR = h * 0.085;

    ctx.save();
    ctx.translate(sunX, sunY);
    ctx.scale(1 - bounce * 0.15, 1 + bounce * 0.15);
    ctx.fillStyle = paperLight;
    ctx.strokeStyle = inkBlack;
    ctx.lineWidth = isHighRes ? 3.5 : 2;
    ctx.beginPath();
    ctx.arc(0, 0, sunR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pie-cut eyes on sun
    ctx.fillStyle = inkBlack;
    [-sunR * 0.28, sunR * 0.28].forEach((ex) => {
      ctx.beginPath();
      ctx.arc(ex, -sunR * 0.1, sunR * 0.13, 0.2, Math.PI * 1.85);
      ctx.lineTo(ex, -sunR * 0.1);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();

    // 3. Swaying Rubber-Hose Cartoon Hills in Background
    const horizonY = h * 0.64;
    ctx.fillStyle = celGrayMid;
    ctx.strokeStyle = inkBlack;
    ctx.lineWidth = isHighRes ? 3.5 : 2;

    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    const sway = Math.sin(t * 4.25) * (w * 0.025);
    ctx.bezierCurveTo(w * 0.15 + sway, horizonY - h * (0.18 + bass * 0.06), w * 0.35 + sway, horizonY - h * 0.16, w * 0.5, horizonY);
    ctx.bezierCurveTo(w * 0.68 - sway, horizonY - h * (0.22 + mid * 0.06), w * 0.88 - sway, horizonY - h * 0.14, w, horizonY);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 4. The 1928 Steamboat & Rubber-Hose Captain (Center Stage)
    const boatX = w * 0.52 + Math.sin(t * 1.8) * (w * 0.03);
    const boatY = horizonY + h * 0.05 + Math.sin(t * 8.5) * (h * 0.012);
    const bScale = h / 460;

    ctx.save();
    ctx.translate(boatX, boatY);
    // Elastic Squash-and-Stretch on the entire boat assembly!
    const sqX = 1.0 - bounce * 0.22;
    const sqY = 1.0 + bounce * 0.28;
    ctx.scale(bScale * sqX, bScale * sqY);

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = inkBlack;
    ctx.lineWidth = 4.2;

    // 3 Graduated Smokestacks (tilting & puffing in rhythm)
    const stackSpecs = [
      { x: -38, h: 68, w: 18, phase: 0 },
      { x: -10, h: 54, w: 16, phase: 0.8 },
      { x: 16,  h: 42, w: 14, phase: 1.6 }
    ];
    stackSpecs.forEach((st) => {
      const stTilt = Math.sin(t * 8.5 + st.phase) * 8;
      ctx.fillStyle = celGrayDark;
      ctx.beginPath();
      ctx.moveTo(st.x - st.w * 0.5, -36);
      ctx.quadraticCurveTo(st.x - st.w * 0.5 + stTilt * 0.5, -36 - st.h * 0.5, st.x - st.w * 0.6 + stTilt, -36 - st.h);
      ctx.lineTo(st.x + st.w * 0.6 + stTilt, -36 - st.h);
      ctx.quadraticCurveTo(st.x + st.w * 0.5 + stTilt * 0.5, -36 - st.h * 0.5, st.x + st.w * 0.5, -36);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    // Main Steamboat Deck Cabin
    ctx.fillStyle = paperLight;
    ctx.beginPath();
    ctx.rect(-85, -38, 160, 38);
    ctx.fill();
    ctx.stroke();

    // Pilot Wheelhouse & Whistling Rubber-Hose Captain Silhouette
    ctx.fillStyle = paperMid;
    ctx.beginPath();
    ctx.rect(-105, -76, 56, 38);
    ctx.fill();
    ctx.stroke();

    // Ship Steering Wheel & Iconic Rubber-Hose Silhouette (Round ears, pie eyes, whistling motion)
    const capBounce = Math.abs(Math.sin(t * 8.5)) * 6;
    ctx.fillStyle = inkBlack;
    // Head
    ctx.beginPath();
    ctx.arc(-78, -56 - capBounce, 10, 0, Math.PI * 2);
    ctx.fill();
    // Two Iconic Round Ears
    ctx.beginPath();
    ctx.arc(-69, -65 - capBounce, 6.5, 0, Math.PI * 2);
    ctx.arc(-85, -66 - capBounce, 6.0, 0, Math.PI * 2);
    ctx.fill();
    // Snout whistling to the left
    ctx.beginPath();
    ctx.ellipse(-89, -55 - capBounce, 6, 3.5, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Boat Hull
    ctx.fillStyle = celGrayDark;
    ctx.beginPath();
    ctx.moveTo(-125, -4);
    ctx.lineTo(105, -4);
    ctx.lineTo(85, 32);
    ctx.lineTo(-105, 32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Spinning Side Paddlewheel
    const wheelX = 18;
    const wheelY = 12;
    const wheelR = 28;
    ctx.fillStyle = paperLight;
    ctx.beginPath();
    ctx.arc(wheelX, wheelY, wheelR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    for (let sp = 0; sp < 8; sp++) {
      const ang = t * 5 + (sp / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(wheelX, wheelY);
      ctx.lineTo(wheelX + Math.cos(ang) * wheelR, wheelY + Math.sin(ang) * wheelR);
      ctx.stroke();
    }
    ctx.restore();

    // 5. Puffing Cartoon Steam Clouds & Dancing Musical Notes
    for (const p of this.steamPuffs) {
      const alpha = Math.max(0, 1 - p.age / p.maxAge);
      const px = p.x * w;
      const py = p.y * h;
      const pr = p.r * h;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = paperLight;
      ctx.strokeStyle = inkBlack;
      ctx.lineWidth = isHighRes ? 3 : 1.5;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    if (isHighRes) {
      ctx.save();
      ctx.fillStyle = inkBlack;
      ctx.font = `bold ${Math.floor(h * 0.045)}px serif`;
      for (const n of this.musicalNotes) {
        const alpha = Math.max(0, 1 - n.age / n.maxAge);
        ctx.globalAlpha = alpha;
        ctx.fillText(n.glyph, n.x * w, n.y * h);
      }
      ctx.restore();
    }

    // 6. Rolling Ink-Outlined River Waves in Foreground
    for (let layer = 0; layer < 3; layer++) {
      const wyBase = horizonY + h * (0.09 + layer * 0.09);
      ctx.fillStyle = layer % 2 === 0 ? paperMid : celGrayMid;
      ctx.strokeStyle = inkBlack;
      ctx.lineWidth = isHighRes ? 3.5 : 2;

      ctx.beginPath();
      ctx.moveTo(0, h);
      const step = isHighRes ? 12 : 20;
      for (let x = 0; x <= w + step; x += step) {
        const wave = Math.sin(x * 0.025 + t * (5 + layer * 1.5) + layer) * (8 + bass * 10);
        ctx.lineTo(x, wyBase + wave);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 7. 1928 Celluloid Film Scratches & Iris Vignette
    if (isHighRes) {
      ctx.save();
      // Vertical projector scratches
      ctx.strokeStyle = `rgba(30, 25, 20, ${0.18 + Math.random() * 0.15})`;
      ctx.lineWidth = 1.2;
      for (let s = 0; s < 2; s++) {
        const sx = ((Math.sin(t * 17 + s * 43) * 0.5 + 0.5) * w);
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx + (Math.random() - 0.5) * 6, h);
        ctx.stroke();
      }

      // Classic Vintage Iris Vignette
      const vGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, h * 0.35, w * 0.5, h * 0.5, w * 0.65);
      vGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vGrad.addColorStop(0.75, 'rgba(18, 15, 12, 0.35)');
      vGrad.addColorStop(1, 'rgba(12, 10, 8, 0.92)');
      ctx.fillStyle = vGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  // ============================================================================
  // 4. DUNE: ARRAKIS CONSTRUCT (Twin Moons, Orbital Monolith, Sandworms & Spice)
  // ============================================================================
  _renderDuneArrakis(ctx, w, h, state, audio, isHighRes) {
    const t = this.time;
    const shift = state.visual.paletteShift || 0;
    const density = state.visual.density || 1.0;
    const { bass, mid, treble, beat } = audio;

    const ochreHue = (28 + shift) % 360;
    const spiceBlue = (195 + shift) % 360;

    // 1. Scorching Arrakis Amber & Sienna Atmosphere
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.65);
    skyGrad.addColorStop(0, `hsl(${(ochreHue - 12 + 360) % 360}, 72%, 8%)`);
    skyGrad.addColorStop(0.38, `hsl(${ochreHue}, 78%, 22%)`);
    skyGrad.addColorStop(0.75, `hsl(${(ochreHue + 8) % 360}, 88%, 44%)`);
    skyGrad.addColorStop(1, `hsl(${(ochreHue + 16) % 360}, 95%, 68%)`);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Twin Moons of Arrakis (Krelln & Arvon)
    const moon1X = w * 0.78;
    const moon1Y = h * 0.22;
    const moon1R = h * 0.075;

    const m1Grad = ctx.createRadialGradient(moon1X - moon1R * 0.3, moon1Y - moon1R * 0.3, moon1R * 0.1, moon1X, moon1Y, moon1R);
    m1Grad.addColorStop(0, `hsl(${(ochreHue + 18) % 360}, 90%, 84%)`);
    m1Grad.addColorStop(0.7, `hsl(${ochreHue}, 75%, 52%)`);
    m1Grad.addColorStop(1, `hsl(${ochreHue}, 70%, 24%)`);
    ctx.fillStyle = m1Grad;
    ctx.beginPath();
    ctx.arc(moon1X, moon1Y, moon1R, 0, Math.PI * 2);
    ctx.fill();

    // Second smaller moon (Arvon)
    const moon2X = w * 0.87;
    const moon2Y = h * 0.33;
    const moon2R = h * 0.035;
    ctx.fillStyle = `hsla(${(ochreHue + 12) % 360}, 80%, 72%, 0.85)`;
    ctx.beginPath();
    ctx.arc(moon2X, moon2Y, moon2R, 0, Math.PI * 2);
    ctx.fill();

    // 3. Colossal Brutalist Orbital Monolith / Heighliner Descending
    const monoX = w * 0.38;
    const monoY = h * 0.28 + Math.sin(t * 0.9) * (h * 0.015);
    const monoW = w * 0.11;
    const monoH = h * 0.28;

    ctx.save();
    // Atmospheric thruster dust & heat aura beneath monolith
    const auraGrad = ctx.createRadialGradient(monoX, monoY + monoH * 0.4, monoW * 0.2, monoX, monoY + monoH * 0.4, monoW * 1.8);
    auraGrad.addColorStop(0, `hsla(${(ochreHue + 15) % 360}, 100%, 75%, ${0.35 + bass * 0.35})`);
    auraGrad.addColorStop(1, `hsla(${ochreHue}, 90%, 50%, 0)`);
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(monoX, monoY + monoH * 0.4, monoW * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Monolith Hull (lit side & dark obsidian shadow side)
    ctx.fillStyle = `hsl(${ochreHue}, 35%, 10%)`;
    ctx.beginPath();
    ctx.moveTo(monoX - monoW * 0.42, monoY - monoH * 0.5);
    ctx.lineTo(monoX, monoY - monoH * 0.54);
    ctx.lineTo(monoX, monoY + monoH * 0.5);
    ctx.lineTo(monoX - monoW * 0.48, monoY + monoH * 0.45);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = `hsl(${ochreHue}, 45%, 20%)`;
    ctx.beginPath();
    ctx.moveTo(monoX, monoY - monoH * 0.54);
    ctx.lineTo(monoX + monoW * 0.42, monoY - monoH * 0.5);
    ctx.lineTo(monoX + monoW * 0.48, monoY + monoH * 0.45);
    ctx.lineTo(monoX, monoY + monoH * 0.5);
    ctx.closePath();
    ctx.fill();

    // Glowing Spice-Blue / Amber Axial Slit along the Monolith
    ctx.strokeStyle = `hsla(${spiceBlue}, 100%, 68%, ${0.55 + mid * 0.4})`;
    ctx.lineWidth = isHighRes ? 2.2 : 1.2;
    ctx.beginPath();
    ctx.moveTo(monoX, monoY - monoH * 0.46);
    ctx.lineTo(monoX, monoY + monoH * 0.42);
    ctx.stroke();
    ctx.restore();

    // 4. Endless Shifting Razor-Edged Sand Dunes (4 Layers)
    const duneLayers = [
      { yBase: 0.56, amp: 0.06, lumLit: 52, lumDark: 28, speed: 0.25 },
      { yBase: 0.65, amp: 0.075, lumLit: 46, lumDark: 22, speed: 0.45 },
      { yBase: 0.76, amp: 0.08, lumLit: 38, lumDark: 16, speed: 0.7 },
      { yBase: 0.87, amp: 0.07, lumLit: 30, lumDark: 11, speed: 1.0 }
    ];

    duneLayers.forEach((dl, idx) => {
      const baseY = h * dl.yBase;
      const dGrad = ctx.createLinearGradient(0, baseY - h * 0.09, 0, h);
      dGrad.addColorStop(0, `hsl(${(ochreHue + 6) % 360}, 82%, ${dl.lumLit + bass * 6}%)`);
      dGrad.addColorStop(1, `hsl(${ochreHue}, 78%, ${dl.lumDark}%)`);

      ctx.fillStyle = dGrad;
      ctx.beginPath();
      ctx.moveTo(0, h);
      const step = isHighRes ? 8 : 16;
      for (let x = 0; x <= w + step; x += step) {
        // Sharp abs-noise sand crest
        const raw = this.noise.noise2D(x * 0.0022 + idx * 7.5 + t * 0.08 * dl.speed, idx * 3.1);
        const crest = Math.pow(1.0 - Math.abs(raw), 1.6);
        const y = baseY - crest * h * dl.amp;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Razor-sharp sunlit sand ridge highlight
      ctx.strokeStyle = `hsla(${(ochreHue + 18) % 360}, 95%, 72%, ${0.45 + treble * 0.3})`;
      ctx.lineWidth = isHighRes ? 1.8 : 1.0;
      ctx.stroke();
    });

    // 5. Shai-Hulud (Sandworm) & Thumper Seismic Shockwaves
    const wormX = w * 0.52 + Math.sin(t * 1.2) * (w * 0.08);
    const wormY = h * 0.74;
    const wormR = h * (0.065 + bass * 0.045);

    // Concentric seismic sand-rings on bass hits
    for (const rip of this.seismicRipples) {
      const alpha = Math.max(0, 1 - rip.age / rip.maxAge);
      ctx.strokeStyle = `hsla(${(ochreHue + 16) % 360}, 95%, 70%, ${alpha * 0.65})`;
      ctx.lineWidth = isHighRes ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.ellipse(wormX, wormY + h * 0.03, rip.radius * w, rip.radius * h * 0.28, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Breaching Sandworm Crystalline Maw Silhouette when Bass/Drums are active
    if (bass > 0.15 || mid > 0.2) {
      ctx.save();
      ctx.translate(wormX, wormY);
      ctx.fillStyle = `hsl(${ochreHue}, 65%, 10%)`;
      ctx.strokeStyle = `hsl(${(ochreHue + 14) % 360}, 85%, 58%)`;
      ctx.lineWidth = isHighRes ? 2 : 1;

      ctx.beginPath();
      ctx.arc(0, 0, wormR, Math.PI * 1.05, Math.PI * 1.95);
      ctx.fill();
      ctx.stroke();

      // Radial crystalline baleen teeth inside the maw
      const teeth = isHighRes ? 14 : 7;
      ctx.strokeStyle = `hsla(${(ochreHue + 22) % 360}, 90%, 82%, ${0.5 + bass * 0.5})`;
      ctx.beginPath();
      for (let i = 0; i <= teeth; i++) {
        const ang = Math.PI * 1.1 + (i / teeth) * Math.PI * 0.8;
        ctx.moveTo(Math.cos(ang) * wormR * 0.95, Math.sin(ang) * wormR * 0.95);
        ctx.lineTo(Math.cos(ang) * wormR * 0.35, Math.sin(ang) * wormR * 0.35);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 6. Swirling Spice Melange Dust (Golden Amber + Fremen Ibad Blue)
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const pLimit = Math.min(this.spiceParticles.length, Math.floor((isHighRes ? 140 : 50) * density));
    for (let i = 0; i < pLimit; i++) {
      const sp = this.spiceParticles[i];
      const px = ((sp.x + t * sp.speed) % 1.0) * w;
      const py = (sp.y + Math.sin(t * 2.5 + sp.phase) * 0.03) * h;
      const shimmer = 0.4 + 0.6 * Math.sin(t * 6 + sp.phase) + treble * 0.5;
      const pHue = sp.isBlueSpice ? spiceBlue : (ochreHue + 18) % 360;

      ctx.fillStyle = `hsla(${pHue}, 100%, 70%, ${Math.min(1, shimmer * 0.75)})`;
      ctx.beginPath();
      ctx.arc(px, py, sp.size * (isHighRes ? 1.4 : 0.9), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ============================================================================
  // 5. COSMIC DEFAULT CONSTRUCT (Original Nebula, Segmented Pulsar & Peaks)
  // ============================================================================
  _renderCosmicDefault(ctx, w, h, state, audio, isHighRes) {
    const t = this.time;
    const chaos = state.visual.chaos || 1.0;
    const paletteShift = state.visual.paletteShift || 0;
    const { bass, mid, treble, beat } = audio;

    // 1. Deep space gradient
    const skyHue = (250 + paletteShift) % 360;
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, `hsl(${skyHue}, 75%, 4%)`);
    skyGrad.addColorStop(0.5, `hsl(${(skyHue + 40) % 360}, 65%, 9%)`);
    skyGrad.addColorStop(0.75, `hsl(${(skyHue + 80) % 360}, 75%, 16%)`);
    skyGrad.addColorStop(1, `hsl(${(skyHue + 120) % 360}, 85%, 22%)`);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Twinkling starfield
    for (const star of this.stars) {
      const alpha = 0.4 + 0.6 * Math.sin(t * star.twinkleSpeed + star.phase);
      const sx = star.x * w;
      const sy = star.y * h;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, alpha)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, star.size * (isHighRes ? 1.4 : 1.0) * (1 + treble * 0.8), 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Cosmic Pulsar / Glowing Sun
    const sunX = w * 0.5;
    const sunY = h * 0.46;
    const baseRadius = h * 0.22;
    const sunRadius = baseRadius * (1.0 + bass * 0.35 + (beat ? 0.08 : 0));

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

    const stripeCount = 14;
    for (let i = 0; i < stripeCount; i++) {
      const sy = sunY + (i / stripeCount) * sunRadius;
      const stripeHeight = Math.max(1.5, (i / stripeCount) * (isHighRes ? 8.0 : 5.0));
      ctx.fillStyle = `hsl(${skyHue}, 80%, 6%)`;
      ctx.fillRect(sunX - sunRadius, sy, sunRadius * 2, stripeHeight);
    }
    ctx.restore();

    // 4. Cosmic Energy Waves / Aurora ribbons
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let r = 0; r < 3; r++) {
      ctx.beginPath();
      const rHue = (sunHue + r * 60 + mid * 80) % 360;
      ctx.strokeStyle = `hsla(${rHue}, 90%, 65%, ${0.25 + mid * 0.3})`;
      ctx.lineWidth = (3 + r * 2) * (isHighRes ? 1.5 : 1);
      for (let x = 0; x <= w; x += 10) {
        const nx = (x / w) * 3.8 * chaos;
        const ny = t * 0.8 + r * 1.5;
        const wave = this.noise.noise2D(nx, ny) * (h * 0.09 + bass * h * 0.1);
        const y = h * 0.4 + wave + Math.sin((x / w) * 10 + t * 2 + r) * (h * 0.04);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();

    // 5. Layered 3D Mountains / Terrain Horizons
    const horizonY = h * 0.54;
    const layers = 3;
    for (let l = 0; l < layers; l++) {
      const layerDist = (l + 1) / layers;
      const layerHue = (220 + l * 45 + paletteShift) % 360;
      ctx.beginPath();
      ctx.moveTo(0, h);

      const step = isHighRes ? 8 : 6;
      for (let x = 0; x <= w + step; x += step) {
        const normX = (x / w - 0.5) * 480;
        const worldX = normX * (1.0 / layerDist);
        const worldY = (1.0 - layerDist) * 300;
        const elev = this.getElevation(worldX, worldY, t * (0.8 + l * 0.4), chaos, l === layers - 1 ? bass : 0, 'cosmic_default');
        const peakHeight = h * (0.18 + l * 0.12) * (1.0 + (l === 2 ? bass * 0.6 : mid * 0.3));
        const y = horizonY + (l * h * 0.1) - elev * peakHeight;
        ctx.lineTo(x, Math.max(horizonY - h * 0.3, y));
      }
      ctx.lineTo(w, h);
      ctx.closePath();

      const mGrad = ctx.createLinearGradient(0, horizonY - h * 0.15, 0, h);
      const lum = 14 + l * 8;
      mGrad.addColorStop(0, `hsl(${layerHue}, 75%, ${lum}%)`);
      mGrad.addColorStop(1, `hsl(${(layerHue + 30) % 360}, 85%, ${Math.max(4, lum - 8)}%)`);
      ctx.fillStyle = mGrad;
      ctx.fill();

      ctx.strokeStyle = `hsla(${(layerHue + 60) % 360}, 95%, 70%, ${0.5 + treble * 0.4})`;
      ctx.lineWidth = isHighRes ? 2.2 : 1.5;
      ctx.stroke();
    }
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
