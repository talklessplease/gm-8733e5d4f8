// Gusmaster 3000 -- Spooky Season piece set. White is the trick-or-treat side (sheet-ghost pawns,
// candle-lit towers, candy-corn bishops, skeleton horses, a ghost-pumpkin queen, a mummy king); black is
// the haunted side (bats, haunted towers, witch cats, nightmare horses, a black-pumpkin queen, a vampire
// king). Classic silhouette cues kept: crown king, tower rook, tall pointy bishop, side-facing knight, small pawn.
(function () {
  const OL = '#1e1a2b';
  const S = `stroke="${OL}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const s2 = `stroke="${OL}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;
  const base = c => `<path d="M17 93 C17 86 30 83 50 83 C70 83 83 86 83 93 Z" fill="${c}" ${S}/>`;
  const shadow = (w, o) => `<ellipse cx="50" cy="86.5" rx="${w}" ry="2.4" fill="#000" opacity="${o}"/>`;

  // Extra motions ride on svgWrap's delayed .glow class (two classes outrank one), so every variant keeps
  // its own animation delay and the ghosts, bats and candles never move in sync.
  const FX = `<style>
    .glow.bob{animation-name:bob;animation-duration:3.2s;transform-box:view-box}
    @keyframes bob{50%{transform:translateY(-3.5px)}}
    .glow.flick{animation-name:flick;animation-duration:1.4s;animation-timing-function:linear}
    @keyframes flick{0%,100%{opacity:1}10%{opacity:.62}18%{opacity:.95}34%{opacity:.7}48%{opacity:1}66%{opacity:.58}80%{opacity:.9}}
    .glow.flapL,.glow.flapR{animation-name:flap;animation-duration:.55s;transform-box:fill-box}
    .glow.flapL{transform-origin:100% 40%}.glow.flapR{transform-origin:0 40%}
    @keyframes flap{50%{transform:scaleY(.42)}}
    .glow.flame{animation-name:flame;animation-duration:.75s;animation-timing-function:linear;transform-box:fill-box;transform-origin:50% 100%}
    @keyframes flame{0%,100%{transform:none}30%{transform:scale(1.04,1.1) skewX(-3deg)}65%{transform:scale(.97,.92) skewX(3deg)}}
  </style>`;

  const P = {
    w: { base: '#f4ecdd', sheet: '#fbf9f4', bone: '#f3ead6', bone2: '#c9b994', stone: '#efe5d1', stone2: '#c7b797', door: '#8a5a34',
         pump: '#f7f0e2', pump2: '#ddd0b6', carve: '#ffb43c', crown: '#f4c95d', gem: '#d33a4f', candy: ['#fffaf0', '#ffad4f', '#ffe08a'] },
    b: { base: '#2a2238', fur: '#2f2939', fur2: '#1b1722', stone: '#3e364b', stone2: '#262030', pump: '#3c2e4c', pump2: '#251b30',
         carve: '#9dff5a', eye: '#ffd23a', hat: '#2a2040', band: '#ff8a2a', cape: '#17131d', lining: '#c4182f', skin: '#ddd7e6',
         crown: '#8f86a6', gem: '#b05cff' },
  };

  // A pumpkin: five lobes, a carved glowing face (white side warm orange, black side witch green).
  const LOBES = [[33, 14, 17], [67, 14, 17], [42, 13, 18.5], [58, 13, 18.5], [50, 11, 19]];
  const pumpkin = (C, crownFill, gem) => `${base(C.base)}
    ${LOBES.map(([x, rx, ry]) => `<ellipse cx="${x}" cy="68" rx="${rx}" ry="${ry}" fill="${C.pump}" ${S}/>`).join('')}
    ${LOBES.map(([x, rx, ry]) => `<ellipse cx="${x}" cy="68" rx="${rx}" ry="${ry}" fill="${C.pump}"/>`).join('')}
    <path d="M40 51 Q33 68 40 86 M60 51 Q67 68 60 86 M30 54 Q22 68 30 83 M70 54 Q78 68 70 83" stroke="${C.pump2}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <g class="glow flick">
      <ellipse cx="50" cy="69" rx="19" ry="12" fill="${C.carve}" opacity=".16"/>
      <path d="M35 64 L45 64 L40 56 Z M55 64 L65 64 L60 56 Z M47.5 69 L52.5 69 L50 65 Z" fill="${C.carve}" ${s2}/>
      <path d="M32 72 Q50 86 68 72 L64 73.5 L61 77 L57 74.5 L53 79 L50 75.5 L47 79 L43 74.5 L39 77 L36 73.5 Z" fill="${C.carve}" ${s2}/></g>
    <path d="M35 51 L33 36 L41 43 L45 30 L50 41 L55 30 L59 43 L67 36 L65 51 Q50 47 35 51 Z" fill="${crownFill}" ${S}/>
    <circle cx="33" cy="35" r="2.2" fill="${crownFill}" ${s2}/><circle cx="45" cy="29" r="2.2" fill="${crownFill}" ${s2}/>
    <circle cx="55" cy="29" r="2.2" fill="${crownFill}" ${s2}/><circle cx="67" cy="35" r="2.2" fill="${crownFill}" ${s2}/>
    <circle cx="50" cy="45.5" r="2.6" fill="${gem}"/>`;

  // A horse head facing left (the knight). Filled per side; the details make it bones or nightmare.
  const HORSE = 'M64 86 C66 70 70 56 66 40 C64 30 58 22 51 19 L49 10 L42 19 C34 22 28 28 24 36 L16 49 C14 55 18 59 24 58 L33 55 C37 57 39 60 37 64 C33 70 32 78 34 86 Z';

  // A tower (the rook): crenellated top, arched window, door. Haunted: tilted top, glowing eyes, door mouth.
  const tower = (C, haunted) => `${base(C.base)}
    <path d="M33 85 L35 44 L65 44 L67 85 Z" fill="${C.stone}" ${S}/>
    <path d="M35 54 h30 M34.6 64 h31 M34.2 74 h32 M44 44 v10 M56 54 v10 M42 64 v10 M58 74 v10" stroke="${C.stone2}" stroke-width="1.6"/>
    <g ${haunted ? 'transform="rotate(-5 50 40)"' : ''}><path d="M27 45 L73 45 L73 26 L65 26 L65 32 L57 32 L57 26 L43 26 L43 32 L35 32 L35 26 L27 26 Z" fill="${C.stone}" ${S}/>
      <path d="M27 38 h46" stroke="${C.stone2}" stroke-width="1.6"/></g>
    ${haunted
      ? `<path d="M37 49 l4 4 l-2 4 M63 66 l-4 3 l2 4" stroke="${C.stone2}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
         <g class="glow"><path d="M38 64 L38 58 Q42 52 46 58 L46 64 Z M54 64 L54 58 Q58 52 62 58 L62 64 Z" fill="${C.carve}" ${s2}/></g>
         <path d="M42 85 L42 75 L45.5 78 L50 72 L54.5 78 L58 75 L58 85 Z" fill="#0e0b12" ${s2}/>
         <path d="M45.5 78 l1.5 3 l1.5 -3 M51.5 78 l1.5 3 l1.5 -3" fill="#e9e4f2"/>`
      : `<g class="glow flick"><path d="M44 66 L44 57 Q50 48 56 57 L56 66 Z" fill="#ffd27a" ${s2}/></g>
         <path d="M50 51.5 V66 M44 60 H56" stroke="${OL}" stroke-width="1.6"/>
         <path d="M45 85 L45 78 Q50 72 55 78 L55 85 Z" fill="${C.door}" ${s2}/><circle cx="53" cy="80" r=".9" fill="${OL}"/>
         <ellipse cx="25" cy="85" rx="7" ry="5.5" fill="#f08a24" ${s2}/><path d="M25 79.5 l1 -3" stroke="#5a7a2a" stroke-width="2" stroke-linecap="round"/>
         <g class="glow flick"><path d="M22 84 l1.6 -2.4 l1.6 2.4 Z M25.6 84 l1.6 -2.4 l1.6 2.4 Z M22 86.6 q3 2 6 0" fill="#ffe27a" stroke="#ffe27a" stroke-width=".8"/></g>`}`;

  const SPOOKY = {
    // Pawns: a little sheet ghost with a pumpkin pail / a bat.
    p: (C, side) => side === 'w'
      ? `${base(C.base)}${shadow(12, .16)}
        <g class="glow bob">
          <path d="M35 80 L35 58 C35 45 41 39 50 39 C59 39 65 45 65 58 L65 80 Q62.5 76 60 80 Q57.5 76 55 80 Q52.5 76 50 80 Q47.5 76 45 80 Q42.5 76 40 80 Q37.5 76 35 80 Z" fill="${C.sheet}" ${S}/>
          <path d="M36 61 C30 61 27 65 29 69 C31 70 34 68 36 67" fill="${C.sheet}" ${s2}/>
          <path d="M60 70 Q66 60 72 70" fill="none" stroke="${OL}" stroke-width="1.6"/>
          <ellipse cx="66" cy="73" rx="6.5" ry="5.5" fill="#f08a24" ${s2}/>
          <path d="M63.5 72.5 l1.2 -1.8 l1.2 1.8 Z M66.6 72.5 l1.2 -1.8 l1.2 1.8 Z M63.6 75 q2.4 1.6 4.8 0" fill="#ffe27a" stroke="#7a3a0a" stroke-width=".7"/>
          <path d="M64 63 C70 62 72 66 69 69 C67 70 65 68 64 67" fill="${C.sheet}" ${s2}/>
          <g class="bl"><ellipse cx="45" cy="55" rx="2.6" ry="3.5" fill="${OL}"/><ellipse cx="55" cy="55" rx="2.6" ry="3.5" fill="${OL}"/></g>
          <ellipse cx="50" cy="63" rx="2" ry="2.6" fill="${OL}"/>
          <circle cx="40.5" cy="61" r="2.3" fill="#f3a9b8" opacity=".75"/><circle cx="59.5" cy="61" r="2.3" fill="#f3a9b8" opacity=".75"/></g>`
      : `${base(C.base)}${shadow(11, .3)}
        <g class="glow bob">
          <g class="glow flapL"><path d="M43 58 C37 49 28 45 17 47 C21 51 21 55 19 59 C24 57 28 59 29 64 C33 61 38 62 41 67 Z" fill="${C.fur}" ${S}/>
            <path d="M41 61 L22 50 M40 63 L30 60" stroke="#4a4258" stroke-width="1.4" fill="none"/></g>
          <g class="glow flapR"><path d="M57 58 C63 49 72 45 83 47 C79 51 79 55 81 59 C76 57 72 59 71 64 C67 61 62 62 59 67 Z" fill="${C.fur}" ${S}/>
            <path d="M59 61 L78 50 M60 63 L70 60" stroke="#4a4258" stroke-width="1.4" fill="none"/></g>
          <path d="M43 49 L41 38 L48 45 Z M57 49 L59 38 L52 45 Z" fill="${C.fur}" ${s2}/>
          <ellipse cx="50" cy="66" rx="8" ry="10" fill="${C.fur}" ${S}/>
          <circle cx="50" cy="52" r="9" fill="${C.fur}" ${S}/>
          <g class="glow"><ellipse cx="46.3" cy="51" rx="2.3" ry="2.6" fill="${C.eye}"/><ellipse cx="53.7" cy="51" rx="2.3" ry="2.6" fill="${C.eye}"/></g>
          <path d="M47 56.5 l1.2 3 l1.2 -3 Z M50.6 56.5 l1.2 3 l1.2 -3 Z" fill="#fff"/>
          <path d="M46 75 l-1 3 M54 75 l1 3" stroke="${OL}" stroke-width="2" stroke-linecap="round"/></g>`,

    // Rooks: a candle-lit tower with a jack-o'-lantern / a haunted tower with a face.
    r: (C, side) => tower(C, side === 'b'),

    // Bishops: a tall candy corn / a witch cat in a tall crooked hat.
    b: (C, side) => side === 'w'
      ? `${base(C.base)}
        <defs><clipPath id="cc"><path d="M50 11 C57 27 70 57 71 79 Q50 87 29 79 C30 57 43 27 50 11 Z"/></clipPath></defs>
        <g class="rock">
          <path d="M50 11 C57 27 70 57 71 79 Q50 87 29 79 C30 57 43 27 50 11 Z" fill="${C.candy[2]}"/>
          <g clip-path="url(#cc)"><rect x="20" y="8" width="60" height="30" fill="${C.candy[0]}"/>
            <path d="M20 37 Q50 44 80 37 L80 60 Q50 68 20 60 Z" fill="${C.candy[1]}"/></g>
          <path d="M50 11 C57 27 70 57 71 79 Q50 87 29 79 C30 57 43 27 50 11 Z" fill="none" ${S}/>
          <path d="M45 22 Q41 34 38 48" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".8"/>
          <g class="bl"><ellipse cx="44" cy="51" rx="2.3" ry="3" fill="${OL}"/><ellipse cx="56" cy="51" rx="2.3" ry="3" fill="${OL}"/>
            <circle cx="44.8" cy="50" r=".8" fill="#fff"/><circle cx="56.8" cy="50" r=".8" fill="#fff"/></g>
          <path d="M46 57 q4 3.5 8 0" fill="none" ${s2}/>
          <circle cx="40" cy="56" r="2.2" fill="#f07a7a" opacity=".55"/><circle cx="60" cy="56" r="2.2" fill="#f07a7a" opacity=".55"/></g>`
      : `${base(C.base)}
        <path d="M26 87 C26 72 36 64 50 64 C64 64 74 72 74 87 Z" fill="${C.hat}" ${S}/>
        <path d="M40 66 L50 76 L60 66" fill="#5a3a8a" ${s2}/>
        <ellipse cx="50" cy="56" rx="14" ry="12.5" fill="${C.fur}" ${S}/>
        <g class="glow"><path d="M40 55 Q44 50.5 48 55 Q44 58.5 40 55 Z M52 55 Q56 50.5 60 55 Q56 58.5 52 55 Z" fill="#c6ff5a"/></g>
        <path d="M44 52.5 v5 M56 52.5 v5" stroke="${OL}" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M48.5 60 h3 l-1.5 1.8 Z" fill="#e48aa0"/>
        <path d="M39 61 l-8 -1 M39 63 l-8 2 M61 61 l8 -1 M61 63 l8 2" stroke="#9a92aa" stroke-width="1" opacity=".8"/>
        <ellipse cx="50" cy="45" rx="23" ry="5" fill="${C.hat}" ${S}/>
        <path d="M38 44 C41 33 45 21 50 13 Q55 6 64 8 Q57 13 57 21 C57 29 60 37 62 44 Q50 47 38 44 Z" fill="${C.hat}" ${S}/>
        <path d="M39.5 38.5 Q50 41.5 60.5 38.5 L61.6 43 Q50 46 38.6 43 Z" fill="${C.band}" ${s2}/>
        <rect x="47" y="38.5" width="6" height="6" rx="1" fill="none" stroke="#ffd23a" stroke-width="1.6"/>`,

    // Knights: a skeleton horse / a nightmare horse with a flaming mane.
    n: (C, side) => side === 'w'
      ? `${base(C.base)}
        <path d="${HORSE}" fill="${C.bone}" ${S}/>
        <path d="M29 41 Q37 46 45 41" fill="none" stroke="${C.bone2}" stroke-width="2" stroke-linecap="round"/>
        <ellipse cx="38" cy="33" rx="5" ry="5.5" fill="${OL}"/><circle cx="38.6" cy="33.4" r="1.8" fill="#ffb43c" class="glow"/>
        <ellipse cx="19.5" cy="50" rx="1.8" ry="2.4" fill="${OL}"/>
        <path d="M17 55 L33 55 M20 53 v4 M23.5 53 v4 M27 53 v4 M30.5 53 v4" stroke="${OL}" stroke-width="1.3"/>
        ${[46, 56, 66, 76].map(y => `<ellipse cx="66" cy="${y}" rx="3.6" ry="3" fill="${C.bone}" ${s2}/>`).join('')}
        <path d="M40 66 Q48 66 52 72 M38 76 Q47 76 52 82" fill="none" stroke="${C.bone2}" stroke-width="2" stroke-linecap="round"/>`
      : `${base(C.base)}
        <g class="glow flame"><path d="M48 18 C53 9 60 13 58 19 C66 15 69 23 65 28 C73 28 73 37 68 41 C76 43 75 52 70 55 C78 58 75 67 69 68 C75 73 70 80 64 80 L62 44 C60 32 55 24 48 18 Z" fill="#ff7a1a" ${s2}/>
          <path d="M55 21 C59 19 61 23 60 26 C65 26 66 31 63 34 C68 36 67 42 64 45 C69 48 68 54 64 57 L61 42 C60 32 58 26 55 21 Z" fill="#ffd23a"/></g>
        <path d="${HORSE}" fill="${C.fur}" ${S}/>
        <path d="M29 41 Q37 46 45 41" fill="none" stroke="#4a4258" stroke-width="2" stroke-linecap="round"/>
        <g class="glow"><ellipse cx="38" cy="33" rx="3.6" ry="3" fill="#ff5a2a"/><circle cx="38" cy="33" r="1.3" fill="#ffe27a"/></g>
        <ellipse cx="19.5" cy="50" rx="1.8" ry="2.4" fill="#ff7a1a" class="glow"/>
        <path d="M17 56 q6 2 14 -1" fill="none" stroke="#4a4258" stroke-width="1.6" stroke-linecap="round"/>`,

    // Queens: a crowned ghost pumpkin / a crowned black pumpkin.
    q: C => pumpkin(C, C.crown, C.gem),

    // Kings: a crowned mummy / a crowned vampire in a high red collar.
    k: (C, side) => side === 'w'
      ? `${base(C.base)}
        <path d="M24 87 C24 68 35 60 50 60 C65 60 76 68 76 87 Z" fill="${C.bone}" ${S}/>
        <path d="M27 77 L73 70 M26 84 L74 78 M31 68 L69 64" stroke="${C.bone2}" stroke-width="2" stroke-linecap="round"/>
        <path d="M64 40 C72 38 78 42 82 36 L84 42 C79 47 72 45 65 47 Z" fill="${C.bone}" ${s2} class="sw" style="transform-origin:0 60%"/>
        <circle cx="50" cy="46" r="17" fill="${C.bone}" ${S}/>
        <path d="M35 38 Q50 34 65 39 M34 54 Q50 51 66 56 M37 60 Q50 58 62 61" stroke="${C.bone2}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M34 43 Q50 40 66 44 L66 50 Q50 46.5 34 49.5 Z" fill="${OL}"/>
        <g class="bl"><circle cx="44" cy="45.6" r="3.2" fill="#fff"/><circle cx="44.6" cy="46" r="1.6" fill="${OL}"/>
          <circle cx="56.5" cy="46.2" r="2.4" fill="#fff"/><circle cx="57" cy="46.5" r="1.2" fill="${OL}"/></g>
        <path d="M34 31 L32 15 L41 23 L50 11 L59 23 L68 15 L66 31 Q50 28 34 31 Z" fill="${C.crown}" ${S}/>
        <path d="M50 11 V4 M47 6.5 H53" stroke="${OL}" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="50" cy="24" r="2.6" fill="${C.gem}"/><circle cx="41" cy="27" r="1.8" fill="#3a8ee0"/><circle cx="59" cy="27" r="1.8" fill="#3a8ee0"/>`
      : `${base(C.base)}
        <path d="M17 88 C19 66 30 56 50 56 C70 56 81 66 83 88 Z" fill="${C.cape}" ${S}/>
        <path d="M38 88 L44 62 L50 70 L56 62 L62 88 Z" fill="${C.lining}" ${s2}/>
        <path d="M44 62 L50 70 L56 62 L56 88 L44 88 Z" fill="#2c2634"/><path d="M47 62 L50 67 L53 62 Z" fill="#eeeaf4"/>
        <circle cx="50" cy="73" r="3" fill="${C.lining}" stroke="#ffd23a" stroke-width="1.4"/>
        <path d="M30 60 L17 26 L42 47 Z M70 60 L83 26 L58 47 Z" fill="${C.cape}" ${S}/>
        <path d="M31 55 L22 33 L40 48 Z M69 55 L78 33 L60 48 Z" fill="${C.lining}"/>
        <ellipse cx="50" cy="45" rx="13.5" ry="14.5" fill="${C.skin}" ${S}/>
        <path d="M36 44 C35 32 42 27 50 27 C58 27 65 32 64 44 C61 38 56 36 50 42 C44 36 39 38 36 44 Z" fill="#141018"/>
        <g class="glow"><ellipse cx="45" cy="46" rx="2.2" ry="2" fill="#ff3b4f"/><ellipse cx="55" cy="46" rx="2.2" ry="2" fill="#ff3b4f"/></g>
        <path d="M45 52 q5 2.5 10 0" fill="none" stroke="${OL}" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M46.6 52.4 l1 3 l1 -2.6 Z M51.4 52.6 l1 2.6 l1 -3 Z" fill="#fff"/>
        <path d="M37 31 L35 16 L43 23 L50 12 L57 23 L65 16 L63 31 Q50 28 37 31 Z" fill="${C.crown}" ${S}/>
        <circle cx="50" cy="24" r="2.6" fill="${C.lining}"/><circle cx="43" cy="27" r="1.6" fill="${C.gem}"/><circle cx="57" cy="27" r="1.6" fill="${C.gem}"/>`,
  };

  // Sounds, played with Core's kit A = { tone, noise, meow, purr, saber }.
  const pack = {
    move: A => { A.noise(0.24, 0.09, 520); A.tone(250, 0.24, 'sine', 0.03, 150); },
    capture: (t, A) => {
      if (t === 'p') { A.tone(560, 0.3, 'sine', 0.07, 340); }                                   // a little "boo"
      else if (t === 'b') [0, 1, 2, 3, 4].forEach(i => A.tone(780 - i * 36, 0.07, 'sawtooth', 0.035, 560 - i * 30, i * 0.085));   // witch cackle
      else if (t === 'n') [0, 1, 2, 3].forEach(i => A.tone(980 - i * 110, 0.1, 'sawtooth', 0.03, 720 - i * 90, i * 0.075));       // ghost-horse whinny
      else if (t === 'r') { A.tone(140, 0.7, 'sine', 0.09, 95); [0, 110, 200, 300].forEach(ms => setTimeout(() => A.noise(0.05, 0.07, 5000), ms)); }  // moan and chains
      else {                                                                                       // ooOOoo
        A.tone(300, 0.45, 'sine', 0.08, 500); A.tone(500, 0.65, 'sine', 0.075, 250, 0.4); A.tone(600, 0.5, 'triangle', 0.02, 1000);
        if (t === 'q') [0, 1, 2, 3].forEach(i => A.tone(820 - i * 40, 0.07, 'sawtooth', 0.03, 600 - i * 30, 1.05 + i * 0.085));
      }
    },
    // A little pipe organ: three quick notes, then a big D minor chord.
    promote: A => {
      [880, 784, 880].forEach((f, i) => A.tone(f, i === 2 ? 0.45 : 0.12, 'sawtooth', 0.03, null, i * 0.13));
      [146.8, 293.7, 349.2, 440, 587.3].forEach(f => { A.tone(f, 1.3, 'triangle', 0.05, null, 0.72); A.tone(f * 2, 1.3, 'sine', 0.014, null, 0.72); });
    },
  };

  PieceSets.register('spooky', { name: 'Spooky Season', blurb: 'Trick-or-treaters vs the haunted house. Boo.', board: 'spooky',
    draw: (t, side) => FX + SPOOKY[t](P[side], side), pack });
  PieceSets.registerBoard('spooky', 'Haunted night');

  // The board: candlelit parchment and dusk purple, in a pumpkin-glow frame that breathes.
  const css = document.createElement('style');
  css.textContent = `
    .board[data-theme="spooky"], .gboard[data-theme="spooky"] { --light: #ead8bc; --dark: #6b5487; }
    .board[data-theme="spooky"] { box-shadow: 0 0 0 6px #1c1326, 0 0 0 9px #e2761b, 0 0 24px 9px #ff8a1f55, 0 0 60px 18px #7b3fd426, 0 22px 50px #000a;
      animation: spookyframe 4.5s ease-in-out infinite; }
    .gboard[data-theme="spooky"] { box-shadow: 0 0 0 3px #e2761b, 0 0 14px 4px #ff8a1f55; }
    @keyframes spookyframe { 50% { box-shadow: 0 0 0 6px #1c1326, 0 0 0 9px #f08a2a, 0 0 32px 12px #ff8a1f77, 0 0 70px 24px #7b3fd440, 0 22px 50px #000a; } }`;
  document.head.appendChild(css);
})();
