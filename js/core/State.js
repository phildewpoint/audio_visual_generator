/**
 * Central Reactive Application State & Preset Store
 */
export class State {
  constructor() {
    this.listeners = new Map();

    // Visual configuration
    this.visual = {
      engine: 'synthwave',
      speed: 1.0,
      density: 1.0,
      paletteShift: 0,
      paletteName: 'cyberpunk',
      chaos: 1.0,
      bloom: 0.6,
      ascii: {
        ramp: 'dense',
        fontSize: 10,
        colorMode: 'neon',
        crtEffect: true
      },
      impressionist: {
        brushSize: 7,
        strokeLength: 16,
        particles: 3500,
        blendMode: 'soft'
      },
      stainedGlass: {
        cellCount: 160,
        leadWidth: 3.5,
        shimmer: true,
        edgeGlow: 0.8
      },
      synthwave: {
        gridSpeed: 1.2,
        mountainHeight: 1.0,
        sunVisible: true,
        wireframeOnly: false,
        crtScanlines: true
      }
    };

    // Multi-Part Audio Workstation Configuration
    this.audio = {
      isPlaying: false,
      masterVolume: 0.75,
      isMuted: false,
      bpm: 78,
      targetBpm: 78,
      melodyScale: 'lydian_cosmic',
      autoEvolve: true,
      reverbMix: 0.55,
      delayMix: 0.4,
      evolveConfig: {
        enabled: true,
        barsPerConcept: 16, // 8, 16, 24, 32
        currentConcept: 'cosmic_ambient',
        nextConcept: 'driving_outrun',
        barInConcept: 0,
        phase: 'groove', // 'groove', 'anticipation', 'fill_drop'
        autoEvolveFX: true,
        fxModIntensity: 0.5
      },
      effects: {
        master: {
          filterType: 'neutral', // 'neutral', 'lowpass', 'highpass'
          filterCutoff: 20000,
          filterResonance: 1.5,
          tapeWarmth: 0.35,
          reverbReturn: 0.55,
          delayReturn: 0.40,
          delayFeedback: 0.45,
          delayTime: 0.28,
          chorusReturn: 0.35,
          chorusRate: 0.7,
          autoEvolveFX: true
        }
      },
      tracks: {
        drums: {
          volume: 0.8,
          muted: false,
          solo: false,
          style: 'ambient_pulse', // 'ambient_pulse', 'four_on_floor', 'halftime_cinematic', 'glitch_idm', 'minimal_heartbeat', 'breakbeat_cyber'
          density: 1.0,
          punchy: false,
          drive: 0.15,
          reverbSend: 0.25,
          delaySend: 0.1,
          chorusSend: 0.0
        },
        bass: {
          volume: 0.85,
          muted: false,
          solo: false,
          style: 'cinematic_drone', // 'cinematic_drone', 'rolling_16th', 'syncopated_pulse', 'octave_bounce', 'acid_walk'
          tone: 420,
          resonance: 3.5,
          octave: 0, // -1, 0, 1
          drive: 0.25,
          reverbSend: 0.15,
          delaySend: 0.1,
          chorusSend: 0.15
        },
        pads: {
          volume: 0.75,
          muted: false,
          solo: false,
          style: 'ambient_swell', // 'ambient_swell', 'infinite_drone', 'rhythmic_stabs', 'arpeggiated_chord'
          voicing: 'wide_cinematic', // 'wide_cinematic', 'warm_triads', 'shimmer_extensions', 'suspended_space'
          brightness: 2400,
          drive: 0.0,
          reverbSend: 0.65,
          delaySend: 0.3,
          chorusSend: 0.45
        },
        lead: {
          volume: 0.7,
          muted: false,
          solo: false,
          style: 'celestial_chimes', // 'celestial_chimes', 'driving_arpeggio', 'call_and_response', 'slow_glide', 'pentatonic_solo'
          waveform: 'triangle', // 'triangle', 'sawtooth', 'square', 'sine'
          density: 1.0,
          octave: 0, // -1, 0, 1
          drive: 0.1,
          reverbSend: 0.35,
          delaySend: 0.55,
          chorusSend: 0.35
        }
      }
    };

    this.presets = {
      'Cosmic Voyage': {
        visual: {
          engine: 'synthwave',
          speed: 0.9,
          density: 1.1,
          paletteShift: 210,
          paletteName: 'cosmic',
          chaos: 0.85,
          bloom: 0.7
        },
        audio: {
          bpm: 74,
          melodyScale: 'lydian_cosmic',
          autoEvolve: true,
          reverbMix: 0.65,
          delayMix: 0.45,
          tracks: {
            drums: { volume: 0.75, muted: false, solo: false, style: 'ambient_pulse', density: 1.0 },
            bass: { volume: 0.85, muted: false, solo: false, style: 'cinematic_drone', tone: 420, octave: 0 },
            pads: { volume: 0.8, muted: false, solo: false, style: 'ambient_swell', voicing: 'wide_cinematic', brightness: 2400 },
            lead: { volume: 0.65, muted: false, solo: false, style: 'celestial_chimes', density: 1.0, delaySend: 0.5 }
          }
        }
      },
      'Deep Space Ambient': {
        visual: {
          engine: 'impressionist',
          speed: 0.7,
          density: 1.2,
          paletteShift: 250,
          paletteName: 'monet',
          chaos: 0.7,
          bloom: 0.6
        },
        audio: {
          bpm: 68,
          melodyScale: 'pentatonic_ethereal',
          autoEvolve: true,
          reverbMix: 0.75,
          delayMix: 0.5,
          tracks: {
            drums: { volume: 0.0, muted: true, solo: false, style: 'minimal_heartbeat' },
            bass: { volume: 0.85, muted: false, solo: false, style: 'cinematic_drone', tone: 320, octave: -1 },
            pads: { volume: 0.9, muted: false, solo: false, style: 'infinite_drone', voicing: 'wide_cinematic', brightness: 1800 },
            lead: { volume: 0.7, muted: false, solo: false, style: 'celestial_chimes', density: 0.7, delaySend: 0.6 }
          }
        }
      },
      'Cyberpunk Outrun': {
        visual: {
          engine: 'synthwave',
          speed: 1.3,
          density: 1.25,
          paletteShift: 310,
          paletteName: 'cyberpunk',
          chaos: 1.2,
          bloom: 0.85
        },
        audio: {
          bpm: 112,
          melodyScale: 'dorian_deep',
          autoEvolve: false,
          reverbMix: 0.4,
          delayMix: 0.35,
          tracks: {
            drums: { volume: 0.9, muted: false, solo: false, style: 'four_on_floor', density: 1.2 },
            bass: { volume: 0.9, muted: false, solo: false, style: 'rolling_16th', tone: 650, octave: 0 },
            pads: { volume: 0.65, muted: false, solo: false, style: 'rhythmic_stabs', voicing: 'shimmer_extensions', brightness: 3200 },
            lead: { volume: 0.8, muted: false, solo: false, style: 'driving_arpeggio', density: 1.2, delaySend: 0.4 }
          }
        }
      },
      'Cathedral Choirs': {
        visual: {
          engine: 'stained_glass',
          speed: 0.75,
          density: 1.15,
          paletteShift: 45,
          paletteName: 'cathedral',
          chaos: 0.8,
          bloom: 0.8
        },
        audio: {
          bpm: 70,
          melodyScale: 'aeolian_cinematic',
          autoEvolve: true,
          reverbMix: 0.82,
          delayMix: 0.3,
          tracks: {
            drums: { volume: 0.45, muted: false, solo: false, style: 'halftime_cinematic', density: 0.8 },
            bass: { volume: 0.85, muted: false, solo: false, style: 'cinematic_drone', tone: 380, octave: -1 },
            pads: { volume: 0.95, muted: false, solo: false, style: 'ambient_swell', voicing: 'warm_triads', brightness: 2200 },
            lead: { volume: 0.75, muted: false, solo: false, style: 'slow_glide', density: 0.8, delaySend: 0.4 }
          }
        }
      },
      'Matrix Terminal': {
        visual: {
          engine: 'ascii',
          speed: 1.15,
          density: 1.2,
          paletteShift: 120,
          paletteName: 'matrix',
          chaos: 1.25,
          bloom: 0.9
        },
        audio: {
          bpm: 92,
          melodyScale: 'mystic_insen',
          autoEvolve: true,
          reverbMix: 0.48,
          delayMix: 0.55,
          tracks: {
            drums: { volume: 0.85, muted: false, solo: false, style: 'glitch_idm', density: 1.3 },
            bass: { volume: 0.85, muted: false, solo: false, style: 'syncopated_pulse', tone: 520, octave: 0 },
            pads: { volume: 0.6, muted: false, solo: false, style: 'rhythmic_stabs', voicing: 'shimmer_extensions', brightness: 2600 },
            lead: { volume: 0.85, muted: false, solo: false, style: 'call_and_response', density: 1.1, delaySend: 0.6 }
          }
        }
      }
    };
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const arr = this.listeners.get(event);
    const idx = arr.indexOf(callback);
    if (idx !== -1) arr.splice(idx, 1);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in listener for event ${event}:`, err);
        }
      }
    }
    if (this.listeners.has('*')) {
      for (const cb of this.listeners.get('*')) {
        try {
          cb(event, data);
        } catch (err) {
          console.error('Error in wildcard listener:', err);
        }
      }
    }
  }

  setVisual(path, value) {
    this._setDeep(this.visual, path, value);
    this.emit('change:visual', { path, value, visual: this.visual });
  }

  setAudio(path, value) {
    this._setDeep(this.audio, path, value);
    this.emit('change:audio', { path, value, audio: this.audio });
  }

  setTrackProperty(trackName, property, value) {
    if (this.audio.tracks[trackName]) {
      this.audio.tracks[trackName][property] = value;
      this.emit('change:track', { track: trackName, property, value, trackState: this.audio.tracks[trackName] });
    }
  }

  setMasterEffect(property, value) {
    if (!this.audio.effects) this.audio.effects = { master: {} };
    if (!this.audio.effects.master) this.audio.effects.master = {};
    this.audio.effects.master[property] = value;
    if (property === 'reverbReturn') this.audio.reverbMix = value;
    if (property === 'delayReturn') this.audio.delayMix = value;
    this.emit('change:effects:master', { property, value, masterEffects: this.audio.effects.master });
    this.emit('change:audio', { path: `effects.master.${property}`, value, audio: this.audio });
  }

  setTrackEffect(trackName, property, value) {
    this.setTrackProperty(trackName, property, value);
  }

  setEvolveConfig(property, value) {
    if (!this.audio.evolveConfig) this.audio.evolveConfig = {};
    this.audio.evolveConfig[property] = value;
    this.emit('change:evolveConfig', { property, value, config: this.audio.evolveConfig });
  }

  setTrackVolume(trackName, volume) {
    this.setTrackProperty(trackName, 'volume', Math.max(0, Math.min(1, volume)));
  }

  toggleTrackMute(trackName) {
    if (this.audio.tracks[trackName]) {
      const isMuted = !this.audio.tracks[trackName].muted;
      this.setTrackProperty(trackName, 'muted', isMuted);
      return isMuted;
    }
    return false;
  }

  toggleTrackSolo(trackName) {
    if (this.audio.tracks[trackName]) {
      const wasSolo = this.audio.tracks[trackName].solo;
      this.setTrackProperty(trackName, 'solo', !wasSolo);
      return !wasSolo;
    }
    return false;
  }

  mutateTrack(trackName) {
    this.emit('mutate:track', trackName);
  }

  applyMood(moodName) {
    const moods = {
      cosmic_ambient: {
        bpm: 74,
        scale: 'lydian_cosmic',
        drums: { style: 'ambient_pulse', density: 0.9, punchy: false, drive: 0.1, reverbSend: 0.35, delaySend: 0.15, chorusSend: 0.0, muted: false },
        bass: { style: 'cinematic_drone', tone: 400, resonance: 3.0, octave: 0, drive: 0.2, reverbSend: 0.2, delaySend: 0.1, chorusSend: 0.15 },
        pads: { style: 'ambient_swell', voicing: 'wide_cinematic', brightness: 2200, drive: 0.0, reverbSend: 0.7, delaySend: 0.35, chorusSend: 0.5 },
        lead: { style: 'celestial_chimes', waveform: 'triangle', density: 0.9, drive: 0.05, reverbSend: 0.4, delaySend: 0.6, chorusSend: 0.35 }
      },
      driving_outrun: {
        bpm: 112,
        scale: 'dorian_deep',
        drums: { style: 'four_on_floor', density: 1.2, punchy: true, drive: 0.3, reverbSend: 0.15, delaySend: 0.1, chorusSend: 0.0, muted: false },
        bass: { style: 'rolling_16th', tone: 650, resonance: 4.5, octave: 0, drive: 0.35, reverbSend: 0.1, delaySend: 0.15, chorusSend: 0.25 },
        pads: { style: 'rhythmic_stabs', voicing: 'shimmer_extensions', brightness: 3200, drive: 0.1, reverbSend: 0.4, delaySend: 0.25, chorusSend: 0.4 },
        lead: { style: 'driving_arpeggio', waveform: 'sawtooth', density: 1.2, drive: 0.25, reverbSend: 0.25, delaySend: 0.45, chorusSend: 0.3 }
      },
      cinematic_tension: {
        bpm: 68,
        scale: 'aeolian_cinematic',
        drums: { style: 'halftime_cinematic', density: 1.0, punchy: true, drive: 0.25, reverbSend: 0.4, delaySend: 0.2, chorusSend: 0.0, muted: false },
        bass: { style: 'cinematic_drone', tone: 350, resonance: 2.5, octave: -1, drive: 0.2, reverbSend: 0.25, delaySend: 0.1, chorusSend: 0.1 },
        pads: { style: 'ambient_swell', voicing: 'warm_triads', brightness: 2000, drive: 0.05, reverbSend: 0.75, delaySend: 0.4, chorusSend: 0.4 },
        lead: { style: 'slow_glide', waveform: 'sine', density: 0.85, drive: 0.05, reverbSend: 0.5, delaySend: 0.55, chorusSend: 0.2 }
      },
      zen_meditation: {
        bpm: 62,
        scale: 'pentatonic_ethereal',
        drums: { style: 'minimal_heartbeat', density: 0.6, punchy: false, drive: 0.0, reverbSend: 0.5, delaySend: 0.25, chorusSend: 0.0, muted: true },
        bass: { style: 'cinematic_drone', tone: 300, resonance: 2.0, octave: -1, drive: 0.1, reverbSend: 0.3, delaySend: 0.15, chorusSend: 0.1 },
        pads: { style: 'infinite_drone', voicing: 'suspended_space', brightness: 1800, drive: 0.0, reverbSend: 0.85, delaySend: 0.45, chorusSend: 0.5 },
        lead: { style: 'celestial_chimes', waveform: 'triangle', density: 0.7, drive: 0.0, reverbSend: 0.5, delaySend: 0.7, chorusSend: 0.4 }
      },
      glitch_cyber: {
        bpm: 96,
        scale: 'mystic_insen',
        drums: { style: 'glitch_idm', density: 1.3, punchy: true, drive: 0.35, reverbSend: 0.25, delaySend: 0.3, chorusSend: 0.1, muted: false },
        bass: { style: 'acid_walk', tone: 580, resonance: 5.5, octave: 0, drive: 0.45, reverbSend: 0.15, delaySend: 0.2, chorusSend: 0.3 },
        pads: { style: 'arpeggiated_chord', voicing: 'shimmer_extensions', brightness: 2800, drive: 0.15, reverbSend: 0.5, delaySend: 0.35, chorusSend: 0.5 },
        lead: { style: 'call_and_response', waveform: 'square', density: 1.1, drive: 0.3, reverbSend: 0.3, delaySend: 0.6, chorusSend: 0.4 }
      }
    };

    const mood = moods[moodName];
    if (!mood) return;

    this.audio.targetBpm = mood.bpm;
    this.audio.bpm = mood.bpm;
    this.audio.melodyScale = mood.scale;
    if (this.audio.evolveConfig) {
      this.audio.evolveConfig.currentConcept = moodName;
      this.audio.evolveConfig.barInConcept = 0;
      this.audio.evolveConfig.phase = 'groove';
    }

    Object.keys(mood).forEach(k => {
      if (this.audio.tracks[k]) {
        Object.assign(this.audio.tracks[k], mood[k]);
      }
    });

    this.emit('change:audio', { audio: this.audio });
    this.emit('mutate:track', 'all');
    this.emit('mood:applied', moodName);
  }

  setEngine(engineName) {
    if (['ascii', 'impressionist', 'stained_glass', 'synthwave'].includes(engineName)) {
      this.visual.engine = engineName;
      this.emit('change:engine', engineName);
      this.emit('change:visual', { path: 'engine', value: engineName, visual: this.visual });
    }
  }

  loadPreset(presetName) {
    const preset = this.presets[presetName];
    if (!preset) return false;
    this.applyState(preset);
    this.emit('preset:loaded', presetName);
    return true;
  }

  applyState(newState) {
    if (newState.visual) {
      this._deepMerge(this.visual, newState.visual);
      this.emit('change:visual', { visual: this.visual });
    }
    if (newState.audio) {
      this._deepMerge(this.audio, newState.audio);
      this.emit('change:audio', { audio: this.audio });
    }
    if (newState.visual?.engine) {
      this.emit('change:engine', this.visual.engine);
    }
  }

  randomize() {
    const moods = ['cosmic_ambient', 'driving_outrun', 'cinematic_tension', 'zen_meditation', 'glitch_cyber'];
    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    this.applyMood(randomMood);

    const engines = ['ascii', 'impressionist', 'stained_glass', 'synthwave'];
    const palettes = ['cyberpunk', 'cosmic', 'monet', 'cathedral', 'matrix'];
    this.visual.engine = engines[Math.floor(Math.random() * engines.length)];
    this.visual.speed = +(0.5 + Math.random() * 1.5).toFixed(2);
    this.visual.density = +(0.8 + Math.random() * 0.7).toFixed(2);
    this.visual.paletteShift = Math.floor(Math.random() * 360);
    this.visual.paletteName = palettes[Math.floor(Math.random() * palettes.length)];
    this.visual.chaos = +(0.5 + Math.random() * 1.2).toFixed(2);
    this.visual.bloom = +(0.4 + Math.random() * 0.5).toFixed(2);

    this.emit('change:visual', { visual: this.visual });
    this.emit('change:engine', this.visual.engine);
    this.emit('preset:randomized');
  }

  exportJSON() {
    return JSON.stringify({
      visual: this.visual,
      audio: {
        bpm: this.audio.bpm,
        melodyScale: this.audio.melodyScale,
        autoEvolve: this.audio.autoEvolve,
        reverbMix: this.audio.reverbMix,
        delayMix: this.audio.delayMix,
        masterVolume: this.audio.masterVolume,
        tracks: this.audio.tracks
      }
    }, null, 2);
  }

  importJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      this.applyState(data);
      return true;
    } catch (e) {
      console.error('Invalid JSON state import:', e);
      return false;
    }
  }

  _setDeep(obj, path, value) {
    const keys = path.split('.');
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!cur[keys[i]]) cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;
  }

  _deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] instanceof Object && !Array.isArray(source[key]) && target[key]) {
        this._deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
}
