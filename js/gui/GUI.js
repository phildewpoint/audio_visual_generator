/**
 * Real-Time Floating Customization GUI & Multi-Part Audio Workstation
 */
export class GUI {
  constructor(state, audioEngine) {
    this.state = state;
    this.audio = audioEngine;
    this.container = document.getElementById('floating-gui');
    this.scopeCanvas = document.getElementById('mini-scope-canvas');
    this.scopeCtx = this.scopeCanvas ? this.scopeCanvas.getContext('2d') : null;
    this.fpsCounter = document.getElementById('live-fps-val');
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();

    // Cache LED elements for zero-GC render loop
    this.trackLeds = {
      drums: document.getElementById('led-drums'),
      bass: document.getElementById('led-bass'),
      pads: document.getElementById('led-pads'),
      lead: document.getElementById('led-lead')
    };

    this.stepDots = document.querySelectorAll('.step-dot');
    this.inspectorBadge = document.getElementById('inspector-active-badge');

    this._initElements();
    this._bindEvents();
    this._syncFromState();
  }

  _initElements() {
    // Construct & Engine buttons
    this.constructBtns = document.querySelectorAll('.construct-btn');
    this.syncConstructAudioToggle = document.getElementById('toggle-sync-construct-audio');
    this.engineBtns = document.querySelectorAll('.engine-btn');

    // Visual sliders
    this.speedSlider = document.getElementById('slider-speed');
    this.densitySlider = document.getElementById('slider-density');
    this.paletteSlider = document.getElementById('slider-palette');
    this.chaosSlider = document.getElementById('slider-chaos');
    this.crtToggle = document.getElementById('toggle-crt');

    // Audio Master & Global
    this.audioToggleBtn = document.getElementById('btn-audio-toggle');
    this.bpmSlider = document.getElementById('slider-bpm');
    this.scaleSelect = document.getElementById('select-scale');
    this.autoEvolveToggle = document.getElementById('toggle-auto-evolve');
    this.reverbSlider = document.getElementById('slider-reverb');
    this.delaySlider = document.getElementById('slider-delay');
    this.volumeSlider = document.getElementById('slider-volume');

    // Generative Journey & Evolution Tracker
    this.journeyCurrentBadge = document.getElementById('journey-current-badge');
    this.journeyNextIndicator = document.getElementById('journey-next-indicator');
    this.journeyPhaseBadge = document.getElementById('journey-phase-badge');
    this.journeyProgressText = document.getElementById('journey-progress-text');
    this.journeyCountdownText = document.getElementById('journey-countdown-text');
    this.journeyProgressBar = document.getElementById('journey-progress-bar');
    this.evolveDurationSelect = document.getElementById('select-evolve-duration');

    // Channel Strip Controls
    this.muteBtns = document.querySelectorAll('.btn-mute');
    this.soloBtns = document.querySelectorAll('.btn-solo');
    this.mutateBtns = document.querySelectorAll('.btn-mutate');
    this.stripSliders = document.querySelectorAll('.strip-slider');

    // Mood Badges & Inspector Tabs
    this.moodBadges = document.querySelectorAll('.mood-badge');
    this.tabBtns = document.querySelectorAll('.tab-btn');
    this.inspectorPanes = document.querySelectorAll('.inspector-pane');

    // Inspector - Drums
    this.drumsStyle = document.getElementById('select-drums-style');
    this.drumsDensity = document.getElementById('slider-drums-density');
    this.drumsPunchy = document.getElementById('check-drums-punchy');
    this.drumsDrive = document.getElementById('slider-drums-drive');
    this.drumsReverb = document.getElementById('slider-drums-reverb');
    this.drumsChorus = document.getElementById('slider-drums-chorus');

    // Inspector - Bass
    this.bassStyle = document.getElementById('select-bass-style');
    this.bassOctave = document.getElementById('select-bass-octave');
    this.bassTone = document.getElementById('slider-bass-tone');
    this.bassRes = document.getElementById('slider-bass-res');
    this.bassDrive = document.getElementById('slider-bass-drive');
    this.bassChorus = document.getElementById('slider-bass-chorus');

    // Inspector - Pads
    this.padsStyle = document.getElementById('select-pads-style');
    this.padsVoicing = document.getElementById('select-pads-voicing');
    this.padsBright = document.getElementById('slider-pads-bright');
    this.padsDrive = document.getElementById('slider-pads-drive');
    this.padsReverb = document.getElementById('slider-pads-reverb');
    this.padsDelay = document.getElementById('slider-pads-delay');
    this.padsChorus = document.getElementById('slider-pads-chorus');

    // Inspector - Lead
    this.leadStyle = document.getElementById('select-lead-style');
    this.leadWaveform = document.getElementById('select-lead-waveform');
    this.leadDensity = document.getElementById('slider-lead-density');
    this.leadDrive = document.getElementById('slider-lead-drive');
    this.leadDelay = document.getElementById('slider-lead-delay');
    this.leadReverb = document.getElementById('slider-lead-reverb');
    this.leadChorus = document.getElementById('slider-lead-chorus');

    // Master FX Rack Controls
    this.autoEvolveFXCheck = document.getElementById('check-auto-evolve-fx');
    this.masterFilterType = document.getElementById('select-master-filter-type');
    this.masterFilterCutoff = document.getElementById('slider-master-filter-cutoff');
    this.masterFilterRes = document.getElementById('slider-master-filter-res');
    this.masterTape = document.getElementById('slider-master-tape');
    this.masterReverbReturn = document.getElementById('slider-master-reverb-return');
    this.masterDelayReturn = document.getElementById('slider-master-delay-return');
    this.masterDelayFeedback = document.getElementById('slider-master-delay-feedback');
    this.masterChorusReturn = document.getElementById('slider-master-chorus-return');

    // Preset & Actions
    this.presetSelect = document.getElementById('select-preset');
    this.randomBtn = document.getElementById('btn-randomize');
    this.exportBtn = document.getElementById('btn-export-json');
    this.importBtn = document.getElementById('btn-import-json');
    this.collapseBtn = document.getElementById('btn-collapse-gui');
    this.fullscreenBtn = document.getElementById('btn-fullscreen');
  }

