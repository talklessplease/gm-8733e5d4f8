// Gusmaster 3000 -- shared pieces: settings, sounds, engine, the cat stage, saved progress.
(function () {
  const $ = s => document.querySelector(s);

  // ---------- settings (per-viewer conveniences only; real progress lives on disk) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('gm.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('gm.' + k, JSON.stringify(v)); } catch {} },
  };
  const S = { hints: store.get('hints', true), theme: store.get('theme', 'walnut'), sound: store.get('sound', true), color: store.get('color', 'w'),
             voice: store.get('voice', false), pieces: store.get('pieces', 'classic') };
  const saveSettings = () => Object.keys(S).forEach(k => store.set(k, S[k]));

  // ---------- sound (synthesized, no files) ----------
  let AC = null;
  const ac = () => (AC = AC || new (window.AudioContext || window.webkitAudioContext)());
  function tone(freq, dur, type = 'sine', vol = 0.15, slide = null, delay = 0) {
    if (!S.sound) return;
    const c = ac(), o = c.createOscillator(), g = c.createGain(), t = c.currentTime + delay;
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur);
  }
  function noise(dur, vol = 0.4, cutoff = 900) {
    if (!S.sound) return;
    const c = ac(), b = c.createBuffer(1, c.sampleRate * dur, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'lowpass'; f.frequency.value = cutoff; g.gain.value = vol;
    s.buffer = b; s.connect(f).connect(g).connect(c.destination); s.start();
  }
  // A synthesized meow: a rising-then-falling sawtooth through a vowel-ish filter, with vibrato.
  function meow(pitch = 1, vol = 0.12) {
    if (!S.sound) return;
    const c = ac(), t = c.currentTime, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o.type = 'sawtooth'; f.type = 'bandpass'; f.Q.value = 3;
    o.frequency.setValueAtTime(520 * pitch, t); o.frequency.linearRampToValueAtTime(820 * pitch, t + 0.12); o.frequency.linearRampToValueAtTime(430 * pitch, t + 0.42);
    f.frequency.setValueAtTime(900, t); f.frequency.linearRampToValueAtTime(1700, t + 0.12); f.frequency.linearRampToValueAtTime(800, t + 0.42);
    lfo.frequency.value = 9; lg.gain.value = 12; lfo.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.05); g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    o.connect(f).connect(g).connect(c.destination); o.start(t); lfo.start(t); o.stop(t + 0.46); lfo.stop(t + 0.46);
  }
  // A laser-sword hum: two detuned low sawtooths swept through a filter, plus a crackle.
  function saber(vol = 0.09) {
    if (!S.sound) return;
    const c = ac(), t = c.currentTime, f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'lowpass'; f.frequency.setValueAtTime(250, t); f.frequency.exponentialRampToValueAtTime(1400, t + 0.12); f.frequency.exponentialRampToValueAtTime(220, t + 0.55);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.04); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    [88, 91.5].forEach(fr => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(fr, t); o.frequency.linearRampToValueAtTime(fr * 1.35, t + 0.2); o.connect(f); o.start(t); o.stop(t + 0.62); });
    f.connect(g).connect(c.destination); noise(0.08, 0.12, 4000);
  }
  // Sound packs per piece set: { move, capture(capturedType) }.
  const PACKS = {
    classic: { move: () => tone(520, 0.06, 'triangle', 0.12), capture: () => { tone(300, 0.09, 'triangle', 0.16); noise(0.05, 0.15, 2000); } },
    cats: { move: () => { tone(330, 0.05, 'triangle', 0.1); noise(0.03, 0.06, 1200); },
            capture: t => t === 'p' ? [0, 0.09].forEach(d => tone(2400, 0.07, 'sine', 0.08, 3300, d)) : meow(t === 'q' ? 0.8 : 1) },
    space: { move: () => tone(660, 0.07, 'sine', 0.09, 990), capture: () => saber() },
    retro: { move: () => { tone(1046, 0.04, 'square', 0.05); tone(784, 0.04, 'square', 0.05, null, 0.045); },
             capture: () => [880, 659, 523, 392].forEach((fr, i) => tone(fr, 0.05, 'square', 0.06, null, i * 0.05)) },
  };
  const pack = () => PACKS[S.pieces] || PACKS.classic;
  const sfx = {
    move: () => pack().move(),
    capture: t => pack().capture(t),
    promote: () => S.pieces === 'cats' ? meow(1.25, 0.1) : [523, 784, 1046].forEach((fr, i) => tone(fr, 0.12, S.pieces === 'retro' ? 'square' : 'triangle', 0.08, null, i * 0.08)),
    meow,
    slap: () => { noise(0.22, 0.7, 700); tone(70, 0.3, 'sine', 0.5, 40); },
    laser: () => { tone(1400, 0.9, 'sawtooth', 0.07, 180); tone(1450, 0.9, 'square', 0.04, 200); },
    check: () => { tone(880, 0.08, 'square', 0.06); tone(990, 0.1, 'square', 0.06, null, 0.09); },
    win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'triangle', 0.14, null, i * 0.12)),
    sad: () => [392, 349, 311].forEach((f, i) => tone(f, 0.3, 'sine', 0.12, null, i * 0.22)),
    laugh: () => [0, 1, 2, 3].forEach(i => tone(520 - i * 40, 0.09, 'square', 0.05, 380 - i * 30, i * 0.13)),
    right: () => { tone(660, 0.1, 'triangle', 0.13); tone(990, 0.16, 'triangle', 0.13, null, 0.09); },
    wrong: () => tone(220, 0.22, 'sawtooth', 0.06, 150),
    star: i => tone(880 + i * 220, 0.22, 'triangle', 0.12, null, i * 0.18),
  };

  // ---------- voices: each cat speaks with its own Mac voice (opt-in, works offline) ----------
  const CAST = { kitten: { names: ['Junior'], pitch: 1.5, rate: 1.15 },
                 lazy:   { names: ['Grandpa (English (United States))', 'Ralph', 'Fred'], pitch: 0.7, rate: 0.8 },
                 wizard: { names: ['Daniel', 'Grandpa (English (United Kingdom))'], pitch: 0.75, rate: 0.9 },
                 bowie:  { names: ['Reed (English (United Kingdom))', 'Eddy (English (United Kingdom))', 'Daniel'], pitch: 1.15, rate: 0.95 } };
  // The Mac's voice list loads asynchronously; cache it so the very first line gets the right voice.
  let VOICES = [];
  if (window.speechSynthesis) {
    const load = () => { VOICES = speechSynthesis.getVoices(); };
    load(); speechSynthesis.addEventListener('voiceschanged', load);
  }
  // George (ElevenLabs) when the line is recorded, or live for Ask Gus; the Mac voice otherwise.
  let seq = 0, playing = null;
  async function speak(look, text, opts = {}) {
    if (!S.voice || !text || opts.silent) return;
    const my = ++seq, persona = window.Cats ? Cats.artFor(look) : look;
    if (playing) { playing.pause(); playing = null; }
    if (window.speechSynthesis) speechSynthesis.cancel();
    try {
      const r = await (await fetch('/api/speak', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                                                   body: JSON.stringify({ persona, text, live: !!opts.live }) })).json();
      if (my !== seq) return;
      if (r.ok) { playing = new Audio(r.url); playing.play().catch(() => {}); return; }
    } catch {}
    if (my === seq) macSpeak(look, text);
  }
  function macSpeak(look, text) {
    if (!S.voice || !window.speechSynthesis || !text) return;
    const cast = CAST[look] || CAST.wizard, voices = VOICES.length ? VOICES : speechSynthesis.getVoices();
    const v = cast.names.map(n => voices.find(x => x.name === n)).find(Boolean) || voices.find(x => x.lang.startsWith('en'));
    const u = new SpeechSynthesisUtterance(text.replace(/\*/g, '').replace(/\.\.\./g, '.'));
    if (v) u.voice = v; u.pitch = cast.pitch; u.rate = cast.rate;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }

  // ---------- engine (one Stockfish worker shared by every screen) ----------
  const engine = new GusEngine.Engine('vendor/stockfish.js');
  const engineReady = engine.init();

  // ---------- the cat stage: speech bubble + animated cat + name plate ----------
  class Stage {
    constructor(root) {
      this.root = root; this.bubble = root.querySelector('.bubble'); this.box = root.querySelector('.catbox');
      this.plate = root.querySelector('.plate'); this.look = null; this.current = 'idle';
      this.moodTimer = null; this.bubbleTimer = null;
      setInterval(() => {            // natural blinking
        const c = this.svg();
        if (c && ['idle', 'think', 'check', 'judge'].includes(this.current) && Math.random() < 0.5) {
          c.classList.add('blink'); setTimeout(() => c.classList.remove('blink'), 260);
        }
      }, 2600);
    }
    svg() { return this.box.querySelector('svg'); }
    setCat(look, name, sub) {
      this.look = look; this.box.innerHTML = Cats.svg(Cats.artFor(look));
      this.plate.innerHTML = `${Cats.nameFor(look, name)}${sub ? `<small>${sub}</small>` : ''}`;
      this.bubble.classList.remove('on'); this.mood('idle');
    }
    mood(m, ms) {
      clearTimeout(this.moodTimer);
      const c = this.svg(); if (!c) return;
      c.setAttribute('class', c.getAttribute('class').replace(/\bst-\w+/, ''));
      void c.getBoundingClientRect();          // restart CSS animations when the same mood repeats
      c.classList.add('st-' + m); this.current = m;
      if (ms) this.moodTimer = setTimeout(() => this.mood('idle'), ms);
    }
    say(text, ms = 3200, opts = {}) {          // ms = 0 keeps the bubble up; opts.live / opts.silent for the voice
      if (!text) return;
      this.bubble.textContent = text; this.bubble.classList.add('on');
      speak(this.look, text, opts);
      clearTimeout(this.bubbleTimer);
      if (ms) this.bubbleTimer = setTimeout(() => this.bubble.classList.remove('on'), ms);
    }
    hush() { clearTimeout(this.bubbleTimer); this.bubble.classList.remove('on'); }
    // A small button under the cat for a few seconds (e.g. "Why?" right after a blunder).
    offer(label, fn, ms = 9000) {
      this.unoffer();
      const b = document.createElement('button'); b.className = 'offer'; b.textContent = label;
      b.onclick = e => { e.stopPropagation(); this.unoffer(); fn(); };
      this.root.appendChild(b); this.offerEl = b;
      this.offerTimer = setTimeout(() => this.unoffer(), ms);
    }
    unoffer() { clearTimeout(this.offerTimer); if (this.offerEl) { this.offerEl.remove(); this.offerEl = null; } }
  }

  // ---------- saved progress (games/progress.json via the server; localStorage fallback) ----------
  const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const addDays = (day, n) => { const d = new Date(day + 'T12:00:00'); d.setDate(d.getDate() + n); return today(d); };
  const BLANK = () => ({ version: 1, puzzleRating: 500, solved: 0, failed: 0, seen: {}, review: {},
                         daily: null, streak: { count: 0, best: 0, last: null, saves: [] }, academy: {}, homework: {} });
  const Progress = {
    data: BLANK(),
    async load() {
      try {
        const d = await (await fetch('/api/progress')).json();
        this.data = Object.assign(BLANK(), d && d.version ? d : store.get('progress', {}));
      } catch { this.data = Object.assign(BLANK(), store.get('progress', {})); }
      return this.data;
    },
    save() {
      store.set('progress', this.data);
      clearTimeout(this._t);
      this._t = setTimeout(() => fetch('/api/progress', { method: 'PUT', headers: { 'Content-Type': 'application/json' },
                                                          body: JSON.stringify(this.data) }).catch(() => {}), 300);
    },
  };

  // Forgiving streak: up to two missed days in any 7-day window are covered by "cat naps".
  // Pure function so it can be tested: (streak, 'YYYY-MM-DD') -> new streak.
  function nextStreak(s, t) {
    s = { count: 0, best: 0, last: null, saves: [], ...s };
    if (s.last === t) return s;
    const gap = s.last ? Math.round((new Date(t + 'T12:00:00') - new Date(s.last + 'T12:00:00')) / 864e5) : 1;
    let saves = (s.saves || []).filter(x => x > addDays(t, -7)), count;
    if (gap === 1) count = s.count + 1;
    else if (gap > 1 && gap - 1 + saves.length <= 2) {
      for (let i = 1; i < gap; i++) saves.push(addDays(s.last, i));
      count = s.count + 1;
    } else { count = 1; saves = []; }
    return { count, best: Math.max(s.best || 0, count), last: t, saves };
  }

  const wait = ms => new Promise(r => setTimeout(r, ms));
  const uci = mv => mv.from + mv.to + (mv.promotion || '');
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  window.Core = { $, store, S, saveSettings, sfx, speak, engine, engineReady, Stage, Progress, today, addDays, nextStreak, wait, uci, pick };
})();
