// Gusmaster 3000 -- cartoon cats, drawn as SVG from parts so each part can animate.
// Cats.svg(id) returns markup; the game flips classes on the root (.st-*) to change mood.
(function () {
  const PAL = {
    gus:   { fur: '#727b88', dark: '#575f6b', light: '#9ca4af', belly: '#8a929d', eye: '#f0bd3c', eyeEdge: '#b9861c',
             nose: '#6f5f66', inner: '#c9a0a8', stripe: '#5d6571' },
    bowie: { fur: '#7d6249', dark: '#3f3127', light: '#ae9273', belly: '#f4f0e7', eye: '#a9c75c', eyeEdge: '#6f8a2c',
             nose: '#eaa2ad', inner: '#e8c9b9', stripe: '#3f3127' },
  };

  // Per-opponent look. scale: overall size; chub: body width; head: head size multiplier.
  const LOOKS = {
    kitten: { cat: 'gus', chub: 0.86, head: 1.12, extras: ['bell', 'yarn'] },
    lazy:   { cat: 'gus', chub: 1.32, head: 1.0,  extras: ['treats', 'churu', 'crumbs'] },
    wizard: { cat: 'gus', chub: 1.0,  head: 1.0,  extras: ['robe', 'hat', 'orb'] },
    bowie:  { cat: 'bowie', chub: 1.12, head: 1.04, extras: ['cape', 'crown', 'mirror'] },
    // Dark Lord Bowie: King Bowie when the Space Saga pieces are on the board.
    bowieDark: { cat: 'bowie', chub: 1.12, head: 1.04, extras: ['darkcape', 'darkrobe', 'chestbox', 'darkcrown', 'saber'] },
    // The rest of the Space Saga cast (see SPACE below). metal: gold-plated arms and ears.
    threepio: { cat: 'gus', chub: 0.94, head: 1.08, metal: '#dcaa3e', extras: ['goldsuit', 'goldcap', 'r2'] },
    leia:      { cat: 'gus', chub: 1.26, head: 1.0,  extras: ['gown', 'buns', 'blaster', 'bunplate', 'churu', 'crumbs'] },
    yoda:      { cat: 'gus', chub: 0.94, head: 1.06, extras: ['jedicloak', 'jedirobe', 'yodaears', 'wisps', 'greensaber', 'stick'] },
    fat:    { cat: 'gus', chub: 1.62, head: 1.06, extras: ['treats', 'churu', 'crumbs'] },   // app icon only
  };

  const eye = (cx, p, side) => `
    <g class="eye eye-${side}">
      <clipPath id="clip-${side}-ID"><ellipse cx="${cx}" cy="128" rx="16" ry="14.5"/></clipPath>
      <g class="eye-open">
        <ellipse cx="${cx}" cy="128" rx="16" ry="14.5" fill="${p.eye}" stroke="${p.eyeEdge}" stroke-width="2"/>
        <g clip-path="url(#clip-${side}-ID)">
          <g class="pupil"><ellipse cx="${cx}" cy="128" rx="4.2" ry="11" fill="#141414"/>
            <circle cx="${cx + 4}" cy="122" r="3.2" fill="#fff" opacity=".9"/></g>
          <rect class="lid" x="${cx - 18}" y="96" width="36" height="20" fill="${p.fur}"/>
          <rect class="lid-low" x="${cx - 18}" y="142" width="36" height="16" fill="${p.fur}"/>
        </g>
      </g>
      <path class="eye-shut" d="M${cx - 14} 130 Q${cx} 140 ${cx + 14} 130" fill="none" stroke="#2a2a2a" stroke-width="3.5" stroke-linecap="round"/>
      <path class="eye-happy" d="M${cx - 14} 133 Q${cx} 118 ${cx + 14} 133" fill="none" stroke="#2a2a2a" stroke-width="3.5" stroke-linecap="round"/>
      <circle class="laser-glow" cx="${cx}" cy="128" r="15" fill="#ffdf6b"/>
    </g>`;

  function svg(look) {
    const L = LOOKS[look], p = PAL[L.cat], bowie = L.cat === 'bowie', has = x => L.extras.includes(x);
    const bw = 78 * L.chub;                 // half-width of the body
    const ID = look;
    const fluff = bowie ? 'url(#fluff-ID)' : '';
    let s = `<svg class="cat cat-${look} st-idle" viewBox="0 0 320 350" xmlns="http://www.w3.org/2000/svg" aria-label="${look}">
    <defs>
      <filter id="fluff-ID" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="7"/></filter>
      <filter id="glow-ID" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <radialGradient id="body-ID" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="${p.light}"/><stop offset="1" stop-color="${p.fur}"/></radialGradient>
      <linearGradient id="gold-ID" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7dc84"/><stop offset=".55" stop-color="#dcaa3e"/><stop offset="1" stop-color="#a87a1e"/></linearGradient>
      <linearGradient id="table-ID" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a5236"/><stop offset="1" stop-color="#4a2f1e"/></linearGradient>
    </defs>`;

    // Tail, behind everything. Gus has ghost tabby rings; Bowie's is a plume.
    s += `<g class="tail"><path d="M${160 + bw - 20} 285 C ${215 + bw} 270, ${230 + bw} 200, ${200 + bw} 165"
      fill="none" stroke="${p.fur}" stroke-width="${bowie ? 30 : 20}" stroke-linecap="round" filter="${fluff}"/>
      <path d="M${160 + bw - 20} 285 C ${215 + bw} 270, ${230 + bw} 200, ${200 + bw} 165" fill="none"
      stroke="${p.stripe}" stroke-width="${bowie ? 30 : 20}" stroke-dasharray="9 16" stroke-linecap="butt" opacity=".55"/></g>`;

    // Body + cape/robe behind arms.
    if (has('darkcape')) s += `<path d="M${160 - bw - 36} 300 L${160 - bw + 2} 188 Q160 156 ${160 + bw - 2} 188 L${160 + bw + 36} 300 Z" fill="#121216"/>
      <path d="M${160 - bw - 36} 300 L${160 - bw + 2} 188 M${160 + bw - 2} 188 L${160 + bw + 36} 300" fill="none" stroke="#3a3a46" stroke-width="3"/>
      <path d="M${160 - bw + 2} 188 Q${160 - bw - 14} 168 ${160 - bw - 4} 150 M${160 + bw - 2} 188 Q${160 + bw + 14} 168 ${160 + bw + 4} 150" fill="none" stroke="#121216" stroke-width="16" stroke-linecap="round"/>`;
    if (has('jedicloak')) s += `<path d="M${160 - bw - 30} 300 L${160 - bw + 4} 192 Q160 160 ${160 + bw - 4} 192 L${160 + bw + 30} 300 Z" fill="#5c3e26"/>
      <path d="M${160 - bw - 30} 300 L${160 - bw + 4} 192 M${160 + bw - 4} 192 L${160 + bw + 30} 300" fill="none" stroke="#3d2816" stroke-width="3"/>`;
    if (has('cape')) s += `<path d="M${160 - bw - 30} 300 L${160 - bw + 4} 196 Q160 168 ${160 + bw - 4} 196 L${160 + bw + 30} 300 Z" fill="#8e1b2e"/>
      <path d="M${160 - bw - 30} 300 L${160 - bw + 4} 196 M${160 + bw - 4} 196 L${160 + bw + 30} 300" fill="none" stroke="#5e0f1d" stroke-width="4"/>
      <path d="M${160 - bw - 18} 296 L${160 - bw + 2} 230 M${160 + bw + 18} 296 L${160 + bw - 2} 230" stroke="#b02a40" stroke-width="3" opacity=".7"/>`;
    s += `<g class="body"><path d="M${160 - bw} 300 C ${160 - bw} 220, ${160 - bw * 0.62} 170, 160 168 C ${160 + bw * 0.62} 170, ${160 + bw} 220, ${160 + bw} 300 Z"
      fill="url(#body-ID)" filter="${fluff}"/>
      <path d="M${160 - bw * 0.48} 300 C ${160 - bw * 0.5} 240, ${160 - bw * 0.3} 200, 160 196 C ${160 + bw * 0.3} 200, ${160 + bw * 0.5} 240, ${160 + bw * 0.48} 300 Z"
      fill="${p.belly}" opacity="${bowie ? 1 : 0.55}" filter="${fluff}"/></g>`;
    if (has('robe')) s += `<path d="M${160 - bw - 6} 300 C ${160 - bw} 230, 120 185, 160 182 C 200 185, ${160 + bw} 230, ${160 + bw + 6} 300 Z" fill="#3d2f7a"/>
      <path d="M160 186 L160 300" stroke="#e8c45a" stroke-width="4"/>
      <g fill="#f4d872">${[[118, 240], [204, 228], [132, 278], [196, 272], [176, 212]].map(([x, y]) => star(x, y, 6)).join('')}</g>`;
    if (has('goldsuit')) s += `<path d="M${160 - bw - 4} 300 C ${160 - bw} 228, 118 188, 160 184 C 202 188, ${160 + bw} 228, ${160 + bw + 4} 300 Z" fill="url(#gold-ID)" stroke="#8a6414" stroke-width="2"/>
      <path d="M${160 - bw * 0.72} 210 Q160 230 ${160 + bw * 0.72} 210 L${160 + bw * 0.6} 244 Q160 256 ${160 - bw * 0.6} 244 Z" fill="#efc65c" stroke="#8a6414" stroke-width="2"/>
      <circle cx="160" cy="232" r="7" fill="#c4932c" stroke="#8a6414" stroke-width="2"/>
      <rect x="${160 - bw * 0.42}" y="252" width="${bw * 0.84}" height="28" rx="4" fill="#3e3326"/>
      ${['#d8402f', '#3a7be0', '#e8c34a', '#4cc06a', '#d8402f'].map((c, i) => `<path d="M${160 - bw * 0.3 + i * bw * 0.15} 254 q4 12 0 24" stroke="${c}" stroke-width="2.6" fill="none"/>`).join('')}
      <rect x="${160 - bw * 0.06}" y="252" width="${bw * 0.12}" height="28" fill="#b98a2a"/>
      <rect x="${160 - bw * 0.66}" y="280" width="${bw * 1.32}" height="10" rx="3" fill="#c4932c" stroke="#8a6414" stroke-width="1.5"/>
      <circle cx="${160 - bw * 0.7}" cy="214" r="13" fill="#e2b44a" stroke="#8a6414" stroke-width="2"/><circle cx="${160 + bw * 0.7}" cy="214" r="13" fill="#e2b44a" stroke="#8a6414" stroke-width="2"/>`;
    if (has('gown')) s += `<path d="M${160 - bw - 6} 300 C ${160 - bw} 230, 120 186, 160 182 C 200 186, ${160 + bw} 230, ${160 + bw + 6} 300 Z" fill="#f6f3ec"/>
      <path d="M${160 - bw * 0.5} 300 C ${160 - bw * 0.46} 256, 142 214, 150 196 M${160 + bw * 0.5} 300 C ${160 + bw * 0.46} 256, 178 214, 170 196" stroke="#d8d2c4" stroke-width="3" fill="none"/>
      <rect x="${160 - bw * 0.68}" y="256" width="${bw * 1.36}" height="12" rx="3" fill="#c3c8d2" stroke="#7d828c" stroke-width="1.5"/>
      ${[-0.5, -0.25, 0, 0.25, 0.5].map(k => `<rect x="${160 + bw * k - 4}" y="258" width="8" height="8" rx="1.5" fill="#e9ecf2" stroke="#7d828c" stroke-width="1"/>`).join('')}`;
    if (has('jedirobe')) s += `<path d="M${160 - bw - 2} 300 C ${160 - bw} 232, 122 192, 160 188 C 198 192, ${160 + bw} 232, ${160 + bw + 2} 300 Z" fill="#cdb98f"/>
      <path d="M134 192 L160 238 L186 192" fill="none" stroke="#a8936a" stroke-width="5"/>
      <path d="M${160 - bw - 2} 300 C ${160 - bw} 236, 124 196, 138 190 C 130 230, 130 270, 134 300 Z" fill="#76533a"/>
      <path d="M${160 + bw + 2} 300 C ${160 + bw} 236, 196 196, 182 190 C 190 230, 190 270, 186 300 Z" fill="#76533a"/>
      <rect x="132" y="266" width="56" height="10" rx="2" fill="#5c3e26"/>`;
    if (has('darkrobe')) s += `<path d="M${160 - bw - 4} 300 C ${160 - bw} 228, 118 190, 160 186 C 202 190, ${160 + bw} 228, ${160 + bw + 4} 300 Z" fill="#1b1b22"/>
      <ellipse cx="${160 - bw * 0.72}" cy="206" rx="30" ry="18" fill="#2a2a34" stroke="#4a4a58" stroke-width="2.5"/>
      <ellipse cx="${160 + bw * 0.72}" cy="206" rx="30" ry="18" fill="#2a2a34" stroke="#4a4a58" stroke-width="2.5"/>
      <path d="M${160 - bw * 0.9} 202 q${bw * 0.18} -8 ${bw * 0.36} 0 M${160 + bw * 0.54} 202 q${bw * 0.18} -8 ${bw * 0.36} 0" fill="none" stroke="#5a5a6a" stroke-width="2"/>
      <rect x="${160 - bw * 0.62}" y="276" width="${bw * 1.24}" height="12" rx="3" fill="#2a2a34" stroke="#5a5a6a" stroke-width="2"/>
      ${[-0.42, -0.18, 0.18, 0.42].map(k => `<rect x="${160 + bw * k - 6}" y="273" width="12" height="18" rx="2" fill="#b9bec8" stroke="#333" stroke-width="1.5"/>`).join('')}`;
    if (bowie) s += `<path d="M112 178 Q160 236 208 178 Q196 214 160 222 Q124 214 112 178 Z" fill="${p.belly}" filter="${fluff}"/>`;
    if (has('chestbox')) s += `<g class="chestbox"><rect x="138" y="232" width="44" height="32" rx="4" fill="#3a3a46" stroke="#9a9eae" stroke-width="2.5"/>
      <rect x="144" y="238" width="7" height="6" fill="#ff3b3b" class="chest-light"/><rect x="155" y="238" width="7" height="6" fill="#4fb3ff" class="chest-light l2"/>
      <rect x="166" y="238" width="7" height="6" fill="#4cd96b" class="chest-light l3"/>
      <path d="M144 250 h30 M144 256 h30" stroke="#9a9eae" stroke-width="2"/><circle cx="176" cy="253" r="2.2" fill="#ffd23a" class="chest-light l2"/></g>`;
    if (has('cape')) s += `<path d="M98 186 Q160 214 222 186 L222 200 Q160 228 98 200 Z" fill="#f6f2ea"/>
      <g fill="#222">${[110, 130, 150, 170, 190, 210].map((x, i) => `<rect x="${x}" y="${197 + (i % 2) * 4}" width="3" height="6" rx="1"/>`).join('')}</g>`;

    // Table the cat sits behind.
    s += `<g class="table"><rect x="0" y="292" width="320" height="58" fill="url(#table-ID)"/>
      <rect x="0" y="288" width="320" height="8" rx="3" fill="#8c623f"/></g>`;

    // Props on the table.
    if (has('yarn')) s += `<g class="prop yarn"><circle cx="54" cy="276" r="18" fill="#e0648a"/>
      <path d="M40 268 Q54 258 68 270 M38 278 Q54 268 70 282 M44 288 Q56 280 66 290" stroke="#b8406a" stroke-width="2.5" fill="none"/>
      <path d="M70 284 Q90 296 84 312" stroke="#e0648a" stroke-width="2.5" fill="none"/></g>`;
    if (has('treats')) s += `<g class="prop treats"><path d="M22 288 L30 236 L78 236 L86 288 Z" fill="#d9483b"/>
      <path d="M30 236 L36 226 L72 226 L78 236 Z" fill="#b8352b"/>
      <text x="54" y="262" text-anchor="middle" font-size="12" font-weight="800" fill="#fff4d6" font-family="Arial Rounded MT Bold, Arial">TREATS</text>
      <g fill="#c98a3c"><circle cx="42" cy="245" r="3"/><circle cx="64" cy="276" r="3"/></g></g>`;
    if (has('crumbs')) s += `<g fill="#c98a3c">${[[96, 292], [104, 294], [240, 293], [228, 295]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4"/>`).join('')}</g>`;
    if (has('orb')) s += `<g class="prop orb"><ellipse cx="270" cy="290" rx="24" ry="6" fill="#2b1f4a"/>
      <circle cx="270" cy="262" r="24" fill="#7fd3ff" opacity=".85" filter="url(#glow-ID)"/>
      <circle cx="262" cy="254" r="7" fill="#fff" opacity=".7"/></g>`;
    const saber = (c, core) => `<g class="prop saber"><path class="saber-blade" d="M268 262 L268 150" stroke="${c}" stroke-width="16" stroke-linecap="round" opacity=".45" filter="url(#glow-ID)"/>
      <path d="M268 262 L268 150" stroke="${c}" stroke-width="9" stroke-linecap="round"/>
      <path d="M268 260 L268 152" stroke="${core}" stroke-width="3.5" stroke-linecap="round"/>
      <rect x="261" y="258" width="14" height="34" rx="3" fill="#b9bec8" stroke="#2a2a33" stroke-width="2"/>
      <path d="M261 266 h14 M261 272 h14 M261 278 h14" stroke="#2a2a33" stroke-width="2"/><rect x="264" y="282" width="8" height="6" fill="${c}"/></g>`;
    if (has('saber')) s += saber('#ff2b3b', '#ffd6d6');
    if (has('greensaber')) s += saber('#3ee05a', '#e2ffe6');
    if (has('stick')) s += `<g class="prop stick"><path d="M46 290 C 44 260, 52 232, 46 206 Q 42 192 52 188" fill="none" stroke="#6b4a2a" stroke-width="7" stroke-linecap="round"/>
      <path d="M47 240 l-8 -6 M49 222 l7 -5" stroke="#6b4a2a" stroke-width="3.5" stroke-linecap="round"/></g>`;
    if (has('r2')) s += `<g class="prop r2"><rect x="22" y="244" width="9" height="44" rx="3" fill="#eef1f6" stroke="#5a6a8a" stroke-width="1.5"/>
      <rect x="77" y="244" width="9" height="44" rx="3" fill="#eef1f6" stroke="#5a6a8a" stroke-width="1.5"/>
      <rect x="31" y="236" width="46" height="52" rx="5" fill="#f4f6fa" stroke="#5a6a8a" stroke-width="2"/>
      <rect x="37" y="244" width="11" height="17" rx="1.5" fill="#2f63c9"/><rect x="60" y="244" width="11" height="17" rx="1.5" fill="#2f63c9"/>
      <rect x="48" y="265" width="12" height="15" rx="1.5" fill="#2f63c9"/><path d="M37 268 h7 M37 274 h7 M64 268 h7 M64 274 h7" stroke="#8a96ae" stroke-width="2"/>
      <path d="M31 238 Q31 210 54 210 Q77 210 77 238 Z" fill="#d3d8e1" stroke="#5a6a8a" stroke-width="2"/>
      <g class="r2eye"><rect x="37" y="222" width="9" height="8" fill="#2f63c9"/><circle cx="55" cy="223" r="5.5" fill="#1a1a22"/><circle cx="56.5" cy="221.5" r="1.8" fill="#ff4a4a"/>
        <rect x="63" y="219" width="7" height="11" fill="#2f63c9"/></g>
      <circle cx="44" cy="233" r="2.5" fill="#ff3b3b" class="chest-light"/><circle cx="66" cy="233" r="2" fill="#4fb3ff" class="chest-light l2"/></g>`;
    if (has('blaster')) s += `<g class="prop blaster"><path d="M20 272 L76 272 L76 282 L46 282 L40 292 L28 292 L32 282 L20 282 Z" fill="#2b2b33" stroke="#111" stroke-width="1.5"/>
      <rect x="76" y="274" width="12" height="6" fill="#5a5a66"/><rect x="38" y="266" width="22" height="6" rx="2" fill="#44444e"/></g>`;
    if (has('bunplate')) s += `<g class="prop bunplate"><ellipse cx="268" cy="290" rx="34" ry="7" fill="#e9e4da" stroke="#b9b2a4" stroke-width="2"/>
      ${bun(254, 276, 13)}${bun(282, 276, 13)}</g>`;
    if (has('mirror')) s += `<g class="prop mirror"><rect x="262" y="250" width="8" height="40" rx="3" fill="#d4a93a"/>
      <ellipse cx="266" cy="236" rx="22" ry="26" fill="#d4a93a"/><ellipse cx="266" cy="236" rx="16" ry="20" fill="#bfe3ee"/>
      <path d="M256 228 L270 220" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>`;

    // Front legs: the left one rests, the right one (.arm) does the slapping.
    const leg = (x, fill) => `<path d="M${x - 11} 216 C ${x - 14} 250, ${x - 15} 276, ${x - 14} 290 L ${x + 14} 290 C ${x + 15} 270, ${x + 13} 240, ${x + 11} 216 Z"
      fill="${fill}" stroke="${p.dark}" stroke-opacity=".18" stroke-width="2" filter="${fluff}"/>`;
    const paw = (x, fill) => `<ellipse class="paw" cx="${x}" cy="292" rx="18" ry="11" fill="${fill}" stroke="${p.dark}" stroke-opacity=".3" stroke-width="1.5"/>
      <path d="M${x - 6} 286 L${x - 6} 296 M${x + 6} 286 L${x + 6} 296" stroke="${p.dark}" stroke-opacity=".35" stroke-width="1.5"/>`;
    const lx = 160 - bw * 0.36, rx = 160 + bw * 0.36, legFur = L.metal || p.belly, pawFur = L.metal || (bowie ? p.belly : p.light);
    // Crossed arms ("are you serious?"): two forearms folded over the chest.
    const fore = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${p.dark}" stroke-opacity=".35" stroke-width="31" stroke-linecap="round"/>
      <path d="M${x1} ${y1} L${x2} ${y2}" stroke="${L.metal || (bowie ? legFur : p.light)}" stroke-width="27" stroke-linecap="round" filter="${fluff}"/>`;
    s += `<g class="arms-crossed">${fore(lx - 8, 214, rx + 6, 252)}
      <ellipse cx="${rx + 12}" cy="252" rx="15" ry="11" fill="${pawFur}" stroke="${p.dark}" stroke-opacity=".3" stroke-width="1.5"/>
      ${fore(rx + 8, 210, lx - 4, 246)}
      <ellipse cx="${lx - 10}" cy="246" rx="15" ry="11" fill="${pawFur}" stroke="${p.dark}" stroke-opacity=".3" stroke-width="1.5"/></g>`;
    s += `<g class="leg-rest">${leg(lx, legFur)}${paw(lx, pawFur)}</g>
    <g class="arm" style="transform-origin:${rx}px 222px">${leg(rx, legFur)}${paw(rx, pawFur)}
      ${has('churu') ? `<g class="churu"><rect x="${rx - 6}" y="236" width="12" height="48" rx="3" fill="#f2f2f2" stroke="#d0473c" stroke-width="2"/>
        <rect x="${rx - 6}" y="250" width="12" height="14" fill="#d0473c"/></g>` : ''}</g>`;

    // Head.
    const hs = L.head, earFur = L.metal || p.fur, earIn = L.metal ? '#b3842a' : p.inner;
    const yoda = has('yodaears'), tilt = d => (yoda ? `<g transform="rotate(${d} ${d < 0 ? 122 : 198} 96)">` : '<g>');
    s += `<g class="head" style="--hs:${hs}">
      ${tilt(-56)}<g class="ear ear-l"><path d="M104 104 L${bowie ? 88 : yoda ? 84 : 92} ${bowie ? 26 : yoda ? 18 : 36} L146 80 Z" fill="${earFur}" filter="${fluff}"/>
        <path d="M109 98 L${bowie ? 97 : yoda ? 94 : 100} ${bowie ? 44 : yoda ? 38 : 52} L136 82 Z" fill="${earIn}"/>
        ${bowie ? `<path d="M83 30 L86 10 L94 30 Z" fill="${p.dark}"/>` : ''}</g></g>
      ${tilt(56)}<g class="ear ear-r"><path d="M216 104 L${bowie ? 232 : yoda ? 236 : 228} ${bowie ? 26 : yoda ? 18 : 36} L174 80 Z" fill="${earFur}" filter="${fluff}"/>
        <path d="M211 98 L${bowie ? 223 : yoda ? 226 : 220} ${bowie ? 44 : yoda ? 38 : 52} L184 82 Z" fill="${earIn}"/>
        ${bowie ? `<path d="M237 30 L234 10 L226 30 Z" fill="${p.dark}"/>` : ''}</g></g>
      ${bowie ? `<path d="M86 140 L72 150 L88 158 L74 172 L94 174 L90 190 L112 184 L160 200 L208 184 L230 190 L226 174 L246 172 L232 158 L248 150 L234 140 Z" fill="${p.fur}" filter="${fluff}"/>` : ''}
      <ellipse cx="160" cy="138" rx="${bowie ? 76 : 74}" ry="${bowie ? 64 : 62}" fill="${p.fur}" filter="${fluff}"/>
      ${bowie ? `<path d="M128 150 Q160 128 192 150 Q196 184 160 192 Q124 184 128 150 Z" fill="${p.belly}"/>
        <path d="M160 82 L160 112 M146 86 L150 110 M174 86 L170 110" stroke="${p.dark}" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M92 128 L110 132 M90 142 L108 142 M228 128 L210 132 M230 142 L212 142" stroke="${p.dark}" stroke-width="4" stroke-linecap="round"/>`
             : `<path d="M150 86 Q160 98 170 86" stroke="${p.stripe}" stroke-width="3" fill="none" opacity=".6"/>
        <ellipse cx="160" cy="166" rx="30" ry="17" fill="${p.light}" opacity=".5"/>`}
      ${has('wisps') ? `<path d="M136 80 q-10 -18 -2 -30 M150 77 q-2 -20 8 -30 M172 77 q6 -16 -2 -28 M186 80 q12 -14 8 -26" stroke="#eef0f2" stroke-width="2.6" fill="none" stroke-linecap="round"/>` : ''}
      ${has('goldcap') ? `<path d="M94 116 C 96 80, 128 72, 160 72 C 192 72, 224 80, 226 116 Q160 96 94 116 Z" fill="url(#gold-ID)" stroke="#8a6414" stroke-width="2"/>
        <path d="M100 108 Q160 90 220 108" stroke="#8a6414" stroke-width="2" fill="none"/>
        <g fill="#8a6414">${[112, 136, 160, 184, 208].map((x, i) => `<circle cx="${x}" cy="${[103, 97, 95, 97, 103][i]}" r="2"/>`).join('')}</g>` : ''}
      ${has('buns') ? `<path d="M86 122 C 90 82, 128 72, 160 72 C 192 72, 230 82, 234 122 Q 200 98 160 100 Q 120 98 86 122 Z" fill="#4a2c1a"/>
        <path d="M160 74 L160 98" stroke="#2e1a0e" stroke-width="2.5"/>${bun(80, 128, 26)}${bun(240, 128, 26)}` : ''}
      <g class="brows"><path d="M114 104 L146 114" stroke="#2a2a2a" stroke-width="5" stroke-linecap="round"/>
        <path d="M206 104 L174 114" stroke="#2a2a2a" stroke-width="5" stroke-linecap="round"/></g>
      ${eye(132, p, 'l').replaceAll('ID', ID)}${eye(188, p, 'r').replaceAll('ID', ID)}
      <path d="M152 152 L168 152 L160 161 Z" fill="${p.nose}" stroke-linejoin="round" stroke="${p.nose}" stroke-width="3"/>
      <path class="mouth mouth-w" d="M160 161 L160 166 M148 166 Q154 173 160 166 Q166 173 172 166" stroke="#2a2a2a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <g class="mouth mouth-open"><path d="M160 161 L160 164" stroke="#2a2a2a" stroke-width="2.6"/>
        <ellipse cx="160" cy="174" rx="11" ry="10" fill="#4a1d24"/><ellipse cx="160" cy="179" rx="6" ry="4" fill="#e27d8c"/>
        <path d="M151 167 L153 172 L155 167 M165 167 L167 172 L169 167" fill="#fff"/></g>
      <path class="mouth mouth-flat" d="M160 161 L160 165 M149 168 L171 168" stroke="#2a2a2a" stroke-width="2.8" fill="none" stroke-linecap="round"/>
      <g class="mouth mouth-chew"><path d="M150 168 Q160 176 170 168" stroke="#2a2a2a" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>
      <g stroke="${bowie ? '#fff' : '#d9dde3'}" stroke-width="1.6" stroke-linecap="round" opacity=".85">
        <path d="M128 160 L84 152 M128 165 L82 166 M130 170 L88 180"/><path d="M192 160 L236 152 M192 165 L238 166 M190 170 L232 180"/></g>
      ${has('hat') ? `<g class="hat"><path d="M92 92 Q160 70 228 92 Q160 104 92 92 Z" fill="#2f2466"/>
        <path d="M118 88 Q132 40 150 18 Q166 -6 196 4 Q170 10 172 40 Q176 70 202 88 Q160 98 118 88 Z" fill="#3d2f7a"/>
        <circle cx="196" cy="4" r="6" fill="#f4d872"/>
        <g fill="#f4d872">${star(150, 60, 7)}${star(176, 30, 5)}${star(134, 80, 4)}</g>
        <path d="M118 88 Q160 98 202 88" stroke="#e8c45a" stroke-width="4" fill="none"/></g>` : ''}
      ${has('darkcrown') ? `<g class="crown" transform="rotate(-8 160 70)"><path d="M120 86 L114 46 L136 66 L160 36 L184 66 L206 46 L200 86 Z" fill="#1c1c24" stroke="#6a6a7a" stroke-width="2.5"/>
        <circle cx="160" cy="70" r="6" fill="#ff2b3b" class="chest-light"/><circle cx="136" cy="76" r="4" fill="#ff2b3b"/><circle cx="184" cy="76" r="4" fill="#ff2b3b"/>
        <circle cx="114" cy="46" r="4" fill="#6a6a7a"/><circle cx="160" cy="36" r="4" fill="#6a6a7a"/><circle cx="206" cy="46" r="4" fill="#6a6a7a"/></g>` : ''}
      ${has('crown') ? `<g class="crown" transform="rotate(-8 160 70)"><path d="M120 86 L114 46 L136 66 L160 36 L184 66 L206 46 L200 86 Z" fill="#e7b934" stroke="#a57b14" stroke-width="2.5"/>
        <circle cx="160" cy="70" r="6" fill="#c2213b"/><circle cx="136" cy="76" r="4" fill="#2a7fd1"/><circle cx="184" cy="76" r="4" fill="#2a7fd1"/>
        <circle cx="114" cy="46" r="4" fill="#f6e08a"/><circle cx="160" cy="36" r="4" fill="#f6e08a"/><circle cx="206" cy="46" r="4" fill="#f6e08a"/></g>` : ''}
    </g>`;
    if (has('bell')) s += `<path d="M118 190 Q160 206 202 190" stroke="#3a8de0" stroke-width="7" fill="none" stroke-linecap="round"/>
      <circle cx="160" cy="204" r="9" fill="#f2c94c" stroke="#b58a1c" stroke-width="2"/><path d="M155 206 L165 206" stroke="#7a5a10" stroke-width="2"/>`;

    // Facepaw: a forearm drawn in front of the head, paw over the eyes (shown only in st-facepaw).
    {
      const fx = 160 + bw * 0.36, legFur2 = L.metal || (bowie ? p.belly : p.light);
      s += `<g class="facepaw-arm" style="transform-origin:${fx}px 300px">
        <path d="M${fx + 2} 236 C ${fx + 16} 200, 194 162, 172 134" stroke="${p.dark}" stroke-opacity=".35" stroke-width="31" stroke-linecap="round" fill="none"/>
        <path d="M${fx + 2} 236 C ${fx + 16} 200, 194 162, 172 134" stroke="${legFur2}" stroke-width="27" stroke-linecap="round" fill="none" filter="${fluff}"/>
        <ellipse cx="166" cy="124" rx="22" ry="16" transform="rotate(-20 166 124)" fill="${legFur2}" stroke="${p.dark}" stroke-opacity=".3" stroke-width="1.5"/>
        <g fill="#c98f98"><circle cx="156" cy="128" r="3"/><circle cx="165" cy="131" r="3.2"/><circle cx="174" cy="128" r="3"/><ellipse cx="164" cy="120" rx="6" ry="4.5"/></g></g>`;
    }

    // Effects layer: lasers, Zzz, sparkles, slap impact.
    s += `<g class="fx">
      <g class="lasers" filter="url(#glow-ID)"><path d="M132 128 L520 300 M188 128 L560 250" stroke="#ff5a1f" stroke-width="9" stroke-linecap="round"/>
        <path d="M132 128 L520 300 M188 128 L560 250" stroke="#ffe27a" stroke-width="3.5" stroke-linecap="round"/></g>
      <g class="zzz" font-family="Arial Rounded MT Bold, Arial" font-weight="800" fill="#cfd8ff">
        <text class="z z1" x="226" y="96" font-size="22">z</text><text class="z z2" x="246" y="70" font-size="28">z</text><text class="z z3" x="270" y="40" font-size="34">Z</text></g>
      <g class="sparkles" fill="#fff6c2">${star(244, 196, 8)}${star(286, 206, 6)}${star(258, 168, 5)}</g>
      <g class="haha" font-family="Arial Rounded MT Bold, Arial" font-weight="900" fill="#ffe27a" stroke="#4b2a7a" stroke-width="2" paint-order="stroke">
        <text class="ha ha1" x="34" y="70" font-size="30" transform="rotate(-14 34 70)">HA</text>
        <text class="ha ha2" x="236" y="60" font-size="34" transform="rotate(12 236 60)">HA</text>
        <text class="ha ha3" x="250" y="118" font-size="24" transform="rotate(20 250 118)">HA</text></g>
      <g class="impact" style="transform-origin:${160 + bw * 0.36}px 292px"><path d="M${160 + bw * 0.36} 292 m-40 0 l-18 -8 m22 -14 l-10 -16 m40 -6 l0 -18 m30 22 l12 -14 m6 34 l18 -6" stroke="#ffe27a" stroke-width="4" stroke-linecap="round"/></g>
    </g></svg>`;
    return s.replaceAll('-ID', '-' + ID);
  }

  // A cinnamon bun (Princess Leia's hair, and her lunch): a dough spiral with icing.
  function bun(x, y, r) {
    let d = `M${x} ${y}`;
    for (let a = 0; a <= Math.PI * 5; a += 0.3) { const rr = r * 0.82 * a / (Math.PI * 5); d += ` L${(x + rr * Math.cos(a)).toFixed(1)} ${(y + rr * Math.sin(a)).toFixed(1)}`; }
    return `<g class="bun"><circle cx="${x}" cy="${y}" r="${r}" fill="#cf9150" stroke="#8a5428" stroke-width="2.5"/>
      <path d="${d}" fill="none" stroke="#7a4520" stroke-width="${(r / 8).toFixed(1)}" stroke-linecap="round"/>
      <path d="M${x - r * 0.7} ${y - r * 0.35} q${r * 0.3} ${r * 0.3} ${r * 0.6} -${r * 0.05} q${r * 0.3} ${r * 0.35} ${r * 0.7} 0" stroke="#fff8ea" stroke-width="${(r / 6).toFixed(1)}" fill="none" stroke-linecap="round"/></g>`;
  }

  function star(x, y, r) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 5 * i - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
      d += (i ? 'L' : 'M') + (x + rr * Math.cos(a)).toFixed(1) + ' ' + (y + rr * Math.sin(a)).toFixed(1);
    }
    return `<path d="${d}Z"/>`;
  }

  // Which drawing to use for a persona right now: with the Space Saga pieces on, everyone is in costume.
  const SPACE = { bowie: 'bowieDark', kitten: 'threepio', lazy: 'leia', wizard: 'yoda' };
  const NAMES = { bowieDark: 'Dark Lord Bowie', threepio: 'C-3PO Gus', leia: 'Princess Leia Gus', yoda: 'Master Yoda Gus' };
  const artFor = look => (window.Core && Core.S.pieces === 'space' && SPACE[look]) || look;
  const nameFor = (look, name) => NAMES[artFor(look)] || name;
  window.Cats = { svg, artFor, nameFor, SPACE, NAMES };
})();
