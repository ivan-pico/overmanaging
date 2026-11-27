/* OVERMANAGING — js/art/items.js (agente ART)
 * drawItem: sprites prerenderizados (por kind/lane/contents) a 3x + efectos animados.
 * kinds: brief, draft, printout, approved, burnt, dossier, dossier_minutes, extinguisher.
 * (alias antiguos: spec, code, build, tested, pr, pr_dirty). */
window.OW = window.OW || {};
(function (OW) {
  'use strict';
  var A = OW.Art = OW.Art || {};
  var PI = Math.PI, TAU = PI * 2;
  var RES = 3, S = 48, cache = {};
  var OUT = '#3a3550';
  var ALIAS = { spec: 'brief', code: 'draft', build: 'printout', tested: 'approved', pr: 'dossier', pr_dirty: 'dossier_minutes' };
  function order() { return A.LANE_ORDER || ['budget', 'plan', 'report']; }
  function glyph(g, lane, cx, cy, size, color, lw) { if (A.drawLaneGlyph) A.drawLaneGlyph(g, lane, cx, cy, size, color, lw); }
  function normLanes(arr) {
    var o = order();
    return (Array.isArray(arr) ? arr : []).map(function (l) { return A.laneId ? A.laneId(l) : l; })
      .sort(function (a, b) { return o.indexOf(a) - o.indexOf(b); });
  }

  /* contenido típico de cada carril dibujado en una hoja (x,y,w,h) */
  function laneContent(g, lane, x, y, w, h) {
    var L = A.laneInfo(lane);
    lane = A.laneId ? A.laneId(lane) : lane;
    if (lane === 'budget') { // tabla con importes
      for (var r = 0; r < 4; r++) {
        g.fillStyle = r === 3 ? L.dark : '#b9bdcc';
        g.fillRect(x, y + r * h / 4, w * 0.5, Math.max(1, h * 0.09));
        g.fillRect(x + w * 0.68, y + r * h / 4, w * 0.32, Math.max(1, h * 0.09));
      }
      g.fillStyle = L.color; g.fillRect(x + w * 0.6, y + h * 0.72, w * 0.4, 1);
    } else if (lane === 'plan') { // mini Gantt
      for (var b = 0; b < 4; b++) { g.fillStyle = b % 2 ? L.color : L.dark; g.fillRect(x + b * w * 0.2, y + b * h / 4, w * 0.42, Math.max(1.4, h * 0.14)); }
    } else if (lane === 'report') { // barras + quesito
      var bw = w * 0.13;
      for (var k = 0; k < 3; k++) { var bh = h * (0.35 + k * 0.25); g.fillStyle = k === 2 ? L.color : L.dark; g.fillRect(x + k * bw * 1.4, y + h - bh, bw, bh); }
      g.fillStyle = L.light; A.circle(g, x + w * 0.78, y + h * 0.5, Math.min(w, h) * 0.28); g.fill();
      g.fillStyle = L.color; g.beginPath(); g.moveTo(x + w * 0.78, y + h * 0.5); g.arc(x + w * 0.78, y + h * 0.5, Math.min(w, h) * 0.28, -PI / 2, PI * 0.3); g.closePath(); g.fill();
    } else {
      g.fillStyle = '#b9bdcc'; for (var i = 0; i < 4; i++) g.fillRect(x, y + i * h / 4, w * 0.8, 1);
    }
  }

  var DRAW = {};

  /* encargo: hoja suelta con clip */
  DRAW.brief = function (g, it) {
    var L = A.laneInfo(it.lane);
    g.save(); g.translate(24, 25); g.rotate(-0.08);
    g.fillStyle = 'rgba(0,0,0,0.2)'; A.rr(g, -12, -15, 27, 33, 2); g.fill();
    g.beginPath(); g.moveTo(-14, -17); g.lineTo(7, -17); g.lineTo(14, -10); g.lineTo(14, 17); g.lineTo(-14, 17); g.closePath();
    g.fillStyle = '#fdfdf8'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.8; g.lineJoin = 'round'; g.stroke();
    g.save(); g.clip();
    g.fillStyle = L.color; g.fillRect(-15, -18, 30, 11);
    g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(-15, -18, 30, 3);
    g.restore();
    glyph(g, it.lane, -6, -12, 9, '#fff', 3.2);
    g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(1, -14, 6, 1.6); g.fillRect(1, -11, 4, 1.6);
    g.beginPath(); g.moveTo(7, -17); g.lineTo(7, -10); g.lineTo(14, -10); g.closePath();
    g.fillStyle = A.shade(L.color, -0.25); g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.2; g.stroke();
    // datos en bruto: líneas y números sueltos
    for (var i = 0; i < 5; i++) {
      var y = -3 + i * 4;
      g.fillStyle = i === 2 ? A.shade(L.color, -0.1) : '#b9bdcc'; g.fillRect(-10, y - 0.8, 9 + ((i * 7) % 5) * 2, 1.7);
      g.fillStyle = '#c9ccd8'; g.fillRect(4, y - 0.8, 6, 1.7);
    }
    g.restore();
    // clip metálico
    g.save(); g.translate(8, 6); g.rotate(-0.08);
    g.strokeStyle = '#6b7286'; g.lineWidth = 1.6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 12); g.lineTo(0, 2); g.arc(2.5, 2, 2.5, PI, 0); g.lineTo(5, 13); g.arc(3, 13, 2, 0, PI); g.lineTo(1, 5); g.stroke();
    g.strokeStyle = '#d6dbe4'; g.lineWidth = 0.6; g.stroke();
    g.restore();
  };

  /* borrador: portapapeles con hoja garabateada y lápiz */
  DRAW.draft = function (g, it) {
    var L = A.laneInfo(it.lane);
    g.save(); g.translate(24, 25); g.rotate(0.06);
    g.fillStyle = 'rgba(0,0,0,0.22)'; A.rr(g, -13, -15, 30, 34, 3); g.fill();
    A.rr(g, -15, -18, 30, 36, 3); g.fillStyle = '#b8834f'; g.fill(); g.strokeStyle = '#4a2a10'; g.lineWidth = 1.8; g.stroke();
    g.fillStyle = '#fdfdf8'; g.fillRect(-12, -13, 24, 29);
    g.fillStyle = L.light; g.fillRect(-12, -13, 24, 5);
    // garabatos de borrador
    g.strokeStyle = '#7a7594'; g.lineWidth = 1.1; g.lineCap = 'round';
    for (var i = 0; i < 5; i++) {
      var y = -4 + i * 4; g.beginPath(); g.moveTo(-9, y);
      for (var x = -9; x < 6 - (i % 2) * 5; x += 2.5) g.lineTo(x, y + ((x * 7 + i) % 3 === 0 ? -0.8 : 0.6));
      g.stroke();
    }
    g.strokeStyle = '#e0302e'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-9, 4.5); g.lineTo(3, 3.5); g.stroke();
    // pinza
    A.rr(g, -7, -20, 14, 6, 2); g.fillStyle = '#c9ced8'; g.fill(); g.strokeStyle = '#3a4152'; g.lineWidth = 1.2; g.stroke();
    g.restore();
    // insignia carril
    A.circle(g, 37, 37, 7.5); g.fillStyle = L.color; g.fill(); g.strokeStyle = A.shade(L.dark, -0.4); g.lineWidth = 1.8; g.stroke();
    glyph(g, it.lane, 37, 37, 8, '#fff', 3.2);
    // lápiz
    g.save(); g.translate(30, 16); g.rotate(0.8);
    A.rr(g, -2, -11, 4, 18, 1); g.fillStyle = '#ffd23f'; g.fill(); g.strokeStyle = '#6a4a00'; g.lineWidth = 1; g.stroke();
    g.fillStyle = '#ff9ec7'; g.fillRect(-2, -11, 4, 3);
    g.beginPath(); g.moveTo(-2, 7); g.lineTo(0, 11); g.lineTo(2, 7); g.closePath(); g.fillStyle = '#f2d2a6'; g.fill(); g.stroke();
    g.fillStyle = '#2a2250'; A.circle(g, 0, 10.4, 0.7); g.fill();
    g.restore();
  };

  /* impreso: fajo de hojas con cabecera de carril */
  function stack(g, it) {
    var L = A.laneInfo(it.lane);
    g.save(); g.translate(24, 26);
    for (var i = 2; i >= 0; i--) {
      g.save(); g.translate(i * 1.8 - 1.8, -i * 1.6); g.rotate((i - 1) * 0.06);
      if (i === 0) { g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(-14, -15, 31, 33); }
      g.fillStyle = i ? '#eceef3' : '#ffffff'; g.fillRect(-15, -17, 30, 33);
      g.strokeStyle = OUT; g.lineWidth = i ? 1 : 1.8; g.strokeRect(-15, -17, 30, 33);
      if (!i) {
        g.fillStyle = L.color; g.fillRect(-15, -17, 30, 7);
        glyph(g, it.lane, -8.5, -13.5, 7, '#fff', 3.4);
        g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(-2, -15, 12, 1.6);
        laneContent(g, it.lane, -11, -5, 22, 13);
        g.fillStyle = '#c4c8d6'; g.fillRect(-11, 11, 22, 1.2); g.fillRect(-11, 13.5, 14, 1.2);
      }
      g.restore();
    }
    g.restore();
  }
  DRAW.printout = function (g, it) { stack(g, it); };
  DRAW.approved = function (g, it) {
    stack(g, it);
    // sello rojo con ✔
    g.save(); g.translate(31, 33); g.rotate(-0.25);
    g.globalAlpha = 0.92;
    A.circle(g, 0, 0, 10); g.strokeStyle = '#c8102e'; g.lineWidth = 2.2; g.stroke();
    A.circle(g, 0, 0, 7.2); g.lineWidth = 1; g.stroke();
    g.strokeStyle = '#c8102e'; g.lineWidth = 2.6; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-4, 0); g.lineTo(-1, 3.2); g.lineTo(4.5, -3.5); g.stroke();
    g.restore();
    // firma
    g.strokeStyle = '#2f3fa0'; g.lineWidth = 1.1; g.lineCap = 'round';
    g.beginPath(); g.moveTo(11, 39); g.bezierCurveTo(14, 34, 16, 42, 19, 37); g.bezierCurveTo(21, 34, 22, 40, 25, 38); g.stroke();
  };
  DRAW.burnt = function (g, it) {
    g.save(); g.translate(24, 27);
    g.beginPath();
    var pts = [[-15, -12], [-9, -17], [-3, -13], [3, -18], [9, -14], [15, -16], [14, -6], [17, 2], [13, 9], [15, 15], [6, 13], [0, 17], [-7, 13], [-14, 15], [-13, 6], [-17, -2]];
    pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); });
    g.closePath();
    var bg = g.createRadialGradient(0, 0, 2, 0, 0, 18); bg.addColorStop(0, '#5a4a40'); bg.addColorStop(0.6, '#2a2220'); bg.addColorStop(1, '#120c0a');
    g.fillStyle = bg; g.fill(); g.strokeStyle = '#0a0606'; g.lineWidth = 1.8; g.stroke();
    // bordes de brasa
    g.strokeStyle = '#ff7a1f'; g.lineWidth = 1.2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-15, -12); g.lineTo(-9, -17); g.lineTo(-3, -13); g.moveTo(9, -14); g.lineTo(15, -16); g.lineTo(14, -6); g.moveTo(-7, 13); g.lineTo(-14, 15); g.stroke();
    // restos de líneas de texto
    g.fillStyle = 'rgba(200,190,170,0.25)'; for (var i = 0; i < 4; i++) g.fillRect(-9, -5 + i * 4, 14 - i * 2, 1.2);
    // cinta de carril chamuscada
    var L = A.laneInfo(it.lane);
    g.fillStyle = A.shade(L.color, -0.55); g.fillRect(-12, -10, 10, 3);
    g.restore();
  };

  /* dossier de reunión */
  function folder(g, it, pending) {
    var base = pending ? '#c9a064' : '#f0c46a', dark = pending ? '#7a5a2a' : '#a8782a', light = pending ? '#e2c48e' : '#ffe2a0';
    var cont = normLanes(it.contents), n = cont.length, LO = order();
    g.save(); g.translate(24, 26);
    g.fillStyle = 'rgba(0,0,0,0.22)'; A.rr(g, -17, -11, 37, 27, 4); g.fill();
    // panel trasero con pestaña
    g.beginPath(); g.moveTo(-19, -12); g.lineTo(-19, -16); g.quadraticCurveTo(-19, -18, -17, -18); g.lineTo(-6, -18); g.lineTo(-3, -14); g.lineTo(17, -14);
    g.quadraticCurveTo(19, -14, 19, -12); g.lineTo(19, 14); g.lineTo(-19, 14); g.closePath();
    g.fillStyle = dark; g.fill(); g.strokeStyle = A.shade(dark, -0.55); g.lineWidth = 1.8; g.lineJoin = 'round'; g.stroke();
    // documentos asomando con el color de su carril
    for (var i = 0; i < n; i++) {
      var L = A.laneInfo(cont[i]);
      var px = -14 + i * 9.5, py = -19 + (i % 2) * 1.5;
      g.save(); g.translate(px + 7, py + 8); g.rotate((i - 1) * 0.12);
      A.rr(g, -7, -8, 14, 16, 1.5); g.fillStyle = '#ffffff'; g.fill(); g.strokeStyle = L.dark; g.lineWidth = 1.2; g.stroke();
      g.fillStyle = L.color; g.fillRect(-7, -8, 14, 4);
      g.restore();
    }
    if (!n) { g.fillStyle = '#f4f2fb'; A.rr(g, -14, -16, 26, 10, 1.5); g.fill(); g.strokeStyle = '#9a90b8'; g.lineWidth = 1; g.stroke(); }
    // panel frontal
    g.beginPath(); g.moveTo(-19, -8); g.lineTo(19, -8); g.lineTo(18, 14); g.lineTo(-18, 14); g.closePath();
    var fg = g.createLinearGradient(0, -8, 0, 14); fg.addColorStop(0, light); fg.addColorStop(1, base);
    g.fillStyle = fg; g.fill(); g.strokeStyle = A.shade(dark, -0.55); g.lineWidth = 1.8; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-17, -6.5, 34, 1.5);
    // pictograma de calendario (reunión)
    g.save(); g.translate(-11, -1.5);
    g.fillStyle = '#fff'; g.fillRect(-5, -4, 10, 8); g.strokeStyle = OUT; g.lineWidth = 1; g.strokeRect(-5, -4, 10, 8);
    g.fillStyle = '#e0302e'; g.fillRect(-5, -4, 10, 2.8);
    g.fillStyle = '#7a7594'; g.fillRect(-3, 0, 1.6, 1.4); g.fillRect(-0.5, 0, 1.6, 1.4); g.fillRect(2, 0, 1.6, 1.4);
    g.restore();
    g.fillStyle = A.shade(dark, -0.1); g.fillRect(-3, -3.5, 18, 1.5); g.fillRect(-3, -0.5, 12, 1.5);
    // chips de carriles
    for (var c = 0; c < 3; c++) {
      var lane = LO[c], has = cont.indexOf(lane) >= 0, cx = -11 + c * 11, cy = 8.5;
      A.rr(g, cx - 5, cy - 3.6, 10, 7.2, 2.5);
      if (has) { g.fillStyle = A.laneColor(lane); g.fill(); g.strokeStyle = A.shade(A.laneInfo(lane).dark, -0.4); g.lineWidth = 1; g.stroke(); glyph(g, lane, cx, cy, 5.5, '#fff', 3.4); }
      else { g.fillStyle = 'rgba(80,50,10,0.22)'; g.fill(); }
    }
    if (pending) {
      // acta pendiente: post-its y bocadillo rojo
      g.strokeStyle = 'rgba(90,50,20,0.45)'; g.lineWidth = 1.6; A.circle(g, 10, 7, 5); g.stroke();
      [[-13, -3, '#ffe066', -0.25], [12, -6, '#ff8fab', 0.3]].forEach(function (p) {
        g.save(); g.translate(p[0], p[1]); g.rotate(p[3]);
        g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(-4.5, -3.5, 10, 10);
        g.fillStyle = p[2]; g.fillRect(-5, -5, 10, 10);
        g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(-5, -5, 10, 2.5);
        g.fillStyle = '#c8102e'; g.fillRect(-2.6, -1.5, 1.6, 4.5); g.fillRect(1, -1.5, 1.6, 4.5); g.fillRect(-2.6, 4, 1.6, 1.4); g.fillRect(1, 4, 1.6, 1.4);
        g.restore();
      });
      g.save(); g.translate(17, -16);
      A.rr(g, -7, -5.5, 14, 10, 3.5); g.fillStyle = '#ff3b4f'; g.fill(); g.strokeStyle = '#5a0010'; g.lineWidth = 1.4; g.stroke();
      g.beginPath(); g.moveTo(-3, 4.5); g.lineTo(-5, 8); g.lineTo(0, 4.5); g.fillStyle = '#ff3b4f'; g.fill();
      g.fillStyle = '#fff'; A.circle(g, -3.5, -0.5, 1.1); g.fill(); A.circle(g, 0, -0.5, 1.1); g.fill(); A.circle(g, 3.5, -0.5, 1.1); g.fill();
      g.restore();
    }
    g.restore();
  }
  DRAW.dossier = function (g, it) { folder(g, it, false); };
  DRAW.dossier_minutes = function (g, it) { folder(g, it, true); };

  DRAW.extinguisher = function (g) {
    g.save(); g.translate(24, 25);
    g.strokeStyle = '#1b1a22'; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(4, -15); g.bezierCurveTo(16, -14, 18, 2, 13, 12); g.stroke();
    g.fillStyle = '#2a2a33'; A.rr(g, 10.5, 10, 6, 7, 1.5); g.fill();
    A.rr(g, -9, -13, 18, 33, 8);
    var bg = g.createLinearGradient(-9, 0, 9, 0);
    bg.addColorStop(0, '#a5101e'); bg.addColorStop(0.35, '#ff4a4a'); bg.addColorStop(0.55, '#e8222e'); bg.addColorStop(1, '#7a0a14');
    g.fillStyle = bg; g.fill(); g.strokeStyle = '#3a0008'; g.lineWidth = 2; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.55)'; A.rr(g, -6, -9, 2.5, 22, 1.2); g.fill();
    // etiqueta con pictograma de llama
    A.rr(g, -8, -2, 16, 12, 1.5); g.fillStyle = '#fff8e8'; g.fill(); g.strokeStyle = '#3a0008'; g.lineWidth = 0.8; g.stroke();
    g.beginPath(); g.moveTo(0, 8); g.bezierCurveTo(-5, 7, -4, 2, -1, -0.5); g.bezierCurveTo(-0.5, 2, 1, 2, 1.5, 0); g.bezierCurveTo(4, 2, 4, 7, 0, 8);
    g.fillStyle = '#ff7a1f'; g.fill();
    g.strokeStyle = '#c8102e'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-5, 8.5); g.lineTo(5, -1); g.stroke();
    A.rr(g, -4.5, -18, 9, 6, 2); g.fillStyle = '#2a2a33'; g.fill();
    g.fillStyle = '#c9ced8'; A.rr(g, -9, -21, 15, 3.5, 1.5); g.fill(); g.strokeStyle = '#1b1a22'; g.lineWidth = 1; g.stroke();
    g.fillStyle = '#ffcc1f'; A.circle(g, 2, -15, 1.6); g.fill();
    g.restore();
  };

  function kindOf(it) { var k = ALIAS[it.kind] || it.kind; return DRAW[k] ? k : 'brief'; }
  function spriteFor(it) {
    var kind = kindOf(it);
    var cont = (kind === 'dossier' || kind === 'dossier_minutes') ? normLanes(it.contents).join(',') : '';
    var lane = A.laneId ? A.laneId(it.lane) : it.lane;
    var k = kind + '|' + (lane || '') + '|' + cont;
    if (cache[k]) return cache[k];
    var c = A.canvas(S * RES, S * RES), g = c.getContext('2d');
    g.scale(RES, RES);
    try { DRAW[kind](g, { kind: kind, lane: lane, contents: it.contents }); } catch (e) { if (window.console) console.warn('item', kind, e); }
    return (cache[k] = c);
  }
  A.itemKind = kindOf;

  A.drawItem = function (ctx, item, cx, cy, scale, t) {
    if (!item) return;
    if (typeof item === 'string') item = { kind: item };
    cx = A.num(cx, 0); cy = A.num(cy, 0); scale = A.num(scale, 1); t = A.num(t, 0);
    var sz = 46 * scale, kind = kindOf(item);
    if (!item.noShadow) A.shadow(ctx, cx, cy + sz * 0.38, sz * 0.36, sz * 0.1, 0.35);
    var bob = kind === 'approved' ? Math.sin(t * 3) * 0.8 * scale : 0;
    ctx.drawImage(spriteFor(item), cx - sz / 2, cy - sz / 2 + bob, sz, sz);
    if (kind === 'printout') {
      // hojas calentitas: ondas de calor
      ctx.save(); ctx.strokeStyle = 'rgba(255,170,90,0.55)'; ctx.lineWidth = 1.3 * scale; ctx.lineCap = 'round';
      for (var w = 0; w < 3; w++) {
        var q = (t * 0.9 + w / 3) % 1, wx = cx + (w - 1) * sz * 0.18, wy = cy - sz * 0.3 - q * sz * 0.35;
        ctx.globalAlpha = Math.sin(q * PI) * 0.8;
        ctx.beginPath(); ctx.moveTo(wx, wy + 4 * scale);
        ctx.quadraticCurveTo(wx + 2.5 * scale, wy + 2 * scale, wx, wy); ctx.quadraticCurveTo(wx - 2.5 * scale, wy - 2 * scale, wx, wy - 4 * scale); ctx.stroke();
      }
      ctx.restore();
    }
    if (kind === 'approved') {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < 3; i++) {
        var a2 = t * 1.6 + i * TAU / 3, r = sz * 0.44;
        var sx = cx + Math.cos(a2) * r, sy = cy - sz * 0.05 + Math.sin(a2) * r * 0.45, ss = (1.3 + Math.sin(t * 6 + i * 2)) * scale * 1.15;
        ctx.fillStyle = 'rgba(180,255,210,0.9)';
        ctx.beginPath(); ctx.moveTo(sx, sy - ss * 2); ctx.lineTo(sx + ss * 0.5, sy - ss * 0.5); ctx.lineTo(sx + ss * 2, sy); ctx.lineTo(sx + ss * 0.5, sy + ss * 0.5);
        ctx.lineTo(sx, sy + ss * 2); ctx.lineTo(sx - ss * 0.5, sy + ss * 0.5); ctx.lineTo(sx - ss * 2, sy); ctx.lineTo(sx - ss * 0.5, sy - ss * 0.5); ctx.fill();
      }
      ctx.restore();
    }
    if (kind === 'burnt') {
      var smoke = A.blob('#3a3438');
      for (var j = 0; j < 4; j++) {
        var p = (t * 0.6 + j / 4) % 1, r2 = (4 + p * 9) * scale;
        ctx.globalAlpha = (1 - p) * 0.55;
        ctx.drawImage(smoke, cx + Math.sin(p * 6 + j) * 4 * scale - r2, cy - sz * 0.3 - p * sz * 0.8 - r2, r2 * 2, r2 * 2);
      }
      ctx.globalAlpha = 1;
      A.glow(ctx, cx, cy, sz * 0.4, '#ff6a1f', 0.12 + 0.08 * Math.sin(t * 9));
    }
    if (kind === 'dossier_minutes') {
      var pulse = (t * 2) % 1;
      if (pulse < 0.5) A.glow(ctx, cx + sz * 0.37, cy - sz * 0.33, sz * 0.18, '#ff3b4f', 0.4 * Math.sin(pulse * 2 * PI));
    }
  };

  A._initItems = function () {
    ['brief', 'draft', 'printout', 'approved', 'burnt'].forEach(function (k) {
      order().forEach(function (l) { spriteFor({ kind: k, lane: l }); });
    });
    spriteFor({ kind: 'dossier', contents: [] }); spriteFor({ kind: 'dossier_minutes', contents: [] }); spriteFor({ kind: 'extinguisher' });
  };
})(window.OW);
