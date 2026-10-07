// Gusmaster 3000 -- Gus's Academy: the curriculum.
// Each unit: a short lesson (steps: position + what Gus says + arrows/marks), then drills.
// Drill sources:
//   { theme, count }            -> CC0 Lichess puzzles with that theme, near your puzzle rating
//   { hand: [...] }             -> hand-made single-move drills: accept = list of good moves (uci),
//                                  or judge: 'engine' = any move that keeps the material (Stockfish decides)
//   { boss: { fen, maxMoves, stars: [3-star, 2-star, 1-star move counts] } } -> checkmate the lone king vs Stockfish
// Arrow colors: good (green), bad (red), hint (gold), info (blue). Marks: good, bad, hint on squares.
(function () {
  const UNITS = [
    // ---------------- Tier 1: Kitten School ----------------
    { id: 'treats', tier: 'Kitten School', title: 'Free Treats', icon: '🍪',
      blurb: 'What each piece is worth, and how to grab the ones left lying around.',
      steps: [
        { fen: '4k3/8/8/8/8/8/P7/1NBRKQ2 w - - 0 1', marks: { a2: 'hint', b1: 'hint', c1: 'hint', d1: 'hint', f1: 'hint' },
          text: 'Every piece is worth treats. Pawn 1. Knight 3. Bishop 3. Rook 5. Queen 9. The king? Priceless. Lose him and the game is over.' },
        { fen: '4k3/8/2r5/8/3N4/8/8/4K3 w - - 0 1', arrows: [{ from: 'd4', to: 'c6', color: 'good' }],
          text: 'A piece nobody protects is "hanging." That rook on c6 is hanging. Your knight takes it for free: 5 treats, no cost.' },
        { fen: '4k3/8/4p3/3p4/8/8/8/3QK3 w - - 0 1', arrows: [{ from: 'd1', to: 'd5', color: 'bad' }, { from: 'e6', to: 'd5', color: 'bad' }],
          text: 'But check who is guarding it. Queen takes d5? The e6 pawn takes your queen back. You won 1 and lost 9. Terrible trade.' },
        { fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
          text: 'The rule: before you capture, ask "Who takes back?" If nobody does, it is a free treat. Your turn. Find the free pieces.' },
      ],
      drills: { theme: 'hangingPiece', count: 5 } },

    { id: 'safety', tier: 'Kitten School', title: 'Is It Safe?', icon: '🛡️',
      blurb: 'The habit that wins more games than anything: keep your own pieces out of danger.',
      steps: [
        { fen: '4k3/8/3p4/4N3/8/8/8/4K3 w - - 0 1', arrows: [{ from: 'd6', to: 'e5', color: 'bad' }], marks: { e5: 'bad' },
          text: 'Most beginner games are lost the same way: a piece gets attacked and nobody notices. That pawn is attacking your knight.' },
        { fen: '4k3/8/3p4/4N3/8/8/8/4K3 w - - 0 1', arrows: [{ from: 'e5', to: 'f3', color: 'good' }, { from: 'e5', to: 'c4', color: 'good' }],
          text: 'So move it somewhere safe. Or protect it. Or capture something bigger. Anything except ignoring it.' },
        { fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
          text: 'Make this your pre-flight checklist, every single move. One: what did their last move attack? Two: is the piece I am about to move safe where it lands?' },
      ],
      // Real-looking positions (pawns on both sides) so Stockfish's verdict tracks material.
      // tol 200: any move that keeps the piece counts (a piece is worth about 300); this lesson is about safety, not perfection.
      drills: { hand: [
        { fen: '6k1/ppp2ppp/3p4/4N3/8/8/PPP2PPP/6K1 w - - 0 1', judge: 'engine', tol: 200, prompt: 'The d6 pawn attacks your knight. Save it.',
          why: 'Careful where it lands: c6 and g6 are guarded by pawns, and f7 by the king. f3, d3, c4 and g4 are safe.' },
        { fen: '6k1/p1p2ppp/8/1p6/2B5/8/PPP2PPP/6K1 w - - 0 1', judge: 'engine', tol: 200, prompt: 'That pawn attacks your bishop. Do something about it.',
          why: 'Best of all: nobody protects the b5 pawn, so the bishop can simply take it. Retreating to d3, e2 or d5 is fine too.' },
        { fen: '6k1/ppp2pp1/7p/5n2/3Q4/8/PPP2PPP/6K1 w - - 0 1', judge: 'engine', tol: 200, prompt: 'The knight attacks your queen. Find a safe square.',
          why: 'Knights attack in an L. Check every square it jumps to before you pick one. Queen takes a7 even grabs a pawn.' },
        { fen: '6k1/ppp2ppp/8/8/1b6/8/PPP2PPP/4R1K1 w - - 0 1', judge: 'engine', tol: 200, prompt: 'The bishop attacks your rook. Save it.',
          why: 'Move the rook, or push c3 to block the line and attack the bishop at the same time.' },
        { fen: '6k1/ppp2ppp/8/8/4p3/5N2/PPP2PPP/6K1 w - - 0 1', judge: 'engine', tol: 200, prompt: 'The pawn attacks your knight. Save it.',
          why: 'Any square the pawn does not reach works. Knights love the center, so d4 is a happy spot.' },
      ] } },

    { id: 'mate1', tier: 'Kitten School', title: 'Mate in One', icon: '👑',
      blurb: 'Spot the move that ends the game on the spot.',
      steps: [
        { fen: '6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1', arrows: [{ from: 'd1', to: 'd8', color: 'good' }],
          text: 'Checkmate means the king is attacked and has no escape. Look: his own pawns box him in. Rook to d8 and it is over.' },
        { fen: '6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1', marks: { f8: 'bad', g8: 'bad', h8: 'bad', f7: 'hint', g7: 'hint', h7: 'hint' },
          text: 'To find mate, look at the king first. Which squares can he run to? Which of your pieces can cover them? Checks first, always.' },
      ],
      drills: { theme: 'mateIn1', count: 5 } },

    // ---------------- Tier 2: Tactics Tower ----------------
    { id: 'fork', tier: 'Tactics Tower', title: 'The Fork', icon: '🍴',
      blurb: 'One piece, two targets. They can only save one.',
      steps: [
        { fen: '4k3/1r6/8/8/2N5/8/8/4K3 w - - 0 1', arrows: [{ from: 'c4', to: 'd6', color: 'good' }],
          text: 'A fork is one piece attacking two things at once. Knights are the best forkers. Watch this jump to d6.' },
        { fen: '4k3/1r6/3N4/8/8/8/8/4K3 b - - 1 1', arrows: [{ from: 'd6', to: 'e8', color: 'bad' }, { from: 'd6', to: 'b7', color: 'bad' }],
          text: 'Check on the king AND the rook is attacked. The king must move, then the knight eats the rook. Two targets, one move.' },
        { fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
          text: 'Hunt for forks by looking for two loose pieces, or a king and a loose piece, that one of your pieces could hit together.' },
      ],
      drills: { theme: 'fork', count: 5 } },

    { id: 'pin', tier: 'Tactics Tower', title: 'The Pin', icon: '📌',
      blurb: 'Freeze a piece in place because something bigger hides behind it.',
      steps: [
        { fen: '4k3/3n4/8/1B6/8/8/8/4K3 b - - 0 1', arrows: [{ from: 'b5', to: 'e8', color: 'bad' }], marks: { d7: 'bad' },
          text: 'That knight on d7 cannot move. If it did, your bishop would be attacking the king. It is pinned, frozen in place.' },
        { fen: '4k3/3n4/8/1B6/8/8/8/4K3 w - - 0 1',
          text: 'Pinned pieces are sitting ducks. Attack them again with something cheap, like a pawn, and they cannot run away.' },
      ],
      drills: { theme: 'pin', count: 5 } },

    { id: 'skewer', tier: 'Tactics Tower', title: 'The Skewer', icon: '🍢',
      blurb: 'A pin in reverse: hit the big piece, grab the one behind it.',
      steps: [
        { fen: '4q3/8/8/4k3/8/8/8/K6R w - - 0 1', arrows: [{ from: 'h1', to: 'e1', color: 'good' }],
          text: 'A skewer attacks a valuable piece with something hiding behind it. Rook to e1, check!' },
        { fen: '4q3/8/8/4k3/8/8/8/K3R3 b - - 1 1', arrows: [{ from: 'e1', to: 'e5', color: 'bad' }, { from: 'e5', to: 'e8', color: 'info' }],
          text: 'The king has to get out of the way. When he steps aside, the rook takes the queen behind him. Like a kebab.' },
      ],
      drills: { theme: 'skewer', count: 5 } },

    { id: 'discovered', tier: 'Tactics Tower', title: 'Discovered Attack', icon: '🎭',
      blurb: 'Move one piece out of the way and reveal an attack from the piece behind it.',
      steps: [
        { fen: '7q/8/8/8/3N4/8/1B6/K6k w - - 0 1', arrows: [{ from: 'd4', to: 'c6', color: 'good' }],
          text: 'Your knight is blocking your own bishop. Watch what happens when the knight jumps away.' },
        { fen: '7q/8/2N5/8/8/8/1B6/K6k b - - 1 1', arrows: [{ from: 'b2', to: 'h8', color: 'bad' }],
          text: 'Surprise: the bishop now attacks the queen all the way across the board. The knight moved, the bishop struck. Two threats for the price of one move.' },
      ],
      drills: { theme: 'discoveredAttack', count: 5 } },

    { id: 'backrank', tier: 'Tactics Tower', title: 'Back-Rank Mate', icon: '🧱',
      blurb: 'The king hides behind his pawns, and they become his prison.',
      steps: [
        { fen: '6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1', arrows: [{ from: 'd1', to: 'd8', color: 'good' }], marks: { f7: 'hint', g7: 'hint', h7: 'hint' },
          text: 'A castled king behind three pawns feels safe. But if a rook or queen reaches his back row, he has nowhere to go.' },
        { fen: '6k1/5pp1/7p/8/8/8/8/3R2K1 w - - 0 1', marks: { h7: 'good' },
          text: 'The cure for your own king: give him an escape square. One little pawn move, like h3 or g3, and he can breathe.' },
      ],
      drills: { theme: 'backRankMate', count: 5 } },

    { id: 'defender', tier: 'Tactics Tower', title: 'Remove the Defender', icon: '🧹',
      blurb: 'If a piece is guarded, take away the guard first.',
      steps: [
        { fen: '4n1k1/8/3r4/1B6/8/8/8/3R2K1 w - - 0 1', arrows: [{ from: 'e8', to: 'd6', color: 'info' }],
          text: 'The rook on d6 is guarded by the knight on e8. Take the rook now and the knight takes back.' },
        { fen: '4n1k1/8/3r4/1B6/8/8/8/3R2K1 w - - 0 1', arrows: [{ from: 'b5', to: 'e8', color: 'good' }, { from: 'd1', to: 'd6', color: 'hint' }],
          text: 'So take the guard first. Bishop takes knight. Now the rook on d6 is hanging, and your rook collects it.' },
      ],
      drills: { theme: 'capturingDefender', count: 5 } },

    { id: 'mate2', tier: 'Tactics Tower', title: 'Mate in Two', icon: '⚔️',
      blurb: 'Two-move knockouts. Checks, captures, threats.',
      steps: [
        { fen: '6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1',
          text: 'Longer combinations follow one recipe. Look at every Check first. Then every Capture. Then every Threat. In that order, every time.' },
        { fen: '6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1',
          text: 'Forcing moves leave them no choice, so you can see what comes next. A check that looks crazy is often the start of a mate.' },
      ],
      drills: { theme: 'mateIn2', count: 5 } },

    // ---------------- Tier 3: Opening School ----------------
    { id: 'openings', tier: 'Opening School', title: 'Opening Rules', icon: '🚀',
      blurb: 'Center, develop, castle. And do not fall for the four-move trick.',
      steps: [
        { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', marks: { d4: 'hint', e4: 'hint', d5: 'hint', e5: 'hint' },
          text: 'Three rules for the first ten moves. One: claim the center with a pawn. These four squares are prime real estate.' },
        { fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', arrows: [{ from: 'f1', to: 'c4', color: 'good' }, { from: 'b1', to: 'c3', color: 'good' }],
          text: 'Two: develop. Get knights and bishops off the back row, toward the middle. Each move, a new piece.' },
        { fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', arrows: [{ from: 'e1', to: 'g1', color: 'good' }],
          text: 'Three: castle early. Your king tucks into the corner behind pawns, and your rook joins the game.' },
        { fen: 'r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3', arrows: [{ from: 'h5', to: 'f7', color: 'bad' }, { from: 'c4', to: 'f7', color: 'bad' }],
          text: 'And watch for this trap. Queen and bishop both aim at f7. If Black ignores it, Queen takes f7 is checkmate in four moves.' },
      ],
      drills: { hand: [
        { fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', accept: ['g1f3', 'b1c3', 'f1c4', 'd2d4'],
          prompt: 'White to move. Follow the rules: develop or claim the center.', why: 'Knight to f3 is the classic: develops and attacks the e5 pawn.' },
        { fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', accept: ['f1c4', 'f1b5', 'd2d4', 'b1c3'],
          prompt: 'White to move. Bring out another piece.', why: 'Bishop to c4 or b5 develops and gets you ready to castle.' },
        { fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1', accept: ['e7e5', 'c7c5', 'e7e6', 'c7c6', 'd7d5', 'd7d6', 'g8f6', 'b8c6'],
          prompt: 'You are Black. White grabbed the center. Answer it.', why: 'e5 matches White in the center. c5, e6 and c6 are famous openings too.' },
        { fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', accept: ['e1g1'],
          prompt: 'White to move. Get your king to safety.', why: 'Castle! King to safety, rook toward the middle, all in one move.' },
        { fen: 'r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3', accept: ['g7g6', 'd8e7', 'd8f6', 'g8h6'],
          prompt: 'You are Black. Something is aimed at f7. Stop the checkmate.', why: 'g6 kicks the queen away. Queen to e7 or f6, or knight to h6, also guards f7.' },
      ] } },

    // ---------------- Tier 4: Boss Fights ----------------
    { id: 'ladder', tier: 'Boss Fights', title: 'Boss: The Rook Ladder', icon: '🪜',
      blurb: 'Two rooks walk the king to the edge, one row at a time.',
      steps: [
        { fen: '4k3/8/8/8/8/8/R7/1R2K3 w - - 0 1', arrows: [{ from: 'a2', to: 'a7', color: 'good' }],
          text: 'Two rooks mate like climbing a ladder. One rook cuts off a row, the other gives check on the next row. Take turns.' },
        { fen: '4k3/R7/8/8/8/8/8/1R2K3 w - - 0 2', arrows: [{ from: 'b1', to: 'b8', color: 'good' }], marks: { a7: 'hint' },
          text: 'The a7 rook fences him onto the back row. Now the other rook checks on b8, and that is mate. Keep your rooks far from his king so he cannot grab them.' },
      ],
      drills: { boss: { fen: '8/8/3k4/8/8/8/8/R3K2R w - - 0 1', maxMoves: 20, stars: [7, 10, 20], defender: 'Lazy Gus' } } },

    { id: 'queenmate', tier: 'Boss Fights', title: 'Boss: Queen Checkmate', icon: '👸',
      blurb: 'King and queen against a lone king. Mate him without stalemating.',
      steps: [
        { fen: '8/8/8/3k4/8/8/8/2Q1K3 w - - 0 1',
          text: 'Use the queen like a fence. Move her a knight jump away from his king and the box gets smaller every move.' },
        { fen: '7k/8/6Q1/8/8/8/8/4K3 b - - 0 1', marks: { h8: 'bad' },
          text: 'DANGER: if he has no legal move but is NOT in check, it is stalemate, a draw. Here he cannot move and is not attacked. Gus will laugh at you.' },
        { fen: '7k/8/6K1/5Q2/8/8/8/8 w - - 0 1', arrows: [{ from: 'f5', to: 'f8', color: 'good' }],
          text: 'Once he is on the edge, bring your own king close to help. Then the queen delivers the final check.' },
      ],
      drills: { boss: { fen: '8/8/8/3k4/8/8/8/2Q1K3 w - - 0 1', maxMoves: 30, stars: [12, 18, 30], defender: 'Wizard Gus' } } },

    { id: 'rookmate', tier: 'Boss Fights', title: 'Boss: Rook Checkmate', icon: '🏰',
      blurb: 'King and one rook. Harder, slower, very satisfying.',
      steps: [
        { fen: '8/8/8/3k4/8/8/8/R3K3 w - - 0 1',
          text: 'One rook cannot do it alone. The rook builds a wall, and your king walks up to face his king.' },
        { fen: '4k3/8/4K3/8/8/8/8/R7 w - - 0 1', arrows: [{ from: 'a1', to: 'a8', color: 'good' }],
          text: 'When the kings stand face to face like this, the rook checks on the edge, and that is mate. Patience. Squeeze, do not chase.' },
      ],
      drills: { boss: { fen: '8/8/8/3k4/8/8/8/R3K3 w - - 0 1', maxMoves: 50, stars: [20, 30, 50], defender: 'King Bowie' } } },
  ];

  window.Academy = { UNITS, byId: id => UNITS.find(u => u.id === id) };
})();
