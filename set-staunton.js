// Gusmaster 3000 -- Staunton 3D (turned boxwood and ebony) and Marble & Gold.
// Every turned piece is a lathe profile: a list of sections, each a list of [radius, y] points from the
// bottom up. We look down at the pieces a touch (ellipses squashed by K), so each section shows its rim
// and the ledges catch the light. Each section is painted as thin horizontal slices that share one
// "cylindrical" gradient in bounding-box units, so the bright band and the specular streak follow the
// taper of the wood instead of drifting off a narrow stem. Lit from the upper left. Pieces stay still.
(function () {
  if (!window.PieceSets) return;
  const K = 0.15;                                    // how flat the rings look (0 = dead side-on)
  const f = n => +n.toFixed(2);
  const RAD = Math.PI / 180;

  // ---------------- palettes ----------------
  // Each material: c = cylinder stops (left rim .. right rim), t = top-face stops, s = sphere stops.
  const WOOD = {
    w: {
      body: { c: [[0, '#93622f'], [.07, '#c89a5f'], [.18, '#ecd3a3'], [.28, '#fbf0d6'], [.325, '#fffdf5'], [.37, '#f8eacb'], [.55, '#f2e0ba'], [.78, '#d9b680'], [.93, '#aa7a41'], [1, '#8c5f2d']],
              t: [[0, '#fffaee'], [.55, '#f1dcb2'], [1, '#d3ad74']],
              s: [[0, '#ffffff'], [.12, '#fdf3dc'], [.45, '#edd5a6'], [.78, '#caa060'], [1, '#8e602c']] },
      line: '#5c3a17', hole: '#6e4720', spec: '#fffdf6', shade: '#4a2a0a', lw: 1.15,
    },
    b: {
      body: { c: [[0, '#3a281b'], [.06, '#150c07'], [.17, '#2e1d13'], [.27, '#6b4b36'], [.315, '#c4a387'], [.36, '#5e412e'], [.52, '#2a1a11'], [.78, '#130b07'], [.92, '#1d130c'], [1, '#4a3424']],
              t: [[0, '#8a684e'], [.5, '#3c281b'], [1, '#170e09']],
              s: [[0, '#f0dcc6'], [.07, '#a5826a'], [.3, '#4d3324'], [.75, '#170e09'], [.92, '#21150e'], [1, '#4a3424']] },
      line: '#060302', hole: '#060302', spec: '#ecd6be', shade: '#000000', lw: 1.15,
    },
  };
  const FELT = { c: [[0, '#0f1f16'], [.3, '#2f5a3c'], [.6, '#1d3a27'], [1, '#0c1a12']], t: [[0, '#2f5a3c'], [1, '#132a1c']], s: [[0, '#2f5a3c'], [1, '#132a1c']] };
  const GOLD = { c: [[0, '#5e400e'], [.14, '#b0802a'], [.27, '#f2d47c'], [.32, '#fff6cf'], [.38, '#e6c157'], [.62, '#a7761f'], [.88, '#684610'], [1, '#8f6822']],
                 t: [[0, '#fff3c4'], [.55, '#e0b64a'], [1, '#93691c']],
                 s: [[0, '#fffbe6'], [.15, '#f5d778'], [.5, '#c8962e'], [.85, '#6e4b10'], [1, '#8f6822']] };
  const MARBLE = {
    w: {
      body: { c: [[0, '#8a8c93'], [.07, '#c6c8cd'], [.18, '#eaebee'], [.28, '#fafafb'], [.325, '#ffffff'], [.38, '#f3f3f5'], [.58, '#e0e1e5'], [.8, '#bdbfc6'], [.93, '#9b9da5'], [1, '#85878f']],
              t: [[0, '#ffffff'], [.55, '#eceef1'], [1, '#c3c6cc']],
              s: [[0, '#ffffff'], [.15, '#f6f7f8'], [.5, '#dcdee2'], [.82, '#a9acb3'], [1, '#7e8088']] },
      trim: GOLD, line: '#3a3d46', hole: '#55575f', spec: '#ffffff', shade: '#1a1c22', lw: 1.1,
      vein: { c: '#6f727c', o: .42 },
    },
    b: {
      body: { c: [[0, '#2a4a3e'], [.06, '#0b1712'], [.17, '#173027'], [.27, '#3f6a5a'], [.315, '#bfdccf'], [.36, '#3a6252'], [.52, '#163027'], [.78, '#0a1510'], [.92, '#12241c'], [1, '#2f5446']],
              t: [[0, '#6f9c8a'], [.5, '#21402f'], [1, '#08130e']],
              s: [[0, '#e6f4ee'], [.07, '#86b3a1'], [.3, '#2a4d40'], [.75, '#08130e'], [.92, '#10211a'], [1, '#2f5446']] },
      trim: GOLD, line: '#040a07', hole: '#030806', spec: '#d6efe4', shade: '#000000', lw: 1.1,
      vein: { c: '#bfe3d3', o: .32 },
    },
  };

  // ---------------- geometry helpers ----------------
  // Catmull-Rom through the profile points, sampled about every `step` units.
  function sample(pts, step = 1) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || pts[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
      for (let j = 0; j < n; j++) {
        const t = j / n, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(k => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  // Tiny seeded random, so marble veins are the same every time a piece is drawn.
  function rng(seed) { return () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // ---------------- the piece builder ----------------
  // parts: [{ lathe: pts, m: 'body'|'trim'|'felt' } | { ball: [cy, r], m } | { raw: fn(ctx) }]
  function build(parts, t, side, PAL, R, extra = {}) {
    const P = PAL[side], u = t + side;
    const mats = { body: P.body, trim: P.trim || P.body, felt: FELT };
    const stops = a => a.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op != null ? ` stop-opacity="${op}"` : ''}/>`).join('');
    let defs = '';
    for (const [m, M] of Object.entries(mats)) {
      defs += `<linearGradient id="${m}C${u}" x2="1">${stops(M.c)}</linearGradient>`
        + `<radialGradient id="${m}T${u}" cx=".36" cy=".3" r=".8">${stops(M.t)}</radialGradient>`
        + (m === 'felt' ? '' : `<radialGradient id="${m}S${u}" cx=".44" cy=".42" r=".62" fx=".34" fy=".3">${stops(M.s)}</radialGradient>`)
        + (m === 'body' ? `<linearGradient id="${m}D${u}" x1="0" y1=".05" x2="1" y2=".5">${stops(M.c)}</linearGradient>` : '');
    }
    defs += `<linearGradient id="ao${u}" x2="0" y2="1">${stops([[0, P.shade, 0], [.55, P.shade, 0], [1, P.shade, side === 'w' ? .2 : .32]])}</linearGradient>`
      + `<radialGradient id="aoR${u}">${stops([[0, P.shade, .5], [.6, P.shade, .22], [1, P.shade, 0]])}</radialGradient>`
      + `<radialGradient id="cs${u}">${stops([[0, '#000', .55], [.55, '#000', .28], [1, '#000', 0]])}</radialGradient>`;
    // Marble: a fixed set of veins, clipped into each body section as it is drawn.
    let clipN = 0;
    const veined = d => {
      if (!P.vein) return '';
      const id = `cl${u}${clipN++}`;
      defs += `<clipPath id="${id}"><path d="${d}"/></clipPath>`;
      return `<use href="#vn${u}" clip-path="url(#${id})"/>`;
    };
    if (P.vein) {
      const r = rng([...u].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7));
      let v = '';
      for (let i = 0; i < 7; i++) {
        let x = 15 + r() * 70, y = r() * 100; const dx = (r() - .5) * 30, w = .35 + r() * (i < 3 ? 1.1 : .5);
        let d = `M${f(x)} ${f(y)}`;
        for (let s = 0; s < 4; s++) { const nx = x + dx / 2 + (r() - .5) * 22, ny = y + 14 + r() * 16; d += `Q${f(x + (r() - .5) * 18)} ${f((y + ny) / 2)} ${f(nx)} ${f(ny)}`; x = nx; y = ny; }
        v += `<path d="${d}" fill="none" stroke="${P.vein.c}" stroke-width="${f(w)}" stroke-linecap="round" opacity="${f(P.vein.o * (.5 + r() * .5))}"/>`;
      }
      defs += `<g id="vn${u}">${v}</g>`;
    }

    // One turned section: bottom rim, slices, veins, outline + AO, top face, a lit lip on the rim.
    function lathe(pts, m, aoNext, noTop) {
      const s = sample(pts, .7), g = `url(#${m}C${u})`;
      const [rb, yb] = s[0], [rt, yt] = s[s.length - 1];
      let d = `M${f(50 + rb)} ${f(yb)}L` + s.map(([r, y]) => `${f(50 + r)} ${f(y)}`).join('L');
      if (rt > .3) d += `A${f(rt)} ${f(rt * K)} 0 0 0 ${f(50 - rt)} ${f(yt)}`;
      d += 'L' + s.slice().reverse().map(([r, y]) => `${f(50 - r)} ${f(y)}`).join('L') + `A${f(rb)} ${f(rb * K)} 0 0 0 ${f(50 + rb)} ${f(yb)}Z`;
      let o = `<path d="${d}" fill="${g}"/>`;  // underlay: no board shows through the slice seams
      o += `<path d="M${f(50 - rb)} ${f(yb)}A${f(rb)} ${f(rb * K)} 0 0 0 ${f(50 + rb)} ${f(yb)}Z" fill="${g}"/>`;
      const f1 = n => +n.toFixed(1);
      o += `<g fill="${g}">`;
      for (let i = 0; i < s.length - 1; i++) {
        const [r1, y1] = s[i], [r2, y2] = s[i + 1], rm = (r1 + r2) / 2;  // a rectangle per slice: its gradient box matches the local width
        o += `<path d="M${f1(50 - rm)} ${f1(y1 + .6)}H${f1(50 + rm)}V${f1(y2)}H${f1(50 - rm)}Z"/>`;
      }
      o += '</g>';
      if (m === 'body') o += veined(d);
      o += `<path d="${d}" fill="url(#ao${u})" stroke="${P.line}" stroke-width="${P.lw}" stroke-linejoin="round"/>`;
      if (rt > .8 && !noTop) o += topFace(rt, yt, m, aoNext);
      return o;
    }
    function topFace(r, y, m, aoNext, hollow = 0) {
      const px = a => f(50 + r * Math.cos(a * RAD)), py = a => f(y + r * K * Math.sin(a * RAD));
      let o = `<ellipse cx="50" cy="${f(y)}" rx="${f(r)}" ry="${f(r * K)}" fill="url(#${m}T${u})" stroke="${P.line}" stroke-width="${f(P.lw * .55)}"/>`;
      if (hollow) o += `<ellipse cx="50" cy="${f(y)}" rx="${f(hollow)}" ry="${f(hollow * K)}" fill="${P.hole}"/>`;
      if (aoNext) { const a = Math.min(aoNext * 1.3, r * .98); o += `<ellipse cx="50" cy="${f(y)}" rx="${f(a)}" ry="${f(a * K)}" fill="url(#aoR${u})"/>`; }
      o += `<path d="M${px(172)} ${py(172)}A${f(r)} ${f(r * K)} 0 0 0 ${px(98)} ${py(98)}" fill="none" stroke="${P.spec}" stroke-width=".8" stroke-linecap="round" opacity=".75"/>`;
      return o;
    }
    function ball(cy, r, m = 'body', cx = 50) {
      let o = `<circle cx="${cx}" cy="${f(cy)}" r="${f(r)}" fill="url(#${m}S${u})"/>`;
      if (m === 'body') o += veined(`M${cx - r} ${f(cy)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`);
      o += `<circle cx="${cx}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="${P.line}" stroke-width="${f(Math.min(P.lw, r * .3))}"/>`;
      if (r > 3) o += `<ellipse cx="${f(cx - r * .36)}" cy="${f(cy - r * .4)}" rx="${f(r * .2)}" ry="${f(r * .12)}" transform="rotate(-38 ${f(cx - r * .36)} ${f(cy - r * .4)})" fill="${P.spec}" opacity="${side === 'w' ? .9 : .7}"/>`;
      return o;
    }
    const ctx = { P, u, side, lathe, topFace, ball, veined, f };

    let body = `<ellipse cx="50" cy="90" rx="${R + 5}" ry="4.6" fill="url(#cs${u})"/>`;
    parts.forEach((p, i) => {
      const nx = parts[i + 1];
      const aoNext = nx && (nx.lathe ? nx.lathe[0][0] : nx.ball ? nx.ball[1] * .7 : nx.ao || 0);
      if (p.lathe) body += lathe(p.lathe, p.m || 'body', aoNext);
      else if (p.ball) body += ball(p.ball[0], p.ball[1], p.m || 'body');
      else if (p.raw) body += p.raw(ctx);
    });
    return `<defs>${defs}</defs>${body}`;
  }

  // ---------------- the shared base: felt, plinth, bead ----------------
  const base = R => [
    { lathe: [[R - 1.4, 89.4], [R - 1.4, 88.4]], m: 'felt' },
    { lathe: [[R, 88.4], [R + .45, 87], [R, 85.4], [R - 1.6, 84.4]] },
    { lathe: [[R - 3.2, 84.4], [R - 2.5, 83.3], [R - 3.4, 82.2]], m: 'trim' },
  ];

  // Rook battlements: a hollow turret ring cut into six merlons; back ones show their inner wall.
  function crenels(r, ri, yN, yT) {
    return ({ P, u, f }) => {
      const arc = (rr, y, a0, a1, n = 8) => Array.from({ length: n + 1 }, (_, i) => {
        const a = (a0 + (a1 - a0) * i / n) * RAD; return `${f(50 + rr * Math.sin(a))} ${f(y + K * rr * Math.cos(a))}`;
      });
      // Six merlons; the ones on the left and right edges straddle the silhouette, so the outline reads
      // as a classic castle top. Front walls show their outside, back walls show their inside.
      const sw = `stroke="${P.line}" stroke-width="${f(P.lw * .6)}" stroke-linejoin="round"`;
      const wall = (rr, a0, a1) => `M${arc(rr, yT, a0, a1).join('L')}L${arc(rr, yN, a1, a0).join('L')}Z`;
      let backW = '', backT = '', frontW = '', frontT = '';
      for (const c of [30, 90, 150, -150, -90, -30]) {
        const a0 = c - 20, a1 = c + 20, f0 = Math.max(a0, -90), f1 = Math.min(a1, 90);
        if (f1 > f0) { const d = wall(r, f0, f1); frontW += `<path d="${d}" fill="url(#tuO${u})" ${sw}/><path d="${d}" fill="url(#ao${u})"/>`; }
        for (const [b0, b1] of [[a0, Math.min(a1, -90)], [Math.max(a0, 90), a1]]) {
          if (b1 > b0) { const d = wall(ri, b0, b1); backW += `<path d="${d}" fill="url(#tuI${u})" ${sw}/><path d="${d}" fill="${P.shade}" opacity=".42"/>`; }
        }
        // the cut faces at each end of the merlon, when they turn towards us
        for (const [a, vis, lit] of [[a0, Math.sin(a0 * RAD) > 0, Math.cos(a0 * RAD) > -.2], [a1, Math.sin(a1 * RAD) < 0, false]]) {
          if (!vis) continue;
          const pt = (rr, y) => `${f(50 + rr * Math.sin(a * RAD))} ${f(y + K * rr * Math.cos(a * RAD))}`;
          const d = `M${pt(r, yT)}L${pt(ri, yT)}L${pt(ri, yN)}L${pt(r, yN)}Z`;
          const face = `<path d="${d}" fill="url(#bodyT${u})" ${sw}/>` + (lit ? '' : `<path d="${d}" fill="${P.shade}" opacity=".38"/>`);
          if (Math.abs(c) > 90) backW += face; else frontW += face;
        }
        const top = `<path d="M${arc(r, yT, a0, a1).join('L')}L${arc(ri, yT, a1, a0).join('L')}Z" fill="url(#bodyT${u})" ${sw}/>`;
        if (Math.abs(c) > 90) backT += top;
        else frontT += top + `<path d="M${arc(r, yT, Math.max(a0, -90), Math.min(a1, 90)).join('L')}" fill="none" stroke="${P.spec}" stroke-width=".7" opacity=".6"/>`;
      }
      const back = backW + backT, front = frontW + frontT;
      const stops = a => a.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('');
      const g = `<linearGradient id="tuO${u}" gradientUnits="userSpaceOnUse" x1="${50 - r}" x2="${50 + r}">${stops(P.body.c)}</linearGradient>`
        + `<linearGradient id="tuI${u}" gradientUnits="userSpaceOnUse" x1="${50 + ri}" x2="${50 - ri}">${stops(P.body.c)}</linearGradient>`;
      return `<defs>${g}</defs>${back}${front}`;
    };
  }

  // Queen coronet: little balls around the crown rim, the back half drawn before the dome.
  const coronet = (r, y, br, half) => ctx => [...Array(12).keys()].map(i => i * 30 + 15)
    .filter(a => (Math.cos(a * RAD) < 0) === (half === 'back'))
    .sort((a, b) => Math.cos(a * RAD) - Math.cos(b * RAD))
    .map(a => {
      const cx = 50 + r * Math.sin(a * RAD), cy = y + K * r * Math.cos(a * RAD) - br * .55;
      return ctx.ball(cy, br * (half === 'back' ? .9 : 1), 'trim', ctx.f(cx));
    }).join('');

  // The knight's horse head (facing left), carved: eye, nostril, mouth, cheek, mane grooves.
  const HORSE = 'M34 78C31 70 35 62 41 57C43.5 55 43.5 52.5 40 51.5C34 50.5 27 50.5 22 49C18.5 48 16.6 45.5 17.4 43'
    + 'C18 40 19 37 21 35C26 30 31 24 35 20C37 17.5 38 15 39 13C39.6 10 41 7.2 43 5.5C45 8 46 11 46.5 13.5'
    + 'C52 13 58 15 63 20C70 27 75 38 75 52C75 63 72 71 68 78A17 2.55 0 0 1 34 78Z';
  function horse({ P, u, side, veined }) {
    const ln = (d, w, op, c = P.line) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`;
    const dark = side === 'w' ? .55 : .9, lite = side === 'w' ? .95 : .7;
    // mane: grooves running from the crest into the neck
    let mane = '';
    const crest = [[50, 14.2], [55.5, 15.6], [60.5, 18.6], [65, 23], [68.8, 28.5], [71.6, 34.5], [73.4, 41], [74.4, 48], [74.6, 55], [74, 62], [72.6, 69]];
    crest.forEach(([x, y], i) => {
      const k = i / (crest.length - 1), lx = x - 6.5 + k * 1.5, ly = y + 3 + k * 1.5;
      mane += ln(`M${x - .6} ${y + .4}Q${f(x - 2.2)} ${f(y + 2.6)} ${f(lx)} ${f(ly)}`, 1.1, dark * .8);
      mane += ln(`M${f(x - .2)} ${f(y + 1.6)}Q${f(x - 1.4)} ${f(y + 3.2)} ${f(lx + .9)} ${f(ly + .8)}`, .6, lite * .45, P.spec);
    });
    return `<g transform="translate(0 6.24) scale(1 .92)">
      <path d="${HORSE}" fill="url(#bodyD${u})"/>
      ${veined(HORSE)}
      <path d="${HORSE}" fill="url(#ao${u})" stroke="${P.line}" stroke-width="${P.lw * 1.15}" stroke-linejoin="round"/>
      ${ln('M47 15C55 16.5 61.5 21 65.5 27.5C69.5 34 70.8 43 70 53C69.4 62 67.5 70 64.5 77', 1.2, dark * .75)}
      ${mane}
      ${ln('M41 51.5C45 53.5 46.5 57.5 44.5 61.5', 3, .22, P.shade)}
      ${ln('M42 35.5C48.5 38 50.5 46.5 44 52', 1.1, dark * .7)}
      ${ln('M40.6 37.2C45.6 39.6 47.2 45.4 43 50', .8, lite * .55, P.spec)}
      ${ln('M23.2 36.6C27 31.4 31 26.4 35.6 22', 1.7, lite, P.spec)}
      ${ln('M35.4 73.5C33.4 68 35 63 39.4 59.4', 1.2, lite * .55, P.spec)}
      ${ln('M42.4 8.6L44.2 13', 1.1, dark)}
      ${ln('M18.2 45.4Q22 46.2 26.2 46.6', 1.1, dark)}
      ${ln('M20.2 40.6Q21.6 37.8 24.6 38.8', 1.5, dark)}
      <ellipse cx="37.4" cy="28.6" rx="3.1" ry="1.9" transform="rotate(-28 37.4 28.6)" fill="${P.hole}"/>
      <circle cx="36.6" cy="28.1" r=".7" fill="${P.spec}" opacity=".9"/>
      ${ln('M33.4 26.6Q36.4 23.4 41 25.6', .9, lite * .7, P.spec)}
    </g>`;
  }

  // Bishop mitre slit, clipped to the mitre.
  const MITRE = [[6.6, 47.2], [9.6, 44], [11.6, 38.5], [11.8, 32.5], [10.4, 26.5], [7.6, 21], [4, 17.2], [0, 15.6]];
  function slit({ P, u, f }) {
    const s = sample(MITRE);
    const d = 'M' + s.map(([r, y]) => `${f(50 + r)} ${f(y)}`).join('L') + 'L' + s.slice().reverse().map(([r, y]) => `${f(50 - r)} ${f(y)}`).join('L') + 'Z';
    return `<defs><clipPath id="mi${u}"><path d="${d}"/></clipPath></defs><g clip-path="url(#mi${u})">
      <path d="M60 20.8Q51.6 26.8 44.2 35L47.6 36.2Q53.8 29.8 61 24.6Z" fill="${P.hole}"/>
      <path d="M47.6 36.3Q53.8 29.9 61 24.7" fill="none" stroke="${P.spec}" stroke-width=".9" opacity=".8"/></g>`;
  }

  // The king's cross, lit from the upper left, with a bright bevel on its lit edges.
  const CROSS = 'M47.3 2.6H52.7V6.6H57.2V11.2H52.7V17H47.3V11.2H42.8V6.6H47.3Z';
  const cross = ({ P, u }) => `<path d="${CROSS}" fill="url(#bodyD${u})" stroke="${P.line}" stroke-width="${P.lw}" stroke-linejoin="round"/>
    <path d="M47.9 16.4V10.6H43.4V7.2H47.9V3.2" fill="none" stroke="${P.spec}" stroke-width=".8" opacity=".7"/>`;

  const PIECES = {
    p: [...base(21),
      { lathe: [[14.6, 82.2], [11.8, 76], [9, 68], [7.4, 60], [6.8, 54]] },
      { lathe: [[12.4, 54.2], [13.2, 52.8], [13, 51.4], [11.8, 50.6]], m: 'trim' },
      { ball: [40.2, 11.4] }],
    r: [...base(24),
      { lathe: [[18.2, 82.2], [17, 74], [16, 64], [15.6, 54], [16, 47.2]] },
      { lathe: [[18.6, 47.2], [19.6, 45.8], [19.2, 44.4], [18, 43.8]], m: 'trim' },
      { lathe: [[17, 43.8], [18.8, 40.2], [20.6, 36.4], [21, 32.5], [21, 29]], top: 15.4 },
      { raw: crenels(21, 15.4, 29, 21.4) }],
    n: [...base(24),
      { lathe: [[18.4, 82.2], [19.4, 80.6], [19.2, 79], [18.4, 78.2]], m: 'trim' },
      { raw: horse, ao: 15 }],
    b: [...base(23),
      { lathe: [[15.5, 82.2], [12, 76], [9, 68], [7.4, 60], [6.8, 53]] },
      { lathe: [[12.4, 53.2], [13.4, 51.6], [13, 50.2], [11.6, 49.4]], m: 'trim' },
      { lathe: [[8.6, 49.4], [9.6, 48.3], [8.8, 47.2]], m: 'trim' },
      { lathe: MITRE },
      { raw: slit },
      { ball: [12.3, 3.7] }],
    q: [...base(25),
      { lathe: [[16.6, 82.2], [12.8, 75], [9.6, 66], [7.8, 56], [7.2, 46], [7.4, 41]] },
      { lathe: [[13.4, 41.2], [14.6, 39.6], [14.2, 38.2], [12.6, 37.4]], m: 'trim' },
      { lathe: [[9.4, 37.4], [10.4, 36.2], [9.6, 35]], m: 'trim' },
      { lathe: [[7.6, 35], [9.4, 31.5], [12.6, 27.5], [16, 24.2], [17.2, 23]], hollow: 15.4 },
      { raw: coronet(16.4, 23, 2.4, 'back') },
      { lathe: [[11.4, 22.6], [10.6, 19.8], [8.2, 16.8], [4.4, 14.8], [0, 14.2]] },
      { raw: coronet(16.4, 23, 2.4, 'front') },
      { ball: [10.8, 3.8] }],
    k: [...base(25),
      { lathe: [[16.6, 82.2], [13, 75], [10, 66], [8.2, 56], [7.6, 47], [7.8, 42.2]] },
      { lathe: [[13.8, 42.2], [15, 40.6], [14.6, 39.2], [13, 38.4]], m: 'trim' },
      { lathe: [[9.8, 38.4], [10.8, 37.2], [10, 36]], m: 'trim' },
      { lathe: [[8, 36], [9.6, 32.4], [12.4, 28.6], [15.4, 25.6], [16.2, 24.6]] },
      { lathe: [[13.4, 24.6], [12.6, 22], [10, 19.4], [6.2, 17.8], [3, 17.3]] },
      { lathe: [[3.8, 17.6], [4.2, 16.6], [3.4, 15.8]], m: 'trim' },
      { raw: cross }],
  };
  const RADIUS = { p: 21, r: 24, n: 24, b: 23, q: 25, k: 25 };

  // Hollow tops (rook turret floor, queen crown) get a ring-shaped top face with a dark hole.
  function prepare(t) {
    return PIECES[t].map((p, i, all) => {
      if (p.top || p.hollow) {
        return { raw: ctx => {
          const s = sample(p.lathe), [rt, yt] = s[s.length - 1];
          // the section without its own top face, then a hollow one
          return ctx.lathe(p.lathe, p.m || 'body', 0, true) + ctx.topFace(rt, yt, p.m || 'body', 0, p.top || p.hollow);
        }, ao: p.lathe[0][0] };
      }
      return p;
    });
  }
  const draw = PAL => (t, side) => build(prepare(t), t, side, PAL, RADIUS[t]);

  // ---------------- sounds ----------------
  const WOODPACK = {
    // A boxwood piece set down on a wooden board: a soft knock with a low body.
    move: A => { A.noise(0.045, 0.35, 1700); A.tone(185, 0.08, 'sine', 0.22, 120); A.tone(820, 0.02, 'triangle', 0.05); },
    // A capture: the taken piece clacks against yours, then yours lands.
    capture: (t, A) => {
      const heavy = t === 'q' || t === 'r';
      A.noise(0.05, 0.4, 2600); A.tone(260, 0.05, 'triangle', 0.14, 190);
      A.tone(heavy ? 140 : 165, 0.11, 'sine', 0.28, 100, 0.09); A.tone(700, 0.02, 'triangle', 0.06, null, 0.09);
      setTimeout(() => A.noise(0.06, 0.45, 1400), 90);
    },
    promote: A => [0, 0.11, 0.22].forEach((d, i) => { A.tone([220, 262, 330][i], 0.09, 'sine', 0.2, [160, 190, 240][i], d); A.tone([880, 1046, 1320][i], 0.03, 'triangle', 0.05, null, d); }),
  };
  const STONEPACK = {
    move: A => { A.noise(0.03, 0.3, 4200); A.tone(240, 0.06, 'sine', 0.16, 170); A.tone(1500, 0.05, 'sine', 0.04, 1300); },
    capture: (t, A) => {
      A.noise(0.04, 0.4, 5000); A.tone(1900, 0.18, 'sine', 0.05, 1850);
      A.tone(200, 0.1, 'sine', 0.26, 130, 0.08); setTimeout(() => A.noise(0.05, 0.4, 3000), 80);
    },
    promote: A => [988, 1319, 1976].forEach((fr, i) => A.tone(fr, 0.35, 'sine', 0.06, null, i * 0.1)),
  };

  // ---------------- register ----------------
  PieceSets.register('staunton', { still: true, name: 'Staunton 3D', blurb: 'Hand-turned boxwood and ebony. Gus is not allowed to bat them off the table.',
    board: 'tournament', draw: draw(WOOD), pack: WOODPACK });
  PieceSets.register('marble', { still: true, name: 'Marble & Gold', blurb: 'Carved marble, gold trim. Too heavy for Gus to knock over. He has checked.',
    board: 'marble', draw: draw(MARBLE), pack: STONEPACK });
  PieceSets.registerBoard('tournament', 'Tournament wood');
  PieceSets.registerBoard('marble', 'Marble hall');

  // Board looks. Grain sits in background-image, so the check glow and the 3D contact shadow are re-layered here.
  const GRAIN_L = 'repeating-linear-gradient(93deg, rgba(120, 72, 24, .07) 0 1px, transparent 1px 6px, rgba(120, 72, 24, .05) 6px 8px, transparent 8px 13px), linear-gradient(180deg, rgba(255, 255, 255, .07), rgba(90, 50, 10, .06))';
  const GRAIN_D = 'repeating-linear-gradient(93deg, rgba(40, 16, 2, .14) 0 1px, transparent 1px 5px, rgba(40, 16, 2, .09) 5px 8px, transparent 8px 12px), linear-gradient(180deg, rgba(255, 220, 170, .06), rgba(30, 10, 0, .1))';
  const VEIN_L = 'linear-gradient(118deg, transparent 30%, rgba(120, 118, 112, .16) 31.5%, transparent 33%, transparent 64%, rgba(120, 118, 112, .1) 65%, transparent 66.5%), radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, .25), transparent 70%)';
  const VEIN_D = 'linear-gradient(62deg, transparent 22%, rgba(220, 235, 228, .14) 23.5%, transparent 25%, transparent 70%, rgba(220, 235, 228, .1) 71%, transparent 72.5%), radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, .1), transparent 70%)';
  const CHECK = 'radial-gradient(circle, rgba(255, 40, 40, .95) 0%, rgba(255, 40, 40, .5) 40%, transparent 72%)';
  const SHADOW3D = 'radial-gradient(ellipse 34% 17% at 50% 86%, rgba(0, 0, 0, .42), rgba(0, 0, 0, .12) 70%, transparent 100%)';
  const css = [];
  for (const [id, L, D, vars, frame] of [
    ['tournament', GRAIN_L, GRAIN_D, '--light: #ddbe88; --dark: #8e5a32; --frame: #4a2a14; --frameHi: #c08a4f;',
      '0 0 0 2px #1e1008, 0 0 0 8px #5a3319, 0 0 0 9px #c08a4f, 0 0 0 11px #2a170b, 0 0 0 12px rgba(0, 0, 0, .5), 0 28px 60px rgba(0, 0, 0, .65)'],
    ['marble', VEIN_L, VEIN_D, '--light: #e0dacd; --dark: #6e7f77; --frame: #2a2f2d; --frameHi: #d6b45a;',
      '0 0 0 2px #15191a, 0 0 0 8px #3a403e, 0 0 0 9px #d6b45a, 0 0 0 11px #1d2120, 0 0 0 12px rgba(0, 0, 0, .5), 0 28px 60px rgba(0, 0, 0, .65)'],
  ]) {
    const B = `.board[data-theme="${id}"]`;
    css.push(`${B}, .gboard[data-theme="${id}"] { ${vars} }`,
      `${B} { box-shadow: ${frame}; }`,
      `${B} .sq.l, .gboard[data-theme="${id}"] .gsq.l { background-image: ${L}; }`,
      `${B} .sq.d, .gboard[data-theme="${id}"] .gsq.d { background-image: ${D}; }`,
      `${B} .sq:nth-child(3n+1) { background-position: 9px 0; } ${B} .sq:nth-child(5n+2) { background-position: -14px 0; }`,
      `${B} .sq.l.check { background-image: ${CHECK}, ${L}; } ${B} .sq.d.check { background-image: ${CHECK}, ${D}; }`,
      `.board.b3d[data-theme="${id}"] .sq.l.occ:not(.check) { background-image: ${SHADOW3D}, ${L}; }`,
      `.board.b3d[data-theme="${id}"] .sq.d.occ:not(.check) { background-image: ${SHADOW3D}, ${D}; }`);
  }
  const st = document.createElement('style');
  st.id = 'set-staunton-css';
  st.textContent = css.join('\n');
  document.head.appendChild(st);
})();
