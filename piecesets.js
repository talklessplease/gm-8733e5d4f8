// Gusmaster 3000 -- themed piece sets, drawn as SVG (100x100), turned into CSS background images.
// Every piece keeps a classic silhouette cue (crown king, tower rook, pointy bishop, side-facing
// knight, small pawn) so the board stays readable. Each piece comes in 3 variants with different
// animation delays, so the cats on the board do not all blink in sync.
(function () {
  const OL = '#1e1a2b';                       // outline colour shared by every themed piece
  const svgWrap = (body, delay) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><style>
    .bl{animation:bl 5.5s ${delay}s infinite;transform-box:fill-box;transform-origin:center}
    @keyframes bl{0%,93%,100%{transform:scaleY(1)}95.5%{transform:scaleY(.1)}}
    .sw{animation:sw 3.4s ${delay}s ease-in-out infinite;transform-box:fill-box}
    @keyframes sw{50%{transform:rotate(-10deg)}}
    .wig{animation:wig 1.7s ${delay}s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
    @keyframes wig{0%,70%,100%{transform:none}78%{transform:translateY(-1px)}86%{transform:translateY(.6px)}}
    .rock{animation:rock 2.6s ${delay}s ease-in-out infinite;transform-box:view-box;transform-origin:50px 88px}
    @keyframes rock{25%{transform:rotate(-2.5deg)}75%{transform:rotate(2.5deg)}}
    .glow{animation:glow 1.6s ${delay}s ease-in-out infinite}
    @keyframes glow{50%{opacity:.55}}
    .zap{animation:zap .9s ${delay}s steps(2) infinite}
    @keyframes zap{50%{opacity:.15}}
  </style>${body}</svg>`;
  const S = `stroke="${OL}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const s2 = `stroke="${OL}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;
  const base = c => `<path d="M17 93 C17 86 30 83 50 83 C70 83 83 86 83 93 Z" fill="${c}" ${S}/>`;

  // ---------------- Set 1: Team Gus (white) vs Team Bowie (black) ----------------
  const CAT = {
    w: { fur: '#bcc4cf', fur2: '#97a1ae', inner: '#e3b7c0', eye: '#f2bd36', bib: '#e9edf2', base: '#f4ecdd', stripe: null,
         carpet: '#efe3cc', rope: '#c9ad7e', box: '#e8c58f', box2: '#d3a96a', robot: '#f6f6f6', robot2: '#c9ccd3', cushion: '#e6d3ff', cushion2: '#c3a6ef',
         mouse: '#f4f1ea', mouse2: '#d8d2c6' },
    b: { fur: '#7a5a3f', fur2: '#5b4330', inner: '#e8c3b0', eye: '#a6c95a', bib: '#f1eadc', base: '#3a2f48', stripe: '#3a2a1e',
         carpet: '#6a5240', rope: '#94744f', box: '#9a6a3b', box2: '#7b5229', robot: '#34343c', robot2: '#1f1f25', cushion: '#8c2338', cushion2: '#6a1828',
         mouse: '#8b6a52', mouse2: '#6e523e' },
  };
  // A front-facing cat head. tufts/bib/stripes for Bowie's side.
  function catHead(cx, cy, r, P, { tufts = false } = {}) {
    const ex = r * 0.42, ey = cy - r * 0.05, er = r * 0.2;
    let s = `<path d="M${cx - r * .95} ${cy - r * .2} L${cx - r * 1.0} ${cy - r * 1.35} L${cx - r * .2} ${cy - r * .85} Z" fill="${P.fur}" ${S}/>
      <path d="M${cx + r * .95} ${cy - r * .2} L${cx + r * 1.0} ${cy - r * 1.35} L${cx + r * .2} ${cy - r * .85} Z" fill="${P.fur}" ${S}/>
      <path d="M${cx - r * .78} ${cy - r * .45} L${cx - r * .84} ${cy - r * 1.08} L${cx - r * .38} ${cy - r * .8} Z" fill="${P.inner}"/>
      <path d="M${cx + r * .78} ${cy - r * .45} L${cx + r * .84} ${cy - r * 1.08} L${cx + r * .38} ${cy - r * .8} Z" fill="${P.inner}"/>`;
    if (tufts) s += `<path d="M${cx - r * 1.0} ${cy - r * 1.35} l-1 -6 l4 4 Z M${cx + r * 1.0} ${cy - r * 1.35} l1 -6 l-4 4 Z" fill="${P.stripe}" ${s2}/>`;
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${r * 1.05}" ry="${r * .92}" fill="${P.fur}" ${S}/>`;
    if (P.stripe) s += `<path d="M${cx} ${cy - r * .9} v${r * .4} M${cx - r * .3} ${cy - r * .85} l2 ${r * .35} M${cx + r * .3} ${cy - r * .85} l-2 ${r * .35}" stroke="${P.stripe}" stroke-width="2.4" stroke-linecap="round"/>
      <ellipse cx="${cx}" cy="${cy + r * .45}" rx="${r * .55}" ry="${r * .38}" fill="${P.bib}"/>`;
    s += `<g class="bl"><ellipse cx="${cx - ex}" cy="${ey}" rx="${er}" ry="${er * 1.1}" fill="${P.eye}" ${s2}/><ellipse cx="${cx - ex}" cy="${ey}" rx="${er * .32}" ry="${er * .85}" fill="${OL}"/>
      <ellipse cx="${cx + ex}" cy="${ey}" rx="${er}" ry="${er * 1.1}" fill="${P.eye}" ${s2}/><ellipse cx="${cx + ex}" cy="${ey}" rx="${er * .32}" ry="${er * .85}" fill="${OL}"/></g>
      <path d="M${cx - r * .12} ${cy + r * .28} h${r * .24} l-${r * .12} ${r * .14} Z" fill="#c9858f"/>
      <path d="M${cx} ${cy + r * .42} v${r * .08} M${cx - r * .2} ${cy + r * .55} q${r * .1} ${r * .1} ${r * .2} 0 q${r * .1} ${r * .1} ${r * .2} 0" fill="none" ${s2}/>`;
    return s;
  }
  const crown = (cx, top, w, h) => `<path d="M${cx - w / 2} ${top + h} L${cx - w / 2 - 2} ${top} L${cx - w / 4} ${top + h * .55} L${cx} ${top - 3} L${cx + w / 4} ${top + h * .55} L${cx + w / 2 + 2} ${top} L${cx + w / 2} ${top + h} Z" fill="#f4c95d" ${S}/>
    <circle cx="${cx}" cy="${top + h * .62}" r="2.6" fill="#d33a4f"/><circle cx="${cx - w / 4}" cy="${top + h * .78}" r="1.8" fill="#3a8ee0"/><circle cx="${cx + w / 4}" cy="${top + h * .78}" r="1.8" fill="#3a8ee0"/>`;

  const CATS = {
    p: P => `${base(P.base)}
      <path d="M64 86 C82 86 86 72 78 66" fill="none" stroke="#e7a3b0" stroke-width="3" stroke-linecap="round" class="sw" style="transform-origin:64px 86px"/>
      <ellipse cx="50" cy="71" rx="15" ry="15" fill="${P.mouse}" ${S}/>
      <circle cx="38" cy="45" r="8.5" fill="${P.mouse}" ${S}/><circle cx="38" cy="45" r="4.6" fill="#f1b6c2"/>
      <circle cx="62" cy="45" r="8.5" fill="${P.mouse}" ${S}/><circle cx="62" cy="45" r="4.6" fill="#f1b6c2"/>
      <ellipse cx="50" cy="55" rx="12" ry="11" fill="${P.mouse}" ${S}/>
      <g class="bl"><circle cx="45" cy="53" r="2.2" fill="${OL}"/><circle cx="55" cy="53" r="2.2" fill="${OL}"/></g>
      <g class="wig"><circle cx="50" cy="60" r="2.4" fill="#e98fa0"/><path d="M45 60 l-9 -2 M45 62 l-9 2 M55 60 l9 -2 M55 62 l9 2" stroke="${OL}" stroke-width="1" opacity=".7"/></g>
      <ellipse cx="44" cy="80" rx="4" ry="2.6" fill="${P.mouse2}"/><ellipse cx="56" cy="80" rx="4" ry="2.6" fill="${P.mouse2}"/>`,
    r: P => `${base(P.base)}
      <path d="M33 44 L67 44 L67 85 L33 85 Z" fill="${P.carpet}" ${S}/>
      <path d="M33 66 h34 M33 72 h34 M33 78 h34" stroke="${P.rope}" stroke-width="3"/>
      <circle cx="50" cy="55" r="9.5" fill="${OL}"/>
      <g class="bl"><ellipse cx="46" cy="55" rx="2.4" ry="2.8" fill="${P.eye}"/><ellipse cx="54" cy="55" rx="2.4" ry="2.8" fill="${P.eye}"/></g>
      <path d="M22 44 L78 44 L78 28 L70 28 L70 21 L61 21 L61 28 L54 28 L54 21 L46 21 L46 28 L39 28 L39 21 L30 21 L30 28 L22 28 Z" fill="${P.carpet}" ${S}/>
      <path d="M72 44 C76 52 74 58 70 62" fill="none" stroke="${P.fur}" stroke-width="5" stroke-linecap="round" class="sw" style="transform-origin:72px 44px"/>
      <path d="M72 44 C76 52 74 58 70 62" fill="none" stroke="${OL}" stroke-width="1.4" stroke-linecap="round" opacity=".5" class="sw" style="transform-origin:72px 44px"/>`,
    b: (P, side) => `${base(P.base)}
      ${catHead(50, 44, 15, P, { tufts: side === 'b' })}
      <path d="M26 50 L74 50 L72 86 L28 86 Z" fill="${P.box}" ${S}/>
      <path d="M26 50 L14 34 L36 40 L44 50 Z" fill="${P.box2}" ${S}/>
      <path d="M74 50 L86 34 L64 40 L56 50 Z" fill="${P.box2}" ${S}/>
      <path d="M27 58 L73 58 L72.6 64 L27.4 64 Z" fill="#d9c79a" opacity=".85"/>
      <path d="M40 72 l4 -5 l4 5 M44 67 v10" fill="none" stroke="${P.box2}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M52 74 h12 M52 78 h9" stroke="${P.box2}" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M37 50 q4 -5 8 0 M55 50 q4 -5 8 0" fill="${P.fur}" ${s2}/>`,
    n: P => `<g class="rock">
      <path d="M16 78 L16 86 C16 92 30 95 50 95 C70 95 84 92 84 86 L84 78 Z" fill="${P.robot2}" ${S}/>
      <ellipse cx="50" cy="78" rx="34" ry="9" fill="${P.robot}" ${S}/>
      <ellipse cx="50" cy="78" rx="24" ry="5.5" fill="none" stroke="${P.robot2}" stroke-width="1.6"/>
      <circle cx="50" cy="78" r="3.2" fill="${P.robot2}" ${s2}/><circle cx="62" cy="76" r="1.8" fill="#4cd96b" class="glow"/>
      <g class="wig"><path d="M18 88 l-8 2 M18 88 l-7 -3 M18 88 l-2 6" stroke="${OL}" stroke-width="1.6" stroke-linecap="round"/></g>
      <path d="M72 62 C88 58 88 38 78 36" fill="none" stroke="${P.fur}" stroke-width="5.5" stroke-linecap="round" class="sw" style="transform-origin:72px 62px"/>
      <path d="M72 62 C88 58 88 38 78 36" fill="none" stroke="${OL}" stroke-width="1.2" stroke-linecap="round" opacity=".45" class="sw" style="transform-origin:72px 62px"/>
      <ellipse cx="56" cy="60" rx="19" ry="15" fill="${P.fur}" ${S}/>
      <path d="M26 34 L25 15 L37 27 Z M40 28 L45 13 L49 30 Z" fill="${P.fur}" ${S}/>
      <path d="M28 30 L27.5 20 L33 26 Z" fill="${P.inner}"/>
      <circle cx="37" cy="40" r="13" fill="${P.fur}" ${S}/>
      ${P.stripe ? `<path d="M37 28 v6 M43 30 l-2 5" stroke="${P.stripe}" stroke-width="2.2" stroke-linecap="round"/>` : ''}
      <g class="bl"><ellipse cx="31" cy="38" rx="3.4" ry="3.9" fill="${P.eye}" ${s2}/><ellipse cx="30.6" cy="38" rx="1.1" ry="3" fill="${OL}"/></g>
      <path d="M24 44 l3.5 -1.5 l0 3 Z" fill="#c9858f"/><path d="M24 47 q3 2 6 0" fill="none" stroke="${OL}" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M46 70 q-3 4 0 8 M60 72 q2 4 5 5" fill="none" ${s2}/></g>`,
    q: (P, side) => `<path d="M14 92 C14 80 30 76 50 76 C70 76 86 80 86 92 Z" fill="${P.cushion}" ${S}/>
      <path d="M20 84 q30 8 60 0" fill="none" stroke="${P.cushion2}" stroke-width="2.5"/>
      <circle cx="16" cy="91" r="3" fill="#f4c95d" ${s2}/><circle cx="84" cy="91" r="3" fill="#f4c95d" ${s2}/>
      <path d="M66 74 C86 70 86 46 74 44" fill="none" stroke="${P.fur}" stroke-width="6" stroke-linecap="round" class="sw" style="transform-origin:66px 74px"/>
      <path d="M33 78 C29 60 36 46 50 46 C64 46 71 60 67 78 Z" fill="${P.fur}" ${S}/>
      <path d="M42 78 C41 66 44 58 50 58 C56 58 59 66 58 78 Z" fill="${side === 'b' ? P.bib : P.bib}" opacity="${side === 'b' ? 1 : .55}"/>
      ${catHead(50, 36, 14, P, { tufts: side === 'b' })}
      <path d="M40 22 L39 13 L45 18 L50 10 L55 18 L61 13 L60 22 Z" fill="#f4c95d" ${s2}/><circle cx="50" cy="17" r="1.8" fill="#d33a4f"/>`,
    k: (P, side) => `${base(P.base)}
      <path d="M22 86 C22 66 34 60 50 60 C66 60 78 66 78 86 Z" fill="${P.fur}" ${S}/>
      <path d="M38 86 C38 74 43 68 50 68 C57 68 62 74 62 86 Z" fill="${P.bib}" opacity="${side === 'b' ? 1 : .5}"/>
      ${side === 'b' ? `<path d="M22 86 L24 70 L34 64 L30 86 Z M78 86 L76 70 L66 64 L70 86 Z" fill="#8e1b2e" ${s2}/>` : ''}
      ${catHead(50, 47, 18, P, { tufts: side === 'b' })}
      ${crown(50, 12, 28, 15)}`,
  };

  // ---------------- Set 2: Space Saga (light side white, dark side black) ----------------
  const SPACE = {
    w: { robe: '#d8c39a', robe2: '#b79f72', skin: '#f2d2b0', armor: '#f2f2ee', armor2: '#c9ccd2', accent: '#e8792b', saber: '#4fb3ff', base: '#eef0f6' },
    b: { robe: '#2b2733', robe2: '#17141d', skin: '#d9d2c4', armor: '#2e2f38', armor2: '#16171d', accent: '#c4303b', saber: '#ff3b3b', base: '#2a2238' },
  };
  const saber = (x1, y1, x2, y2, c) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${c}" stroke-width="7" stroke-linecap="round" opacity=".45" class="glow"/>
    <path d="M${x1} ${y1} L${x2} ${y2}" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>`;
  const SPACESET = {
    p: (P, side) => `${base(P.base)}
      <path d="M30 86 C30 72 38 68 50 68 C62 68 70 72 70 86 Z" fill="${P.armor}" ${S}/>
      ${side === 'w'
        ? `<path d="M32 58 C32 40 40 32 50 32 C60 32 68 40 68 58 C68 66 60 70 50 70 C40 70 32 66 32 58 Z" fill="${P.armor}" ${S}/>
           <path d="M34 50 h32" stroke="${P.accent}" stroke-width="5"/><path d="M38 54 h24 v6 h-24 Z" fill="#3a3f4a" ${s2}/>
           <circle cx="44" cy="40" r="3" fill="${P.accent}"/><circle cx="56" cy="40" r="3" fill="#3a8ee0"/>`
        : `<path d="M31 60 C30 40 38 30 50 30 C62 30 70 40 69 60 L66 70 L34 70 Z" fill="#4a4b58" ${S}/>
           <path d="M34 44 C40 40 60 40 66 44" fill="none" stroke="#6c6e7e" stroke-width="2"/>
           <path d="M36 49 L47 47 L46 57 L38 58 Z M64 49 L53 47 L54 57 L62 58 Z" fill="#0d0e13" stroke="#8a8d9e" stroke-width="1.6" stroke-linejoin="round"/>
           <path d="M39 51 l5 -1 M56 50 l5 1" stroke="${P.accent}" stroke-width="1.8" class="glow"/>
           <path d="M43 62 L57 62 L55 69 L45 69 Z" fill="#0d0e13" stroke="#8a8d9e" stroke-width="1.4"/>
           <path d="M46 64 v4 M50 64 v4 M54 64 v4" stroke="#6c6e7e" stroke-width="1.2"/>
           <circle cx="32" cy="58" r="3" fill="#2a2b33" stroke="#8a8d9e" stroke-width="1.2"/><circle cx="68" cy="58" r="3" fill="#2a2b33" stroke="#8a8d9e" stroke-width="1.2"/>`}`,
    r: (P, side) => side === 'w'
      ? `${base(P.base)}
        <path d="M24 60 L18 88 L28 88 L30 64 Z M76 60 L82 88 L72 88 L70 64 Z" fill="${P.armor2}" ${S}/>
        <path d="M30 46 L70 46 L68 84 L32 84 Z" fill="${P.armor}" ${S}/>
        <path d="M36 54 h10 v12 h-10 Z M54 54 h10 v6 h-10 Z" fill="#3a7bd5" ${s2}/><path d="M38 72 h24" stroke="#3a7bd5" stroke-width="3"/>
        <path d="M30 46 C30 28 38 20 50 20 C62 20 70 28 70 46 Z" fill="#c9ced6" ${S}/>
        <path d="M38 30 h10 v6 h-10 Z" fill="#3a7bd5" ${s2}/><circle cx="58" cy="34" r="4" fill="#1e1a2b"/><circle cx="58" cy="34" r="2" fill="#ff4d4d" class="glow"/>`
      : `${base(P.base)}
        <path d="M44 82 L56 82 L54 70 L46 70 Z" fill="${P.armor2}" ${s2}/>
        <path d="M14 24 L26 18 L26 82 L14 76 Z M86 24 L74 18 L74 82 L86 76 Z" fill="${P.armor}" ${S}/>
        <path d="M17 30 L23 27 M17 50 L23 50 M17 70 L23 73 M83 30 L77 27 M83 50 L77 50 M83 70 L77 73" stroke="#5a5c68" stroke-width="2"/>
        <path d="M26 50 h48" stroke="${P.armor}" stroke-width="7"/><path d="M26 50 h48" stroke="${OL}" stroke-width="2"/>
        <circle cx="50" cy="50" r="16" fill="${P.armor}" ${S}/><circle cx="50" cy="50" r="9" fill="#11131a" ${s2}/>
        <path d="M50 41 v18 M41 50 h18 M44 44 l12 12 M56 44 l-12 12" stroke="#4a4d5c" stroke-width="1.6"/>`,
    b: (P, side) => `${base(P.base)}
      ${saber(70, 76, 70, 12, P.saber)}
      <path d="M66 66 h8 v12 h-8 Z" fill="#9aa0aa" ${s2}/>
      <path d="M28 86 C26 66 32 50 38 44 L62 44 C68 50 74 66 72 86 Z" fill="${P.robe}" ${S}/>
      <path d="M50 46 L50 86" stroke="${P.robe2}" stroke-width="3"/>
      <path d="M33 46 C31 30 40 18 50 18 C60 18 69 30 67 46 Z" fill="${P.robe}" ${S}/>
      <ellipse cx="50" cy="38" rx="10" ry="11" fill="${side === 'w' ? '#5a4632' : '#0d0b10'}"/>
      ${side === 'w' ? `<ellipse cx="50" cy="40" rx="7" ry="8" fill="${P.skin}"/><g class="bl"><circle cx="47" cy="39" r="1.3" fill="${OL}"/><circle cx="53" cy="39" r="1.3" fill="${OL}"/></g>`
                     : `<g class="glow"><circle cx="46" cy="38" r="1.8" fill="#ffd23a"/><circle cx="54" cy="38" r="1.8" fill="#ffd23a"/></g>`}
      <ellipse cx="68" cy="66" rx="5" ry="4" fill="${P.robe}" ${s2}/>`,
    n: (P, side) => side === 'w'
      ? `${base(P.base)}
        <path d="M58 86 L58 62 C70 60 78 50 74 36 L66 28 C58 24 46 24 40 30 L22 40 C16 44 18 52 26 54 L40 52 L46 58 L42 86 Z" fill="#e9e3d6" ${S}/>
        <path d="M60 30 C70 18 84 22 80 34 C78 40 70 38 70 32" fill="none" stroke="#b9a37a" stroke-width="5" stroke-linecap="round"/>
        <path d="M60 30 C70 18 84 22 80 34 C78 40 70 38 70 32" fill="none" ${s2}/>
        <path d="M48 60 l-3 8 M54 62 l0 9 M60 64 l3 8 M64 46 l6 4 M66 52 l6 2" stroke="#b8ae9c" stroke-width="2" stroke-linecap="round"/>
        <g class="bl"><circle cx="46" cy="38" r="3.4" fill="${OL}"/><circle cx="47" cy="37" r="1" fill="#fff"/></g>
        <path d="M22 46 h6" stroke="${OL}" stroke-width="2"/>`
      : `${base(P.base)}
        <path d="M44 62 L36 86 M56 62 L64 86" stroke="${P.armor2}" stroke-width="6" stroke-linecap="round"/>
        <path d="M44 62 L36 86 M56 62 L64 86" stroke="#5a5c68" stroke-width="2" stroke-linecap="round"/>
        <path d="M20 30 L70 26 L80 40 L74 58 L30 60 L18 46 Z" fill="${P.armor}" ${S}/>
        <path d="M20 40 h-8 M22 48 h-10" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>
        <path d="M30 36 L46 34 L46 42 L30 44 Z" fill="#11131a" ${s2}/><circle cx="36" cy="39" r="1.6" fill="${P.accent}" class="glow"/>
        <path d="M54 34 L68 32 M56 46 L72 44" stroke="#5a5c68" stroke-width="2"/>`,
    q: (P, side) => side === 'w'
      ? `${base(P.base)}
        <path d="M24 88 C26 70 34 52 42 46 L58 46 C66 52 74 70 76 88 Z" fill="#f7f7f2" ${S}/>
        <path d="M44 52 L50 60 L56 52" fill="none" stroke="#c9ccd2" stroke-width="2"/><path d="M38 72 h24" stroke="#c9ccd2" stroke-width="2"/>
        <circle cx="30" cy="30" r="9" fill="#6b4226" ${S}/><circle cx="70" cy="30" r="9" fill="#6b4226" ${S}/>
        <path d="M30 30 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0" fill="none" stroke="#4a2c18" stroke-width="1.6"/>
        <path d="M70 30 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0" fill="none" stroke="#4a2c18" stroke-width="1.6"/>
        <ellipse cx="50" cy="32" rx="14" ry="15" fill="${P.skin}" ${S}/>
        <path d="M36 28 C38 16 62 16 64 28 C58 22 42 22 36 28 Z" fill="#6b4226" ${s2}/>
        <g class="bl"><circle cx="45" cy="33" r="1.8" fill="${OL}"/><circle cx="55" cy="33" r="1.8" fill="${OL}"/></g>
        <path d="M46 40 q4 3 8 0" fill="none" stroke="#b5554f" stroke-width="1.8" stroke-linecap="round"/>`
      : `${base(P.base)}
        ${saber(76, 70, 92, 14, P.saber)}
        <path d="M14 90 C16 62 26 48 50 46 C74 48 84 62 86 90 Z" fill="${P.robe}" ${S}/>
        <path d="M40 60 h20 v12 h-20 Z" fill="#3a3c46" ${s2}/><circle cx="44" cy="66" r="1.6" fill="#ff4d4d" class="glow"/><circle cx="50" cy="66" r="1.6" fill="#4fb3ff"/><circle cx="56" cy="66" r="1.6" fill="#4cd96b"/>
        <path d="M26 48 C24 24 36 12 50 12 C64 12 76 24 74 48 L64 48 L60 40 L40 40 L36 48 Z" fill="${P.armor}" ${S}/>
        <path d="M38 26 L48 30 L46 36 L36 34 Z M62 26 L52 30 L54 36 L64 34 Z" fill="#11131a" ${s2}/>
        <path d="M44 38 L56 38 L54 48 L46 48 Z" fill="#11131a" ${s2}/><path d="M47 42 v5 M50 42 v5 M53 42 v5" stroke="#4a4d5c" stroke-width="1.2"/>
        <path d="M74 66 l4 4" stroke="#9aa0aa" stroke-width="4" stroke-linecap="round"/>`,
    k: (P, side) => side === 'w'
      ? `${base(P.base)}
        <path d="M66 86 L70 22" stroke="#7a5a3a" stroke-width="3.4" stroke-linecap="round"/><path d="M66 86 L70 22" ${s2}/>
        <path d="M30 88 C30 70 36 60 50 58 C64 60 70 70 70 88 Z" fill="${P.robe}" ${S}/>
        <path d="M44 60 L50 74 L56 60" fill="${P.robe2}" ${s2}/>
        <path d="M8 34 C18 30 28 34 34 40 L32 46 C24 44 14 42 8 34 Z M92 34 C82 30 72 34 66 40 L68 46 C76 44 86 42 92 34 Z" fill="#8fb86a" ${S}/>
        <path d="M14 36 C20 36 26 39 30 42 M86 36 C80 36 74 39 70 42" fill="none" stroke="#d99a9a" stroke-width="2"/>
        <ellipse cx="50" cy="44" rx="18" ry="16" fill="#8fb86a" ${S}/>
        <path d="M38 34 q6 -3 10 0 M52 34 q6 -3 10 0 M42 30 q8 -3 16 0" fill="none" stroke="#6a8f4a" stroke-width="1.8" stroke-linecap="round"/>
        <g class="bl"><ellipse cx="43" cy="42" rx="4.2" ry="3.6" fill="#f3f0d2" ${s2}/><circle cx="43" cy="42" r="2" fill="#4a3a20"/>
        <ellipse cx="57" cy="42" rx="4.2" ry="3.6" fill="#f3f0d2" ${s2}/><circle cx="57" cy="42" r="2" fill="#4a3a20"/></g>
        <path d="M44 53 q6 3 12 0" fill="none" stroke="#4e6b36" stroke-width="2" stroke-linecap="round"/>`
      : `${base(P.base)}
        <path d="M18 90 C18 64 28 48 50 46 C72 48 82 64 82 90 Z" fill="${P.robe}" ${S}/>
        <path d="M50 52 v36" stroke="${P.robe2}" stroke-width="3"/>
        <path d="M26 54 C22 26 36 6 50 4 C64 6 78 26 74 54 L62 50 L38 50 Z" fill="${P.robe}" ${S}/>
        <path d="M36 50 C36 34 42 26 50 26 C58 26 64 34 64 50 Z" fill="#0d0b10"/>
        <path d="M40 46 C40 36 44 32 50 32 C56 32 60 36 60 46 C56 50 44 50 40 46 Z" fill="${P.skin}" ${s2}/>
        <g class="glow"><circle cx="45.5" cy="40" r="2" fill="#ffd23a"/><circle cx="54.5" cy="40" r="2" fill="#ffd23a"/></g>
        <path d="M46 46 q4 -2 8 0 M42 36 q3 -1 5 0 M53 36 q3 -1 5 0" fill="none" stroke="#8a8172" stroke-width="1.2"/>
        <g class="zap"><path d="M30 72 l-8 -6 l6 -2 l-9 -8 M70 72 l8 -6 l-6 -2 l9 -8" fill="none" stroke="#7fd4ff" stroke-width="2.4" stroke-linejoin="round"/></g>`,
  };

  // ---------------- Set 3: Chessmaster 1990 (8-bit pixel art) ----------------
  const PIX = {
    p: ['................', '................', '................', '......XXXX......', '.....XohhoX.....', '.....XooooX.....', '......XooX......',
        '.....XooooX.....', '......XooX......', '......XooX......', '.....XooooX.....', '....XooooooX....', '...XooooooooX...', '...XooooooooX...', '...XXXXXXXXXX...', '................'],
    r: ['................', '..XXX.XXXX.XXX..', '..XhX.XhhX.XhX..', '..XoXXXooXXXoX..', '..XooooooooooX..', '...XooooooooX...', '....XhooooX.....', '....XhooooX.....',
        '....XhooooX.....', '....XhooooX.....', '....XhooooX.....', '...XooooooooX...', '..XooooooooooX..', '..XooooooooooX..', '..XXXXXXXXXXXX..', '................'],
    b: ['.......XX.......', '......XhoX......', '.....XhoXoX.....', '.....XhXooX.....', '.....XhoooX.....', '......XooX......', '.......XX.......', '......XooX......',
        '......XhoX......', '......XhoX......', '.....XhoooX.....', '....XooooooX....', '...XooooooooX...', '...XooooooooX...', '...XXXXXXXXXX...', '................'],
    n: ['................', '......X.X.......', '.....XhXhX......', '....XhoooXX.....', '...XhoXoooX.....', '..XhooooooooX...', '.XhoooooooooX...', '.XooXXXoooooX...',
        '..XX..XooooooX..', '......XhoooooX..', '.....XhooooooX..', '....XhoooooooX..', '...XooooooooooX.', '...XooooooooooX.', '...XXXXXXXXXXXX.', '................'],
    q: ['................', '.X.....XX.....X.', '.XX...XhhX...XX.', '.XhX.XhoooX.XoX.', '..XhXhoooooXoX..', '..XhooooooooooX.', '...XhooooooooX..', '....XXXXXXXXX...',
        '.....XhoooX.....', '.....XhoooX.....', '....XhoooooX....', '...XhoooooooX...', '..XooooooooooX..', '..XooooooooooX..', '..XXXXXXXXXXXX..', '................'],
    k: ['.......XX.......', '......XhhX......', '.....XXhoXX.....', '.....XhoooX.....', '.....XXhoXX.....', '......XhoX......', '...XXXXhoXXXX...', '..XhoooooooooX..',
        '..XhoooooooooX..', '...XhoooooooX...', '....XXXXXXXX....', '.....XhoooX.....', '....XhoooooX....', '...XooooooooX...', '..XXXXXXXXXXXX..', '................'],
  };
  const RETRO = { w: { X: '#141414', o: '#f1ecd8', h: '#ffffff' }, b: { X: '#0c0c12', o: '#3b3b4f', h: '#6c6c88' } };
  function pixel(type, side) {
    const C = RETRO[side]; let s = '';
    PIX[type].forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch !== '.') s += `<rect x="${x * 6.25}" y="${y * 6.25}" width="6.35" height="6.35" fill="${C[ch]}"/>`;
    }));
    return `<g shape-rendering="crispEdges">${s}</g>`;
  }

  // ---------------- registry ----------------
  const SETS = {
    classic: { name: 'Classic', blurb: 'The pieces you grew up with.', board: null },
    cats: { name: 'Team Gus vs Team Bowie', blurb: 'Mice pawns. Cat-tree rooks. Box bishops. Roomba knights.', board: 'walnut',
            draw: (t, side) => CATS[t](CAT[side], side) },
    space: { name: 'Space Saga', blurb: 'Light side vs dark side. Laser swords included.', board: 'space',
             draw: (t, side) => SPACESET[t](SPACE[side], side) },
    retro: { name: 'Chessmaster 1990', blurb: 'Pure 8-bit nostalgia. Blip blip.', board: 'lcd', draw: (t, side) => pixel(t, side) },
  };

  // Board colour themes (the Play tab's Board menu). Set files add their own with registerBoard().
  const BOARDS = { walnut: 'Walnut', velvet: 'Blue velvet', mint: 'Green (chess.com style)', wizard: 'Wizard purple', bowie: 'House of Bowie',
                   space: 'Deep space', lcd: '8-bit handheld' };
  // Extra sets live in their own files (set-*.js) and plug in here. def: { name, blurb, board, draw(t, side),
  // still?: true (no animation, so one image per piece), pack?: { move(A), capture(t, A), promote?(A) } } where A = Core's sound kit { tone, noise, meow, purr, saber }.
  const register = (id, def) => { SETS[id] = def; };
  const registerBoard = (id, label) => { BOARDS[id] = label; };

  const cache = {};
  function dataUrl(set, t, side, v = 0) {
    const key = `${set}-${t}-${side}-${v}`;
    if (!cache[key]) cache[key] = 'data:image/svg+xml;utf8,' + encodeURIComponent(svgWrap(SETS[set].draw(t, side), (v * 1.9 + (t.charCodeAt(0) % 5) * 0.37).toFixed(2)));
    return cache[key];
  }
  // Install CSS for the chosen set: body[data-pieces=set] .pc.wp(.v1/.v2) { background-image }.
  // A .pc.classic keeps the classic look whatever set is on (the gallery's Classic preview).
  let styleEl = null;
  function apply(set) {
    if (!SETS[set]) set = 'classic';
    document.body.dataset.pieces = set;
    if (!styleEl) { styleEl = document.createElement('style'); document.head.appendChild(styleEl); }
    if (set === 'classic') { styleEl.textContent = ''; return; }
    let css = '';
    const variants = SETS[set].still ? 1 : 3;   // sets with no animation need no delay variants (.pc.wp also matches .v1/.v2)
    for (const side of ['w', 'b']) for (const t of 'pnbrqk') for (let v = 0; v < variants; v++)
      css += `body[data-pieces="${set}"] .pc.${side}${t}${v ? '.v' + v : ''}:not(.classic) { background-image: url("${dataUrl(set, t, side, v)}"); }\n`;
    styleEl.textContent = css;
  }

  window.PieceSets = { SETS, BOARDS, register, registerBoard, apply, dataUrl, svg: (set, t, side) => svgWrap(SETS[set].draw(t, side), 0) };
})();
