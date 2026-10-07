// Gusmaster 3000 -- Ask Gus: the chat drawer, and the chess facts Gus is allowed to talk about.
// Language models are bad at calculating chess, so every fact comes from chess.js and Stockfish here;
// Claude (via /api/ask) only explains them, in character.
(function () {
  const { $, store, engine, wait, pick } = Core;
  const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const NAME = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
  const SIDE = { w: 'White', b: 'Black' };
  const CATNAME = { kitten: 'Kitten Gus', lazy: 'Lazy Gus', wizard: 'Wizard Gus', bowie: 'King Bowie' };
  const THEMES = { fork: 'a fork', pin: 'a pin', skewer: 'a skewer', discoveredAttack: 'a discovered attack', hangingPiece: 'a piece left hanging',
    mateIn1: 'checkmate in one', mateIn2: 'checkmate in two', backRankMate: 'a back-rank mate', capturingDefender: 'removing the defender',
    trappedPiece: 'a trapped piece', doubleCheck: 'a double check', promotion: 'pawn promotion' };
  const WHY = { best: 'its honest best move', loose: 'a slightly lazy choice, not its best', random: 'a total accident: it was not paying attention',
    snack: 'it was distracted by a treat (on purpose, Lazy Gus does this)', grab: 'it spotted free material and pounced', mate: 'it saw checkmate' };

  // ---------- chess facts ----------
  const flip = (fen, turn) => { const f = fen.split(' '); f[1] = turn; f[3] = '-'; return f.join(' '); };
  function plain(fen, u) {
    const c = new Chess(fen), m = c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] || 'q' });
    if (!m) return u;
    const what = m.flags.includes('k') ? 'castles kingside' : m.flags.includes('q') ? 'castles queenside'
      : `${NAME[m.piece]} ${m.from} to ${m.to}${m.captured ? ', capturing the ' + NAME[m.captured] : ''}${m.promotion ? ', promoting to a ' + NAME[m.promotion] : ''}`;
    return `${m.san} (${what}${c.in_checkmate() ? ', CHECKMATE' : c.in_check() ? ', check' : ''})`;
  }
  function pvSan(fen, pv, n = 5) {
    const c = new Chess(fen), out = [];
    for (const u of pv.slice(0, n)) { const m = c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] || 'q' }); if (!m) break; out.push(m.san); }
    return out.join(' ');
  }
  // Engine units (see engine.js): pawn about 85, knight about 470, rook 630, queen 1280.
  function evalWords(cp, mate, forSide) {
    const who = SIDE[forSide], other = SIDE[forSide === 'w' ? 'b' : 'w'];
    if (mate != null) return mate > 0 ? `${who} has checkmate in ${mate}` : `${other} has checkmate in ${-mate}`;
    const a = Math.abs(cp), lead = cp > 0 ? who : other;
    if (a < 70) return 'about equal';
    if (a < 220) return `slightly better for ${lead}`;
    if (a < 420) return `better for ${lead} (worth about a pawn or two)`;
    if (a < 800) return `${lead} is clearly ahead (worth about a knight or bishop)`;
    if (a < 1500) return `${lead} is winning (worth about a rook or more)`;
    return `${lead} is completely winning`;
  }
  const adj = cp => cp - 80;        // scores include about +80 for the side to move; take it out before describing
  function material(c) {
    const m = { w: 0, b: 0 };
    c.board().flat().forEach(p => { if (p) m[p.color] += VAL[p.type]; });
    return m;
  }
  // Pieces of `color` that the other side attacks and that are not safely defended.
  function hanging(c, color) {
    const enemy = color === 'w' ? 'b' : 'w', out = [];
    const sqs = []; for (const f of 'abcdefgh') for (let r = 1; r <= 8; r++) sqs.push(f + r);
    const att = new Chess(flip(c.fen(), enemy));
    for (const sq of sqs) {
      const p = c.get(sq); if (!p || p.color !== color || p.type === 'k') continue;
      const attackers = att.moves({ verbose: true }).filter(m => m.to === sq && m.captured);
      if (!attackers.length) continue;
      const d = new Chess(flip(c.fen(), color)); d.remove(sq); d.put({ type: 'q', color: enemy }, sq);
      const defended = d.moves({ verbose: true }).some(m => m.to === sq && m.captured);
      const cheapest = Math.min(...attackers.map(m => VAL[m.piece] || 0.5));
      if (!defended || cheapest < VAL[p.type])
        out.push(`${NAME[p.type]} on ${sq} (attacked by the ${attackers.map(m => NAME[m.piece] + ' on ' + m.from).join(' and ')}${defended ? ', defended but the attacker is cheaper' : ', not defended'})`);
    }
    return out;
  }
  function movesText(c, from = 0) {
    const h = c.history(); let s = '';
    for (let i = from - (from % 2); i < h.length; i += 2) s += `${i / 2 + 1}. ${h[i]}${h[i + 1] ? ' ' + h[i + 1] : ''} `;
    return s.trim() || '(none yet)';
  }

  async function positionFacts(c, jim) {
    const fen = c.fen(), turn = c.turn(), lines = [];
    lines.push(`Board (FEN): ${fen}`, 'Board picture (uppercase = White, lowercase = Black):', c.ascii());
    const mat = material(c), diff = mat.w - mat.b;
    lines.push(`Material: White ${mat.w}, Black ${mat.b}${diff ? ` (${diff > 0 ? 'White' : 'Black'} is up ${Math.abs(diff)})` : ' (even)'}.`);
    if (c.in_checkmate()) { lines.push(`CHECKMATE. ${SIDE[turn]} is checkmated.`); return lines.join('\n'); }
    if (c.in_stalemate()) { lines.push('STALEMATE: the side to move has no legal move and is not in check. Draw.'); return lines.join('\n'); }
    if (c.in_check()) lines.push(`${SIDE[turn]} is in CHECK right now.`);
    const res = await engine.analyse(fen, { depth: 12, multipv: 3, movetime: 4000 });
    if (res.length) {
      lines.push(`Engine score: ${evalWords(adj(res[0].cp), res[0].mate, turn)}.`);
      lines.push(`${SIDE[turn]} to move. Engine's best moves for ${SIDE[turn]}:`);
      res.forEach((l, i) => lines.push(`  ${i + 1}) ${plain(fen, l.move)}. Likely continuation: ${pvSan(fen, l.pv)}. Result: ${evalWords(adj(l.cp), l.mate, turn)}.`));
    }
    if (!c.in_check()) {
      const other = turn === 'w' ? 'b' : 'w', tf = flip(fen, other);
      const t = await engine.analyse(tf, { depth: 10, multipv: 1, movetime: 2500 });
      if (t.length && res.length) {
        // How much would a free move gain the other side? (both scores carry about +80 for the side to move)
        const gain = t[0].mate != null && t[0].mate > 0 ? 9999 : (t[0].cp - 80) + (res[0].cp - 80);
        lines.push(gain >= 250
          ? `REAL THREAT: ${SIDE[other]} is threatening ${plain(tf, t[0].move)}, which would win something (${gain >= 9000 ? 'it is checkmate' : gain >= 700 ? 'worth about a piece or more' : 'worth about a pawn or two'}). ${SIDE[turn]} should deal with it.`
          : `No real threat right now. (Given a free move, ${SIDE[other]} would quietly play ${plain(tf, t[0].move)}.)`);
      }
    }
    for (const side of ['w', 'b']) {
      const h = hanging(c, side);
      lines.push(`${side === jim ? "Jim's" : "The cat's"} pieces (${SIDE[side]}) in danger: ${h.length ? h.join('; ') : 'none'}.`);
    }
    lines.push(`Legal moves for ${SIDE[turn]}: ${c.moves().join(', ')}.`);
    return lines.join('\n');
  }

  // Build the full facts sheet for whatever screen Jim is on.
  async function buildFacts(ctx) {
    const c = ctx.board.chess, out = [];
    if (ctx.mode === 'game') {
      out.push(`MODE: a game. Jim plays ${SIDE[ctx.human]} against ${Cats.nameFor(ctx.persona, CATNAME[ctx.persona])}. ${ctx.over ? 'The game is OVER: ' + ctx.overText : c.turn() === ctx.human ? "It is Jim's turn." : "It is the cat's turn."}`);
      out.push(`Moves so far: ${movesText(c)}`);
      const h = c.history({ verbose: true }), jimLast = [...h].reverse().find(m => m.color === ctx.human), catLast = [...h].reverse().find(m => m.color !== ctx.human);
      if (jimLast) {
        const rv = [...(ctx.review || [])].reverse().find(r => r.san === jimLast.san);
        const gr = ctx.grades[h.lastIndexOf(jimLast)];
        out.push(`Jim's last move: ${jimLast.san}. Engine grade: ${gr || 'not graded'}${rv ? `. Better was ${plain(rv.fen, rv.best)}` : ''}.`);
      }
      if (catLast) out.push(`The cat's last move: ${catLast.san}. Why the cat chose it: ${WHY[ctx.lastWhy] || 'unknown'}.`);
    } else {
      out.push(`MODE: training (${ctx.mode}). Coach: ${Cats.nameFor(ctx.persona, CATNAME[ctx.persona])}. Jim plays ${SIDE[ctx.side]}.`);
      if (ctx.unit) out.push(`Academy lesson: "${ctx.unit.title}" (${ctx.unit.blurb})`);
      if (ctx.lessonText) out.push(`The chalkboard currently says: "${ctx.lessonText}"`);
      if (ctx.prompt) out.push(`The task shown to Jim: "${ctx.prompt.replace(/<[^>]+>/g, '')}"`);
      const p = ctx.puzzle;
      if (p && p.kind === 'line') {
        const rest = p.solution.slice(p.step);
        out.push(`Puzzle themes: ${(p.themes || '').split(' ').map(t => THEMES[t]).filter(Boolean).join(', ') || 'tactics'}. Puzzle rating ${p.rating}.`);
        out.push(p.done ? `SOLVED. The solution was: ${pvSan(p.fen, p.solution)}.`
          : `NOT SOLVED YET. Do not reveal unless Jim explicitly asks for the answer. The solution from here: ${rest.length ? plain(c.fen(), rest[0]) + (rest.length > 1 ? ', continuing ' + pvSan(c.fen(), rest) : '') : '(finished)'}.`);
      }
      if (p && p.kind === 'judge' && p.avoid) out.push(`Homework: in a real game Jim played ${plain(p.fen, p.avoid)} here, which was a mistake. ${p.done ? 'He has now solved it.' : 'He is trying to find a better move. Do not just give it away unless he asks.'}`);
      if (p && p.kind === 'judge' && p.accept) out.push(`Accepted answers: ${p.accept.map(u => plain(p.fen, u)).join('; ')}.`);
      if (p && p.kind === 'boss') out.push(`Boss fight: checkmate the lone king within ${p.maxMoves} moves. Moves used: ${p.moves}. Stalemate is a draw and a loss.`);
    }
    out.push(await positionFacts(c, ctx.mode === 'game' ? ctx.human : ctx.side));
    return out.join('\n');
  }

  // Facts for a whole-game review.
  async function reviewFacts(ctx) {
    const c = ctx.board.chess, h = c.history({ verbose: true });
    const out = [`MODE: post-game review. Jim played ${SIDE[ctx.human]} against ${Cats.nameFor(ctx.persona, CATNAME[ctx.persona])}. Result: ${ctx.overText}`,
                 `All moves: ${movesText(c)}`, `Total moves: ${Math.ceil(h.length / 2)}.`];
    const rv = ctx.review || [];
    out.push(rv.length ? "Jim's mistakes, from the engine, in order:" : 'The engine flagged no mistakes or blunders by Jim.');
    rv.forEach(r => out.push(`  Move ${Math.floor(r.ply / 2) + 1}: Jim played ${r.san} (${r.kind}). Better was ${plain(r.fen, r.best)}. Cost: ${r.loss >= 700 ? 'a rook or more' : r.loss >= 400 ? 'about a piece' : 'about a pawn or two'}.`));
    const good = ctx.grades.filter(g => g === 'best').length;
    out.push(`Jim played the engine's top move ${good} times.`);
    out.push('Academy lessons Jim can take (recommend the one that fits his worst mistake): ' + Academy.UNITS.map(u => `"${u.title}" (${u.blurb})`).join('; '));
    out.push('Final position:', c.ascii());
    return out.join('\n');
  }

  // ---------- the drawer ----------
  const WAITING = {
    wizard: ['Consulting the orb...', 'The orb is buffering...', 'Reading the ancient scrolls...', 'Stroking beard. I have no beard...'],
    lazy: ['*chewing* hold on...', 'Thinking. Slowly. On purpose.', 'Finishing this Churu first...', 'Five more minutes...'],
    kitten: ['Ooh ooh let me think!', 'Thinking really hard!!', 'Wait, which one is the horsey?', 'Asking my tail...'],
    bowie: ['Checking my reflection for the answer...', 'Fluffing my ruff. One moment.', 'Darling, genius takes time.', 'Consulting the crown...'],
  };
  const CHIPS = {
    game: ['What should I do?', 'Why did you play that?', 'Was my last move bad?', 'What are you threatening?', 'Explain this position'],
    over: ['Review my game', 'Where did I go wrong?', 'What should I practice?'],
    puzzle: ['Give me a hint', 'What is the idea here?', 'Why is that the answer?'],
    lesson: ['Explain that again, simpler', 'Why does that work?', 'Show me another example'],
    homework: ['Why was my move bad?', 'Give me a hint', 'What was I missing?'],
    boss: ['How do I trap the king?', 'Give me a hint', 'What is stalemate again?'],
  };

  let cur = null;                 // { section, stage, board, getCtx, onOpen, onClose }
  let history = [], busy = false;
  const brain = () => store.get('brain', 'opus');

  const mounted = [];
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && cur) closeDrawer(); });
  // Keep every "Ask ..." button named after whoever is on stage right now.
  function refreshAll() { mounted.forEach(m => { try { refreshButton(m); } catch {} }); }

  function mount(section, opts) {
    const panel = section.querySelector('.panel');
    const btn = document.createElement('button'); btn.className = 'askbtn'; btn.innerHTML = '💬 <span>Ask Gus</span>';
    panel.insertBefore(btn, panel.firstChild);
    const drawer = document.createElement('div'); drawer.className = 'askdrawer hidden';
    drawer.innerHTML = `<div class="ask-head"><b class="ask-title">Ask Gus</b><button class="ask-close" title="Close">✕</button></div>
      <div class="ask-msgs"></div><div class="ask-chips"></div>
      <form class="ask-form"><textarea rows="2" placeholder="Ask anything. Dumb questions welcome. Judged, but welcome."></textarea><button class="primary" type="submit">Ask</button></form>
      <div class="ask-foot"><span>Brain:</span><button type="button" data-b="opus">Funniest</button><button type="button" data-b="sonnet">Faster</button>
        <span class="sp"></span><button type="button" class="voicebtn">🔇 Voice off</button></div>`;
    section.appendChild(drawer);
    const self = { section, drawer, btn, ...opts };
    mounted.push(self);
    // Clicking the cat opens the chat too.
    const box = section.querySelector('.catbox'); box.title = 'Ask me something'; box.style.cursor = 'pointer';
    box.addEventListener('click', () => (cur === self ? null : openDrawer(self)));
    btn.onclick = () => openDrawer(self);
    drawer.querySelector('.ask-close').onclick = () => closeDrawer();
    const ta = drawer.querySelector('textarea');
    drawer.querySelector('.ask-form').onsubmit = e => { e.preventDefault(); const q = ta.value.trim(); if (q) { ta.value = ''; ask(q); } };
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); drawer.querySelector('.ask-form').requestSubmit(); } });
    drawer.querySelectorAll('.ask-foot [data-b]').forEach(b => b.onclick = () => { store.set('brain', b.dataset.b); paintBrain(self); });
    drawer.querySelector('.voicebtn').onclick = () => {
      Core.S.voice = !Core.S.voice; Core.saveSettings(); paintBrain(self);
      if (Core.S.voice) Core.speak(self.getCtx().persona, { kitten: 'Hi! I can talk now!', lazy: 'Great. Now I have to talk too.', wizard: 'The orb grants me a voice.', bowie: 'Finally, darling. A voice worthy of the crown.' }[self.getCtx().persona]);
      else speechSynthesis.cancel();
    };
    return self;
  }
  function paintBrain(self) {
    self.drawer.querySelectorAll('.ask-foot [data-b]').forEach(b => b.classList.toggle('on', b.dataset.b === brain()));
    const v = self.drawer.querySelector('.voicebtn'); v.textContent = Core.S.voice ? '🔊 Voice on' : '🔇 Voice off'; v.classList.toggle('on', Core.S.voice);
  }
  function label(self) { const ctx = self.getCtx(); return 'Ask ' + (Cats.nameFor(ctx.persona, CATNAME[ctx.persona]) || 'Gus'); }
  function refreshButton(self) { self.btn.querySelector('span').textContent = label(self); }

  function openDrawer(self) {
    if (cur && cur !== self) closeDrawer();
    cur = self; refreshButton(self);
    self.drawer.querySelector('.ask-title').textContent = label(self);
    paintBrain(self); renderChips(); self.drawer.classList.remove('hidden'); self.section.classList.add('asking');
    requestAnimationFrame(() => self.drawer.classList.add('open'));
    self.onOpen && self.onOpen();
    if (!self.drawer.querySelector('.ask-msgs').children.length) addMsg('cat', greeting(self.getCtx()), null);
    setTimeout(() => self.drawer.querySelector('textarea').focus(), 250);
  }
  function closeDrawer() {
    if (!cur) return;
    const self = cur; cur = null;
    self.drawer.classList.remove('open'); self.section.classList.remove('asking'); setTimeout(() => self.drawer.classList.add('hidden'), 250);
    self.onClose && self.onClose();
  }
  function greeting(ctx) {
    return { kitten: 'Hi hi hi! Ask me anything! I know SO much chess. (I know some chess.)', lazy: 'Ask. Quickly. I have a nap scheduled.',
             wizard: 'Speak, student. No question is too foolish. Some come close.', bowie: 'Questions, darling? Make them interesting.' }[ctx.persona]
           || 'Ask me anything.';
  }
  function chipSet(ctx) {
    if (ctx.mode === 'game') return ctx.over ? CHIPS.over : CHIPS.game;
    if (ctx.mode === 'lesson') return CHIPS.lesson;
    if (ctx.mode === 'homework') return CHIPS.homework;
    if (ctx.mode === 'position') return ['What should I do?', 'What is my opponent threatening?', 'Explain this position'];
    if (ctx.puzzle && ctx.puzzle.kind === 'boss') return CHIPS.boss;
    return CHIPS.puzzle;
  }
  function renderChips() {
    if (!cur) return;
    const box = cur.drawer.querySelector('.ask-chips');
    box.innerHTML = chipSet(cur.getCtx()).map(q => `<button type="button">${q}</button>`).join('');
    box.querySelectorAll('button').forEach(b => b.onclick = () => ask(b.textContent));
  }
  const esc = s => s.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
  const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>');
  function addMsg(who, text, say) {
    const box = cur.drawer.querySelector('.ask-msgs'), el = document.createElement('div');
    el.className = 'msg ' + who;
    el.innerHTML = who === 'jim' ? esc(text) : (say ? `<div class="say">${md(say)}</div>` : '') + (text ? `<div class="ans">${md(text)}</div>` : '');
    box.appendChild(el); box.scrollTop = box.scrollHeight;
    return el;
  }

  async function ask(question) {
    if (!cur || busy) return;
    const self = cur, ctx = self.getCtx();
    if (ctx.blocked) { addMsg('cat', ctx.blocked, null); return; }
    busy = true; self.drawer.classList.add('busy');
    addMsg('jim', question);
    const waitEl = addMsg('cat', '', null); waitEl.classList.add('waiting');
    const lines = WAITING[ctx.persona] || WAITING.wizard; let li = 0;
    const tick = () => { waitEl.innerHTML = `<div class="dots3"><i></i><i></i><i></i></div><div class="ans">${lines[li++ % lines.length]}</div>`; };
    tick(); const iv = setInterval(tick, 2400);
    self.stage.mood(ctx.persona === 'lazy' ? 'eat' : 'think'); self.stage.say(lines[0], 0, { silent: true });
    let reply;
    try {
      const review = ctx.mode === 'game' && ctx.over && /review|wrong|practice/i.test(question);
      const facts = review ? await reviewFacts(ctx) : await buildFacts(ctx);
      const r = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: Cats.artFor(ctx.persona), mode: review ? 'review' : ctx.mode, facts, question, history: history.slice(-3),
                               fen: ctx.board.chess.fen(), model: brain() }) });
      reply = await r.json();
      if (review && reply.ok) reply.showWorst = true;
    } catch (e) { reply = { ok: false, error: 'offline' }; }
    clearInterval(iv); waitEl.remove(); busy = false; self.drawer.classList.remove('busy');
    if (!reply.ok) {
      const msg = reply.error === 'busy' ? 'One question at a time. I am a cat, not an octopus.'
        : reply.error === 'timeout' ? 'I fell asleep thinking about it. Ask me again?'
        : 'The orb is offline. No wifi, no wisdom. (Ask Gus needs internet. Everything else works offline.)';
      addMsg('cat', '', msg); self.stage.mood('sleep', 3000); self.stage.say(msg, 4000); return;
    }
    history.push({ q: question, a: reply.say + ' ' + reply.answer });
    addMsg('cat', reply.answer, reply.say);
    self.stage.mood(reply.mood, 7000); self.stage.say(reply.say, 9000, { live: true });
    if (reply.mood === 'laugh') Core.sfx.laugh();
    if (reply.showWorst && ctx.review && ctx.review.length) showWorst(self, ctx);
    else { const safe = spoilerSafe(reply, ctx); self.board.setDecor({ arrows: safe.arrows, marks: safe.marks }); }
  }

  // Hard rule, not left to the model: in an unsolved puzzle or homework item, an arrow that draws the
  // answer is a spoiler. Drop it, unless Gus actually gave the answer in words (Jim asked for it).
  function spoilerSafe(reply, ctx) {
    const marks = Object.fromEntries((reply.marks || []).map(m => [m.square, m.color]));
    const p = ctx.puzzle;
    if (!p || p.done) return { arrows: reply.arrows, marks };
    let answer = null;
    if (p.kind === 'line') answer = p.solution[p.step];
    else if (p.kind === 'judge') answer = p.hint || (p.accept && p.accept[0]) || p.bestMove;
    if (!answer) return { arrows: reply.arrows, marks };
    const said = (() => { try { const ch = new Chess(ctx.board.chess.fen()); const m = ch.move({ from: answer.slice(0, 2), to: answer.slice(2, 4), promotion: answer[4] || 'q' });
                               return m && (reply.answer + ' ' + reply.say).includes(m.san); } catch { return false; } })();
    if (said) return { arrows: reply.arrows, marks };
    return { arrows: reply.arrows.filter(a => !(a.from === answer.slice(0, 2) && a.to === answer.slice(2, 4))), marks };
  }

  // Review: put the worst moment of the game on the board, with "you played" and "better was" arrows.
  function showWorst(self, ctx) {
    const worst = [...ctx.review].sort((a, b) => b.loss - a.loss)[0], b = self.board, finalFen = b.chess.fen();
    b.chess = new Chess(worst.fen); b.last = null;
    b.setDecor({ arrows: [{ from: worst.played.slice(0, 2), to: worst.played.slice(2, 4), color: 'bad' }, { from: worst.best.slice(0, 2), to: worst.best.slice(2, 4), color: 'good' }] });
    const box = cur.drawer.querySelector('.ask-chips');
    const back = document.createElement('button'); back.type = 'button'; back.className = 'chip-back';
    back.textContent = `Showing move ${Math.floor(worst.ply / 2) + 1}. Back to the final position`;
    back.onclick = () => { b.chess = new Chess(finalFen); b.setDecor({}); back.remove(); };
    box.prepend(back);
  }

  // reset: new game or session (clear the chat). newTopic: new puzzle (forget follow-ups, keep the chat on screen).
  function reset() { history = []; document.querySelectorAll('.askdrawer .ask-msgs').forEach(m => m.innerHTML = ''); }
  function newTopic() { history = []; if (cur) { renderChips(); refreshButton(cur); } }

  // The open chat's board and cat, for handing the position to the online Ask Gus.
  const context = () => { if (!cur) return null; const x = cur.getCtx(); return { fen: x.board.chess.fen(), persona: x.persona }; };
  window.Coach = { context, _spoilerSafe: spoilerSafe, refreshAll, mount, open: openDrawer, close: closeDrawer, ask, reset, newTopic, buildFacts, reviewFacts, isOpen: () => !!cur, refreshButton };
})();
