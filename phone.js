// Gusmaster 3000 on the phone. The phone builds have no Mac server, so this file answers the game's
// /api/* calls inside the page. Two builds use it (scripts/build-phone.mjs):
//   phone   (claude.ai artifact): progress in the artifact's database, Ask Gus through Claude
//   offline (installable web app): progress on the phone, works with no signal, Ask Gus is Pocket Gus,
//           plus an "Ask Claude Gus" button that hands the position to the phone build when online
//   cat voices -> the recorded George files shipped with the page (PHONE.voices)
// When Claude is not reachable, Pocket Gus answers from the same Stockfish facts, with no model at all.
// The build loads this before core.js and fills in window.PHONE.
(function () {
  const P = window.PHONE;
  const realFetch = window.fetch.bind(window);
  const reply = (o) => new Response(JSON.stringify(o), { headers: { 'Content-Type': 'application/json' } });
  const local = {
    get(k, d) { try { const v = localStorage.getItem('gm.phone.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('gm.phone.' + k, JSON.stringify(v)); } catch {} },
  };
  const use = name => (window.claude && claude.use ? claude.use(name).catch(() => null) : Promise.resolve(null));

  // ---------- storage ----------
  let dbp = null;
  const db = () => dbp || (dbp = use('db'));
  async function loadProgress() {
    const d = await db();
    if (d) {
      try { const s = await d.doc('gm/progress').get(); if (s.exists) return JSON.parse(s.data().json); } catch {}
    }
    return local.get('progress', {});
  }
  async function saveProgress(json) {
    local.set('progress', JSON.parse(json));
    const d = await db();
    if (d) await d.doc('gm/progress').set({ json, at: new Date().toISOString() }).catch(() => {});
  }
  async function listGames() {
    const d = await db();
    if (d) {
      try { const q = await d.collection('games').orderBy('date').get(); return q.docs.map(x => { const g = x.data(); delete g.pgn; return g; }); } catch {}
    }
    return local.get('games', []);
  }
  async function saveGame(g) {
    const d = new Date(), p2 = n => String(n).padStart(2, '0');
    const file = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}-${String(g.opponent || 'unknown').replace(/[^a-z0-9-]/gi, '')}`;
    const row = { file, date: d.toISOString(), opponent: g.opponent, color: g.color, result: g.result, outcome: g.outcome,
                  moves: g.moves, blunders: g.blunders, mistakes: g.mistakes, review: Array.isArray(g.review) ? g.review : [], device: 'phone' };
    const store = await db();
    if (store) { await store.collection('games').doc(file).set({ ...row, pgn: g.pgn || '' }); }
    else { const l = local.get('games', []); l.push(row); local.set('games', l); }
    return file;
  }

  // ---------- Ask Gus ----------
  function promptFor(req) {
    const speaker = P.cast.includes(req.persona) ? req.persona : 'wizard';
    return `SPEAKER: ${speaker}\nMODE: ${req.mode || 'game'}\n\nFACTS:\n${req.facts || '(none)'}\n\n`
      + (req.history && req.history.length ? `EARLIER IN THIS CHAT:\n${req.history.map(h => `Jim: ${h.q}\nCat: ${h.a}`).join('\n')}\n\n` : '')
      + `JIM ASKS: ${String(req.question || '').slice(0, 600)}`;
  }
  function clean(r, fen) {       // same checks as ask.js on the Mac
    const sq = s => typeof s === 'string' && /^[a-h][1-8]$/.test(s);
    let board = null;
    try { board = new Chess(fen); } catch {}
    const arrows = (r.arrows || []).filter(a => a && sq(a.from) && sq(a.to) && a.from !== a.to && (!board || board.get(a.from))).slice(0, 3);
    const marks = (r.marks || []).filter(m => m && sq(m.square)).slice(0, 4);
    return { say: String(r.say || '').replace(/—/g, ',').slice(0, 120), mood: P.moods.includes(r.mood) ? r.mood : 'think',
             answer: String(r.answer || '').replace(/—/g, ',').slice(0, 1200), arrows, marks };
  }
  // ---------- Pocket Gus: the offline coach ----------
  // Reads the facts sheet coach.js built (Stockfish + chess.js) and answers plainly, with a canned cat joke.
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const JOKES = {
    best: ['Pocket Gus has spoken. Trust the engine.', 'I calculated this between naps.', 'Offline, and still smarter than the dog.'],
    threat: ['Psst. Something sharp is pointed at you.', 'Look out. I would not leave that there.', 'Danger. Even I can see it, and I am a cat.'],
    blunder: ['Oh no. Oh no no no.', 'I covered my eyes for that one.', 'That move knocked itself off the table.'],
    mistake: ['Hmm. Not your finest.', 'Close, but no treat.'],
    good: ['Nice. I approve. Slow blink.', 'That was the move. Respect.'],
    why: ['A cat has reasons. Here they are.', 'Do not question the cat. Fine, I will explain.'],
    explain: ['Here is the situation, human.', 'Let me read the board for you.'],
    hint: ['A nudge, not the answer.', 'Look closer. I believe in you. Mostly.'],
    answer: ['Fine. Here it is.', 'You asked for it. The answer.'],
    review: ['Let us relive the pain together.', 'I took notes. Many notes.'],
    wait: ['Patience. It is my move.', 'Shh. I am thinking. Mostly about treats.'],
    none: ['Pocket Gus only knows chess, and naps.'],
  };
  function sqOf(fen, san, flipTurn) {
    try {
      const f = fen.split(' '); if (flipTurn) { f[1] = f[1] === 'w' ? 'b' : 'w'; f[3] = '-'; }
      const m = new Chess(f.join(' ')).move(san); return m ? { from: m.from, to: m.to } : null;
    } catch { return null; }
  }
  function pocketGus(req) {
    const F = String(req.facts || ''), q = String(req.question || '').toLowerCase(), fen = req.fen || '';
    const get = re => F.match(re);
    const best = get(/^\s+1\) (\S+) \(([^)]*)\)/m), score = get(/Engine score: (.*?)\.\n/), threat = get(/REAL THREAT: (\w+) is threatening (\S+) \(([^)]*)\), which would win something \(([^)]*)\)/);
    const mine = get(/Jim's pieces \((\w+)\) in danger: (.*)\./), theirs = get(/The cat's pieces \((\w+)\) in danger: (.*)\./);
    const last = get(/Jim's last move: (\S+)\. Engine grade: ([a-z ]+?)(?:\. Better was (\S+) \(([^)]*)\))?\.\n/), cat = get(/The cat's last move: (\S+)\. Why the cat chose it: (.*)\./);
    const puzzle = get(/NOT SOLVED YET\..*The solution from here: (\S+) \(([^)]*)\)/), themes = get(/Puzzle themes: ([^.]*)\./), accepted = get(/Accepted answers: (\S+) \(([^)]*)\)/);
    const r = (key, mood, answer, arrows = [], marks = []) => ({ say: pick(JOKES[key]), mood, answer: answer + ' (Pocket Gus, the offline brain.)', arrows, marks });
    const arrow = (m, color) => (m ? [{ from: m.from, to: m.to, color }] : []);
    const bestLine = () => (best ? `The engine's top move is **${best[1]}** (${best[2]}).` : 'I could not find a move to suggest here.');

    if (/CHECKMATE\. /.test(F)) return r('explain', 'happy', 'The game is over: it is checkmate. Start a new one and get revenge.');
    if (/STALEMATE/.test(F)) return r('explain', 'eyeroll', 'Stalemate: the side to move has no legal move and is not in check, so it is a draw.');
    if (req.mode === 'review' || /review|went wrong|go wrong/.test(q)) {
      const rows = [...F.matchAll(/Move (\d+): Jim played (\S+) \((\w+)\)\. Better was (\S+) \(([^)]*)\)\. Cost: ([^.]*)\./g)];
      if (!rows.length) return r('good', 'happy', 'The engine found no mistakes or blunders in your game. Clean flying.');
      const worst = rows.sort((a, b) => (b[3] === 'blunder') - (a[3] === 'blunder')).slice(0, 3);
      return r('review', 'arms', worst.map(m => `Move ${m[1]}: you played ${m[2]} (a ${m[3]}, cost ${m[6]}). Better was **${m[4]}**.`).join(' '));
    }
    const answerAsked = /answer|solution|just tell|tell me the move|show me/.test(q);
    if (puzzle) {
      const m = sqOf(fen, puzzle[1]);
      if (answerAsked) return r('answer', 'judge', `The move is **${puzzle[1]}** (${puzzle[2]}).`, arrow(m, 'good'));
      return r('hint', 'think', `Look for ${themes ? themes[1] : 'a tactic'}. Start with the piece I marked.${m ? '' : ' Checks and captures first.'}`, [], m ? [{ square: m.from, color: 'hint' }] : []);
    }
    if (accepted && !/better|why/.test(q)) {
      const m = sqOf(fen, accepted[1]);
      if (answerAsked) return r('answer', 'judge', `A good move here is **${accepted[1]}** (${accepted[2]}).`, arrow(m, 'good'));
      return r('hint', 'think', 'Your game move here was a mistake. Look at the piece I marked and ask: what does it attack?', [], m ? [{ square: m.from, color: 'hint' }] : []);
    }
    if (/why (did|do|would) you|why'd you|your (last )?move/.test(q) && cat)
      return r('why', /accident|treat/.test(cat[2]) ? 'happy' : 'judge', `I played ${cat[1]}. Honestly? ${cat[2][0].toUpperCase() + cat[2].slice(1).replace(/\bits\b/g, 'my').replace(/\bit\b/g, 'I')}.`);
    if (/last move|my move|was (that|it)|bad|good move|mistake/.test(q) && last) {
      const g = last[2], better = last[3] ? ` Better was **${last[3]}** (${last[4]}).` : '';
      if (g === 'blunder') return r('blunder', 'facepaw', `${last[1]} was a blunder.${better}`);
      if (g === 'mistake') return r('mistake', 'judge', `${last[1]} was a mistake.${better}`);
      if (g === 'best') return r('good', 'slowblink', `${last[1]} was the engine's top move. Well played.`);
      return r('good', 'happy', `${last[1]} was fine (${g}). Nothing lost.`);
    }
    if (/explain|position|winning|who is|ahead|eval/.test(q))
      return r('explain', 'think', `${score ? 'The engine says: ' + score[1] + '.' : ''} ${mine && mine[2] !== 'none' ? 'Your pieces in danger: ' + mine[2] + '.' : 'None of your pieces are hanging.'} ${theirs && theirs[2] !== 'none' ? 'Mine in danger: ' + theirs[2] + '.' : ''}`.trim());
    if (/It is the cat's turn\./.test(F)) return r('wait', 'sleep', 'It is my move right now. Ask me again on your turn.');
    if (/threat|danger|attack|hanging/.test(q) || threat) {
      const tm = threat && sqOf(fen, threat[2], true);
      const gain = threat && (/checkmate/.test(threat[4]) ? 'which would be checkmate' : 'which would win ' + threat[4].replace(/^worth /, ''));
      const head = threat ? `Watch out: ${threat[1]} is threatening **${threat[2]}** (${threat[3]}), ${gain}. Deal with that first.` : 'No real threat against you right now.';
      const hang = mine && mine[2] !== 'none' ? ` In danger: ${mine[2]}.` : '';
      return r(threat ? 'threat' : 'best', threat ? 'judge' : 'happy', `${head}${hang} ${bestLine()}`, [...arrow(tm, 'bad'), ...arrow(best && sqOf(fen, best[1]), 'good')]);
    }
    if (best) return r('best', 'happy', bestLine(), arrow(sqOf(fen, best[1]), 'good'));
    return r('none', 'eyeroll', 'Pocket Gus can only help with the position on the board. Ask Claude Gus when you have signal.');
  }

  let busy = false;
  async function ask(req) {
    const sample = P.system ? await use('sample') : null;
    if (!sample) return { ok: true, ...clean(pocketGus(req), req.fen) };
    if (busy) return { ok: false, error: 'busy' };
    busy = true;
    const started = Date.now();
    try {
      const input = `${P.system}\n\n---\n\n${promptFor(req)}\n\n---\n\nReply with only a JSON object that matches this JSON Schema `
        + `(no prose before or after):\n${JSON.stringify(P.schema)}`;
      const r = await sample.json(input, { modelTier: req.model === 'sonnet' ? 'quick' : 'default', cache: false });
      return { ok: true, ms: Date.now() - started, ...clean(r || {}, req.fen) };
    } catch (e) {
      if (e && e.code === 'rate_limited') return { ok: false, error: 'busy' };
      return { ok: true, ...clean(pocketGus(req), req.fen) };          // no signal or Claude declined: Pocket Gus
    } finally { busy = false; }
  }

  // ---------- offline app: "Ask Claude Gus" hands the position to the online version ----------
  if (P.handoff) document.addEventListener('DOMContentLoaded', () => {
    const b64 = s => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    document.querySelectorAll('.ask-foot').forEach(foot => {
      const a = document.createElement('a');
      a.className = 'handoff'; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Ask Claude Gus ↗';
      a.title = 'Opens the online Gusmaster with this position, for the full Claude-powered Gus';
      a.onclick = () => { const c = window.Coach && Coach.context(); a.href = P.handoff + (c ? '#ask-' + b64(JSON.stringify(c)) : ''); };
      foot.appendChild(a);
    });
    const sync = () => document.body.classList.toggle('online', navigator.onLine);
    addEventListener('online', sync); addEventListener('offline', sync); sync();
  });

  // ---------- the /api router ----------
  window.fetch = async (url, opts = {}) => {
    const path = typeof url === 'string' ? url : url.url;
    if (!path.startsWith('/api/')) return realFetch(url, opts);
    const method = (opts.method || 'GET').toUpperCase(), body = opts.body ? JSON.parse(opts.body) : null;
    if (path === '/api/progress') {
      if (method === 'PUT') { await saveProgress(opts.body); return reply({ ok: true }); }
      return reply(await loadProgress());
    }
    if (path === '/api/games') {
      if (method === 'POST') return reply({ ok: true, file: await saveGame(body) });
      return reply(await listGames());
    }
    if (path === '/api/speak') {
      const words = String(body.text || '').replace(/\*[^*]*\*/g, ' ').replace(/\s+/g, ' ').trim();
      const file = P.voices[`${body.persona}|${words}`] || (P.base[body.persona] && P.voices[`${P.base[body.persona]}|${words}`]) || P.voices[`any|${words}`];
      return reply(file ? { ok: true, url: 'voice/' + file } : { ok: false, reason: 'not recorded' });
    }
    if (path === '/api/ask') return reply(await ask(body));
    return reply({ ok: false, error: 'not on the phone' });
  };
})();
