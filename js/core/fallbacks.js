/* OVERMANAGING — CORE: fallbacks.
 * Se carga DESPUÉS de js/audio.js y js/art/*.js y ANTES del resto del core.
 * Define versiones mínimas SOLO de lo que falte, para que el juego nunca se rompa. */
(function () {
  'use strict';
  var OW = (window.OW = window.OW || {});
  var Art = (OW.Art = OW.Art || {});
  var LANE = { budget: '#ffb02e', plan: '#4da3ff', report: '#3ddc84' };
  function tr(k, p) { try { if (typeof OW.t === 'function') return OW.t(k, p); } catch (e) { /* nada */ } return k; }
  function def(obj, name, fn) { if (typeof obj[name] !== 'function') obj[name] = fn; }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  if (!Art.PLAYER_COLORS) Art.PLAYER_COLORS = ['#ff5d73', '#5db8ff', '#ffd23f', '#9b6bff'];
  def(Art, 'init', function () {});

  var THEME_BG = { startup: '#3b3340', coworking: '#2f4058', consulting: '#3d3b4f', corporate: '#1b2433', quarterclose: '#3a2436' };
  var THEME_FLOOR = { startup: ['#8a8072', '#7f7568'], coworking: ['#c9d3dc', '#bcc7d1'], consulting: ['#a99a86', '#9e8f7b'],
    corporate: ['#46546a', '#3f4c60'], quarterclose: ['#8f7a9c', '#846f91'] };

  def(Art, 'drawBackground', function (ctx, theme) {
    ctx.fillStyle = THEME_BG[theme] || THEME_BG.coworking;
    ctx.fillRect(0, 0, 1280, 720);
  });
  def(Art, 'drawFloor', function (ctx, theme, cols, rows, ox, oy, tile) {
    var c = THEME_FLOOR[theme] || THEME_FLOOR.coworking;
    for (var r = 0; r < rows; r++) for (var q = 0; q < cols; q++) {
      ctx.fillStyle = c[(r + q) & 1];
      ctx.fillRect(ox + q * tile, oy + r * tile, tile, tile);
    }
  });
  def(Art, 'drawProgressBar', function (ctx, cx, cy, w, p, color) {
    p = Math.max(0, Math.min(1, p || 0));
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; rr(ctx, cx - w / 2 - 2, cy - 5, w + 4, 10, 4); ctx.fill();
    ctx.fillStyle = color || '#5cff8a'; rr(ctx, cx - w / 2, cy - 3, Math.max(2, w * p), 6, 3); ctx.fill();
  });
  var ST_COL = { counter: '#b9895a', src_budget: LANE.budget, src_plan: LANE.plan, src_report: LANE.report, desk: '#8d6e63',
    printer: '#607d8b', approval: '#26a69a', folder_stack: '#ab47bc', meeting_room: '#ef5350', minutes: '#7e57c2', shredder: '#546e7a',
    coffee: '#6d4c41', conveyor: '#455a64', wall: '#5d5468', plant: '#4caf50', bookshelf: '#6d4c41', whiteboard: '#eceff1',
    phone: '#37474f', team_desk: '#a1887f' };
  // pictogramas (sin texto en idioma)
  var ST_LBL = { src_budget: '€', src_plan: '▤', src_report: '◔', desk: '⌨', printer: '⎙', approval: '✍',
    folder_stack: '▦', meeting_room: '◎', minutes: '✎', shredder: '✂', coffee: '☕', phone: '☎', team_desk: '☺' };
  def(Art, 'drawStation', function (ctx, st, x, y, tile) {
    st = st || {}; tile = tile || 64;
    var col = ST_COL[st.type] || '#999';
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x, y + 14, tile, tile);
    ctx.fillStyle = shade(col, -0.35); ctx.fillRect(x, y + tile - 14, tile, 14);
    ctx.fillStyle = col; ctx.fillRect(x, y, tile, tile - 14);
    if (st.type === 'conveyor' && st.dir) {
      ctx.strokeStyle = '#ffeb3b'; ctx.lineWidth = 3; ctx.beginPath();
      var cx = x + tile / 2, cy = y + tile / 2 - 7;
      ctx.moveTo(cx - st.dir.x * 14 - st.dir.y * 10, cy - st.dir.y * 14 - st.dir.x * 10);
      ctx.lineTo(cx + st.dir.x * 14, cy + st.dir.y * 14);
      ctx.lineTo(cx - st.dir.x * 14 + st.dir.y * 10, cy - st.dir.y * 14 + st.dir.x * 10); ctx.stroke();
    }
    if (st.state === 'warning') { ctx.fillStyle = 'rgba(255,60,0,0.45)'; ctx.fillRect(x, y, tile, tile - 14); }
    if (st.state === 'blocked') { ctx.fillStyle = 'rgba(220,0,80,0.3)'; ctx.fillRect(x, y, tile, tile - 14); }
    if (st.type === 'phone' && st.ringing) {
      var wob = Math.sin(Date.now() / 40) * 3;
      ctx.fillStyle = '#ff5252'; ctx.beginPath(); ctx.arc(x + tile / 2 + wob, y + 10, 7, 0, Math.PI * 2); ctx.fill();
    }
    if (st.type === 'team_desk' && st.npc) {
      ctx.fillStyle = st.npc.color || '#ffcc80'; ctx.beginPath(); ctx.arc(x + tile / 2, y + 14, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(st.npc.name || '', x + tile / 2, y - 2);
      if (st.wants) { ctx.fillStyle = '#ffeb3b'; ctx.fillRect(x + tile / 2 + 10, y - 4, 5, 16); }
    }
    if (st.type === 'meeting_room' && st.busy > 0) { ctx.fillStyle = 'rgba(255,235,59,' + (0.4 * st.busy) + ')'; ctx.fillRect(x, y, tile, tile - 14); }
    var lbl = st.label || ST_LBL[st.type];
    if (lbl) { ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(lbl, x + tile / 2, y + tile - 4); }
    if (st.highlight) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeRect(x + 2, y + 2, tile - 4, tile - 18); }
    if (st.progress != null) Art.drawProgressBar(ctx, x + tile / 2, y - 6, tile - 12, st.progress);
  });
  var IT_COL = { brief: '#fff8e1', draft: '#e3f2fd', printout: '#ffffff', approved: '#c8e6c9', burnt: '#212121', dossier: '#ffcc80',
    dossier_minutes: '#a1887f', extinguisher: '#e53935' };
  var IT_GLYPH = { brief: '✉', draft: '✎', printout: '⎙', approved: '✔', burnt: '✖', dossier: '▦', dossier_minutes: '✎', extinguisher: '!' };
  def(Art, 'drawItem', function (ctx, item, cx, cy, scale) {
    if (!item) return; scale = scale || 1;
    var s = 18 * scale;
    ctx.fillStyle = IT_COL[item.kind] || '#ccc';
    ctx.strokeStyle = item.lane ? LANE[item.lane] : '#333'; ctx.lineWidth = 3;
    if (item.kind === 'extinguisher') { rr(ctx, cx - s * 0.4, cy - s, s * 0.8, s * 2, 5); }
    else rr(ctx, cx - s, cy - s * 0.8, s * 2, s * 1.6, 4);
    ctx.fill(); ctx.stroke();
    var c = item.contents || [];
    for (var i = 0; i < c.length; i++) { ctx.fillStyle = LANE[c[i]] || '#fff'; ctx.fillRect(cx - s + 4 + i * 11 * scale, cy - 5 * scale, 9 * scale, 9 * scale); }
    ctx.fillStyle = item.kind === 'burnt' ? '#fff' : '#222';
    ctx.font = 'bold ' + Math.round(9 * scale) + 'px sans-serif'; ctx.textAlign = 'center';
    if (!c.length) ctx.fillText(IT_GLYPH[item.kind] || '?', cx, cy + 3 * scale);
  });
  def(Art, 'drawCharacter', function (ctx, p) {
    p = p || {}; var x = p.x || 0, y = p.y || 0;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x, y, 18, 7, 0, 0, Math.PI * 2); ctx.fill();
    if (p.selected) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, 24, 10, 0, 0, Math.PI * 2); ctx.stroke(); }
    var bob = p.moving ? Math.abs(Math.sin((p.walkPhase || 0))) * 3 : 0;
    ctx.fillStyle = Art.PLAYER_COLORS[(p.colorIndex || 0) % Art.PLAYER_COLORS.length];
    rr(ctx, x - 14, y - 36 - bob, 28, 32, 8); ctx.fill();
    ctx.fillStyle = '#f2c9a0'; ctx.beginPath(); ctx.arc(x, y - 46 - bob, 12, 0, Math.PI * 2); ctx.fill();
    var d = p.dir || { x: 0, y: 1 };
    ctx.fillStyle = '#222'; ctx.fillRect(x + d.x * 5 - 5, y - 48 - bob + d.y * 2, 3, 3); ctx.fillRect(x + d.x * 5 + 2, y - 48 - bob + d.y * 2, 3, 3);
    if (p.action === 'stunned') { ctx.fillStyle = '#ffeb3b'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('* * *', x, y - 64); }
    if ((p.energy != null ? p.energy : 1) < 0.1) { ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('zzz', x + 16, y - 60); }
  });
  def(Art, 'drawBug', function (ctx, bug) {
    bug = bug || {}; var s = 1 - (bug.squashed || 0) * 0.6;
    ctx.save(); ctx.translate(bug.x || 0, bug.y || 0); ctx.rotate(bug.angle || 0); ctx.scale(1, s);
    // notificación: sobre rojo con "!"
    ctx.rotate(-(bug.angle || 0) + Math.sin((bug.phase || 0) * 0.5) * 0.2);
    ctx.fillStyle = '#e53950'; rr(ctx, -11, -8, 22, 16, 3); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-11, -8); ctx.lineTo(0, 1); ctx.lineTo(11, -8); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', 8, -6);
    ctx.restore();
  });
  def(Art, 'drawManager', function (ctx, npc) {
    npc = npc || {}; var x = npc.x || 0, y = npc.y || 0;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x, y, 18, 7, 0, 0, Math.PI * 2); ctx.fill();
    // CEO: traje oscuro, chaleco de plumas y gafas de sol
    ctx.fillStyle = '#212121'; rr(ctx, x - 15, y - 38, 30, 34, 8); ctx.fill();
    ctx.fillStyle = '#546e7a'; rr(ctx, x - 11, y - 36, 22, 22, 6); ctx.fill();
    ctx.fillStyle = '#e0b48a'; ctx.beginPath(); ctx.arc(x, y - 48, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.fillRect(x - 9, y - 51, 18, 4);
    if (npc.talking && npc.text) {
      ctx.font = 'bold 13px sans-serif'; var w = ctx.measureText(npc.text).width + 16;
      ctx.fillStyle = '#fff'; rr(ctx, x - w / 2, y - 92, w, 26, 8); ctx.fill();
      ctx.fillStyle = '#222'; ctx.textAlign = 'center'; ctx.fillText(npc.text, x, y - 74);
    }
  });
  def(Art, 'drawFire', function (ctx, x, y, tile, intensity, t) {
    tile = tile || 64; intensity = intensity == null ? 1 : intensity; t = t || 0;
    for (var i = 0; i < 5; i++) {
      var fx = x + tile * (0.2 + i * 0.15), h = (18 + 14 * Math.sin(t * 9 + i * 2)) * intensity + 8;
      ctx.fillStyle = i & 1 ? 'rgba(255,200,0,0.85)' : 'rgba(255,80,0,0.85)';
      ctx.beginPath(); ctx.moveTo(fx - 8, y + tile - 18); ctx.quadraticCurveTo(fx, y + tile - 18 - h * 2, fx + 8, y + tile - 18); ctx.fill();
    }
  });
  def(Art, 'drawOrderCard', function (ctx, o, x, y, w, h, t) {
    o = o || {}; var e = o.entering == null ? 1 : o.entering;
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, e)); ctx.translate(0, (1 - e) * -40);
    ctx.fillStyle = o.flash > 0 && Math.sin((t || 0) * 30) > 0 ? '#ffcdd2' : '#fffde7'; rr(ctx, x, y, w, h, 8); ctx.fill();
    var nm = o.nameKey ? tr(o.nameKey, o.nameParams) : (o.name || '');
    ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(nm, x + 10, y + 24, w - 20);
    var l = o.lanes || [];
    if (o.kind === 'call' || o.kind === 'one2one') {
      ctx.fillStyle = o.kind === 'call' ? '#37474f' : '#a1887f'; rr(ctx, x + 10, y + 36, 30, 30, 15); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(o.kind === 'call' ? '☎' : '☺', x + 25, y + 58);
    }
    for (var i = 0; i < l.length; i++) { ctx.fillStyle = LANE[l[i]]; rr(ctx, x + 10 + i * 36, y + 36, 30, 30, 6); ctx.fill(); }
    var f = o.timeTotal ? Math.max(0, o.timeLeft / o.timeTotal) : 0;
    ctx.fillStyle = '#ddd'; ctx.fillRect(x + 8, y + h - 16, w - 16, 8);
    ctx.fillStyle = 'hsl(' + Math.round(f * 120) + ',80%,45%)'; ctx.fillRect(x + 8, y + h - 16, (w - 16) * f, 8);
    ctx.restore();
  });
  def(Art, 'drawIcon', function (ctx, name, cx, cy, size) {
    size = size || 24; var r = size / 2;
    var col = { budget: LANE.budget, plan: LANE.plan, report: LANE.report, coffee: '#795548', star: '#ffd600', star_empty: '#555',
      clock: '#eceff1', coin: '#ffc107', bug: '#e53950', mail: '#e53950', fire: '#ff5722', rocket: '#eceff1', key: '#ffca28',
      phone: '#37474f', calendar: '#ef5350', one2one: '#a1887f', globe: '#4da3ff' }[name] || '#fff';
    ctx.fillStyle = col;
    if (name === 'star' || name === 'star_empty') {
      ctx.beginPath();
      for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rad = i & 1 ? r * 0.45 : r; ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); }
      ctx.closePath(); ctx.fill();
    } else { ctx.beginPath(); ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2); ctx.fill(); }
  });
  def(Art, 'drawLogo', function (ctx, cx, cy, scale, t) {
    scale = scale || 1; ctx.save(); ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.rotate(Math.sin((t || 0) * 2) * 0.02);
    ctx.font = '900 84px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1a1033'; ctx.fillText('OVERMANAGING', 4, 6);
    ctx.fillStyle = '#ffd23f'; ctx.fillText('OVERMANAGING', 0, 0); ctx.restore(); ctx.textBaseline = 'alphabetic';
  });
  def(Art, 'drawMenuBackground', function (ctx, t) {
    var g = ctx.createLinearGradient(0, 0, 0, 720); g.addColorStop(0, '#2b1b4a'); g.addColorStop(1, '#0f3a5a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (var i = 0; i < 20; i++) { var y = ((i * 97 + (t || 0) * 30) % 760) - 20; ctx.fillRect((i * 173) % 1280, y, 60, 4); }
  });
  def(Art, 'drawLighting', function (ctx, lights, darkness) {
    if (!(darkness > 0)) return;
    var c = Art._fbLight || (Art._fbLight = document.createElement('canvas'));
    c.width = 1280; c.height = 720; var g = c.getContext('2d');
    g.fillStyle = 'rgba(5,5,20,' + darkness + ')'; g.fillRect(0, 0, 1280, 720);
    g.globalCompositeOperation = 'destination-out';
    (lights || []).forEach(function (l) {
      var gr = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r || 60);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(l.x, l.y, l.r || 60, 0, Math.PI * 2); g.fill();
    });
    g.globalCompositeOperation = 'source-over';
    ctx.drawImage(c, 0, 0);
  });
  def(Art, 'drawPanel', function (ctx, x, y, w, h, opts) {
    opts = opts || {};
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; rr(ctx, x + 4, y + 6, w, h, 14); ctx.fill();
    ctx.fillStyle = opts.color || '#fff8ec'; rr(ctx, x, y, w, h, 14); ctx.fill();
    ctx.strokeStyle = opts.border || '#2b1b4a'; ctx.lineWidth = 4; ctx.stroke();
    if (opts.title) { ctx.fillStyle = '#2b1b4a'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(opts.title, x + w / 2, y + 40); }
  });
  def(Art, 'drawButton', function (ctx, x, y, w, h, label, focused, t) {
    var bob = focused ? Math.sin((t || 0) * 6) * 2 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; rr(ctx, x + 3, y + 5, w, h, 12); ctx.fill();
    ctx.fillStyle = focused ? '#ffd23f' : '#fff8ec'; rr(ctx, x, y + bob, w, h, 12); ctx.fill();
    ctx.strokeStyle = '#2b1b4a'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#2b1b4a'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, y + h / 2 + bob + 1); ctx.textBaseline = 'alphabetic';
  });
  /* Efecto de "reunión cumplida" (antes cohete): un calendario con ✔ que sube y se desvanece. */
  def(Art, 'drawRocket', function (ctx, x, y, t, progress) {
    progress = progress || 0; var yy = y - progress * 120;
    ctx.save(); ctx.globalAlpha = 1 - Math.max(0, progress - 0.7) / 0.3;
    ctx.fillStyle = '#ffffff'; rr(ctx, x - 14, yy - 14, 28, 28, 4); ctx.fill();
    ctx.fillStyle = '#ef5350'; ctx.fillRect(x - 14, yy - 14, 28, 8);
    ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 4; ctx.beginPath();
    ctx.moveTo(x - 7, yy + 3); ctx.lineTo(x - 1, yy + 9); ctx.lineTo(x + 9, yy - 3); ctx.stroke();
    ctx.restore();
  });

  function shade(hex, f) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    var k = f < 0 ? 0 : 255, a = Math.abs(f);
    return 'rgb(' + Math.round((k - r) * a + r) + ',' + Math.round((k - g) * a + g) + ',' + Math.round((k - b) * a + b) + ')';
  }

  /* ---- FX ---- */
  var FX = (OW.FX = OW.FX || {});
  if (typeof FX.spawn !== 'function' || typeof FX.update !== 'function' || typeof FX.draw !== 'function') {
    var parts = [];
    var COL = { sparks: '#ffeb3b', smoke: 'rgba(90,90,90,0.6)', confetti: null, glyphs: '#7cff9b', steam: 'rgba(255,255,255,0.5)',
      coins: '#ffc107', foam: '#e3f2fd', zzz: '#fff', dust: 'rgba(200,190,170,0.6)' };
    FX.spawn = function (type, x, y, opts) {
      opts = opts || {};
      if (type === 'text') { parts.push({ type: type, x: x, y: y, vx: 0, vy: -40, life: opts.life || 1.3, max: opts.life || 1.3, text: opts.text || '', color: opts.color || '#fff', size: opts.size || 22 }); return; }
      var n = opts.count || (type === 'confetti' ? 30 : 8);
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, s = 30 + Math.random() * 120;
        parts.push({ type: type, x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: 0.6 + Math.random() * 0.6, max: 1.2,
          color: COL[type] || ('hsl(' + Math.floor(Math.random() * 360) + ',90%,60%)'),
          text: type === 'glyphs' ? '€%✓§#@+=*'.charAt(Math.floor(Math.random() * 9)) : type === 'zzz' ? 'z' : null });
      }
    };
    FX.update = function (dt) {
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.type !== 'text') p.vy += 60 * dt;
        if (p.life <= 0) parts.splice(i, 1);
      }
    };
    FX.draw = function (ctx) {
      ctx.save();
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i]; ctx.globalAlpha = Math.max(0, Math.min(1, p.life / (p.max * 0.5)));
        if (p.text) {
          ctx.font = 'bold ' + (p.size || 14) + 'px sans-serif'; ctx.textAlign = 'center';
          if (p.type === 'text') { ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.strokeText(p.text, p.x, p.y); }
          ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, p.y);
        } else { ctx.fillStyle = p.color; ctx.fillRect(p.x - 3, p.y - 3, 6, 6); }
      }
      ctx.restore();
    };
    FX.clear = function () { parts.length = 0; };
  } else def(FX, 'clear', function () {});

  /* ---- AUDIO (silencioso) ---- */
  var A = (OW.Audio = OW.Audio || {});
  ['init', 'play', 'startMusic', 'stopMusic', 'setIntensity', 'setVolume', 'mute'].forEach(function (n) { def(A, n, function () {}); });
})();