  _bindEvents() {
    // 1. World Construct Switcher & Style Switcher
    this.constructBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const construct = btn.dataset.construct;
        this.state.setConstruct(construct);
        this.showToast(`World Construct: ${btn.textContent.trim()}`);
      });
    });

    this.syncConstructAudioToggle?.addEventListener('change', (e) => {
      this.state.setVisual('syncAudioToConstruct', e.target.checked);
      this.showToast(`Sync Audio to World: ${e.target.checked ? 'ON' : 'OFF'}`);
    });

    this.engineBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const engine = btn.dataset.engine;
        this.state.setEngine(engine);
      });
    });

    // 2. Visual Dynamics
    this.speedSlider?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-speed', val.toFixed(2) + 'x');
      this.state.setVisual('speed', val);
    });

    this.densitySlider?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-density', val.toFixed(2) + 'x');
      this.state.setVisual('density', val);
    });

    this.paletteSlider?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this._updateValLabel('val-palette', val + '°');
      this.state.setVisual('paletteShift', val);
    });

    this.chaosSlider?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-chaos', val.toFixed(2));
      this.state.setVisual('chaos', val);
    });

    this.crtToggle?.addEventListener('change', (e) => {
      const checked = e.target.checked;
      const overlay = document.querySelector('.crt-overlay');
      if (overlay) {
        if (checked) overlay.classList.remove('hidden');
        else overlay.classList.add('hidden');
      }
      this.state.setVisual('ascii.crtEffect', checked);
      this.state.setVisual('synthwave.crtScanlines', checked);
    });

    // 3. Audio Master Controls
    this.audioToggleBtn?.addEventListener('click', () => {
      this.audio.toggle();
      this._updateAudioBtnState();
    });

    this.bpmSlider?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this._updateValLabel('val-bpm', val + ' BPM');
      this.state.setAudio('bpm', val);
    });

    this.scaleSelect?.addEventListener('change', (e) => {
      this.state.setAudio('melodyScale', e.target.value);
      this.showToast(`Scale: ${this.scaleSelect.options[this.scaleSelect.selectedIndex].text}`);
    });

    this.autoEvolveToggle?.addEventListener('change', (e) => {
      this.state.setAudio('autoEvolve', e.target.checked);
      this.showToast(`Auto-Evolve: ${e.target.checked ? 'Enabled' : 'Disabled'}`);
    });

    this.reverbSlider?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-reverb', Math.round(val * 100) + '%');
      this.state.setAudio('reverbMix', val);
    });

    this.delaySlider?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-delay', Math.round(val * 100) + '%');
      this.state.setAudio('delayMix', val);
    });

    this.volumeSlider?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-volume', Math.round(val * 100) + '%');
      this.state.setAudio('masterVolume', val);
    });

    // 4. Mixer Channel Strips: Mute, Solo, Volume & Mutate
    this.muteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const track = btn.dataset.track;
        const isMuted = this.state.toggleTrackMute(track);
        btn.classList.toggle('active', isMuted);
        const strip = document.getElementById(`strip-${track}`);
        if (strip) strip.classList.toggle('muted', isMuted);
      });
    });

    this.soloBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const track = btn.dataset.track;
        const isSolo = this.state.toggleTrackSolo(track);
        btn.classList.toggle('active', isSolo);
        const strip = document.getElementById(`strip-${track}`);
        if (strip) strip.classList.toggle('soloed', isSolo);
        this._syncSoloMuteVisuals();
      });
    });

    this.stripSliders.forEach(slider => {
      slider.addEventListener('input', (e) => {
        const track = e.target.id.replace('vol-', '');
        const val = parseFloat(e.target.value);
        this._updateValLabel(`val-vol-${track}`, Math.round(val * 100) + '%');
        this.state.setTrackVolume(track, val);
      });
    });

    this.mutateBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const track = btn.dataset.track;
        this.state.mutateTrack(track);
        this.showToast(`Mutated ${track.toUpperCase()} pattern!`);

        // Flash button effect
        btn.style.transform = 'scale(0.92)';
        setTimeout(() => { btn.style.transform = ''; }, 120);
      });
    });

    // 5. Mood Macro Badges
    this.moodBadges.forEach(badge => {
      badge.addEventListener('click', () => {
        const mood = badge.dataset.mood;
        this.state.applyMood(mood);
        this.moodBadges.forEach(b => b.classList.toggle('active', b === badge));
        this.showToast(`Applied Mood: ${badge.textContent.trim()}`);
      });
    });

    // 6. Inspector Tabs
    this.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.tabBtns.forEach(b => b.classList.toggle('active', b === btn));
        this.inspectorPanes.forEach(p => p.classList.toggle('active', p.id === `pane-${tab}`));
        if (this.inspectorBadge) this.inspectorBadge.textContent = tab.toUpperCase();
      });
    });

    // Evolution Cycle Duration
    this.evolveDurationSelect?.addEventListener('change', (e) => {
      const bars = parseInt(e.target.value, 10);
      this.state.setEvolveConfig('barsPerConcept', bars);
      this.showToast(`Evolution Cycle: ${bars} Bars`);
    });

    // 7. Inspector Controls - Drums
    this.drumsStyle?.addEventListener('change', (e) => {
      this.state.setTrackProperty('drums', 'style', e.target.value);
      this.showToast(`Drums Style: ${e.target.options[e.target.selectedIndex].text}`);
    });
    this.drumsDensity?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-drums-density', val.toFixed(1) + 'x');
      this.state.setTrackProperty('drums', 'density', val);
    });
    this.drumsPunchy?.addEventListener('change', (e) => {
      this.state.setTrackProperty('drums', 'punchy', e.target.checked);
      this.showToast(`Drums Punch: ${e.target.checked ? 'Enabled' : 'Disabled'}`);
    });
    this.drumsDrive?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-drums-drive', Math.round(val * 100) + '%');
      this.state.setTrackEffect('drums', 'drive', val);
    });
    this.drumsReverb?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-drums-reverb', Math.round(val * 100) + '%');
      this.state.setTrackProperty('drums', 'reverbSend', val);
    });
    this.drumsChorus?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-drums-chorus', Math.round(val * 100) + '%');
      this.state.setTrackEffect('drums', 'chorusSend', val);
    });

    // 8. Inspector Controls - Bass
    this.bassStyle?.addEventListener('change', (e) => {
      this.state.setTrackProperty('bass', 'style', e.target.value);
      this.showToast(`Bass Groove: ${e.target.options[e.target.selectedIndex].text}`);
    });
    this.bassOctave?.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10);
      this.state.setTrackProperty('bass', 'octave', val);
    });
    this.bassTone?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this._updateValLabel('val-bass-tone', val + ' Hz');
      this.state.setTrackProperty('bass', 'tone', val);
    });
    this.bassRes?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-bass-res', val.toFixed(1));
      this.state.setTrackProperty('bass', 'resonance', val);
    });
    this.bassDrive?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-bass-drive', Math.round(val * 100) + '%');
      this.state.setTrackEffect('bass', 'drive', val);
    });
    this.bassChorus?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-bass-chorus', Math.round(val * 100) + '%');
      this.state.setTrackEffect('bass', 'chorusSend', val);
    });

    // 9. Inspector Controls - Pads
    this.padsStyle?.addEventListener('change', (e) => {
      this.state.setTrackProperty('pads', 'style', e.target.value);
      this.showToast(`Pads Style: ${e.target.options[e.target.selectedIndex].text}`);
    });
    this.padsVoicing?.addEventListener('change', (e) => {
      this.state.setTrackProperty('pads', 'voicing', e.target.value);
      this.showToast(`Pads Voicing: ${e.target.options[e.target.selectedIndex].text}`);
    });
    this.padsBright?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this._updateValLabel('val-pads-bright', val + ' Hz');
      this.state.setTrackProperty('pads', 'brightness', val);
    });
    this.padsDrive?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-pads-drive', Math.round(val * 100) + '%');
      this.state.setTrackEffect('pads', 'drive', val);
    });
    this.padsReverb?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-pads-reverb', Math.round(val * 100) + '%');
      this.state.setTrackProperty('pads', 'reverbSend', val);
    });
    this.padsDelay?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-pads-delay', Math.round(val * 100) + '%');
      this.state.setTrackEffect('pads', 'delaySend', val);
    });
    this.padsChorus?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-pads-chorus', Math.round(val * 100) + '%');
      this.state.setTrackEffect('pads', 'chorusSend', val);
    });

    // 10. Inspector Controls - Lead
    this.leadStyle?.addEventListener('change', (e) => {
      this.state.setTrackProperty('lead', 'style', e.target.value);
      this.showToast(`Lead Phrasing: ${e.target.options[e.target.selectedIndex].text}`);
    });
    this.leadWaveform?.addEventListener('change', (e) => {
      this.state.setTrackProperty('lead', 'waveform', e.target.value);
      this.showToast(`Lead Wave: ${e.target.value}`);
    });
    this.leadDensity?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-lead-density', val.toFixed(1) + 'x');
      this.state.setTrackProperty('lead', 'density', val);
    });
    this.leadDrive?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-lead-drive', Math.round(val * 100) + '%');
      this.state.setTrackEffect('lead', 'drive', val);
    });
    this.leadDelay?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-lead-delay', Math.round(val * 100) + '%');
      this.state.setTrackProperty('lead', 'delaySend', val);
    });
    this.leadReverb?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-lead-reverb', Math.round(val * 100) + '%');
      this.state.setTrackEffect('lead', 'reverbSend', val);
    });
    this.leadChorus?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-lead-chorus', Math.round(val * 100) + '%');
      this.state.setTrackEffect('lead', 'chorusSend', val);
    });

    // 11. Master FX Rack Controls
    this.autoEvolveFXCheck?.addEventListener('change', (e) => {
      this.state.setMasterEffect('autoEvolveFX', e.target.checked);
      this.state.setEvolveConfig('autoEvolveFX', e.target.checked);
      this.showToast(`Auto-Evolve FX: ${e.target.checked ? 'Enabled' : 'Bypassed'}`);
    });

    this.masterFilterType?.addEventListener('change', (e) => {
      this.state.setMasterEffect('filterType', e.target.value);
      this.showToast(`Master Filter: ${e.target.options[e.target.selectedIndex].text}`);
    });

    this.masterFilterCutoff?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this._updateValLabel('val-master-filter-cutoff', val >= 1000 ? (val / 1000).toFixed(1) + ' kHz' : val + ' Hz');
      this.state.setMasterEffect('filterCutoff', val);
    });

    this.masterFilterRes?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-master-filter-res', val.toFixed(1));
      this.state.setMasterEffect('filterResonance', val);
    });

    this.masterTape?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-master-tape', Math.round(val * 100) + '%');
      this.state.setMasterEffect('tapeWarmth', val);
    });

    this.masterReverbReturn?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-master-reverb-return', Math.round(val * 100) + '%');
      this.state.setMasterEffect('reverbReturn', val);
    });

    this.masterDelayReturn?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-master-delay-return', Math.round(val * 100) + '%');
      this.state.setMasterEffect('delayReturn', val);
    });

    this.masterDelayFeedback?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-master-delay-feedback', Math.round(val * 100) + '%');
      this.state.setMasterEffect('delayFeedback', val);
    });

    this.masterChorusReturn?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this._updateValLabel('val-master-chorus-return', Math.round(val * 100) + '%');
      this.state.setMasterEffect('chorusReturn', val);
    });

    // 11. Presets & Actions
    this.presetSelect?.addEventListener('change', (e) => {
      const name = e.target.value;
      if (name) {
        this.state.loadPreset(name);
        this.showToast(`Loaded Preset: ${name}`);
      }
    });

    this.randomBtn?.addEventListener('click', () => {
      this.state.randomize();
      this.showToast('Randomized Visuals & Music!');
    });

    this.exportBtn?.addEventListener('click', () => {
      const json = this.state.exportJSON();
      navigator.clipboard?.writeText(json).then(() => {
        this.showToast('Preset JSON copied to clipboard!');
      }).catch(() => {
        prompt('Copy your JSON preset:', json);
      });
    });

    this.importBtn?.addEventListener('click', () => {
      const input = prompt('Paste your Preset JSON configuration:');
      if (input) {
        const success = this.state.importJSON(input);
        if (success) {
          this.showToast('Preset imported successfully!');
        } else {
          alert('Failed to parse JSON preset.');
        }
      }
    });

    this.collapseBtn?.addEventListener('click', () => {
      this.container.classList.toggle('collapsed');
      const icon = this.collapseBtn.querySelector('span');
      if (icon) {
        icon.textContent = this.container.classList.contains('collapsed') ? '◧' : '◨';
      }
    });

    this.fullscreenBtn?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // 12. State change subscriptions
    this.state.on('change:construct', (construct) => {
      this.constructBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.construct === construct);
      });
    });

    this.state.on('change:engine', (engine) => {
      this.engineBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.engine === engine);
      });
    });

    this.state.on('change:track', () => {
      this._syncInspectorFromState();
    });

    this.state.on('change:effects:master', () => {
      this._syncMasterFXFromState();
    });

    this.state.on('change:evolveConfig', () => {
      this._syncEvolveConfigFromState();
    });

    this.state.on('mood:applied', (moodName) => {
      this.moodBadges.forEach(b => b.classList.toggle('active', b.dataset.mood === moodName));
      this._syncFromState();
    });

    this.state.on('preset:loaded', () => this._syncFromState());
    this.state.on('preset:randomized', () => this._syncFromState());
  }

  _syncSoloMuteVisuals() {
    const tracks = this.state.audio.tracks;
    const anySolo = Object.values(tracks).some(t => t.solo);

    Object.keys(tracks).forEach(name => {
      const trackState = tracks[name];
      const strip = document.getElementById(`strip-${name}`);
      if (!strip) return;

      const muteBtn = strip.querySelector('.btn-mute');
      const soloBtn = strip.querySelector('.btn-solo');

      if (muteBtn) muteBtn.classList.toggle('active', !!trackState.muted);
      if (soloBtn) soloBtn.classList.toggle('active', !!trackState.solo);

      strip.classList.toggle('soloed', !!trackState.solo);
      // Dim strip if another track is soloed and this one isn't
      strip.classList.toggle('muted', (anySolo && !trackState.solo) || !!trackState.muted);
    });
  }

  _updateValLabel(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  _syncFromState() {
    const v = this.state.visual;
    const a = this.state.audio;

    // Active Construct & Engine
    this.constructBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.construct === (v.construct || 'blade_runner'));
    });
    if (this.syncConstructAudioToggle && v.syncAudioToConstruct !== undefined) {
      this.syncConstructAudioToggle.checked = !!v.syncAudioToConstruct;
    }

    this.engineBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.engine === v.engine);
    });

    // Visual sliders
    if (this.speedSlider) {
      this.speedSlider.value = v.speed;
      this._updateValLabel('val-speed', v.speed.toFixed(2) + 'x');
    }
    if (this.densitySlider) {
      this.densitySlider.value = v.density;
      this._updateValLabel('val-density', v.density.toFixed(2) + 'x');
    }
    if (this.paletteSlider) {
      this.paletteSlider.value = v.paletteShift;
      this._updateValLabel('val-palette', v.paletteShift + '°');
    }
    if (this.chaosSlider) {
      this.chaosSlider.value = v.chaos;
      this._updateValLabel('val-chaos', v.chaos.toFixed(2));
    }

    // Audio Master & Global
    if (this.bpmSlider) {
      this.bpmSlider.value = a.bpm;
      this._updateValLabel('val-bpm', a.bpm + ' BPM');
    }
    if (this.scaleSelect) this.scaleSelect.value = a.melodyScale;
    if (this.autoEvolveToggle) this.autoEvolveToggle.checked = !!a.autoEvolve;

    if (this.reverbSlider) {
      this.reverbSlider.value = a.reverbMix;
      this._updateValLabel('val-reverb', Math.round(a.reverbMix * 100) + '%');
    }
    if (this.delaySlider) {
      this.delaySlider.value = a.delayMix;
      this._updateValLabel('val-delay', Math.round(a.delayMix * 100) + '%');
    }
    if (this.volumeSlider) {
      this.volumeSlider.value = a.masterVolume;
      this._updateValLabel('val-volume', Math.round(a.masterVolume * 100) + '%');
    }

    // Channel Strips
    if (a.tracks) {
      Object.keys(a.tracks).forEach(name => {
        const trk = a.tracks[name];
        const slider = document.getElementById(`vol-${name}`);
        if (slider) {
          slider.value = trk.volume;
          this._updateValLabel(`val-vol-${name}`, Math.round(trk.volume * 100) + '%');
        }
      });
      this._syncSoloMuteVisuals();
    }

    this._syncInspectorFromState();
    this._syncMasterFXFromState();
    this._syncEvolveConfigFromState();
    this._updateAudioBtnState();
  }

  _syncMasterFXFromState() {
    const fx = this.state.audio.effects?.master || {};
    if (this.autoEvolveFXCheck && fx.autoEvolveFX !== undefined) {
      this.autoEvolveFXCheck.checked = !!fx.autoEvolveFX;
    }
    if (this.masterFilterType && fx.filterType) {
      this.masterFilterType.value = fx.filterType;
    }
    if (this.masterFilterCutoff && fx.filterCutoff !== undefined) {
      this.masterFilterCutoff.value = fx.filterCutoff;
      const v = fx.filterCutoff;
      this._updateValLabel('val-master-filter-cutoff', v >= 1000 ? (v / 1000).toFixed(1) + ' kHz' : v + ' Hz');
    }
    if (this.masterFilterRes && fx.filterResonance !== undefined) {
      this.masterFilterRes.value = fx.filterResonance;
      this._updateValLabel('val-master-filter-res', Number(fx.filterResonance).toFixed(1));
    }
    if (this.masterTape && fx.tapeWarmth !== undefined) {
      this.masterTape.value = fx.tapeWarmth;
      this._updateValLabel('val-master-tape', Math.round(fx.tapeWarmth * 100) + '%');
    }
    if (this.masterReverbReturn) {
      const r = fx.reverbReturn !== undefined ? fx.reverbReturn : this.state.audio.reverbMix;
      this.masterReverbReturn.value = r;
      this._updateValLabel('val-master-reverb-return', Math.round(r * 100) + '%');
    }
    if (this.masterDelayReturn) {
      const d = fx.delayReturn !== undefined ? fx.delayReturn : this.state.audio.delayMix;
      this.masterDelayReturn.value = d;
      this._updateValLabel('val-master-delay-return', Math.round(d * 100) + '%');
    }
    if (this.masterDelayFeedback && fx.delayFeedback !== undefined) {
      this.masterDelayFeedback.value = fx.delayFeedback;
      this._updateValLabel('val-master-delay-feedback', Math.round(fx.delayFeedback * 100) + '%');
    }
    if (this.masterChorusReturn && fx.chorusReturn !== undefined) {
      this.masterChorusReturn.value = fx.chorusReturn;
      this._updateValLabel('val-master-chorus-return', Math.round(fx.chorusReturn * 100) + '%');
    }
  }

  _syncEvolveConfigFromState() {
    const cfg = this.state.audio.evolveConfig;
    if (!cfg) return;
    if (this.evolveDurationSelect && cfg.barsPerConcept) {
      this.evolveDurationSelect.value = String(cfg.barsPerConcept);
    }
  }

  _syncInspectorFromState() {
    const trks = this.state.audio.tracks;
    if (!trks) return;

    // Drums
    if (trks.drums) {
      const d = trks.drums;
      if (this.drumsStyle && d.style) this.drumsStyle.value = d.style;
      if (this.drumsDensity && d.density !== undefined) {
        this.drumsDensity.value = d.density;
        this._updateValLabel('val-drums-density', d.density.toFixed(1) + 'x');
      }
      if (this.drumsPunchy) this.drumsPunchy.checked = !!d.punchy;
      if (this.drumsDrive && d.drive !== undefined) {
        this.drumsDrive.value = d.drive;
        this._updateValLabel('val-drums-drive', Math.round(d.drive * 100) + '%');
      }
      if (this.drumsReverb && d.reverbSend !== undefined) {
        this.drumsReverb.value = d.reverbSend;
        this._updateValLabel('val-drums-reverb', Math.round(d.reverbSend * 100) + '%');
      }
      if (this.drumsChorus && d.chorusSend !== undefined) {
        this.drumsChorus.value = d.chorusSend;
        this._updateValLabel('val-drums-chorus', Math.round(d.chorusSend * 100) + '%');
      }
    }

    // Bass
    if (trks.bass) {
      const b = trks.bass;
      if (this.bassStyle && b.style) this.bassStyle.value = b.style;
      if (this.bassOctave && b.octave !== undefined) this.bassOctave.value = String(b.octave);
      if (this.bassTone && b.tone !== undefined) {
        this.bassTone.value = b.tone;
        this._updateValLabel('val-bass-tone', b.tone + ' Hz');
      }
      if (this.bassRes && b.resonance !== undefined) {
        this.bassRes.value = b.resonance;
        this._updateValLabel('val-bass-res', Number(b.resonance).toFixed(1));
      }
      if (this.bassDrive && b.drive !== undefined) {
        this.bassDrive.value = b.drive;
        this._updateValLabel('val-bass-drive', Math.round(b.drive * 100) + '%');
      }
      if (this.bassChorus && b.chorusSend !== undefined) {
        this.bassChorus.value = b.chorusSend;
        this._updateValLabel('val-bass-chorus', Math.round(b.chorusSend * 100) + '%');
      }
    }

    // Pads
    if (trks.pads) {
      const p = trks.pads;
      if (this.padsStyle && p.style) this.padsStyle.value = p.style;
      if (this.padsVoicing && p.voicing) this.padsVoicing.value = p.voicing;
      if (this.padsBright && p.brightness !== undefined) {
        this.padsBright.value = p.brightness;
        this._updateValLabel('val-pads-bright', p.brightness + ' Hz');
      }
      if (this.padsDrive && p.drive !== undefined) {
        this.padsDrive.value = p.drive;
        this._updateValLabel('val-pads-drive', Math.round(p.drive * 100) + '%');
      }
      if (this.padsReverb && p.reverbSend !== undefined) {
        this.padsReverb.value = p.reverbSend;
        this._updateValLabel('val-pads-reverb', Math.round(p.reverbSend * 100) + '%');
      }
      if (this.padsDelay && p.delaySend !== undefined) {
        this.padsDelay.value = p.delaySend;
        this._updateValLabel('val-pads-delay', Math.round(p.delaySend * 100) + '%');
      }
      if (this.padsChorus && p.chorusSend !== undefined) {
        this.padsChorus.value = p.chorusSend;
        this._updateValLabel('val-pads-chorus', Math.round(p.chorusSend * 100) + '%');
      }
    }

    // Lead
    if (trks.lead) {
      const l = trks.lead;
      if (this.leadStyle && l.style) this.leadStyle.value = l.style;
      if (this.leadWaveform && l.waveform) this.leadWaveform.value = l.waveform;
      if (this.leadDensity && l.density !== undefined) {
        this.leadDensity.value = l.density;
        this._updateValLabel('val-lead-density', l.density.toFixed(1) + 'x');
      }
      if (this.leadDrive && l.drive !== undefined) {
        this.leadDrive.value = l.drive;
        this._updateValLabel('val-lead-drive', Math.round(l.drive * 100) + '%');
      }
      if (this.leadDelay && l.delaySend !== undefined) {
        this.leadDelay.value = l.delaySend;
        this._updateValLabel('val-lead-delay', Math.round(l.delaySend * 100) + '%');
      }
      if (this.leadReverb && l.reverbSend !== undefined) {
        this.leadReverb.value = l.reverbSend;
        this._updateValLabel('val-lead-reverb', Math.round(l.reverbSend * 100) + '%');
      }
      if (this.leadChorus && l.chorusSend !== undefined) {
        this.leadChorus.value = l.chorusSend;
        this._updateValLabel('val-lead-chorus', Math.round(l.chorusSend * 100) + '%');
      }
    }
  }

  _updateAudioBtnState() {
    if (!this.audioToggleBtn) return;
    if (this.state.audio.isPlaying) {
      this.audioToggleBtn.textContent = '🔊 Mute Sound';
      this.audioToggleBtn.classList.add('primary');
    } else {
      this.audioToggleBtn.textContent = '🔈 Start Sound';
      this.audioToggleBtn.classList.remove('primary');
    }
  }

  showToast(message) {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-notification';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  /**
   * Render live audio oscilloscope, spectrum analyzer, pulse track LEDs, and Journey Tracker HUD
   */
  renderAudioScope(audioData) {
    // 0. Update Generative Journey Tracker HUD
    if (audioData && audioData.journey) {
      const conceptNames = {
        blade_runner: '🌧️ Blade Runner 2049',
        studio_ghibli: '🍃 Studio Ghibli',
        vintage_cartoon: '🚢 1928 Steamboat',
        dune_arrakis: '🏜️ Dune: Arrakis',
        cosmic_ambient: '🌌 Cosmic Ambient',
        driving_outrun: '🏎️ Driving Outrun',
        glitch_cyber: '⚡ Glitch Cyber',
        cinematic_tension: '🎬 Cinematic Tension',
        zen_meditation: '🧘 Zen Meditation'
      };

      const j = audioData.journey;
      const curName = conceptNames[j.concept] || j.concept;
      const nextName = conceptNames[j.nextConcept] || j.nextConcept;

      if (this.journeyCurrentBadge && this.journeyCurrentBadge.textContent !== curName) {
        this.journeyCurrentBadge.textContent = curName;
      }
      if (this.journeyNextIndicator && this.journeyNextIndicator.textContent !== nextName) {
        this.journeyNextIndicator.textContent = nextName;
      }

      const phase = j.phase || 'groove';
      if (this.journeyPhaseBadge) {
        const phaseClass = 'phase-badge phase-' + phase;
        if (this.journeyPhaseBadge.className !== phaseClass) {
          this.journeyPhaseBadge.className = phaseClass;
          this.journeyPhaseBadge.textContent = phase.toUpperCase().replace('_', ' ');
        }
      }

      const barInConcept = j.barInConcept || 0;
      const barsTotal = j.barsPerConcept || 16;
      const pct = Math.min(100, Math.max(0, (barInConcept / barsTotal) * 100));

      if (this.journeyProgressBar) {
        this.journeyProgressBar.style.width = pct.toFixed(1) + '%';
        this.journeyProgressBar.className = 'journey-progress-bar ' + phase;
      }

      if (this.journeyProgressText) {
        this.journeyProgressText.textContent = `Bar ${barInConcept} / ${barsTotal} (${phase.toUpperCase().replace('_', ' ')})`;
      }

      if (this.journeyCountdownText) {
        const barsRemaining = Math.max(0, barsTotal - barInConcept);
        this.journeyCountdownText.textContent = barsRemaining === 0 ? 'DROP ARRIVED' : `${barsRemaining} bar${barsRemaining === 1 ? '' : 's'} to drop`;
      }

      // Smooth BPM display when interpolating
      if (this.state.audio.isPlaying && audioData.currentBpm && this.bpmSlider) {
        this._updateValLabel('val-bpm', audioData.currentBpm + ' BPM');
      }
    }

    // 1. Update Channel Strip Activity LEDs
    if (audioData) {
      if (this.trackLeds.drums) {
        this.trackLeds.drums.classList.toggle('active', (audioData.drumsActivity || 0) > 0.08);
      }
      if (this.trackLeds.bass) {
        this.trackLeds.bass.classList.toggle('active', (audioData.bassActivity || 0) > 0.12);
      }
      if (this.trackLeds.pads) {
        this.trackLeds.pads.classList.toggle('active', (audioData.padActivity || 0) > 0.1);
      }
      if (this.trackLeds.lead) {
        this.trackLeds.lead.classList.toggle('active', (audioData.leadActivity || 0) > 0.1);
      }
    }

    // 2. 16-Step Sequencer Playhead Tracker
    if (this.stepDots && this.stepDots.length > 0 && audioData && audioData.currentStep !== undefined) {
      const cur = audioData.currentStep;
      for (let i = 0; i < this.stepDots.length; i++) {
        const dot = this.stepDots[i];
        const isCur = (i === cur);
        dot.classList.toggle('active', isCur);
        if (isCur && (i % 4 === 0)) dot.classList.add('downbeat');
        else if (!isCur) dot.classList.remove('downbeat');
      }
    }

    // 3. Oscilloscope & Spectrum
    if (!this.scopeCtx || !this.scopeCanvas) return;
    const ctx = this.scopeCtx;
    const w = this.scopeCanvas.width;
    const h = this.scopeCanvas.height;

    // Fade background
    ctx.fillStyle = 'rgba(10, 8, 20, 0.4)';
    ctx.fillRect(0, 0, w, h);

    if (!audioData || !audioData.waveform || !this.state.audio.isPlaying) {
      // Idle pulse line
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.5);
      ctx.lineTo(w, h * 0.5);
      ctx.stroke();
      return;
    }

    // Spectrum bars in background
    if (audioData.spectrum) {
      const bars = 24;
      const barW = w / bars;
      for (let i = 0; i < bars; i++) {
        const specVal = (audioData.spectrum[i * 2] || 0) / 255;
        const barH = specVal * h * 0.85;
        ctx.fillStyle = `rgba(255, 0, 119, ${0.15 + specVal * 0.35})`;
        ctx.fillRect(i * barW, h - barH, barW - 1, barH);
      }
    }

    // Live green/cyan waveform line
    const wave = audioData.waveform;
    ctx.strokeStyle = audioData.beat ? '#ff0077' : '#00f3ff';
    ctx.lineWidth = audioData.beat ? 2.5 : 1.5;
    ctx.beginPath();

    const sliceW = w / wave.length;
    let x = 0;
    for (let i = 0; i < wave.length; i++) {
      const v = wave[i]; // [-1, 1]
      const y = (v * 0.5 + 0.5) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceW;
    }
    ctx.stroke();
  }

  updateFPS() {
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      if (this.fpsCounter) this.fpsCounter.textContent = `${fps} FPS`;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }
}
