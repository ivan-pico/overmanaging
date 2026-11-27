/* OVERMANAGING — UI: HUD de partida (agenda de citas, reloj de oficina, puntuación, energía, tutorial, avisos).
 * Los textos se traducen al dibujar (OW.t), así que el cambio de idioma en caliente se ve al instante. */
(function () {
  'use strict';
  var OW = window.OW, C = OW.C, U = OW.U;
  var CARD_W = 168, CARD_H = 104, CARD_GAP = 8;
  var DAY_START = 9 * 60, DAY_END = 18 * 60; // jornada de oficina: 9:00 → 18:00

  function tr(key, params) { return OW.t ? OW.t(key, params) : key; }
  function has(key) { return !!(OW.I18N && OW.I18N.has && OW.I18N.has(key)); }
  function num(v, d) { return typeof v === 'number' && isFinite(v) ? v : d; }
  /* Texto de un objeto que puede traer clave i18n (xKey/xParams) o el texto ya hecho (x). */
  function txt(o, field) {
    if (!o) return '';
    var k = o[field + 'Key'];
    if (k && has(k)) return tr(k, o[field + 'Params']);
    return o[field] != null ? String(o[field]) : '';
  }

  function orderName(o) {
    if (o.nameKey) return tr(o.nameKey, o.nameParams);
    return o.name || '';
  }

  function drawOrders(ctx, g, t, dt) {
    var A = OW.Art, orders = g.orders || [];
    for (var i = 0; i < orders.length; i++) {
      var o = orders[i];
      var tx = 16 + i * (CARD_W + CARD_GAP);
      if (o.drawX == null) o.drawX = tx + 40;
      o.drawX = U.lerp(o.drawX, tx, Math.min(1, dt * 10));
      var enter = o.done ? U.clamp(num(o.removing, 0) / 0.5, 0, 1) : U.easeOutBack(U.clamp(num(o.entering, 1), 0, 1));
      var y = 8;
      var left = num(o.timeLeft, num(o.time, 0)), total = num(o.timeTotal, num(o.maxTime, Math.max(1, left)));
      ctx.save();
      if (o.done && o.delivered) { y -= (1 - enter) * 30; }
      if (o.done && o.failed) { ctx.translate(Math.sin(t * 60) * 4 * enter, 0); }
      A.drawOrderCard(ctx, {
        id: o.id, task: o.task || o.key, kind: o.kind || 'dossier', name: orderName(o), nameKey: o.nameKey, nameParams: o.nameParams,
        target: o.target, lanes: o.lanes || [], timeLeft: left, timeTotal: total, time: left, maxTime: total,
        flash: o.flash, entering: enter, delivered: !!o.delivered, failed: !!o.failed, value: o.value
      }, o.drawX, y, CARD_W, CARD_H, t, { lang: OW.I18N && OW.I18N.lang });
      ctx.restore();
    }
  }

  /* Hora de oficina simulada: la duración del nivel se reparte entre las 9:00 y las 18:00. */
  function officeClock(g) {
    var total = num(g.duration, num(g.level && g.level.duration, 0));
    if (!(total > 0)) total = Math.max(1, num(g.timeLeft, 0) + num(g.t, 0));
    var frac = U.clamp(1 - num(g.timeLeft, 0) / total, 0, 1);
    var mins = Math.floor(DAY_START + frac * (DAY_END - DAY_START));
    if (num(g.timeLeft, 0) <= 0) mins = DAY_END;
    var h = Math.floor(mins / 60), m = mins % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function drawRight(ctx, g, t) {
    var A = OW.Art;
    // reloj de oficina
    var low = g.timeLeft < 30;
    A.drawPanel(ctx, 902, 8, 128, 62, { color: low ? '#ffe1e1' : '#fff8ec', alpha: 0.96, radius: 14 });
    var pulse = low ? 1 + Math.max(0, Math.sin(t * 8)) * 0.12 : 1;
    A.drawIcon(ctx, 'clock', 922, 42, 22);
    ctx.save(); ctx.translate(980, 50); ctx.scale(pulse, pulse);
    U.text(ctx, officeClock(g), 0, 0, { size: 25, color: low ? '#d62828' : '#2b1b4a', font: C.MONO });
    ctx.restore();
    U.text(ctx, tr('ui.hud.clock') + ' 9–18', 980, 22, { size: 10, color: '#7a6a90' });
    U.text(ctx, tr('ui.hud.left', { t: U.fmtTime(g.timeLeft) }), 980, 64, { size: 10, color: low ? '#d62828' : '#7a6a90', weight: 'normal' });

    // puntuación + estrellas conseguidas
    A.drawPanel(ctx, 1038, 8, 150, 62, { color: '#fff8ec', alpha: 0.96, radius: 14 });
    var bump = 1 + num(g.scoreBump, 0) * 0.25;
    A.drawIcon(ctx, 'coin', 1062, 44, 26 * bump);
    ctx.save(); ctx.translate(1128, 56); ctx.scale(bump, bump);
    U.text(ctx, g.score + '€', 0, 0, { size: 26, color: '#2b1b4a' });
    ctx.restore();
    var stars = g.starsEarned();
    for (var s = 0; s < 3; s++) A.drawIcon(ctx, s < stars ? 'star' : 'star_empty', 1106 + s * 22, 22, 17);

    // energía (café) de cada PM
    A.drawPanel(ctx, 1196, 8, 76, 62, { color: '#2a2152', alpha: 0.92, radius: 14 });
    for (var i = 0; i < g.players.length; i++) {
      var p = g.players[i], x = 1204, y = 14 + i * 28;
      var sel = g.solo && i === g.active;
      var col = A.PLAYER_COLORS[(p.colorIndex || 0) % A.PLAYER_COLORS.length];
      if (sel) { ctx.fillStyle = 'rgba(255,210,63,0.28)'; U.roundRect(ctx, x - 4, y - 1, 68, 24, 8); ctx.fill(); }
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + 9, y + 11, 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = sel ? '#ffd23f' : '#fff'; ctx.lineWidth = 2; ctx.stroke();
      U.text(ctx, g.solo ? String(p.name || '?').charAt(0) : String(i + 1), x + 9, y + 16, { size: 12, color: '#fff', stroke: 'rgba(0,0,0,0.45)', strokeWidth: 3 });
      var e = num(p.energy, 1), ec = e < 0.1 ? '#ff4d4d' : e < 0.3 ? '#ffb02e' : '#5cff8a';
      var blink = e < 0.1 && Math.sin(t * 10) > 0;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; U.roundRect(ctx, x + 22, y + 6, 40, 10, 5); ctx.fill();
      ctx.fillStyle = blink ? '#fff' : ec; U.roundRect(ctx, x + 22, y + 6, Math.max(6, 40 * e), 10, 5); ctx.fill();
      A.drawIcon(ctx, 'coffee', x + 58, y + 5, 12);
    }
    if (g.solo) U.text(ctx, tr('ui.hud.switch'), 1087, 716, { size: 12, color: 'rgba(255,255,255,0.8)', stroke: 'rgba(0,0,0,0.6)', strokeWidth: 3 });
  }

  function drawTutorial(ctx, g, t) {
    var text = g.tutorialText ? g.tutorialText() : null;
    if (!text) return;
    var w = 940, x = 640 - w / 2, y = 584;
    var a = U.clamp(num(g.tutorial && g.tutorial.t, 1) * 3, 0, 1);
    for (var i = 0; i < g.players.length; i++) if (g.players[i].y > y - 10 && g.players[i].y < y + 110) a = Math.min(a, 0.35);
    var steps = (OW.Game && OW.Game.TUTORIAL && OW.Game.TUTORIAL.length) || 0;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(20,12,40,0.88)'; U.roundRect(ctx, x, y, w, 50, 14); ctx.fill();
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.stroke();
    U.text(ctx, tr('ui.hud.tutorial', { n: (g.tutorial ? g.tutorial.step : 0) + 1, total: steps }), x + 16, y + 20, { size: 12, align: 'left', color: '#ffd23f' });
    var fs = 17;
    ctx.font = 'bold ' + fs + 'px ' + C.FONT;
    while (ctx.measureText(text).width > w - 32 && fs > 11) { fs--; ctx.font = 'bold ' + fs + 'px ' + C.FONT; }
    U.text(ctx, text, x + 16, y + 40, { size: fs, align: 'left', color: '#fff' });
    if (g.solo && g.tutorial && g.tutorial.step === 0) U.text(ctx, tr('ui.hud.tut_switch'), x + w - 16, y + 20, { size: 12, align: 'right', color: '#9fe8ff' });
    ctx.restore();
  }

  function drawBanner(ctx, g) {
    var b = g.banner;
    if (!b) return;
    var dur = num(b.dur, 2), bt = num(b.t, 0);
    var k = bt < 0.3 ? U.easeOutBack(bt / 0.3) : bt > dur - 0.3 ? U.clamp((dur - bt) / 0.3, 0, 1) : 1;
    var main = txt(b, 'text'), sub = txt(b, 'sub');
    ctx.save(); ctx.globalAlpha = U.clamp(k, 0, 1);
    ctx.translate(640, 380); ctx.scale(k, k);
    U.text(ctx, main, 0, 0, { size: 64, color: '#ffd23f', stroke: '#2b1b4a', strokeWidth: 10 });
    if (sub) U.text(ctx, sub, 0, 40, { size: 22, color: '#fff', stroke: '#2b1b4a', strokeWidth: 6 });
    ctx.restore();
  }

  OW.HUD = {
    officeClock: officeClock,
    draw: function (ctx, g, t, dt) {
      ctx.save();
      var band = ctx.createLinearGradient(0, 0, 0, 112);
      band.addColorStop(0, 'rgba(15,10,30,0.45)'); band.addColorStop(1, 'rgba(15,10,30,0)');
      ctx.fillStyle = band; ctx.fillRect(0, 0, C.W, 112);
      drawOrders(ctx, g, t, dt || 1 / 60);
      drawRight(ctx, g, t);
      drawTutorial(ctx, g, t);
      drawBanner(ctx, g);
      ctx.restore();
    }
  };
})();
