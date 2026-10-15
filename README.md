# Procedural Audiovisual Synthesis Engine & Generative Audio Workstation

A real-time, procedural audiovisual synthesizer and generative music workstation built with **zero external assets** (no image, video, or audio files). All visuals and audio are generated 100% programmatically in real time using HTML5 Canvas, WebGL shaders, and the Web Audio API.

## Core Features

### 1. Multi-Part Generative Audio Workstation (`js/audio/`)
A modular procedural synthesizer and algorithmic composition engine designed for evolving ambient, outrun, glitch, and cinematic music:

* **Modular Synthesizer Voices (`js/audio/voices/`)**:
  * **Drums (`DrumsVoice.js`)**: Procedural sub-kicks (deep 38Hz exponential pitch sweeps), snappy noise snares, atmospheric noise-filtered hats, and metallic FM clicks. Supports 6 groove styles including Four-on-the-Floor, Halftime, Ambient Pulse, Glitch IDM, Minimal Heartbeat, and Breakbeat Cyber.
  * **Bass (`BassVoice.js`)**: Dual-oscillator analog Moog/Reese bass with smooth portamento glide, resonant filter envelope, octave registers, and soft-clip waveshaper.
  * **Pads (`PadVoice.js`)**: Polyphonic ambient pad supporting wide cinematic open voicings, warm triads, and shimmer extensions, with dynamic envelope options (2-bar swells, infinite drones, rhythmic stabs, arpeggiated pulses).
  * **Lead (`LeadVoice.js`)**: Melodic pluck, bell, blade, and chiptune voice supporting multiple oscillator waveforms (triangle, sawtooth, square, sine), phrasing styles (celestial chimes, driving 16th arpeggios, call & response, slow glide, pentatonic solos), and delay/reverb aux sends.

* **Algorithmic Composition & Journey Engine (`GenerativeComposer.js`)**:
  * **Cinematic Modal Scales**: Lydian Cosmic, Dorian Deep, Aeolian Cinematic, Pentatonic Ethereal, and Mystic Insen.
  * **5 Musical Genre Movements**: Cyclical journeys across *Cosmic Ambient*, *Driving Outrun*, *Glitch Cyber*, *Cinematic Tension*, and *Zen Meditation*.
  * **Arrangement State Machine**: 4 structural musical phases:
    1. **Groove Phase**: Core rhythm & evolving 4-voice chord progression.
    2. **Anticipation Phase (4 bars out)**: Lead phrasing builds tension; master filter sweeps upward and delay feedback swells.
    3. **Fill / Tension Peak (1 bar out)**: Kick clears on beats 2–4; rapid snare & polyrhythmic click rolls build the tension peak.
    4. **The Drop / Arrival**: Seamless tempo glide ($\Delta\text{bpm} = (\text{target} - \text{current}) \times 0.06$) prevents abrupt jumps as all 4 voices lock into the new genre movement.
  * **Per-Track Mutation (`mutate`)**: Re-rolls Euclidean patterns, bass grooves, chord voicings, or Markov melodic lines on command.

* **Split Track vs. Master Effects Architecture (`AudioEngine.js`)**:
  * **Per-Track Channel Inserts**: Custom polynomial waveshaping **Drive / Saturation** on Drums, Bass, Pads, and Lead.
  * **Per-Track Aux Sends**: Independent send levels for Reverb, Ping-Pong Delay, and Stereo Dimension Chorus on every track.
  * **Pre-Send Muting Guarantee**: Muting silences direct signal and all auxiliary send taps simultaneously with zero wet bleed.
  * **Aux Return Buses**: Convolver Space Reverb, Ping-Pong Delay (with feedback control), and a dedicated modulated Stereo Dimension Chorus bus.
  * **Global Master FX Rack**: Master DJ Resonant Filter (Lowpass / Highpass sweeps with Q resonance), Analog Tape Warmth & Saturation, and Brickwall Limiter.
  * **Auto-Evolve for Effects**: Dynamic modulation sweeps filters and delay feedback in sync with arrangement drops.

---

### 2. Four Switchable Visual Style Engines (`js/engines/`)
Rendering a unified procedural cosmic landscape and flow field:

* **ASCII Art (`AsciiEngine.js`)**: Character-mapped rendering with density scaling, directional edge glyphs, 5 CRT palettes (Neon, Matrix Green, Amber, True-Color RGB, Mono), and beat glitching.
* **Impressionist (`ImpressionistEngine.js`)**: 2,000–6,000 painterly brushstroke particles flowing through curl-noise fields with impasto 3D lighting, Van Gogh vortex attractors, and pointillist stipples.
* **Stained Glass (`StainedGlassEngine.js`)**: Real-time Voronoi cathedral window with a central rose-window rosette, dark lead cames with solder bevels, sunlight radial gradients, and celestial backlight flares.
* **Synthwave Wireframe (`SynthwaveEngine.js`)**: Infinite rolling perspective neon grid, audio-reactive 3D mountain flanks, segmented glowing sun, and floating wireframe polyhedra.

---

### 3. Floating Customization HUD (`js/gui/GUI.js`)
* **Visual Controls**: Speed, density, palette hue rotation, chaos/noise scale, and CRT scanlines toggle.
* **Audio Workstation**:
  * Play / Mute master sound toggle.
  * Real-time oscilloscope & spectrum visualizer.
  * Generative Journey Tracker HUD with live arrangement progress bar, countdown to drop, and evolution cycle duration selector (8, 16, 24, 32 bars).
  * 4-Channel Mixer Deck with Mute, Solo, Volume, and `[🎲 Mutate]` buttons for Drums, Bass, Pads, and Lead.
  * Sound Design Inspector with dedicated tabbed editing for every track (Groove styles, pattern density, octave registers, filter brightness, drive, and aux sends).
  * Master FX Rack with DJ Resonant Filter, Tape Warmth, Reverb/Delay/Chorus returns, and Auto-Evolve FX toggle.
* **Presets & Export**: Presets (*Neon Outrun*, *Monet Sunrise*, *Cathedral Light*, *Matrix Terminal*, *Cosmic Void*), Randomizer, and JSON state export/import.

---

## Quick Start
1. Double-click `start_server.bat` or run:
   ```bash
   python -m http.server 8080
   ```
2. Open **[http://localhost:8080](http://localhost:8080)** in any modern browser.
3. Click **"🔈 Start Sound"** to begin the real-time procedural experience.
