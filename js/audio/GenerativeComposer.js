/**
 * GenerativeComposer
 * The algorithmic brain for ambient & cinematic procedural composition.
 * Features modal scale systems, evolving chord progression state machine,
 * Euclidean rhythm generators, Markov melodic walkers, and customizable instrument styles.
 */
export class GenerativeComposer {
  constructor(state) {
    this.state = state;

    // Musical Scales (Semitone offsets relative to root)
    this.scales = {
      lydian_cosmic: {
        name: 'Lydian Cosmic',
        intervals: [0, 2, 4, 6, 7, 9, 11, 12, 14, 16, 18, 19, 21, 23, 24],
        chords: [
          { name: 'Cmaj7(#11)', rootSemi: 0, chordNotes: [0, 4, 7, 11, 18] },
          { name: 'D7',         rootSemi: 2, chordNotes: [2, 6, 9, 12, 16] },
          { name: 'Em7',        rootSemi: 4, chordNotes: [4, 7, 11, 14, 18] },
          { name: 'Gmaj7',      rootSemi: 7, chordNotes: [7, 11, 14, 18, 21] }
        ]
      },
      dorian_deep: {
        name: 'Dorian Deep',
        intervals: [0, 2, 3, 5, 7, 9, 10, 12, 14, 15, 17, 19, 21, 22, 24],
        chords: [
          { name: 'Dm9',    rootSemi: 2, chordNotes: [2, 5, 9, 12, 16] },
          { name: 'G7',     rootSemi: 7, chordNotes: [7, 11, 14, 17, 21] },
          { name: 'Bbmaj7', rootSemi: 10, chordNotes: [10, 14, 17, 21, 24] },
          { name: 'Am7',    rootSemi: 9, chordNotes: [9, 12, 16, 19, 24] }
        ]
      },
      aeolian_cinematic: {
        name: 'Aeolian Cinematic',
        intervals: [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 20, 22, 24],
        chords: [
          { name: 'Cm9',    rootSemi: 0, chordNotes: [0, 3, 7, 10, 14] },
          { name: 'Abmaj7', rootSemi: 8, chordNotes: [8, 12, 15, 19, 22] },
          { name: 'Ebmaj7', rootSemi: 3, chordNotes: [3, 7, 10, 14, 17] },
          { name: 'Bbadd9', rootSemi: 10, chordNotes: [10, 14, 17, 22, 24] }
        ]
      },
      pentatonic_ethereal: {
        name: 'Pentatonic Ethereal',
        intervals: [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24],
        chords: [
          { name: 'Csus2', rootSemi: 0, chordNotes: [0, 2, 7, 12, 14] },
          { name: 'Fsus2', rootSemi: 5, chordNotes: [5, 7, 12, 17, 19] },
          { name: 'Gsus4', rootSemi: 7, chordNotes: [7, 12, 14, 19, 21] },
          { name: 'Am7',   rootSemi: 9, chordNotes: [9, 12, 16, 19, 24] }
        ]
      },
      mystic_insen: {
        name: 'Mystic Insen',
        intervals: [0, 1, 5, 7, 10, 12, 13, 17, 19, 22, 24],
        chords: [
          { name: 'D_Insen', rootSemi: 2, chordNotes: [2, 3, 7, 12, 14] },
          { name: 'G_Insen', rootSemi: 7, chordNotes: [7, 8, 12, 17, 19] },
          { name: 'A_Insen', rootSemi: 9, chordNotes: [9, 10, 14, 19, 21] },
          { name: 'C_Insen', rootSemi: 0, chordNotes: [0, 1, 5, 10, 12] }
        ]
      }
    };

    this.baseFundamental = 65.41; // C2 in Hz
    this.currentChordIndex = 0;
    this.autoEvolveCounter = 0;

    // Pattern state
    this.patterns = {
      drums: {
        kick: new Array(16).fill(0),
        snare: new Array(16).fill(0),
        hats: new Array(16).fill(0),
        clicks: new Array(16).fill(0)
      },
      bass: {
        steps: new Array(16).fill(0),
        octaves: new Array(16).fill(0)
      },
      lead: {
        length: 14,
        notes: [],
        active: []
      }
    };

    // Generative Musical Journey Concepts
    this.concepts = [
      'cosmic_ambient',
      'driving_outrun',
      'glitch_cyber',
      'cinematic_tension',
      'zen_meditation'
    ];
    this.currentConceptIndex = 0;
    this.barInConcept = 0;
    this.phase = 'groove'; // 'groove', 'anticipation', 'fill_drop'

    // Initialize all patterns from default state
    this.rebuildAllPatterns();
  }

