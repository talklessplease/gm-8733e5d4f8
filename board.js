// Gusmaster 3000 -- the chessboard: drawing, click/drag input, promotion picker, sliding pieces,
// lesson arrows and marks, and the slap/laser effects. Used by Play and by the Trainer.
(function () {
  const { S } = Core;
  const FILES = 'abcdefgh';

  class Board {
    // opts: canMove() -> bool, side() -> 'w'|'b' (which pieces the user moves), onMove(from, to, promotion, {dragged})
    constructor(el, opts) {
      this.el = el; this.opts = opts; this.chess = new Chess();
      this.orientation = 'w'; this.last = null; this.sel = null; this.arrows = []; this.marks = {}; this.anim = null;
      this.promo = document.createElement('div'); this.promo.className = 'promo hidden';
      el.parentElement.appendChild(this.promo);
      this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.svg.setAttribute('class', 'arrows'); this.svg.setAttribute('viewBox', '0 0 8 8');
      this.bindInput();
    }

    // Board square -> display column/row (0..7 from the top-left as you look at it).
    pos(sq) {
      const f = sq.charCodeAt(0) - 97, r = +sq[1] - 1;
      return this.orientation === 'w' ? { c: f, r: 7 - r } : { c: 7 - f, r };
    }
    squares() {
      const out = [];
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++)
        out.push(this.orientation === 'w' ? FILES[c] + (8 - r) : FILES[7 - c] + (r + 1));
      return out;
    }
    legalFrom(sq) { return this.chess.moves({ square: sq, verbose: true }); }

    render() {
      const el = this.el, chess = this.chess;
      el.dataset.theme = S.theme;
      const targets = this.sel && S.hints ? this.legalFrom(this.sel) : [];
      const checkSide = chess.in_check() ? chess.turn() : null;
      el.innerHTML = '';
      this.squares().forEach((sq, i) => {
        const d = document.createElement('div'), fi = sq.charCodeAt(0) - 97, rk = +sq[1];
        d.className = 'sq ' + ((fi + rk) % 2 ? 'l' : 'd'); d.dataset.sq = sq;
        if (this.last && this.last.includes(sq)) d.classList.add('last');
        if (this.sel === sq) d.classList.add('sel');
        if (this.marks[sq]) d.classList.add('mark-' + this.marks[sq]);
        const t = targets.find(m => m.to === sq);
        if (t) d.classList.add('target');
        if (t && (t.captured || t.flags.includes('e'))) d.classList.add('cap');
        const p = chess.get(sq);
        if (p) {
          if (p.type === 'k' && p.color === checkSide) d.classList.add('check');
          const pc = document.createElement('div'); pc.className = 'pc ' + p.color + p.type;
          const v = (fi * 2 + rk) % 3; if (v) pc.classList.add('v' + v);   // themed sets: desync blinks and tail swishes
          pc.style.setProperty('--d', (Math.random() * 0.12).toFixed(2) + 's');
          pc.style.setProperty('--r', ((Math.random() * 24 - 12) | 0) + 'deg');
          d.appendChild(pc);
        }
        if (i % 8 === 0) d.insertAdjacentHTML('beforeend', `<span class="coord r">${sq[1]}</span>`);
        if (i >= 56) d.insertAdjacentHTML('beforeend', `<span class="coord f">${sq[0]}</span>`);
        el.appendChild(d);
      });
      this.drawArrows(); el.appendChild(this.svg);
      if (this.anim) { this.slide(this.anim); this.anim = null; }
    }

    // Slide pieces from their old squares instead of teleporting. moves: [{from, to}]
    slide(moves) {
      const size = this.el.clientWidth / 8;
      moves.forEach(({ from, to }) => {
        const pc = this.el.querySelector(`[data-sq="${to}"] .pc`); if (!pc) return;
        const a = this.pos(from), b = this.pos(to);
        pc.style.transition = 'none'; pc.style.zIndex = 6;
        pc.style.transform = `translate(${(a.c - b.c) * size}px, ${(a.r - b.r) * size}px)`;
        void pc.offsetWidth;
        pc.style.transition = 'transform .2s cubic-bezier(.25,.8,.35,1)'; pc.style.transform = '';
        setTimeout(() => { pc.style.transition = ''; pc.style.zIndex = ''; }, 230);
      });
    }
    // Make a move from code (engine, puzzle opponent) and animate it, including the castling rook.
    play(mv) {
      const m = this.chess.move(mv); if (!m) return null;
      const anim = [{ from: m.from, to: m.to }];
      if (m.flags.includes('k')) anim.push({ from: 'h' + m.from[1], to: 'f' + m.from[1] });
      if (m.flags.includes('q')) anim.push({ from: 'a' + m.from[1], to: 'd' + m.from[1] });
      this.last = [m.from, m.to]; this.sel = null; this.anim = anim; this.render();
      this.afterMove(m);
      return m;
    }
    // Little celebrations that follow a move: a poof when a pawn promotes.
    afterMove(m) { if (m && m.promotion) setTimeout(() => this.poof(m.to), 180); }
    poof(sq) {
      const el = this.squareEl(sq); if (!el) return;
      const p = document.createElement('div'); p.className = 'poof';
      p.innerHTML = '<i></i><i></i><i></i><i></i><i></i><b>✨</b>';
      el.appendChild(p); setTimeout(() => p.remove(), 1100);
      Core.sfx.promote();
    }

    // Lesson arrows: [{from, to, color}] where color is good|bad|hint|info.
    drawArrows() {
      const col = { good: '#3fbf6e', bad: '#e5484d', hint: '#f4b400', info: '#4a90e2' };
      let s = '<defs>' + Object.entries(col).map(([k, v]) =>
        `<marker id="ah-${k}" viewBox="0 0 10 10" refX="4" refY="5" markerWidth="2.6" markerHeight="2.6" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${v}"/></marker>`).join('') + '</defs>';
      this.arrows.forEach(({ from, to, color = 'info' }) => {
        const a = this.pos(from), b = this.pos(to);
        const x1 = a.c + .5, y1 = a.r + .5, x2 = b.c + .5, y2 = b.r + .5, len = Math.hypot(x2 - x1, y2 - y1);
        const ex = x2 - (x2 - x1) / len * .32, ey = y2 - (y2 - y1) / len * .32;
        s += `<line x1="${x1}" y1="${y1}" x2="${ex}" y2="${ey}" stroke="${col[color]}" stroke-width=".17" stroke-linecap="round" opacity=".85" marker-end="url(#ah-${color})"/>`;
      });
      this.svg.innerHTML = s;
    }
    setDecor({ arrows = [], marks = {} } = {}) { this.arrows = arrows; this.marks = marks; this.render(); }

    // ---------- input ----------
    bindInput() {
      const el = this.el;
      let drag = null;
      // A drag can end without a pointerup (trackpad gestures, focus changes). Always clean up, or the
      // floating "ghost" piece stays on screen and the next move feels stuck.
      const endDrag = () => {
        if (!drag) return;
        if (drag.ghost) drag.ghost.remove();
        drag = null;
        document.querySelectorAll('.ghost').forEach(g => g.remove());
        this.render();
      };
      el.addEventListener('pointercancel', endDrag);
      el.addEventListener('lostpointercapture', () => setTimeout(endDrag, 0));
      window.addEventListener('blur', endDrag);
      el.addEventListener('pointerdown', e => {
        if (drag) endDrag();                      // a previous drag never finished: clear it first
        if (!this.promo.classList.contains('hidden')) { this.promo.classList.add('hidden'); this.sel = null; this.render(); return; }
        const sqEl = e.target.closest('.sq'); if (!sqEl || !this.opts.canMove()) return;
        const sq = sqEl.dataset.sq, p = this.chess.get(sq), side = this.opts.side();
        if (this.sel && this.sel !== sq && this.legalFrom(this.sel).some(m => m.to === sq)) { this.tryMove(this.sel, sq); return; }
        if (!p || p.color !== side || this.chess.turn() !== side) { this.sel = null; this.render(); return; }
        const wasSel = this.sel === sq;
        this.sel = sq; this.render();
        drag = { sq, x: e.clientX, y: e.clientY, moved: false, wasSel, ghost: null };
        el.setPointerCapture(e.pointerId);
      });
      el.addEventListener('pointermove', e => {
        if (!drag) return;
        if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 5) {
          drag.moved = true;
          const p = this.chess.get(drag.sq);
          drag.ghost = document.createElement('div'); drag.ghost.className = 'ghost pc ' + p.color + p.type;
          document.body.appendChild(drag.ghost);
          const orig = el.querySelector(`[data-sq="${drag.sq}"] .pc`); if (orig) orig.classList.add('dim');
        }
        if (drag.ghost) { drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px'; }
      });
      el.addEventListener('pointerup', e => {
        if (!drag) return;
        const d = drag; drag = null;
        if (d.ghost) d.ghost.remove();
        if (d.moved) {
          const under = document.elementFromPoint(e.clientX, e.clientY), tEl = under && under.closest('.sq');
          if (tEl && tEl.dataset.sq !== d.sq && this.legalFrom(d.sq).some(m => m.to === tEl.dataset.sq)) { this.tryMove(d.sq, tEl.dataset.sq, true); return; }
          this.render(); return;
        }
        if (d.wasSel) { this.sel = null; this.render(); }
      });
    }
    // dragged: the piece is already under the pointer, so the owner should not slide it in.
    tryMove(from, to, dragged = false) {
      const p = this.chess.get(from);
      if (p && p.type === 'p' && (to[1] === '8' || to[1] === '1')) return this.askPromotion(from, to);
      this.sel = null; this.opts.onMove(from, to, undefined, { dragged });
    }
    askPromotion(from, to) {
      const box = this.promo, sqEl = this.el.querySelector(`[data-sq="${to}"]`);
      const wrap = this.el.parentElement.getBoundingClientRect(), r = sqEl.getBoundingClientRect(), side = this.opts.side();
      box.innerHTML = ['q', 'n', 'r', 'b'].map(t => `<div class="pc ${side}${t}" data-t="${t}" style="position:static"></div>`).join('');
      box.style.left = (r.left - wrap.left) + 'px';
      box.style.top = (this.pos(to).r < 4 ? r.top - wrap.top : r.bottom - wrap.top - r.height * 4) + 'px';
      box.classList.remove('hidden');
      box.onclick = e => { const t = e.target.dataset.t; if (!t) return; box.classList.add('hidden'); this.sel = null; this.opts.onMove(from, to, t, { dragged: false }); };
    }

    // ---------- effects ----------
    shake() { this.el.classList.remove('shake'); void this.el.offsetWidth; this.el.classList.add('shake');
              setTimeout(() => this.el.classList.remove('shake'), 1200); }
    scorch(sq) {
      const el = this.el.querySelector(`[data-sq="${sq}"]`); if (!el) return;
      const s = document.createElement('div'); s.className = 'scorch'; s.style.inset = '-15%'; el.appendChild(s);
      const pc = el.querySelector('.pc'); if (pc) setTimeout(() => pc.classList.add('toast'), 100);
    }
    // The capture tantrum (game.js): zap a piece off the board, then toss it back. Looks only; the game
    // position never changes, and a render() puts everything back exactly as it was.
    zap(sq) {
      this.scorch(sq);
      const pc = this.squareEl(sq) && this.squareEl(sq).querySelector('.pc');
      if (pc) setTimeout(() => pc.classList.add('zapped'), 650);
    }
    toss(sq) {
      const el = this.squareEl(sq), pc = el && el.querySelector('.pc'); if (!pc) return;
      el.querySelectorAll('.scorch').forEach(s => s.remove());
      pc.classList.remove('toast', 'zapped'); void pc.offsetWidth; pc.classList.add('tossed');
    }
    squareEl(sq) { return this.el.querySelector(`[data-sq="${sq}"]`); }
    kingSquare(color) {
      return this.squares().find(sq => { const p = this.chess.get(sq); return p && p.type === 'k' && p.color === color; });
    }
  }

  window.Board = Board;
})();
