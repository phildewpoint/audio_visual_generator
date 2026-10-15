/**
 * DrumVoice
 * Procedural ambient & cinematic percussion synthesizer.
 * Outputs solely to the assigned channel strip input for strict pre-send mute/solo control.
 */
export class DrumVoice {
  constructor(ctx, outputNode) {
    this.ctx = ctx;
    this.outputNode = outputNode;
    this.lastTriggerTime = 0;
    this.currentLevel = 0;

    // Pre-generate stereo noise buffer for crisp, efficient hats and texture
    this.noiseBuffer = this._createNoiseBuffer(ctx, 1.0);
  }

  _createNoiseBuffer(ctx, duration) {
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    for (let i = 0; i < bufferSize; i++) {
      left[i] = (Math.random() * 2 - 1) * 0.8;
      right[i] = (Math.random() * 2 - 1) * 0.8;
    }
    return buffer;
  }

  playKick(time = this.ctx.currentTime, velocity = 1.0, punchy = false) {
    const ctx = this.ctx;
    this.lastTriggerTime = time;
    this.currentLevel = velocity;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Transient click for 4-on-the-floor or punchy styles
    if (punchy) {
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(450, time);
      clickOsc.frequency.exponentialRampToValueAtTime(70, time + 0.018);

      clickGain.gain.setValueAtTime(0.55 * velocity, time);
      clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.022);
      clickOsc.connect(clickGain);
      clickGain.connect(this.outputNode);

      clickOsc.start(time);
      clickOsc.stop(time + 0.025);
    }

    // Deep sub pitch dive
    osc.type = 'sine';
    const startFreq = punchy ? 145 : 115;
    const endFreq = punchy ? 42 : 36;
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.085);

    const decay = punchy ? 0.22 : 0.32;
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.9 * velocity, time + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    osc.connect(gain);
    gain.connect(this.outputNode);

    osc.start(time);
    osc.stop(time + decay + 0.02);
  }

  playSnare(time = this.ctx.currentTime, velocity = 0.8) {
    const ctx = this.ctx;
    this.lastTriggerTime = time;
    this.currentLevel = Math.max(this.currentLevel, velocity * 0.8);

    // Tonal body
    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(210, time);
    bodyOsc.frequency.exponentialRampToValueAtTime(120, time + 0.06);

    bodyGain.gain.setValueAtTime(0.5 * velocity, time);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.outputNode);

    // Noise snap
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1400, time);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6 * velocity, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    source.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.outputNode);

    bodyOsc.start(time);
    bodyOsc.stop(time + 0.14);
    source.start(time);
    source.stop(time + 0.2);
  }

  playHats(time = this.ctx.currentTime, velocity = 0.5, open = false) {
    const ctx = this.ctx;
    this.lastTriggerTime = time;
    this.currentLevel = Math.max(this.currentLevel, velocity * 0.6);

    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(open ? 6800 : 8400, time);
    filter.Q.setValueAtTime(open ? 2.5 : 4.5, time);

    const gain = ctx.createGain();
    const dur = open ? 0.24 : 0.045;

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.5 * velocity, time + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.outputNode);

    source.start(time);
    source.stop(time + dur + 0.01);
  }

  playClick(time = this.ctx.currentTime, velocity = 0.6) {
    const ctx = this.ctx;
    this.lastTriggerTime = time;
    this.currentLevel = Math.max(this.currentLevel, velocity * 0.7);

    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    const mainGain = ctx.createGain();

    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(1400, time);

    modulator.type = 'triangle';
    modulator.frequency.setValueAtTime(2640, time);

    modGain.gain.setValueAtTime(650 * velocity, time);
    modGain.gain.exponentialRampToValueAtTime(1.0, time + 0.035);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    mainGain.gain.setValueAtTime(0.001, time);
    mainGain.gain.linearRampToValueAtTime(0.35 * velocity, time + 0.003);
    mainGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

    carrier.connect(mainGain);
    mainGain.connect(this.outputNode);

    modulator.start(time);
    carrier.start(time);
    modulator.stop(time + 0.06);
    carrier.stop(time + 0.06);
  }

  getActivity() {
    this.currentLevel *= 0.88;
    return this.currentLevel;
  }
}
