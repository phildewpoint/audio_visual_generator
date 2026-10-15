/**
 * BaseVisualEngine
 * Abstract interface and shared utilities for all visual rendering sub-engines.
 */
export class BaseEngine {
  /**
   * @param {HTMLCanvasElement} canvas - Target rendering canvas
   * @param {CoreScene} coreScene - Procedural scene generator
   * @param {State} state - Application state
   */
  constructor(canvas, coreScene, state) {
    if (new.target === BaseEngine) {
      throw new TypeError("Cannot construct BaseEngine instances directly");
    }
    this.canvas = canvas;
    this.coreScene = coreScene;
    this.state = state;
    this.width = canvas.width || window.innerWidth;
    this.height = canvas.height || window.innerHeight;
    this.active = true;
  }

  /**
   * Initialize resources, shaders, or offscreen buffers.
   */
  init() {}

  /**
   * Handle viewport resize.
   * @param {number} width 
   * @param {number} height 
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  /**
   * Render frame.
   * @param {number} deltaTime - Frame delta time in seconds
   * @param {Object} audioData - Realtime audio data: { bass, mid, treble, energy, beat, waveform, spectrum }
   */
  render(deltaTime, audioData) {
    throw new Error("Method 'render()' must be implemented by subclass.");
  }

  /**
   * Cleanup GPU/CPU resources on engine switch or destroy.
   */
  destroy() {
    this.active = false;
  }

  /**
   * Helper to convert HSL to RGB array [r, g, b] in [0, 255]
   */
  hslToRgb(h, s, l) {
    h = (h % 360 + 360) % 360;
    s = Math.max(0, Math.min(1, s));
    l = Math.max(0, Math.min(1, l));
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }

    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255)
    ];
  }

  /**
   * Helper to format RGB to css string 'rgb(r, g, b)'
   */
  rgbStr(r, g, b, a = 1.0) {
    return a < 1.0 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
  }
}
