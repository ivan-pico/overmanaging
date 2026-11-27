/* OVERMANAGING — js/art/ui.js (agente ART)
 * drawOrderCard (tarjeta de agenda), drawIcon, drawLogo, drawMenuBackground, drawPanel, drawButton. */
window.OW = window.OW || {};
(function (OW) {
  'use strict';
  var A = OW.Art = OW.Art || {};
  var PI = Math.PI, TAU = PI * 2;
  var OUT = '#1d1530';
  var LOGO_FONT = '"Arial Black", "Trebuchet MS", "Segoe UI", "Ubuntu", system-ui, sans-serif';

  function star5(g, x, y, r, inner, rot) {
    g.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = (rot || 0) + i * PI / 5 - PI / 2, rr = i % 2 ? r * (inner || 0.48) : r;
      g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.closePath();
  }

  /* ============================================================ ICONOS */
  var ICONS = {};
  function laneIcon(lane) {
    return function (g) {
      var L = A.laneInfo(lane);
      A.rr(g, -14, -13, 28, 28, 8); g.fillStyle = A.shade(L.dark, -0.4); g.fill();
      A.rr(g, -14, -14, 28, 27, 8);
      var gr = g.createLinearGradient(0, -14, 0, 13); gr.addColorStop(0, A.shade(L.color, 0.3)); gr.addColorStop(1, L.color);
      g.fillStyle = gr; g.fill(); g.strokeStyle = A.shade(L.dark, -0.5); g.lineWidth = 2; g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.3)'; A.rr(g, -11, -12, 22, 6, 3); g.fill();
      A.drawLaneGlyph(g, lane, 0, 0, 19, '#fff', 3.2);
    };
  }
  ICONS.budget = laneIcon('budget'); ICONS.plan = laneIcon('plan'); ICONS.report = laneIcon('report');
  ICONS.front = ICONS.plan; ICONS.back = ICONS.report; ICONS.data = ICONS.budget; // alias antiguos
  ICONS.calendar = function (g) {
    A.rr(g, -14, -11, 28, 27, 5); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fill();
    A.rr(g, -14, -13, 28, 27, 5); g.fillStyle = '#ffffff'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke();
    g.save(); A.rr(g, -14, -13, 28, 27, 5); g.clip(); g.fillStyle = '#e0302e'; g.fillRect(-14, -13, 28, 8); g.restore();
    g.strokeStyle = OUT; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-14, -5); g.lineTo(14, -5); g.stroke();
    [-7, 7].forEach(function (x) { A.rr(g, x - 2, -17, 4, 7, 1.5); g.fillStyle = '#5d667c'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.2; g.stroke(); });
    g.fillStyle = '#b9bdcc';
    for (var r = 0; r < 3; r++) for (var c = 0; c < 4; c++) g.fillRect(-10.5 + c * 6, -1.5 + r * 4.6, 3.6, 3);
    g.fillStyle = '#4da3ff'; g.fillRect(-4.5, 3.1, 3.6, 3);
    g.strokeStyle = '#e0302e'; g.lineWidth = 1.4; A.circle(g, -2.7, 4.6, 3.6); g.stroke();
  };
  ICONS.phone = function (g) {
    A.circle(g, 0, 1.5, 14); g.fillStyle = '#137a76'; g.fill();
    A.circle(g, 0, 0, 14); var gr = g.createLinearGradient(0, -14, 0, 14); gr.addColorStop(0, '#5ff0ea'); gr.addColorStop(1, '#21c7c1');
    g.fillStyle = gr; g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke();
    g.save(); g.rotate(-0.6);
    g.beginPath(); g.moveTo(-9, -3); g.quadraticCurveTo(0, -9, 9, -3); g.lineTo(9, 1); g.lineTo(5, 2); g.lineTo(4, -1); g.quadraticCurveTo(0, -3, -4, -1); g.lineTo(-5, 2); g.lineTo(-9, 1); g.closePath();
    g.fillStyle = '#fff'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.6; g.lineJoin = 'round'; g.stroke();
    g.restore();
    g.strokeStyle = '#fff'; g.lineWidth = 1.8; g.lineCap = 'round';
    g.beginPath(); g.arc(1, 2, 7, PI * 0.15, PI * 0.45); g.stroke(); g.beginPath(); g.arc(1, 2, 10.5, PI * 0.15, PI * 0.45); g.stroke();
  };
  function face(g, x, y, r, skin, hair, shirt) {
    g.beginPath(); g.arc(x, y + r * 1.9, r * 1.25, PI, TAU); g.closePath(); g.fillStyle = shirt; g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.6; g.stroke();
    A.circle(g, x, y, r); g.fillStyle = skin; g.fill(); g.stroke();
    g.save(); A.circle(g, x, y, r); g.clip(); g.fillStyle = hair; g.fillRect(x - r, y - r, r * 2, r * 0.75); g.restore();
    A.circle(g, x, y, r); g.stroke();
    g.fillStyle = OUT; A.circle(g, x - r * 0.35, y + r * 0.1, r * 0.13); g.fill(); A.circle(g, x + r * 0.35, y + r * 0.1, r * 0.13); g.fill();
    g.strokeStyle = OUT; g.lineWidth = 1.1; g.beginPath(); g.arc(x, y + r * 0.3, r * 0.35, PI * 0.2, PI * 0.8); g.stroke();
  }
  ICONS.one2one = function (g) {
    face(g, -7, -2, 7, '#f6cfae', '#3b2417', '#4da3ff');
    face(g, 7, -2, 7, '#8d5a3b', '#1d1622', '#ffb02e');
    A.rr(g, -6, -18, 12, 8, 3); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.3; g.stroke();
    g.fillStyle = '#7a7594'; A.circle(g, -3, -14, 1); g.fill(); A.circle(g, 0, -14, 1); g.fill(); A.circle(g, 3, -14, 1); g.fill();
  };
  ICONS.mail = function (g) {
    A.rr(g, -15, -9, 30, 22, 3); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fill();
    A.rr(g, -15, -11, 30, 22, 3); g.fillStyle = '#ffffff'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke();
    g.strokeStyle = '#4da3ff'; g.lineWidth = 2; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-13, -9); g.lineTo(0, 2); g.lineTo(13, -9); g.stroke();
    g.strokeStyle = '#b9bdcc'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-13, 9); g.lineTo(-4, 0); g.moveTo(13, 9); g.lineTo(4, 0); g.stroke();
    A.circle(g, 12, -11, 5.5); g.fillStyle = '#ff3b4f'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.4; g.stroke();
    g.fillStyle = '#fff'; g.fillRect(11.1, -14, 1.8, 4); g.fillRect(11.1, -9, 1.8, 1.6);
  };
  ICONS.globe = function (g) {
    A.circle(g, 0, 1.5, 14); g.fillStyle = '#1d5fb8'; g.fill();
    A.circle(g, 0, 0, 14); var gr = g.createRadialGradient(-4, -5, 2, 0, 0, 15); gr.addColorStop(0, '#8fd0ff'); gr.addColorStop(1, '#2f7fd6');
    g.fillStyle = gr; g.fill();
    g.save(); A.circle(g, 0, 0, 14); g.clip();
    g.fillStyle = '#3ddc84';
    g.beginPath(); g.moveTo(-10, -9); g.quadraticCurveTo(-2, -13, 2, -7); g.quadraticCurveTo(-1, -2, -6, -1); g.quadraticCurveTo(-11, -3, -10, -9); g.fill();
    g.beginPath(); g.moveTo(2, 1); g.quadraticCurveTo(10, -2, 12, 4); g.quadraticCurveTo(8, 12, 3, 9); g.quadraticCurveTo(0, 5, 2, 1); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.2;
    g.beginPath(); g.ellipse(0, 0, 6, 14, 0, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(-14, 0); g.lineTo(14, 0); g.moveTo(-12, -7); g.lineTo(12, -7); g.moveTo(-12, 7); g.lineTo(12, 7); g.stroke();
    g.restore();
    A.circle(g, 0, 0, 14); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.5)'; A.ell(g, -5, -7, 4, 2); g.fill();
  };
  ICONS.dossier = function (g) { if (A.drawItem) A.drawItem(g, { kind: 'dossier', contents: ['budget', 'plan', 'report'], noShadow: true }, 0, 0, 0.75, 0); };
  ICONS.printer = function (g) {
    A.rr(g, -9, -15, 18, 10, 1.5); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.6; g.stroke();
    A.rr(g, -14, -7, 28, 15, 4); g.fillStyle = '#c9cfda'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke();
    A.rr(g, -9, 3, 18, 12, 1.5); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.6; g.stroke();
    g.fillStyle = '#b9bdcc'; g.fillRect(-6, 7, 12, 1.4); g.fillRect(-6, 10, 8, 1.4);
    g.fillStyle = '#3ddc84'; A.circle(g, 9, -2, 1.8); g.fill();
  };
  ICONS.stamp = function (g) {
    A.rr(g, -12, 7, 24, 6, 2); g.fillStyle = '#c8102e'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke();
    A.rr(g, -8, -1, 16, 9, 2); g.fillStyle = '#a8744a'; g.fill(); g.stroke();
    g.fillStyle = '#7a4a2a'; g.fillRect(-2.5, -9, 5, 9);
    A.circle(g, 0, -12, 6); g.fillStyle = '#e0302e'; g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.5)'; A.circle(g, -2, -14, 2); g.fill();
  };
  ICONS.coffee = function (g) {
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 2; g.lineCap = 'round';
    [-4, 2].forEach(function (x) { g.beginPath(); g.moveTo(x, -6); g.bezierCurveTo(x - 3, -9, x + 3, -11, x, -15); g.stroke(); });
    g.strokeStyle = OUT; g.lineWidth = 3.5; g.beginPath(); g.arc(9, 4, 4.5, -PI / 2, PI / 2); g.stroke();
    g.strokeStyle = '#fff'; g.lineWidth = 1.8; g.stroke();
    A.rr(g, -10, -4, 19, 17, 4); var gr = g.createLinearGradient(-10, 0, 9, 0); gr.addColorStop(0, '#ff7b6b'); gr.addColorStop(1, '#d6304e');
    g.fillStyle = gr; g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke();
    A.ell(g, -0.5, -3.5, 9, 2.4); g.fillStyle = '#5a2a10'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.4)'; A.rr(g, -7.5, 0, 3, 9, 1.5); g.fill();
  };
  ICONS.star = function (g) {
    star5(g, 0, 1.5, 15); g.fillStyle = '#b86a00'; g.fill();
    star5(g, 0, 0, 15); var gr = g.createLinearGradient(0, -15, 0, 13); gr.addColorStop(0, '#fff3a0'); gr.addColorStop(0.5, '#ffd23f'); gr.addColorStop(1, '#ff9a1f');
    g.fillStyle = gr; g.fill(); g.strokeStyle = '#6a3a00'; g.lineWidth = 2; g.lineJoin = 'round'; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.6)'; A.ell(g, -4, -5, 3.5, 2); g.fill();
  };
  ICONS.star_empty = function (g) {
    star5(g, 0, 0, 15); g.fillStyle = 'rgba(20,14,40,0.55)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; g.lineJoin = 'round'; g.stroke();
    star5(g, 0, 0, 10); g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1.2; g.stroke();
  };
  ICONS.clock = function (g) {
    A.circle(g, 0, 1, 14); g.fillStyle = '#a3132a'; g.fill();
    A.circle(g, 0, 0, 14); g.fillStyle = '#ff4f6d'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke();
    A.circle(g, 0, 0, 10.5); g.fillStyle = '#fffdf6'; g.fill();
    g.strokeStyle = OUT; g.lineWidth = 2.2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -7); g.moveTo(0, 0); g.lineTo(5, 2); g.stroke();
    g.fillStyle = OUT; A.circle(g, 0, 0, 1.6); g.fill();
    g.fillStyle = '#ffd23f'; A.rr(g, -4, -19, 8, 4, 1.5); g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.5; g.stroke();
  };
  ICONS.coin = function (g) {
    A.circle(g, 0, 1.5, 14); g.fillStyle = '#9a6a00'; g.fill();
    A.circle(g, 0, 0, 14); var gr = g.createRadialGradient(-4, -5, 1, 0, 0, 15); gr.addColorStop(0, '#fff0a0'); gr.addColorStop(1, '#f2a900');
    g.fillStyle = gr; g.fill(); g.strokeStyle = '#6a4200'; g.lineWidth = 2; g.stroke();
    A.circle(g, 0, 0, 10); g.strokeStyle = 'rgba(140,90,0,0.5)'; g.lineWidth = 1.4; g.stroke();
    g.font = 'bold 15px ' + A.FONT; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#9a6a00'; g.fillText('\u20ac', 0, 1.5); g.fillStyle = '#fff6c8'; g.fillText('\u20ac', -0.5, 0.5);
  };
  ICONS.bug = function (g) {
    g.save(); g.translate(0, 4); g.scale(0.9, 0.9); A.drawBug(g, { x: 0, y: 0, angle: 0, phase: 1, variant: 'mail' }, 0.3); g.restore();
  };
  ICONS.fire = function (g) {
    var lay = [['#d0201a', 1], ['#ff7a1f', 0.75], ['#ffe27a', 0.45]];
    lay.forEach(function (l, i) {
      var s = l[1];
      g.beginPath(); g.moveTo(0, 14);
      g.bezierCurveTo(-13 * s, 12, -13 * s, -2 * s, -4 * s, -8 * s);
      g.bezierCurveTo(-4 * s, -2, 1, -4, 0, -15 * s - (i ? 0 : 2));
      g.bezierCurveTo(9 * s, -8 * s, 14 * s, 2, 11 * s, 9);
      g.quadraticCurveTo(7 * s, 14, 0, 14);
      g.fillStyle = l[0]; g.fill();
      if (!i) { g.strokeStyle = '#5a0a00'; g.lineWidth = 2; g.stroke(); }
    });
  };
  ICONS.rocket = function (g) {
    g.save(); g.rotate(0.6);
    g.beginPath(); g.moveTo(-5, 8); g.lineTo(-11, 15); g.lineTo(-4, 13); g.closePath(); g.fillStyle = '#ff4f6d'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.5; g.stroke();
    g.beginPath(); g.moveTo(5, 8); g.lineTo(11, 15); g.lineTo(4, 13); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(0, -17); g.bezierCurveTo(9, -9, 8, 6, 6, 13); g.lineTo(-6, 13); g.bezierCurveTo(-8, 6, -9, -9, 0, -17); g.closePath();
    var gr = g.createLinearGradient(-8, 0, 8, 0); gr.addColorStop(0, '#d8dde8'); gr.addColorStop(0.4, '#fff'); gr.addColorStop(1, '#8a92a6');
    g.fillStyle = gr; g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke();
    A.circle(g, 0, -3, 3.6); g.fillStyle = '#4da3ff'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.5; g.stroke();
    g.beginPath(); g.moveTo(-4, 14); g.quadraticCurveTo(0, 24, 4, 14); g.fillStyle = '#ffb02e'; g.fill();
    g.restore();
  };
  ICONS.key = function (g) {
    g.save(); g.rotate(-0.6);
    g.strokeStyle = OUT; g.lineWidth = 6.5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-2, 0); g.lineTo(15, 0); g.moveTo(10, 0); g.lineTo(10, 6); g.moveTo(14, 0); g.lineTo(14, 5); g.stroke();
    g.strokeStyle = '#ffc233'; g.lineWidth = 3.5; g.stroke();
    A.circle(g, -7, 0, 8); g.fillStyle = '#ffc233'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke();
    A.circle(g, -7, 0, 3); g.fillStyle = OUT; g.fill();
    g.fillStyle = 'rgba(255,255,255,0.55)'; A.ell(g, -9, -4, 3, 1.5); g.fill();
    g.restore();
  };
  ICONS.unknown = function (g) {
    A.circle(g, 0, 0, 13); g.fillStyle = '#5d667c'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke();
    g.font = 'bold 16px ' + A.FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('?', 0, 1);
  };

  var iconCache = {};
  A.drawIcon = function (ctx, name, cx, cy, size) {
    size = A.num(size, 24); cx = A.num(cx, 0); cy = A.num(cy, 0);
    if (!ICONS[name]) name = 'unknown';
    var px = Math.max(8, Math.min(256, Math.round(size * 2 / 8) * 8));
    var k = name + '|' + px, c = iconCache[k];
    if (!c) {
      c = A.canvas(px, px); var g = c.getContext('2d');
      g.translate(px / 2, px / 2); g.scale(px / 40, px / 40);
      try { ICONS[name](g); } catch (e) { }
      iconCache[k] = c;
    }
    var d = size * 1.25;
    ctx.drawImage(c, cx - d / 2, cy - d / 2, d, d);
  };

  /* ============================================================ PANELES */
  var noisePat = null;
  function noise(ctx) {
    if (noisePat) return noisePat;
    var c = A.canvas(96, 96), g = c.getContext('2d'), R = A.rng(9);
    for (var i = 0; i < 900; i++) { g.fillStyle = R() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'; g.fillRect(R() * 96, R() * 96, 1.2, 1.2); }
    noisePat = ctx.createPattern(c, 'repeat');
    return noisePat;
  }

  A.drawPanel = function (ctx, x, y, w, h, opts) {
    var o = opts || {}; x = A.num(x, 0); y = A.num(y, 0); w = A.num(w, 100); h = A.num(h, 60);
    var r = A.num(o.radius, 16), tint = o.color || '#2a2152', a = A.num(o.alpha, 0.78);
    ctx.save();
    if (!o.noShadow) {
      ctx.fillStyle = 'rgba(5,2,15,0.35)'; A.rr(ctx, x + 4, y + 8, w, h, r); ctx.fill();
      ctx.fillStyle = 'rgba(5,2,15,0.18)'; A.rr(ctx, x + 2, y + 14, w + 4, h, r + 4); ctx.fill();
    }
    A.rr(ctx, x, y, w, h, r);
    var gr = ctx.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, A.rgba(A.shade(tint, 0.18), a)); gr.addColorStop(1, A.rgba(A.shade(tint, -0.25), a));
    ctx.fillStyle = gr; ctx.fill();
    ctx.fillStyle = noise(ctx); ctx.fill();
    ctx.save(); A.rr(ctx, x, y, w, h, r); ctx.clip();
    // reflejo diagonal de vidrio
    var sh = ctx.createLinearGradient(x, y, x + w * 0.6, y + h);
    sh.addColorStop(0, 'rgba(255,255,255,0.16)'); sh.addColorStop(0.35, 'rgba(255,255,255,0.03)'); sh.addColorStop(0.36, 'rgba(255,255,255,0)');
    ctx.fillStyle = sh; ctx.fillRect(x, y, w, h);
    if (o.title) {
      var th = A.num(o.titleHeight, 40);
      var tg = ctx.createLinearGradient(x, y, x + w, y);
      var ac = o.accent || '#ff4f6d';
      tg.addColorStop(0, A.rgba(ac, 0.9)); tg.addColorStop(1, A.rgba(A.shade(ac, -0.3), 0.75));
      ctx.fillStyle = tg; ctx.fillRect(x, y, w, th);
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x, y, w, 2);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x, y + th, w, 2);
      ['#ff5f57', '#febc2e', '#28c840'].forEach(function (c, i) { ctx.fillStyle = c; A.circle(ctx, x + 18 + i * 14, y + th / 2, 4.5); ctx.fill(); });
      A.drawText(ctx, o.title, x + w / 2, y + th / 2 + 1, { size: A.num(o.titleSize, 20), color: '#fff' });
    }
    ctx.restore();
    // bordes
    A.rr(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1.5; ctx.stroke();
    A.rr(ctx, x - 1, y - 1, w + 2, h + 2, r + 1);
    ctx.strokeStyle = 'rgba(8,4,20,0.65)'; ctx.lineWidth = 1.5; ctx.stroke();
    if (o.glow) {
      ctx.globalCompositeOperation = 'lighter';
      A.rr(ctx, x - 2, y - 2, w + 4, h + 4, r + 2);
      ctx.strokeStyle = A.rgba(o.glow === true ? '#7a5cff' : o.glow, 0.35); ctx.lineWidth = 5; ctx.stroke();
    }
    ctx.restore();
  };

  A.drawButton = function (ctx, x, y, w, h, label, focused, t) {
    x = A.num(x, 0); y = A.num(y, 0); w = A.num(w, 200); h = A.num(h, 48); t = A.num(t, 0);
    var r = h / 2, cx = x + w / 2, cy = y + h / 2;
    var pulse = focused ? 1 + 0.035 * Math.sin(t * 6) : 1;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(pulse, pulse); ctx.translate(-cx, -cy);
    // sombra / base 3D
    ctx.fillStyle = 'rgba(5,2,15,0.45)'; A.rr(ctx, x + 2, y + 6, w, h, r); ctx.fill();
    A.rr(ctx, x, y + 4, w, h, r); ctx.fillStyle = focused ? '#8a1a3a' : '#1a1438'; ctx.fill();
    A.rr(ctx, x, y, w, h, r);
    var gr = ctx.createLinearGradient(0, y, 0, y + h);
    if (focused) { gr.addColorStop(0, '#ffb36b'); gr.addColorStop(0.5, '#ff6b5a'); gr.addColorStop(1, '#e0306a'); }
    else { gr.addColorStop(0, 'rgba(90,76,160,0.85)'); gr.addColorStop(1, 'rgba(46,36,98,0.85)'); }
    ctx.fillStyle = gr; ctx.fill();
    ctx.strokeStyle = focused ? '#fff2d8' : 'rgba(255,255,255,0.28)'; ctx.lineWidth = focused ? 2.5 : 1.5; ctx.stroke();
    // brillo superior
    ctx.save(); A.rr(ctx, x, y, w, h, r); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,' + (focused ? 0.28 : 0.12) + ')'; A.rr(ctx, x + 6, y + 3, w - 12, h * 0.38, h * 0.19); ctx.fill();
    if (focused) {
      var sx = x - 60 + ((t * 0.7) % 1.6) * (w + 120) / 1.6;
      ctx.globalCompositeOperation = 'lighter';
      var sg = ctx.createLinearGradient(sx - 30, 0, sx + 30, 0);
      sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.45)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(sx - 20, y); ctx.lineTo(sx + 40, y); ctx.lineTo(sx + 20, y + h); ctx.lineTo(sx - 40, y + h); ctx.fill();
    }
    ctx.restore();
    if (focused) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      A.rr(ctx, x - 3, y - 3, w + 6, h + 6, r + 3); ctx.strokeStyle = 'rgba(255,140,100,' + (0.35 + 0.2 * Math.sin(t * 6)) + ')'; ctx.lineWidth = 6; ctx.stroke();
      ctx.restore();
      // flechitas
      var ax = 14 + Math.sin(t * 8) * 4;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(x + ax, cy - 6); ctx.lineTo(x + ax + 8, cy); ctx.lineTo(x + ax, cy + 6); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + w - ax, cy - 6); ctx.lineTo(x + w - ax - 8, cy); ctx.lineTo(x + w - ax, cy + 6); ctx.fill();
    }
    var fs = Math.min(h * 0.44, 24);
    ctx.font = 'bold ' + fs + 'px ' + A.FONT;
    var lbl = String(label == null ? '' : label);
    while (ctx.measureText(lbl).width > w - 50 && fs > 9) { fs -= 1; ctx.font = 'bold ' + fs + 'px ' + A.FONT; }
    A.drawText(ctx, lbl, cx, cy + 1, { size: fs, color: focused ? '#ffffff' : '#e6e0ff', outline: focused ? '#8a1a3a' : null, outlineWidth: 3 });
    ctx.restore();
  };

  /* ====================================================== TARJETA DE AGENDA */
  function fmtTime(sec) {
    sec = Math.max(0, Math.ceil(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function orderName(order) {
    var n = null;
    try {
      if (order.nameKey && OW.t) { n = OW.t(order.nameKey, order.nameParams || {}); if (n === order.nameKey) n = null; }
    } catch (e) { n = null; }
    if (n == null) { try { n = order.name; } catch (e2) { n = null; } }
    return String(n || '');
  }
  function targetName(order) {
    var tg = order.target;
    if (order.nameParams && order.nameParams.name) return String(order.nameParams.name);
    if (tg && typeof tg === 'object' && tg.name) return String(tg.name);
    if (typeof tg === 'string') return tg;
    return '';
  }
  function wrap2(ctx, text, maxW) {
    var words = text.split(' '), l1 = '', i = 0;
    for (; i < words.length; i++) {
      var tst = l1 ? l1 + ' ' + words[i] : words[i];
      if (ctx.measureText(tst).width > maxW && l1) break;
      l1 = tst;
    }
    var l2 = words.slice(i).join(' ');
    return l2 ? [l1, l2] : [l1];
  }

  /* order: { kind 'dossier'|'call'|'one2one', lanes, nameKey, nameParams, name, timeLeft|time, timeTotal|maxTime,
   *          target, flash 0..1, entering 0..1 }  opts: { compact, highlight } */
  A.drawOrderCard = function (ctx, order, x, y, w, h, t, opts) {
    order = order || {}; opts = opts || {}; x = A.num(x, 0); y = A.num(y, 0); w = A.num(w, 180); h = A.num(h, 100); t = A.num(t, 0);
    var lanes = (Array.isArray(order.lanes) ? order.lanes : []).map(function (l) { return A.laneId ? A.laneId(l) : l; });
    var kind = order.kind || (lanes.length ? 'dossier' : 'dossier');
    var tl = order.timeLeft != null ? order.timeLeft : order.time, tt = order.timeTotal != null ? order.timeTotal : order.maxTime;
    var total = Math.max(0.001, A.num(tt, 60)), left = A.clamp(A.num(tl, total), 0, total);
    var ratio = left / total, flash = A.clamp(A.num(order.flash, 0), 0, 1), ent = A.clamp(A.num(order.entering, 1), 0, 1);
    var urgent = ratio < 0.25;
    var kc = kind === 'call' ? '#21c7c1' : kind === 'one2one' ? '#a66cff' : '#e0302e';
    ctx.save();
    var e = A.easeOutBack(ent), dy = (1 - e) * -(h + 40);
    var shake = urgent ? Math.sin(t * 40) * (1 - ratio / 0.25) * 1.6 : 0;
    ctx.globalAlpha *= Math.min(1, ent * 2);
    ctx.translate(x + w / 2 + shake, y + h / 2 + dy);
    ctx.rotate((1 - ent) * -0.25 + (urgent ? Math.sin(t * 22) * 0.01 : 0));
    ctx.translate(-w / 2, -h / 2);
    ctx.fillStyle = 'rgba(5,2,15,0.4)'; A.rr(ctx, 3, 6, w, h, 8); ctx.fill();
    // hoja de calendario
    A.rr(ctx, 0, 0, w, h, 8);
    var bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, '#eeebe4');
    ctx.fillStyle = bg; ctx.fill();
    var hh = Math.max(14, Math.round(h * 0.2));
    ctx.save(); A.rr(ctx, 0, 0, w, h, 8); ctx.clip();
    var hg = ctx.createLinearGradient(0, 0, 0, hh); hg.addColorStop(0, A.shade(kc, 0.15)); hg.addColorStop(1, A.shade(kc, -0.15));
    ctx.fillStyle = hg; ctx.fillRect(0, 0, w, hh);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(0, 0, w, 1.5);
    // líneas de cuaderno
    ctx.strokeStyle = 'rgba(77,163,255,0.12)'; ctx.lineWidth = 1;
    for (var ly = hh + 10; ly < h; ly += 10) { ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(w, ly); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = urgent ? A.rgba('#ff3b4f', 0.6 + 0.4 * Math.sin(t * 12)) : '#2a2250'; ctx.lineWidth = urgent ? 3 : 2;
    A.rr(ctx, 0, 0, w, h, 8); ctx.stroke();
    // anillas
    [0.25, 0.75].forEach(function (u) {
      A.rr(ctx, w * u - 2.5, -5, 5, 10, 2); ctx.fillStyle = '#c9ced8'; ctx.fill(); ctx.strokeStyle = '#2a2250'; ctx.lineWidth = 1.2; ctx.stroke();
    });
    var pad = Math.max(6, w * 0.045);
    // hora límite (tiempo restante) en la cabecera
    var hfs = Math.round(hh * 0.68);
    ctx.font = 'bold ' + hfs + 'px ' + A.MONO; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    var tstr = fmtTime(left);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillText(tstr, pad + hh * 0.8 + 1, hh / 2 + 1.5);
    ctx.fillStyle = '#fff'; ctx.fillText(tstr, pad + hh * 0.8, hh / 2 + 0.5);
    // reloj mini
    ctx.save(); ctx.translate(pad + hh * 0.32, hh / 2);
    A.circle(ctx, 0, 0, hh * 0.3); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -hh * 0.2); ctx.moveTo(0, 0); ctx.lineTo(hh * 0.15, 0); ctx.stroke();
    ctx.restore();
    // prioridad (chevrons)
    ctx.save(); ctx.translate(w - pad - 6, hh / 2 + 2);
    ctx.strokeStyle = urgent ? '#ffe27a' : '#fff'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var lv = urgent ? 3 : ratio < 0.5 ? 2 : 1;
    for (var c = 0; c < lv; c++) { ctx.beginPath(); ctx.moveTo(-4.5, 2 - c * 3.6); ctx.lineTo(0, -2.5 - c * 3.6); ctx.lineTo(4.5, 2 - c * 3.6); ctx.stroke(); }
    ctx.restore();
    // icono por tipo
    var barH = Math.max(6, h * 0.08), barY = h - pad - barH;
    var bodyTop = hh + 4, bodyH = barY - 4 - bodyTop;
    var isz = Math.min(bodyH * 0.92, w * 0.3);
    var icx = pad + isz / 2, icy = bodyTop + bodyH / 2;
    if (kind === 'call') {
      var ring = (t * 1.2) % 1 < 0.5 ? Math.sin(t * 50) * 0.12 : 0;
      ctx.save(); ctx.translate(icx, icy); ctx.rotate(ring); A.drawIcon(ctx, 'phone', 0, 0, isz * 0.8); ctx.restore();
    } else if (kind === 'one2one') {
      A.drawIcon(ctx, 'one2one', icx, icy, isz * 0.82);
    } else {
      // carpeta con chips de los carriles requeridos
      if (A.drawItem) A.drawItem(ctx, { kind: 'dossier', contents: lanes, noShadow: true }, icx, icy, isz / 44, t);
    }
    // nombre
    var tx = pad + isz + pad * 0.8, tw = w - tx - pad;
    var name = orderName(order);
    var chipsH = 0;
    if (kind === 'dossier' && lanes.length) chipsH = Math.max(12, Math.min(20, bodyH * 0.34));
    if (kind === 'one2one' && targetName(order)) chipsH = Math.max(12, Math.min(18, bodyH * 0.32));
    var nameArea = bodyH - (chipsH ? chipsH + 3 : 0);
    var fs = Math.max(9, Math.min(16, h * 0.15));
    ctx.font = 'bold ' + fs + 'px ' + A.FONT;
    var lines = wrap2(ctx, name, tw);
    while ((lines.length * fs * 1.1 > nameArea || lines.some(function (l) { return ctx.measureText(l).width > tw; })) && fs > 7) {
      fs -= 0.5; ctx.font = 'bold ' + fs + 'px ' + A.FONT; lines = wrap2(ctx, name, tw);
    }
    ctx.fillStyle = '#1d1530'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    var ny = bodyTop + (nameArea - lines.length * fs * 1.1) / 2 + fs * 0.55;
    lines.forEach(function (l, i) { ctx.fillText(l, tx, ny + i * fs * 1.1); });
    // chips de carriles o nombre de la persona
    var chipY = bodyTop + bodyH - chipsH;
    if (kind === 'dossier' && lanes.length) {
      var gap = 3, cw = Math.min((tw - gap * (lanes.length - 1)) / lanes.length, chipsH * 3.6);
      var showLabel = cw > chipsH * 3.0;
      for (var j = 0; j < lanes.length; j++) {
        var L = A.laneInfo(lanes[j]), cx0 = tx + j * (cw + gap);
        A.rr(ctx, cx0, chipY + 1.5, cw, chipsH, chipsH / 2); ctx.fillStyle = A.shade(L.dark, -0.3); ctx.fill();
        A.rr(ctx, cx0, chipY, cw, chipsH, chipsH / 2); ctx.fillStyle = L.color; ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; A.rr(ctx, cx0 + 3, chipY + 1.5, cw - 6, chipsH * 0.3, chipsH * 0.15); ctx.fill();
        var gx = showLabel ? cx0 + chipsH * 0.62 : cx0 + cw / 2;
        A.drawLaneGlyph(ctx, lanes[j], gx, chipY + chipsH / 2, chipsH * 0.66, '#fff', 3.4);
        if (showLabel) {
          var lf = Math.round(chipsH * 0.5), nm = L.name;
          ctx.font = 'bold ' + lf + 'px ' + A.FONT;
          while (ctx.measureText(nm).width > cw - chipsH * 1.3 && nm.length > 3) nm = nm.slice(0, -1);
          if (nm !== L.name) nm = nm.slice(0, -1) + '.';
          ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText(nm, cx0 + chipsH * 1.15, chipY + chipsH / 2 + 0.5);
        }
      }
    } else if (kind === 'one2one' && chipsH) {
      var tn = targetName(order);
      ctx.font = 'bold ' + Math.round(chipsH * 0.62) + 'px ' + A.FONT;
      var nw = Math.min(tw, ctx.measureText(tn).width + chipsH * 1.4);
      A.rr(ctx, tx, chipY, nw, chipsH, chipsH / 2); ctx.fillStyle = '#efe6ff'; ctx.fill(); ctx.strokeStyle = '#a66cff'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#a66cff'; A.circle(ctx, tx + chipsH / 2, chipY + chipsH / 2, chipsH * 0.3); ctx.fill();
      ctx.fillStyle = '#3a2070'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(tn, tx + chipsH * 1.0, chipY + chipsH / 2 + 0.5);
    }
    // barra de tiempo
    var bx = pad, bw = w - pad * 2;
    A.rr(ctx, bx, barY, bw, barH, barH / 2); ctx.fillStyle = '#d9d5e4'; ctx.fill();
    ctx.strokeStyle = 'rgba(30,20,60,0.35)'; ctx.lineWidth = 1; ctx.stroke();
    var col = ratio > 0.5 ? A.mix('#ffd23f', '#3ddc84', (ratio - 0.5) * 2) : A.mix('#ff3b4f', '#ffd23f', ratio * 2);
    if (ratio > 0) {
      A.rr(ctx, bx, barY, Math.max(barH, bw * ratio), barH, barH / 2);
      var tg = ctx.createLinearGradient(0, barY, 0, barY + barH); tg.addColorStop(0, A.shade(col, 0.3)); tg.addColorStop(1, A.shade(col, -0.15));
      ctx.fillStyle = tg; ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; A.rr(ctx, bx + 2, barY + 1, Math.max(0, bw * ratio - 4), barH * 0.3, barH * 0.15); ctx.fill();
    }
    if (opts.highlight) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      A.rr(ctx, -3, -3, w + 6, h + 6, 10); ctx.strokeStyle = A.rgba('#7dd3ff', 0.5 + 0.3 * Math.sin(t * 6)); ctx.lineWidth = 4; ctx.stroke();
      ctx.restore();
    }
    if (flash > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      A.rr(ctx, 0, 0, w, h, 8); ctx.fillStyle = A.rgba(left <= 0 ? '#ff3b4f' : '#ffe27a', 0.18 * flash); ctx.fill();
      A.rr(ctx, -6, -6, w + 12, h + 12, 14); ctx.strokeStyle = A.rgba(left <= 0 ? '#ff3b4f' : '#ffd23f', 0.5 * flash); ctx.lineWidth = 8; ctx.stroke();
      A.rr(ctx, -3, -3, w + 6, h + 6, 11); ctx.strokeStyle = A.rgba(left <= 0 ? '#ff3b4f' : '#fff2a0', flash); ctx.lineWidth = 4; ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  };

  /* ================================================================ LOGO */
  var logoCache = {};
  var PAL_OVER = ['#fff3a8', '#ffb02e', '#ff4f4f'];
  var PAL_MAN = ['#e0fbff', '#4dc3ff', '#3a7bff'];
  function letterSprite(ch, size, pal) {
    var font = '900 ' + size + 'px ' + LOGO_FONT;
    var mc = A.canvas(4, 4).getContext('2d'); mc.font = font;
    var lw = Math.ceil(mc.measureText(ch).width), pad = Math.ceil(size * 0.25), depth = Math.ceil(size * 0.12);
    var W = lw + pad * 2, H = Math.ceil(size * 1.25) + pad * 2 + depth;
    var c = A.canvas(W, H), g = c.getContext('2d');
    g.font = font; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    var bx = pad, by = pad + size * 0.95;
    var L = A.canvas(W, H), lg = L.getContext('2d');
    lg.font = font; lg.textBaseline = 'alphabetic';
    var gr = lg.createLinearGradient(0, by - size * 0.75, 0, by);
    gr.addColorStop(0, pal[0]); gr.addColorStop(0.5, pal[1]); gr.addColorStop(1, pal[2]);
    lg.fillStyle = gr; lg.fillText(ch, bx, by);
    lg.globalCompositeOperation = 'source-atop';
    lg.fillStyle = 'rgba(255,255,255,0.45)';
    lg.beginPath(); lg.ellipse(bx + lw * 0.45, by - size * 0.62, lw * 0.75, size * 0.2, -0.1, 0, TAU); lg.fill();
    lg.fillStyle = 'rgba(0,0,0,0.12)'; lg.fillRect(0, by - size * 0.18, W, size * 0.2);
    g.lineJoin = 'round';
    for (var d = depth; d >= 1; d--) {
      g.fillStyle = d === depth ? '#0a0f26' : A.mix('#141c40', '#2a3a7a', 1 - d / depth);
      g.strokeStyle = g.fillStyle; g.lineWidth = size * 0.16;
      g.strokeText(ch, bx, by + d); g.fillText(ch, bx, by + d);
    }
    g.strokeStyle = '#0d1430'; g.lineWidth = size * 0.16; g.strokeText(ch, bx, by);
    g.drawImage(L, 0, 0);
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = Math.max(1, size * 0.025);
    g.save(); g.beginPath(); g.rect(0, 0, W, by - size * 0.45); g.clip(); g.strokeText(ch, bx, by); g.restore();
    return { c: c, w: lw, pad: pad, by: by, H: H };
  }
  function getLogo(scale) {
    var q = Math.max(0.2, Math.round(scale * 20) / 20), k = String(q);
    if (logoCache[k]) return logoCache[k];
    var size = Math.round(74 * q), word = 'OVERMANAGING', letters = [];
    for (var i = 0; i < word.length; i++) letters.push(letterSprite(word[i], size, i < 4 ? PAL_OVER : PAL_MAN));
    var spacing = -size * 0.02, total = 0;
    letters.forEach(function (l) { total += l.w + spacing; });
    return (logoCache[k] = { letters: letters, total: total - spacing, size: size, spacing: spacing, q: q });
  }

  /* drawLogo(ctx, cx, cy, scale, t, opts) — opts.noSubtitle para omitir el lema (que va por OW.t('art.logo_sub')) */
  A.drawLogo = function (ctx, cx, cy, scale, t, opts) {
    cx = A.num(cx, 640); cy = A.num(cy, 200); scale = A.num(scale, 1); t = A.num(t, 0); opts = opts || {};
    var L = getLogo(scale), sz = L.size, k = scale / L.q;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
    var x = -L.total / 2;
    ctx.rotate(-0.035);
    A.glow(ctx, 0, -sz * 0.3, sz * 3.2, '#ff7b3a', 0.16 + 0.05 * Math.sin(t * 2));
    A.glow(ctx, sz * 1.2, -sz * 0.3, sz * 2.4, '#4d7bff', 0.16);
    // diagrama de Gantt detrás de las letras
    var gx0 = -L.total / 2 - sz * 0.2, gw = L.total + sz * 0.4;
    ctx.fillStyle = 'rgba(10,15,40,0.6)'; A.rr(ctx, gx0 - sz * 0.15 + 6, -sz * 1.02 + 12, gw + sz * 0.3, sz * 1.22, sz * 0.22); ctx.fill();
    var bars = [[0.02, 0.3, '#ffb02e'], [0.22, 0.38, '#4da3ff'], [0.5, 0.46, '#3ddc84']];
    bars.forEach(function (b, i) {
      var grow = A.clamp((t * 0.6 - i * 0.25) % 3, 0, 1);
      ctx.globalAlpha = 0.35; ctx.fillStyle = b[2];
      A.rr(ctx, gx0 + gw * b[0], -sz * 0.92 + i * sz * 0.36, gw * b[1] * (0.3 + 0.7 * grow), sz * 0.22, sz * 0.11); ctx.fill();
    });
    ctx.globalAlpha = 1;
    for (var i = 0; i < L.letters.length; i++) {
      var l = L.letters[i];
      var hop = Math.pow(Math.max(0, Math.sin(t * 2.2 - i * 0.45)), 12) * sz * 0.16;
      var wave = Math.sin(t * 2.5 + i * 0.55) * sz * 0.03;
      var rot = Math.sin(t * 1.7 + i * 0.9) * 0.035;
      ctx.save();
      ctx.translate(x + l.w / 2, -hop + wave);
      ctx.rotate(rot);
      var sq = 1 + hop / sz * 0.6;
      ctx.scale(1 / Math.sqrt(sq), sq);
      ctx.drawImage(l.c, -l.w / 2 - l.pad, -l.by, l.c.width, l.c.height);
      ctx.restore();
      x += l.w + L.spacing;
    }
    // hoja de calendario con ✔ sobre la "O"
    var o0 = L.letters[0], mx = -L.total / 2 + o0.w * 0.45, my = -sz * 1.0;
    ctx.save(); ctx.translate(mx, my + Math.sin(t * 2.5) * sz * 0.02); ctx.rotate(-0.2 + Math.sin(t * 1.5) * 0.05);
    var m = sz / 80 * 1.25; ctx.scale(m, m);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; A.rr(ctx, -15, -14, 34, 34, 6); ctx.fill();
    A.rr(ctx, -18, -18, 34, 34, 6); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#0d1430'; ctx.lineWidth = 3; ctx.stroke();
    ctx.save(); A.rr(ctx, -18, -18, 34, 34, 6); ctx.clip(); ctx.fillStyle = '#e0302e'; ctx.fillRect(-18, -18, 34, 10); ctx.restore();
    [-9, 7].forEach(function (rx) { A.rr(ctx, rx - 2.5, -23, 5, 10, 2); ctx.fillStyle = '#5d667c'; ctx.fill(); ctx.strokeStyle = '#0d1430'; ctx.lineWidth = 1.5; ctx.stroke(); });
    var ck = A.clamp(((t * 0.8) % 2) * 1.6, 0, 1);
    ctx.strokeStyle = '#21b866'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-9, 2); ctx.lineTo(-9 + 5 * Math.min(1, ck * 2), 2 + 5 * Math.min(1, ck * 2));
    if (ck > 0.5) ctx.lineTo(-4 + 12 * (ck - 0.5) * 2, 7 - 13 * (ck - 0.5) * 2);
    ctx.stroke();
    ctx.restore();
    // corbata colgando de la última letra
    var tx = L.total / 2 - L.letters[L.letters.length - 1].w * 0.4, tyy = -sz * 0.05;
    ctx.save(); ctx.translate(tx, tyy); ctx.rotate(Math.sin(t * 2.2) * 0.12); var ts = sz / 80;
    ctx.scale(ts, ts);
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.lineTo(3, 6); ctx.lineTo(-3, 6); ctx.closePath();
    ctx.fillStyle = '#ff4f6d'; ctx.fill(); ctx.strokeStyle = '#0d1430'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-3, 6); ctx.lineTo(3, 6); ctx.lineTo(7, 34); ctx.lineTo(0, 42); ctx.lineTo(-7, 34); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, 16); ctx.lineTo(4, 12); ctx.moveTo(-5, 26); ctx.lineTo(5, 21); ctx.stroke();
    ctx.restore();
    // post-its pegados
    if (A._postit) {
      A._postit(ctx, L.total / 2 + sz * 0.15, -sz * 0.95, sz * 0.3, '#ffe066', 0.25 + Math.sin(t * 1.3) * 0.04, 2);
      A._postit(ctx, -L.total / 2 - sz * 0.1, -sz * 0.15, sz * 0.24, '#9ee6ff', -0.3 + Math.sin(t * 1.1) * 0.04, 2);
    }
    // lema
    if (!opts.noSubtitle) {
      var sub = OW.t ? OW.t('art.logo_sub') : 'art.logo_sub';
      if (sub === 'art.logo_sub') sub = "co-op d'oficina contra rellotge";
      ctx.font = 'bold ' + Math.round(sz * 0.24) + 'px ' + A.FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var sw2 = ctx.measureText(sub).width + sz * 0.6;
      ctx.save(); ctx.translate(0, sz * 0.52); ctx.rotate(0.02);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-sw2 / 2 + 3, -sz * 0.2 + 4, sw2, sz * 0.4);
      ctx.fillStyle = '#ffe066'; ctx.fillRect(-sw2 / 2, -sz * 0.2, sw2, sz * 0.4);
      ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(-sw2 / 2, -sz * 0.2, sw2, sz * 0.08);
      ctx.fillStyle = 'rgba(230,220,160,0.85)'; ctx.fillRect(-sz * 0.3, -sz * 0.27, sz * 0.6, sz * 0.12);
      ctx.fillStyle = '#2a2250'; ctx.fillText(sub, 0, 1);
      ctx.restore();
    }
    ctx.restore();
  };

  /* ===================================================== FONDO DE MENÚ */
  var menu = null;
  function buildMenu() {
    var R = A.rng(2024), cols = [], strips = [];
    var CH = ['€', '%', '✔', '@', '!', '#', '1', '2', '3', '4', ':', '+', '↑', '→', 'Q', 'KPI', 'OK', '9:00', '%'];
    for (var s = 0; s < 6; s++) {
      var c = A.canvas(30, 760), g = c.getContext('2d');
      g.font = 'bold 13px ' + A.MONO; g.textAlign = 'center'; g.textBaseline = 'top';
      for (var y = 0; y < 760; y += 21) {
        var a = 0.25 + R() * 0.75;
        g.fillStyle = 'rgba(140,200,255,' + (a * 0.7) + ')';
        if (R() < 0.15) g.fillStyle = 'rgba(255,210,120,' + a + ')';
        g.fillText(CH[(R() * CH.length) | 0], 15, y);
      }
      strips.push(c);
    }
    for (var i = 0; i < 40; i++) cols.push({ x: i * 32 + R() * 10, sp: 20 + R() * 45, off: R() * 760, s: (R() * 6) | 0, a: 0.08 + R() * 0.16 });
    var floats = [];
    var LC = ['#ffb02e', '#4da3ff', '#3ddc84'];
    for (var f = 0; f < 12; f++) {
      var kind = f % 4, w, h, cc, gg;
      if (kind === 0) { // ventana con diagrama de Gantt
        w = 170 + R() * 90; h = 96 + R() * 50; cc = A.canvas(w + 12, h + 12); gg = cc.getContext('2d'); gg.translate(4, 4);
        gg.fillStyle = 'rgba(0,0,0,0.35)'; A.rr(gg, 4, 6, w, h, 10); gg.fill();
        A.rr(gg, 0, 0, w, h, 10); gg.fillStyle = '#f4f6fb'; gg.fill(); gg.strokeStyle = 'rgba(255,255,255,0.5)'; gg.lineWidth = 1.5; gg.stroke();
        gg.save(); A.rr(gg, 0, 0, w, h, 10); gg.clip(); gg.fillStyle = '#2a3a7a'; gg.fillRect(0, 0, w, 16); gg.restore();
        ['#ff5f57', '#febc2e', '#28c840'].forEach(function (c2, k) { gg.fillStyle = c2; A.circle(gg, 10 + k * 10, 8, 3); gg.fill(); });
        gg.strokeStyle = 'rgba(40,60,120,0.12)'; gg.lineWidth = 1;
        for (var gx = 40; gx < w; gx += 22) { gg.beginPath(); gg.moveTo(gx, 18); gg.lineTo(gx, h - 4); gg.stroke(); }
        var rows = Math.floor((h - 26) / 12), st = 0;
        for (var rw = 0; rw < rows; rw++) {
          gg.fillStyle = '#b9bdcc'; gg.fillRect(6, 24 + rw * 12, 26, 4);
          var bl = 30 + R() * 60; gg.fillStyle = LC[(R() * 3) | 0];
          A.rr(gg, 40 + st, 22 + rw * 12, Math.min(bl, w - 48 - st), 8, 3); gg.fill();
          st = Math.min(w - 90, st + bl * (0.4 + R() * 0.5));
        }
      } else if (kind === 1) { // tarjeta de agenda/calendario
        w = 110; h = 100; cc = A.canvas(w + 12, h + 12); gg = cc.getContext('2d'); gg.translate(4, 4);
        gg.fillStyle = 'rgba(0,0,0,0.3)'; A.rr(gg, 4, 6, w, h, 8); gg.fill();
        A.rr(gg, 0, 0, w, h, 8); gg.fillStyle = '#fff'; gg.fill();
        gg.save(); A.rr(gg, 0, 0, w, h, 8); gg.clip(); gg.fillStyle = '#e0302e'; gg.fillRect(0, 0, w, 22); gg.restore();
        gg.fillStyle = '#c9ced8';
        for (var r2 = 0; r2 < 4; r2++) for (var c3 = 0; c3 < 5; c3++) gg.fillRect(10 + c3 * 19, 30 + r2 * 16, 13, 10);
        gg.strokeStyle = '#21b866'; gg.lineWidth = 3; gg.lineCap = 'round';
        var px = 10 + ((R() * 5) | 0) * 19, py = 30 + ((R() * 4) | 0) * 16;
        gg.beginPath(); gg.moveTo(px + 1, py + 5); gg.lineTo(px + 5, py + 9); gg.lineTo(px + 13, py); gg.stroke();
      } else if (kind === 2) { // post-it
        w = 70; h = 70; cc = A.canvas(w + 12, h + 12); gg = cc.getContext('2d'); gg.translate(4, 4);
        var pc = ['#ffe066', '#ff9ec7', '#9ee6ff', '#b8ff9e'][(R() * 4) | 0];
        gg.fillStyle = 'rgba(0,0,0,0.3)'; gg.fillRect(4, 6, w, h);
        gg.fillStyle = pc; gg.fillRect(0, 0, w, h); gg.fillStyle = 'rgba(0,0,0,0.1)'; gg.fillRect(0, 0, w, 12);
        gg.font = 'bold 16px ' + A.FONT; gg.fillStyle = '#3a2a50'; gg.textAlign = 'center';
        var notes = [['KPI', '↑↑'], ['Q4', '€€€'], ['OKR', '✔'], ['ROI', '%'], ['9:00', '@']];
        var nt = notes[f % notes.length];
        gg.fillText(nt[0], w / 2, 36); gg.fillText(nt[1], w / 2, 56);
      } else {
        w = 60; h = 60; cc = A.canvas(w + 12, h + 12); gg = cc.getContext('2d'); gg.translate(w / 2 + 6, h / 2 + 6);
        var ic = ['calendar', 'phone', 'mail', 'one2one', 'budget', 'plan', 'report', 'coffee', 'star'][(R() * 9) | 0];
        A.drawIcon(gg, ic, 0, 0, 40);
      }
      floats.push({ c: cc, x: R() * 1280, y: R() * 900, sp: 10 + R() * 22, rot: (R() - 0.5) * 0.4, rs: 0.2 + R() * 0.5, a: 0.35 + R() * 0.45, z: 0.6 + R() * 0.6, ph: R() * 10 });
    }
    floats.sort(function (a, b) { return a.z - b.z; });
    var base = A.canvas(1280, 720), bg = base.getContext('2d');
    var gr = bg.createLinearGradient(0, 0, 0, 720);
    gr.addColorStop(0, '#0d1633'); gr.addColorStop(0.55, '#1a2556'); gr.addColorStop(1, '#2a1f56');
    bg.fillStyle = gr; bg.fillRect(0, 0, 1280, 720);
    bg.strokeStyle = 'rgba(90,170,255,0.16)'; bg.lineWidth = 1.5;
    for (var gx2 = -12; gx2 <= 12; gx2++) { bg.beginPath(); bg.moveTo(640 + gx2 * 20, 470); bg.lineTo(640 + gx2 * 170, 720); bg.stroke(); }
    var vig = A.canvas(1280, 720), vg = vig.getContext('2d');
    var rg = vg.createRadialGradient(640, 330, 200, 640, 360, 820);
    rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(2,4,15,0.7)');
    vg.fillStyle = rg; vg.fillRect(0, 0, 1280, 720);
    return { cols: cols, strips: strips, floats: floats, base: base, vig: vig };
  }

  A.drawMenuBackground = function (ctx, t) {
    t = A.num(t, 0);
    if (!menu) menu = buildMenu();
    var M = menu;
    ctx.save();
    ctx.drawImage(M.base, 0, 0);
    ctx.strokeStyle = 'rgba(90,170,255,0.18)'; ctx.lineWidth = 1.5;
    for (var i = 0; i < 9; i++) {
      var q = ((i + (t * 0.4) % 1) / 9), yy = 470 + Math.pow(q, 2.2) * 250;
      ctx.globalAlpha = q; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(1280, yy); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    A.glow(ctx, 640 + Math.sin(t * 0.3) * 300, 200 + Math.cos(t * 0.4) * 60, 420, '#ff9a3c', 0.1);
    A.glow(ctx, 640 - Math.sin(t * 0.25) * 340, 380, 460, '#4d7bff', 0.14);
    for (var c = 0; c < M.cols.length; c++) {
      var col = M.cols[c], strip = M.strips[col.s], y = (col.off + t * col.sp) % 760;
      ctx.globalAlpha = col.a;
      ctx.drawImage(strip, col.x, y - 760); ctx.drawImage(strip, col.x, y);
    }
    ctx.globalAlpha = 1;
    for (var f = 0; f < M.floats.length; f++) {
      var F = M.floats[f], span = 720 + 260;
      var fy = ((F.y - t * F.sp * F.z) % span + span) % span - 180;
      var fx = F.x + Math.sin(t * 0.5 + F.ph) * 20;
      ctx.save(); ctx.globalAlpha = F.a; ctx.translate(fx, fy); ctx.rotate(F.rot + Math.sin(t * F.rs + F.ph) * 0.06); ctx.scale(F.z, F.z);
      ctx.drawImage(F.c, -F.c.width / 2, -F.c.height / 2);
      ctx.restore();
    }
    ctx.drawImage(M.vig, 0, 0);
    ctx.restore();
  };

  A._initUI = function () {
    if (!menu) menu = buildMenu();
    getLogo(1);
    Object.keys(ICONS).forEach(function (k) { A.drawIcon(A.canvas(2, 2).getContext('2d'), k, 0, 0, 24); });
  };
})(window.OW);
