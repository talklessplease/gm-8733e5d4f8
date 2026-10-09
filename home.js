// Gusmaster 3000 -- home screen: tabs for Play, Academy, Puzzles, Homework, plus screen switching.
(function () {
  const { $, store, S, saveSettings, Progress, today } = Core;
  const { PERSONAS } = GusEngine;
  const ORDER = ['kitten', 'lazy', 'wizard', 'bowie'];
  const BLURB = {
    kitten: 'Just learned how the horsey moves. Mostly.',
    lazy: 'Plays fine until a treat shows up. Naps between moves.',
    wizard: 'Consults the orb. Slaps the table when you blunder.',
    bowie: 'The King. Big ears, bigger ego. Final boss.',
  };
  const TABS = ['play', 'academy', 'puzzles', 'homework'];

  function showScreen(name) {
    ['home', 'game', 'trainer'].forEach(s => $('#' + s).classList.toggle('hidden', s !== name));
  }

  async function show(tab = store.get('tab', 'play')) {
    if (!TABS.includes(tab)) tab = 'play';
    store.set('tab', tab);
    Play.stop(); Trainer.stop();
    showScreen('home'); $('#result').classList.add('hidden'); $('#tresult').classList.add('hidden');
    document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    document.querySelectorAll('.tabpane').forEach(p => p.classList.toggle('hidden', p.id !== 'tab-' + tab));
    await Progress.load();
    renderStats();
    ({ play: renderPlay, academy: renderAcademy, puzzles: renderPuzzles, homework: renderHomework })[tab]();
  }

  async function renderStats() {
    const d = Progress.data, items = await Trainer.homeworkItems();
    const due = items.filter(i => i.due).length;
    const streakAlive = d.streak.last === today() || d.streak.last === Core.addDays(today(), -1);
    $('.stats').innerHTML = `
      <span title="Puzzle rating">🧩 <b>${d.puzzleRating}</b></span>
      <span title="Daily puzzle streak">🔥 <b>${streakAlive ? d.streak.count : 0}</b></span>
      <span title="Academy stars">⭐ <b>${Object.values(d.academy).reduce((a, u) => a + (u.stars || 0), 0)}</b></span>`;
    const hwTab = $('.tabs [data-tab="homework"]');
    hwTab.innerHTML = 'Homework' + (due ? ` <span class="badge">${due}</span>` : '');
  }

  // ---------- Play ----------
  async function renderPlay() {
    let games = [];
    try { games = await (await fetch('/api/games')).json(); } catch {}
    $('.opps').innerHTML = ORDER.map(p => {
      const g = games.filter(x => x.opponent === p), n = k => g.filter(x => x.outcome === k).length;
      const rec = g.length ? `You ${n('win')} · ${PERSONAS[p].name.split(' ').pop()} ${n('loss')}${n('draw') ? ' · draws ' + n('draw') : ''}` : 'Not played yet';
      return `<div class="opp" data-p="${p}">${Cats.svg(Cats.artFor(p))}<h3>${Cats.nameFor(p, PERSONAS[p].name)}</h3><div class="rating">rating ${PERSONAS[p].rating}</div>
              <div class="blurb">${BLURB[p]}</div><div class="rec">${rec}</div></div>`;
    }).join('');
    document.querySelectorAll('.opp').forEach(el => el.onclick = () => Play.start(el.dataset.p, S.color));
    const cur = store.get('current', null);
    $('#resume').innerHTML = cur && cur.pgn ? `<button class="primary" id="bResume">Resume your game vs ${PERSONAS[cur.persona].name}</button>` : '';
    if (cur && cur.pgn) $('#bResume').onclick = () => Play.start(cur.persona, cur.human, cur.pgn ? cur : null);
  }

  // ---------- Academy ----------
  function renderAcademy() {
    const prog = Progress.data.academy, units = Academy.UNITS;
    let html = '', tier = null;
    units.forEach((u, i) => {
      if (u.tier !== tier) { if (tier) html += '</div>'; tier = u.tier; html += `<h3 class="tier">${tier}</h3><div class="units">`; }
      const st = (prog[u.id] || {}).stars || 0;
      const unlocked = i === 0 || ((prog[units[i - 1].id] || {}).stars || 0) > 0 || st > 0;
      const fresh = i === 0 && !Object.keys(prog).length;
      html += `<div class="unit ${unlocked ? '' : 'locked'} ${st ? 'done' : ''} ${fresh ? 'fresh' : ''}" data-id="${u.id}" data-locked="${unlocked ? 0 : 1}">
        <div class="uicon">${unlocked ? u.icon : '🔒'}</div><div class="ubody"><h4>${i + 1}. ${u.title}</h4><div class="ublurb">${u.blurb}</div></div>
        <div class="ustars">${[0, 1, 2].map(k => `<span class="${k < st ? 'on' : ''}">★</span>`).join('')}</div></div>`;
    });
    html += '</div>';
    $('#tab-academy .unitlist').innerHTML = html;
    document.querySelectorAll('.unit').forEach(el => el.onclick = () => {
      if (el.dataset.locked === '1' && !confirm('Skip ahead to this lesson? (Earlier lessons build up to it.)')) return;
      Trainer.lesson(el.dataset.id);
    });
  }

  // ---------- Puzzles ----------
  function renderPuzzles() {
    const d = Progress.data, dl = d.daily && d.daily.date === today() ? d.daily : null;
    const done = dl ? dl.done.length : 0, total = dl ? dl.ids.length : 5;
    const reviews = Object.values(d.review).filter(r => r.due <= today()).length;
    $('#tab-puzzles .dailycard').innerHTML = `
      <div class="dc-cat">${Cats.svg('bowie')}</div>
      <div class="dc-body"><h3>Today's five</h3>
        <div class="dots big">${Array.from({ length: total }, (_, i) => `<span class="dot ${i < done ? 'ok' : ''}"></span>`).join('')}</div>
        <p>${done >= total ? 'Done for today. The streak lives.' : done ? `${done} of ${total} done. Finish them to keep your streak.` : 'Five puzzles at your level. Missed ones come back for review.'}</p>
        <button class="primary" id="bDaily">${done >= total ? 'Practice more' : done ? 'Continue' : 'Start'}</button>
        ${done >= total ? '' : '<button id="bPractice">Free practice</button>'}</div>`;
    $('#bDaily').onclick = () => (done >= total ? Trainer.practice() : Trainer.daily());
    if ($('#bPractice')) $('#bPractice').onclick = () => Trainer.practice();
    const acc = d.solved + d.failed ? Math.round(100 * d.solved / (d.solved + d.failed)) : 0;
    $('#tab-puzzles .pstats').innerHTML = `
      <div><b>${d.puzzleRating}</b><span>Puzzle rating</span></div>
      <div><b>${d.streak.count && (d.streak.last === today() || d.streak.last === Core.addDays(today(), -1)) ? d.streak.count : 0}</b><span>Day streak (best ${d.streak.best || 0})</span></div>
      <div><b>${d.solved}</b><span>Solved first try (${acc}%)</span></div>
      <div><b>${reviews}</b><span>Reviews due</span></div>`;
  }

  // ---------- Homework ----------
  async function renderHomework() {
    const items = await Trainer.homeworkItems(), due = items.filter(i => i.due), mastered = items.filter(i => i.state.done).length;
    const list = due.slice(0, 6).map(i => `<li><b>${i.san}${i.kind === 'blunder' ? '??' : '?'}</b> vs ${i.opponent}
      <span>${new Date(i.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></li>`).join('');
    $('#tab-homework .hwcard').innerHTML = `
      <div class="dc-cat">${Cats.svg('lazy')}</div>
      <div class="dc-body"><h3>${due.length ? `${due.length} position${due.length === 1 ? '' : 's'} from your games` : 'No homework due'}</h3>
        <p>${items.length ? 'Every time a cat slapped the table, that position landed here. Find the better move. Solve it three times and it is mastered.'
                          : 'Play a game. Every blunder becomes homework. Lazy Gus will grade it. Eventually.'}</p>
        ${list ? `<ul class="hwlist">${list}</ul>` : ''}
        ${due.length ? '<button class="primary" id="bHomework">Start homework</button>' : ''}
        <div class="muted">${mastered} mastered · ${items.length} total</div></div>`;
    if (due.length) $('#bHomework').onclick = () => Trainer.homework();
  }

  // ---------- controls ----------
  document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => show(b.dataset.tab));
  document.querySelectorAll('#colorSeg button').forEach(b => {
    b.classList.toggle('on', b.dataset.v === S.color);
    b.onclick = () => { S.color = b.dataset.v; saveSettings(); document.querySelectorAll('#colorSeg button').forEach(x => x.classList.toggle('on', x === b)); };
  });
  const bindCheck = (ids, key) => ids.forEach(id => { const el = $(id); el.checked = S[key];
    el.onchange = () => { S[key] = el.checked; saveSettings(); ids.forEach(o => $(o).checked = S[key]); Play.render(); }; });
  bindCheck(['#optHints', '#gHints'], 'hints');
  bindCheck(['#optSound', '#gSound'], 'sound');
  bindCheck(['#optVoice'], 'voice');
  $('#optTheme').value = S.theme; $('#optTheme').onchange = e => { S.theme = e.target.value; saveSettings(); };
  $('#tBack').onclick = () => { Trainer.stop(); show(); };

  // ---------- piece sets ----------
  function setPieces(id) {
    S.pieces = id; const set = PieceSets.SETS[id];
    if (set.board) { S.theme = set.board; $('#optTheme').value = set.board; }
    saveSettings(); PieceSets.apply(id);
    $('#piecesName').textContent = set.name;
    if (!$('#tab-play').classList.contains('hidden')) renderPlay();
  }
  function openGallery() {
    const order = ['classic', 'cats', 'space', 'retro'];
    $('#gallery .sets').innerHTML = order.map(id => {
      const set = PieceSets.SETS[id];
      const img = (t, side) => id === 'classic' ? `<div class="pc classic ${side}${t}" style="position:relative"></div>`
                                                : `<div class="pc" style="position:relative;background-image:url('${PieceSets.dataUrl(id, t, side)}')"></div>`;
      const row = side => 'kqrbnp'.split('').map((t, i) => `<div class="gsq ${(i + (side === 'b' ? 1 : 0)) % 2 ? 'd' : 'l'}">${img(t, side)}</div>`).join('');
      return `<div class="setcard ${S.pieces === id ? 'on' : ''}" data-id="${id}">
        <div class="gboard" data-theme="${set.board || 'walnut'}"><div class="grow">${row('w')}</div><div class="grow">${row('b')}</div></div>
        <h3>${set.name}</h3><p>${set.blurb}</p></div>`;
    }).join('');
    document.querySelectorAll('.setcard').forEach(el => el.onclick = () => {
      setPieces(el.dataset.id);
      document.querySelectorAll('.setcard').forEach(x => x.classList.toggle('on', x === el));
      Core.sfx.capture('q');
    });
    $('#gallery').classList.remove('hidden');
  }
  $('#bPieces').onclick = openGallery;
  $('#bGalleryClose').onclick = () => $('#gallery').classList.add('hidden');
  PieceSets.apply(S.pieces); $('#piecesName').textContent = (PieceSets.SETS[S.pieces] || PieceSets.SETS.classic).name;

  window.Home = { show, showScreen };
  show();
  // Opened from the offline app's "Ask Claude Gus" button: gusmaster.html#ask-<base64url of {fen, persona}>.
  const handoff = (location.hash.match(/^#ask-([A-Za-z0-9_-]+)$/) || [])[1];
  if (handoff) {
    try { const d = JSON.parse(atob(handoff.replace(/-/g, '+').replace(/_/g, '/'))); Trainer.position(d.fen, d.persona); } catch {}
  }
})();
