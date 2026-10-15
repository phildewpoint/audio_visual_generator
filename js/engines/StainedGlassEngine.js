import { BaseEngine } from './BaseEngine.js';
import { SimplexNoise } from '../core/SimplexNoise.js';

/**
 * StainedGlassEngine
 * Produces an authentic, radiant Gothic cathedral stained glass visual style.
 * Features:
 * - Dynamic Voronoi cellular mosaic with central rose-window geometry and organic harmonic drift
 * - Bold, dark hand-leaded cames with 3D metallic bevel ridges and molten solder nodules
 * - Luminous jewel-toned glass panes sampled from CoreScene with antique striations and refraction shimmer
 * - Audio-reactive celestial backlight bloom triggered by bass transients
 * - Caustic edge glints with optical chromatic prism rainbow dispersion driven by treble frequencies
 */
export class StainedGlassEngine extends BaseEngine {
  /**
   * @param {HTMLCanvasElement} canvas - Target rendering canvas
   * @param {CoreScene} coreScene - Procedural scene generator
   * @param {State} state - Application state
   */
  constructor(canvas, coreScene, state) {
    super(canvas, coreScene, state);

    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.noise = new SimplexNoise(1337);
    this.time = 0;

    // Audio reactivity trackers
    this.smoothBass = 0;
    this.smoothMid = 0;
    this.smoothTreble = 0;
    this.celestialBloom = 0;
    this.prevBass = 0;

    // Voronoi seed points
    this.seeds = [];
    this.targetCellCount = 0;

    // Preallocated buffers for zero-allocation Voronoi clipping (up to 32 vertices per cell)
    this.polyX1 = new Float32Array(32);
    this.polyY1 = new Float32Array(32);
    this.polyX2 = new Float32Array(32);
    this.polyY2 = new Float32Array(32);

    // Precomputed micro-texture for antique glass refraction and grain
    this.textureCanvas = document.createElement('canvas');
    this.textureCanvas.width = 256;
    this.textureCanvas.height = 256;
    this.textureCtx = this.textureCanvas.getContext('2d');
    this.texturePattern = null;

    this.init();
  }

  /**
   * Initialize resources, seed distribution, and refraction micro-texture.
   */
  init() {
    this._generateMicroTexture();
    this._syncSeeds();
  }

