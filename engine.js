// Gusmaster 3000 -- Stockfish wrapper plus the cat personality layer.
// Stockfish finds the good moves; each cat decides how badly to play.
(function () {
  const MATE = 10000;

  class Engine {
    constructor(url) {
      this.w = new Worker(url);
      this.listeners = [];
      this.w.onmessage = e => { const l = typeof e.data === 'string' ? e.data : ''; this.listeners.slice().forEach(f => f(l)); };
      this.chain = Promise.resolve();
      this.running = false;
    }
    send(c) { this.w.postMessage(c); }
    waitFor(test) {
      return new Promise(res => { const f = l => { if (test(l)) { this.listeners = this.listeners.filter(x => x !== f); res(l); } };
                                  this.listeners.push(f); });
    }
    async init() {
      this.send('uci'); await this.waitFor(l => l === 'uciok');
      this.send('setoption name Hash value 32');
      this.send('isready'); await this.waitFor(l => l === 'readyok');
    }
    // Analyse a position. Returns lines sorted best-first: { move, cp } with cp from the side to move.
    // searchmoves: score only these root moves (used to grade your move against the best one, same depth).
    analyse(fen, { depth = 10, multipv = 1, movetime = 2500, searchmoves = null } = {}) {
      const job = this.chain.then(() => new Promise(res => {
        const lines = [];
        const f = l => {
          if (l.startsWith('info') && l.includes(' pv ') && l.includes(' multipv ')) {
            const k = +l.match(/ multipv (\d+)/)[1];
            const m = l.match(/ score (cp|mate) (-?\d+)/);
            const pv = l.match(/ pv (.+)$/)[1].trim().split(' ');
            if (!m) return;
            const n = +m[2];
            const cp = m[1] === 'cp' ? n : (n > 0 ? MATE - n : -MATE - n);
            lines[k - 1] = { move: pv[0], pv, cp, mate: m[1] === 'mate' ? n : null };
          } else if (l.startsWith('bestmove')) {
            this.listeners = this.listeners.filter(x => x !== f);
            this.running = false;
            const best = l.split(' ')[1];
            const out = lines.filter(Boolean);
            if (!out.length && best && best !== '(none)') out.push({ move: best, cp: 0, mate: null });
            res(out);
          }
        };
        this.listeners.push(f);
        this.running = true;
        this.send('setoption name MultiPV value ' + multipv);
        this.send('position fen ' + fen);
        this.send(`go depth ${depth} movetime ${movetime}${searchmoves ? ' searchmoves ' + searchmoves.join(' ') : ''}`);
      }));
      this.chain = job.catch(() => {});
      return job;
    }
    stop() { if (this.running) this.send('stop'); }
  }

  // How each cat picks a move from Stockfish's candidate list.
  //   random: chance of a totally random legal move
  //   window: ignore candidates worse than best by more than this (centipawns)
  //   temp:   how willing to pick a worse candidate inside the window (higher = sloppier)
  //   snack:  Lazy Gus only. Chance per move that a treat distracts him into his worst candidate.
  //   grab:   chance of taking an obvious win (best move far better than the rest, e.g. a free queen).
  //           Hanging a piece has to cost something, or the game teaches nothing.
  const PERSONAS = {
    kitten: { name: 'Kitten Gus', rating: '~300', multipv: 10, random: 0.22, window: 700, temp: 260, snack: 0, grab: 0.7 },
    lazy:   { name: 'Lazy Gus',   rating: '~600', multipv: 8,  random: 0.08, window: 320, temp: 120, snack: 0.10, grab: 0.85 },
    wizard: { name: 'Wizard Gus', rating: '~900', multipv: 5,  random: 0.02, window: 130, temp: 55,  snack: 0, grab: 0.97 },
    bowie:  { name: 'King Bowie', rating: '~1200', multipv: 4, random: 0,    window: 60,  temp: 22,  snack: 0, grab: 1 },
  };

  function pickMove(persona, lines, legal, rnd = Math.random) {
    const P = PERSONAS[persona];
    if (!lines.length) return { move: legal[Math.floor(rnd() * legal.length)], why: 'random' };
    const best = lines[0];
    // Short mates get played (the kitten spots only half of them), so won games actually end.
    if (best.mate > 0 && best.mate <= 3 && rnd() < (persona === 'kitten' ? 0.5 : 0.92)) return { move: best.move, why: 'mate' };
    const second = lines[1] ? lines[1].cp : -MATE;
    if (best.cp - second >= 250 && best.cp > 150 && rnd() < P.grab) return { move: best.move, why: 'grab' };
    if (P.snack && rnd() < P.snack && lines.length > 2) return { move: lines[lines.length - 1].move, why: 'snack' };
    if (rnd() < (best.cp > 600 ? P.random / 3 : P.random)) return { move: legal[Math.floor(rnd() * legal.length)], why: 'random' };
    // Way ahead: smell blood and play tighter, or a won game shuffles forever.
    const ahead = best.cp > 600, win = ahead ? Math.min(P.window, 150) : P.window, temp = ahead ? Math.min(P.temp, 60) : P.temp;
    const pool = lines.filter(l => best.cp - l.cp <= win);
    const w = pool.map(l => Math.exp(-(best.cp - l.cp) / temp));
    let r = rnd() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return { move: pool[i].move, why: i ? 'loose' : 'best' }; }
    return { move: best.move, why: 'best' };
  }

  // ENGINE UNITS: this Stockfish build reports roughly pawn 85, knight 470, rook 630, queen 1280
  // (about 1.5x the usual scale), plus about +85 for the side to move. So compare moves only
  // from the same position at the same depth, and size thresholds in these units.
  // Grade the human's move. best: score of the engine's best move. played: score of the move played.
  // Both from the human's side, same position, same depth.
  function grade(best, played, playedBest) {
    const clamp = v => Math.max(-2500, Math.min(2500, v));
    const loss = Math.max(0, clamp(best) - clamp(played));
    if (playedBest || loss <= 20) return { kind: playedBest ? 'best' : 'good', loss };
    // Not when the game is already decided either way: already lost, or still crushing after the move
    // (a queen up, every move wins; flagging those filled homework with false alarms).
    const live = best > -900 && played < 900;
    if (loss >= 320 && live) return { kind: 'blunder', loss };      // about a minor piece, or two pawns
    if (loss >= 180 && live) return { kind: 'mistake', loss };      // about a pawn, with margin for depth-12 noise
    return { kind: 'ok', loss };
  }

  window.GusEngine = { Engine, PERSONAS, pickMove, grade, MATE };
})();