  getCurrentScale() {
    const key = this.state.audio.melodyScale || 'lydian_cosmic';
    return this.scales[key] || this.scales.lydian_cosmic;
  }

  getCurrentChord() {
    const scale = this.getCurrentScale();
    const chordList = scale.chords;
    return chordList[this.currentChordIndex % chordList.length];
  }

  getChordFrequencies(voicing = 'wide_cinematic') {
    const chord = this.getCurrentChord();
    const notes = chord.chordNotes;

    switch (voicing) {
      case 'warm_triads':
        // Close triad in octave 3
        return [notes[0], notes[1] || 4, notes[2] || 7, notes[0] + 12].map(s => this.baseFundamental * 2 * Math.pow(2, s / 12));
      case 'shimmer_extensions':
        // Extended 7ths, 9ths and #11s in octaves 3 & 4
        return notes.slice(0, 4).map(s => this.baseFundamental * 2 * Math.pow(2, (s + 7) / 12));
      case 'suspended_space':
        // Sus2 & Sus4 open clusters (Root, +2, +5, +7)
        return [0, 2, 5, 7].map(semi => this.baseFundamental * 2 * Math.pow(2, (chord.rootSemi + semi) / 12));
      case 'wide_cinematic':
      default:
        // Wide cinematic spread across 2 octaves
        return [
          this.baseFundamental * 2 * Math.pow(2, notes[0] / 12),
          this.baseFundamental * 2 * Math.pow(2, (notes[2] || 7) / 12),
          this.baseFundamental * 4 * Math.pow(2, (notes[1] || 4) / 12),
          this.baseFundamental * 4 * Math.pow(2, (notes[3] || 11) / 12)
        ];
    }
  }

  getBassFrequency(octaveOffset = 0) {
    const chord = this.getCurrentChord();
    const userOctave = this.state.audio.tracks?.bass?.octave || 0;
    return this.baseFundamental * Math.pow(2, (chord.rootSemi + (octaveOffset + userOctave) * 12) / 12);
  }

  nextChord() {
    const scale = this.getCurrentScale();
    this.currentChordIndex = (this.currentChordIndex + 1) % scale.chords.length;
    return this.getCurrentChord();
  }

  generateEuclideanRhythm(hits, steps) {
    hits = Math.max(0, Math.min(hits, steps));
    const pattern = new Array(steps).fill(0);
    if (hits === 0) return pattern;
    let bucket = 0;
    for (let i = 0; i < steps; i++) {
      bucket += hits;
      if (bucket >= steps) {
        bucket -= steps;
        pattern[i] = 1;
      }
    }
    return pattern;
  }

  rebuildAllPatterns() {
    this.rebuildDrums();
    this.rebuildBass();
    this.rebuildLead();
  }

  rebuildDrums() {
    const track = this.state.audio.tracks?.drums || {};
    const style = track.style || 'ambient_pulse';
    const density = track.density || 1.0;

    const kick = new Array(16).fill(0);
    const snare = new Array(16).fill(0);
    const hats = new Array(16).fill(0);
    const clicks = new Array(16).fill(0);

    switch (style) {
      case 'four_on_floor':
        // Four-on-the-Floor driving club / synthwave
        [0, 4, 8, 12].forEach(i => kick[i] = 1);
        [4, 12].forEach(i => snare[i] = 1); // Clap on 2 and 4
        // Offbeat open hats + syncopated 16ths
        for (let i = 0; i < 16; i++) {
          if (i % 2 === 1) hats[i] = 1;
        }
        if (density > 1.1) {
          [3, 7, 11, 15].forEach(i => clicks[i] = 1);
        }
        break;

      case 'halftime_cinematic':
        // Cinematic Halftime: Big downbeat kick, snare on beat 3 (step 8)
        kick[0] = 1;
        if (density >= 1.0) kick[10] = 1;
        snare[8] = 1; // Heavy snare/clap on 3
        // Rolling 16th hats
        for (let i = 0; i < 16; i += 2) hats[i] = 1;
        if (density >= 1.2) {
          [2, 6, 12, 14].forEach(i => clicks[i] = 1);
        }
        break;

      case 'glitch_idm':
        // Complex syncopated polyrhythms
        const kHits = Math.round(3 * density);
        const cHits = Math.round(5 * density);
        const hHits = Math.round(7 * density);
        this.generateEuclideanRhythm(kHits, 16).forEach((v, i) => kick[i] = v);
        this.generateEuclideanRhythm(cHits, 16).forEach((v, i) => clicks[i] = v);
        this.generateEuclideanRhythm(hHits, 16).forEach((v, i) => hats[i] = v);
        snare[8] = 1;
        break;

      case 'minimal_heartbeat':
        // Cinematic double-thump heartbeat
        kick[0] = 1;
        kick[3] = 1;
        // Sparse ambient clicks
        clicks[7] = 1;
        clicks[13] = 1;
        break;

      case 'breakbeat_cyber':
        // Fast syncopated cyber breakbeat
        kick[0] = 1;
        kick[10] = 1;
        if (density >= 1.2) kick[7] = 1;
        snare[4] = 1;
        snare[12] = 1;
        if (density >= 1.0) snare[15] = 1;
        for (let i = 0; i < 16; i++) hats[i] = 1;
        [2, 6, 8, 14].forEach(i => clicks[i] = 1);
        break;

      case 'ambient_pulse':
      default:
        // Organic space pulse
        kick[0] = 1;
        if (density >= 1.1) kick[10] = 1;
        [2, 6, 10, 14].forEach(i => hats[i] = 1);
        [3, 7, 11, 15].forEach(i => clicks[i] = 1);
        break;
    }

    this.patterns.drums = { kick, snare, hats, clicks };
  }

