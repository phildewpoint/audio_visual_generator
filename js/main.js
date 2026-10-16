import { State } from './core/State.js';
import { CoreScene } from './core/CoreScene.js';
import { AudioEngine } from './audio/AudioEngine.js';
import { GUI } from './gui/GUI.js';

import { ConstructEngine } from './engines/ConstructEngine.js';
import { AsciiEngine } from './engines/AsciiEngine.js';
import { ImpressionistEngine } from './engines/ImpressionistEngine.js';
import { StainedGlassEngine } from './engines/StainedGlassEngine.js';
import { SynthwaveEngine } from './engines/SynthwaveEngine.js';

/**
 * Main Application Orchestrator
 */
class Application {
  constructor() {
    this.canvas = document.getElementById('viewport-canvas');
    this.state = new State();
    this.coreScene = new CoreScene();
    this.audio = new AudioEngine(this.state);
    this.gui = new GUI(this.state, this.audio);

    this.engineClasses = {
      construct: ConstructEngine,
      ascii: AsciiEngine,
      impressionist: ImpressionistEngine,
      stained_glass: StainedGlassEngine,
      synthwave: SynthwaveEngine
    };

    this.currentEngine = null;
    this.lastTime = performance.now();
    this.animationFrameId = null;

    this._initCanvas();
    this._initModal();
    this._bindState();
    this._switchEngine(this.state.visual.engine);
    this._startLoop();
  }

  _initCanvas() {
    this._handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.canvas.width = Math.floor(w * dpr);
      this.canvas.height = Math.floor(h * dpr);
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;

      if (this.currentEngine) {
        this.currentEngine.resize(this.canvas.width, this.canvas.height);
      }
    };

    window.addEventListener('resize', this._handleResize);
    this._handleResize();
  }

  _initModal() {
    const modal = document.getElementById('audio-prompt-modal');
    const startBtn = document.getElementById('btn-start-modal');

    const startApp = async () => {
      try {
        await this.audio.start();
      } catch (e) {
        console.warn('Audio auto-start blocked or interrupted:', e);
      }
      modal?.classList.add('dismissed');
      this.gui.showToast('Procedural Audio Activated!');
    };

    startBtn?.addEventListener('click', startApp);

    // Fallback: click canvas to unpause audio if needed
    this.canvas.addEventListener('click', () => {
      if (!this.state.audio.isPlaying && !modal?.classList.contains('dismissed')) {
        startApp();
      }
    }, { once: true });
  }

  _bindState() {
    this.state.on('change:engine', (engineName) => {
      this._switchEngine(engineName);
    });
  }

  _switchEngine(engineName) {
    if (this.currentEngine) {
      this.currentEngine.destroy();
      this.currentEngine = null;
    }

    const EngineClass = this.engineClasses[engineName] || this.engineClasses.construct;
    this.currentEngine = new EngineClass(this.canvas, this.coreScene, this.state);
    this.currentEngine.init();
    this.currentEngine.resize(this.canvas.width, this.canvas.height);
    this.gui.showToast(`Switched Engine: ${engineName.toUpperCase()}`);
  }

  _startLoop() {
    const loop = (now) => {
      const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;

      // 1. Update master procedural universe time
      this.coreScene.update(deltaTime, this.state.visual.speed);

      // 2. Fetch real-time FFT audio spectrum & beat transients
      const audioData = this.audio.getAudioData();

      // 3. Render core offscreen semantic buffer for raster sampling
      this.coreScene.renderOffscreen(this.state, audioData);

      // 4. Render active visual engine
      if (this.currentEngine) {
        this.currentEngine.render(deltaTime, audioData);
      }

      // 5. Update GUI oscilloscope & FPS counter
      this.gui.renderAudioScope(audioData);
      this.gui.updateFPS();

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }
}

// Boot application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.__APP__ = new Application();
});
