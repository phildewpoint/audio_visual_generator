/**
 * PadVoice
 * 4-voice polyphonic ambient pad synthesizer.
 * Outputs solely to the assigned channel strip input for strict pre-send mute/solo control.
 */
export class PadVoice {
  constructor(ctx, outputNode) {
    this.ctx = ctx;
    this.outputNode = outputNode;

    this.currentLevel = 0;
    this.currentChordNotes = [];

    // Master pad filter
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(2400, ctx.currentTime);
    this.filter.Q.setValueAtTime(1.8, ctx.currentTime);

    this.filter.connect(this.outputNode);
  }

  setBrightness(cutoff = 2400) {
    if (!this.filter) return;
    this.filter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.1);
  }

  /**
   * Play ambient pad chord or stabs
   */
  playChord(freqs, duration = 8.0, velocity = 0.7, time = this.ctx.currentTime, isStab = false) {
    const ctx = this.ctx;
    this.currentLevel = velocity;
    this.currentChordNotes = freqs;

    const attack = isStab ? 0.02 : Math.min(1.8, duration * 0.25);
    const release = isStab ? 0.15 : Math.min(2.5, duration * 0.35);

    freqs.slice(0, 4).forEach((freq, idx) => {
      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      const voiceGain = ctx.createGain();

      oscA.type = 'sawtooth';
      oscB.type = 'triangle';

      const detuneAmount = (idx % 2 === 0 ? 6.5 : -6.5);
      oscA.frequency.setValueAtTime(freq, time);
      oscA.detune.setValueAtTime(detuneAmount, time);

      oscB.frequency.setValueAtTime(freq, time);
      oscB.detune.setValueAtTime(-detuneAmount, time);

      let voicePanner = null;
      if (ctx.createStereoPanner) {
        voicePanner = ctx.createStereoPanner();
        const pan = (idx / 3) * 1.4 - 0.7; // [-0.7, 0.7]
        voicePanner.pan.setValueAtTime(pan, time);
      }

      voiceGain.gain.setValueAtTime(0.0001, time);
      voiceGain.gain.linearRampToValueAtTime(0.24 * velocity, time + attack);
      voiceGain.gain.setValueAtTime(0.24 * velocity, time + duration - release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      oscA.connect(voiceGain);
      oscB.connect(voiceGain);

      if (voicePanner) {
        voiceGain.connect(voicePanner);
        voicePanner.connect(this.filter);
      } else {
        voiceGain.connect(this.filter);
      }

      oscA.start(time);
      oscB.start(time);

      const stopTime = time + duration + 0.1;
      oscA.stop(stopTime);
      oscB.stop(stopTime);

      setTimeout(() => {
        try {
          oscA.disconnect();
          oscB.disconnect();
          voiceGain.disconnect();
          if (voicePanner) voicePanner.disconnect();
        } catch (e) {}
      }, (duration + 0.3) * 1000);
    });
  }

  /**
   * Play single note for arpeggiated chord pulses
   */
  playSingleNote(freq, duration = 0.4, velocity = 0.65, time = this.ctx.currentTime) {
    const ctx = this.ctx;
    this.currentLevel = velocity;

    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    const voiceGain = ctx.createGain();

    oscA.type = 'sawtooth';
    oscB.type = 'triangle';

    oscA.frequency.setValueAtTime(freq, time);
    oscA.detune.setValueAtTime(5, time);
    oscB.frequency.setValueAtTime(freq, time);
    oscB.detune.setValueAtTime(-5, time);

    const attack = 0.015;
    const release = Math.min(0.25, duration * 0.5);

    voiceGain.gain.setValueAtTime(0.0001, time);
    voiceGain.gain.linearRampToValueAtTime(0.28 * velocity, time + attack);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    oscA.connect(voiceGain);
    oscB.connect(voiceGain);
    voiceGain.connect(this.filter);

    oscA.start(time);
    oscB.start(time);

    const stopTime = time + duration + 0.05;
    oscA.stop(stopTime);
    oscB.stop(stopTime);

    setTimeout(() => {
      try {
        oscA.disconnect();
        oscB.disconnect();
        voiceGain.disconnect();
      } catch (e) {}
    }, (duration + 0.15) * 1000);
  }

  getActivity() {
    this.currentLevel *= 0.95;
    return this.currentLevel;
  }
}