  rebuildBass() {
    const track = this.state.audio.tracks?.bass || {};
    const style = track.style || 'cinematic_drone';

    const steps = new Array(16).fill(0);
    const octaves = new Array(16).fill(0);

    switch (style) {
      case 'rolling_16th':
        // Driving continuous synthwave bassline
        for (let i = 0; i < 16; i++) {
          steps[i] = 1;
          if (i % 4 === 2 || i % 8 === 7) octaves[i] = 1; // Octave pop on accents
        }
        break;

      case 'syncopated_pulse':
        // Offbeat groove
        [0, 3, 6, 8, 11, 14].forEach(i => steps[i] = 1);
        [6, 14].forEach(i => octaves[i] = 1);
        break;

      case 'octave_bounce':
        // Classic disco/outrun octave bounce
        for (let i = 0; i < 16; i += 2) {
          steps[i] = 1;
          steps[i + 1] = 1;
          octaves[i + 1] = 1;
        }
        break;

      case 'acid_walk':
        // Melodic walking bassline hitting scale roots and accents
        for (let i = 0; i < 16; i += 2) {
          steps[i] = 1;
          if (i === 4 || i === 10 || i === 14) octaves[i] = 1;
        }
        if (track.density > 1.1) {
          [3, 7, 11, 15].forEach(i => steps[i] = 1);
        }
        break;

      case 'cinematic_drone':
      default:
        // Sustained root note on step 0 (and subtle accent on 8)
        steps[0] = 1;
        break;
    }

    this.patterns.bass = { steps, octaves };
  }

  rebuildLead() {
    const track = this.state.audio.tracks?.lead || {};
    const style = track.style || 'celestial_chimes';
    const scale = this.getCurrentScale();
    const intervals = scale.intervals;
    const density = track.density || 1.0;

    let len = 14;
    const notes = [];
    const active = [];

    switch (style) {
      case 'driving_arpeggio':
        // Fast 16th rolling arpeggiator up & down chord tones
        len = 16;
        const chordNotes = this.getCurrentChord().chordNotes;
        for (let i = 0; i < len; i++) {
          const cIdx = i % chordNotes.length;
          const octaveBoost = Math.floor(i / chordNotes.length) * 12;
          notes.push(chordNotes[cIdx] + octaveBoost);
          active.push(1);
        }
        break;

      case 'call_and_response':
        len = 16;
        for (let i = 0; i < len; i++) {
          const isCall = i < 6;
          const isAnswer = i >= 8 && i < 14;
          const noteIdx = (i * 2) % intervals.length;
          notes.push(intervals[noteIdx]);
          active.push((isCall || isAnswer) ? 1 : 0);
        }
        break;

      case 'slow_glide':
        len = 12;
        [0, 4, 7, 11, 14, 9].forEach((n, i) => {
          notes.push(n);
          active.push(i % 2 === 0 ? 1 : 0);
        });
        break;

      case 'pentatonic_solo':
        // Expressive pentatonic riffing
        len = 16;
        const penta = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
        for (let i = 0; i < len; i++) {
          const pIdx = Math.floor(Math.random() * penta.length);
          notes.push(penta[pIdx]);
          active.push((i % 2 === 0 || Math.random() < 0.45 * density) ? 1 : 0);
        }
        break;

      case 'celestial_chimes':
      default:
        len = 14;
        let deg = Math.floor(intervals.length * 0.5);
        for (let i = 0; i < len; i++) {
          const r = Math.random();
          if (r < 0.4) deg = Math.min(intervals.length - 1, deg + 1);
          else if (r < 0.7) deg = Math.max(0, deg - 1);
          else deg = (deg + 2) % intervals.length;

          notes.push(intervals[deg]);
          // Density modulates probability
          active.push(Math.random() < 0.55 * density ? 1 : 0);
        }
        break;
    }

    this.patterns.lead = { length: len, notes, active };
  }

