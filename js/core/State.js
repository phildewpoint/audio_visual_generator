/**
 * Central Reactive Application State & Preset Store
 */
export class State {
  constructor() {
    this.listeners = new Map();

    // Visual configuration
    this.visual = {
      construct: 'blade_runner', // 'blade_runner', 'studio_ghibli', 'vintage_cartoon', 'dune_arrakis', 'cosmic_default'
      engine: 'construct', // 'construct' (Native), 'ascii', 'impressionist', 'stained_glass', 'synthwave'
      syncAudioToConstruct: true,
      speed: 1.0,
      density: 1.0,
      paletteShift: 0,
      paletteName: 'cyberpunk',
      chaos: 1.0,
      bloom: 0.65,
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
      bpm: 70,
      targetBpm: 70,
      melodyScale: 'aeolian_cinematic',
      autoEvolve: true,
      reverbMix: 0.75,
      delayMix: 0.55,
      evolveConfig: {
        enabled: true,
        barsPerConcept: 16, // 8, 16, 24, 32
        currentConcept: 'blade_runner',
        nextConcept: 'studio_ghibli',
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
          tapeWarmth: 0.4,
          reverbReturn: 0.75,
          delayReturn: 0.55,
          delayFeedback: 0.52,
          delayTime: 0.28,
          chorusReturn: 0.50,
          chorusRate: 0.7,
          autoEvolveFX: true
        }
      },
      tracks: {
        drums: {
          volume: 0.8,
          muted: false,
          solo: false,
          style: 'halftime_cinematic', // 'ambient_pulse', 'four_on_floor', 'halftime_cinematic', 'glitch_idm', 'minimal_heartbeat', 'breakbeat_cyber'
          density: 0.9,
          punchy: true,
          drive: 0.25,
          reverbSend: 0.5,
          delaySend: 0.2,
          chorusSend: 0.0
        },
        bass: {
          volume: 0.85,
          muted: false,
          solo: false,
          style: 'cinematic_drone', // 'cinematic_drone', 'rolling_16th', 'syncopated_pulse', 'octave_bounce', 'acid_walk'
          tone: 360,
          resonance: 4.0,
          octave: -1, // -1, 0, 1
          drive: 0.35,
          reverbSend: 0.25,
          delaySend: 0.1,
          chorusSend: 0.25
        },
        pads: {
          volume: 0.8,
          muted: false,
          solo: false,
          style: 'ambient_swell', // 'ambient_swell', 'infinite_drone', 'rhythmic_stabs', 'arpeggiated_chord'
          voicing: 'wide_cinematic', // 'wide_cinematic', 'warm_triads', 'shimmer_extensions', 'suspended_space'
          brightness: 2600,
          drive: 0.15,
          reverbSend: 0.8,
          delaySend: 0.4,
          chorusSend: 0.6
        },
        lead: {
          volume: 0.75,
          muted: false,
          solo: false,
          style: 'slow_glide', // 'celestial_chimes', 'driving_arpeggio', 'call_and_response', 'slow_glide', 'pentatonic_solo'
          waveform: 'sawtooth', // 'triangle', 'sawtooth', 'square', 'sine'
          density: 0.9,
          octave: 0, // -1, 0, 1
          drive: 0.2,
          reverbSend: 0.7,
          delaySend: 0.65,
          chorusSend: 0.5
        }
      }
    };

