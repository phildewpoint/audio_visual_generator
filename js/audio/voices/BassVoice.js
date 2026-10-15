/**
 * BassVoice
 * Warm analog / Moog-style resonant bass & grounding drone synthesizer.
 * Features dual oscillators, smooth portamento/glide, resonant filter envelope,
 * and warm polynomial saturation.
 */
export class BassVoice {
  constructor(ctx, outputNode) {
    this.ctx = ctx;
    this.outputNode = outputNode;

    this.glideTime = 0.22; // Seconds
    this.currentFreq = 65.41; // C2
    this.lastTriggerTime = 0;
    this.currentLevel = 0;

    // Filter & Saturation Chain
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(380, ctx.currentTime);
    this.filter.Q.setValueAtTime(3.5, ctx.currentTime);

    // Soft Saturation / Waveshaper
    this.waveshaper = ctx.createWaveShaper();
    this.waveshaper.curve = this._generateSoftClipCurve();
    this.waveshaper.oversample = '2x';

    this.filter.connect(this.waveshaper);
    this.waveshaper.connect(this.outputNode);

    // Active nodes map for legato notes
    this.activeVoices = [];
  }

  _generateSoftClipCurve() {
    const samples = 1024;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      // Smooth hyperbolic tangent approximation
      curve[i] = Math.tanh(x * 1.5) / Math.tanh(1.5);
    }
    return curve;
  }

  /**
   * Set filter tone / brightness
   */
  setTone(cutoff = 400, resonance = 3.5) {
    if (!this.filter) return;
    this.filter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.05);
    this.filter.Q.setTargetAtTime(resonance, this.ctx.currentTime, 0.05);
  }

  /**
   * Trigger or glide to a new bass note
   */
  triggerNote(freq, duration = 0.8, velocity = 0.9, time = this.ctx.currentTime) {
    const ctx = this.ctx;
    this.lastTriggerTime = time;
    this.currentLevel = velocity;

    // Osc 1: Deep Sine Sub
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';

    // Osc 2: Warm Triangle/Saw overtone (1 octave up)
    const midOsc = ctx.createOscillator();
    midOsc.type = 'triangle';

    const subGain = ctx.createGain();
    const midGain = ctx.createGain();
    const masterVoiceGain = ctx.createGain();

    // Portamento / Glide from current frequency to new frequency
    const startFreq = this.currentFreq;
    subOsc.frequency.setValueAtTime(startFreq, time);
    subOsc.frequency.exponentialRampToValueAtTime(Math.max(20, freq), time + this.glideTime);

    midOsc.frequency.setValueAtTime(startFreq * 2, time);
    midOsc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 2), time + this.glideTime);
    this.currentFreq = freq;

    // Oscillator level balance
    subGain.gain.setValueAtTime(0.75, time);
    midGain.gain.setValueAtTime(0.35, time);

    subOsc.connect(subGain);
    midOsc.connect(midGain);
    subGain.connect(masterVoiceGain);
    midGain.connect(masterVoiceGain);

    masterVoiceGain.connect(this.filter);

    // Dynamic Filter Envelope (punchy opening that settles into warm hum)
    this.filter.frequency.cancelScheduledValues(time);
    this.filter.frequency.setValueAtTime(220, time);
    this.filter.frequency.exponentialRampToValueAtTime(650 * (velocity * 0.8 + 0.2), time + 0.04);
    this.filter.frequency.exponentialRampToValueAtTime(320, time + duration);

    // Amplitude ADSR Envelope
    const attack = 0.04;
    const release = 0.25;
    masterVoiceGain.gain.setValueAtTime(0.001, time);
    masterVoiceGain.gain.linearRampToValueAtTime(0.65 * velocity, time + attack);
    masterVoiceGain.gain.setValueAtTime(0.65 * velocity, time + duration - release);
    masterVoiceGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    subOsc.start(time);
    midOsc.start(time);

    const stopTime = time + duration + 0.05;
    subOsc.stop(stopTime);
    midOsc.stop(stopTime);

    // Cleanup reference
    setTimeout(() => {
      try {
        subOsc.disconnect();
        midOsc.disconnect();
        subGain.disconnect();
        midGain.disconnect();
        masterVoiceGain.disconnect();
      } catch (e) {}
    }, (duration + 0.2) * 1000);
  }

  getActivity() {
    this.currentLevel *= 0.92;
    return this.currentLevel;
  }
}