  mutate(trackName) {
    switch (trackName) {
      case 'drums':
        this.rebuildDrums();
        break;
      case 'bass':
        this.rebuildBass();
        break;
      case 'pads':
        this.nextChord();
        break;
      case 'lead':
        this.rebuildLead();
        break;
      default:
        this.rebuildAllPatterns();
    }
  }

  generateTransitionFill() {
    const kick = new Array(16).fill(0);
    const snare = new Array(16).fill(0);
    const hats = new Array(16).fill(0);
    const clicks = new Array(16).fill(0);

    // Downbeat kick only to clear the spectrum for the upcoming drop
    kick[0] = 1;

    // Fast accelerating snare roll on steps 8, 10, 12, 13, 14, 15
    [8, 10, 12, 13, 14, 15].forEach(i => snare[i] = 1);

    // Continuous 16th hats
    for (let i = 0; i < 16; i++) hats[i] = 1;

    // Polyrhythmic accent clicks
    [2, 6, 9, 11, 14].forEach(i => clicks[i] = 1);

    this.patterns.drums = { kick, snare, hats, clicks };
  }

  getCurrentConcept() {
    return this.concepts[this.currentConceptIndex] || 'cosmic_ambient';
  }

  getNextConcept() {
    const nextIdx = (this.currentConceptIndex + 1) % this.concepts.length;
    return this.concepts[nextIdx];
  }

  tickAutoEvolve() {
    const config = this.state.audio.evolveConfig || { barsPerConcept: 16 };
    const barsPerConcept = config.barsPerConcept || 16;

    this.barInConcept++;

    // Harmonic progression: evolve chord harmony every 2 bars
    if (this.barInConcept % 2 === 0) {
      this.nextChord();
    }

    const barsRemaining = barsPerConcept - this.barInConcept;

    if (barsRemaining <= 0) {
      // THE DROP / ARRIVAL: Complete concept transformation!
      this.barInConcept = 0;
      this.phase = 'groove';
      this.currentConceptIndex = (this.currentConceptIndex + 1) % this.concepts.length;
      const nextConcept = this.getCurrentConcept();

      this.state.applyMood(nextConcept);
      this.rebuildAllPatterns();

      this.state.setEvolveConfig('currentConcept', nextConcept);
      this.state.setEvolveConfig('nextConcept', this.getNextConcept());
      this.state.setEvolveConfig('barInConcept', 0);
      this.state.setEvolveConfig('phase', 'groove');
      this.state.emit('journey:drop', { concept: nextConcept });
    } else if (barsRemaining === 1) {
      // FILL / TENSION PEAK: Final bar before the drop!
      this.phase = 'fill_drop';
      this.generateTransitionFill();
      this.state.setEvolveConfig('barInConcept', this.barInConcept);
      this.state.setEvolveConfig('phase', 'fill_drop');
      this.state.emit('journey:fill', { barsUntilDrop: 1 });
    } else if (barsRemaining <= 4) {
      // ANTICIPATION / BUILD: 4 bars before drop
      this.phase = 'anticipation';
      if (this.barInConcept % 2 === 0) {
        this.rebuildLead();
      }
      this.state.setEvolveConfig('barInConcept', this.barInConcept);
      this.state.setEvolveConfig('phase', 'anticipation');
      this.state.setEvolveConfig('nextConcept', this.getNextConcept());
      this.state.emit('journey:anticipation', { barsUntilDrop: barsRemaining });
    } else {
      // STABLE GROOVE
      this.phase = 'groove';
      if (this.barInConcept % 4 === 0) {
        this.rebuildLead();
      }
      this.state.setEvolveConfig('barInConcept', this.barInConcept);
      this.state.setEvolveConfig('phase', 'groove');
      this.state.setEvolveConfig('nextConcept', this.getNextConcept());
    }
  }
}
