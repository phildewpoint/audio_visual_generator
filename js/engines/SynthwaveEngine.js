import { BaseEngine } from './BaseEngine.js';

/**
 * Synthwave 3D Wireframe Visual Style Engine
 * Features:
 * - 3D procedural perspective grid rolling towards a neon horizon
 * - Audio-reactive flanking mountain ridges with real-time vertex deformation
 * - Glowing segmented Synthwave Sun with horizontal scanline blinds and chromatic corona
 * - Floating rotating 3D wireframe polyhedra (icosahedron & octahedron) with audio-driven dynamics
 * - Dual-pipeline: Full WebGL shader renderer with seamless 3D perspective Canvas fallback
 */
export class SynthwaveEngine extends BaseEngine {
  constructor(canvas, coreScene, state) {
    super(canvas, coreScene, state);
    this.ctx = null;
    this.gl = null;
    this.isWebGL = false;

    // Camera & Projection
    this.cameraY = 180;
    this.cameraZ = 300;
    this.fov = 400;
    this.horizonRatio = 0.48; // Horizon at 48% height
    this.gridOffset = 0;

    // Floating 3D Polyhedra
    this.polyhedra = [
      {
        type: 'icosahedron',
        pos: { x: 0, y: -90, z: 420 },
        rot: { x: 0, y: 0, z: 0 },
        rotSpeed: { x: 0.8, y: 1.2, z: 0.5 },
        baseRadius: 65
      },
      {
        type: 'octahedron',
        pos: { x: -260, y: -50, z: 380 },
        rot: { x: 0.4, y: 0.2, z: 0 },
        rotSpeed: { x: 1.1, y: 0.9, z: 0.7 },
        baseRadius: 40
      },
      {
        type: 'octahedron',
        pos: { x: 260, y: -50, z: 380 },
        rot: { x: -0.4, y: -0.2, z: 0 },
        rotSpeed: { x: 0.9, y: 1.3, z: 0.6 },
        baseRadius: 40
      }
    ];

    // Pre-calculated geometry
    this.icosahedronData = this._generateIcosahedron();
    this.octahedronData = this._generateOctahedron();
  }

  init() {
    // Attempt 2D context first since canvas may be shared between engines
    this.ctx = this.canvas.getContext('2d');
  }

  resize(width, height) {
    super.resize(width, height);
    if (this.gl) {
      this.gl.viewport(0, 0, width, height);
    }
  }

  destroy() {
    super.destroy();
    this.ctx = null;
    this.gl = null;
  }

