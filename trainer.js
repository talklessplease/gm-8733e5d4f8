// Gusmaster 3000 -- the Trainer: Academy lessons, daily puzzles, practice, homework, boss fights.
// One puzzle runner drives every mode. Three kinds of puzzle:
//   line  -- Lichess puzzle: an opening move by the other side, then a forced solution line
//   judge -- one move; correct if it is on an accept list, or (no list) Stockfish says it holds up
//   boss  -- checkmate a lone king against Stockfish within a move limit
(function () {
  const { $, S, sfx, engine, engineReady, Stage, Progress, today, addDays, wait, uci, pick } = Core;
  const { MATE } = GusEngine;

  const root = $('#trainer');
  const stage = new Stage(root.querySelector('.stage'));
  const board = new Board(root.querySelector('.board'), {
    canMove: () => T.accepting,
    side: () => T.side,
    onMove: (from, to, promotion, how) => onUserMove(from + to + (promotion || ''), how),
  });
  const ui = {
    title: root.querySelector('.t-title'), sub: root.querySelector('.t-sub'), chalk: root.querySelector('.chalk'),
    dots: root.querySelector('.dots'), hint: $('#tHint'), answer: $('#tAnswer'), next: $('#tNext'), prev: $('#tPrev'),
  };
  // gen: the current session (lesson, daily set...); pgen: the current puzzle inside it. Bumping either cancels stale work.
  const T = { mode: null, coach: 'wizard', side: 'w', accepting: false, gen: 0, pgen: 0, puzzle: null, resolve: null };
  const say = (ev, ms) => stage.say(Lines.say(T.coach, ev), ms);
  const LOOK = { 'Lazy Gus': 'lazy', 'Wizard Gus': 'wizard', 'King Bowie': 'bowie', 'Kitten Gus': 'kitten' };

  // ---------- puzzle data ----------
  let DATA = null;
  const loadData = async () => DATA || (DATA = await (await fetch('data/puzzles.json')).json());
  const asLine = row => { const [id, fen, moves, rating, themes] = row, m = moves.split(' ');
    return { kind: 'line', id, fen, setup: m[0], solution: m.slice(1), rating, themes }; };

  // Choose n unseen puzzles near the target rating (optionally from one theme).
  // While Jim solves fewer than about half on the first try, aim a little below his rating: confidence first.
  const easeIn = () => { const d = Progress.data, n = d.solved + d.failed; return n >= 10 && d.solved / n < 0.5 ? 70 : 0; };
  function choosePuzzles(n, { theme = null, target = Progress.data.puzzleRating - easeIn(), exclude = [] } = {}) {
    const idx = theme ? DATA.themes[theme] : DATA.puzzles.map((_, i) => i);
    const seen = Progress.data.seen, out = [];
    for (let span = 120; out.length < n && span < 2000; span *= 2) {
      const pool = idx.filter(i => { const p = DATA.puzzles[i];
        return !seen[p[0]] && !exclude.includes(p[0]) && !out.includes(i) && Math.abs(p[3] - target) <= span; });
      while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return out.map(i => asLine(DATA.puzzles[i]));
  }
  const byId = id => { const row = DATA.puzzles.find(p => p[0] === id); return row ? asLine(row) : null; };

  // Puzzle rating (Elo-style, first attempt only) and the review queue for missed puzzles.
  const BOXES = [1, 3, 7, 21];
  function recordPuzzle(p, firstTry) {
    const d = Progress.data;
    if (!d.seen[p.id]) {
      const exp = 1 / (1 + Math.pow(10, (p.rating - d.puzzleRating) / 400));
      d.puzzleRating = Math.max(200, Math.round(d.puzzleRating + 28 * ((firstTry ? 1 : 0) - exp)));
      d.seen[p.id] = 1;
    }
    firstTry ? d.solved++ : d.failed++;
    const r = d.review[p.id];
    if (!firstTry) d.review[p.id] = { box: 0, due: addDays(today(), 1) };
    else if (r) { r.box++; if (r.box >= BOXES.length) delete d.review[p.id]; else r.due = addDays(today(), BOXES[r.box]); }
    Progress.save();
  }

  // ---------- screen helpers ----------
  function open(title, sub, coach, coachName, mode) {
    T.gen++; T.pgen++; engine.stop(); T.coach = coach; T.mode = mode; T.unit = null; T.lessonText = null; T.prompt = null; T.puzzle = null;
    Coach.reset(); Coach.close();
    stage.setCat(coach, coachName, sub);
    Coach.refreshAll();
    ui.title.textContent = title; ui.sub.textContent = '';
    ui.chalk.innerHTML = ''; ui.dots.innerHTML = ''; board.arrows = []; board.marks = {}; board.last = null;
    $('#tresult').classList.add('hidden');
    Home.showScreen('trainer');
  }
  function buttons({ hint = false, answer = false, next = null, prev = null } = {}) {
    ui.hint.classList.toggle('hidden', !hint); ui.answer.classList.toggle('hidden', !answer);
    ui.next.classList.toggle('hidden', !next); ui.prev.classList.toggle('hidden', !prev);
    if (next) { ui.next.textContent = next.label; ui.next.onclick = next.go; }
    if (prev) { ui.prev.onclick = prev; }
  }
  function dots(results, current) {
    ui.dots.innerHTML = results.map((r, i) => `<span class="dot ${r === true ? 'ok' : r === false ? 'miss' : ''} ${i === current ? 'cur' : ''}"></span>`).join('');
  }
  const chalk = (html, cls = '') => { ui.chalk.className = 'chalk ' + cls; ui.chalk.innerHTML = html; };
  const sideName = c => (c === 'w' ? 'White' : 'Black');
  const sanOf = (fen, u) => { const c = new Chess(fen); const m = c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] || 'q' }); return m ? m.san : u; };

  // ---------- the puzzle runner ----------
  // Resolves to { solved, firstTry, moves } once the puzzle is finished.
  function runPuzzle(p, prompt) {
    const gen = ++T.pgen, sess = T.gen;
    const live = () => gen === T.pgen && sess === T.gen;
    T.puzzle = p; p.firstTry = true; p.hints = 0; p.step = 0; p.moves = 0; p.done = false;
    T.prompt = prompt || null; T.lessonText = null; Coach.newTopic();
    board.chess = new Chess(p.fen); board.arrows = []; board.marks = {}; board.last = null; board.sel = null;
    T.accepting = false;
    return new Promise(async resolve => {
      T.resolve = r => { if (live()) { T.accepting = false; resolve(r); } };
      if (p.kind === 'line') {
        T.side = board.chess.turn() === 'w' ? 'b' : 'w';     // you play the side that answers the setup move
        board.orientation = T.side; board.render();
        chalk(prompt || `<b>${sideName(T.side)} to move.</b> Find the best move.`);
        await wait(650); if (!live()) return;
        playMove(p.setup); await wait(250);
      } else {
        T.side = board.chess.turn(); board.orientation = T.side; board.render();
        chalk(prompt || `<b>${sideName(T.side)} to move.</b>`);
        if (p.kind === 'judge' && !p.accept) p.analysis = engine.analyse(p.fen, { depth: 14, multipv: 5, movetime: 3000 });
      }
      if (!live()) return;
      T.accepting = true;
      buttons({ hint: true, answer: p.kind !== 'boss', prev: T.prevHandler });
    });
  }
  function playMove(u, dragged) {
    const m = { from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] || undefined };
    let mv;
    if (dragged) { mv = board.chess.move(m); if (mv) { board.last = [mv.from, mv.to]; board.render(); board.afterMove(mv); } }
    else mv = board.play(m);
    if (mv) (mv.captured ? sfx.capture(mv.captured) : sfx.move());
    return mv;
  }
  const pulse = (sq, cls, ms = 900) => { board.marks = { [sq]: cls }; board.render(); setTimeout(() => { if (board.marks[sq] === cls) { board.marks = {}; board.render(); } }, ms); };

  async function onUserMove(u, how = {}) {
    const p = T.puzzle; if (!p || !T.accepting) return;
    const gen = T.pgen, sess = T.gen, stale = () => gen !== T.pgen || sess !== T.gen;
    T.accepting = false; board.arrows = []; board.marks = {};
    if (p.kind === 'line') {
      const expect = p.solution[p.step];
      const before = board.chess.fen();
      const mv = playMove(u, how.dragged); if (!mv) { T.accepting = true; return; }
      const lastMove = p.step === p.solution.length - 1;
      if (u === expect || (expect && u.slice(0, 4) === expect.slice(0, 4) && !expect[4]) || (lastMove && board.chess.in_checkmate())) {
        p.step++; good(mv.to);
        if (p.step >= p.solution.length) return finishPuzzle(true);
        await wait(550); if (stale()) return;
        playMove(p.solution[p.step]); p.step++;
        if (p.step >= p.solution.length) return finishPuzzle(true);
        T.accepting = true; return;
      }
      await bad(mv.to); if (stale()) return;
      board.chess.load(before); board.last = null; board.render(); T.accepting = true; return;
    }
    if (p.kind === 'judge') {
      const before = board.chess.fen();
      const mv = playMove(u, how.dragged); if (!mv) { T.accepting = true; return; }
      stage.mood('think');
      const ok = await judge(p, u, before, board.chess);
      if (stale()) return;
      if (ok) { good(mv.to); return finishPuzzle(true); }
      await bad(mv.to); if (stale()) return;
      board.chess.load(before); board.last = null; board.render(); T.accepting = true; return;
    }
    if (p.kind === 'boss') {
      const mv = playMove(u, how.dragged); if (!mv) { T.accepting = true; return; }
      p.moves++; chalk(bossChalk(p));
      const c = board.chess;
      if (c.in_checkmate()) { stage.mood('sad'); sfx.win(); return finishPuzzle(true); }
      if (c.in_stalemate()) { stage.mood('laugh'); sfx.laugh(); say('stalemate', 3500); return finishPuzzle(false, 'stalemate'); }
      if (c.in_draw()) { stage.mood('laugh'); sfx.laugh(); say('laugh', 3000); return finishPuzzle(false, 'draw'); }
      if (p.moves >= p.maxMoves) { stage.mood('happy'); say('outOfMoves', 3000); return finishPuzzle(false, 'moves'); }
      stage.mood('think');
      const lines = await engine.analyse(c.fen(), { depth: 10, multipv: 1, movetime: 700 });
      await wait(350); if (stale()) return;
      const reply = playMove(lines[0].move);
      stage.mood(c.in_draw() ? 'happy' : 'idle');
      if (reply && reply.captured) { stage.mood('laugh'); sfx.laugh(); say('laugh', 2600); }
      if (c.in_draw()) { say('laugh', 3000); return finishPuzzle(false, 'draw'); }
      T.accepting = true;
    }
  }

  // Does this move hold up? Accept list, or Stockfish: no worse than the best by a small margin.
  async function judge(p, u, before, c) {
    if (p.avoid && u === p.avoid) return false;
    if (p.accept) return p.accept.includes(u);
    const lines = await p.analysis, best = lines[0];
    if (!best) return true;
    let val;
    const hit = lines.find(l => l.move === u);
    if (hit) val = hit.cp;
    else if (c.in_checkmate()) val = MATE;
    else if (c.in_draw()) val = 0;
    else {   // score the move from the same position at the same depth (never compare before- and after-move evals)
      const mine = await engine.analyse(before, { depth: 14, multipv: 1, movetime: 3000, searchmoves: [u] });
      val = mine.length ? mine[0].cp : 0;
    }
    p.bestMove = best.move;
    const tol = p.tol || (best.cp >= 700 ? 200 : 120);          // engine units: see engine.js
    return val >= best.cp - tol || (best.cp >= MATE - 50 && val >= MATE - 50);
  }

  function good(sq) {
    sfx.right(); pulse(sq, 'good');
    stage.mood(Math.random() < 0.5 ? 'happy' : 'slowblink', 1500); say('right', 1600);
  }
  async function bad(sq) {
    const p = T.puzzle; p.firstTry = false;
    sfx.wrong(); pulse(sq, 'bad', 1000);
    const r = Math.random();
    if (r < 0.4) { stage.mood('laugh', 1600); sfx.laugh(); say('laugh', 1800); }
    else if (r < 0.65) { stage.mood('slap', 1300); setTimeout(() => { sfx.slap(); board.shake(); }, 480); say('wrong', 1800); }
    else { stage.mood('judge', 1500); say('wrong', 1800); }
    await wait(1100);
  }
  function finishPuzzle(solved, why) {
    const p = T.puzzle; T.accepting = false; p.done = true;
    buttons({ prev: T.prevHandler });
    T.resolve && T.resolve({ solved, firstTry: solved && p.firstTry, moves: p.moves, why });
  }

  // Hint: first press marks the piece to move; second press (Show answer) draws the arrow.
  async function bestFor(p) {
    if (p.kind === 'line') return p.solution[p.step];
    if (p.kind === 'judge') return p.accept ? p.accept[0] : p.hint || ((await p.analysis)[0] || {}).move;
    const lines = await engine.analyse(board.chess.fen(), { depth: 14, multipv: 1, movetime: 1500 });
    return lines[0] && lines[0].move;
  }
  ui.hint.onclick = async () => {
    const p = T.puzzle; if (!p || !T.accepting) return;
    const u = await bestFor(p); if (!u) return;
    p.hints++; if (p.kind !== 'boss') p.firstTry = false;
    stage.mood('think', 1500); say('hint', 1800);
    if (p.kind === 'boss') board.setDecor({ arrows: [{ from: u.slice(0, 2), to: u.slice(2, 4), color: 'hint' }] });
    else board.setDecor({ marks: { [u.slice(0, 2)]: 'hint' } });
  };
  ui.answer.onclick = async () => {
    const p = T.puzzle; if (!p || !T.accepting) return;
    const u = await bestFor(p); if (!u) return;
    p.firstTry = false; stage.mood('judge', 1500); say('answer', 1800);
    board.setDecor({ arrows: [{ from: u.slice(0, 2), to: u.slice(2, 4), color: 'hint' }], marks: { [u.slice(0, 2)]: 'hint' } });
  };

  // ---------- results card ----------
  function results({ title, stars = null, lines = [], buttons: btns = [] }) {
    const box = $('#tresult');
    box.querySelector('h2').textContent = title;
    box.querySelector('.stars').innerHTML = stars == null ? '' : [0, 1, 2].map(i => `<span class="star ${i < stars ? 'on' : ''}" style="animation-delay:${0.25 + i * 0.18}s">★</span>`).join('');
    box.querySelector('p').innerHTML = lines.join('<br>');
    const row = box.querySelector('.row'); row.innerHTML = '';
    btns.forEach(b => { const el = document.createElement('button'); el.textContent = b.label; if (b.primary) el.className = 'primary'; el.onclick = b.go; row.appendChild(el); });
    box.classList.remove('hidden');
    if (stars) for (let i = 0; i < stars; i++) sfx.star(i);
    if (stars === 3) setTimeout(() => Core.confetti(box.querySelector('.confetti')), 700);
  }

  // ---------- Academy lesson ----------
  async function lesson(id) {
    const unit = Academy.byId(id); if (!unit) return;
    await loadData(); await engineReady;
    open(unit.title, unit.tier, 'wizard', 'Professor Gus', 'lesson');
    ui.sub.textContent = unit.tier; T.unit = unit;
    T.prevHandler = () => { T.gen++; engine.stop(); Home.show('academy'); };
    let i = 0;
    const show = () => {
      const st = unit.steps[i], prevFen = board.chess.fen();
      T.mode = 'lesson'; T.lessonText = st.text; T.puzzle = null; T.side = new Chess(st.fen).turn();
      board.chess = new Chess(st.fen); board.orientation = st.orient || 'w';
      board.anim = i > 0 ? slideBetween(prevFen, st.fen) : null;
      board.last = null; board.sel = null; T.accepting = false;
      board.setDecor({ arrows: st.arrows || [], marks: st.marks || {} });
      chalk(`<div class="step-n">Lesson ${i + 1} of ${unit.steps.length}</div>${st.text}`, 'lesson');
      dots(unit.steps.map((_, k) => (k < i ? true : null)), i);
      stage.mood(i === 0 ? 'happy' : Math.random() < 0.5 ? 'think' : 'idle', 1600);
      if (i === 0) say('lesson', 2600);
      buttons({ prev: () => { if (i > 0) { i--; show(); } else T.prevHandler(); },
                next: { label: i < unit.steps.length - 1 ? 'Next' : unit.drills.boss ? 'Fight the boss' : 'Start the drills', go: () => {
                  if (i < unit.steps.length - 1) { i++; show(); } else drills(unit); } } });
    };
    show();
  }

  // If exactly one piece moved between two lesson positions, slide it instead of jumping.
  function slideBetween(a, b) {
    const ca = new Chess(a), cb = new Chess(b), gone = [], came = [];
    for (const f of 'abcdefgh') for (let r = 1; r <= 8; r++) {
      const sq = f + r, pa = ca.get(sq), pb = cb.get(sq);
      const same = pa && pb && pa.type === pb.type && pa.color === pb.color;
      if (pa && !same) gone.push({ sq, p: pa });
      if (pb && !same) came.push({ sq, p: pb });
    }
    if (came.length === 1 && gone.length >= 1 && gone.length <= 2) {
      const from = gone.find(g => g.p.type === came[0].p.type && g.p.color === came[0].p.color);
      if (from) return [{ from: from.sq, to: came[0].sq }];
    }
    return null;
  }

  async function drills(unit) {
    const d = unit.drills, gen = T.gen;
    T.mode = d.boss ? 'boss' : 'drill'; T.lessonText = null;
    T.prevHandler = () => { T.gen++; engine.stop(); Home.show('academy'); };
    if (d.boss) return boss(unit);
    let list;
    if (d.theme) list = choosePuzzles(d.count, { theme: d.theme, target: Math.max(450, Progress.data.puzzleRating - 100) });
    else list = d.hand.map(h => ({ kind: 'judge', fen: h.fen, accept: h.accept || null, tol: h.tol, prompt: h.prompt, why: h.why }));
    const res = list.map(() => null);
    for (let k = 0; k < list.length; k++) {
      dots(res, k);
      const p = list[k];
      const prompt = p.prompt ? `<b>${sideName(new Chess(p.fen).turn())} to move.</b> ${p.prompt}`
                              : `<b>Drill ${k + 1} of ${list.length}.</b> ${sideName(new Chess(p.fen).turn() === 'w' ? 'b' : 'w')} to move. ${themePrompt(d.theme)}`;
      const r = await runPuzzle(p, prompt);
      if (gen !== T.gen) return;
      res[k] = r.firstTry;
      if (p.kind === 'line') recordPuzzle(p, r.firstTry);
      dots(res, k + 1);
      if (p.why) chalk(`${r.firstTry ? '<b>Correct!</b> ' : ''}${p.why}`, 'why');
      await waitNext(k < list.length - 1 ? 'Next drill' : 'See results', p.why ? 0 : 900);
      if (gen !== T.gen) return;
    }
    const firstTries = res.filter(Boolean).length, n = res.length;
    const stars = firstTries === n ? 3 : firstTries >= n - 1 ? 2 : firstTries >= Math.ceil(n * 0.6) ? 1 : 0;
    finishUnit(unit, stars, [`${firstTries} of ${n} on the first try.`]);
  }
  function themePrompt(theme) {
    return { hangingPiece: 'Something is hanging. Grab it.', mateIn1: 'Checkmate in one move.', fork: 'Find the fork.',
             pin: 'Use the pin.', skewer: 'Find the skewer.', discoveredAttack: 'Find the discovered attack.',
             backRankMate: 'Their back rank is weak.', capturingDefender: 'Remove the defender.', mateIn2: 'Checkmate in two moves.' }[theme]
           || 'Find the best move.';
  }
  // Wait for the Next button (or auto-advance after ms when ms > 0).
  function waitNext(label, ms) {
    return new Promise(res => {
      let done = false; const go = () => { if (!done) { done = true; res(); } };
      buttons({ next: { label, go }, prev: T.prevHandler });
      if (ms) setTimeout(go, ms);
    });
  }

  async function boss(unit) {
    const b = unit.drills.boss, look = LOOK[b.defender] || 'wizard';
    stage.setCat(look, b.defender, 'Boss');
    T.coach = look; Coach.refreshAll();
    const p = { kind: 'boss', fen: b.fen, maxMoves: b.maxMoves, stars: b.stars };
    stage.say(`${b.defender} defends. Checkmate me in ${b.maxMoves} moves or less.`, 4000);
    const r = await runPuzzle(p, bossChalk({ ...p, moves: 0 }));
    if (!r) return;
    const stars = r.solved ? (r.moves <= b.stars[0] ? 3 : r.moves <= b.stars[1] ? 2 : 1) : 0;
    const why = { stalemate: 'Stalemate: he had no moves but was not in check. That is a draw.',
                  moves: `Out of moves (${b.maxMoves}).`, draw: 'The game ended in a draw.' }[r.why];
    finishUnit(unit, stars, r.solved ? [`Checkmate in ${r.moves} moves.`, `3 stars: ${b.stars[0]} moves or fewer.`] : [why]);
  }
  const bossChalk = p => `<b>Checkmate the king.</b> Moves used: <b>${p.moves}</b> of ${p.maxMoves}.`;

  function finishUnit(unit, stars, lines) {
    const prev = Progress.data.academy[unit.id] || { stars: 0, tries: 0 };
    Progress.data.academy[unit.id] = { stars: Math.max(prev.stars, stars), tries: prev.tries + 1, last: today() };
    Progress.save();
    const units = Academy.UNITS, nextUnit = units[units.indexOf(unit) + 1];
    stage.mood(stars === 3 ? 'happy' : stars ? 'slowblink' : 'laugh', 2500);
    say(stars === 3 ? 'perfect' : stars ? 'passed' : 'failed', 3500);
    results({ title: stars ? unit.title + ' complete!' : 'So close', stars, lines,
      buttons: [{ label: 'Try again', go: () => lesson(unit.id), primary: !stars },
                ...(stars && nextUnit ? [{ label: 'Next: ' + nextUnit.title, go: () => lesson(nextUnit.id), primary: true }] : []),
                { label: 'Academy', go: () => Home.show('academy') }] });
  }

  // ---------- Daily puzzles + practice ----------
  async function daily() {
    await loadData(); await engineReady;
    const d = Progress.data;
    if (!d.daily || d.daily.date !== today()) {
      const due = Object.entries(d.review).filter(([, r]) => r.due <= today()).map(([id]) => id).slice(0, 2);
      const fresh = choosePuzzles(5 - due.length, { exclude: due }).map(p => p.id);
      d.daily = { date: today(), ids: [...due, ...fresh], done: [] };
      Progress.save();
    }
    open('Daily Puzzles', '', 'bowie', 'King Bowie', 'daily');
    ui.sub.textContent = `Puzzle rating ${d.puzzleRating}`;
    T.prevHandler = () => { T.gen++; engine.stop(); Home.show('puzzles'); };
    say('daily', 3000);
    const gen = T.gen, ids = d.daily.ids;
    const res = ids.map(id => (d.daily.done.includes(id) ? true : null));
    for (let k = 0; k < ids.length; k++) {
      if (d.daily.done.includes(ids[k])) continue;
      const p = byId(ids[k]); if (!p) { d.daily.done.push(ids[k]); continue; }
      dots(res, k);
      const review = d.review[p.id] ? ' <span class="tag">Review</span>' : '';
      const r = await runPuzzle(p, `<b>Puzzle ${k + 1} of ${ids.length}.</b>${review} ${sideName(new Chess(p.fen).turn() === 'w' ? 'b' : 'w')} to move.`);
      if (gen !== T.gen) return;
      recordPuzzle(p, r.firstTry); res[k] = r.firstTry;
      d.daily.done.push(p.id); Progress.save(); dots(res, k + 1);
      ui.sub.textContent = `Puzzle rating ${d.puzzleRating}`;
      await waitNext(k < ids.length - 1 ? 'Next puzzle' : 'Finish', 900);
      if (gen !== T.gen) return;
    }
    const streak = bumpStreak();
    stage.mood('happy', 2500); say('dailyDone', 3500);
    results({ title: 'Daily puzzles done!', lines: [`Streak: <b>${streak.count} day${streak.count === 1 ? '' : 's'}</b> 🔥`, `Puzzle rating: <b>${d.puzzleRating}</b>`],
      buttons: [{ label: 'Keep going', go: practice, primary: true }, { label: 'Home', go: () => Home.show('puzzles') }] });
  }
  function bumpStreak() {
    Progress.data.streak = Core.nextStreak(Progress.data.streak, today());
    Progress.save(); return Progress.data.streak;
  }
  async function practice() {
    await loadData(); await engineReady;
    open('Practice', '', 'bowie', 'King Bowie', 'practice');
    T.prevHandler = () => { T.gen++; engine.stop(); Home.show('puzzles'); };
    const gen = T.gen; let n = 0, streak = 0;
    while (gen === T.gen) {
      const [p] = choosePuzzles(1); if (!p) break;
      n++; ui.sub.textContent = `Puzzle rating ${Progress.data.puzzleRating} · in a row: ${streak}`;
      const r = await runPuzzle(p, `<b>Puzzle ${n}.</b> ${sideName(new Chess(p.fen).turn() === 'w' ? 'b' : 'w')} to move.`);
      if (gen !== T.gen) return;
      recordPuzzle(p, r.firstTry); streak = r.firstTry ? streak + 1 : 0;
      ui.sub.textContent = `Puzzle rating ${Progress.data.puzzleRating} · in a row: ${streak}`;
      await waitNext('Next puzzle', 900);
    }
  }

  // ---------- Homework: the positions where you went wrong in your own games ----------
  // Engine units are inflated (see engine.js), so describe the damage in pieces, not numbers.
  const lossWords = loss => loss < 250 ? 'about a pawn' : loss < 400 ? 'about two pawns' : loss < 700 ? "about a knight or bishop's worth"
                            : loss < 1000 ? "about a rook's worth" : "about a queen's worth, or the game";
  async function homeworkItems() {
    let games = [];
    try { games = await (await fetch('/api/games')).json(); } catch {}
    const names = GusEngine.PERSONAS, hw = Progress.data.homework, items = [];
    games.forEach(g => (g.review || []).forEach(r => {
      const key = `${g.file}#${r.ply}`, st = hw[key] || { box: 0, due: null, done: false };
      items.push({ key, ...r, opponent: (names[g.opponent] || {}).name || g.opponent, date: g.date, state: st,
                   due: !st.done && (!st.due || st.due <= today()) });
    }));
    return items;
  }
  async function homework() {
    await engineReady;
    const all = await homeworkItems(), list = all.filter(i => i.due).slice(0, 5);
    open('Homework', '', 'lazy', 'Lazy Gus', 'homework');
    T.prevHandler = () => { T.gen++; engine.stop(); Home.show('homework'); };
    if (!list.length) { stage.mood('sleep'); say('homeworkDone', 4000); chalk('Nothing due. Play a game and Gus will find you more homework.'); buttons({ prev: T.prevHandler }); return; }
    say('homework', 3000);
    const gen = T.gen, res = list.map(() => null);
    for (let k = 0; k < list.length; k++) {
      const it = list[k]; dots(res, k);
      const when = new Date(it.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      ui.sub.textContent = `From your game vs ${it.opponent}, ${when}`;
      const p = { kind: 'judge', fen: it.fen, accept: null, avoid: it.played, hint: it.best };
      p.analysis = null;
      const r = await runPuzzle(p, `<b>You played ${it.san}${it.kind === 'blunder' ? '??' : '?'} here.</b> Find something better.`);
      if (gen !== T.gen) return;
      res[k] = r.firstTry;
      const st = Progress.data.homework[it.key] || { box: 0 };
      if (r.firstTry) { st.box = (st.box || 0) + 1; st.done = st.box >= 3; st.due = addDays(today(), [1, 3, 7][Math.min(st.box, 2)]); }
      else { st.box = 0; st.done = false; st.due = addDays(today(), 1); }
      Progress.data.homework[it.key] = st; Progress.save();
      dots(res, k + 1);
      const best = sanOf(it.fen, it.best);
      chalk(`${r.firstTry ? '<b>Good.</b> ' : ''}Gus's pick was <b>${best}</b>. In the game, ${it.san} cost you ${lossWords(it.loss)}.`, 'why');
      board.setDecor({ arrows: [{ from: it.best.slice(0, 2), to: it.best.slice(2, 4), color: 'good' }, { from: it.played.slice(0, 2), to: it.played.slice(2, 4), color: 'bad' }] });
      await waitNext(k < list.length - 1 ? 'Next' : 'Finish', 0);
      if (gen !== T.gen) return;
    }
    const n = res.filter(Boolean).length;
    stage.mood('eat', 3000); say('homeworkDone', 3500);
    results({ title: 'Homework done', lines: [`${n} of ${res.length} on the first try.`, 'Missed ones come back tomorrow. Solved ones come back later to make sure they stick.'],
      buttons: [{ label: 'Home', go: () => Home.show('homework'), primary: true }] });
  }

  // A position handed over from the offline app (its "Ask Claude Gus" button): just the board and Ask Gus.
  const NAMES = { kitten: 'Kitten Gus', lazy: 'Lazy Gus', wizard: 'Wizard Gus', bowie: 'King Bowie' };
  function position(fen, coach = 'wizard') {
    if (!NAMES[coach]) coach = 'wizard';
    open('Ask about your game', '', coach, NAMES[coach], 'position');
    if (!board.chess.load(fen)) return;
    T.side = board.chess.turn(); T.accepting = false; board.orientation = T.side; board.render();
    chalk('Your position from the offline app. Ask anything about it.');
    setTimeout(() => Coach.open(), 400);
  }

  Coach.mount(root, {
    stage, board,
    getCtx: () => ({ mode: T.mode, persona: T.coach, side: T.side, board, unit: T.unit, lessonText: T.lessonText,
                     prompt: T.prompt, puzzle: T.puzzle }),
  });

  window.Trainer = { lesson, daily, practice, homework, homeworkItems, loadData, position, stop: () => { T.gen++; T.pgen++; engine.stop(); },
    // Test and coaching hooks: see the current puzzle, feed a move exactly as a click would.
    peek: () => T.puzzle && { kind: T.puzzle.kind, fen: board.chess.fen(), step: T.puzzle.step, solution: T.puzzle.solution,
                             hint: T.puzzle.hint, avoid: T.puzzle.avoid, accepting: T.accepting },
    input: u => onUserMove(u, {}) };
})();
