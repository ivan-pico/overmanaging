/* OVERMANAGING — js/art/stations.js (agente ART)
 * drawStation + drawRocket (efecto "reunió feta") + glifos de carril.
 * Cada estación = sprite estático prerenderizado (por tipo/tema/variante, a 2x)
 * + capa animada dibujada en vivo (pantallas, LEDs, post-its, NPC...).
 * Tipos: wall, counter, src_budget, src_plan, src_report, desk, printer, approval,
 *   folder_stack, meeting_room, minutes, shredder, coffee, phone, team_desk, plant,
 *   bookshelf, whiteboard, conveyor. Tipo desconocido/antiguo => mesa genérica. */
window.OW = window.OW || {};
(function (OW) {
  'use strict';
  var A = OW.Art = OW.Art || {};
  var PI = Math.PI, TAU = PI * 2;
  var RES = 2, PADX = 10, PADT = 60, SW = 84, SH = 152;
  var cache = {};
  var OUT = '#1d1530';

  /* ----------------------------------------------------- glifos de carril */
  A.drawLaneGlyph = function (g, lane, cx, cy, size, color, lw) {
    var s = size / 20;
    lane = A.laneId ? A.laneId(lane) : lane;
    g.save(); g.translate(cx, cy); g.scale(s, s);
    g.strokeStyle = color || '#fff'; g.fillStyle = color || '#fff';
    g.lineWidth = lw || 3.2; g.lineCap = 'round'; g.lineJoin = 'round';
    if (lane === 'budget') { // €
      g.beginPath(); g.arc(1.5, 0, 7.5, PI * 0.28, PI * 1.72); g.stroke();
      g.lineWidth = (lw || 3.2) * 0.8;
      g.beginPath(); g.moveTo(-9, -2.2); g.lineTo(2, -2.2); g.moveTo(-9, 2.8); g.lineTo(1, 2.8); g.stroke();
    } else if (lane === 'plan') { // barras de Gantt
      g.beginPath(); g.moveTo(-9, -6); g.lineTo(0, -6); g.moveTo(-4, 0); g.lineTo(5, 0); g.moveTo(1, 6); g.lineTo(9, 6); g.stroke();
    } else if (lane === 'report') { // quesito con porción separada
      g.beginPath(); g.moveTo(-1.5, 1.5); g.arc(-1.5, 1.5, 8, 0, PI * 1.5); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(1, -1); g.arc(1, -1, 8, -PI / 2, 0); g.closePath(); g.fill();
    } else {
      g.font = 'bold 16px ' + A.MONO; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 0, 1);
    }
    g.restore();
  };

  /* ------------------------------------------------------- helpers base */
  function dropShadow(g, x, y, w, h, r) {
    g.save(); g.fillStyle = 'rgba(10,5,20,0.28)';
    A.rr(g, x + 4, y + 6, w, h, r); g.fill();
    g.fillStyle = 'rgba(10,5,20,0.12)'; A.rr(g, x + 6, y + 9, w + 2, h, r + 2); g.fill();
    g.restore();
  }

  function counterBase(g, th, top, front) {
    top = top || th.counterTop; front = front || th.counterFront;
    dropShadow(g, 1, 0, 62, 74, 7);
    A.box(g, 1, 0, 62, 58, 16, top, front, { r: 7 });
    var name = th._name;
    g.save(); A.rr(g, 2, 1, 60, 56, 6); g.clip();
    if (name === 'startup') {
      g.strokeStyle = 'rgba(120,70,30,0.22)'; g.lineWidth = 1;
      for (var i = 0; i < 6; i++) { var yy = 6 + i * 9; g.beginPath(); g.moveTo(2, yy); g.bezierCurveTo(20, yy + 2, 40, yy - 2, 62, yy + 1); g.stroke(); }
      g.fillStyle = 'rgba(90,50,20,0.18)'; for (var j = 1; j < 4; j++) g.fillRect(j * 16, 1, 1, 56);
    } else if (name === 'corporate') {
      g.fillStyle = 'rgba(0,0,0,0.04)';
      for (var k = 3; k < 58; k += 6) g.fillRect(2, k, 60, 1);
    } else {
      g.fillStyle = 'rgba(0,0,0,0.035)';
      var R = A.rng((name || 'x').length * 13);
      for (var n = 0; n < 50; n++) g.fillRect(2 + R() * 60, 2 + R() * 54, 1.5, 1.5);
    }
    g.restore();
    if (name === 'coworking') { g.fillStyle = th.accent; g.fillRect(3, 60, 58, 3); }
    else if (name === 'quarterclose') { g.fillStyle = th.accent; g.fillRect(3, 60, 58, 2.5); }
    else if (name === 'consulting') { g.fillStyle = '#2c3650'; g.fillRect(3, 60, 58, 3); }
    else if (name === 'corporate') { g.fillStyle = th.accent; g.globalAlpha = 0.8; g.fillRect(4, 70, 56, 1.5); g.globalAlpha = 1; }
    else if (name === 'startup') { g.fillStyle = 'rgba(40,20,10,0.25)'; for (var q = 1; q < 5; q++) g.fillRect(q * 12.8, 59, 1, 14); }
  }

  /* placa frontal con pictograma (sin texto) */
  function plate(g, cx, cy, w, bg, drawPic) {
    A.rr(g, cx - w / 2, cy - 6, w, 12, 3.5); g.fillStyle = bg; g.fill();
    g.strokeStyle = A.shade(bg, -0.5); g.lineWidth = 1; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(cx - w / 2 + 2, cy - 5, w - 4, 1.5);
    if (drawPic) { g.save(); g.translate(cx, cy); drawPic(g); g.restore(); }
  }
  function picCheck(g, col) {
    g.strokeStyle = col || '#fff'; g.lineWidth = 2; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-4, 0); g.lineTo(-1, 3); g.lineTo(4.5, -3); g.stroke();
  }
  function picFolder(g) {
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-6, -3.5); g.lineTo(-2, -3.5); g.lineTo(-1, -2.5); g.lineTo(6, -2.5); g.lineTo(6, 4); g.lineTo(-6, 4); g.closePath(); g.fill();
  }
  function picCalendar(g) {
    g.fillStyle = '#fff'; g.fillRect(-5.5, -4, 11, 8.5); g.fillStyle = '#e0302e'; g.fillRect(-5.5, -4, 11, 3);
    g.fillStyle = '#555'; g.fillRect(-3.5, 0.5, 2, 1.5); g.fillRect(-0.5, 0.5, 2, 1.5); g.fillRect(2.5, 0.5, 2, 1.5);
  }
  function picPhone(g) {
    g.rotate(-0.6);
    g.strokeStyle = '#fff'; g.lineWidth = 2.6; g.lineCap = 'round';
    g.beginPath(); g.arc(0, 2, 5.5, PI * 1.05, PI * 1.95); g.stroke();
    g.fillStyle = '#fff'; A.rr(g, -7, -1, 4, 4, 1.2); g.fill(); A.rr(g, 3, -1, 4, 4, 1.2); g.fill();
  }
  function picCup(g) {
    g.fillStyle = '#ffe2b8'; A.rr(g, -4.5, -3, 8, 7, 2); g.fill();
    g.strokeStyle = '#ffe2b8'; g.lineWidth = 1.3; g.beginPath(); g.arc(4, 0.5, 2, -PI / 2, PI / 2); g.stroke();
  }
  function picDoc(g) {
    g.fillStyle = '#fff'; g.fillRect(-4, -4.5, 8, 9.5);
    g.fillStyle = '#7a7594'; g.fillRect(-2.5, -2.5, 5, 1); g.fillRect(-2.5, -0.5, 5, 1); g.fillRect(-2.5, 1.5, 3.5, 1);
  }

  function hazardStripes(g, x, y, w, h, c1, c2) {
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = c1 || '#ffcc1f'; g.fillRect(x, y, w, h);
    g.fillStyle = c2 || '#1d1a24';
    for (var i = -h; i < w + h; i += 8) { g.beginPath(); g.moveTo(x + i, y); g.lineTo(x + i + 4, y); g.lineTo(x + i + 4 - h, y + h); g.lineTo(x + i - h, y + h); g.fill(); }
    g.restore();
  }

  function sheet(g, x, y, w, h, rot, head) {
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(-w / 2 + 1, -h / 2 + 1.5, w, h);
    g.fillStyle = '#fdfdf8'; g.fillRect(-w / 2, -h / 2, w, h);
    g.strokeStyle = '#8a90a2'; g.lineWidth = 0.7; g.strokeRect(-w / 2, -h / 2, w, h);
    if (head) { g.fillStyle = head; g.fillRect(-w / 2, -h / 2, w, Math.max(2, h * 0.14)); }
    g.fillStyle = '#b4b9c6';
    for (var yy = -h / 2 + h * 0.28; yy < h / 2 - 2; yy += Math.max(2.2, h * 0.13)) g.fillRect(-w / 2 + 2, yy, w * (0.55 + A.hash(yy * 3.1) * 0.3), 0.9);
    g.restore();
  }

  function postit(g, x, y, s, col, rot) {
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(-s / 2 + 1, -s / 2 + 1.5, s, s);
    g.fillStyle = col; g.fillRect(-s / 2, -s / 2, s, s);
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(-s / 2, -s / 2, s, s * 0.25);
    g.fillStyle = 'rgba(40,30,60,0.4)'; g.fillRect(-s / 2 + s * 0.18, -s / 2 + s * 0.45, s * 0.6, Math.max(0.8, s * 0.09)); g.fillRect(-s / 2 + s * 0.18, -s / 2 + s * 0.68, s * 0.4, Math.max(0.8, s * 0.09));
    g.restore();
  }
  A._stPostit = postit;

  /* --------------------------------------------------- cuerpos estáticos */
  var BODIES = {};

  BODIES.counter = function (g, th, v) {
    counterBase(g, th);
    if (v === 1) {
      postit(g, 11, 11, 13, '#ffe066', -0.15);
    } else if (v === 2) {
      g.strokeStyle = 'rgba(110,60,20,0.25)'; g.lineWidth = 2; A.circle(g, 52, 46, 6); g.stroke();
      g.save(); g.translate(12, 48); g.rotate(0.5);
      g.fillStyle = '#3a6fd8'; A.rr(g, -1.5, -8, 3, 14, 1); g.fill(); g.fillStyle = '#ddd'; g.fillRect(-1.5, 6, 3, 2);
      g.restore();
    } else if (v === 3) { // grapadora
      g.save(); g.translate(50, 12); g.rotate(0.3);
      A.rr(g, -8, -3, 16, 6, 2.5); g.fillStyle = '#d6304e'; g.fill(); g.strokeStyle = '#5a0010'; g.lineWidth = 1; g.stroke();
      g.fillStyle = '#9aa3b4'; g.fillRect(-8, 2, 16, 1.5);
      g.restore();
    }
  };

  /* --- Fuentes de documentos --- */
  BODIES.src_budget = function (g, th) { // archivador de finanzas
    var L = A.laneInfo('budget');
    counterBase(g, th);
    A.shadow(g, 34, 50, 26, 5, 0.4);
    A.box(g, 9, -28, 46, 12, 64, '#e3e6ec', '#aab2c0', { r: 4, outline: '#3a4152' });
    // ranura de salida en la tapa
    A.rr(g, 15, -24, 34, 4, 2); g.fillStyle = '#3a4152'; g.fill();
    for (var d = 0; d < 2; d++) {
      var y0 = -12 + d * 28;
      A.rr(g, 13, y0, 38, 24, 3);
      var dg = g.createLinearGradient(0, y0, 0, y0 + 24); dg.addColorStop(0, '#d3d8e0'); dg.addColorStop(1, '#b3bbc8');
      g.fillStyle = dg; g.fill(); g.strokeStyle = '#4a5163'; g.lineWidth = 1.2; g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(14, y0 + 1, 36, 1.2);
      if (d === 0) {
        A.circle(g, 32, y0 + 10, 8.5); g.fillStyle = L.dark; g.fill();
        A.circle(g, 32, y0 + 9.5, 7.8); g.fillStyle = L.color; g.fill();
        A.drawLaneGlyph(g, 'budget', 32, y0 + 9.5, 11, '#fff', 3.2);
        A.rr(g, 17, y0 + 17, 8, 3, 1.5); g.fillStyle = '#4a5163'; g.fill(); A.rr(g, 39, y0 + 17, 8, 3, 1.5); g.fill();
      } else {
        A.rr(g, 24, y0 + 4, 16, 7, 1.5); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = '#4a5163'; g.lineWidth = 0.8; g.stroke();
        g.fillStyle = L.color; g.fillRect(25.5, y0 + 5.5, 13, 4);
        A.rr(g, 25, y0 + 14, 14, 4, 2); g.fillStyle = '#4a5163'; g.fill();
      }
    }
    // calculadora sobre el mueble
    g.save(); g.translate(52, -2); g.rotate(0.2);
    A.rr(g, -6, -8, 12, 15, 2); g.fillStyle = '#2b2e3d'; g.fill(); g.fillStyle = '#9ee6a0'; g.fillRect(-4.5, -6.5, 9, 3.5);
    g.fillStyle = '#c9ced8'; for (var b = 0; b < 6; b++) g.fillRect(-4.5 + (b % 3) * 3.2, -1.5 + Math.floor(b / 3) * 3.2, 2.2, 2.2);
    g.restore();
  };

  BODIES.src_plan = function (g, th) { // tablero de backlog/kanban
    var L = A.laneInfo('plan');
    counterBase(g, th);
    // patas
    g.fillStyle = '#7d889e'; g.fillRect(12, 10, 3, 30); g.fillRect(49, 10, 3, 30);
    A.ell(g, 13.5, 40, 6, 2); g.fillStyle = '#4a5163'; g.fill(); A.ell(g, 50.5, 40, 6, 2); g.fill();
    A.shadow(g, 32, 40, 26, 4, 0.35);
    // tablero
    A.rr(g, 3, -40, 58, 52, 3); g.fillStyle = '#9aa3b4'; g.fill(); g.strokeStyle = '#3a4152'; g.lineWidth = 1.6; g.stroke();
    A.rr(g, 6, -37, 52, 46, 2); g.fillStyle = '#fbfcff'; g.fill();
    g.fillStyle = L.color; g.fillRect(6, -37, 52, 5);
    g.fillStyle = 'rgba(40,50,80,0.25)'; g.fillRect(23, -31, 1, 38); g.fillRect(40.5, -31, 1, 38);
    var pc = ['#ffe066', '#9ee6ff', '#ff9ec7', '#b8ff9e'];
    [[14, -24], [14, -11], [31, -24], [48, -24], [48, -11], [48, 2]].forEach(function (p, i) { postit(g, p[0] + (i % 2), p[1], 10, pc[i % 4], (A.hash(i) - 0.5) * 0.3); });
    // bandeja de rotuladores
    g.fillStyle = '#7d889e'; g.fillRect(6, 10, 52, 3);
    ['#e0302e', '#2f6fd6', '#3fbf6f'].forEach(function (c, i) { g.fillStyle = c; A.rr(g, 10 + i * 9, 8.5, 7, 2.5, 1); g.fill(); });
    plate(g, 32, 66, 26, L.dark, function (gg) { A.drawLaneGlyph(gg, 'plan', 0, 0, 9, '#fff', 3.4); });
  };

  BODIES.src_report = function (g, th) { // tablero del equipo con gráficas (pantalla)
    var L = A.laneInfo('report');
    counterBase(g, th);
    g.fillStyle = '#2d3142'; A.rr(g, 28, 8, 8, 20, 2); g.fill();
    A.ell(g, 32, 28, 14, 4); g.fillStyle = '#3a3f55'; g.fill(); g.strokeStyle = '#141626'; g.lineWidth = 1.2; g.stroke();
    A.shadow(g, 34, 24, 28, 5, 0.3);
    A.rr(g, 2, -40, 60, 48, 4); g.fillStyle = '#1b1e2c'; g.fill(); g.strokeStyle = '#0a0b14'; g.lineWidth = 2; g.stroke();
    A.rr(g, 5, -37, 54, 41, 2); g.fillStyle = '#0d1a1a'; g.fill();
    g.fillStyle = '#3dff8a'; A.circle(g, 32, 6, 0.9); g.fill();
    // nota adhesiva en el marco
    postit(g, 56, -38, 9, '#ffe066', 0.3);
    plate(g, 32, 66, 26, L.dark, function (gg) { A.drawLaneGlyph(gg, 'report', 0, 0, 9, '#fff', 3.4); });
  };

  /* --- Escritorio con portátil --- */
  BODIES.desk = function (g, th) {
    counterBase(g, th);
    // libreta y boli
    g.save(); g.translate(10, 40); g.rotate(-0.12);
    A.rr(g, -6, -9, 12, 17, 1.5); g.fillStyle = '#2f6fd6'; g.fill(); g.strokeStyle = '#13306a'; g.lineWidth = 1; g.stroke();
    g.fillStyle = '#fff'; g.fillRect(-5, -8, 9, 15); g.fillStyle = '#c4c8d6'; for (var i = 0; i < 4; i++) g.fillRect(-3.5, -5 + i * 3.4, 6, 0.8);
    g.restore();
    g.save(); g.translate(16, 46); g.rotate(0.9); g.fillStyle = '#1b1e2c'; A.rr(g, -1.2, -7, 2.4, 13, 1); g.fill(); g.restore();
    // taza
    A.rr(g, 51, 32, 9, 10, 2.5); g.fillStyle = '#ffffff'; g.fill(); g.strokeStyle = '#4a4f63'; g.lineWidth = 1; g.stroke();
    A.ell(g, 55.5, 32.5, 4, 1.3); g.fillStyle = '#5a3016'; g.fill();
    // base del portátil (teclado)
    A.shadow(g, 33, 40, 24, 4, 0.4);
    g.beginPath(); g.moveTo(14, 22); g.lineTo(50, 22); g.lineTo(53, 42); g.lineTo(11, 42); g.closePath();
    var kg = g.createLinearGradient(0, 22, 0, 42); kg.addColorStop(0, '#d6dbe4'); kg.addColorStop(1, '#aab2c0');
    g.fillStyle = kg; g.fill(); g.strokeStyle = '#3a4152'; g.lineWidth = 1.4; g.stroke();
    g.fillStyle = '#2b2e3d'; g.fillRect(15, 24, 34, 11);
    A.rr(g, 26, 36.5, 12, 4, 1); g.fillStyle = '#c0c7d2'; g.fill();
    // tapa / pantalla
    A.rr(g, 11, -22, 42, 45, 3); g.fillStyle = '#c9ced8'; g.fill(); g.strokeStyle = '#3a4152'; g.lineWidth = 1.6; g.stroke();
    A.rr(g, 14, -19, 36, 38, 1.5); g.fillStyle = '#0c1222'; g.fill();
    g.fillStyle = '#3a4152'; A.circle(g, 32, -20.5, 0.8); g.fill();
  };

  /* --- Impresora de oficina --- */
  BODIES.printer = function (g, th) {
    dropShadow(g, 3, -6, 60, 80, 7);
    // bandeja de salida delantera
    A.box(g, 4, 30, 56, 26, 14, A.shade(th.metal, 0.15), A.shade(th.metal, -0.3), { r: 6 });
    A.rr(g, 9, 33, 46, 20, 4); g.fillStyle = A.shade(th.metal, -0.15); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1; g.stroke();
    // cuerpo
    A.shadow(g, 34, 30, 28, 5, 0.5);
    A.box(g, 6, -34, 52, 16, 48, '#f1f3f7', '#c9cfda', { r: 6, outline: '#4a5163' });
    // escáner (cristal en la tapa)
    A.rr(g, 11, -31, 42, 9, 2); g.fillStyle = '#4a5878'; g.fill();
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(13, -30, 16, 2);
    // panel de control
    A.rr(g, 11, -14, 20, 10, 2); g.fillStyle = '#1b1e2c'; g.fill();
    A.rr(g, 34, -13, 20, 8, 2); g.fillStyle = '#aab2c0'; g.fill();
    // ranura de salida
    A.rr(g, 10, 2, 44, 6, 3); g.fillStyle = '#2b2e3d'; g.fill();
    // cajón de papel
    g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(9, 16, 46, 1.2);
    A.rr(g, 25, 19, 14, 3.5, 1.5); g.fillStyle = '#7d889e'; g.fill();
    g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(9, -16, 3, 40);
  };

  /* --- Mesa de firmas --- */
  BODIES.approval = function (g, th) {
    counterBase(g, th);
    // vade de piel
    A.rr(g, 5, 8, 40, 40, 4); g.fillStyle = '#2f6f4f'; g.fill(); g.strokeStyle = '#173d2a'; g.lineWidth = 1.4; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 1; A.rr(g, 8, 11, 34, 34, 3); g.stroke();
    // tampón
    A.rr(g, 47, 30, 14, 10, 2.5); g.fillStyle = '#3a3f52'; g.fill(); g.strokeStyle = '#151924'; g.lineWidth = 1; g.stroke();
    A.rr(g, 49, 32, 10, 6, 1.5); g.fillStyle = '#c8102e'; g.fill();
    // portalápices
    A.rr(g, 48, 4, 11, 13, 3); g.fillStyle = '#c9ced8'; g.fill(); g.strokeStyle = '#4a5163'; g.stroke();
    ['#2f6fd6', '#1b1e2c', '#e0302e'].forEach(function (c, i) { g.fillStyle = c; g.fillRect(50 + i * 3, -6 + i, 2, 12); });
    plate(g, 32, 66, 26, '#2f8f5f', function (gg) { picCheck(gg); });
  };

  /* --- Pila de dossiers --- */
  BODIES.folder_stack = function (g, th) {
    counterBase(g, th);
    A.shadow(g, 32, 50, 26, 5, 0.35);
    A.box(g, 7, 8, 50, 36, 8, '#c7d0de', '#6d7a94', { r: 5, outline: '#2a3246' });
    A.rr(g, 11, 11, 42, 30, 3); g.fillStyle = '#b3bdcf'; g.fill();
    g.strokeStyle = 'rgba(40,50,80,0.3)'; g.lineWidth = 1;
    for (var x = 15; x < 53; x += 6) { g.beginPath(); g.moveTo(x, 12); g.lineTo(x, 40); g.stroke(); }
    plate(g, 32, 66, 26, '#6a4bc4', picFolder);
  };

  /* --- Sala de reuniones (v=1: unida con la de arriba) --- */
  BODIES.meeting_room = function (g, th, v) {
    var join = v === 1;
    dropShadow(g, 1, 2, 62, 72, 8);
    A.box(g, 1, join ? -14 : 2, 62, join ? 70 : 56, 16, '#6d7fa3', '#3d4a68', { r: join ? 2 : 8, outline: '#1a2034' });
    // moqueta
    g.save(); A.rr(g, 3, join ? -12 : 4, 58, join ? 66 : 52, 6); g.clip();
    g.fillStyle = 'rgba(255,255,255,0.04)';
    for (var yy = -14; yy < 60; yy += 4) g.fillRect(3, yy, 58, 1.5);
    g.restore();
    // paredes de cristal laterales
    g.fillStyle = 'rgba(190,230,255,0.35)'; g.fillRect(1, join ? -14 : 2, 4, join ? 72 : 56); g.fillRect(59, join ? -14 : 2, 4, join ? 72 : 56);
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(2, join ? -14 : 2, 1, join ? 72 : 56); g.fillRect(60, join ? -14 : 2, 1, join ? 72 : 56);
    // sillas
    function chair(x, y, side) {
      A.rr(g, x - 5, y - 5, 10, 10, 3); g.fillStyle = '#2b2e3d'; g.fill(); g.strokeStyle = '#0e1018'; g.lineWidth = 1; g.stroke();
      g.fillStyle = '#454a5f'; if (side) g.fillRect(x + side * 4 - 1, y - 5, 2.5, 10); else g.fillRect(x - 5, y - 5, 10, 2.5);
    }
    chair(10, 16, -1); chair(10, 38, -1); chair(54, 16, 1); chair(54, 38, 1);
    if (!join) chair(32, 6, 0);
    // mesa
    var ty = join ? -18 : 9, th2 = join ? 70 : 43;
    A.shadow(g, 33, 34, 20, 18, 0.3);
    A.rr(g, 14, ty, 36, th2, join ? 3 : 7);
    var tg = g.createLinearGradient(14, 0, 50, 0); tg.addColorStop(0, '#d29a68'); tg.addColorStop(0.5, '#ebc08e'); tg.addColorStop(1, '#b8804e');
    g.fillStyle = tg; g.fill(); g.strokeStyle = '#4a2a14'; g.lineWidth = 1.6; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.2)'; g.lineWidth = 1; g.beginPath(); g.moveTo(19, ty + 4); g.lineTo(19, ty + th2 - 4); g.stroke();
    // papeles en la mesa
    sheet(g, 23, 44, 8, 10, -0.2); sheet(g, 42, 16, 8, 10, 0.25);
    // placa frontal con calendario
    plate(g, 32, 66, 28, '#1a2034', picCalendar);
  };

  /* --- Archivo de actas --- */
  BODIES.minutes = function (g, th) {
    counterBase(g, th);
    // bandeja de dos pisos
    A.box(g, 5, 14, 40, 30, 8, '#e9d9b0', '#a8875a', { r: 3, outline: '#4a3414' });
    g.fillStyle = 'rgba(80,50,20,0.2)'; g.fillRect(8, 28, 34, 1.5);
    // archivador de anillas de pie
    A.rr(g, 48, -10, 12, 46, 2); g.fillStyle = '#2f6fd6'; g.fill(); g.strokeStyle = '#13306a'; g.lineWidth = 1.2; g.stroke();
    A.rr(g, 50, -4, 8, 12, 1); g.fillStyle = '#fff'; g.fill();
    A.circle(g, 54, 24, 2.6); g.fillStyle = '#13306a'; g.fill();
    plate(g, 32, 66, 26, '#8a6a2a', picDoc);
  };

  /* --- Destructora --- */
  BODIES.shredder = function (g, th) {
    A.shadow(g, 34, 64, 24, 7, 0.5);
    // papelera
    g.beginPath(); g.moveTo(12, 20); g.lineTo(52, 20); g.lineTo(49, 66); g.quadraticCurveTo(32, 70, 15, 66); g.closePath();
    var bg = g.createLinearGradient(12, 0, 52, 0);
    bg.addColorStop(0, '#3a3f52'); bg.addColorStop(0.35, '#5d6478'); bg.addColorStop(1, '#252836');
    g.fillStyle = bg; g.fill(); g.strokeStyle = '#11131c'; g.lineWidth = 2; g.stroke();
    // ventana con tiras
    A.rr(g, 19, 32, 26, 26, 3); g.fillStyle = 'rgba(180,220,255,0.25)'; g.fill(); g.strokeStyle = '#11131c'; g.lineWidth = 1.2; g.stroke();
    g.save(); A.rr(g, 19, 32, 26, 26, 3); g.clip();
    var R = A.rng(5);
    for (var i = 0; i < 26; i++) { g.fillStyle = R() < 0.5 ? '#f4f4ef' : '#e2e5ec'; g.fillRect(19 + R() * 26, 42 + R() * 16, 1.4, 4 + R() * 6); }
    g.restore();
    g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(21, 33, 3, 24);
    // cabezal
    A.box(g, 8, 4, 48, 14, 8, '#454a5f', '#2b2e3d', { r: 4, outline: '#0e1018' });
    A.rr(g, 14, 9, 36, 3.5, 1.5); g.fillStyle = '#0a0b10'; g.fill();
    A.rr(g, 42, 19.5, 10, 4, 2); g.fillStyle = '#1b1e2c'; g.fill();
  };

  /* --- Cafetera --- */
  BODIES.coffee = function (g, th) {
    counterBase(g, th);
    g.save(); g.translate(55, 30);
    g.beginPath(); g.moveTo(-6, -10); g.lineTo(6, -10); g.lineTo(8, 12); g.lineTo(-8, 12); g.closePath();
    g.fillStyle = '#8a5a34'; g.fill(); g.strokeStyle = '#3e2410'; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = '#f2e2c4'; g.fillRect(-5, -1, 10, 7);
    g.fillStyle = '#5a3016'; A.ell(g, 0, 2.5, 2.5, 1.6); g.fill();
    g.restore();
    A.shadow(g, 30, 40, 26, 6, 0.45);
    A.box(g, 5, -26, 42, 12, 50, '#e4e8ef', '#c0242e', { r: 6, outline: '#4a0c12' });
    g.fillStyle = 'rgba(255,255,255,0.25)'; A.rr(g, 8, -12, 4, 44, 2); g.fill();
    [[16, -22], [27, -22]].forEach(function (p) {
      A.rr(g, p[0] - 4, p[1] - 3, 8, 6, 2); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = '#7a8090'; g.lineWidth = 0.8; g.stroke();
    });
    A.circle(g, 37, -4, 6.5); g.fillStyle = '#e4e8ef'; g.fill(); g.strokeStyle = '#4a0c12'; g.lineWidth = 1.5; g.stroke();
    A.circle(g, 37, -4, 5); g.fillStyle = '#fffdf5'; g.fill();
    g.strokeStyle = '#e0302e'; g.lineWidth = 1; g.beginPath(); g.arc(37, -4, 4, PI * 0.1, PI * 0.45); g.stroke();
    A.rr(g, 13, 2, 20, 8, 3); g.fillStyle = '#2a2d3a'; g.fill();
    A.rr(g, 16, 9, 14, 5, 2); g.fillStyle = '#9aa3b4'; g.fill(); g.strokeStyle = '#2a2d3a'; g.lineWidth = 1; g.stroke();
    g.save(); g.translate(16, 11); g.rotate(0.25);
    A.rr(g, -15, -2.5, 15, 5, 2.5); g.fillStyle = '#1b1e2a'; g.fill();
    g.restore();
    A.rr(g, 10, 30, 26, 5, 2); g.fillStyle = '#9aa3b4'; g.fill(); g.strokeStyle = '#2a2d3a'; g.stroke();
    g.fillStyle = 'rgba(0,0,0,0.3)'; for (var i = 0; i < 6; i++) g.fillRect(12 + i * 4, 31.5, 2, 2);
    A.rr(g, 17, 20, 12, 10, 3); g.fillStyle = '#ffffff'; g.fill(); g.strokeStyle = '#4a4f63'; g.lineWidth = 1; g.stroke();
    g.beginPath(); g.arc(29.5, 25, 3, -PI / 2, PI / 2); g.stroke();
    A.ell(g, 23, 20.5, 5.5, 1.6); g.fillStyle = '#4a2410'; g.fill();
    g.strokeStyle = '#c9ced8'; g.lineWidth = 2.5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(42, 4); g.lineTo(42, 18); g.quadraticCurveTo(42, 22, 39, 23); g.stroke();
    g.lineCap = 'butt';
    plate(g, 26, 66, 24, '#4a2410', picCup);
  };

  /* --- Teléfono de sobremesa --- */
  BODIES.phone = function (g, th) {
    counterBase(g, th);
    // agenda de papel al lado
    g.save(); g.translate(52, 44); g.rotate(0.15);
    A.rr(g, -7, -8, 14, 16, 2); g.fillStyle = '#8a2a3a'; g.fill(); g.fillStyle = '#fff'; g.fillRect(-5.5, -6.5, 10, 13);
    g.fillStyle = '#e0302e'; g.fillRect(-5.5, -6.5, 10, 3); g.restore();
    A.shadow(g, 30, 40, 24, 5, 0.45);
    A.box(g, 8, 8, 42, 26, 10, '#454a5f', '#2b2e3d', { r: 6, outline: '#0e1018' });
    // cuna del auricular
    A.rr(g, 11, 11, 15, 20, 4); g.fillStyle = '#20232f'; g.fill();
    // teclado
    for (var r = 0; r < 4; r++) for (var c = 0; c < 3; c++) { A.rr(g, 30 + c * 5.6, 17 + r * 4, 4.2, 3, 1); g.fillStyle = '#c9ced8'; g.fill(); }
    // pantalla LCD
    A.rr(g, 30, 11, 16, 4.5, 1); g.fillStyle = '#7fbf9a'; g.fill();
    plate(g, 32, 66, 26, '#2b2e3d', picPhone);
  };

  /* --- Escritorio del equipo (one-to-one). Dos capas: respaldo de la silla y escritorio --- */
  BODIES.team_desk_back = function (g, th) {
    // respaldo de silla de oficina
    A.shadow(g, 30, 8, 18, 5, 0.3);
    A.rr(g, 12, -34, 30, 40, 9); g.fillStyle = '#2b2e3d'; g.fill(); g.strokeStyle = '#0e1018'; g.lineWidth = 1.6; g.stroke();
    A.rr(g, 15, -31, 24, 30, 7); g.fillStyle = '#3a3f52'; g.fill();
  };
  BODIES.team_desk = function (g, th) {
    counterBase(g, th);
    // monitor visto de espaldas
    g.fillStyle = '#2d3142'; g.fillRect(49, 4, 4, 12);
    A.rr(g, 40, -16, 22, 22, 3); g.fillStyle = '#3a3f55'; g.fill(); g.strokeStyle = '#141626'; g.lineWidth = 1.4; g.stroke();
    A.rr(g, 46, -10, 10, 8, 2); g.fillStyle = '#2b2e3d'; g.fill();
    A.ell(g, 51, 16, 8, 2.6); g.fillStyle = '#3a3f55'; g.fill();
    // teclado delante del NPC
    A.box(g, 13, 20, 26, 7, 2.5, '#e8ebf2', '#aab2c0', { r: 2 });
    // foto enmarcada y planta mini
    g.save(); g.translate(8, 10); g.rotate(-0.2);
    A.rr(g, -4, -5, 8, 10, 1); g.fillStyle = '#c99466'; g.fill(); g.fillStyle = '#9ee6ff'; g.fillRect(-2.5, -3.5, 5, 7); g.fillStyle = '#3fbf6f'; g.fillRect(-2.5, 1, 5, 2.5);
    g.restore();
    A.rr(g, 52, 32, 8, 8, 2); g.fillStyle = '#d0643c'; g.fill();
    g.fillStyle = '#3fbf6f'; A.circle(g, 54, 29, 3); g.fill(); A.circle(g, 58, 29, 3); g.fill(); A.circle(g, 56, 26, 3); g.fill();
    // placa para el nombre (texto en vivo)
    A.rr(g, 14, 61, 36, 10, 3); g.fillStyle = '#f4f1e6'; g.fill(); g.strokeStyle = '#4a3a20'; g.lineWidth = 1; g.stroke();
  };

  /* --- Decorado --- */
  function potShape(g, th, cx, by, w, h) {
    A.shadow(g, cx + 2, by, w * 0.7, 5, 0.45);
    g.beginPath(); g.moveTo(cx - w / 2, by - h); g.lineTo(cx + w / 2, by - h); g.lineTo(cx + w * 0.38, by); g.lineTo(cx - w * 0.38, by); g.closePath();
    var pg = g.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
    pg.addColorStop(0, A.shade(th.pot, -0.15)); pg.addColorStop(0.35, A.shade(th.pot, 0.2)); pg.addColorStop(1, A.shade(th.pot, -0.35));
    g.fillStyle = pg; g.fill(); g.strokeStyle = A.shade(th.pot, -0.6); g.lineWidth = 1.6; g.stroke();
    A.rr(g, cx - w / 2 - 2, by - h - 3, w + 4, 6, 2.5); g.fillStyle = A.shade(th.pot, 0.08); g.fill(); g.stroke();
    A.ell(g, cx, by - h - 1, w / 2 - 1, 2); g.fillStyle = '#3a2414'; g.fill();
  }
  BODIES.plant = function (g, th) { potShape(g, th, 32, 60, 30, 20); };

  BODIES.bookshelf = function (g, th) {
    var wood = th._name === 'corporate' ? '#5a4030' : th._name === 'coworking' ? '#e4d2b0' : '#9a6a40';
    dropShadow(g, 4, -40, 58, 114, 6);
    A.box(g, 4, -46, 56, 12, 108, A.shade(wood, 0.15), wood, { r: 4, outline: A.shade(wood, -0.65) });
    A.rr(g, 8, -31, 48, 96, 2); g.fillStyle = A.shade(wood, -0.45); g.fill();
    var R = A.rng(31), cols = ['#2f6fd6', '#e0302e', '#3fbf6f', '#ffb02e', '#a66cff', '#21c7c1', '#e8e2d0'];
    for (var s = 0; s < 4; s++) {
      var by = -31 + (s + 1) * 24;
      var x = 10;
      if (s === 2) { // caja archivo + trofeo
        A.rr(g, 10, by - 14, 20, 13, 1.5); g.fillStyle = '#c99b5f'; g.fill(); g.strokeStyle = '#6b4a22'; g.lineWidth = 1; g.stroke();
        g.fillStyle = '#e3c08a'; g.fillRect(16, by - 10, 8, 4);
        g.fillStyle = '#e0b84a'; A.rr(g, 38, by - 5, 10, 4, 1); g.fill(); g.fillRect(41.5, by - 9, 3, 4);
        g.beginPath(); g.moveTo(36, by - 18); g.lineTo(50, by - 18); g.quadraticCurveTo(49, by - 9, 43, by - 9); g.quadraticCurveTo(37, by - 9, 36, by - 18); g.fill();
      } else {
        while (x < 52) {
          var w = 4 + R() * 3.5, h = 14 + R() * 6, c = cols[(R() * cols.length) | 0];
          if (x + w > 54) break;
          var lean = (R() < 0.12 && x > 40) ? 0.25 : 0;
          g.save(); g.translate(x, by); g.rotate(lean);
          g.fillStyle = c; g.fillRect(0, -h, w, h); g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 0.7; g.strokeRect(0, -h, w, h);
          g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillRect(0.8, -h + 3, w - 1.6, 3.5);
          A.circle(g, w / 2, -4, Math.min(1.3, w / 3)); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fill();
          g.restore();
          x += w + 0.6;
        }
      }
      g.fillStyle = wood; g.fillRect(8, by, 48, 3); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(8, by + 3, 48, 1.5);
    }
  };

  BODIES.whiteboard = function (g, th) {
    A.shadow(g, 32, 66, 26, 6, 0.45);
    g.fillStyle = '#7d889e'; g.fillRect(10, 6, 3, 58); g.fillRect(51, 6, 3, 58);
    g.fillStyle = '#4a5163'; A.rr(g, 4, 62, 16, 4, 2); g.fill(); A.rr(g, 44, 62, 16, 4, 2); g.fill();
    A.rr(g, 1, -44, 62, 54, 3); g.fillStyle = '#9aa3b4'; g.fill(); g.strokeStyle = '#3a4152'; g.lineWidth = 1.6; g.stroke();
    A.rr(g, 4, -41, 56, 48, 2); g.fillStyle = '#fbfcff'; g.fill();
    // diagrama: cajas y flechas
    g.strokeStyle = '#2f6fd6'; g.lineWidth = 1.4;
    g.strokeRect(9, -36, 14, 9); g.strokeRect(30, -36, 14, 9); g.strokeRect(19, -20, 14, 9);
    g.beginPath(); g.moveTo(23, -31.5); g.lineTo(30, -31.5); g.moveTo(16, -27); g.lineTo(24, -20); g.stroke();
    g.strokeStyle = '#e0302e'; g.beginPath(); g.arc(37, -31.5, 9, 0, TAU); g.stroke();
    g.strokeStyle = '#3fbf6f'; g.lineWidth = 2; g.beginPath(); g.moveTo(8, 2); g.lineTo(18, -4); g.lineTo(28, -1); g.lineTo(40, -9); g.stroke();
    postit(g, 52, -32, 9, '#ffe066', 0.2); postit(g, 52, -20, 9, '#ff9ec7', -0.15); postit(g, 50, -6, 9, '#9ee6ff', 0.1);
    g.fillStyle = '#7d889e'; g.fillRect(4, 7, 56, 3);
    ['#e0302e', '#2f6fd6'].forEach(function (c, i) { g.fillStyle = c; A.rr(g, 12 + i * 10, 5.5, 7, 2.5, 1); g.fill(); });
  };

  BODIES.conveyor_h = function (g, th) { conveyorBody(g, th, true); };
  BODIES.conveyor_v = function (g, th) { conveyorBody(g, th, false); };
  function conveyorBody(g, th, horiz) {
    dropShadow(g, 1, 4, 62, 66, 6);
    A.box(g, 0, 4, 64, 54, 12, '#6b7486', '#3e4555', { r: 4, outline: '#151924' });
    A.rr(g, 5, 9, 54, 44, 3); g.fillStyle = '#1f2330'; g.fill();
    var c1 = '#4da3ff', c2 = '#e8ecf4';
    if (horiz) { hazardStripes(g, 0, 5, 64, 4, c1, c2); hazardStripes(g, 0, 53, 64, 4, c1, c2); }
    else { hazardStripes(g, 1, 5, 4, 52, c1, c2); hazardStripes(g, 59, 5, 4, 52, c1, c2); }
    for (var i = 0; i < 5; i++) { A.circle(g, 8 + i * 12, 64, 2.5); g.fillStyle = '#9aa3b4'; g.fill(); g.strokeStyle = '#151924'; g.lineWidth = 1; g.stroke(); }
  }

  BODIES.wall = function (g, th) {
    var name = th._name, top = th.wallTop, face = th.wallFace, FY = 52;
    g.fillStyle = 'rgba(10,5,20,0.3)'; g.fillRect(2, 72, 64, 8);
    var fg = g.createLinearGradient(0, FY, 0, 74);
    fg.addColorStop(0, A.shade(face, 0.1)); fg.addColorStop(1, A.shade(face, -0.25));
    g.fillStyle = fg; g.fillRect(0, FY, 64, 22);
    if (name === 'startup') {
      g.save(); g.beginPath(); g.rect(0, FY + 1, 64, 21); g.clip();
      for (var r = 0; r < 2; r++) for (var c = -1; c < 3; c++) {
        var bx = c * 32 + (r % 2 ? 16 : 0), by = FY + 1 + r * 10.5;
        g.fillStyle = A.shade(th.wall, (A.hash(r * 9 + c) - 0.5) * 0.25); A.rr(g, bx + 1, by + 1, 30, 8.5, 1.5); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(bx + 2, by + 1.5, 28, 1.5);
      }
      g.restore();
    } else if (name === 'coworking') {
      g.fillStyle = '#c9bca6'; g.fillRect(0, 67, 64, 7); g.fillStyle = '#ffffff'; g.fillRect(0, 67, 64, 1.5);
    } else if (name === 'consulting') {
      g.fillStyle = '#2c3650'; g.fillRect(0, 60, 64, 4);
    } else if (name === 'corporate') {
      g.fillStyle = th.accent; g.globalAlpha = 0.85; g.fillRect(0, 59, 64, 2); g.globalAlpha = 1;
    } else if (name === 'quarterclose') {
      g.fillStyle = th.accent; g.fillRect(0, 60, 64, 3);
    }
    g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, 73, 64, 1.5);
    var tg = g.createLinearGradient(0, -12, 0, FY);
    tg.addColorStop(0, A.shade(top, 0.06)); tg.addColorStop(1, A.shade(top, -0.06));
    g.fillStyle = tg; g.fillRect(0, -12, 64, 64);
    var R = A.rng((name || 'x').length * 7 + 3);
    for (var n = 0; n < 40; n++) { g.fillStyle = R() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'; g.fillRect(R() * 64, -12 + R() * 64, 2, 2); }
    g.fillStyle = A.shade(top, 0.22); g.fillRect(0, FY - 3, 64, 3);
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, FY, 64, 1.2);
  };

  /* ------------------------------------------------------ sprites */
  function themeObj(theme) {
    theme = A.resolveTheme ? A.resolveTheme(theme) : theme;
    var th = A.theme(theme);
    if (!th._name) th._name = theme;
    return th;
  }
  function getSprite(key, theme, v) {
    var k = key + '|' + theme + '|' + v;
    if (cache[k]) return cache[k];
    var c = A.canvas(SW * RES, SH * RES), g = c.getContext('2d');
    g.scale(RES, RES); g.translate(PADX, PADT);
    var fn = BODIES[key] || BODIES.counter;
    try { fn(g, themeObj(theme), v); } catch (e) { if (window.console) console.warn('station body', key, e); }
    return (cache[k] = c);
  }

  function parseDir(d) {
    if (d == null) return { x: 1, y: 0 };
    if (typeof d === 'number') return { x: Math.round(Math.cos(d)), y: Math.round(Math.sin(d)) };
    if (typeof d === 'string') {
      var s = d.toLowerCase()[0];
      return { r: { x: 1, y: 0 }, e: { x: 1, y: 0 }, l: { x: -1, y: 0 }, w: { x: -1, y: 0 }, u: { x: 0, y: -1 }, n: { x: 0, y: -1 }, d: { x: 0, y: 1 }, s: { x: 0, y: 1 } }[s] || { x: 1, y: 0 };
    }
    if (Array.isArray(d)) return { x: Math.sign(d[0] || 0), y: Math.sign(d[1] || 0) };
    var dx = A.num(d.x, 0), dy = A.num(d.y, 0);
    if (Math.abs(dx) >= Math.abs(dy)) return { x: dx < 0 ? -1 : 1, y: 0 };
    return { x: 0, y: dy < 0 ? -1 : 1 };
  }
  A.parseDir = parseDir;

  function isFire(st) { return st.state === 'fire' || st.state === 'burnt' || A.num(st.fire, 0) > 0; }

  /* --------------------------------------------------- capas animadas */
  var LIVE = {};

  /* papel que asoma por una ranura (fuentes) */
  function paperOut(ctx, st, lane, sx, sy, sw, maxH) {
    var L = A.laneInfo(lane), working = st.state === 'working';
    var cycle = working ? (st._t * 1.6) % 1 : (st._t * 0.25) % 1;
    var h = 5 + Math.min(1, cycle * 1.6) * maxH, w = sw - 8;
    ctx.save(); ctx.beginPath(); ctx.rect(sx - 10, sy - 60, sw + 20, 60); ctx.clip();
    var sway = Math.sin(st._t * 3) * 0.7, x = sx + 4 + sway;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x + 1.5, sy - h + 1, w, h);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x, sy - h, w, h);
    ctx.strokeStyle = '#8a90a2'; ctx.lineWidth = 0.8; ctx.strokeRect(x, sy - h, w, h);
    ctx.fillStyle = L.color; ctx.fillRect(x, sy - h, w, 3);
    ctx.fillStyle = '#b4b9c6';
    for (var y = sy - h + 5; y < sy - 1; y += 3) ctx.fillRect(x + 2, y, w * 0.5 + A.hash(y) * w * 0.3, 1);
    ctx.restore();
  }

  LIVE.src_budget = function (ctx, st, th, t) {
    paperOut(ctx, st, 'budget', 15, -22, 34, 14);
    A.rr(ctx, 15, -23, 34, 3, 1.5); ctx.fillStyle = '#3a4152'; ctx.fill();
    A.glow(ctx, 32, -2.5, 16, A.laneColor('budget'), 0.18 + 0.08 * Math.sin(t * 3) + (st.state === 'working' ? 0.2 : 0));
    // destello de moneda
    var ph = (t * 0.4) % 1;
    if (ph < 0.15) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.sin(ph / 0.15 * PI); ctx.fillStyle = '#fff6c0'; A.circle(ctx, 28, -6, 2); ctx.fill(); ctx.restore(); }
  };

  LIVE.src_plan = function (ctx, st, th, t) {
    // post-it que viaja de "pendiente" a "hecho"
    var sp = st.state === 'working' ? 0.9 : 0.22, ph = (t * sp) % 1;
    var x = 14 + A.easeInOut(A.clamp((ph - 0.2) / 0.6, 0, 1)) * 34, y = 2 - Math.sin(A.clamp((ph - 0.2) / 0.6, 0, 1) * PI) * 6;
    postit(ctx, x, y, 10, '#ffd23f', Math.sin(t * 4) * 0.1);
    if (ph > 0.8) { ctx.strokeStyle = '#2f8f5f'; ctx.lineWidth = 1.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 2.5, y + 1); ctx.lineTo(x - 0.5, y + 3); ctx.lineTo(x + 3, y - 1.5); ctx.stroke(); }
    A.glow(ctx, 32, 66, 14, A.laneColor('plan'), 0.15 + 0.08 * Math.sin(t * 3));
  };

  LIVE.src_report = function (ctx, st, th, t) {
    var working = st.state === 'working', sp = working ? 3 : 0.8;
    ctx.save(); A.rr(ctx, 5, -37, 54, 41, 2); ctx.clip();
    ctx.fillStyle = '#0d1a1a'; ctx.fillRect(5, -37, 54, 41);
    ctx.fillStyle = '#1f3a36'; ctx.fillRect(5, -37, 54, 5);
    ctx.fillStyle = '#3ddc84'; ctx.fillRect(7, -36, 14, 3);
    // quesito
    var cx = 19, cy = -14, r = 10, a0 = -PI / 2, parts = [0.45, 0.3, 0.25], cols = ['#3ddc84', '#4da3ff', '#ffb02e'];
    for (var i = 0; i < 3; i++) {
      var a1 = a0 + parts[i] * TAU, pop = i === ((t * sp * 0.5) | 0) % 3 ? 1.8 : 0, am = (a0 + a1) / 2;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(am) * pop, cy + Math.sin(am) * pop); ctx.arc(cx + Math.cos(am) * pop, cy + Math.sin(am) * pop, r, a0, a1); ctx.closePath();
      ctx.fillStyle = cols[i]; ctx.fill(); a0 = a1;
    }
    // barras
    for (var b = 0; b < 4; b++) {
      var bh = 8 + (Math.sin(t * sp + b * 1.3) * 0.5 + 0.5) * 16 + b * 2;
      ctx.fillStyle = b === 3 ? '#3ddc84' : '#2a8a5a'; ctx.fillRect(34 + b * 6, 0 - bh, 4, bh);
    }
    ctx.strokeStyle = '#b2f7cf'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(33, 0.5); ctx.lineTo(58, 0.5); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(40, -37); ctx.lineTo(50, -37); ctx.lineTo(36, 4); ctx.lineTo(28, 4); ctx.fill();
    A.glow(ctx, 32, -16, 36, '#3ddc84', 0.12 + (working ? 0.15 : 0));
  };

  LIVE.desk = function (ctx, st, th, t) {
    var working = st.state === 'working', fire = isFire(st);
    ctx.save(); A.rr(ctx, 14, -19, 36, 38, 1.5); ctx.clip();
    if (!fire) {
      ctx.fillStyle = '#dfe6f2'; ctx.fillRect(14, -19, 36, 38);
      ctx.fillStyle = '#2f6fd6'; ctx.fillRect(14, -19, 36, 4);
      // documento
      ctx.fillStyle = '#ffffff'; ctx.fillRect(18, -13, 28, 30);
      var p = st.progress != null ? A.clamp(st.progress, 0, 1) : (working ? (t * 0.3) % 1 : 0.35);
      var n = 9, shown = p * n;
      for (var i = 0; i < n; i++) {
        var w = 22 * (0.55 + A.hash(i * 3.3) * 0.45);
        if (i > shown) break;
        var frac = i + 1 > shown ? shown - i : 1;
        ctx.fillStyle = i === 0 ? '#2a2250' : '#8a90a8'; ctx.fillRect(21, -10 + i * 3, w * frac, i === 0 ? 1.8 : 1.1);
        if (i + 1 > shown && (t * 2 % 1) < 0.6) { ctx.fillStyle = '#2a2250'; ctx.fillRect(21 + w * frac + 0.5, -10.5 + i * 3, 0.9, 2.2); }
      }
    } else {
      ctx.fillStyle = '#3a0a0a'; ctx.fillRect(14, -19, 36, 38);
      ctx.beginPath(); ctx.moveTo(32, -10); ctx.lineTo(42, 8); ctx.lineTo(22, 8); ctx.closePath(); ctx.fillStyle = '#ff3b3b'; ctx.fill();
      ctx.fillStyle = '#3a0a0a'; ctx.fillRect(31, -4, 2, 7); ctx.fillRect(31, 4.5, 2, 2);
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.moveTo(38, -19); ctx.lineTo(46, -19); ctx.lineTo(34, 19); ctx.lineTo(27, 19); ctx.fill();
    if (working) A.glow(ctx, 32, 0, 40, '#8ac0ff', 0.22 + 0.06 * Math.sin(t * 12));
    // teclas pulsándose
    for (var r = 0; r < 3; r++) for (var c = 0; c < 9; c++) {
      var press = working && A.hash(Math.floor(t * 14) * 3.3 + c + r * 10) > 0.8;
      ctx.fillStyle = press ? '#8ac0ff' : '#454a5f';
      ctx.fillRect(16.5 + c * 3.6, 25.5 + r * 3.2 + (press ? 0.4 : 0), 2.8, 2.3);
    }
  };

  LIVE.printer = function (ctx, st, th, t) {
    var s = st.state, fire = isFire(st);
    var shake = s === 'working' ? Math.sin(t * 50) * 0.4 : s === 'warning' ? Math.sin(t * 70) * 0.8 : 0;
    ctx.save(); ctx.translate(shake, 0);
    // pantalla del panel
    A.rr(ctx, 12, -13, 18, 8, 1.5);
    ctx.fillStyle = fire ? '#1a0606' : s === 'warning' ? ((t * 4 % 1) < 0.5 ? '#ff9a1f' : '#5a3000') : s === 'done' ? '#3ddc84' : s === 'working' ? '#4da3ff' : '#2a4a6a'; ctx.fill();
    if (s === 'working') { ctx.fillStyle = '#e8f4ff'; for (var d = 0; d < 3; d++) if (((t * 3) | 0) % 3 >= d) ctx.fillRect(15 + d * 5, -10, 3, 2); }
    else if (s === 'done' && !fire) { ctx.strokeStyle = '#0d4a28'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(18, -9); ctx.lineTo(20, -7); ctx.lineTo(24, -11); ctx.stroke(); }
    else if (s === 'warning') { ctx.fillStyle = '#2a1a00'; ctx.fillRect(20.2, -12, 1.6, 4); ctx.fillRect(20.2, -7, 1.6, 1.4); }
    // LEDs
    var blink = (t * 6 % 1) < 0.5;
    [['#3ddc84', s === 'idle' || s === 'done' || (s === 'working' && blink)], ['#ffb02e', s === 'warning' && blink], ['#ff3b3b', fire || (s === 'warning' && !blink)]].forEach(function (L, i) {
      ctx.fillStyle = L[1] ? L[0] : A.shade(L[0], -0.7); A.circle(ctx, 38 + i * 6, -9, 1.8); ctx.fill();
      if (L[1]) A.glow(ctx, 38 + i * 6, -9, 7, L[0], 0.6);
    });
    // papel saliendo mientras imprime
    if (s === 'working' && !fire) {
      var ph = (t * 1.2) % 1;
      ctx.save(); ctx.beginPath(); ctx.rect(8, 5, 48, 30); ctx.clip();
      sheet(ctx, 32, 5 + ph * 18, 30, 20, 0, '#d0d4de');
      ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.25 + 0.1 * Math.sin(t * 8);
      ctx.fillStyle = '#9ad0ff'; ctx.fillRect(11, -28, (t * 60) % 40, 5); ctx.restore();
    }
    // atasco: papel arrugado asomando + humo
    if (s === 'warning' || fire) {
      ctx.save(); ctx.translate(36, 6); ctx.rotate(-0.3 + Math.sin(t * 20) * 0.05);
      ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-6, -7); ctx.lineTo(-2, -4); ctx.lineTo(1, -9); ctx.lineTo(5, -5); ctx.lineTo(8, -8); ctx.lineTo(9, 0); ctx.closePath();
      ctx.fillStyle = fire ? '#3a2a24' : '#f4f2ea'; ctx.fill(); ctx.strokeStyle = '#6a6458'; ctx.lineWidth = 0.9; ctx.stroke();
      ctx.restore();
      var smoke = A.blob(fire ? '#2a2228' : '#8a8490');
      for (var k = 0; k < (fire ? 5 : 3); k++) {
        var q = (t * 0.7 + k / 4) % 1, r = 4 + q * 9;
        ctx.globalAlpha = (1 - q) * (fire ? 0.6 : 0.4);
        ctx.drawImage(smoke, 36 + Math.sin(q * 6 + k) * 5 - r, -2 - q * 34 - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    // ranura delante del papel
    A.rr(ctx, 10, 2, 44, 3.5, 2); ctx.fillStyle = '#2b2e3d'; ctx.fill();
    if (s === 'done' && !fire) A.glow(ctx, 32, 44, 26, '#3ddc84', 0.25 + 0.1 * Math.sin(t * 6));
    // calor/brillo de impresión reciente
    if (s === 'working') A.glow(ctx, 32, 40, 22, '#ffd27a', 0.15);
  };

  LIVE.approval = function (ctx, st, th, t) {
    var s = st.state, working = s === 'working';
    // sello: sube y baja al firmar
    var cyc = working ? (t * 2.4) % 1 : 0, down = working ? Math.max(0, Math.sin(cyc * TAU)) : 0;
    var sx = working ? 25 : 54, sy = working ? 22 - (1 - down) * 14 : 22;
    if (working && down > 0.85) {
      ctx.save(); ctx.globalAlpha = 0.6;
      A.circle(ctx, 25, 30, 8); ctx.strokeStyle = '#c8102e'; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.translate(25, 30); ctx.strokeStyle = '#c8102e'; ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-1, 3); ctx.lineTo(4.5, -3); ctx.stroke(); ctx.restore();
    }
    A.shadow(ctx, sx, 31, 7 - (1 - down) * 2, 3, 0.4);
    ctx.save(); ctx.translate(sx, sy);
    A.rr(ctx, -7, 4, 14, 4, 1.5); ctx.fillStyle = '#c8102e'; ctx.fill(); ctx.strokeStyle = '#5a0010'; ctx.lineWidth = 1; ctx.stroke();
    A.rr(ctx, -5, -2, 10, 6, 1.5); ctx.fillStyle = '#8a5a34'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a3016'; ctx.fillRect(-1.5, -8, 3, 6);
    A.circle(ctx, 0, -10, 4); ctx.fillStyle = '#c8102e'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; A.circle(ctx, -1.2, -11.2, 1.2); ctx.fill();
    ctx.restore();
    if (s === 'done') A.glow(ctx, 25, 28, 24, '#3ddc84', 0.3 + 0.12 * Math.sin(t * 6));
  };

  LIVE.meeting_room = function (ctx, st, th, t, v) {
    var busy = A.clamp(A.num(st.busy, 0), 0, 1) || (st.state === 'working' || st.state === 'done' ? 0.8 : 0);
    // LED de ocupación en la placa
    var col = busy > 0 ? '#ff4f4f' : '#3ddc84';
    ctx.fillStyle = col; A.circle(ctx, 43, 66, 1.8); ctx.fill(); A.glow(ctx, 43, 66, 7, col, 0.6);
    // altavoz de conferencia
    ctx.save(); ctx.translate(32, 28);
    ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(5, 3); ctx.lineTo(-5, 3); ctx.closePath(); ctx.fillStyle = '#2b2e3d'; ctx.fill();
    ctx.fillStyle = busy > 0 && (t * 3 % 1) < 0.5 ? '#3ddc84' : '#5a6070'; A.circle(ctx, 0, 0.5, 1.2); ctx.fill();
    ctx.restore();
    if (busy > 0) {
      // compañeros reunidos (cabezas) y celebración
      var heads = [[10, 16, '#ffb02e'], [54, 16, '#4da3ff'], [10, 38, '#3ddc84'], [54, 38, '#ff6b9a']];
      heads.forEach(function (h, i) {
        var hop = Math.max(0, Math.sin(t * 9 + i * 1.7)) * 2.5 * busy;
        A.circle(ctx, h[0], h[1] - 3 - hop, 4.5); ctx.fillStyle = ['#f6cfae', '#e3a87a', '#8d5a3b', '#ffdcc2'][i]; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = h[2]; ctx.beginPath(); ctx.arc(h[0], h[1] - 4 - hop, 4.5, PI, TAU); ctx.fill();
      });
      ctx.save(); ctx.globalAlpha = busy;
      for (var k = 0; k < 6; k++) {
        var q = (t * 0.8 + k / 6) % 1;
        postit(ctx, 16 + A.hash(k * 7.1) * 32, 40 - q * 50, 5, ['#ffe066', '#ff9ec7', '#9ee6ff', '#b8ff9e'][k % 4], t * 3 + k);
      }
      ctx.restore();
      A.glow(ctx, 32, 28, 34, '#ffd23f', 0.22 * busy);
    }
  };

  LIVE.minutes = function (ctx, st, th, t) {
    if (st.state !== 'working') return;
    // boli escribiendo
    var px = 22 + Math.sin(t * 14) * 6, py = 4 + Math.cos(t * 9) * 1.5;
    sheet(ctx, 26, 6, 18, 14, -0.05);
    ctx.strokeStyle = '#2a2250'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(19, 5); ctx.lineTo(px, py + 1); ctx.stroke();
    ctx.save(); ctx.translate(px, py); ctx.rotate(0.6);
    A.rr(ctx, -1.4, -10, 2.8, 11, 1); ctx.fillStyle = '#2f6fd6'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 0.7; ctx.stroke();
    ctx.restore();
  };

  LIVE.shredder = function (ctx, st, th, t) {
    var working = st.state === 'working';
    ctx.fillStyle = working ? '#3ddc84' : '#2a5a3a'; A.circle(ctx, 47, 21.5, 1.4); ctx.fill();
    if (working) A.glow(ctx, 47, 21.5, 6, '#3ddc84', 0.7);
    if (working) {
      ctx.save(); A.rr(ctx, 19, 32, 26, 26, 3); ctx.clip();
      for (var i = 0; i < 8; i++) {
        var q = (t * 2 + i / 8) % 1;
        ctx.fillStyle = '#ffffff'; ctx.fillRect(21 + i * 3, 30 + q * 24, 1.4, 6);
      }
      ctx.restore();
      ctx.save(); ctx.translate(0, Math.sin(t * 60) * 0.3);
      ctx.fillStyle = '#fdfdf8'; ctx.fillRect(22, 5 + ((t * 3) % 1) * 3, 20, 5);
      ctx.restore();
    }
  };

  LIVE.coffee = function (ctx, st, th, t) {
    var working = st.state === 'working';
    var dp = (t * (working ? 3 : 0.8)) % 1;
    if (working || dp < 0.6) { ctx.fillStyle = '#4a2410'; A.ell(ctx, 23, 14 + dp * 7, 0.9, 1.4); ctx.fill(); }
    if (working) { ctx.fillStyle = '#5a3016'; ctx.fillRect(22.4, 14, 1.2, 6); }
    var a = -PI * 0.75 + (working ? 1.4 : 0.9) * PI * 0.5 + Math.sin(t * (working ? 12 : 2)) * 0.12;
    ctx.strokeStyle = '#1b1430'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(37, -4); ctx.lineTo(37 + Math.cos(a) * 4, -4 + Math.sin(a) * 4); ctx.stroke();
    ctx.fillStyle = working ? '#ffb02e' : '#7dffb0'; A.circle(ctx, 41, 6, 1.4); ctx.fill();
    A.glow(ctx, 41, 6, 5, working ? '#ffb02e' : '#7dffb0', 0.6);
    var steam = A.blob('#ffffff'), n = working ? 6 : 4;
    for (var i = 0; i < n; i++) {
      var ph = (t * (working ? 0.9 : 0.45) + i / n) % 1;
      var x = 23 + Math.sin(ph * 7 + i * 2) * 3 * ph, y = 18 - ph * 30, r = 3 + ph * 7;
      ctx.globalAlpha = (1 - ph) * (working ? 0.55 : 0.35) * Math.min(1, ph * 5);
      ctx.drawImage(steam, x - r, y - r, r * 2, r * 2);
      if (working) { var x2 = 38 + Math.sin(ph * 9 + i) * 2 - ph * 4, y2 = 22 - ph * 16; ctx.drawImage(steam, x2 - r * 0.8, y2 - r * 0.8, r * 1.6, r * 1.6); }
    }
    ctx.globalAlpha = 1;
  };

  function handset(ctx, x, y, rot, s) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s || 1, s || 1);
    ctx.beginPath(); ctx.moveTo(-3.5, -9); ctx.quadraticCurveTo(-7, 0, -3.5, 9); ctx.lineTo(1, 9); ctx.quadraticCurveTo(-2, 0, 1, -9); ctx.closePath();
    ctx.fillStyle = '#2b2e3d'; ctx.fill(); ctx.strokeStyle = '#0e1018'; ctx.lineWidth = 1; ctx.stroke();
    A.rr(ctx, -5, -11, 8, 5, 2.2); ctx.fill(); ctx.stroke(); A.rr(ctx, -5, 6, 8, 5, 2.2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-4, -7, 1.2, 14);
    ctx.restore();
  }
  LIVE.phone = function (ctx, st, th, t) {
    var ringing = !!st.ringing, talking = st.state === 'working' || (st.progress != null && st.progress > 0);
    if (talking) {
      // auricular descolgado con cable rizado
      ctx.strokeStyle = '#1b1e2c'; ctx.lineWidth = 1.2; ctx.beginPath();
      for (var i = 0; i <= 12; i++) { var u = i / 12; ctx.lineTo(14 + u * 4 + Math.sin(u * 30) * 2, 30 - u * 26 + Math.cos(u * 30) * 1.2); }
      ctx.stroke();
      handset(ctx, 16, -4 + Math.sin(t * 3) * 1, -0.5, 1.1);
      // ondas de voz
      ctx.strokeStyle = 'rgba(77,163,255,0.8)'; ctx.lineWidth = 1.4;
      for (var w = 0; w < 2; w++) { var q = (t * 1.5 + w * 0.5) % 1; ctx.globalAlpha = 1 - q; ctx.beginPath(); ctx.arc(24, -16, 4 + q * 8, -PI * 0.4, PI * 0.2); ctx.stroke(); }
      ctx.globalAlpha = 1;
    } else {
      var jx = ringing ? Math.sin(t * 70) * 1.2 : 0, jr = ringing ? Math.sin(t * 55) * 0.12 : 0, jy = ringing ? -Math.abs(Math.sin(t * 35)) * 1.5 : 0;
      handset(ctx, 18.5 + jx, 21 + jy, jr, 1);
    }
    // LED
    var on = ringing ? (t * 5 % 1) < 0.5 : talking;
    ctx.fillStyle = on ? (ringing ? '#ff3b3b' : '#3ddc84') : '#3a2a2a'; A.circle(ctx, 45, 13, 1.4); ctx.fill();
    if (on) A.glow(ctx, 45, 13, 7, ringing ? '#ff3b3b' : '#3ddc84', 0.7);
    if (ringing) {
      ctx.fillStyle = '#c8e8ff'; ctx.fillRect(30.5, 11.5, 15, 3.5);
      // ondas de timbre a ambos lados
      ctx.lineCap = 'round';
      for (var k = 0; k < 3; k++) {
        var p = (t * 2 + k / 3) % 1;
        ctx.strokeStyle = A.rgba('#ffd23f', (1 - p) * 0.9); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(29, 20, 18 + p * 14, -PI * 0.25, PI * 0.25); ctx.stroke();
        ctx.beginPath(); ctx.arc(29, 20, 18 + p * 14, PI * 0.75, PI * 1.25); ctx.stroke();
      }
      // icono flotante de teléfono
      var by = -30 + Math.sin(t * 8) * 2.5, sc = 1 + 0.08 * Math.sin(t * 16);
      ctx.save(); ctx.translate(32, by); ctx.scale(sc, sc); ctx.rotate(Math.sin(t * 30) * 0.15);
      A.glow(ctx, 0, 0, 24, '#ff4f4f', 0.5);
      A.circle(ctx, 0, 0, 15); ctx.fillStyle = '#ff4f4f'; ctx.fill(); ctx.strokeStyle = '#5a0010'; ctx.lineWidth = 2; ctx.stroke();
      if (A.drawIcon) A.drawIcon(ctx, 'phone', 0, 0, 20);
      ctx.restore();
    }
  };

  LIVE.team_desk_npc = function (ctx, st, th, t) {
    if (A._drawSeatedNPC) A._drawSeatedNPC(ctx, st.npc || {}, 26, 0, t, { part: 'body', wants: !!st.wants, talking: st.progress != null && st.progress > 0 });
  };
  LIVE.team_desk = function (ctx, st, th, t) {
    var npc = st.npc || {}, talking = st.progress != null && st.progress > 0;
    if (A._drawSeatedNPC) A._drawSeatedNPC(ctx, npc, 26, 0, t, { part: 'arms', wants: !!st.wants, talking: talking });
    // nombre en la placa
    if (npc.name) {
      var fs = 7.5, nm = String(npc.name);
      ctx.font = 'bold ' + fs + 'px ' + A.FONT;
      while (ctx.measureText(nm).width > 33 && fs > 5) { fs -= 0.5; ctx.font = 'bold ' + fs + 'px ' + A.FONT; }
      ctx.fillStyle = '#2a2010'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(nm, 32, 66.5);
    }
    if (st.wants && !talking) {
      // bocadillo con calendario + dos caras
      var by = -66 + Math.sin(t * 4) * 2, sc = 1 + 0.05 * Math.sin(t * 8);
      ctx.save(); ctx.translate(34, by); ctx.scale(sc * 1.25, sc * 1.25);
      ctx.fillStyle = 'rgba(10,5,25,0.3)'; A.rr(ctx, -15, -11, 32, 24, 7); ctx.fill();
      A.rr(ctx, -16, -13, 32, 24, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-6, 10.5); ctx.lineTo(-10, 17); ctx.lineTo(0, 10.5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(-7, 8, 8, 3);
      if (A.drawIcon) { A.drawIcon(ctx, 'calendar', -7, -1, 13); A.drawIcon(ctx, 'one2one', 7, -1, 13); }
      ctx.restore();
    }
    if (talking) {
      ctx.save(); ctx.globalAlpha = 0.8 + 0.2 * Math.sin(t * 6);
      for (var i = 0; i < 3; i++) { ctx.fillStyle = '#4da3ff'; A.circle(ctx, 40 + i * 4, -44 - Math.abs(Math.sin(t * 6 + i)) * 2, 1.6); ctx.fill(); }
      ctx.restore();
    }
  };

  LIVE.conveyor = function (ctx, st, th, t) {
    var d = parseDir(st.dir), horiz = d.x !== 0, speed = 22;
    ctx.save();
    A.rr(ctx, 5, 9, 54, 44, 3); ctx.clip();
    var off = (t * speed) % 8;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (var i = -1; i < 10; i++) {
      var p = i * 8 + (d.x + d.y > 0 ? off : -off);
      if (horiz) ctx.fillRect(5 + p, 9, 1.5, 44); else ctx.fillRect(5, 9 + p, 54, 1.5);
    }
    var off2 = (t * speed) % 18;
    ctx.translate(32, 31);
    ctx.rotate(Math.atan2(d.y, d.x));
    for (var k = -3; k <= 3; k++) {
      var cx = k * 18 + off2, a = 0.45 + 0.45 * (1 - Math.abs(cx) / 40);
      ctx.beginPath(); ctx.moveTo(cx - 5, -9); ctx.lineTo(cx + 3, 0); ctx.lineTo(cx - 5, 9);
      ctx.strokeStyle = A.rgba('#8ac4ff', Math.max(0.15, a)); ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    }
    ctx.restore();
    for (var r = 0; r < 5; r++) {
      var ang = t * 8 * (d.x + d.y >= 0 ? 1 : -1) + r;
      ctx.strokeStyle = '#2a2f3c'; ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(8 + r * 12, 64); ctx.lineTo(8 + r * 12 + Math.cos(ang) * 2.4, 64 + Math.sin(ang) * 2.4); ctx.stroke();
    }
  };

  /* plantas */
  var leafCache = {};
  function getLeaves(v, theme) {
    var k = v + '|' + theme;
    if (leafCache[k]) return leafCache[k];
    var c = A.canvas(80 * RES, 90 * RES), g = c.getContext('2d');
    g.scale(RES, RES); g.translate(40, 80);
    var dark = '#1f7a4a', mid = '#2fa35f', light = '#6fdc7f';
    if (theme === 'corporate') { dark = '#1d6a5a'; mid = '#27907a'; light = '#5fd6b8'; }
    if (theme === 'quarterclose') { dark = '#2a6a3a'; mid = '#3f9a4a'; light = '#9ad66f'; }
    function leaf(ang, len, wid, col) {
      g.save(); g.rotate(ang);
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(wid, -len * 0.45, 0, -len); g.quadraticCurveTo(-wid, -len * 0.45, 0, 0);
      var lg = g.createLinearGradient(-wid, 0, wid, 0); lg.addColorStop(0, A.shade(col, -0.15)); lg.addColorStop(0.5, A.shade(col, 0.15)); lg.addColorStop(1, A.shade(col, -0.25));
      g.fillStyle = lg; g.fill(); g.strokeStyle = A.shade(dark, -0.45); g.lineWidth = 1.2; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(0, -2); g.quadraticCurveTo(wid * 0.15, -len * 0.5, 0, -len * 0.92); g.stroke();
      g.restore();
    }
    if (v === 0) {
      [[-1.1, 40, 13, dark], [1.0, 42, 13, dark], [-0.5, 54, 15, mid], [0.45, 52, 15, mid], [0.05, 60, 16, light], [-1.5, 30, 10, mid], [1.45, 30, 10, mid]].forEach(function (l) { leaf(l[0], l[1], l[2], l[3]); });
    } else if (v === 1) {
      [[-0.32, 56, 6], [-0.12, 68, 6.5], [0.1, 62, 6], [0.3, 50, 5.5], [-0.5, 42, 5], [0.48, 40, 5]].forEach(function (l) {
        g.save(); g.rotate(l[0]);
        g.beginPath(); g.moveTo(-l[2], 0); g.quadraticCurveTo(-l[2] * 1.1, -l[1] * 0.6, 0, -l[1]); g.quadraticCurveTo(l[2] * 1.1, -l[1] * 0.6, l[2], 0); g.closePath();
        var sg = g.createLinearGradient(-l[2], 0, l[2], 0); sg.addColorStop(0, '#2b6b3a'); sg.addColorStop(0.5, '#4f9a4a'); sg.addColorStop(1, '#245a30');
        g.fillStyle = sg; g.fill(); g.strokeStyle = '#d8e27a'; g.lineWidth = 1.4; g.stroke();
        g.strokeStyle = 'rgba(20,50,25,0.5)'; g.lineWidth = 1;
        for (var b = 8; b < l[1] - 6; b += 7) { g.beginPath(); g.moveTo(-l[2] * 0.6, -b); g.quadraticCurveTo(0, -b - 3, l[2] * 0.6, -b); g.stroke(); }
        g.restore();
      });
    } else {
      var R = A.rng(77);
      for (var i = 0; i < 34; i++) {
        var a = R() * TAU, d = Math.sqrt(R()) * 22;
        var x = Math.cos(a) * d, y = -26 + Math.sin(a) * d * 0.85;
        g.fillStyle = A.mix(dark, light, (1 - (y + 48) / 44) * 0.6 + R() * 0.4);
        A.ell(g, x, y, 7, 5.5); g.fill(); g.strokeStyle = A.rgba(A.shade(dark, -0.5), 0.5); g.lineWidth = 0.8; g.stroke();
      }
      ['#ff6b9a', '#ffd23f', '#ffffff', '#ff6b9a', '#ffd23f'].forEach(function (fc, j) {
        var fa = j * 1.3 + 0.4, fd = 10 + (j % 3) * 5;
        g.fillStyle = fc; A.circle(g, Math.cos(fa) * fd, -28 + Math.sin(fa) * fd * 0.8, 2.6); g.fill();
        g.fillStyle = '#ffb02e'; A.circle(g, Math.cos(fa) * fd, -28 + Math.sin(fa) * fd * 0.8, 1); g.fill();
      });
    }
    return (leafCache[k] = c);
  }
  LIVE.plant = function (ctx, st, th, t, v) {
    var sway = Math.sin(t * 1.3 + v * 2) * 0.045 + Math.sin(t * 2.9 + v) * 0.015;
    ctx.save(); ctx.translate(32, 40); ctx.rotate(sway);
    ctx.drawImage(getLeaves(v, th._name), -40, -80, 80, 90);
    ctx.restore();
    A.rr(ctx, 15, 37, 34, 6, 2.5); ctx.fillStyle = A.shade(th.pot, 0.08); ctx.fill(); ctx.strokeStyle = A.shade(th.pot, -0.6); ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(18, 38.5, 12, 1.2);
  };

  /* --------------------------------------------- overlays de estado */
  function topRect(type) {
    switch (type) {
      case 'shredder': return [9, 4, 46, 66, 12];
      case 'printer': return [3, -34, 58, 104, 7];
      case 'wall': return [0, -12, 64, 86, 2];
      case 'plant': return [14, -24, 36, 86, 10];
      case 'bookshelf': return [4, -46, 56, 120, 6];
      case 'whiteboard': return [1, -44, 62, 112, 4];
      case 'coffee': case 'desk': return [1, -26, 62, 100, 8];
      case 'src_budget': return [1, -28, 62, 102, 8];
      case 'src_plan': case 'src_report': return [1, -40, 62, 114, 8];
      case 'team_desk': return [1, -34, 62, 108, 8];
      default: return [1, 0, 62, 74, 8];
    }
  }
  A.stationTopRect = topRect;

  function highlight(ctx, type, t) {
    var r = topRect(type), p = 0.55 + 0.45 * Math.sin(t * 6);
    ctx.save();
    A.rr(ctx, r[0] - 2, r[1] - 2, r[2] + 4, r[3] + 4, r[4] + 2);
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.55 + 0.4 * p) + ')'; ctx.lineWidth = 3; ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255,230,140,' + (0.25 * p) + ')'; ctx.lineWidth = 7; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,220,' + (0.07 + 0.05 * p) + ')'; ctx.fill();
    ctx.restore();
  }

  function stateOverlay(ctx, st, type, t) {
    var s = st.state, r = topRect(type);
    if (isFire(st)) {
      ctx.save(); A.rr(ctx, r[0], r[1], r[2], r[3], r[4]);
      ctx.fillStyle = 'rgba(30,12,6,0.45)'; ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,80,20,' + (0.12 + 0.08 * Math.sin(t * 17)) + ')'; ctx.fill();
      ctx.restore();
    } else if (s === 'warning') {
      var b = (t * 4 % 1) < 0.5;
      ctx.save(); A.rr(ctx, r[0], r[1], r[2], r[3], r[4]);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,150,20,' + (b ? 0.16 : 0.04) + ')'; ctx.fill();
      ctx.restore();
      var by = r[1] - 14 + Math.sin(t * 10) * 2;
      ctx.save(); ctx.translate(54, by);
      ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(9, 7); ctx.lineTo(-9, 7); ctx.closePath();
      ctx.fillStyle = b ? '#ffcc1f' : '#ff9a1f'; ctx.fill(); ctx.strokeStyle = '#2a1a00'; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.fillStyle = '#2a1a00'; ctx.fillRect(-1, -4, 2, 6); ctx.fillRect(-1, 3.5, 2, 2);
      ctx.restore();
    } else if (s === 'blocked' || st.blocked) {
      ctx.save(); A.rr(ctx, r[0] + 1, r[1] + 1, r[2] - 2, r[3] - 2, r[4]);
      ctx.setLineDash([5, 4]); ctx.lineDashOffset = -t * 20;
      ctx.strokeStyle = 'rgba(255,60,90,' + (0.6 + 0.3 * Math.sin(t * 8)) + ')'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,40,80,0.10)'; ctx.fill();
      ctx.restore();
    } else if (s === 'done') {
      var pop = 1 + 0.08 * Math.sin(t * 8);
      ctx.save(); ctx.translate(55, r[1] + 4); ctx.scale(pop, pop);
      A.circle(ctx, 0, 0, 7); ctx.fillStyle = '#3ddc84'; ctx.fill(); ctx.strokeStyle = '#0d4a28'; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-3.2, 0.2); ctx.lineTo(-0.8, 2.6); ctx.lineTo(3.4, -2.6); ctx.stroke();
      ctx.restore();
    }
  }

  function barPos(type) {
    switch (type) {
      case 'printer': return -46;
      case 'coffee': case 'desk': return -36;
      case 'src_budget': return -38;
      case 'src_plan': case 'src_report': return -50;
      case 'approval': return -10;
      case 'phone': return -14;
      case 'team_desk': return -56;
      case 'bookshelf': return -56;
      default: return -8;
    }
  }

  A.itemAnchor = function (type, tile) {
    var s = A.num(tile, 64) / 64, p;
    switch (type) {
      case 'printer': p = [32, 44]; break;
      case 'desk': p = [32, 34]; break;
      case 'approval': p = [25, 28]; break;
      case 'minutes': p = [25, 30]; break;
      case 'folder_stack': p = [32, 24]; break;
      case 'shredder': p = [32, 8]; break;
      case 'coffee': p = [30, 40]; break;
      case 'meeting_room': p = [32, 28]; break;
      case 'conveyor': p = [32, 30]; break;
      case 'phone': p = [30, 22]; break;
      case 'team_desk': p = [24, 36]; break;
      case 'src_budget': p = [32, -10]; break;
      case 'src_plan': case 'src_report': p = [32, 30]; break;
      default: p = [32, 28];
    }
    return { x: p[0] * s, y: p[1] * s };
  };

  var KNOWN = { counter: 1, src_budget: 1, src_plan: 1, src_report: 1, desk: 1, printer: 1, approval: 1, folder_stack: 1, meeting_room: 1, minutes: 1, shredder: 1, coffee: 1, phone: 1, team_desk: 1, plant: 1, bookshelf: 1, whiteboard: 1, conveyor: 1, wall: 1 };
  A.STATION_TYPES = Object.keys(KNOWN);

  /* ------------------------------------------------------ drawStation */
  A.drawStation = function (ctx, st, x, y, tile, t) {
    st = st || {}; tile = A.num(tile, 64); t = A.num(t, 0); x = A.num(x, 0); y = A.num(y, 0);
    var type = KNOWN[st.type] ? st.type : 'counter';
    var theme = A.resolveTheme ? A.resolveTheme(st.theme) : 'coworking';
    var th = themeObj(theme), s = tile / 64;
    var key = type, v = 0;
    if (type === 'conveyor') key = parseDir(st.dir).x !== 0 ? 'conveyor_h' : 'conveyor_v';
    if (type === 'counter' || type === 'plant') {
      var hsh = A.hash(Math.floor(x / tile) * 17.3 + Math.floor(y / tile) * 5.7);
      v = type === 'counter' ? (hsh < 0.55 ? 0 : hsh < 0.72 ? 1 : hsh < 0.86 ? 2 : 3) : (hsh * 3) | 0;
    }
    if (type === 'meeting_room' && st.joinTop) v = 1;
    var sv = (type === 'counter' || type === 'meeting_room') ? v : 0;
    st._t = t;
    ctx.save();
    ctx.translate(x, y); if (s !== 1) ctx.scale(s, s);
    if (type === 'team_desk') {
      ctx.drawImage(getSprite('team_desk_back', theme, 0), -PADX, -PADT, SW, SH);
      try { LIVE.team_desk_npc(ctx, st, th, t); } catch (e) { /* robustez */ }
    }
    ctx.drawImage(getSprite(key, theme, sv), -PADX, -PADT, SW, SH);
    try { if (LIVE[type]) LIVE[type](ctx, st, th, t, v); } catch (e) { /* robustez */ }
    stateOverlay(ctx, st, type, t);
    if (st.highlight) highlight(ctx, type, t);
    if (st.label) {
      ctx.font = 'bold 9px ' + A.FONT;
      var w = ctx.measureText(String(st.label)).width + 10;
      A.rr(ctx, 32 - w / 2, 76, w, 13, 6); ctx.fillStyle = 'rgba(20,14,40,0.8)'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(st.label), 32, 83);
    }
    if (st.progress != null && isFinite(st.progress)) {
      var col = st.state === 'warning' ? '#ffb02e' : isFire(st) ? '#ff4f4f' : type === 'printer' ? '#4da3ff' : type === 'coffee' ? '#c98a4a' : type === 'minutes' ? '#ffd23f' : type === 'phone' ? '#21c7c1' : type === 'team_desk' ? '#a66cff' : '#3ddc84';
      A.drawProgressBar(ctx, 32, barPos(type), 46, st.progress, col);
    }
    ctx.restore();
  };

  /* ------------------------------------- efecto "reunió feta" (drawRocket) */
  var calSprite = null;
  function getCal() {
    if (calSprite) return calSprite;
    var c = A.canvas(56 * RES, 60 * RES), g = c.getContext('2d');
    g.scale(RES, RES); g.translate(28, 32);
    g.fillStyle = 'rgba(0,0,0,0.25)'; A.rr(g, -20, -20, 44, 46, 6); g.fill();
    A.rr(g, -22, -23, 44, 46, 6); g.fillStyle = '#ffffff'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke();
    g.save(); A.rr(g, -22, -23, 44, 46, 6); g.clip(); g.fillStyle = '#e0302e'; g.fillRect(-22, -23, 44, 12); g.restore();
    g.strokeStyle = OUT; g.lineWidth = 2; g.beginPath(); g.moveTo(-22, -11); g.lineTo(22, -11); g.stroke();
    [-11, 11].forEach(function (rx) { A.rr(g, rx - 2.5, -28, 5, 10, 2); g.fillStyle = '#5d667c'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.2; g.stroke(); });
    A.circle(g, 0, 6, 12); g.fillStyle = '#3ddc84'; g.fill(); g.strokeStyle = '#0d4a28'; g.lineWidth = 2; g.stroke();
    g.strokeStyle = '#fff'; g.lineWidth = 4; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-6, 6); g.lineTo(-1.5, 10.5); g.lineTo(7, 1); g.stroke();
    return (calSprite = c);
  }
  A.drawRocket = function (ctx, x, y, t, progress) {
    x = A.num(x, 0); y = A.num(y, 0); t = A.num(t, 0); var p = A.clamp(A.num(progress, 0), 0, 1);
    ctx.save();
    // anillo de destello inicial
    if (p < 0.35) {
      var q = p / 0.35;
      ctx.strokeStyle = A.rgba('#ffd23f', 1 - q); ctx.lineWidth = 4 * (1 - q) + 1;
      A.circle(ctx, x, y - 30, 10 + q * 50); ctx.stroke();
      A.glow(ctx, x, y - 30, 60, '#ffe27a', 0.5 * (1 - q));
    }
    // post-its que salen disparados
    var cols = ['#ffe066', '#ff9ec7', '#9ee6ff', '#b8ff9e', '#ffb36b'];
    for (var i = 0; i < 14; i++) {
      var a = -PI / 2 + (A.hash(i * 3.7) - 0.5) * 2.6, sp = 90 + A.hash(i * 1.9) * 120;
      var e = A.easeOutCubic(p), px = x + Math.cos(a) * sp * e, py = y - 30 + Math.sin(a) * sp * e + p * p * 80;
      ctx.globalAlpha = Math.min(1, (1 - p) * 3);
      postit(ctx, px, py, 9 + A.hash(i) * 5, cols[i % cols.length], t * (3 + A.hash(i * 5) * 4) + i);
    }
    ctx.globalAlpha = 1;
    // calendario con ✔ que sube
    var pop = p < 0.15 ? A.easeOutBack(p / 0.15) : 1;
    var cy = y - 40 - A.easeOutCubic(p) * 110;
    ctx.globalAlpha = p > 0.75 ? Math.max(0, 1 - (p - 0.75) / 0.25) : 1;
    ctx.translate(x, cy); ctx.scale(pop, pop); ctx.rotate(Math.sin(t * 5) * 0.06);
    A.glow(ctx, 0, 0, 50, '#3ddc84', 0.35);
    ctx.drawImage(getCal(), -28, -32, 56, 60);
    ctx.restore();
  };

  A._initStations = function () {
    var types = Object.keys(BODIES);
    Object.keys(A.THEMES).forEach(function (th) {
      types.forEach(function (ty) { getSprite(ty, th, 0); });
      for (var c = 1; c < 4; c++) getSprite('counter', th, c);
      getSprite('meeting_room', th, 1);
      for (var v = 0; v < 3; v++) getLeaves(v, th);
    });
    getCal();
  };
})(window.OW);
