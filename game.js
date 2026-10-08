// Gusmaster 3000 -- Play: a full game against one of the cats.
(function () {
  const { $, store, S, sfx, engine, engineReady, Stage, wait, uci } = Core;
  const { PERSONAS, pickMove, grade } = GusEngine;

  const root = $('#game');
  const stage = new Stage(root.querySelector('.stage'));
  const board = new Board(root.querySelector('.board'), {
    canMove: () => !G.busy && !G.over && board.chess.turn() === G.human,
    side: () => G.human,
    onMove: (from, to, promotion, how) => humanMove({ from, to, promotion }, how),
  });
  // review: the positions where you went wrong, with the better move, for Homework.
  const G = { persona: 'kitten', human: 'w', busy: false, over: false, pre: null, grades: [], review: [], timers: [], gen: 0, lastWhy: null };
  const line = ev => Lines.say(G.persona, ev);
  const chess = () => board.chess;

  // While you think, the cat gets bored in character.
  function clearIdle() { G.timers.forEach(clearTimeout); G.timers = []; }
  function startIdle() {
    clearIdle();
    if (Coach.isOpen()) return;                 // no naps while Jim is asking questions
    const at = (s, f) => G.timers.push(setTimeout(() => { if (!G.busy && !G.over) f(); }, s * 1000));
    const nap = s => { at(s, () => { stage.mood('yawn'); stage.say(line('yawn'), 1500); });
                       at(s + 1.6, () => { stage.mood('sleep'); stage.say(line('sleep'), 2500); }); };
    if (G.persona === 'lazy') { at(5, () => { stage.mood('eat', 3000); stage.say(line('think'), 2500); }); nap(12); }
    else if (G.persona === 'bowie') { at(8, () => { stage.mood('preen', 3500); stage.say(line('preen')); });
                                      at(22, () => { stage.mood('preen', 3500); stage.say(line('preen')); }); nap(45); }
    else if (G.persona === 'kitten') { at(9, () => stage.mood('happy', 1500)); nap(30); }
    else nap(28);
  }

  function render() { board.render(); renderSide(); }
  function renderSide() {
    const c = chess(), hist = c.history(), cls = { blunder: 'bl', mistake: 'mi', best: 'gd' };
    let html = '';
    for (let i = 0; i < hist.length; i += 2) {
      const cell = j => { const g = G.grades[j];
        return `<span class="${g ? cls[g] || '' : ''}">${hist[j] || ''}${g === 'blunder' ? '??' : g === 'mistake' ? '?' : ''}</span>`; };
      html += `<div><span class="n">${i / 2 + 1}.</span>${cell(i)}${cell(i + 1)}</div>`;
    }
    const m = root.querySelector('.moves'); m.innerHTML = html; m.scrollTop = m.scrollHeight;
    // Captured material.
    const val = { p: 1, n: 3, b: 3, r: 5, q: 9 }, taken = { w: [], b: [] };
    c.history({ verbose: true }).forEach(mv => { if (mv.captured) taken[mv.color].push(mv.captured); });
    const score = s => taken[s].reduce((a, p) => a + val[p], 0);
    const row = s => { const opp = s === 'w' ? 'b' : 'w', diff = score(s) - score(opp);
      return taken[s].sort((a, b) => val[a] - val[b]).map(p => `<div class="pc ${opp}${p}"></div>`).join('') + (diff > 0 ? `<b>+${diff}</b>` : ''); };
    const catColor = G.human === 'w' ? 'b' : 'w', humanBottom = board.orientation === G.human;
    root.querySelector('.capTop').innerHTML = row(humanBottom ? catColor : G.human);
    root.querySelector('.capBot').innerHTML = row(humanBottom ? G.human : catColor);
    root.querySelector('.status').textContent = G.over ? G.overText : G.busy ? Cats.nameFor(G.persona, PERSONAS[G.persona].name) + ' is thinking...'
                                               : 'Your move' + (c.in_check() ? '. Check!' : '');
    $('#bUndo').disabled = G.busy || G.over || hist.length < 1;
  }

  // ---------- the turn cycle ----------
  function startPreEval() {
    const fen = chess().fen();
    G.pre = engine.analyse(fen, { depth: 12, multipv: 1, movetime: 6000 }).then(lines => ({ fen, lines }));
  }

  async function humanMove(m, how = {}) {
    const gen = G.gen, fenBefore = chess().fen();
    board.arrows = []; board.marks = {};        // Gus's arrows from the last question go away once Jim moves
    stage.unoffer();
    let mv;
    if (how.dragged) { mv = chess().move(m); if (mv) { board.last = [mv.from, mv.to]; board.afterMove(mv); } }
    else mv = board.play(m);
    if (!mv) return;
    clearIdle(); G.busy = true;
    const wasAsleep = stage.current === 'sleep';
    (mv.captured ? sfx.capture(mv.captured) : sfx.move()); render();
    if (wasAsleep) { stage.mood('idle'); stage.say(line('wake'), 1600); await wait(900); }
    if (chess().game_over()) return finish();
    stage.mood(G.persona === 'lazy' && Math.random() < 0.5 ? 'eat' : 'think');

    // Grade your move against the best move: same position, same depth (the background search
    // finished the best line; now score the move you played). Never cut the background search short:
    // a shallow search gives noisy numbers and false alarms.
    const pre = G.pre ? await G.pre : null;
    let g = { kind: 'ok' };
    if (pre && pre.fen === fenBefore && pre.lines.length) {
      const best = pre.lines[0], played = uci(mv);
      const mine = best.move === played ? best
        : (await engine.analyse(fenBefore, { depth: 12, multipv: 1, movetime: 6000, searchmoves: [played] }))[0];
      if (mine) g = grade(best.cp, mine.cp, best.move === played);
      if (g.kind === 'blunder' || g.kind === 'mistake')
        G.review.push({ ply: chess().history().length - 1, fen: fenBefore, played, san: mv.san,
                        best: best.move, kind: g.kind, loss: Math.round(g.loss) });
    }
    const [lines] = await Promise.all([
      engine.analyse(chess().fen(), { depth: 10, multipv: PERSONAS[G.persona].multipv, movetime: 2200 }), wait(400)]);
    if (gen !== G.gen) return;
    G.grades[chess().history().length - 1] = g.kind;
    renderSide();
    if (g.kind === 'blunder' || g.kind === 'mistake')
      stage.offer(g.kind === 'blunder' ? 'Why?? 💬' : 'Why? 💬', () => { Coach.open(coach); Coach.ask('Why was my last move bad?'); }, 12000);
    if (mv.captured && g.kind !== 'blunder' && wantsTantrum(mv.captured)) await tantrum(gen);
    else await react(g.kind);
    if (gen !== G.gen) return;
    await catMove(lines, gen);
  }

  // Take one of the cat's pieces and it may throw a tantrum: slaps the table, lasers one of your pieces off
  // the board, squints, realizes, tosses the piece back, meows and purrs. Looks only: the position never
  // changes. More likely for bigger captures, and never twice within three moves.
  const TANTRUM = { p: 0.25, n: 0.5, b: 0.5, r: 0.65, q: 0.9 };
  const wantsTantrum = t => (G.tantrumGen !== G.gen || chess().history().length - G.tantrumPly >= 6) && Math.random() < (TANTRUM[t] || 0);
  async function tantrum(gen) {
    G.tantrumGen = gen; G.tantrumPly = chess().history().length;
    const ok = () => gen === G.gen;
    const mine = board.squares().filter(sq => { const p = chess().get(sq); return p && p.color === G.human && p.type !== 'k'; });
    const victim = mine[Math.floor(Math.random() * mine.length)];
    stage.mood('slap'); setTimeout(() => { sfx.slap(); board.shake(); }, 480);
    stage.say(line('tantrum'), 2200); await wait(1500); if (!ok()) return;
    if (victim) {
      stage.mood('laser'); aimLasers(board.squareEl(victim)); sfx.laser(); board.zap(victim);
      await wait(1300); if (!ok()) return;
    }
    stage.mood('judge'); await wait(1300); if (!ok()) return;                 // the squint
    stage.mood('sad'); stage.say(line('oops'), 1800); await wait(1500); if (!ok()) return;
    if (victim) { stage.mood('toss'); setTimeout(() => board.toss(victim), 380); await wait(1100); if (!ok()) return; }
    const cat = stage.svg();
    sfx.meow(1.1); stage.mood('slowblink'); if (cat) cat.classList.add('purring'); setTimeout(() => sfx.purr(2.2), 450);
    stage.say(line('innocent'), 2800); await wait(2600);
    if (cat) cat.classList.remove('purring');
    if (!ok()) return;
    board.render(); stage.mood('think');
  }

  // How much each cat laughs at you instead of slapping the table.
  const LAUGHS = { kitten: 0.55, lazy: 0.4, wizard: 0.3, bowie: 0.65 };
  async function react(kind) {
    if (kind === 'blunder' && Math.random() < LAUGHS[G.persona]) {
      stage.mood('laugh'); sfx.laugh(); stage.say(line('laugh'), 2400); await wait(2000);
      stage.mood('judge'); await wait(900);
    } else if (kind === 'blunder') {
      stage.mood('slap'); setTimeout(() => { sfx.slap(); board.shake(); }, 480);
      stage.say(line('blunder'), 2600); await wait(1700);
      stage.mood('judge'); await wait(1200);       // let the stare land before he goes back to thinking
    } else if (kind === 'mistake') {
      if (Math.random() < 0.25) { stage.mood('laugh'); sfx.laugh(); stage.say(line('chuckle'), 1800); await wait(1300); }
      else { stage.mood('judge'); stage.say(line('mistake'), 2200); await wait(1300); }
    } else if (kind === 'best' && Math.random() < 0.45) {
      stage.mood('slowblink'); stage.say(line('best'), 2000); await wait(1500);
    } else if (chess().in_check()) {
      stage.mood('judge'); stage.say(line('checked'), 1800); await wait(900);
    }
    if (G.persona === 'lazy' && Math.random() < 0.35) { stage.mood('eat'); stage.say(line('think'), 1800); await wait(1400); }
    else if (Math.random() < 0.3) { stage.mood('think'); stage.say(line('think'), 1600); await wait(800); }
    else stage.mood('think');
  }

  async function catMove(lines, gen) {
    const legal = chess().moves({ verbose: true }).map(uci);
    const choice = pickMove(G.persona, lines, legal);
    const pace = { kitten: 600, lazy: 900, wizard: 900, bowie: 700 }[G.persona];
    await wait(pace + Math.random() * 600);
    if (gen !== G.gen) return;
    const u = choice.move; G.lastWhy = choice.why;
    const mv = board.play({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] || 'q' });
    G.busy = false;
    if (!mv) { console.warn('engine move rejected', u); render(); return; }
    (mv.captured ? sfx.capture(mv.captured) : sfx.move());
    renderSide(); persist();
    if (chess().game_over()) return finish();
    if (chess().in_check()) { sfx.check(); stage.mood('check', 2200); stage.say(line('check'), 2000); }
    else if (choice.why === 'snack') { stage.mood('eat', 2200); stage.say(line('snack'), 2400); }
    else if (mv.captured && Math.random() < 0.5) { stage.mood('happy', 1400); stage.say(line('capture'), 1600); }
    else stage.mood('idle');
    startPreEval(); startIdle();
  }

  // ---------- game end ----------
  function finish(resigned) {
    clearIdle(); G.over = true; G.busy = false; engine.stop();
    const c = chess(), humanWon = !resigned && c.in_checkmate() && c.turn() !== G.human;
    const catWon = resigned || (c.in_checkmate() && c.turn() === G.human);
    const outcome = humanWon ? 'win' : catWon ? 'loss' : 'draw';
    const name = Cats.nameFor(G.persona, PERSONAS[G.persona].name);
    if (catWon) {
      G.overText = resigned ? 'You resigned.' : 'Checkmate. ' + name + ' wins.';
      stage.mood('laser'); sfx.laser(); stage.say(resigned ? line('resign') : line('win'), 4000);
      const k = board.kingSquare(G.human);
      if (k) { aimLasers(board.squareEl(k)); board.scorch(k); }
      board.shake();
    } else if (humanWon) {
      G.overText = 'Checkmate! You beat ' + name + '!';
      stage.mood('sad'); sfx.win(); stage.say(line('lose'), 4000);
    } else {
      G.overText = 'Draw.';
      stage.mood('sleep'); stage.say(line('draw'), 4000);
    }
    renderSide();
    saveGame(outcome, resigned);
    store.set('current', null);
    setTimeout(() => {
      $('#resTitle').textContent = outcome === 'win' ? 'YOU WIN!' : outcome === 'loss' ? (resigned ? 'Resigned' : 'Checkmate') : 'Draw';
      const bl = G.grades.filter(x => x === 'blunder').length, mi = G.grades.filter(x => x === 'mistake').length;
      $('#bReview').textContent = 'Review with ' + name;
      $('#resSub').textContent = `${name} · ${Math.ceil(c.history().length / 2)} moves · ${bl} blunder${bl === 1 ? '' : 's'}, ${mi} mistake${mi === 1 ? '' : 's'}`
        + (G.review.length ? `. ${G.review.length} added to your homework.` : '');
      $('#result').classList.remove('hidden');
    }, catWon ? 2600 : 1800);
  }
  // Point both beams at the losing king, wherever it is on the board.
  function aimLasers(target) {
    const svg = stage.svg(), r = target.getBoundingClientRect(), pt = svg.createSVGPoint();
    pt.x = r.left + r.width / 2; pt.y = r.top + r.height / 2;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    svg.querySelectorAll('.lasers path').forEach(path => path.setAttribute('d', `M132 128 L${p.x - 6} ${p.y} M188 128 L${p.x + 6} ${p.y}`));
  }

  function saveGame(outcome, resigned) {
    const c = chess(), name = PERSONAS[G.persona].name;
    const result = outcome === 'draw' ? '1/2-1/2' : (outcome === 'win') === (G.human === 'w') ? '1-0' : '0-1';
    c.header('Event', 'Gusmaster 3000', 'Date', Core.today().replaceAll('-', '.'), 'White', G.human === 'w' ? 'Jim' : name,
             'Black', G.human === 'b' ? 'Jim' : name, 'Result', result,
             'Termination', resigned ? 'Jim resigned' : c.in_checkmate() ? 'checkmate' : 'draw');
    let pgn = c.pgn();
    if (!/(1-0|0-1|1\/2-1\/2)\s*$/.test(pgn)) pgn += ' ' + result;
    const body = { pgn, opponent: G.persona, color: G.human, result, outcome, moves: Math.ceil(c.history().length / 2),
                   blunders: G.grades.filter(x => x === 'blunder').length, mistakes: G.grades.filter(x => x === 'mistake').length,
                   review: G.review };
    fetch('/api/games', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .catch(() => { const l = store.get('unsaved', []); l.push(body); store.set('unsaved', l); });
  }
  function persist() {
    if (!G.over) store.set('current', { persona: G.persona, human: G.human, pgn: chess().pgn(), grades: G.grades, review: G.review, lastWhy: G.lastWhy });
  }

  // ---------- start ----------
  async function start(persona, human, saved) {
    G.gen++; clearIdle(); engine.stop();
    G.persona = persona; G.human = human === 'r' ? (Math.random() < 0.5 ? 'w' : 'b') : human;
    G.over = false; G.busy = false; G.grades = (saved && saved.grades) || []; G.review = (saved && saved.review) || []; G.lastWhy = (saved && saved.lastWhy) || null;
    Coach.reset(); Coach.close();
    board.chess = new Chess(); if (saved && saved.pgn) board.chess.load_pgn(saved.pgn);
    board.orientation = G.human; board.sel = null; board.arrows = []; board.marks = {};
    const h = chess().history({ verbose: true }); board.last = h.length ? [h[h.length - 1].from, h[h.length - 1].to] : null;
    stage.setCat(persona, PERSONAS[persona].name, 'rating ' + PERSONAS[persona].rating);
    Coach.refreshAll();
    Home.showScreen('game'); $('#result').classList.add('hidden');
    $('#gHints').checked = S.hints; $('#gSound').checked = S.sound;
    stage.say(saved ? 'Oh, you are back. Where were we?' : line('greet'), 3500);
    G.busy = true; render();
    await engineReady;
    G.busy = false;
    if (chess().turn() !== G.human) {
      G.busy = true; render(); const gen = G.gen;
      stage.mood('think');
      const lines = await engine.analyse(chess().fen(), { depth: 10, multipv: PERSONAS[persona].multipv, movetime: 2000 });
      if (gen === G.gen) await catMove(lines, gen);
    } else { render(); startPreEval(); startIdle(); }
  }
  function stop() { G.gen++; clearIdle(); engine.stop(); G.busy = false; }

  // ---------- controls ----------
  $('#bFlip').onclick = () => { board.orientation = board.orientation === 'w' ? 'b' : 'w'; render(); };
  $('#bLobby').onclick = () => { persist(); stop(); Home.show('play'); };
  $('#bResLobby').onclick = () => { stop(); Home.show('play'); };
  $('#bRematch').onclick = () => start(G.persona, S.color);
  $('#bResign').onclick = () => { if (G.over) return; if (confirm('Resign this game?')) { G.gen++; finish(true); } };
  $('#bUndo').onclick = async () => {
    if (G.busy || G.over) return;
    G.gen++; clearIdle(); engine.stop(); if (G.pre) await G.pre;
    const c = chess();
    const back = () => { c.undo(); G.grades.length = c.history().length; G.review = G.review.filter(r => r.ply < c.history().length); };
    back(); if (c.turn() !== G.human) back();
    const h = c.history({ verbose: true }); board.last = h.length ? [h[h.length - 1].from, h[h.length - 1].to] : null;
    board.sel = null; stage.mood('judge', 1800); stage.say(line('takeback'), 2200); render(); persist(); startPreEval(); startIdle();
  };

  // Hook for a live Claude coaching session: read the game, put words in the cat's mouth, play a move.
  window.GM = {
    state: () => ({ fen: chess().fen(), pgn: chess().pgn(), persona: G.persona, human: G.human, over: G.over, grades: G.grades, review: G.review }),
    say: (t, ms = 6000) => stage.say(t, ms), mood: m => stage.mood(m),
    play: san => {
      if (G.busy || G.over || chess().turn() !== G.human) return 'not your turn';
      const m = chess().moves({ verbose: true }).find(x => x.san === san || x.from + x.to === san);
      if (!m) return 'illegal: ' + san;
      humanMove({ from: m.from, to: m.to, promotion: m.promotion }); return m.san;
    },
    ready: () => !G.busy && !G.over && chess().turn() === G.human,
    tantrum: () => tantrum(G.gen),           // watch the capture tantrum on demand
  };

  // Ask Gus: the drawer reads this to build the facts. Questions pause the cat's napping.
  const coach = Coach.mount(root, {
    stage, board,
    getCtx: () => ({ mode: 'game', persona: G.persona, human: G.human, board, over: G.over, overText: G.overText, grades: G.grades,
                     review: G.review, lastWhy: G.lastWhy,
                     blocked: G.busy && !G.over ? 'Hold on, I am thinking about my move. Ask me in a second.' : null }),
    onOpen: () => clearIdle(),
    onClose: () => { if (!G.busy && !G.over && chess().turn() === G.human) startIdle(); },
  });
  $('#bReview').onclick = () => { $('#result').classList.add('hidden'); Coach.open(coach); Coach.ask('Review my game'); };

  window.Play = { start, stop, render, board };
})();