    this.presets = {
      'Blade Runner 2049': {
        visual: {
          construct: 'blade_runner',
          engine: 'construct',
          speed: 0.95,
          density: 1.2,
          paletteShift: 0,
          paletteName: 'cyberpunk',
          chaos: 1.0,
          bloom: 0.8
        },
        audio: {
          bpm: 70,
          melodyScale: 'aeolian_cinematic',
          autoEvolve: true,
          reverbMix: 0.78,
          delayMix: 0.55,
          tracks: {
            drums: { volume: 0.8, muted: false, solo: false, style: 'halftime_cinematic', density: 0.85, punchy: true, drive: 0.25, reverbSend: 0.55 },
            bass: { volume: 0.88, muted: false, solo: false, style: 'cinematic_drone', tone: 340, resonance: 4.0, octave: -1, drive: 0.35 },
            pads: { volume: 0.85, muted: false, solo: false, style: 'ambient_swell', voicing: 'wide_cinematic', brightness: 2600, reverbSend: 0.85, chorusSend: 0.65 },
            lead: { volume: 0.78, muted: false, solo: false, style: 'slow_glide', waveform: 'sawtooth', density: 0.9, delaySend: 0.65, reverbSend: 0.75 }
          }
        }
      },
      'Spirited Ghibli Meadow': {
        visual: {
          construct: 'studio_ghibli',
          engine: 'construct',
          speed: 0.85,
          density: 1.15,
          paletteShift: 0,
          paletteName: 'monet',
          chaos: 0.75,
          bloom: 0.65
        },
        audio: {
          bpm: 88,
          melodyScale: 'lydian_cosmic',
          autoEvolve: true,
          reverbMix: 0.65,
          delayMix: 0.42,
          tracks: {
            drums: { volume: 0.65, muted: false, solo: false, style: 'ambient_pulse', density: 0.9, punchy: false, drive: 0.05 },
            bass: { volume: 0.75, muted: false, solo: false, style: 'syncopated_pulse', tone: 440, resonance: 2.0, octave: 0 },
            pads: { volume: 0.85, muted: false, solo: false, style: 'arpeggiated_chord', voicing: 'shimmer_extensions', brightness: 3100, reverbSend: 0.7 },
            lead: { volume: 0.8, muted: false, solo: false, style: 'celestial_chimes', waveform: 'triangle', density: 1.15, delaySend: 0.5 }
          }
        }
      },
      'Steamboat 1928': {
        visual: {
          construct: 'vintage_cartoon',
          engine: 'construct',
          speed: 1.25,
          density: 1.1,
          paletteShift: 0,
          paletteName: 'cosmic',
          chaos: 0.9,
          bloom: 0.45
        },
        audio: {
          bpm: 122,
          melodyScale: 'pentatonic_ethereal',
          autoEvolve: false,
          reverbMix: 0.22,
          delayMix: 0.18,
          tracks: {
            drums: { volume: 0.85, muted: false, solo: false, style: 'breakbeat_cyber', density: 1.25, punchy: true, drive: 0.3 },
            bass: { volume: 0.85, muted: false, solo: false, style: 'octave_bounce', tone: 720, resonance: 3.5, octave: 1, drive: 0.25 },
            pads: { volume: 0.7, muted: false, solo: false, style: 'rhythmic_stabs', voicing: 'warm_triads', brightness: 2800 },
            lead: { volume: 0.85, muted: false, solo: false, style: 'call_and_response', waveform: 'square', density: 1.35, delaySend: 0.25 }
          }
        }
      },
      'Dune: Arrakis Spice': {
        visual: {
          construct: 'dune_arrakis',
          engine: 'construct',
          speed: 0.8,
          density: 1.25,
          paletteShift: 0,
          paletteName: 'cathedral',
          chaos: 1.15,
          bloom: 0.8
        },
        audio: {
          bpm: 64,
          melodyScale: 'mystic_insen',
          autoEvolve: true,
          reverbMix: 0.85,
          delayMix: 0.5,
          tracks: {
            drums: { volume: 0.9, muted: false, solo: false, style: 'halftime_cinematic', density: 1.1, punchy: true, drive: 0.55, reverbSend: 0.6 },
            bass: { volume: 0.92, muted: false, solo: false, style: 'cinematic_drone', tone: 280, resonance: 5.0, octave: -1, drive: 0.6 },
            pads: { volume: 0.85, muted: false, solo: false, style: 'infinite_drone', voicing: 'suspended_space', brightness: 1600, reverbSend: 0.85 },
            lead: { volume: 0.7, muted: false, solo: false, style: 'slow_glide', waveform: 'triangle', density: 0.75, delaySend: 0.65, reverbSend: 0.7 }
          }
        }
      },
      'Neon Outrun': {
        visual: {
          construct: 'cosmic_default',
          engine: 'synthwave',
          speed: 1.3,
          density: 1.25,
          paletteShift: 0,
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
      'Monet Sunrise': {
        visual: {
          construct: 'studio_ghibli',
          engine: 'impressionist',
          speed: 0.75,
          density: 1.25,
          paletteShift: 0,
          paletteName: 'monet',
          chaos: 0.7,
          bloom: 0.6
        },
        audio: {
          bpm: 72,
          melodyScale: 'pentatonic_ethereal',
          autoEvolve: true,
          reverbMix: 0.75,
          delayMix: 0.5,
          tracks: {
            drums: { volume: 0.4, muted: false, solo: false, style: 'minimal_heartbeat' },
            bass: { volume: 0.8, muted: false, solo: false, style: 'cinematic_drone', tone: 320, octave: -1 },
            pads: { volume: 0.9, muted: false, solo: false, style: 'infinite_drone', voicing: 'wide_cinematic', brightness: 1800 },
            lead: { volume: 0.7, muted: false, solo: false, style: 'celestial_chimes', density: 0.8, delaySend: 0.6 }
          }
        }
      },
      'Cathedral Light': {
        visual: {
          construct: 'dune_arrakis',
          engine: 'stained_glass',
          speed: 0.75,
          density: 1.15,
          paletteShift: 0,
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
          construct: 'blade_runner',
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
      blade_runner: {
        bpm: 70,
        scale: 'aeolian_cinematic',
        master: { filterType: 'neutral', filterCutoff: 14000, filterResonance: 1.6, tapeWarmth: 0.45, reverbReturn: 0.78, delayReturn: 0.55, delayFeedback: 0.54, chorusReturn: 0.55 },
        drums: { style: 'halftime_cinematic', density: 0.85, punchy: true, drive: 0.25, reverbSend: 0.55, delaySend: 0.2, chorusSend: 0.0, muted: false },
        bass: { style: 'cinematic_drone', tone: 340, resonance: 4.0, octave: -1, drive: 0.35, reverbSend: 0.25, delaySend: 0.1, chorusSend: 0.25 },
        pads: { style: 'ambient_swell', voicing: 'wide_cinematic', brightness: 2600, drive: 0.15, reverbSend: 0.85, delaySend: 0.45, chorusSend: 0.65 },
        lead: { style: 'slow_glide', waveform: 'sawtooth', density: 0.9, drive: 0.2, reverbSend: 0.75, delaySend: 0.65, chorusSend: 0.55 }
      },
      studio_ghibli: {
        bpm: 88,
        scale: 'lydian_cosmic',
        master: { filterType: 'neutral', filterCutoff: 19000, filterResonance: 1.0, tapeWarmth: 0.18, reverbReturn: 0.65, delayReturn: 0.42, delayFeedback: 0.4, chorusReturn: 0.45 },
        drums: { style: 'ambient_pulse', density: 0.9, punchy: false, drive: 0.05, reverbSend: 0.3, delaySend: 0.15, chorusSend: 0.0, muted: false },
        bass: { style: 'syncopated_pulse', tone: 440, resonance: 2.0, octave: 0, drive: 0.05, reverbSend: 0.2, delaySend: 0.1, chorusSend: 0.15 },
        pads: { style: 'arpeggiated_chord', voicing: 'shimmer_extensions', brightness: 3100, drive: 0.0, reverbSend: 0.7, delaySend: 0.35, chorusSend: 0.5 },
        lead: { style: 'celestial_chimes', waveform: 'triangle', density: 1.15, drive: 0.0, reverbSend: 0.55, delaySend: 0.5, chorusSend: 0.35 }
      },
      vintage_cartoon: {
        bpm: 122,
        scale: 'pentatonic_ethereal',
        master: { filterType: 'highpass', filterCutoff: 220, filterResonance: 1.3, tapeWarmth: 0.55, reverbReturn: 0.22, delayReturn: 0.18, delayFeedback: 0.22, chorusReturn: 0.15 },
        drums: { style: 'breakbeat_cyber', density: 1.25, punchy: true, drive: 0.3, reverbSend: 0.1, delaySend: 0.05, chorusSend: 0.0, muted: false },
        bass: { style: 'octave_bounce', tone: 720, resonance: 3.5, octave: 1, drive: 0.25, reverbSend: 0.05, delaySend: 0.05, chorusSend: 0.0 },
        pads: { style: 'rhythmic_stabs', voicing: 'warm_triads', brightness: 2800, drive: 0.15, reverbSend: 0.2, delaySend: 0.1, chorusSend: 0.2 },
        lead: { style: 'call_and_response', waveform: 'square', density: 1.35, drive: 0.2, reverbSend: 0.15, delaySend: 0.25, chorusSend: 0.15 }
      },
      dune_arrakis: {
        bpm: 64,
        scale: 'mystic_insen',
        master: { filterType: 'lowpass', filterCutoff: 5800, filterResonance: 2.2, tapeWarmth: 0.65, reverbReturn: 0.85, delayReturn: 0.5, delayFeedback: 0.58, chorusReturn: 0.35 },
        drums: { style: 'halftime_cinematic', density: 1.1, punchy: true, drive: 0.55, reverbSend: 0.6, delaySend: 0.25, chorusSend: 0.0, muted: false },
        bass: { style: 'cinematic_drone', tone: 280, resonance: 5.0, octave: -1, drive: 0.6, reverbSend: 0.35, delaySend: 0.15, chorusSend: 0.2 },
        pads: { style: 'infinite_drone', voicing: 'suspended_space', brightness: 1600, drive: 0.25, reverbSend: 0.85, delaySend: 0.4, chorusSend: 0.4 },
        lead: { style: 'slow_glide', waveform: 'triangle', density: 0.75, drive: 0.3, reverbSend: 0.7, delaySend: 0.65, chorusSend: 0.25 }
      },
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

    if (mood.master && this.audio.effects?.master) {
      Object.assign(this.audio.effects.master, mood.master);
      if (mood.master.reverbReturn !== undefined) this.audio.reverbMix = mood.master.reverbReturn;
      if (mood.master.delayReturn !== undefined) this.audio.delayMix = mood.master.delayReturn;
      this.emit('change:effects:master', { masterEffects: this.audio.effects.master });
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

  setConstruct(constructName) {
    const valid = ['blade_runner', 'studio_ghibli', 'vintage_cartoon', 'dune_arrakis', 'cosmic_default'];
    if (!valid.includes(constructName)) return;

    this.visual.construct = constructName;
    this.visual.paletteShift = 0;
    this.emit('change:construct', constructName);
    this.emit('change:visual', { path: 'construct', value: constructName, visual: this.visual });

    if (this.visual.syncAudioToConstruct) {
      const moodMap = {
        blade_runner: 'blade_runner',
        studio_ghibli: 'studio_ghibli',
        vintage_cartoon: 'vintage_cartoon',
        dune_arrakis: 'dune_arrakis',
        cosmic_default: 'cosmic_ambient'
      };
      this.applyMood(moodMap[constructName] || 'cosmic_ambient');
    }
  }

  setEngine(engineName) {
    if (['construct', 'ascii', 'impressionist', 'stained_glass', 'synthwave'].includes(engineName)) {
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
    if (newState.visual?.construct) {
      this.emit('change:construct', this.visual.construct);
    }
    if (newState.visual?.engine) {
      this.emit('change:engine', this.visual.engine);
    }
  }

  randomize() {
    const constructs = ['blade_runner', 'studio_ghibli', 'vintage_cartoon', 'dune_arrakis', 'cosmic_default'];
    const randomConstruct = constructs[Math.floor(Math.random() * constructs.length)];
    this.visual.construct = randomConstruct;

    const moods = ['blade_runner', 'studio_ghibli', 'vintage_cartoon', 'dune_arrakis', 'cosmic_ambient', 'driving_outrun', 'cinematic_tension', 'zen_meditation', 'glitch_cyber'];
    const randomMood = this.visual.syncAudioToConstruct
      ? (randomConstruct === 'cosmic_default' ? 'cosmic_ambient' : randomConstruct)
      : moods[Math.floor(Math.random() * moods.length)];
    this.applyMood(randomMood);

    const engines = ['construct', 'ascii', 'impressionist', 'stained_glass', 'synthwave'];
    const palettes = ['cyberpunk', 'cosmic', 'monet', 'cathedral', 'matrix'];
    this.visual.engine = engines[Math.floor(Math.random() * engines.length)];
    this.visual.speed = +(0.65 + Math.random() * 1.1).toFixed(2);
    this.visual.density = +(0.8 + Math.random() * 0.7).toFixed(2);
    this.visual.paletteShift = Math.random() < 0.5 ? 0 : Math.floor(Math.random() * 360);
    this.visual.paletteName = palettes[Math.floor(Math.random() * palettes.length)];
    this.visual.chaos = +(0.6 + Math.random() * 1.0).toFixed(2);
    this.visual.bloom = +(0.4 + Math.random() * 0.5).toFixed(2);

    this.emit('change:construct', this.visual.construct);
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
