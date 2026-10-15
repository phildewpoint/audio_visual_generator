/**
 * LeadVoice
 * Crystalline melodic pluck, bell & expressive lead synthesizer.
 * Outputs solely to the assigned channel strip input for strict pre-send mute/solo control.
 */
export class LeadVoice {
  constructor(ctx, outputNode) {
    this.ctx = ctx;
    this.outputNode = outputNode;

    this.currentLevel = 0;
    this.currentFreq = 440;
    this.waveType = 'triangle';

    // Lead Tone Shaping Filter
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(4500, ctx.currentTime);
    this.filter.Q.setValueAtTime(2.2, ctx.currentTime);

    this.filter.connect(this.outputNode);
  }

  setWaveform(type = 'triangle') {
    this.waveType = type;
  }

  /**
   * Play expressive melodic pluck or chime note
   */
  playNote(freq, duration = 0.55, velocity = 0.8, time = this.ctx.currentTime, glide = false) {
    const ctx = this.ctx;
    this.currentLevel = velocity;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const voiceGain = ctx.createGain();

    osc1.type = this.waveType;
    osc2.type = 'sine';

    if (glide && this.currentFreq > 0) {
      osc1.frequency.setValueAtTime(this.currentFreq, time);
      osc1.frequency.exponentialRampToValueAtTime(Math.max(40, freq), time + 0.12);
      osc2.frequency.setValueAtTime(this.currentFreq * 2, time);
      osc2.frequency.exponentialRampToValueAtTime(Math.max(80, freq * 2), time + 0.12);
    } else {
      osc1.frequency.setValueAtTime(freq, time);
      osc2.frequency.setValueAtTime(freq * 2, time);
    }
    this.currentFreq = freq;

    // Vibrato LFO
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibrato.frequency.setValueAtTime(5.5, time);
    vibratoGain.gain.setValueAtTime(0, time);
    vibratoGain.gain.linearRampToValueAtTime(freq * 0.015, time + 0.22);
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc1.frequency);
    vibrato.start(time);
    vibrato.stop(time + duration + 0.1);

    // Filter pluck envelope
    this.filter.frequency.cancelScheduledValues(time);
    this.filter.frequency.setValueAtTime(2800, time);
    this.filter.frequency.linearRampToValueAtTime(5200 * (velocity * 0.6 + 0.4), time + 0.015);
    this.filter.frequency.exponentialRampToValueAtTime(2600, time + duration);

    // Pluck Amplitude Envelope (ADSR)
    const attack = 0.008;
    voiceGain.gain.setValueAtTime(0.0001, time);
    voiceGain.gain.linearRampToValueAtTime(0.38 * velocity, time + attack);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc1.connect(voiceGain);
    osc2.connect(voiceGain);
    voiceGain.connect(this.filter);

    osc1.start(time);
    osc2.start(time);

    const stopTime = time + duration + 0.05;
    osc1.stop(stopTime);
    osc2.stop(stopTime);

    setTimeout(() => {
      try {
        osc1.disconnect();
        osc2.disconnect();
        vibrato.disconnect();
        vibratoGain.disconnect();
        voiceGain.disconnect();
      } catch (e) {}
    }, (duration + 0.2) * 1000);
  }

  getActivity() {
    this.currentLevel *= 0.9;
    return this.currentLevel;
  }
}
