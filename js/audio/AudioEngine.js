import { DrumVoice } from './voices/DrumVoice.js';
import { BassVoice } from './voices/BassVoice.js';
import { PadVoice } from './voices/PadVoice.js';
import { LeadVoice } from './voices/LeadVoice.js';
import { GenerativeComposer } from './GenerativeComposer.js';

/**
 * Procedural Audio Workstation Engine
 * 100% Web Audio API multi-part generative synthesizer.
 * Features:
 * - Studio-grade pre-send mute/solo channel strips (zero wet leak)
 * - Per-track insert drive / saturation
 * - 3 Aux return buses: Algorithmic Space Reverb, Ping-Pong Delay, Stereo Dimension Chorus
 * - Master DJ Resonant Filter (Lowpass / Highpass) and Analog Tape Warmth
 * - Auto-Evolving FX with organic modulation and transition buildups
 * - Smooth tempo gliding & natural multi-concept musical transitions
 */
export class AudioEngine {
  constructor(state) {
    this.state = state;
    this.ctx = null;
    this.composer = new GenerativeComposer(state);

    // Master Bus Signal Chain
    this.preMasterBus = null;
    this.masterFilter = null;
    this.masterTapeNode = null;
    this.masterGain = null;
    this.masterLimiter = null;
    this.analyser = null;

    // Aux Return Buses
    this.reverbNode = null;
    this.reverbGain = null;
    this.delayNodeL = null;
    this.delayNodeR = null;
    this.delayGain = null;
    this.delayFeedbackNode = null;
    this.delayDampingFilter = null;

    // Stereo Dimension Chorus Bus
    this.chorusInput = null;
    this.chorusDelayL = null;
    this.chorusDelayR = null;
    this.chorusLFO = null;
    this.chorusGain = null;

    // Sidechain Ducking Node
    this.sidechainDuckingGain = null;

    // Channel Strips:
    // { inputNode, driveNode, muteNode, faderNode, dryGain, reverbSendGain, delaySendGain, chorusSendGain }
    this.channelStrips = {};

    // Voice Instances
    this.voices = {
      drums: null,
      bass: null,
      pads: null,
      lead: null
    };

    // Sequencer Transport State
    this.stepIndex = 0;
    this.barIndex = 0;
    this.timerId = null;
    this.leadStepIndex = 0;

    // Dynamic Tempo & FX Sweeps
    this.currentBpm = this.state.audio.bpm || 78;
    this.fxSweepPhase = 0;

    // Analysis Buffers
    this.freqData = null;
    this.waveData = null;
    this.beatThreshold = 0.45;
    this.beatDecay = 0.94;
    this.lastBassEnergy = 0;

    this._bindStateListeners();
  }

  _bindStateListeners() {
    this.state.on('change:audio', ({ path, value }) => {
      if (!this.ctx) return;
      if (path === 'masterVolume' || path === 'isMuted') this._updateMasterVolume();
      if (path === 'reverbMix') this._updateMasterEffects();
      if (path === 'delayMix') this._updateMasterEffects();
      if (path === 'melodyScale') {
        this.composer.rebuildAllPatterns();
      }
    });

    this.state.on('change:effects:master', () => {
      this._updateMasterEffects();
    });

    this.state.on('change:track', ({ track, property, value }) => {
      if (!this.ctx) return;
      this._updateChannelStrips();
      if (property === 'style' || property === 'density' || property === 'octave' || property === 'voicing') {
        this.composer.mutate(track);
      }
      if ((property === 'tone' || property === 'resonance') && this.voices.bass) {
        this.voices.bass.setTone(this.state.audio.tracks.bass.tone || 420, this.state.audio.tracks.bass.resonance || 3.5);
      }
      if (property === 'brightness' && this.voices.pads) {
        this.voices.pads.setBrightness(this.state.audio.tracks.pads.brightness || 2400);
      }
      if (property === 'waveform' && this.voices.lead) {
        this.voices.lead.setWaveform(value);
      }
    });

    this.state.on('mutate:track', (trackName) => {
      this.composer.mutate(trackName);
    });

    this.state.on('journey:anticipation', () => {
      this._tickAutoEvolveFX();
    });

    this.state.on('journey:fill', () => {
      this._tickAutoEvolveFX();
    });

    this.state.on('journey:drop', () => {
      this._updateMasterEffects();
    });
  }

