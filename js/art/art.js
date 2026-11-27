/* =====================================================================
 * OVERMANAGING — js/art/art.js  (agente ART)
 * Núcleo gráfico: utilidades, paletas, carriles, fondos, suelos, barra de
 * progreso e iluminación. Cargar PRIMERO; luego characters.js, stations.js,
 * items.js, fx.js, ui.js. Todo dibujado por código (Canvas 2D).
 *
 * API del contrato (OW.Art): init, PLAYER_COLORS, drawBackground,
 *   drawFloor, drawStation, drawItem, drawCharacter, drawBug (notificación),
 *   drawManager (CEO), drawFire, drawProgressBar, drawOrderCard (agenda),
 *   drawIcon, drawLogo, drawMenuBackground, drawLighting, drawPanel,
 *   drawButton, drawRocket (efecto "reunió feta").
 * OW.FX: spawn, update, draw, clear, count.
 *
 * Temas: startup, coworking, consulting, corporate, quarterclose
 *   (alias antiguos garage/openspace/datacenter/deploy; desconocido => coworking).
 * Carriles: OW.Art.LANES = { budget, plan, report } {id,color,dark,light,name(getter i18n)}.
 *   OW.Art.LANE_ORDER, laneInfo(lane), laneColor(lane), laneId(lane) (alias front/back/data).
 *
 * EXTRAS: FONT/MONO, THEMES/theme(name)/resolveTheme(name)/themeLight(theme),
 *   getCarryPoint(p), itemAnchor(type,tile), drawSpeechBubble(ctx,x,y,text,t,o),
 *   drawText(ctx,str,x,y,opts), drawStars(ctx,cx,cy,n,size,t), shade/mix/rgba, rr,
 *   drawLaneGlyph(ctx,lane,cx,cy,size,color,lw)  (€ / Gantt / quesito),
 *   parseDir(dir), STATION_TYPES, itemKind(item), _drawSeatedNPC(ctx,npc,cx,by,t,o).
 * Ningún texto en idioma va cacheado en sprites: lo traducible se dibuja en vivo con OW.t.
 * ===================================================================== */