  /**
   * Generates a seamless procedural micro-texture pattern for antique cathedral glass
   * simulating subtle air seeds, ripples, and hammered glass refraction.
   * @private
   */
  _generateMicroTexture() {
    const w = this.textureCanvas.width;
    const h = this.textureCanvas.height;
    const imgData = this.textureCtx.createImageData(w, h);
    const data = imgData.data;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        // Layered simplex noise for antique glass ripples
        const n1 = this.noise.noise2D(x * 0.04, y * 0.04);
        const n2 = this.noise.noise2D(x * 0.12, y * 0.12) * 0.5;
        const val = Math.floor(128 + (n1 + n2) * 45);
        const grain = Math.floor((Math.random() - 0.5) * 16);
        const finalVal = Math.max(0, Math.min(255, val + grain));

        data[idx] = finalVal;
        data[idx + 1] = finalVal;
        data[idx + 2] = finalVal;
        data[idx + 3] = 28; // Subtle translucent alpha
      }
    }

    this.textureCtx.putImageData(imgData, 0, 0);
    this.texturePattern = this.ctx.createPattern(this.textureCanvas, 'repeat');
  }

  /**
   * Synchronize seed points based on state density and cellCount settings.
   * Employs a cathedral rose-window layout in the center surrounded by a harmonic mosaic field.
   * @private
   */
  _syncSeeds() {
    const baseCount = this.state.visual?.stainedGlass?.cellCount || 160;
    const density = this.state.visual?.density || 1.0;
    const targetCount = Math.round(Math.max(60, Math.min(320, baseCount * density)));

    if (this.seeds.length === targetCount) return;

    this.targetCellCount = targetCount;
    this.seeds = [];

    // Central sun / celestial rose-window origin (normalized coordinates matching CoreScene pulsar)
    const sunU = 0.5;
    const sunV = 0.46;
    const aspect = this.width > 0 && this.height > 0 ? this.height / this.width : 9 / 16;

    // 1. Central Cathedral Rose-Window concentric geometric rings
    const rosetteRings = [
      { r: 0.038, count: 6 },
      { r: 0.078, count: 10 },
      { r: 0.132, count: 16 },
      { r: 0.205, count: 22 }
    ];

    let rosetteTotal = 0;
    for (const ring of rosetteRings) {
      rosetteTotal += ring.count;
    }

    // Scale rosette proportion according to target count
    const rosetteScale = Math.min(1.0, targetCount / 160);
    for (const ring of rosetteRings) {
      const ringCount = Math.max(4, Math.round(ring.count * rosetteScale));
      const ringRadius = ring.r * (0.85 + 0.25 * rosetteScale);
      for (let i = 0; i < ringCount; i++) {
        const angle = (i / ringCount) * Math.PI * 2 + ring.r * 8.0;
        this.seeds.push({
          baseU: sunU + Math.cos(angle) * ringRadius * aspect,
          baseV: sunV + Math.sin(angle) * ringRadius,
          u: 0,
          v: 0,
          x: 0,
          y: 0,
          driftSpeed: 0.4 + Math.random() * 0.6,
          driftRadius: 0.008 + Math.random() * 0.012,
          driftAngle: Math.random() * Math.PI * 2,
          phase: Math.random() * Math.PI * 2,
          hueOffset: (Math.random() - 0.5) * 14,
          satOffset: 0.95 + Math.random() * 0.2,
          lumOffset: (Math.random() - 0.5) * 0.08,
          glassTextureSeed: Math.random() * 100,
          isRosette: true
        });
      }
    }

    // 2. Harmonic Gothic field mosaic filling the sky, horizon, and terrain
    const remainingCount = targetCount - this.seeds.length;
    const cols = Math.ceil(Math.sqrt(remainingCount * (16 / 9)));
    const rows = Math.ceil(remainingCount / cols);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (this.seeds.length >= targetCount) break;

        const jitterU = (Math.random() - 0.5) * 0.65;
        const jitterV = (Math.random() - 0.5) * 0.65;
        const u = Math.max(0.02, Math.min(0.98, (c + 0.5 + jitterU) / cols));
        const v = Math.max(0.02, Math.min(0.98, (r + 0.5 + jitterV) / rows));

        // Skip seeds that fall deep inside the rosette core to preserve clean petal geometry
        const du = (u - sunU) / aspect;
        const dv = v - sunV;
        const distFromSun = Math.sqrt(du * du + dv * dv);
        if (distFromSun < 0.18 * rosetteScale) continue;

        this.seeds.push({
          baseU: u,
          baseV: v,
          u: 0,
          v: 0,
          x: 0,
          y: 0,
          driftSpeed: 0.5 + Math.random() * 0.7,
          driftRadius: 0.015 + Math.random() * 0.02,
          driftAngle: Math.random() * Math.PI * 2,
          phase: Math.random() * Math.PI * 2,
          hueOffset: (Math.random() - 0.5) * 16,
          satOffset: 0.9 + Math.random() * 0.25,
          lumOffset: (Math.random() - 0.5) * 0.1,
          glassTextureSeed: Math.random() * 100,
          isRosette: false
        });
      }
    }

    // Fill any remainder to strictly hit targetCount
    while (this.seeds.length < targetCount) {
      this.seeds.push({
        baseU: 0.05 + Math.random() * 0.9,
        baseV: 0.05 + Math.random() * 0.9,
        u: 0,
        v: 0,
        x: 0,
        y: 0,
        driftSpeed: 0.6,
        driftRadius: 0.015,
        driftAngle: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2,
        hueOffset: (Math.random() - 0.5) * 12,
        satOffset: 1.0,
        lumOffset: 0,
        glassTextureSeed: Math.random() * 100,
        isRosette: false
      });
    }
  }

  /**
   * Handle viewport resize.
   * @param {number} width 
   * @param {number} height 
   */
  resize(width, height) {
    super.resize(width, height);
    this._syncSeeds();
  }

  /**
   * Clips a convex polygon against the perpendicular bisector half-plane of (pi, pj).
   * Fast zero-allocation in-place buffer ping-ponging.
   * @private
   */
  _clipPolygon(inX, inY, inLen, outX, outY, pix, piy, pjx, pjy) {
    const ax = 2 * (pjx - pix);
    const ay = 2 * (pjy - piy);
    const c = (pix * pix + piy * piy) - (pjx * pjx + pjy * pjy);

    let outLen = 0;
    if (inLen === 0) return 0;

    for (let i = 0; i < inLen; i++) {
      const nextIdx = (i + 1) % inLen;
      const curX = inX[i];
      const curY = inY[i];
      const nextX = inX[nextIdx];
      const nextY = inY[nextIdx];

      const dCur = ax * curX + ay * curY + c;
      const dNext = ax * nextX + ay * nextY + c;

      if (dCur <= 0) {
        if (outLen < 31) {
          outX[outLen] = curX;
          outY[outLen] = curY;
          outLen++;
        }
        if (dNext > 0) {
          const t = dCur / (dCur - dNext);
          if (outLen < 31) {
            outX[outLen] = curX + t * (nextX - curX);
            outY[outLen] = curY + t * (nextY - curY);
            outLen++;
          }
        }
      } else if (dNext <= 0) {
        const t = dCur / (dCur - dNext);
        if (outLen < 31) {
          outX[outLen] = curX + t * (nextX - curX);
          outY[outLen] = curY + t * (nextY - curY);
          outLen++;
        }
      }
    }
    return outLen;
  }

  /**
   * Computes Voronoi cells and extracts unique lead junctions.
   * @private
   */
  _computeVoronoiCells(W, H) {
    const N = this.seeds.length;
    const cells = [];
    const junctionMap = new Map();

    // Reusable distance array for neighbor sorting
    const neighborList = [];

    for (let i = 0; i < N; i++) {
      const pi = this.seeds[i];
      const pix = pi.x;
      const piy = pi.y;

      // Initialize polygon with canvas viewport bounds
      this.polyX1[0] = 0; this.polyY1[0] = 0;
      this.polyX1[1] = W; this.polyY1[1] = 0;
      this.polyX1[2] = W; this.polyY1[2] = H;
      this.polyX1[3] = 0; this.polyY1[3] = H;

      let curX = this.polyX1;
      let curY = this.polyY1;
      let nextX = this.polyX2;
      let nextY = this.polyY2;
      let polyLen = 4;

      // Find and sort candidate neighbors by distance
      neighborList.length = 0;
      for (let j = 0; j < N; j++) {
        if (i === j) continue;
        const dx = this.seeds[j].x - pix;
        const dy = this.seeds[j].y - piy;
        neighborList.push({ idx: j, distSq: dx * dx + dy * dy });
      }
      neighborList.sort((a, b) => a.distSq - b.distSq);

      // Distance-pruned half-plane clipping
      for (let k = 0; k < neighborList.length; k++) {
        const j = neighborList[k].idx;
        const pj = this.seeds[j];

        // Compute maximum distance from seed to current polygon vertices
        let maxDistSq = 0;
        for (let v = 0; v < polyLen; v++) {
          const vx = curX[v] - pix;
          const vy = curY[v] - piy;
          const d2 = vx * vx + vy * vy;
          if (d2 > maxDistSq) maxDistSq = d2;
        }

        // Exact geometric cutoff: if distance to pj is >= 2 * Rmax, no further neighbor can clip
        if (neighborList[k].distSq >= 4.0 * maxDistSq) {
          break;
        }

        const nextLen = this._clipPolygon(curX, curY, polyLen, nextX, nextY, pix, piy, pj.x, pj.y);
        const tmpX = curX; curX = nextX; nextX = tmpX;
        const tmpY = curY; curY = nextY; nextY = tmpY;
        polyLen = nextLen;
        if (polyLen < 3) break;
      }

      if (polyLen < 3) continue;

      // Compute cell polygon, centroid, and bounding radius
      const polygon = [];
      let area = 0;
      let cx = 0;
      let cy = 0;

      for (let v = 0; v < polyLen; v++) {
        const vx = curX[v];
        const vy = curY[v];
        polygon.push({ x: vx, y: vy });

        const nextV = (v + 1) % polyLen;
        const cross = vx * curY[nextV] - curX[nextV] * vy;
        area += cross;
        cx += (vx + curX[nextV]) * cross;
        cy += (vy + curY[nextV]) * cross;

        // Register junction point for solder nodes and treble sparkles
        // Quantize coordinates to 1 decimal place to weld shared vertices
        const qx = Math.round(vx * 2) * 0.5;
        const qy = Math.round(vy * 2) * 0.5;
        const key = `${qx},${qy}`;
        if (!junctionMap.has(key)) {
          junctionMap.set(key, { x: qx, y: qy, valence: 1 });
        } else {
          junctionMap.get(key).valence++;
        }
      }

      area *= 0.5;
      if (Math.abs(area) > 1e-4) {
        cx /= (6.0 * area);
        cy /= (6.0 * area);
      } else {
        cx = 0; cy = 0;
        for (let v = 0; v < polyLen; v++) { cx += polygon[v].x; cy += polygon[v].y; }
        cx /= polyLen; cy /= polyLen;
      }

      let rMax = 0;
      for (let v = 0; v < polyLen; v++) {
        const d = Math.hypot(polygon[v].x - cx, polygon[v].y - cy);
        if (d > rMax) rMax = d;
      }

      cells.push({
        seed: pi,
        polygon,
        centroid: { x: cx, y: cy },
        radius: rMax,
        area: Math.abs(area)
      });
    }

    return { cells, junctions: Array.from(junctionMap.values()) };
  }

  /**
   * Main render loop for Stained Glass visual engine.
   * @param {number} deltaTime - Frame delta time in seconds
   * @param {Object} audioData - Realtime audio data: { bass, mid, treble, energy, beat, waveform, spectrum }
   */
  render(deltaTime, audioData = {}) {
    if (!this.active) return;

    const ctx = this.ctx;
    const W = this.width;
    const H = this.height;

    // 1. Ensure procedural CoreScene offscreen buffer is updated and ready for raster sampling
    if (!this.coreScene.offscreenData && this.coreScene.renderOffscreen) {
      this.coreScene.renderOffscreen(this.state, audioData);
    }

    // 2. Read configuration parameters from State
    const speed = this.state.visual?.speed || 1.0;
    const chaos = this.state.visual?.chaos || 1.0;
    const paletteShift = this.state.visual?.paletteShift || 0;
    const sgConfig = this.state.visual?.stainedGlass || {};
    const leadWidth = Math.max(1.8, Math.min(8.0, sgConfig.leadWidth ?? 3.8));
    const shimmer = sgConfig.shimmer !== false;
    const edgeGlow = sgConfig.edgeGlow ?? 0.85;

    // Check if cell count or density changed
    this._syncSeeds();

    // 3. Audio tracking & transient dynamics
    const rawBass = audioData.bass || 0;
    const rawMid = audioData.mid || 0;
    const rawTreble = audioData.treble || 0;
    const isBeat = audioData.beat || false;

    this.smoothBass += (rawBass - this.smoothBass) * Math.min(1.0, deltaTime * 12.0);
    this.smoothMid += (rawMid - this.smoothMid) * Math.min(1.0, deltaTime * 8.0);
    this.smoothTreble += (rawTreble - this.smoothTreble) * Math.min(1.0, deltaTime * 14.0);

    // Celestial backlight bloom transient detection
    const bassTransient = rawBass - this.prevBass;
    this.prevBass = rawBass;
    if (isBeat || (bassTransient > 0.18 && rawBass > 0.45)) {
      this.celestialBloom = Math.min(1.6, this.celestialBloom + 0.5 + rawBass * 0.4);
    }
    this.celestialBloom *= Math.exp(-deltaTime * 3.8);

    // Advance continuous procedural time
    this.time += deltaTime * speed;
    const t = this.time;

    // Harmonic breathing envelope: panes subtly breathe with bass and beat
    const breathScale = 1.0 + (this.smoothBass * 0.045 + (isBeat ? 0.025 : 0)) * Math.sin(t * 3.0);

    // 4. Update seed positions with organic drift and harmonic breathing
    const sunScreenX = W * 0.5;
    const sunScreenY = H * 0.46;

    for (let i = 0; i < this.seeds.length; i++) {
      const s = this.seeds[i];
      // Multi-frequency organic drift via Simplex noise
      const driftX = Math.cos(s.driftAngle + t * 0.4 * s.driftSpeed) * s.driftRadius +
        this.noise.noise2D(s.baseU * 3.5, t * 0.25 * s.driftSpeed) * s.driftRadius * chaos;
      const driftY = Math.sin(s.driftAngle + t * 0.4 * s.driftSpeed) * s.driftRadius +
        this.noise.noise2D(s.baseV * 3.5 + 40.0, t * 0.25 * s.driftSpeed) * s.driftRadius * chaos;

      s.u = s.baseU + driftX;
      s.v = s.baseV + driftY;

      // Apply harmonic breathing radiating from celestial sun
      const rawX = s.u * W;
      const rawY = s.v * H;
      s.x = sunScreenX + (rawX - sunScreenX) * breathScale;
      s.y = sunScreenY + (rawY - sunScreenY) * breathScale;

      // Soft clamp seeds inside viewport boundary padding
      s.x = Math.max(6, Math.min(W - 6, s.x));
      s.y = Math.max(6, Math.min(H - 6, s.y));
    }

    // 5. Compute Voronoi cells and lead junctions
    const { cells, junctions } = this._computeVoronoiCells(W, H);

    // 6. PASS 1: Render Luminous Cathedral Glass Fills
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const poly = cell.polygon;
      const cx = cell.centroid.x;
      const cy = cell.centroid.y;
      const normU = Math.max(0, Math.min(1, cx / W));
      const normV = Math.max(0, Math.min(1, cy / H));

      // Sample CoreScene semantic buffer at cell centroid
      const sampled = this.coreScene.sampleBuffer(normU, normV);

      // Convert sampled RGB to HSL for jewel-toned stained glass color grade
      const hsl = this._rgbToHsl(sampled.r, sampled.g, sampled.b);

      // Apply crucible tint offset, palette shift, and saturation boost for rich antique pot glass
      let h = (hsl.h * 360 + paletteShift + cell.seed.hueOffset + 360) % 360;
      let s = Math.min(1.0, hsl.s * 1.35 * cell.seed.satOffset + 0.12);
      let l = Math.max(0.12, Math.min(0.85, hsl.l + cell.seed.lumOffset));

      // Audio-reactive celestial backlight flare
      const distFromSun = Math.hypot(cx - sunScreenX, cy - sunScreenY) / Math.max(W, H);
      const sunProximity = Math.max(0, 1.0 - distFromSun * 2.2);
      const flareBoost = (this.celestialBloom * 0.65 + this.smoothBass * 0.45) * (0.4 + 0.6 * sunProximity);
      l = Math.min(0.96, l + flareBoost);

      // Micro-texture refraction shimmer
      let shimmerOffset = 0;
      if (shimmer) {
        const shimWave = Math.sin(t * 2.2 + cx * 0.012 + cy * 0.012 + cell.seed.glassTextureSeed);
        shimmerOffset = shimWave * (0.05 + this.smoothTreble * 0.08);
      }

      // Build directional radial gradient simulating light penetrating cathedral glass
      // Offset gradient center towards the celestial sun
      const dirX = (sunScreenX - cx) * 0.14;
      const dirY = (sunScreenY - cy) * 0.14;
      const gradCenterX = cx + dirX;
      const gradCenterY = cy + dirY;
      const gradRadius = Math.max(12, cell.radius * 1.2);

      const grad = ctx.createRadialGradient(
        gradCenterX, gradCenterY, 2,
        cx, cy, gradRadius
      );

      // Stop 0: Brilliant luminous glass highlight (back-lit core)
      const lCore = Math.min(0.98, l * 1.28 + shimmerOffset);
      const sCore = Math.max(0.2, s * 0.9);
      grad.addColorStop(0, `hsla(${h}, ${Math.round(sCore * 100)}%, ${Math.round(lCore * 100)}%, 0.98)`);

      // Stop 0.65: Saturated jewel-toned antique glass body
      const lMid = Math.max(0.18, Math.min(0.88, l + shimmerOffset * 0.5));
      const sMid = Math.min(1.0, s * 1.2);
      grad.addColorStop(0.65, `hsla(${h}, ${Math.round(sMid * 100)}%, ${Math.round(lMid * 100)}%, 0.95)`);

      // Stop 1.0: Darker optical edge shadow where glass meets thick lead came
      const lEdge = Math.max(0.06, l * 0.42);
      grad.addColorStop(1, `hsla(${h}, ${Math.round(s * 100)}%, ${Math.round(lEdge * 100)}%, 0.98)`);

      // Draw cell polygon path
      ctx.beginPath();
      ctx.moveTo(poly[0].x, poly[0].y);
      for (let v = 1; v < poly.length; v++) {
        ctx.lineTo(poly[v].x, poly[v].y);
      }
      ctx.closePath();

      // Fill glass pane
      ctx.fillStyle = grad;
      ctx.fill();

      // Subtle antique glass striation / ripple overlay
      ctx.save();
      ctx.clip();

      if (this.texturePattern) {
        ctx.globalAlpha = 0.12 + this.smoothTreble * 0.1;
        ctx.fillStyle = this.texturePattern;
        ctx.fill();
      }

      // Hand-blown glass striation lines across pane
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = flareBoost > 0.3 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.35)';
      ctx.lineWidth = 1.2;
      const angle = cell.seed.glassTextureSeed;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const span = cell.radius;
      ctx.beginPath();
      ctx.moveTo(cx - span * cosA + 4 * sinA, cy - span * sinA - 4 * cosA);
      ctx.lineTo(cx + span * cosA + 4 * sinA, cy + span * sinA - 4 * cosA);
      ctx.moveTo(cx - span * cosA - 4 * sinA, cy - span * sinA + 4 * cosA);
      ctx.lineTo(cx + span * cosA - 4 * sinA, cy + span * sinA + 4 * cosA);
      ctx.stroke();

      ctx.restore();
    }

    // 7. PASS 2: Bold Dark Hand-Leaded Cames (#181418 Charcoal / Bronze)
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = leadWidth;
    ctx.strokeStyle = '#181418';

    ctx.beginPath();
    for (let i = 0; i < cells.length; i++) {
      const poly = cells[i].polygon;
      ctx.moveTo(poly[0].x, poly[0].y);
      for (let v = 1; v < poly.length; v++) {
        ctx.lineTo(poly[v].x, poly[v].y);
      }
      ctx.closePath();
    }
    ctx.stroke();

    // 8. PASS 3: 3D Metallic Bevel Ridge on Lead Cames
    // Extruded came midline specular reflection
    const bevelWidth = Math.max(1.0, leadWidth * 0.32);
    ctx.lineWidth = bevelWidth;
    ctx.strokeStyle = 'rgba(168, 158, 178, 0.36)';
    ctx.stroke();
    ctx.restore();

    // 9. PASS 4: Molten Solder Nodules at Lead Junctions
    // Where 3 or more cames meet, artisans melt round solder nodes
    ctx.save();
    const solderRadius = leadWidth * 0.62;
    for (let j = 0; j < junctions.length; j++) {
      const junc = junctions[j];
      // Skip outer edge boundary vertices
      if (junc.x <= 2 || junc.x >= W - 2 || junc.y <= 2 || junc.y >= H - 2) continue;

      // Dark solder came joint
      ctx.beginPath();
      ctx.arc(junc.x, junc.y, solderRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#1c1820';
      ctx.fill();

      // Pewter specular glint on solder cap
      ctx.beginPath();
      ctx.arc(junc.x - 0.4, junc.y - 0.4, solderRadius * 0.38, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(215, 205, 230, 0.55)';
      ctx.fill();
    }
    ctx.restore();

    // 10. PASS 5: Celestial Backlight Bloom (Bass Transients)
    // Panes flare with divine back-lit cathedral brilliance
    if (this.celestialBloom > 0.05 || this.smoothBass > 0.3) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const bloomIntensity = (this.celestialBloom * 0.55 + this.smoothBass * 0.35) * (this.state.visual?.bloom ?? 0.6);
      const sunHue = (320 + paletteShift) % 360;

      // Radial god-ray / backlight bloom centered on the pulsar
      const bloomGrad = ctx.createRadialGradient(
        sunScreenX, sunScreenY, 8,
        sunScreenX, sunScreenY, Math.max(W, H) * 0.82
      );
      bloomGrad.addColorStop(0, `hsla(${sunHue}, 100%, 92%, ${Math.min(0.85, bloomIntensity * 0.95)})`);
      bloomGrad.addColorStop(0.3, `hsla(${(sunHue + 40) % 360}, 95%, 75%, ${Math.min(0.55, bloomIntensity * 0.6)})`);
      bloomGrad.addColorStop(0.65, `hsla(${(sunHue + 80) % 360}, 90%, 50%, ${Math.min(0.28, bloomIntensity * 0.25)})`);
      bloomGrad.addColorStop(1, `hsla(${(sunHue + 120) % 360}, 80%, 30%, 0)`);

      ctx.fillStyle = bloomGrad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // 11. PASS 6: Caustic Edge Glints & Prism Rainbow Dispersion (Treble Transients)
    if (this.smoothTreble > 0.18) {
      this._renderCausticGlints(ctx, junctions, W, H, edgeGlow, t);
    }

    // 12. PASS 7: Gothic Lancet Arch & Outer Stone Traceried Window Frame
    this._renderCathedralWindowFrame(ctx, W, H, leadWidth);
  }

  /**
   * Renders sparkling caustic diamond glints with optical chromatic prism rainbow dispersion
   * at lead junctions activated by treble transients.
   * @private
   */
  _renderCausticGlints(ctx, junctions, W, H, edgeGlow, t) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const trebleFactor = Math.min(1.0, (this.smoothTreble - 0.18) / 0.7);
    const activeCount = Math.floor(junctions.length * (0.15 + trebleFactor * 0.35));

    for (let i = 0; i < junctions.length; i++) {
      const junc = junctions[i];
      if (junc.x <= 8 || junc.x >= W - 8 || junc.y <= 8 || junc.y >= H - 8) continue;

      // Stroboscopic / musical sparkling selection based on vertex index and time
      const sparkPhase = Math.sin(t * 14.0 + i * 53.7);
      if (sparkPhase < 0.65) continue;

      const sparkIntensity = ((sparkPhase - 0.65) / 0.35) * trebleFactor * edgeGlow;
      if (sparkIntensity <= 0.05) continue;

      const glintSize = (6 + trebleFactor * 22) * sparkIntensity;
      const angle = (t * 2.0 + i * 1.57) % Math.PI;

      // A. Optical Prism Rainbow Dispersion Fringes (Chromatic Aberration)
      // Cut jewel facets disperse light into red-cyan spectral flares
      const dispersionDist = glintSize * 0.45;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Red/Magenta spectral edge
      ctx.fillStyle = `hsla(340, 100%, 75%, ${0.55 * sparkIntensity})`;
      ctx.beginPath();
      ctx.arc(junc.x - dispersionDist * cosA, junc.y - dispersionDist * sinA, glintSize * 0.22, 0, Math.PI * 2);
      ctx.fill();

      // Cyan/Blue spectral edge
      ctx.fillStyle = `hsla(190, 100%, 75%, ${0.55 * sparkIntensity})`;
      ctx.beginPath();
      ctx.arc(junc.x + dispersionDist * cosA, junc.y + dispersionDist * sinA, glintSize * 0.22, 0, Math.PI * 2);
      ctx.fill();

      // B. 4-Pointed Razor Diamond Caustic Star
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 * sparkIntensity})`;
      ctx.lineWidth = 1.2;

      ctx.beginPath();
      // Primary horizontal/vertical rays
      ctx.moveTo(junc.x - glintSize, junc.y);
      ctx.lineTo(junc.x + glintSize, junc.y);
      ctx.moveTo(junc.x, junc.y - glintSize);
      ctx.lineTo(junc.x, junc.y + glintSize);

      // Secondary diagonal rays
      const diagSize = glintSize * 0.55;
      ctx.moveTo(junc.x - diagSize * 0.707, junc.y - diagSize * 0.707);
      ctx.lineTo(junc.x + diagSize * 0.707, junc.y + diagSize * 0.707);
      ctx.moveTo(junc.x - diagSize * 0.707, junc.y + diagSize * 0.707);
      ctx.lineTo(junc.x + diagSize * 0.707, junc.y - diagSize * 0.707);
      ctx.stroke();

      // C. Brilliant Diamond Core
      ctx.fillStyle = `rgba(255, 255, 255, ${sparkIntensity})`;
      ctx.beginPath();
      ctx.arc(junc.x, junc.y, Math.max(1.5, glintSize * 0.18), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Outer stone window frame and lancet arch framing for monumental cathedral presence.
   * @private
   */
  _renderCathedralWindowFrame(ctx, W, H, leadWidth) {
    ctx.save();
    const frameBorder = Math.max(6, leadWidth * 1.6);

    // Thick outer stone / lead perimeter came
    ctx.lineWidth = frameBorder;
    ctx.strokeStyle = '#120e14';
    ctx.strokeRect(frameBorder * 0.5, frameBorder * 0.5, W - frameBorder, H - frameBorder);

    // Subtle beveled stone highlight
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(180, 170, 190, 0.25)';
    ctx.strokeRect(frameBorder, frameBorder, W - frameBorder * 2, H - frameBorder * 2);

    // Vignette shadow around outer window borders
    const vigGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.42, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(1, 'rgba(6, 4, 8, 0.45)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.restore();
  }

  /**
   * Helper to convert RGB in [0, 255] to HSL in [0, 1]
   * @private
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
      h /= 6;
    }
    return { h, s, l };
  }

  /**
   * Cleanup GPU/CPU resources on engine switch or destroy.
   */
  destroy() {
    super.destroy();
    this.seeds = [];
    this.texturePattern = null;
    if (this.textureCanvas) {
      this.textureCanvas.width = 1;
      this.textureCanvas.height = 1;
    }
  }
}