  async start() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this._buildMixerGraph();
      this._startSequencer();
    } else if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.state.audio.isPlaying = true;
    this.state.emit('change:audio', { path: 'isPlaying', value: true });
  }

  stop() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
    this.state.audio.isPlaying = false;
    this.state.emit('change:audio', { path: 'isPlaying', value: false });
  }

  toggle() {
    if (this.state.audio.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  _buildMixerGraph() {
    const ctx = this.ctx;

    // 1. Pre-Master Summing Bus
    this.preMasterBus = ctx.createGain();

    // 2. Master DJ Resonant Filter
    this.masterFilter = ctx.createBiquadFilter();
    this.masterFilter.type = 'lowpass';
    this.masterFilter.frequency.setValueAtTime(20000, ctx.currentTime);
    this.masterFilter.Q.setValueAtTime(1.5, ctx.currentTime);

    // 3. Master Tape Warmth / Analog Saturation
    this.masterTapeNode = ctx.createWaveShaper();
    this.masterTapeNode.curve = this._generateTapeWarmthCurve(this.state.audio.effects?.master?.tapeWarmth ?? 0.35);
    this.masterTapeNode.oversample = '2x';

    // 4. Master Volume Fader
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.state.audio.masterVolume, ctx.currentTime);

    // 5. Master Brickwall Limiter & Analyser
    this.masterLimiter = ctx.createWaveShaper();
    this.masterLimiter.curve = this._generateLimiterCurve();
    this.masterLimiter.oversample = '2x';

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.82;
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
    this.waveData = new Float32Array(this.analyser.fftSize);

    // Connect Master Signal Chain:
    // preMasterBus -> masterFilter -> masterTapeNode -> masterGain -> masterLimiter -> analyser -> destination
    this.preMasterBus.connect(this.masterFilter);
    this.masterFilter.connect(this.masterTapeNode);
    this.masterTapeNode.connect(this.masterGain);
    this.masterGain.connect(this.masterLimiter);
    this.masterLimiter.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    // 6. Aux Reverb Bus (Returns into preMasterBus)
    this.reverbNode = ctx.createConvolver();
    this.reverbNode.buffer = this._generateImpulseResponse(3.8, 1.8);
    this.reverbGain = ctx.createGain();
    const revReturn = this.state.audio.effects?.master?.reverbReturn ?? this.state.audio.reverbMix ?? 0.55;
    this.reverbGain.gain.setValueAtTime(revReturn, ctx.currentTime);
    this.reverbNode.connect(this.reverbGain);
    this.reverbGain.connect(this.preMasterBus);

    // 7. Aux Stereo Ping-Pong Delay Bus (Returns into preMasterBus)
    this.delayNodeL = ctx.createDelay();
    this.delayNodeR = ctx.createDelay();
    this.delayGain = ctx.createGain();
    const dlyReturn = this.state.audio.effects?.master?.delayReturn ?? this.state.audio.delayMix ?? 0.40;
    this.delayGain.gain.setValueAtTime(dlyReturn, ctx.currentTime);

    this.delayFeedbackNode = ctx.createGain();
    const fbVal = this.state.audio.effects?.master?.delayFeedback ?? 0.45;
    this.delayFeedbackNode.gain.setValueAtTime(fbVal, ctx.currentTime);

    this.delayDampingFilter = ctx.createBiquadFilter();
    this.delayDampingFilter.type = 'lowpass';
    this.delayDampingFilter.frequency.setValueAtTime(3200, ctx.currentTime);

    this.delayNodeL.delayTime.setValueAtTime(0.28, ctx.currentTime);
    this.delayNodeR.delayTime.setValueAtTime(0.42, ctx.currentTime);

    this.delayNodeL.connect(this.delayNodeR);
    this.delayNodeR.connect(this.delayDampingFilter);
    this.delayDampingFilter.connect(this.delayFeedbackNode);
    this.delayFeedbackNode.connect(this.delayNodeL);

    this.delayNodeL.connect(this.delayGain);
    this.delayNodeR.connect(this.delayGain);
    this.delayGain.connect(this.preMasterBus);

    // 8. Aux Stereo Dimension Chorus Bus (Returns into preMasterBus)
    this.chorusInput = ctx.createGain();
    this.chorusDelayL = ctx.createDelay();
    this.chorusDelayR = ctx.createDelay();
    this.chorusDelayL.delayTime.setValueAtTime(0.022, ctx.currentTime);
    this.chorusDelayR.delayTime.setValueAtTime(0.028, ctx.currentTime);

    this.chorusGain = ctx.createGain();
    const choReturn = this.state.audio.effects?.master?.chorusReturn ?? 0.35;
    this.chorusGain.gain.setValueAtTime(choReturn, ctx.currentTime);

    this.chorusLFO = ctx.createOscillator();
    this.chorusLFO.type = 'sine';
    this.chorusLFO.frequency.setValueAtTime(0.7, ctx.currentTime);

    const chorusDepthL = ctx.createGain();
    const chorusDepthR = ctx.createGain();
    chorusDepthL.gain.setValueAtTime(0.0028, ctx.currentTime);
    chorusDepthR.gain.setValueAtTime(-0.0028, ctx.currentTime);

    this.chorusLFO.connect(chorusDepthL);
    this.chorusLFO.connect(chorusDepthR);
    chorusDepthL.connect(this.chorusDelayL.delayTime);
    chorusDepthR.connect(this.chorusDelayR.delayTime);

    this.chorusInput.connect(this.chorusDelayL);
    this.chorusInput.connect(this.chorusDelayR);
    this.chorusDelayL.connect(this.chorusGain);
    this.chorusDelayR.connect(this.chorusGain);
    this.chorusGain.connect(this.preMasterBus);

    try {
      this.chorusLFO.start();
    } catch (e) {}

    // 9. Sidechain Pumping Bus
    this.sidechainDuckingGain = ctx.createGain();
    this.sidechainDuckingGain.gain.setValueAtTime(1.0, ctx.currentTime);
    this.sidechainDuckingGain.connect(this.preMasterBus);

    // 10. Channel Strips with per-track Drive, Mute, Fader, and 3 Aux Sends
    const trackNames = ['drums', 'bass', 'pads', 'lead'];
    trackNames.forEach(track => {
      const inputNode = ctx.createGain();
      const driveNode = ctx.createWaveShaper();
      const trkState = this.state.audio.tracks[track] || {};
      driveNode.curve = this._generateDriveCurve(trkState.drive ?? 0);
      driveNode.oversample = '2x';

      const muteNode = ctx.createGain();
      const faderNode = ctx.createGain();

      const dryGain = ctx.createGain();
      const reverbSendGain = ctx.createGain();
      const delaySendGain = ctx.createGain();
      const chorusSendGain = ctx.createGain();

      // Flow: Voice Audio -> Input -> Drive -> MUTE -> Fader -> { Dry, Reverb, Delay, Chorus }
      inputNode.connect(driveNode);
      driveNode.connect(muteNode);
      muteNode.connect(faderNode);

      faderNode.connect(dryGain);
      faderNode.connect(reverbSendGain);
      faderNode.connect(delaySendGain);
      faderNode.connect(chorusSendGain);

      // Connect sends to aux buses
      reverbSendGain.connect(this.reverbNode);
      delaySendGain.connect(this.delayNodeL);
      chorusSendGain.connect(this.chorusInput);

      // Route Dry: Bass and Pads through sidechain ducking, Drums and Lead directly to preMasterBus
      if (track === 'bass' || track === 'pads') {
        dryGain.connect(this.sidechainDuckingGain);
      } else {
        dryGain.connect(this.preMasterBus);
      }

      this.channelStrips[track] = {
        inputNode,
        driveNode,
        muteNode,
        faderNode,
        dryGain,
        reverbSendGain,
        delaySendGain,
        chorusSendGain
      };
    });

    // 11. Connect Voices
    this.voices.drums = new DrumVoice(ctx, this.channelStrips.drums.inputNode);
    this.voices.bass = new BassVoice(ctx, this.channelStrips.bass.inputNode);
    this.voices.pads = new PadVoice(ctx, this.channelStrips.pads.inputNode);
    this.voices.lead = new LeadVoice(ctx, this.channelStrips.lead.inputNode);

    this._updateChannelStrips();
    this._updateMasterEffects();
  }

  _generateLimiterCurve() {
    const samples = 1024;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = Math.tanh(x);
    }
    return curve;
  }

  _generateDriveCurve(drive = 0) {
    const samples = 1024;
    const curve = new Float32Array(samples);
    const k = Math.max(0, drive) * 8;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      if (k === 0) {
        curve[i] = x;
      } else {
        curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
      }
    }
    return curve;
  }

  _generateTapeWarmthCurve(warmth = 0.35) {
    const samples = 1024;
    const curve = new Float32Array(samples);
    const amount = 1 + warmth * 1.8;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = Math.tanh(x * amount) / Math.tanh(amount);
    }
    return curve;
  }

  _generateImpulseResponse(duration, decay) {
    const ctx = this.ctx;
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / length;
      const env = Math.pow(1 - t, decay);
      left[i] = (Math.random() * 2 - 1) * env;
      right[i] = (Math.random() * 2 - 1) * env;
    }
    return impulse;
  }

  isAudible(trackName) {
    const tracks = this.state.audio.tracks;
    if (!tracks) return false;
    const t = tracks[trackName];
    if (!t) return false;
    const anySolo = Object.values(tracks).some(x => x.solo);
    if (anySolo && !t.solo) return false;
    return !t.muted && t.volume > 0.001;
  }

  _updateChannelStrips() {
    if (!this.ctx) return;
    const tracks = this.state.audio.tracks;
    const now = this.ctx.currentTime;

    Object.keys(tracks).forEach(name => {
      const trackState = tracks[name];
      const strip = this.channelStrips[name];
      if (!strip) return;

      strip.faderNode.gain.setTargetAtTime(trackState.volume, now, 0.02);

      // Pre-send Mute: When muted, mutes direct sound AND all aux sends!
      const audible = this.isAudible(name);

      strip.muteNode.gain.cancelScheduledValues(now);
      strip.muteNode.gain.setValueAtTime(strip.muteNode.gain.value, now);
      strip.muteNode.gain.linearRampToValueAtTime(audible ? 1.0 : 0.0, now + 0.008);

      // Aux Send levels
      const revSend = trackState.reverbSend !== undefined ? trackState.reverbSend : 0.35;
      const dlySend = trackState.delaySend !== undefined ? trackState.delaySend : 0.35;
      const choSend = trackState.chorusSend !== undefined ? trackState.chorusSend : 0.15;
      strip.reverbSendGain.gain.setTargetAtTime(revSend, now, 0.05);
      strip.delaySendGain.gain.setTargetAtTime(dlySend, now, 0.05);
      if (strip.chorusSendGain) {
        strip.chorusSendGain.gain.setTargetAtTime(choSend, now, 0.05);
      }

      // Track Drive Insert
      if (strip.driveNode && trackState.drive !== undefined) {
        strip.driveNode.curve = this._generateDriveCurve(trackState.drive);
      }
    });
  }

  _updateMasterEffects() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const fx = this.state.audio.effects?.master || {};

    // 1. Master DJ Filter
    if (this.masterFilter) {
      const fType = fx.filterType || 'neutral';
      const cutoff = fx.filterCutoff !== undefined ? fx.filterCutoff : 20000;
      const res = fx.filterResonance !== undefined ? fx.filterResonance : 1.5;

      if (fType === 'highpass') {
        this.masterFilter.type = 'highpass';
        this.masterFilter.frequency.setTargetAtTime(Math.min(5000, Math.max(20, cutoff)), now, 0.05);
      } else {
        this.masterFilter.type = 'lowpass';
        this.masterFilter.frequency.setTargetAtTime(Math.min(20000, Math.max(150, cutoff)), now, 0.05);
      }
      this.masterFilter.Q.setTargetAtTime(res, now, 0.05);
    }

    // 2. Master Tape Warmth
    if (this.masterTapeNode) {
      const warmth = fx.tapeWarmth !== undefined ? fx.tapeWarmth : 0.35;
      this.masterTapeNode.curve = this._generateTapeWarmthCurve(warmth);
    }

    // 3. Aux Returns
    if (this.reverbGain) {
      const rev = fx.reverbReturn !== undefined ? fx.reverbReturn : (this.state.audio.reverbMix || 0.55);
      this.reverbGain.gain.setTargetAtTime(rev, now, 0.05);
    }
    if (this.delayGain) {
      const dly = fx.delayReturn !== undefined ? fx.delayReturn : (this.state.audio.delayMix || 0.40);
      this.delayGain.gain.setTargetAtTime(dly, now, 0.05);
    }
    if (this.delayFeedbackNode) {
      const fb = fx.delayFeedback !== undefined ? fx.delayFeedback : 0.45;
      this.delayFeedbackNode.gain.setTargetAtTime(Math.min(0.88, Math.max(0.05, fb)), now, 0.05);
    }
    if (this.chorusGain) {
      const cho = fx.chorusReturn !== undefined ? fx.chorusReturn : 0.35;
      this.chorusGain.gain.setTargetAtTime(cho, now, 0.05);
    }
  }

  _tickAutoEvolveFX() {
    if (!this.ctx) return;
    const config = this.state.audio.evolveConfig;
    if (!config || !config.autoEvolveFX) return;

    const now = this.ctx.currentTime;
    const phase = config.phase || 'groove';
    const barInConcept = config.barInConcept || 0;
    const barsPerConcept = config.barsPerConcept || 16;
    const intensity = config.fxModIntensity ?? 0.5;

    if (phase === 'anticipation') {
      // Buildup tension: filter sweeps and delay wash swells
      const progress = Math.max(0, Math.min(1, (barInConcept - (barsPerConcept - 4)) / 4));
      if (this.masterFilter) {
        const sweepFreq = 20000 - progress * 14000 * intensity;
        this.masterFilter.frequency.setTargetAtTime(Math.max(600, sweepFreq), now, 0.15);
        this.masterFilter.Q.setTargetAtTime(2.2 + progress * 2.5, now, 0.15);
      }
      if (this.delayFeedbackNode) {
        const swellFb = 0.45 + progress * 0.25 * intensity;
        this.delayFeedbackNode.gain.setTargetAtTime(Math.min(0.78, swellFb), now, 0.15);
      }
      if (this.reverbGain) {
        const revBase = this.state.audio.effects?.master?.reverbReturn ?? 0.55;
        this.reverbGain.gain.setTargetAtTime(Math.min(0.88, revBase + progress * 0.2), now, 0.15);
      }
    } else if (phase === 'fill_drop') {
      // Tension peak: highpass sweep & open reverb wash
      if (this.masterFilter) {
        this.masterFilter.frequency.setTargetAtTime(900, now, 0.08);
      }
    } else {
      // Groove: restore defaults with subtle organic LFO breathing
      this.fxSweepPhase += 0.12;
      const breathing = Math.sin(this.fxSweepPhase) * 0.05 * intensity;

      if (this.delayFeedbackNode) {
        const baseFb = this.state.audio.effects?.master?.delayFeedback ?? 0.45;
        this.delayFeedbackNode.gain.setTargetAtTime(Math.min(0.72, Math.max(0.2, baseFb + breathing)), now, 0.35);
      }

      const userCutoff = this.state.audio.effects?.master?.filterCutoff ?? 20000;
      const userQ = this.state.audio.effects?.master?.filterResonance ?? 1.5;
      if (this.masterFilter) {
        this.masterFilter.frequency.setTargetAtTime(userCutoff, now, 0.25);
        this.masterFilter.Q.setTargetAtTime(userQ, now, 0.25);
      }
      if (this.reverbGain) {
        const revBase = this.state.audio.effects?.master?.reverbReturn ?? 0.55;
        this.reverbGain.gain.setTargetAtTime(revBase, now, 0.25);
      }
    }
  }

  _updateMasterVolume() {
    if (!this.masterGain || !this.ctx) return;
    const vol = this.state.audio.isMuted ? 0 : this.state.audio.masterVolume;
    this.masterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
  }

  _triggerSidechainDuck(time) {
    if (!this.sidechainDuckingGain) return;
    this.sidechainDuckingGain.gain.cancelScheduledValues(time);
    this.sidechainDuckingGain.gain.setValueAtTime(1.0, time);
    this.sidechainDuckingGain.gain.linearRampToValueAtTime(0.55, time + 0.012);
    this.sidechainDuckingGain.gain.exponentialRampToValueAtTime(1.0, time + 0.22);
  }

  _startSequencer() {
    const scheduleNext = () => {
      if (!this.ctx || this.ctx.state !== 'running') {
        this.timerId = setTimeout(scheduleNext, 200);
        return;
      }

      // Smooth tempo interpolation toward targetBpm
      const targetBpm = this.state.audio.targetBpm || this.state.audio.bpm || 78;
      this.currentBpm = this.currentBpm || targetBpm;
      this.currentBpm += (targetBpm - this.currentBpm) * 0.06;
      this.state.audio.bpm = Math.round(this.currentBpm);
      const stepDuration = 60 / this.currentBpm / 4; // 16th note

      this._playStep(this.stepIndex, this.ctx.currentTime);

      this.stepIndex = (this.stepIndex + 1) % 16;
      if (this.stepIndex === 0) {
        this.barIndex++;
        if (this.state.audio.autoEvolve) {
          this.composer.tickAutoEvolve();
          this._tickAutoEvolveFX();
        }
      }

      this.timerId = setTimeout(scheduleNext, stepDuration * 1000);
    };

    scheduleNext();
  }

  _playStep(step, time) {
    if (!this.ctx) return;
    const patterns = this.composer.patterns;
    const tracks = this.state.audio.tracks || {};

    // 1. DRUMS VOICE (strictly gated if muted)
    if (this.voices.drums && patterns.drums && this.isAudible('drums')) {
      const isPunchy = tracks.drums?.punchy || tracks.drums?.style === 'four_on_floor' || tracks.drums?.style === 'breakbeat_cyber';
      if (patterns.drums.kick[step]) {
        this.voices.drums.playKick(time, 0.95, isPunchy);
        this._triggerSidechainDuck(time);
      }
      if (patterns.drums.snare && patterns.drums.snare[step]) {
        this.voices.drums.playSnare(time, 0.85);
      }
      if (patterns.drums.hats[step]) {
        const isOpen = step % 4 === 2;
        this.voices.drums.playHats(time, isOpen ? 0.45 : 0.25, isOpen);
      }
      if (patterns.drums.clicks[step]) {
        this.voices.drums.playClick(time, 0.55);
      }
    }

    // 2. BASS VOICE (strictly gated if muted)
    if (this.voices.bass && patterns.bass?.steps[step] && this.isAudible('bass')) {
      const octave = patterns.bass.octaves[step] || 0;
      const freq = this.composer.getBassFrequency(octave);
      const stepDuration = 60 / this.currentBpm / 4;
      const isDrone = tracks.bass?.style === 'cinematic_drone';
      const duration = isDrone ? stepDuration * 15 : stepDuration * 2.2;
      this.voices.bass.triggerNote(freq, duration, 0.85, time);
    }

    // 3. PADS VOICE (strictly gated if muted, while advancing chord harmony in sync)
    if (this.voices.pads) {
      const padStyle = tracks.pads?.style || 'ambient_swell';
      const padVoicing = tracks.pads?.voicing || 'wide_cinematic';
      const stepDuration = 60 / this.currentBpm / 4;
      const padsAudible = this.isAudible('pads');

      if (padStyle === 'rhythmic_stabs') {
        if (step % 2 === 0 && padsAudible) {
          const freqs = this.composer.getChordFrequencies(padVoicing);
          this.voices.pads.playChord(freqs, stepDuration * 1.6, 0.65, time, true);
        }
        if (step === 0 && this.barIndex % 2 === 0) this.composer.nextChord();
      } else if (padStyle === 'arpeggiated_chord') {
        if (padsAudible) {
          const freqs = this.composer.getChordFrequencies(padVoicing);
          const arpFreq = freqs[step % freqs.length];
          this.voices.pads.playSingleNote(arpFreq, stepDuration * 2.2, 0.65, time);
        }
        if (step === 0 && this.barIndex % 2 === 0) this.composer.nextChord();
      } else if (padStyle === 'infinite_drone') {
        if (step === 0 && this.barIndex % 4 === 0) {
          if (padsAudible) {
            const freqs = this.composer.getChordFrequencies(padVoicing);
            this.voices.pads.playChord(freqs, stepDuration * 64, 0.7, time, false);
          }
          this.composer.nextChord();
        }
      } else {
        // Ambient Swell: 2-bar swells
        if (step === 0 && this.barIndex % 2 === 0) {
          if (padsAudible) {
            const freqs = this.composer.getChordFrequencies(padVoicing);
            this.voices.pads.playChord(freqs, (60 / this.currentBpm) * 8, 0.75, time, false);
          }
          this.composer.nextChord();
        }
      }
    }

    // 4. LEAD VOICE (strictly gated if muted)
    if (this.voices.lead && patterns.lead) {
      const leadPat = patterns.lead;
      const leadIdx = this.leadStepIndex % leadPat.length;
      this.leadStepIndex++;

      if (leadPat.active[leadIdx] && this.isAudible('lead')) {
        const chord = this.composer.getCurrentChord();
        const userOctave = tracks.lead?.octave || 0;
        const semi = leadPat.notes[leadIdx] + chord.rootSemi + userOctave * 12;
        const freq = this.composer.baseFundamental * 4 * Math.pow(2, semi / 12);
        const isGlide = tracks.lead?.style === 'slow_glide';
        this.voices.lead.playNote(freq, isGlide ? 0.9 : 0.55, 0.75, time, isGlide);
      }
    }
  }

  getAudioData() {
    if (!this.analyser || !this.ctx || this.ctx.state !== 'running') {
      return {
        bass: 0,
        mid: 0,
        treble: 0,
        energy: 0,
        beat: false,
        currentStep: this.stepIndex || 0,
        currentBar: this.barIndex || 0,
        currentBpm: Math.round(this.currentBpm || this.state.audio.bpm || 78),
        journey: {
          concept: this.composer.getCurrentConcept(),
          nextConcept: this.composer.getNextConcept(),
          phase: this.composer.phase,
          barInConcept: this.composer.barInConcept,
          barsPerConcept: this.state.audio.evolveConfig?.barsPerConcept || 16
        },
        drumsActivity: 0,
        bassActivity: 0,
        padActivity: 0,
        leadActivity: 0,
        waveform: new Float32Array(128),
        spectrum: new Uint8Array(64)
      };
    }

    this.analyser.getByteFrequencyData(this.freqData);
    this.analyser.getFloatTimeDomainData(this.waveData);

    const binCount = this.analyser.frequencyBinCount;
    let bassSum = 0;
    const bassBins = Math.min(14, binCount);
    for (let i = 1; i < bassBins; i++) bassSum += this.freqData[i];
    const bass = bassSum / (bassBins * 255);

    let midSum = 0;
    const midBins = Math.min(85, binCount);
    for (let i = bassBins; i < midBins; i++) midSum += this.freqData[i];
    const mid = midSum / ((midBins - bassBins) * 255);

    let trebleSum = 0;
    const trebleBins = Math.min(220, binCount);
    for (let i = midBins; i < trebleBins; i++) trebleSum += this.freqData[i];
    const treble = trebleSum / ((trebleBins - midBins) * 255);

    const energy = (bass * 0.45 + mid * 0.35 + treble * 0.2);

    let beat = false;
    if (bass > this.beatThreshold && bass > this.lastBassEnergy * 1.15) {
      beat = true;
      this.beatThreshold = bass * 1.05;
    } else {
      this.beatThreshold = Math.max(0.28, this.beatThreshold * this.beatDecay);
    }
    this.lastBassEnergy = bass;

    return {
      bass,
      mid,
      treble,
      energy,
      beat,
      currentStep: this.stepIndex,
      currentBar: this.barIndex,
      currentBpm: Math.round(this.currentBpm || this.state.audio.bpm),
      journey: {
        concept: this.composer.getCurrentConcept(),
        nextConcept: this.composer.getNextConcept(),
        phase: this.composer.phase,
        barInConcept: this.composer.barInConcept,
        barsPerConcept: this.state.audio.evolveConfig?.barsPerConcept || 16
      },
      drumsActivity: this.voices.drums ? this.voices.drums.getActivity() : 0,
      bassActivity: this.voices.bass ? this.voices.bass.getActivity() : 0,
      padActivity: this.voices.pads ? this.voices.pads.getActivity() : 0,
      leadActivity: this.voices.lead ? this.voices.lead.getActivity() : 0,
      waveform: this.waveData,
      spectrum: this.freqData
    };
  }
}