window.OW = window.OW || {};
(function (OW) {
  'use strict';
  var A = OW.Art = OW.Art || {};
  var PI = Math.PI, TAU = PI * 2;

  A.FONT = '"Trebuchet MS", "Segoe UI", "Ubuntu", system-ui, sans-serif';
  A.MONO = '"Consolas", "DejaVu Sans Mono", "Menlo", "Noto Sans Mono", monospace';
  A.TILE = 64;
  A.W = 1280; A.H = 720;

  A.PLAYER_COLORS = ['#ff4f6d', '#21c7c1', '#a66cff', '#ffc233'];

  /* Carriles de OVERMANAGING. name se resuelve con OW.t('lane.<id>') en cada lectura
   * (CORE define las claves); si no existe la clave se usa el nombre catalán por defecto. */
  function laneDef(id, color, dark, light, fallback, short) {
    var o = { id: id, color: color, dark: dark, light: light };
    Object.defineProperty(o, 'name', { enumerable: true, get: function () {
      var k = 'lane.' + id, s = OW.t ? OW.t(k) : k;
      return (s && s !== k) ? s : fallback;
    } });
    o.fallback = fallback; o.short = short;
    return o;
  }
  A.LANES = {
    budget: laneDef('budget', '#ffb02e', '#b46a00', '#ffe2a6', 'Pressupost', '\u20ac'),
    plan:   laneDef('plan',   '#4da3ff', '#1d5fb8', '#b5dbff', 'Planificaci\u00f3', 'G'),
    report: laneDef('report', '#3ddc84', '#138a48', '#b2f7cf', "Informe d'estat", 'R')
  };
  A.LANE_ORDER = ['budget', 'plan', 'report'];
  /* ids antiguos (Overworking) -> nuevos, solo para no romper nada en la transición */
  A.LANE_ALIAS = { data: 'budget', front: 'plan', back: 'report' };
  A.laneId = function (lane) { return A.LANES[lane] ? lane : (A.LANE_ALIAS[lane] || lane); };
  var UNKNOWN_LANE = { id: '?', color: '#a7b0c4', dark: '#5d667c', light: '#e2e6ef', name: '?' };
  A.laneInfo = function (lane) {
    return A.LANES[lane] || A.LANES[A.LANE_ALIAS[lane]] || UNKNOWN_LANE;
  };
  A.laneColor = function (lane) { return A.laneInfo(lane).color; };

  /* ---------------------------------------------------------- utilidades */
  var rgbCache = {};
  function hexToRgb(h) {
    if (rgbCache[h]) return rgbCache[h];
    var s = String(h || '#888').trim(), r = 136, g = 136, b = 136;
    if (s[0] === '#') {
      s = s.slice(1);
      if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
      var n = parseInt(s.slice(0, 6), 16);
      if (!isNaN(n)) { r = (n >> 16) & 255; g = (n >> 8) & 255; b = n & 255; }
    } else {
      var m = s.match(/(\d+)\D+(\d+)\D+(\d+)/);
      if (m) { r = +m[1]; g = +m[2]; b = +m[3]; }
    }
    return (rgbCache[h] = [r, g, b]);
  }
  A.hexToRgb = hexToRgb;
  function toHex(r, g, b) {
    return '#' + ((1 << 24) | (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).slice(1);
  }
  var shadeCache = {};
  A.shade = function (hex, f) {
    var k = hex + '|' + f;
    if (shadeCache[k]) return shadeCache[k];
    var c = hexToRgb(hex), t = f < 0 ? 0 : 255, p = Math.abs(f);
    return (shadeCache[k] = toHex(c[0] + (t - c[0]) * p, c[1] + (t - c[1]) * p, c[2] + (t - c[2]) * p));
  };
  A.mix = function (a, b, t) {
    var x = hexToRgb(a), y = hexToRgb(b);
    return toHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t);
  };
  A.rgba = function (hex, a) {
    var c = hexToRgb(hex);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  };
  A.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  A.lerp = function (a, b, t) { return a + (b - a) * t; };
  A.easeOutBack = function (x) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  A.easeOutCubic = function (x) { return 1 - Math.pow(1 - x, 3); };
  A.easeInOut = function (x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
  A.hash = function (n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  A.rng = function (seed) {
    var s = seed >>> 0 || 1;
    return function () {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  A.num = function (v, d) { return (typeof v === 'number' && isFinite(v)) ? v : d; };

  A.canvas = function (w, h) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
    return c;
  };
  A.rr = function (g, x, y, w, h, r) {
    r = Math.max(0, Math.min(r || 0, w / 2, h / 2));
    g.beginPath();
    g.moveTo(x + r, y);
    g.lineTo(x + w - r, y); g.arcTo(x + w, y, x + w, y + r, r);
    g.lineTo(x + w, y + h - r); g.arcTo(x + w, y + h, x + w - r, y + h, r);
    g.lineTo(x + r, y + h); g.arcTo(x, y + h, x, y + h - r, r);
    g.lineTo(x, y + r); g.arcTo(x, y, x + r, y, r);
    g.closePath();
  };
  A.ell = function (g, cx, cy, rx, ry) { g.beginPath(); g.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2); };
  A.circle = function (g, cx, cy, r) { g.beginPath(); g.arc(cx, cy, Math.max(0.1, r), 0, Math.PI * 2); };

  /* sprites de blob radial reutilizables (sombras, glows) */
  var blobCache = {};
  A.blob = function (color, inner) {
    var k = color + '|' + (inner || 0);
    if (blobCache[k]) return blobCache[k];
    var c = A.canvas(64, 64), g = c.getContext('2d');
    var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, A.rgba(color, 1));
    gr.addColorStop(inner || 0.0001, A.rgba(color, inner ? 1 : 0.95));
    gr.addColorStop(0.55, A.rgba(color, 0.45));
    gr.addColorStop(1, A.rgba(color, 0));
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return (blobCache[k] = c);
  };
  /* sombra proyectada suave */
  A.shadow = function (g, cx, cy, rx, ry, a) {
    var s = A.blob('#0a0614', 0.35);
    g.save(); g.globalAlpha *= (a == null ? 0.35 : a);
    g.drawImage(s, cx - rx * 1.25, cy - ry * 1.25, rx * 2.5, ry * 2.5);
    g.restore();
  };
  A.glow = function (g, cx, cy, r, color, a) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha *= (a == null ? 0.6 : a);
    g.drawImage(A.blob(color), cx - r, cy - r, r * 2, r * 2);
    g.restore();
  };

  /* Bloque 3/4: tapa (x,y,w,h) + cara frontal de profundidad d */
  A.box = function (g, x, y, w, h, d, top, front, o) {
    o = o || {};
    var r = o.r == null ? 6 : o.r, out = o.outline || A.shade(front, -0.62);
    // silueta completa
    A.rr(g, x, y, w, h + d, r);
    var fg = g.createLinearGradient(0, y + h - 2, 0, y + h + d);
    fg.addColorStop(0, A.shade(front, 0.08)); fg.addColorStop(1, A.shade(front, -0.22));
    g.fillStyle = fg; g.fill();
    g.lineWidth = o.lw || 2; g.strokeStyle = out; g.stroke();
    // tapa
    A.rr(g, x + 1, y + 1, w - 2, h - 1, Math.max(0, r - 1));
    var tg = g.createLinearGradient(0, y, 0, y + h);
    tg.addColorStop(0, A.shade(top, 0.12)); tg.addColorStop(1, A.shade(top, -0.06));
    g.fillStyle = tg; g.fill();
    // unión tapa/frente
    g.beginPath(); g.moveTo(x + 2, y + h + 0.5); g.lineTo(x + w - 2, y + h + 0.5);
    g.strokeStyle = A.rgba(out, 0.55); g.lineWidth = 1.5; g.stroke();
    // brillo de borde
    g.beginPath(); g.moveTo(x + r + 1, y + 2.5); g.lineTo(x + w - r - 1, y + 2.5);
    g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 1.5; g.stroke();
    if (!o.noFrontShine) {
      g.beginPath(); g.moveTo(x + 3, y + h + 3); g.lineTo(x + w - 3, y + h + 3);
      g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1; g.stroke();
    }
  };

  /* texto con contorno */
  A.drawText = function (ctx, str, x, y, o) {
    o = o || {};
    var size = o.size || 16;
    ctx.save();
    ctx.font = (o.weight || 'bold') + ' ' + size + 'px ' + (o.font || A.FONT);
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.baseline || 'middle';
    if (o.shadow !== false) {
      ctx.fillStyle = 'rgba(10,5,25,0.45)';
      ctx.fillText(str, x, y + Math.max(1, size * 0.09));
    }
    if (o.outline) {
      ctx.lineJoin = 'round'; ctx.lineWidth = o.outlineWidth || Math.max(2, size * 0.18);
      ctx.strokeStyle = o.outline; ctx.strokeText(str, x, y);
    }
    ctx.fillStyle = o.color || '#fff';
    ctx.fillText(str, x, y);
    ctx.restore();
  };

  /* ------------------------------------------------------------- temas */
  A.THEMES = {
    startup: { // loft de ladrillo con muebles de madera
      wall: '#a2553f', wallDark: '#6e3426', wallTop: '#c9875a', wallFace: '#7c3f2f', outer: '#3a1f17',
      floor: '#c08a55', floor2: '#ab7745',
      counterTop: '#ecc48e', counterFront: '#9a6236', trim: '#5b3420',
      accent: '#ffb347', metal: '#9aa3ad', light: '#ffcf8a', pot: '#c8643c'
    },
    coworking: { // luminoso, verde, pufs
      wall: '#efe8dc', wallDark: '#cfc5b4', wallTop: '#fbf8f2', wallFace: '#d8cdbb', outer: '#2c3a4a',
      floor: '#5aa49b', floor2: '#4f978e',
      counterTop: '#f6f7fb', counterFront: '#aab7cf', trim: '#5c6b86',
      accent: '#ff6b6b', metal: '#c4ccd8', light: '#fff4dc', pot: '#f2f2f2'
    },
    consulting: { // gris corporativo con pizarras
      wall: '#8f9aab', wallDark: '#6b7587', wallTop: '#c3cad6', wallFace: '#5f697b', outer: '#1f2633',
      floor: '#7b8291', floor2: '#717887',
      counterTop: '#d6dae2', counterFront: '#6d7688', trim: '#2c3650',
      accent: '#2f6fd6', metal: '#b4bccb', light: '#eef3ff', pot: '#3a4152'
    },
    corporate: { // rascacielos de noche, moqueta, dorado
      wall: '#2b3550', wallDark: '#1c2338', wallTop: '#4d5978', wallFace: '#262e47', outer: '#0b0f1a',
      floor: '#4f5670', floor2: '#474e67',
      counterTop: '#e2e5ec', counterFront: '#4a5470', trim: '#1a2030',
      accent: '#e0b84a', metal: '#a8b2c4', light: '#ffe2a8', pot: '#2b3346'
    },
    quarterclose: { // último día del trimestre: atardecer, prisas
      wall: '#55284a', wallDark: '#3a1834', wallTop: '#a0566a', wallFace: '#41203b', outer: '#1d0b1a',
      floor: '#b5745c', floor2: '#a76a53',
      counterTop: '#f1d6bd', counterFront: '#a96a52', trim: '#4a2232',
      accent: '#ff7b3a', metal: '#c9b0a8', light: '#ffb070', pot: '#e36d4a'
    }
  };
  /* nombres antiguos (Overworking) -> temas nuevos */
  A.THEME_ALIAS = { garage: 'startup', openspace: 'coworking', datacenter: 'corporate', deploy: 'quarterclose' };
  A.resolveTheme = function (name) {
    if (A.THEMES[name]) return name;
    if (A.THEME_ALIAS[name]) return A.THEME_ALIAS[name];
    return 'coworking';
  };
  A.theme = function (name) { return A.THEMES[A.resolveTheme(name)]; };
  A.themeLight = function (name) { return A.theme(name).light; };

  /* =========================================================== FONDOS */
  var bgCache = {};

  function brickWall(g, x0, y0, w, h, base, mortar, seed) {
    g.fillStyle = mortar; g.fillRect(x0, y0, w, h);
    var R = A.rng(seed), bw = 34, bh = 15;
    for (var row = 0, y = y0; y < y0 + h; y += bh, row++) {
      for (var x = x0 - (row % 2 ? bw / 2 : 0); x < x0 + w; x += bw) {
        var v = (R() - 0.5) * 0.22;
        g.fillStyle = A.shade(base, v);
        A.rr(g, x + 1.5, y + 1.5, bw - 3, bh - 3, 2); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x + 2, y + 2, bw - 4, 2);
      }
    }
  }

  function wallShading(g, x, y, w, h) {
    var gr = g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, 'rgba(0,0,0,0.35)'); gr.addColorStop(0.35, 'rgba(0,0,0,0.05)');
    gr.addColorStop(0.85, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.25)');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
  }

  function frame(g, x, y, w, h, col, th) {
    g.fillStyle = col; A.rr(g, x - th, y - th, w + th * 2, h + th * 2, 3); g.fill();
    g.strokeStyle = A.shade(col, -0.5); g.lineWidth = 1.5; g.stroke();
  }
  A._frame = frame;

  function sideWalls(g, th) {
    var top = th.wallTop, face = th.wallFace;
    [[0, 112, 64, 608], [1216, 112, 64, 608]].forEach(function (r) {
      var gr = g.createLinearGradient(r[0], 0, r[0] + r[2], 0);
      var left = r[0] === 0;
      gr.addColorStop(0, left ? A.shade(top, -0.25) : A.shade(top, 0.05));
      gr.addColorStop(1, left ? A.shade(top, 0.05) : A.shade(top, -0.25));
      g.fillStyle = gr; g.fillRect(r[0], r[1], r[2], r[3]);
      g.fillStyle = A.shade(top, 0.25);
      g.fillRect(left ? 56 : 1216, 112, 8, 608);
      g.fillStyle = A.rgba(A.shade(face, -0.5), 0.7);
      g.fillRect(left ? 63 : 1216, 112, 1, 608);
    });
    g.fillStyle = A.shade(top, -0.1); g.fillRect(0, 704, 1280, 16);
    g.fillStyle = A.shade(top, 0.2); g.fillRect(64, 704, 1152, 3);
  }

  function skyline(g, x, y, w, h, R, cols, litCol, litP) {
    var bx = x;
    while (bx < x + w) {
      var bw = 26 + R() * 48, bh = h * (0.35 + R() * 0.6);
      g.fillStyle = cols[(R() * cols.length) | 0];
      g.fillRect(bx, y + h - bh, bw, bh);
      if (R() < 0.3) { g.fillRect(bx + bw / 2 - 1, y + h - bh - 10, 2, 10); }
      for (var wy = y + h - bh + 6; wy < y + h - 4; wy += 8)
        for (var wx = bx + 4; wx < bx + bw - 5; wx += 7)
          if (R() < litP) { g.fillStyle = litCol; g.fillRect(wx, wy, 3, 4); }
      bx += bw + 2;
    }
  }

  /* post-it suelto */
  function postit(g, x, y, s, col, rot, lines) {
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(-s / 2 + 1.5, -s / 2 + 2, s, s);
    g.fillStyle = col; g.fillRect(-s / 2, -s / 2, s, s);
    g.fillStyle = 'rgba(0,0,0,0.1)'; g.fillRect(-s / 2, -s / 2, s, s * 0.22);
    if (lines) {
      g.fillStyle = 'rgba(40,30,60,0.45)';
      for (var i = 0; i < lines; i++) g.fillRect(-s / 2 + s * 0.15, -s / 2 + s * (0.38 + i * 0.18), s * (0.7 - (i % 2) * 0.2), Math.max(1, s * 0.07));
    }
    g.restore();
  }
  A._postit = postit;

  /* tablero kanban con 3 columnas de post-its */
  function kanban(g, x, y, w, h, R) {
    frame(g, x, y, w, h, '#b8bec8', 4);
    g.fillStyle = '#fbfcff'; g.fillRect(x, y, w, h);
    var cw = w / 3, cols = ['#ffe066', '#9ee6ff', '#b8ff9e'];
    for (var c = 0; c < 3; c++) {
      g.fillStyle = ['#ff6b6b', '#4da3ff', '#3ddc84'][c]; g.fillRect(x + c * cw + 4, y + 4, cw - 8, 4);
      if (c) { g.fillStyle = 'rgba(40,50,80,0.25)'; g.fillRect(x + c * cw, y + 4, 1.5, h - 8); }
      var n = 2 + ((R() * 3) | 0);
      for (var i = 0; i < n; i++) {
        var px = x + c * cw + 10 + (i % 2) * (cw - 20) * 0.55, py = y + 18 + Math.floor(i / 2) * 22 + (i % 2) * 4;
        if (py > y + h - 10) continue;
        postit(g, px + 6, py + 6, 15, cols[(R() * 3) | 0], (R() - 0.5) * 0.3, 2);
      }
    }
  }

  function bgStartup(g, th) {
    brickWall(g, 0, 0, 1280, 120, th.wall, '#5e2c22', 7);
    wallShading(g, 0, 0, 1280, 120);
    // tablero kanban de corcho
    frame(g, 100, 16, 260, 82, '#6b4428', 4);
    g.fillStyle = '#c9a272'; g.fillRect(100, 16, 260, 82);
    var R = A.rng(17);
    g.fillStyle = 'rgba(80,50,20,0.18)';
    for (var n = 0; n < 160; n++) g.fillRect(100 + R() * 258, 16 + R() * 80, 1.5, 1.5);
    var pc = ['#ffe066', '#ff9ec7', '#9ee6ff', '#b8ff9e', '#ffb36b'];
    for (var c = 0; c < 3; c++) {
      g.fillStyle = 'rgba(70,40,15,0.35)'; if (c) g.fillRect(100 + c * 86.6, 20, 2, 74);
      for (var i = 0; i < 4; i++) {
        if (R() < 0.25) continue;
        postit(g, 122 + c * 86.6 + (i % 2) * 36, 34 + Math.floor(i / 2) * 32, 22, pc[(R() * pc.length) | 0], (R() - 0.5) * 0.35, 3);
        g.fillStyle = '#e0302e'; A.circle(g, 122 + c * 86.6 + (i % 2) * 36, 25 + Math.floor(i / 2) * 32, 2); g.fill();
      }
    }
    // estantería con cajas, archivadores y planta
    g.fillStyle = '#7a4a2a'; g.fillRect(410, 74, 250, 8); g.fillStyle = '#9a6238'; g.fillRect(410, 72, 250, 3);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(412, 82, 246, 5);
    ['#4da3ff', '#ffb02e', '#3ddc84', '#ff6b6b', '#a66cff'].forEach(function (cc, k) {
      var bx = 424 + k * 15;
      g.fillStyle = cc; A.rr(g, bx, 36, 12, 37, 2); g.fill(); g.strokeStyle = A.shade(cc, -0.5); g.lineWidth = 1.2; g.stroke();
      g.fillStyle = '#fff'; A.rr(g, bx + 2.5, 44, 7, 10, 1); g.fill();
      g.fillStyle = A.shade(cc, -0.3); A.circle(g, bx + 6, 64, 2.4); g.fill();
    });
    g.fillStyle = '#c99b5f'; A.rr(g, 510, 38, 62, 35, 2); g.fill(); g.strokeStyle = '#6b4a22'; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = '#e3c08a'; g.fillRect(536, 38, 10, 35);
    // flecha de "frágil/arriba" (pictograma)
    g.strokeStyle = '#6b4a22'; g.lineWidth = 2; g.beginPath(); g.moveTo(522, 66); g.lineTo(522, 50); g.moveTo(517, 55); g.lineTo(522, 49); g.lineTo(527, 55); g.stroke();
    // maceta
    g.fillStyle = '#d0643c'; g.beginPath(); g.moveTo(590, 50); g.lineTo(616, 50); g.lineTo(612, 72); g.lineTo(594, 72); g.closePath(); g.fill();
    g.strokeStyle = '#6a2a10'; g.lineWidth = 1.5; g.stroke();
    for (var l = 0; l < 9; l++) {
      var a = -PI / 2 + (l - 4) * 0.32;
      g.save(); g.translate(603, 50); g.rotate(a + PI / 2);
      g.fillStyle = l % 2 ? '#2fa35f' : '#3fbf6f'; A.ell(g, 0, -14, 4.5, 13); g.fill(); g.restore();
    }
    // ventanal industrial
    frame(g, 760, 8, 300, 104, '#3b3f48', 5);
    g.save(); g.beginPath(); g.rect(760, 8, 300, 104); g.clip();
    var sky = g.createLinearGradient(0, 8, 0, 112); sky.addColorStop(0, '#6fc1ff'); sky.addColorStop(1, '#e3f4ff');
    g.fillStyle = sky; g.fillRect(760, 8, 300, 104);
    skyline(g, 750, 50, 320, 62, A.rng(8), ['#9bb6d4', '#8eaacb'], 'rgba(255,255,255,0.6)', 0.15);
    skyline(g, 750, 66, 320, 46, A.rng(9), ['#6a7f9c', '#5d7290'], '#ffe9a8', 0.2);
    g.restore();
    g.fillStyle = '#3b3f48';
    for (var m = 1; m < 5; m++) g.fillRect(760 + m * 60 - 2, 8, 4, 104);
    g.fillRect(760, 50, 300, 4);
    // póster con bombilla (idea) sin texto
    g.save(); g.translate(1130, 58); g.rotate(0.04);
    g.fillStyle = '#1e1b3a'; g.fillRect(-46, -40, 92, 74);
    g.fillStyle = '#ff5a8a'; g.fillRect(-46, -40, 92, 6);
    A.glow(g, 0, -4, 34, '#ffd23f', 0.5);
    g.fillStyle = '#ffe66d'; A.circle(g, 0, -8, 14); g.fill();
    g.fillStyle = '#c9ced8'; g.fillRect(-6, 5, 12, 8); g.fillStyle = '#8a92a6'; g.fillRect(-6, 8, 12, 1.5); g.fillRect(-6, 11, 12, 1.5);
    g.strokeStyle = '#ffe66d'; g.lineWidth = 2; g.lineCap = 'round';
    for (var r2 = 0; r2 < 7; r2++) { var aa = PI + r2 * PI / 6; g.beginPath(); g.moveTo(Math.cos(aa) * 19, -8 + Math.sin(aa) * 19); g.lineTo(Math.cos(aa) * 26, -8 + Math.sin(aa) * 26); g.stroke(); }
    g.fillStyle = '#d8d8d8'; A.circle(g, -40, -36, 2.5); g.fill(); A.circle(g, 40, -36, 2.5); g.fill();
    g.restore();
    g.fillStyle = '#5b3420'; g.fillRect(0, 108, 1280, 12);
    g.fillStyle = '#7a4a2c'; g.fillRect(0, 108, 1280, 3);
  }

  var CW_WINS = [[90, 10, 350, 92], [480, 10, 350, 92], [870, 10, 330, 92]];
  function bgCoworking(g, th) {
    g.fillStyle = th.wall; g.fillRect(0, 0, 1280, 120);
    var R = A.rng(42);
    CW_WINS.forEach(function (w) {
      frame(g, w[0], w[1], w[2], w[3], '#3b4556', 4);
      g.save(); A.rr(g, w[0], w[1], w[2], w[3], 2); g.clip();
      var sky = g.createLinearGradient(0, w[1], 0, w[1] + w[3]);
      sky.addColorStop(0, '#4fb3ff'); sky.addColorStop(0.7, '#a7dcff'); sky.addColorStop(1, '#e3f4ff');
      g.fillStyle = sky; g.fillRect(w[0], w[1], w[2], w[3]);
      skyline(g, w[0] - 10, w[1] + 30, w[2] + 20, 62, R, ['#9bb6d4', '#8eaacb'], 'rgba(255,255,255,0.6)', 0.15);
      skyline(g, w[0] - 10, w[1] + 44, w[2] + 20, 48, R, ['#5d7ea6', '#6688b0', '#53739a'], '#ffe9a8', 0.25);
      g.restore();
      g.fillStyle = '#3b4556';
      for (var m = 1; m < 3; m++) g.fillRect(w[0] + (w[2] * m) / 3 - 2, w[1], 4, w[3]);
      g.fillRect(w[0], w[1] + 40, w[2], 3);
      g.save(); A.rr(g, w[0], w[1], w[2], w[3], 2); g.clip();
      g.fillStyle = 'rgba(255,255,255,0.18)';
      g.beginPath(); g.moveTo(w[0] + 30, w[1]); g.lineTo(w[0] + 80, w[1]); g.lineTo(w[0] + 20, w[1] + w[3]); g.lineTo(w[0] - 30, w[1] + w[3]); g.fill();
      g.restore();
    });
    // plantas colgantes
    [70, 460, 850, 1230].forEach(function (x, k) {
      g.strokeStyle = '#6b5a48'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 14); g.stroke();
      g.fillStyle = '#f2f2f2'; A.rr(g, x - 9, 14, 18, 12, 4); g.fill(); g.strokeStyle = '#8a8a8a'; g.stroke();
      for (var i = 0; i < 7; i++) {
        var lx = x - 10 + i * 3.3, len = 16 + A.hash(i + k * 9) * 26;
        g.strokeStyle = '#2f8f4f'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(lx + 1, 24); g.quadraticCurveTo(lx - 2, 24 + len / 2, lx + 1, 24 + len); g.stroke();
        for (var j = 6; j < len; j += 6) { g.fillStyle = j % 12 ? '#3fbf6f' : '#2fa35f'; A.ell(g, lx + (j % 12 ? 2 : -1), 24 + j, 2.6, 1.8); g.fill(); }
      }
    });
    g.fillStyle = '#d9cfbf'; g.fillRect(80, 100, 1130, 8); g.fillStyle = '#fff'; g.fillRect(80, 100, 1130, 2);
    [[150, '#ff6b6b'], [330, '#ffd93d'], [610, '#6bcb77'], [1000, '#7b8cff'], [1150, '#ff9ed2']].forEach(function (p) {
      var x = p[0], c = p[1];
      A.shadow(g, x, 118, 30, 6, 0.4);
      var gr = g.createRadialGradient(x - 8, 98, 2, x, 106, 30);
      gr.addColorStop(0, A.shade(c, 0.35)); gr.addColorStop(1, A.shade(c, -0.25));
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(x - 28, 116); g.bezierCurveTo(x - 32, 92, x - 14, 84, x, 86);
      g.bezierCurveTo(x + 16, 84, x + 32, 94, x + 28, 116); g.closePath(); g.fill();
      g.strokeStyle = A.shade(c, -0.55); g.lineWidth = 1.5; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(x - 4, 100, 12, Math.PI * 1.1, Math.PI * 1.6); g.stroke();
    });
    g.fillStyle = '#c9bca6'; g.fillRect(0, 112, 1280, 8); g.fillStyle = '#fff'; g.fillRect(0, 112, 1280, 2);
  }

  function bgConsulting(g, th) {
    g.fillStyle = th.wall; g.fillRect(0, 0, 1280, 120);
    for (var x = 0; x < 1280; x += 40) { g.fillStyle = 'rgba(0,0,0,0.07)'; g.fillRect(x, 0, 2, 120); g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(x + 2, 0, 1, 120); }
    wallShading(g, 0, 0, 1280, 120);
    g.fillStyle = '#2c3650'; g.fillRect(0, 84, 1280, 6);
    // pizarra 1: Gantt
    frame(g, 100, 12, 250, 82, '#b8bec8', 4);
    g.fillStyle = '#fbfcff'; g.fillRect(100, 12, 250, 82);
    g.strokeStyle = 'rgba(40,50,80,0.18)'; g.lineWidth = 1;
    for (var gx = 130; gx < 345; gx += 24) { g.beginPath(); g.moveTo(gx, 18); g.lineTo(gx, 88); g.stroke(); }
    [['#2f6fd6', 0, 3], ['#e0483e', 2, 4], ['#3fbf6f', 3, 3], ['#f2b632', 5, 2], ['#2f6fd6', 6, 2]].forEach(function (b, i) {
      g.fillStyle = '#9aa0b2'; g.fillRect(106, 22 + i * 13, 18, 4);
      g.fillStyle = b[0]; A.rr(g, 130 + b[1] * 24, 19 + i * 13, b[2] * 24 - 4, 9, 3); g.fill();
    });
    g.strokeStyle = '#e0483e'; g.lineWidth = 2; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(262, 15); g.lineTo(262, 91); g.stroke(); g.setLineDash([]);
    // pizarra 2: línea que sube
    frame(g, 400, 12, 240, 82, '#b8bec8', 4);
    g.fillStyle = '#fbfcff'; g.fillRect(400, 12, 240, 82);
    g.strokeStyle = '#2f6fd6'; g.lineWidth = 3; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(415, 80); g.lineTo(450, 70); g.lineTo(480, 74); g.lineTo(515, 52); g.lineTo(545, 58); g.lineTo(590, 24); g.stroke();
    g.fillStyle = '#2f6fd6'; g.beginPath(); g.moveTo(598, 18); g.lineTo(582, 22); g.lineTo(594, 32); g.fill();
    A.drawText(g, 'KPI ↑', 450, 28, { size: 13, color: '#1d2a44', shadow: false });
    [['#ffe066', 600, 60], ['#ff9ec7', 616, 70], ['#9ee6ff', 412, 18]].forEach(function (s) { postit(g, s[1], s[2], 18, s[0], 0.12, 2); });
    // póster de montaña (liderazgo) sin texto
    frame(g, 840, 14, 110, 66, '#1d2a44', 3);
    var pg = g.createLinearGradient(0, 14, 0, 80); pg.addColorStop(0, '#ffb36b'); pg.addColorStop(1, '#5b6fd6');
    g.fillStyle = pg; g.fillRect(840, 14, 110, 66);
    g.fillStyle = '#2b2f55'; g.beginPath(); g.moveTo(840, 70); g.lineTo(880, 36); g.lineTo(905, 56); g.lineTo(925, 42); g.lineTo(950, 70); g.lineTo(950, 80); g.lineTo(840, 80); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(880, 36); g.lineTo(872, 43); g.lineTo(888, 43); g.fill();
    g.strokeStyle = '#ff4f6d'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(880, 36); g.lineTo(880, 24); g.stroke();
    g.fillStyle = '#ff4f6d'; g.beginPath(); g.moveTo(880, 24); g.lineTo(890, 27); g.lineTo(880, 30); g.fill();
    // ventana con persianas
    frame(g, 990, 10, 200, 84, '#3d4658', 4);
    var bl = g.createLinearGradient(0, 10, 0, 94); bl.addColorStop(0, '#cfe4ff'); bl.addColorStop(1, '#8fb3e0');
    g.fillStyle = bl; g.fillRect(990, 10, 200, 84);
    for (var s = 0; s < 12; s++) {
      g.fillStyle = s % 2 ? '#e7eaef' : '#dde1e8'; g.fillRect(990, 12 + s * 7, 200, 4.5);
      g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(990, 16 + s * 7, 200, 0.8);
    }
    g.fillStyle = '#8890a0'; g.fillRect(1086, 10, 2, 84);
    g.fillStyle = '#e9ecf2'; A.rr(g, 1210, 82, 34, 30, 4); g.fill(); g.strokeStyle = '#606878'; g.lineWidth = 1.5; g.stroke();
    var R = A.rng(5);
    for (var i = 0; i < 26; i++) {
      var a = R() * Math.PI * 2, d = R() * 22;
      g.fillStyle = A.mix('#2e8b57', '#6fcf6f', R());
      A.ell(g, 1227 + Math.cos(a) * d, 52 + Math.sin(a) * d * 0.9, 7, 4.5); g.fill();
    }
    g.fillStyle = '#3a4152'; g.fillRect(0, 108, 1280, 12); g.fillStyle = '#56607a'; g.fillRect(0, 108, 1280, 2);
  }

  var CORP_TV = [520, 14, 240, 82];
  function bgCorporate(g, th, info) {
    g.fillStyle = th.wall; g.fillRect(0, 0, 1280, 120);
    // muro cortina de cristal con la ciudad de noche
    var R = A.rng(77);
    g.save(); g.beginPath(); g.rect(0, 0, 1280, 104); g.clip();
    var sky = g.createLinearGradient(0, 0, 0, 104); sky.addColorStop(0, '#0b1230'); sky.addColorStop(0.7, '#27305a'); sky.addColorStop(1, '#4a3a6a');
    g.fillStyle = sky; g.fillRect(0, 0, 1280, 104);
    for (var st = 0; st < 60; st++) { g.fillStyle = 'rgba(255,255,255,' + (0.3 + R() * 0.5) + ')'; g.fillRect(R() * 1280, R() * 40, 1.2, 1.2); }
    skyline(g, -10, 34, 1300, 70, R, ['#1a2142', '#202850', '#161c38'], 'rgba(255,220,140,0.75)', 0.2);
    skyline(g, -10, 56, 1300, 48, R, ['#101530', '#141a3a'], '#ffd27a', 0.28);
    g.restore();
    info.planes = [];
    // montantes
    g.fillStyle = '#1a2030';
    for (var m = 0; m <= 1280; m += 128) g.fillRect(m - 3, 0, 6, 104);
    g.fillRect(0, 40, 1280, 3);
    g.fillStyle = 'rgba(255,255,255,0.05)';
    for (var m2 = 0; m2 < 1280; m2 += 128) { g.beginPath(); g.moveTo(m2 + 20, 0); g.lineTo(m2 + 50, 0); g.lineTo(m2 + 10, 104); g.lineTo(m2 - 20, 104); g.fill(); }
    // placa con logo corporativo (abstracto)
    frame(g, 120, 24, 170, 58, '#c9a640', 3);
    var lg = g.createLinearGradient(0, 24, 0, 82); lg.addColorStop(0, '#2b3550'); lg.addColorStop(1, '#1a2030');
    g.fillStyle = lg; g.fillRect(120, 24, 170, 58);
    g.save(); g.translate(158, 53);
    g.fillStyle = '#e0b84a'; g.beginPath(); g.moveTo(0, -18); g.lineTo(16, 9); g.lineTo(-16, 9); g.closePath(); g.fill();
    g.fillStyle = '#2b3550'; g.beginPath(); g.moveTo(0, -6); g.lineTo(8, 9); g.lineTo(-8, 9); g.closePath(); g.fill();
    g.restore();
    g.fillStyle = '#e0b84a'; g.fillRect(186, 42, 86, 7); g.fillStyle = 'rgba(224,184,74,0.55)'; g.fillRect(186, 56, 64, 4); g.fillRect(186, 64, 74, 4);
    // pantalla grande del dashboard (contenido animado)
    frame(g, CORP_TV[0], CORP_TV[1], CORP_TV[2], CORP_TV[3], '#0a0d16', 5);
    g.fillStyle = '#0d1428'; g.fillRect(CORP_TV[0], CORP_TV[1], CORP_TV[2], CORP_TV[3]);
    // reloj mundial: 3 relojes
    [960, 1040, 1120].forEach(function (cx, k) {
      A.circle(g, cx, 50, 22); g.fillStyle = '#e8ecf4'; g.fill(); g.strokeStyle = '#c9a640'; g.lineWidth = 3; g.stroke();
      g.strokeStyle = '#1a2030'; g.lineWidth = 2; g.lineCap = 'round';
      var ah = (k * 4 + 2) * PI / 6 - PI / 2, am = (k * 17) * PI / 30 - PI / 2;
      g.beginPath(); g.moveTo(cx, 50); g.lineTo(cx + Math.cos(ah) * 10, 50 + Math.sin(ah) * 10); g.moveTo(cx, 50); g.lineTo(cx + Math.cos(am) * 16, 50 + Math.sin(am) * 16); g.stroke();
      g.fillStyle = '#c9a640'; g.fillRect(cx - 14, 78, 28, 4);
    });
    g.fillStyle = '#141a28'; g.fillRect(0, 104, 1280, 16); g.fillStyle = '#c9a640'; g.globalAlpha = 0.6; g.fillRect(0, 104, 1280, 1.5); g.globalAlpha = 1;
  }

  function bgQuarterclose(g, th) {
    g.fillStyle = th.wall; g.fillRect(0, 0, 1280, 120);
    for (var x = 0; x < 1280; x += 48) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x, 0, 3, 120); }
    frame(g, 330, 8, 620, 100, '#2a1225', 5);
    g.fillStyle = '#2a1225'; g.fillRect(330, 8, 620, 100);
    // calendario gigante de pared: día 31 marcado
    g.save(); g.translate(180, 58); g.rotate(-0.04);
    g.fillStyle = 'rgba(0,0,0,0.3)'; A.rr(g, -66, -40, 136, 84, 5); g.fill();
    g.fillStyle = '#fff6e0'; A.rr(g, -70, -44, 136, 84, 5); g.fill(); g.strokeStyle = '#2a1225'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#e0302e'; A.rr(g, -70, -44, 136, 16, 5); g.fill(); g.fillRect(-70, -34, 136, 6);
    for (var ring = 0; ring < 5; ring++) { g.fillStyle = '#2a1225'; A.rr(g, -58 + ring * 26, -50, 5, 12, 2); g.fill(); }
    g.fillStyle = 'rgba(42,18,37,0.35)';
    for (var r = 0; r < 4; r++) for (var c = 0; c < 7; c++) {
      if (r === 3 && c > 2) continue;
      g.fillRect(-64 + c * 18.5, -22 + r * 15, 13, 10);
    }
    // 31 rodeado
    g.fillStyle = '#2a1225'; g.font = 'bold 13px ' + A.FONT; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('31', -64 + 2 * 18.5 + 6.5, -22 + 3 * 15 + 5.5);
    g.strokeStyle = '#e0302e'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(-64 + 2 * 18.5 + 6.5, -22 + 3 * 15 + 5, 13, 9, -0.2, 0, TAU); g.stroke();
    g.restore();
    // marco del reloj digital
    frame(g, 1010, 26, 170, 64, '#1a0a16', 4);
    g.fillStyle = '#160812'; g.fillRect(1010, 26, 170, 64);
    g.fillStyle = 'rgba(255,40,40,0.08)'; g.font = 'bold 44px ' + A.MONO; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('88:88', 1095, 59);
    g.fillStyle = '#2a1225'; g.fillRect(0, 108, 1280, 12); g.fillStyle = '#7a3a52'; g.fillRect(0, 108, 1280, 2);
  }

  var BG_FN = { startup: bgStartup, coworking: bgCoworking, consulting: bgConsulting, corporate: bgCorporate, quarterclose: bgQuarterclose };
  function buildBackground(theme) {
    var th = A.theme(theme), c = A.canvas(1280, 720), g = c.getContext('2d'), info = { canvas: c };
    g.fillStyle = th.outer; g.fillRect(0, 0, 1280, 720);
    (BG_FN[theme] || bgCoworking)(g, th, info);
    sideWalls(g, th);
    return info;
  }

  function getBg(theme) {
    theme = A.resolveTheme(theme);
    return bgCache[theme] || (bgCache[theme] = buildBackground(theme));
  }

  var cloudSprite = null;
  function getCloud() {
    if (cloudSprite) return cloudSprite;
    var c = A.canvas(120, 50), g = c.getContext('2d');
    g.fillStyle = 'rgba(255,255,255,0.92)';
    [[30, 32, 18], [55, 24, 22], [82, 30, 17], [100, 36, 11], [16, 38, 10]].forEach(function (b) { A.circle(g, b[0], b[1], b[2]); g.fill(); });
    g.fillRect(16, 34, 90, 12);
    cloudSprite = c; return c;
  }

  function bulb(ctx, bx, t, col) {
    var sw = Math.sin(t * 1.3) * 0.08, flick = 0.85 + 0.15 * Math.sin(t * 23) * Math.sin(t * 7.1);
    ctx.save(); ctx.translate(bx, 0); ctx.rotate(sw);
    ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 44); ctx.stroke();
    ctx.fillStyle = '#333'; ctx.fillRect(-5, 42, 10, 8);
    A.glow(ctx, 0, 60, 70 * flick, col || '#ffb050', 0.55 * flick);
    ctx.fillStyle = A.mix('#ffd27a', '#fff6d0', flick); A.circle(ctx, 0, 58, 9); ctx.fill();
    ctx.fillStyle = '#fff'; A.circle(ctx, -3, 55, 3); ctx.fill();
    ctx.restore();
  }

  A.drawBackground = function (ctx, theme, t) {
    t = A.num(t, 0);
    theme = A.resolveTheme(theme);
    var info = getBg(theme);
    ctx.drawImage(info.canvas, 0, 0);
    if (theme === 'startup') {
      bulb(ctx, 690, t); bulb(ctx, 1210, t + 1.7);
      // neón de bombilla-idea en el ladrillo
      var on = (Math.sin(t * 2) > -0.9 || Math.sin(t * 37) > 0) ? 1 : 0.35;
      ctx.save(); ctx.translate(387, 34);
      if (on > 0.5) A.glow(ctx, 0, 0, 40, '#ffd23f', 0.35);
      ctx.strokeStyle = on > 0.5 ? '#fff2a8' : '#8a7a4a'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, -2, 9, PI * 0.75, PI * 2.25); ctx.lineTo(4, 12); ctx.lineTo(-4, 12); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-3, 15); ctx.lineTo(3, 15); ctx.stroke();
      ctx.restore();
    } else if (theme === 'coworking') {
      var cl = getCloud();
      CW_WINS.forEach(function (w, i) {
        ctx.save(); ctx.beginPath(); ctx.rect(w[0], w[1], w[2], 38); ctx.clip();
        for (var k = 0; k < 3; k++) {
          var span = 1280 + 240, x = ((t * (8 + k * 3) + k * 520 + i * 130) % span) - 160;
          ctx.globalAlpha = 0.75 - k * 0.15; ctx.drawImage(cl, x, w[1] + 2 + k * 9, 90 - k * 16, 38 - k * 7);
        }
        ctx.restore();
      });
      // neón: wifi + taza
      var on2 = (Math.sin(t * 2) > -0.9 || Math.sin(t * 37) > 0) ? 1 : 0.35;
      ctx.save(); ctx.translate(655, 68);
      ctx.fillStyle = 'rgba(40,20,40,0.85)'; A.rr(ctx, -60, -16, 120, 32, 16); ctx.fill();
      if (on2 > 0.5) A.glow(ctx, 0, 0, 90, '#ff4fa3', 0.35);
      ctx.strokeStyle = on2 > 0.5 ? '#ffd0ec' : '#9a5a7a'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
      for (var a = 0; a < 3; a++) { ctx.beginPath(); ctx.arc(-24, 8, 4 + a * 5, -PI * 0.78, -PI * 0.22); ctx.stroke(); }
      ctx.fillStyle = ctx.strokeStyle; A.circle(ctx, -24, 8, 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(10, -6); ctx.lineTo(28, -6); ctx.lineTo(26, 10); ctx.lineTo(12, 10); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.arc(29, 1, 4, -PI / 2, PI / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(15, -10); ctx.quadraticCurveTo(13, -13, 16, -15); ctx.moveTo(22, -10); ctx.quadraticCurveTo(20, -13, 23, -15); ctx.stroke();
      ctx.restore();
    } else if (theme === 'consulting') {
      var cx = 740, cy = 50;
      ctx.save();
      A.shadow(ctx, cx + 3, cy + 5, 34, 34, 0.35);
      ctx.fillStyle = '#2c3650'; A.circle(ctx, cx, cy, 34); ctx.fill();
      ctx.fillStyle = '#fbfcff'; A.circle(ctx, cx, cy, 29); ctx.fill();
      ctx.strokeStyle = '#2c3650'; ctx.lineWidth = 2;
      for (var h = 0; h < 12; h++) {
        var ha = h * Math.PI / 6; ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ha) * 24, cy + Math.sin(ha) * 24); ctx.lineTo(cx + Math.cos(ha) * 27, cy + Math.sin(ha) * 27); ctx.stroke();
      }
      var sec = Math.floor(t) + Math.min(1, (t % 1) * 8);
      var ah = (t / 60) * Math.PI * 2 / 12 - Math.PI / 2 + 0.4, am = (t / 60) * Math.PI * 2 - Math.PI / 2 - 1.2, as = sec / 60 * Math.PI * 2 - Math.PI / 2;
      ctx.lineCap = 'round';
      ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ah) * 14, cy + Math.sin(ah) * 14); ctx.stroke();
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(am) * 21, cy + Math.sin(am) * 21); ctx.stroke();
      ctx.strokeStyle = '#e0483e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx - Math.cos(as) * 5, cy - Math.sin(as) * 5); ctx.lineTo(cx + Math.cos(as) * 24, cy + Math.sin(as) * 24); ctx.stroke();
      ctx.fillStyle = '#e0483e'; A.circle(ctx, cx, cy, 2.5); ctx.fill();
      ctx.restore();
    } else if (theme === 'corporate') {
      // dashboard animado en la pantalla
      var X = CORP_TV[0], Y = CORP_TV[1], W = CORP_TV[2], H = CORP_TV[3];
      ctx.save(); ctx.beginPath(); ctx.rect(X, Y, W, H); ctx.clip();
      ctx.fillStyle = '#0d1428'; ctx.fillRect(X, Y, W, H);
      ctx.strokeStyle = 'rgba(120,160,255,0.12)'; ctx.lineWidth = 1;
      for (var gy = Y + 14; gy < Y + H; gy += 14) { ctx.beginPath(); ctx.moveTo(X, gy); ctx.lineTo(X + W, gy); ctx.stroke(); }
      ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.beginPath();
      for (var px = 0; px <= 150; px += 6) {
        var v = Math.sin((px + t * 30) * 0.05) * 10 + Math.sin((px + t * 30) * 0.13) * 6 - px * 0.12;
        if (px === 0) ctx.moveTo(X + 8 + px, Y + 52 + v); else ctx.lineTo(X + 8 + px, Y + 52 + v);
      }
      ctx.stroke();
      for (var b = 0; b < 4; b++) {
        var bh = 14 + (Math.sin(t * 1.3 + b * 1.7) * 0.5 + 0.5) * 34;
        ctx.fillStyle = ['#4da3ff', '#ffb02e', '#3ddc84', '#ff6b6b'][b]; ctx.fillRect(X + 170 + b * 16, Y + H - 8 - bh, 11, bh);
      }
      ctx.fillStyle = '#e0b84a'; ctx.fillRect(X + 8, Y + 6, 60, 5); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(X + 74, Y + 6, 30, 5);
      ctx.restore();
      A.glow(ctx, X + W / 2, Y + H / 2, 150, '#4d7bff', 0.12);
      // luz de avión
      var ax = ((t * 22) % 1500) - 110;
      if ((t * 2) % 1 < 0.5) { ctx.fillStyle = '#ff4f4f'; A.circle(ctx, ax, 18, 1.8); ctx.fill(); A.glow(ctx, ax, 18, 8, '#ff4f4f', 0.6); }
    } else if (theme === 'quarterclose') {
      ctx.save(); A.rr(ctx, 330, 8, 620, 100, 2); ctx.clip();
      if (!info.sky) {
        var skc = A.canvas(620, 100), skg = skc.getContext('2d');
        var sky = skg.createLinearGradient(0, 0, 0, 100);
        sky.addColorStop(0, '#5b2a7a'); sky.addColorStop(0.45, '#ff4f6d'); sky.addColorStop(0.8, '#ff9a3c'); sky.addColorStop(1, '#ffd36b');
        skg.fillStyle = sky; skg.fillRect(0, 0, 620, 100);
        info.sky = skc;
      }
      ctx.drawImage(info.sky, 330, 8);
      var sunY = 92 + Math.sin(t * 0.2) * 2;
      A.glow(ctx, 640, sunY, 120, '#ffb347', 0.6);
      ctx.fillStyle = '#ffe27a'; A.circle(ctx, 640, sunY, 34); ctx.fill();
      ctx.fillStyle = 'rgba(255,79,109,0.55)';
      for (var bnd = 0; bnd < 4; bnd++) ctx.fillRect(600, sunY - 2 + bnd * 7 + Math.sin(t * 2 + bnd) * 1.5, 80, 2.5);
      if (!info.city) {
        var cc = A.canvas(640, 60), cg = cc.getContext('2d');
        skyline(cg, 0, 0, 640, 60, A.rng(3), ['#3a1838', '#2f1430', '#45203f'], '#ffcf6b', 0.18);
        info.city = cc;
      }
      ctx.drawImage(info.city, 320, 50);
      ctx.strokeStyle = '#2a1225'; ctx.lineWidth = 1.5;
      for (var bi = 0; bi < 3; bi++) {
        var bx2 = 330 + ((t * 25 + bi * 90) % 680), by = 30 + bi * 9 + Math.sin(t * 2 + bi) * 4, f = Math.sin(t * 10 + bi) * 3;
        ctx.beginPath(); ctx.moveTo(bx2 - 6, by - f); ctx.quadraticCurveTo(bx2 - 3, by - 3, bx2, by); ctx.quadraticCurveTo(bx2 + 3, by - 3, bx2 + 6, by - f); ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = '#2a1225'; ctx.fillRect(536, 8, 5, 100); ctx.fillRect(740, 8, 5, 100);
      // reloj 23:59
      A.glow(ctx, 1095, 60, 70, '#ff2a2a', 0.35);
      ctx.save(); ctx.font = 'bold 44px ' + A.MONO; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ff3b3b';
      ctx.fillText((t % 1) < 0.5 ? '23:59' : '23 59', 1095, 61);
      ctx.restore();
      // banderines con símbolos de cierre (€ ✔ %)
      var sym = ['€', '✔', '%', '€', '✔', '%', '€', '✔', '%', '€'];
      ctx.save();
      ctx.strokeStyle = '#2a1225'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(340, 6); ctx.quadraticCurveTo(640, 34, 940, 6); ctx.stroke();
      for (var k2 = 0; k2 < sym.length; k2++) {
        var u = (k2 + 0.5) / sym.length, fx = 340 + 600 * u, fy = 6 + 4 * 28 * u * (1 - u) * 0.98;
        var wv = Math.sin(t * 4 + k2 * 0.8) * 0.12;
        ctx.save(); ctx.translate(fx, fy); ctx.rotate(wv);
        ctx.fillStyle = k2 % 2 ? '#ffd23f' : '#ff7b3a';
        ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(14, 0); ctx.lineTo(0, 30); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(42,18,37,0.6)'; ctx.stroke();
        A.drawText(ctx, sym[k2], 0, 10, { size: 12, color: '#2a1225', shadow: false });
        ctx.restore();
      }
      ctx.restore();
      var ang = t * 5;
      ctx.save(); ctx.translate(288, 12);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,60,40,0.18)';
      var sx = Math.cos(ang);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sx * 160 - 30, 110); ctx.lineTo(sx * 160 + 30, 110); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#ff3b2e'; A.rr(ctx, 280, 4, 16, 12, 5); ctx.fill();
      A.glow(ctx, 288, 10, 20, '#ff3b2e', 0.4 + 0.4 * Math.abs(sx));
    }
  };

  /* ============================================================ SUELOS */
  var floorCache = {};
  function buildFloor(theme, cols, rows, tile) {
    var th = A.theme(theme), W = cols * tile, H = rows * tile, c = A.canvas(W, H), g = c.getContext('2d');
    var R = A.rng(cols * 31 + rows * 7 + theme.length);
    var s = tile / 64;
    if (theme === 'startup') {
      var ph = 16 * s;
      for (var y = 0; y < H; y += ph) {
        var x = -R() * 120 * s;
        while (x < W) {
          var len = (90 + R() * 120) * s;
          var base = A.mix(th.floor2, th.floor, R());
          var gr = g.createLinearGradient(0, y, 0, y + ph);
          gr.addColorStop(0, A.shade(base, 0.08)); gr.addColorStop(1, A.shade(base, -0.08));
          g.fillStyle = gr; g.fillRect(x, y, len, ph);
          g.strokeStyle = A.rgba('#5a3416', 0.18); g.lineWidth = 1;
          for (var k = 0; k < 3; k++) {
            var gy = y + 3 + R() * (ph - 6); g.beginPath(); g.moveTo(x + 4, gy);
            g.bezierCurveTo(x + len * 0.3, gy + (R() - 0.5) * 4, x + len * 0.6, gy + (R() - 0.5) * 4, x + len - 4, gy); g.stroke();
          }
          g.fillStyle = 'rgba(70,40,15,0.55)'; g.fillRect(x, y, 1.5, ph);
          x += len;
        }
        g.fillStyle = 'rgba(60,32,12,0.45)'; g.fillRect(0, y + ph - 1, W, 1);
      }
      // alfombra de zona chill
      g.fillStyle = 'rgba(255,90,90,0.12)'; A.rr(g, W * 0.34, H * 0.36, W * 0.32, H * 0.3, 14); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 3; A.rr(g, W * 0.34 + 7, H * 0.36 + 7, W * 0.32 - 14, H * 0.3 - 14, 10); g.stroke();
    } else if (theme === 'coworking' || theme === 'consulting') {
      for (var ty = 0; ty < rows; ty++) for (var tx = 0; tx < cols; tx++) {
        var alt = (tx + ty) % 2;
        g.fillStyle = alt ? th.floor : th.floor2; g.fillRect(tx * tile, ty * tile, tile, tile);
        g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 1;
        for (var l = 4; l < tile; l += 5) {
          g.beginPath();
          if (alt) { g.moveTo(tx * tile + l, ty * tile + 1); g.lineTo(tx * tile + l, ty * tile + tile - 1); }
          else { g.moveTo(tx * tile + 1, ty * tile + l); g.lineTo(tx * tile + tile - 1, ty * tile + l); }
          g.stroke();
        }
        g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(tx * tile, ty * tile + tile - 1, tile, 1); g.fillRect(tx * tile + tile - 1, ty * tile, 1, tile);
      }
      for (var n = 0; n < W * H / 30; n++) {
        g.fillStyle = R() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
        g.fillRect(R() * W, R() * H, 1.5, 1.5);
      }
      if (theme === 'coworking') {
        var ax = W * 0.3, ay = H * 0.32, aw = W * 0.4, ah = H * 0.36;
        g.fillStyle = 'rgba(255,214,102,0.10)'; A.rr(g, ax, ay, aw, ah, 20); g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.10)'; g.lineWidth = 3; A.rr(g, ax + 8, ay + 8, aw - 16, ah - 16, 14); g.stroke();
      }
    } else if (theme === 'corporate') {
      // moqueta en losetas con veta alterna
      for (var cy = 0; cy < rows; cy++) for (var cx = 0; cx < cols; cx++) {
        var X = cx * tile, Y = cy * tile, al = (cx + cy) % 2;
        g.fillStyle = al ? th.floor : th.floor2; g.fillRect(X, Y, tile, tile);
        g.strokeStyle = al ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.06)'; g.lineWidth = 1.5;
        for (var q = 3; q < tile; q += 4) {
          g.beginPath();
          if (al) { g.moveTo(X + q, Y); g.lineTo(X + q, Y + tile); } else { g.moveTo(X, Y + q); g.lineTo(X + tile, Y + q); }
          g.stroke();
        }
        g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(X, Y + tile - 1, tile, 1); g.fillRect(X + tile - 1, Y, 1, tile);
      }
      for (var nn = 0; nn < W * H / 14; nn++) { g.fillStyle = R() < 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.07)'; g.fillRect(R() * W, R() * H, 1.2, 1.2); }
      // pasillo con franja dorada
      g.fillStyle = 'rgba(224,184,74,0.10)'; g.fillRect(0, H * 0.45, W, tile * 0.6);
      g.fillStyle = 'rgba(224,184,74,0.25)'; g.fillRect(0, H * 0.45, W, 2); g.fillRect(0, H * 0.45 + tile * 0.6 - 2, W, 2);
    } else { // quarterclose: parquet en espiga
      var pw = 32 * s;
      for (var py = 0; py < H; py += pw / 2) for (var px = 0; px < W; px += pw) {
        var off = ((py / (pw / 2)) % 2) * pw / 2;
        var col = A.mix(th.floor2, th.floor, R());
        g.fillStyle = col; g.fillRect(px - off, py, pw, pw / 2);
        g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(px - off, py, pw, 1);
        g.fillStyle = 'rgba(60,20,20,0.25)'; g.fillRect(px - off, py, 1, pw / 2);
      }
      g.save(); g.globalCompositeOperation = 'lighter';
      for (var b2 = 0; b2 < 3; b2++) {
        var bx = W * (0.25 + b2 * 0.22);
        var bg2 = g.createLinearGradient(0, 0, 0, H);
        bg2.addColorStop(0, 'rgba(255,150,70,0.20)'); bg2.addColorStop(1, 'rgba(255,150,70,0)');
        g.fillStyle = bg2; g.beginPath(); g.moveTo(bx, 0); g.lineTo(bx + 90 * s, 0); g.lineTo(bx + 220 * s, H); g.lineTo(bx + 60 * s, H); g.fill();
      }
      g.restore();
    }
    var e = 22 * s;
    var tg = g.createLinearGradient(0, 0, 0, e * 1.4); tg.addColorStop(0, 'rgba(0,0,0,0.45)'); tg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = tg; g.fillRect(0, 0, W, e * 1.4);
    var lg = g.createLinearGradient(0, 0, e, 0); lg.addColorStop(0, 'rgba(0,0,0,0.35)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = lg; g.fillRect(0, 0, e, H);
    var rg = g.createLinearGradient(W, 0, W - e, 0); rg.addColorStop(0, 'rgba(0,0,0,0.35)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(W - e, 0, e, H);
    var bgd = g.createLinearGradient(0, H, 0, H - e); bgd.addColorStop(0, 'rgba(0,0,0,0.3)'); bgd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = bgd; g.fillRect(0, H - e, W, e);
    var vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.22)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    return c;
  }

  A.drawFloor = function (ctx, theme, cols, rows, ox, oy, tile, t) {
    cols = A.num(cols, 18) | 0; rows = A.num(rows, 9) | 0; tile = A.num(tile, 64);
    ox = A.num(ox, 64); oy = A.num(oy, 128); t = A.num(t, 0);
    theme = A.resolveTheme(theme);
    var k = theme + '|' + cols + '|' + rows + '|' + tile;
    var c = floorCache[k] || (floorCache[k] = buildFloor(theme, cols, rows, tile));
    ctx.drawImage(c, ox, oy);
    var W = cols * tile, H = rows * tile;
    if (theme === 'corporate') {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      var p = 0.03 + 0.02 * Math.sin(t * 0.7);
      var g2 = ctx.createLinearGradient(ox, oy, ox, oy + H);
      g2.addColorStop(0, 'rgba(90,120,255,' + p + ')'); g2.addColorStop(1, 'rgba(90,120,255,0)');
      ctx.fillStyle = g2; ctx.fillRect(ox, oy, W, H);
      ctx.restore();
    } else if (theme === 'quarterclose') {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,110,50,' + (0.04 + 0.03 * Math.sin(t * 0.9)) + ')';
      ctx.fillRect(ox, oy, W, H);
      ctx.restore();
    }
  };

  /* ================================================== BARRA DE PROGRESO */
  A.drawProgressBar = function (ctx, cx, cy, w, p, color) {
    w = A.num(w, 44); p = A.clamp(A.num(p, 0), 0, 1); color = color || '#3ddc84';
    var h = Math.max(8, Math.round(w * 0.2)), x = cx - w / 2, y = cy - h / 2;
    ctx.save();
    A.shadow(ctx, cx, cy + h * 0.8, w * 0.5, h * 0.45, 0.35);
    A.rr(ctx, x - 2, y - 2, w + 4, h + 4, h / 2 + 2); ctx.fillStyle = '#1b1430'; ctx.fill();
    A.rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = '#3a3052'; ctx.fill();
    if (p > 0) {
      var fw = Math.max(h, w * p);
      A.rr(ctx, x, y, fw, h, h / 2);
      var gr = ctx.createLinearGradient(0, y, 0, y + h);
      gr.addColorStop(0, A.shade(color, 0.35)); gr.addColorStop(0.5, color); gr.addColorStop(1, A.shade(color, -0.25));
      ctx.fillStyle = gr; ctx.fill();
      A.rr(ctx, x + 2, y + 1.5, fw - 4, h * 0.32, h * 0.16); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();
    }
    // marcas
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (var i = 1; i < 4; i++) ctx.fillRect(x + w * i / 4 - 0.5, y + 1, 1, h - 2);
    ctx.restore();
  };

  /* ========================================================= ILUMINACIÓN */
  var lightCanvas = null, lightG = null, LSCALE = 0.25;
  var whiteHole = null;
  function getHole() {
    if (whiteHole) return whiteHole;
    var c = A.canvas(128, 128), g = c.getContext('2d');
    var gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.9)');
    gr.addColorStop(0.7, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return (whiteHole = c);
  }
  A.drawLighting = function (ctx, lights, darkness) {
    darkness = A.clamp(A.num(darkness, 0), 0, 1);
    if (darkness <= 0.001) return;
    lights = lights || [];
    if (!lightCanvas) { lightCanvas = A.canvas(A.W * LSCALE, A.H * LSCALE); lightG = lightCanvas.getContext('2d'); }
    var g = lightG, hole = getHole();
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, lightCanvas.width, lightCanvas.height);
    g.fillStyle = 'rgba(4,6,20,' + darkness + ')';
    g.fillRect(0, 0, lightCanvas.width, lightCanvas.height);
    g.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < lights.length; i++) {
      var L = lights[i]; if (!L) continue;
      var r = A.num(L.r, 80) * LSCALE, x = A.num(L.x, 0) * LSCALE, y = A.num(L.y, 0) * LSCALE;
      g.globalAlpha = A.clamp(A.num(L.intensity, 1), 0, 1);
      g.drawImage(hole, x - r, y - r, r * 2, r * 2);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.drawImage(lightCanvas, 0, 0, A.W, A.H);
    ctx.globalCompositeOperation = 'lighter';
    for (var j = 0; j < lights.length; j++) {
      var M = lights[j]; if (!M || !M.color) continue;
      var rr = A.num(M.r, 80);
      ctx.globalAlpha = 0.32 * darkness * A.clamp(A.num(M.intensity, 1), 0, 1);
      ctx.drawImage(A.blob(M.color), A.num(M.x, 0) - rr * 0.8, A.num(M.y, 0) - rr * 0.8, rr * 1.6, rr * 1.6);
    }
    ctx.restore();
  };

  /* estrellas de resultado */
  A.drawStars = function (ctx, cx, cy, n, size, t) {
    size = A.num(size, 40); n = A.num(n, 0); t = A.num(t, 0);
    for (var i = 0; i < 3; i++) {
      var x = cx + (i - 1) * size * 1.25, y = cy + (i === 1 ? -size * 0.25 : 0);
      var s = size * (i === 1 ? 1.2 : 1) * (i < n ? 1 + 0.05 * Math.sin(t * 4 + i) : 1);
      if (A.drawIcon) A.drawIcon(ctx, i < n ? 'star' : 'star_empty', x, y, s);
    }
  };

  /* init: prerenderiza cachés */
  A.init = function () {
    try {
      Object.keys(A.THEMES).forEach(function (k) { getBg(k); });
      getHole(); getCloud();
      if (A._initStations) A._initStations();
      if (A._initItems) A._initItems();
      if (A._initUI) A._initUI();
      if (OW.FX && OW.FX._init) OW.FX._init();
    } catch (e) { if (window.console) console.warn('OW.Art.init', e); }
    A.ready = true;
  };
})(window.OW);