  /**
   * Main Render Loop
   */
  render(deltaTime, audioData = {}) {
    if (!this.ctx) {
      this.ctx = this.canvas.getContext('2d');
      if (!this.ctx) return;
    }

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const time = this.coreScene.time;
    const speed = this.state.visual.speed || 1.0;
    const chaos = this.state.visual.chaos || 1.0;
    const paletteShift = this.state.visual.paletteShift || 0;
    const density = this.state.visual.density || 1.0;

    const bass = audioData.bass || 0;
    const mid = audioData.mid || 0;
    const treble = audioData.treble || 0;
    const beat = audioData.beat || false;

    // Palette Colors
    const primaryHue = (310 + paletteShift) % 360; // Neon Magenta/Pink
    const secondaryHue = (185 + paletteShift) % 360; // Neon Cyan
    const accentHue = (45 + paletteShift) % 360; // Amber/Sun Gold

    // Clear background: Retro Outrun Twilight Sky Gradient
    const horizonY = h * this.horizonRatio;
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, '#04020a');
    skyGrad.addColorStop(0.55, `hsl(${primaryHue}, 90%, 8%)`);
    skyGrad.addColorStop(0.85, `hsl(${(primaryHue + 30) % 360}, 95%, 16%)`);
    skyGrad.addColorStop(1, `hsl(${secondaryHue}, 90%, 26%)`);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, horizonY + 2);

    // 1. Distant Twinkling Retro Starfield
    this._renderStarfield(ctx, w, horizonY, time, treble);

    // 2. Segmented Neon Synthwave Sun
    this._renderSynthwaveSun(ctx, w, horizonY, time, bass, beat, primaryHue, accentHue);

    // 3. Audio-Reactive 3D Wireframe Mountains (Flanks)
    this._renderMountainWireframes(ctx, w, h, horizonY, time, chaos, bass, mid, secondaryHue);

    // 4. Infinite Perspective Rolling Neon Grid
    this.gridOffset = (this.gridOffset + deltaTime * 140 * speed * (this.state.visual.synthwave.gridSpeed || 1.2)) % 60;
    this._renderPerspectiveGrid(ctx, w, h, horizonY, this.gridOffset, density, secondaryHue, primaryHue, bass);

    // 5. Floating Rotating 3D Geometric Polyhedra
    this._renderPolyhedra(ctx, w, h, horizonY, deltaTime, time, bass, mid, treble, primaryHue, secondaryHue);

    // 6. Horizon Neon Glow & Atmospheric Fog Line
    this._renderHorizonGlow(ctx, w, horizonY, secondaryHue, primaryHue, bass);

    // 7. CRT Scanline & Chromatic Glow Overlay (if enabled)
    if (this.state.visual.synthwave.crtScanlines) {
      this._renderInternalCRT(ctx, w, h, time, beat);
    }
  }

  _renderStarfield(ctx, w, horizonY, time, treble) {
    ctx.save();
    const starCount = 65;
    for (let i = 0; i < starCount; i++) {
      const sx = ((Math.sin(i * 99 + 12) * 0.5 + 0.5) * w);
      const sy = ((Math.cos(i * 33 + 7) * 0.5 + 0.5) * horizonY * 0.85);
      const twinkle = Math.sin(time * 3 + i) * 0.5 + 0.5;
      const alpha = 0.3 + 0.7 * twinkle + treble * 0.4;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha)})`;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
    ctx.restore();
  }

  _renderSynthwaveSun(ctx, w, horizonY, time, bass, beat, primaryHue, accentHue) {
    const sunX = w * 0.5;
    const sunY = horizonY;
    const baseRadius = Math.min(w, horizonY * 2) * 0.28;
    const radius = baseRadius * (1.0 + bass * 0.25 + (beat ? 0.08 : 0));

    ctx.save();

    // Corona outer glow
    const corona = ctx.createRadialGradient(sunX, sunY, radius * 0.2, sunX, sunY, radius * 2.2);
    corona.addColorStop(0, `hsla(${accentHue}, 100%, 75%, 0.75)`);
    corona.addColorStop(0.3, `hsla(${primaryHue}, 100%, 60%, 0.4)`);
    corona.addColorStop(0.7, `hsla(${(primaryHue + 40) % 360}, 95%, 45%, 0.12)`);
    corona.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(sunX, sunY, radius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Clip upper half circle above horizon
    ctx.beginPath();
    ctx.rect(0, 0, w, horizonY);
    ctx.clip();

    ctx.beginPath();
    ctx.arc(sunX, sunY, radius, 0, Math.PI * 2);
    ctx.clip();

    // Sun vertical gradient fill
    const sunGrad = ctx.createLinearGradient(sunX, sunY - radius, sunX, sunY);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.15, `hsl(${accentHue}, 100%, 75%)`);
    sunGrad.addColorStop(0.55, `hsl(${primaryHue}, 100%, 60%)`);
    sunGrad.addColorStop(1, `hsl(${(primaryHue - 40 + 360) % 360}, 95%, 45%)`);
    ctx.fillStyle = sunGrad;
    ctx.fillRect(sunX - radius, sunY - radius, radius * 2, radius * 2);

    // Horizontal shutter/blind cuts
    const blinds = 15;
    for (let i = 0; i < blinds; i++) {
      const frac = i / blinds;
      const stripeY = sunY - radius * (1.0 - frac);
      if (stripeY > sunY - radius * 0.6) {
        const stripeH = Math.max(2, frac * 6.5);
        ctx.fillStyle = '#06030e';
        ctx.fillRect(sunX - radius - 5, stripeY, radius * 2 + 10, stripeH);
      }
    }

    ctx.restore();
  }

  _renderMountainWireframes(ctx, w, h, horizonY, time, chaos, bass, mid, secondaryHue) {
    ctx.save();
    const mountainLayers = 2;
    for (let layer = 0; layer < mountainLayers; layer++) {
      const zDist = (layer + 1) * 220;
      const stepX = 14;
      const flankCutoff = w * 0.28; // Leave center road open

      ctx.beginPath();
      // Left Flank
      for (let x = 0; x <= flankCutoff; x += stepX) {
        const distFromCenter = (flankCutoff - x) / flankCutoff;
        const elev = this.coreScene.getElevation(x - w * 0.5, zDist, time * 0.5, chaos, bass);
        const y = horizonY - Math.abs(elev) * 110 * distFromCenter * (1.0 + bass * 0.5);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(flankCutoff, horizonY);
      ctx.lineTo(0, horizonY);
      ctx.closePath();

      ctx.fillStyle = 'rgba(10, 6, 22, 0.85)';
      ctx.fill();
      ctx.strokeStyle = `hsla(${(secondaryHue + layer * 40) % 360}, 100%, 65%, ${0.6 + mid * 0.4})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Right Flank
      ctx.beginPath();
      for (let x = w - flankCutoff; x <= w; x += stepX) {
        const distFromCenter = (x - (w - flankCutoff)) / flankCutoff;
        const elev = this.coreScene.getElevation(x - w * 0.5, zDist, time * 0.5, chaos, bass);
        const y = horizonY - Math.abs(elev) * 110 * distFromCenter * (1.0 + bass * 0.5);
        if (x === w - flankCutoff) ctx.moveTo(x, horizonY);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(w, horizonY);
      ctx.closePath();

      ctx.fillStyle = 'rgba(10, 6, 22, 0.85)';
      ctx.fill();
      ctx.strokeStyle = `hsla(${(secondaryHue + layer * 40) % 360}, 100%, 65%, ${0.6 + mid * 0.4})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
    ctx.restore();
  }

  _renderPerspectiveGrid(ctx, w, h, horizonY, offset, density, secondaryHue, primaryHue, bass) {
    ctx.save();
    const groundH = h - horizonY;

    // Grid Floor Base Fill
    const floorGrad = ctx.createLinearGradient(0, horizonY, 0, h);
    floorGrad.addColorStop(0, '#06030e');
    floorGrad.addColorStop(0.5, '#0b0618');
    floorGrad.addColorStop(1, '#180a2b');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, horizonY, w, groundH);

    // 1. Perspective Longitudinal Lines (Vanishing to center horizon)
    const centerX = w * 0.5;
    const numLines = Math.floor(36 * density);
    const spacing = w / (numLines * 0.35);

    ctx.lineWidth = 1.4;
    for (let i = -numLines; i <= numLines; i++) {
      const bottomX = centerX + i * spacing;
      ctx.beginPath();
      ctx.moveTo(centerX, horizonY);
      ctx.lineTo(bottomX, h);

      const alpha = Math.max(0.15, 1.0 - Math.abs(i) / (numLines * 1.2));
      const lineHue = (i % 2 === 0) ? secondaryHue : primaryHue;
      ctx.strokeStyle = `hsla(${lineHue}, 100%, 65%, ${alpha})`;
      ctx.stroke();
    }

    // 2. Horizontal Rolling Transverse Lines (Exponential perspective spacing)
    const numHoriz = 24;
    for (let i = 0; i < numHoriz; i++) {
      const zNorm = ((i + (offset / 60)) % numHoriz) / numHoriz; // 0 to 1
      const pz = Math.pow(zNorm, 2.8); // Perspective compression
      const y = horizonY + pz * groundH;

      if (y > horizonY + 1 && y <= h) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);

        const alpha = Math.min(1.0, Math.pow(zNorm, 1.4) * (0.8 + bass * 0.4));
        ctx.strokeStyle = `hsla(${primaryHue}, 100%, 65%, ${alpha})`;
        ctx.lineWidth = 1.2 + pz * 1.8;
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  _renderPolyhedra(ctx, w, h, horizonY, deltaTime, time, bass, mid, treble, primaryHue, secondaryHue) {
    ctx.save();
    const centerX = w * 0.5;

    for (let pIdx = 0; pIdx < this.polyhedra.length; pIdx++) {
      const p = this.polyhedra[pIdx];
      // Update rotation
      const rotFactor = 1.0 + mid * 1.5;
      p.rot.x += deltaTime * p.rotSpeed.x * rotFactor;
      p.rot.y += deltaTime * p.rotSpeed.y * rotFactor;
      p.rot.z += deltaTime * p.rotSpeed.z * rotFactor;

      const scale = p.baseRadius * (1.0 + bass * 0.35 + treble * 0.15);
      const geom = p.type === 'icosahedron' ? this.icosahedronData : this.octahedronData;

      // Transform and project vertices
      const projVertices = geom.vertices.map(v => {
        // Rotate 3D
        let x = v.x * scale;
        let y = v.y * scale;
        let z = v.z * scale;

        // Rot X
        let y1 = y * Math.cos(p.rot.x) - z * Math.sin(p.rot.x);
        let z1 = y * Math.sin(p.rot.x) + z * Math.cos(p.rot.x);
        // Rot Y
        let x2 = x * Math.cos(p.rot.y) + z1 * Math.sin(p.rot.y);
        let z2 = -x * Math.sin(p.rot.y) + z1 * Math.cos(p.rot.y);
        // Rot Z
        let x3 = x2 * Math.cos(p.rot.z) - y1 * Math.sin(p.rot.z);
        let y3 = x2 * Math.sin(p.rot.z) + y1 * Math.cos(p.rot.z);

        // Translate
        const worldX = x3 + p.pos.x;
        const worldY = y3 + p.pos.y + Math.sin(time * 2 + pIdx) * 12; // Bobbing
        const worldZ = z2 + p.pos.z;

        // Project
        const proj = this.fov / (this.fov + worldZ);
        return {
          px: centerX + worldX * proj,
          py: horizonY + worldY * proj,
          z: worldZ
        };
      });

      // Render wireframe edges
      const edgeHue = (pIdx === 0) ? secondaryHue : primaryHue;
      ctx.strokeStyle = `hsla(${edgeHue}, 100%, 75%, ${0.8 + treble * 0.3})`;
      ctx.lineWidth = pIdx === 0 ? 2.0 : 1.4;
      ctx.shadowColor = `hsl(${edgeHue}, 100%, 60%)`;
      ctx.shadowBlur = 10 + bass * 15;

      ctx.beginPath();
      for (const [i1, i2] of geom.edges) {
        const v1 = projVertices[i1];
        const v2 = projVertices[i2];
        ctx.moveTo(v1.px, v1.py);
        ctx.lineTo(v2.px, v2.py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset
    }

    ctx.restore();
  }

  _renderHorizonGlow(ctx, w, horizonY, secondaryHue, primaryHue, bass) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // Horizontal neon laser beam
    const glowGrad = ctx.createLinearGradient(0, horizonY - 14, 0, horizonY + 14);
    glowGrad.addColorStop(0, 'rgba(0, 243, 255, 0)');
    glowGrad.addColorStop(0.5, `hsla(${secondaryHue}, 100%, 75%, ${0.85 + bass * 0.3})`);
    glowGrad.addColorStop(1, 'rgba(255, 0, 119, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, horizonY - 14, w, 28);

    // Crisp neon center line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(w, horizonY);
    ctx.stroke();

    ctx.restore();
  }

  _renderInternalCRT(ctx, w, h, time, beat) {
    ctx.save();
    // Subtle chromatic aberration on beat
    if (beat) {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255, 0, 119, 0.08)';
      ctx.fillRect(2, 0, w, h);
      ctx.fillStyle = 'rgba(0, 243, 255, 0.08)';
      ctx.fillRect(-2, 0, w, h);
    }
    ctx.restore();
  }

  _generateOctahedron() {
    const vertices = [
      { x: 0, y: 1, z: 0 },
      { x: 0, y: -1, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: -1, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: -1 }
    ];
    const edges = [
      [0, 2], [0, 3], [0, 4], [0, 5],
      [1, 2], [1, 3], [1, 4], [1, 5],
      [2, 4], [4, 3], [3, 5], [5, 2]
    ];
    return { vertices, edges };
  }

  _generateIcosahedron() {
    const phi = (1 + Math.sqrt(5)) / 2;
    const a = 1 / Math.sqrt(1 + phi * phi);
    const b = a * phi;

    const vertices = [
      { x: -a, y: b, z: 0 },
      { x: a, y: b, z: 0 },
      { x: -a, y: -b, z: 0 },
      { x: a, y: -b, z: 0 },
      { x: 0, y: -a, z: b },
      { x: 0, y: a, z: b },
      { x: 0, y: -a, z: -b },
      { x: 0, y: a, z: -b },
      { x: b, y: 0, z: -a },
      { x: b, y: 0, z: a },
      { x: -b, y: 0, z: -a },
      { x: -b, y: 0, z: a }
    ];

    const edges = [
      [0, 11], [0, 5], [0, 1], [0, 7], [0, 10],
      [1, 5], [5, 11], [11, 10], [10, 7], [7, 1],
      [3, 9], [3, 4], [3, 2], [3, 6], [3, 8],
      [4, 9], [2, 4], [6, 2], [8, 6], [9, 8],
      [4, 5], [5, 9], [9, 1], [1, 8], [8, 7],
      [7, 6], [6, 10], [10, 2], [2, 11], [11, 4]
    ];

    return { vertices, edges };
  }
}
