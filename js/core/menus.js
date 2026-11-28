/* OVERMANAGING — UI: pantallas (título, menú, opciones, controles, créditos, roadmap de niveles, intro, pausa, fin, resultados).
 * Todos los textos pasan por OW.t (claves ui.* en js/i18n/strings_ui.js) y se traducen AL DIBUJAR,
 * así un cambio de idioma en caliente se ve al instante. */
(function () {
  'use strict';
  var OW = window.OW, C = OW.C, U = OW.U;
  var S = (OW.Screens = {});

  /* ---------- Ayudas de i18n defensivas ---------- */
  function tr(key, params) { return OW.t ? OW.t(key, params) : key; }
  function has(key) { return !!(OW.I18N && OW.I18N.has && OW.I18N.has(key)); }
  function lbl(key) { return function () { return tr(key); }; }
  /* Campo de texto de un nivel: L.<campo>Key → 'lvl.N.<campo>' → L.<campo> → alternativa. */
  function lvText(L, field, alt) {
    if (!L) return alt || '';
    var k = L[field + 'Key'];
    if (k && has(k)) return tr(k, L[field + 'Params']);
    k = 'lvl.' + L.id + '.' + field;
    if (has(k)) return tr(k);
    if (L[field] != null && L[field] !== '') return String(L[field]);
    return alt != null ? alt : '';
  }
  function lvName(L) { return lvText(L, 'name', L ? tr('ui.lv.level', { n: L.id }) : ''); }
  function lvSprint(L) { return lvText(L, 'sprint', tr('ui.lv.sprint', { n: L ? L.id : 1 })); }
  function lvTicket(L) { return lvText(L, 'ticket', 'PRJ-' + (100 + (L ? L.id : 0))); }
  function lvMotto(L) { return lvText(L, 'motto', L ? (L.commit || '') : ''); }
  /* Nombre/descripción de dificultad: claves de CORE diff.<i>.name/desc (strings_core.js); si no, el campo del objeto. */
  function diffText(D, field) {
    var i = OW.DIFFICULTIES.indexOf(D);
    if (has('diff.' + i + '.' + field)) return tr('diff.' + i + '.' + field);
    return (D && D[field]) || '';
  }
  function diffName(D) { return diffText(D, 'name'); }
  function diffDesc(D) { return diffText(D, 'desc'); }
  OW.UIText = { lvName: lvName, lvText: lvText, diffName: diffName, diffDesc: diffDesc };

  /* ---------- Selector de idioma (CA | ES) ---------- */
  function langs() { return (OW.I18N && OW.I18N.LANGS) || [{ id: 'ca', name: 'Català' }, { id: 'es', name: 'Castellano' }]; }
  function curLang() { return (OW.I18N && OW.I18N.lang) || 'ca'; }
  function langName(id) { var L = langs(); for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i].name; return id; }
  function setLang(id) {
    if (!OW.I18N || id === curLang()) return;
    OW.I18N.setLang(id);
    OW.sfx('ui_move');
    if (OW.App) OW.App.toast = { text: tr('ui.lang.toast', { lang: langName(id) }), t: 1.4 };
  }
  function cycleLang(d) {
    var L = langs(), i = 0;
    for (var k = 0; k < L.length; k++) if (L[k].id === curLang()) i = k;
    setLang(L[(i + (d || 1) + L.length) % L.length].id);
  }
  /* Pastilla clicable en la esquina superior derecha. */
  var LT = { x: 1106, y: 18, w: 156, h: 40 };
  function drawGlobe(ctx, cx, cy, r) {
    ctx.save();
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.45, r, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
    ctx.moveTo(cx - r * 0.85, cy - r * 0.5); ctx.lineTo(cx + r * 0.85, cy - r * 0.5);
    ctx.moveTo(cx - r * 0.85, cy + r * 0.5); ctx.lineTo(cx + r * 0.85, cy + r * 0.5); ctx.stroke();
    ctx.restore();
  }
  var LangToggle = {
    hitHalf: function () {
      var I = OW.Input, m = I.mouse;
      if (m.x < LT.x || m.x > LT.x + LT.w || m.y < LT.y || m.y > LT.y + LT.h) return null;
      return m.x < LT.x + 34 + (LT.w - 34) / 2 ? 0 : 1;
    },
    /* Devuelve true si ha consumido la entrada (tecla L, Y del mando o clic en la pastilla). */
    update: function (padY) {
      var I = OW.Input;
      if (I.wasPressed('KeyL')) { cycleLang(1); return true; }
      if (padY) {
        for (var p = 0; p < (I.padCount ? I.padCount() : 0); p++) { var pd = I.pad(p); if (pd && pd.pressed && pd.pressed.y) { cycleLang(1); return true; } }
      }
      if (I.mouse.clicked) {
        var h = this.hitHalf();
        if (h != null) { setLang(langs()[h] ? langs()[h].id : 'ca'); return true; }
      }
      return false;
    },
    draw: function (ctx, t) {
      var hover = this.hitHalf() != null;
      ctx.save();
      ctx.fillStyle = hover ? 'rgba(43,27,74,0.95)' : 'rgba(22,16,46,0.82)';
      U.roundRect(ctx, LT.x, LT.y, LT.w, LT.h, LT.h / 2); ctx.fill();
      ctx.strokeStyle = hover ? '#ffd23f' : 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.stroke();
      drawGlobe(ctx, LT.x + 21, LT.y + LT.h / 2, 10);
      var L = langs(), half = (LT.w - 40) / 2;
      for (var i = 0; i < L.length && i < 2; i++) {
        var on = L[i].id === curLang(), cx = LT.x + 38 + half * i + half / 2;
        if (on) { ctx.fillStyle = '#ffd23f'; U.roundRect(ctx, cx - half / 2 + 2, LT.y + 6, half - 4, LT.h - 12, (LT.h - 12) / 2); ctx.fill(); }
        U.text(ctx, L[i].id.toUpperCase(), cx, LT.y + LT.h / 2 + 6, { size: 17, color: on ? '#1a1033' : '#cfc6ef' });
      }
      U.text(ctx, '|', LT.x + 38 + half, LT.y + LT.h / 2 + 6, { size: 16, color: 'rgba(255,255,255,0.35)', weight: 'normal' });
      U.text(ctx, tr('ui.lang.hint'), LT.x + LT.w / 2 + 14, LT.y + LT.h + 16, { size: 12, color: 'rgba(255,255,255,0.6)', weight: 'normal' });
      ctx.restore();
      void t;
    }
  };
  OW.LangToggle = LangToggle;
  OW.cycleLang = cycleLang;

  /* ---------- Lista de botones reutilizable (teclado + mando + ratón) ---------- */
  function ButtonList(items, x, y, w, h, gap) {
    this.items = items; this.focus = 0;
    this.rects = items.map(function (it, i) { return { x: x, y: y + i * (h + gap), w: w, h: h }; });
  }
  ButtonList.prototype.hit = function () {
    var I = OW.Input;
    for (var i = 0; i < this.rects.length; i++) {
      var r = this.rects[i];
      if (I.mouse.x >= r.x && I.mouse.x <= r.x + r.w && I.mouse.y >= r.y && I.mouse.y <= r.y + r.h) return i;
    }
    return -1;
  };
  ButtonList.prototype.update = function (m) {
    var I = OW.Input, n = this.items.length;
    if (m.up) { this.focus = (this.focus + n - 1) % n; OW.sfx('ui_move'); }
    if (m.down) { this.focus = (this.focus + 1) % n; OW.sfx('ui_move'); }
    var hit = this.hit();
    if (I.mouse.moved && hit >= 0 && hit !== this.focus) { this.focus = hit; OW.sfx('ui_move'); }
    if (m.confirm || (I.mouse.clicked && hit >= 0)) {
      if (hit >= 0 && I.mouse.clicked) this.focus = hit;
      var it = this.items[this.focus];
      if (it.disabled) { OW.sfx('wrong'); return; }
      OW.sfx('ui_select');
      it.action();
    }
  };
  ButtonList.prototype.draw = function (ctx, t) {
    for (var i = 0; i < this.items.length; i++) {
      var r = this.rects[i], it = this.items[i];
      ctx.save();
      if (it.disabled) ctx.globalAlpha = 0.45;
      OW.Art.drawButton(ctx, r.x, r.y, r.w, r.h, typeof it.label === 'function' ? it.label() : it.label, i === this.focus, t);
      ctx.restore();
    }
  };
  OW.ButtonList = ButtonList;

  function footer(ctx, txt) {
    U.text(ctx, txt, 640, 700, { size: 15, color: 'rgba(255,255,255,0.75)' });
  }

  /* ---------- Título ---------- */
  S.title = {
    enter: function () { this.t = 0; },
    update: function (dt) {
      this.t += dt;
      if (LangToggle.update(true)) return;
      if (OW.Input.anyPressed() && this.t > 0.3) {
        try { OW.Audio.init(); } catch (e) { /* nada */ }
        OW.Save.applyVolume();
        OW.sfx('ui_select');
        OW.App.go('menu');
      }
    },
    draw: function (ctx, t) {
      OW.Art.drawMenuBackground(ctx, t);
      OW.Art.drawLogo(ctx, 640, 270, 1.1, t);
      U.text(ctx, tr('ui.title.subtitle'), 640, 380, { size: 22, color: '#fff', stroke: 'rgba(0,0,0,0.5)', strokeWidth: 5 });
      if (Math.sin(t * 4) > -0.3) U.text(ctx, tr('ui.title.press'), 640, 520, { size: 30, color: '#ffd23f', stroke: '#2b1b4a', strokeWidth: 7 });
      U.text(ctx, tr('ui.title.version'), 640, 682, { size: 15, color: 'rgba(255,255,255,0.75)' });
      U.text(ctx, 'Ivan Picó  ·  ivanpico.com  ·  gohan.cat', 640, 706, { size: 14, color: 'rgba(255,210,63,0.85)' });
      LangToggle.draw(ctx, t);
    }
  };

  /* ---------- Menú principal ---------- */
  S.menu = {
    enter: function () {
      OW.music('menu');
      var go = function (n) { return function () { OW.App.players = n; OW.App.go('levels'); }; };
      this.list = new ButtonList([
        { label: lbl('ui.menu.p1'), action: go(1) },
        { label: lbl('ui.menu.p2'), action: go(2) },
        { label: lbl('ui.menu.options'), action: function () { OW.App.go('options'); } },
        { label: lbl('ui.menu.controls'), action: function () { OW.App.go('controls'); } },
        { label: lbl('ui.menu.credits'), action: function () { OW.App.go('credits'); } }
      ], 490, 300, 300, 58, 16);
    },
    update: function () {
      var m = OW.Input.menu();
      if (LangToggle.update(false)) return;
      if (m.back) { OW.sfx('ui_back'); OW.App.go('title'); return; }
      this.list.update(m);
    },
    draw: function (ctx, t) {
      OW.Art.drawMenuBackground(ctx, t);
      OW.Art.drawLogo(ctx, 640, 150, 0.85, t);
      this.list.draw(ctx, t);
      var tot = OW.Save.totalStars();
      OW.Art.drawIcon(ctx, 'star', 1150, 690, 22);
      U.text(ctx, tot + '/' + (OW.LEVELS.length * 3), 1200, 697, { size: 18, color: '#ffd23f', stroke: 'rgba(0,0,0,0.6)', strokeWidth: 4 });
      footer(ctx, tr('ui.menu.footer'));
      LangToggle.draw(ctx, t);
    }
  };

  /* ---------- Opciones ---------- */
  function volLabel(key, field) {
    return function () {
      var v = Math.round(OW.Save.data[field] * 10), bar = '';
      for (var i = 0; i < 10; i++) bar += i < v ? '■' : '□';
      return tr(key) + '  ' + bar;
    };
  }
  function changeDifficulty(d) {
    var n = OW.DIFFICULTIES.length, s = OW.Save.data;
    s.difficulty = ((s.difficulty == null ? 1 : s.difficulty) + d + n) % n;
    OW.Save.save(); OW.sfx('ui_move');
  }
  var OPT_DIFF = 2, OPT_LANG = 3;
  S.options = {
    enter: function () {
      this.list = new ButtonList([
        { label: volLabel('ui.opt.music', 'music'), key: 'music', action: function () {} },
        { label: volLabel('ui.opt.sfx', 'sfx'), key: 'sfx', action: function () {} },
        { label: function () { return '◀  ' + diffName(OW.difficulty()).toUpperCase() + '  ▶'; }, diff: true, action: function () {} },
        { label: function () { return '◀  ' + tr('ui.opt.lang', { lang: langName(curLang()).toUpperCase() }) + '  ▶'; }, lang: true, action: function () {} },
        { label: lbl('ui.opt.reset'), action: function () { S.options.confirmReset(); } },
        { label: lbl('ui.opt.back'), action: function () { OW.App.go('menu'); } }
      ], 400, 156, 480, 54, 12);
      this.resetArmed = 0;
    },
    confirmReset: function () {
      var n = OW.LEVELS.length, z = function () { var a = []; for (var i = 0; i < n; i++) a.push(0); return a; };
      if (this.resetArmed > 0) {
        OW.Save.data.stars = z(); OW.Save.data.best = z(); OW.Save.save();
        this.resetArmed = 0; this.msg = 'ui.opt.reset_done'; this.msgT = 2.5;
      } else { this.resetArmed = 3; this.msg = 'ui.opt.reset_confirm'; this.msgT = 3; }
    },
    update: function (dt) {
      var m = OW.Input.menu(), I = OW.Input;
      this.resetArmed = Math.max(0, this.resetArmed - dt); this.msgT = Math.max(0, (this.msgT || 0) - dt);
      if (m.back) { OW.sfx('ui_back'); OW.App.go('menu'); return; }
      if (I.wasPressed('KeyL')) { cycleLang(1); return; }
      var it = this.list.items[this.list.focus];
      if (it.diff && (m.left || m.right || m.confirm)) { changeDifficulty(m.left ? -1 : 1); m.confirm = false; }
      if (it.lang && (m.left || m.right || m.confirm)) { cycleLang(m.left ? -1 : 1); m.confirm = false; }
      // clic en la mitad izquierda/derecha de los selectores
      var hit = this.list.hit();
      if (I.mouse.clicked && (hit === OPT_DIFF || hit === OPT_LANG)) {
        var r = this.list.rects[hit], d = I.mouse.x < r.x + r.w / 2 ? -1 : 1;
        this.list.focus = hit;
        if (hit === OPT_DIFF) changeDifficulty(d); else cycleLang(d);
        return;
      }
      if (it.key && (m.left || m.right || m.confirm)) {
        var dv = m.left ? -0.1 : 0.1, v = OW.Save.data[it.key] + dv;
        if (m.confirm && v > 1.001) v = 0;
        OW.Save.data[it.key] = Math.round(U.clamp(v, 0, 1) * 10) / 10;
        OW.Save.applyVolume(); OW.Save.save(); OW.sfx('ui_move');
        m.confirm = false;
      }
      this.list.update(m);
    },
    draw: function (ctx, t) {
      OW.Art.drawMenuBackground(ctx, t);
      OW.Art.drawPanel(ctx, 340, 84, 600, 586, { title: tr('ui.opt.title'), alpha: 0.92 });
      this.list.draw(ctx, t);
      // detalle de la dificultad
      var D = OW.difficulty(), di = OW.DIFFICULTIES.indexOf(D);
      U.text(ctx, tr('ui.opt.difficulty'), 628, 584, { size: 14, align: 'right', color: '#cfc6ef' });
      for (var p = 0; p < OW.DIFFICULTIES.length; p++) {
        ctx.fillStyle = p <= di ? D.color : 'rgba(255,255,255,0.25)';
        U.roundRect(ctx, 642 + p * 20, 572, 15, 15, 4); ctx.fill();
      }
      var desc = diffDesc(D), fs = 15;
      ctx.font = 'normal ' + fs + 'px ' + C.FONT;
      while (ctx.measureText(desc).width > 570 && fs > 11) { fs--; ctx.font = 'normal ' + fs + 'px ' + C.FONT; }
      U.text(ctx, desc, 640, 612, { size: fs, color: D.color, weight: 'normal' });
      if (this.msgT > 0) U.text(ctx, tr(this.msg), 640, 645, { size: 16, color: '#ff7b7b' });
      footer(ctx, tr('ui.opt.footer'));
    }
  };

  /* ---------- Controles ---------- */
  S.controls = {
    enter: function () {},
    update: function () {
      var m = OW.Input.menu();
      if (m.back || m.confirm || OW.Input.mouse.clicked) { OW.sfx('ui_back'); OW.App.go('menu'); }
    },
    draw: function (ctx, t) {
      OW.Art.drawMenuBackground(ctx, t);
      OW.Art.drawPanel(ctx, 70, 40, 1140, 640, { title: tr('ui.ctl.title'), alpha: 0.92 });
      var rows = [
        ['', tr('ui.ctl.p1'), tr('ui.ctl.p2'), tr('ui.ctl.pad')],
        [tr('ui.ctl.move'), 'W A S D', tr('ui.key.arrows'), tr('ui.key.stick')],
        [tr('ui.ctl.grab'), 'E', tr('ui.key.dot'), 'A'],
        [tr('ui.ctl.action'), 'F', tr('ui.key.comma'), 'X'],
        [tr('ui.ctl.dash'), tr('ui.key.lshift'), tr('ui.key.minus'), 'B'],
        [tr('ui.ctl.switch'), 'Tab', 'Tab', 'Y'],
        [tr('ui.ctl.pause'), 'Esc / P', 'Esc / P', 'Start'],
        [tr('ui.ctl.mute'), 'M', 'M', '—'],
        [tr('ui.ctl.lang'), 'L', 'L', tr('ui.key.y_title')]
      ];
      for (var r = 0; r < rows.length; r++) {
        for (var c = 0; c < 4; c++) {
          var x = [180, 500, 740, 980][c], y = 122 + r * 39;
          U.text(ctx, rows[r][c], x, y, { size: r === 0 ? 18 : 20, color: r === 0 ? '#ffd23f' : c === 0 ? '#ffffff' : '#cfc6ef', align: c === 0 ? 'left' : 'center', weight: c === 0 || r === 0 ? 'bold' : 'normal' });
        }
      }
      for (var i = 1; i <= 5; i++) {
        var tip = tr('ui.ctl.tip' + i), fs = 16;
        ctx.font = 'normal ' + fs + 'px ' + C.FONT;
        while (ctx.measureText(tip).width > 1100 && fs > 12) { fs--; ctx.font = 'normal ' + fs + 'px ' + C.FONT; }
        U.text(ctx, tip, 640, 488 + (i - 1) * 30, { size: fs, color: '#ffffff', weight: 'normal' });
      }
      U.text(ctx, tr('ui.ctl.f9'), 640, 650, { size: 13, color: 'rgba(207,198,239,0.6)', weight: 'normal' });
      footer(ctx, tr('ui.back_any'));
    }
  };

  /* ---------- Créditos ---------- */
  S.credits = {
    enter: function () { this.t = 0; },
    update: function (dt) {
      this.t += dt;
      var m = OW.Input.menu();
      if (m.back || m.confirm || OW.Input.mouse.clicked) { OW.sfx('ui_back'); OW.App.go('menu'); }
    },
    draw: function (ctx, t) {
      OW.Art.drawMenuBackground(ctx, t);
      OW.Art.drawPanel(ctx, 270, 70, 740, 590, { title: tr('ui.cred.title'), alpha: 0.92 });
      for (var i = 1; i <= 11; i++) {
        var head = i === 1, author = i === 2;
        U.text(ctx, tr('ui.cred.' + i), 640, 160 + (i - 1) * 42, {
          size: head ? 24 : author ? 22 : 19, align: 'center',
          color: head ? '#7cff9b' : author ? '#ffd23f' : '#e6e0ff', weight: head || author ? 'bold' : 'normal'
        });
      }
      footer(ctx, tr('ui.back_any'));
    }
  };

  /* ---------- Selector de niveles: roadmap / diagrama de Gantt ---------- */
  var LV_COLORS = ['#ffb02e', '#4da3ff', '#ff7aa2', '#3ddc84', '#ffd23f'];
  var GX = 70, GW = 1140, GY = 108, ROW_H = 70, BAR_H = 44;
  function barRect(i, n) {
    var span = GW - 40, bw = Math.min(300, span * 0.3), step = n > 1 ? (span - bw) / (n - 1) : 0;
    return { x: GX + 20 + i * step, y: GY + 42 + i * ROW_H, w: bw, h: BAR_H };
  }
  function drawCalendar(ctx, x, y, s) {
    ctx.save();
    ctx.fillStyle = '#fff8ec'; U.roundRect(ctx, x, y + 3, s, s - 3, 4); ctx.fill();
    ctx.fillStyle = '#ff5d73'; U.roundRect(ctx, x, y + 3, s, s * 0.3, 4); ctx.fill(); ctx.fillRect(x, y + 3 + s * 0.18, s, s * 0.12);
    ctx.fillStyle = '#2b1b4a'; ctx.fillRect(x + s * 0.25, y, 3, s * 0.25); ctx.fillRect(x + s * 0.7, y, 3, s * 0.25);
    ctx.strokeStyle = '#1f9a55'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x + s * 0.28, y + s * 0.66); ctx.lineTo(x + s * 0.45, y + s * 0.82); ctx.lineTo(x + s * 0.75, y + s * 0.48); ctx.stroke();
    ctx.restore();
  }
  function lockIcon(ctx, x, y) {
    ctx.strokeStyle = '#d0d0e0'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y - 4, 6, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = '#d0d0e0'; U.roundRect(ctx, x - 9, y - 4, 18, 13, 3); ctx.fill();
  }
  function fitText(ctx, str, maxW, size, weight) {
    var fs = size;
    ctx.font = (weight || 'bold') + ' ' + fs + 'px ' + C.FONT;
    while (ctx.measureText(str).width > maxW && fs > 10) { fs--; ctx.font = (weight || 'bold') + ' ' + fs + 'px ' + C.FONT; }
    return fs;
  }
  function hazardName(h) {
    if (has('hazard.' + h)) return tr('hazard.' + h);
    return (OW.HAZARD_NAMES && OW.HAZARD_NAMES[h]) || h;
  }
  S.levels = {
    enter: function (params) {
      OW.music('menu');
      this.sel = params && params.sel != null ? params.sel : this.firstUnplayed();
      this.t = 0;
    },
    firstUnplayed: function () {
      var s = 0;
      for (var i = 0; i < OW.LEVELS.length; i++) if (OW.Save.unlocked(i)) s = i;
      for (var j = 0; j <= s; j++) if (!OW.Save.data.stars[j]) return j;
      return s;
    },
    update: function (dt) {
      this.t += dt;
      var m = OW.Input.menu(), I = OW.Input, n = OW.LEVELS.length;
      if (m.back) { OW.sfx('ui_back'); OW.App.go('menu'); return; }
      if (m.left || m.up) { this.sel = (this.sel + n - 1) % n; OW.sfx('ui_move'); }
      if (m.right || m.down) { this.sel = (this.sel + 1) % n; OW.sfx('ui_move'); }
      var hit = -1;
      for (var i = 0; i < n; i++) {
        var r = barRect(i, n);
        if (I.mouse.x >= r.x - 6 && I.mouse.x <= r.x + r.w + 18 && I.mouse.y >= r.y - 10 && I.mouse.y <= r.y + r.h + 10) hit = i;
      }
      if (I.mouse.moved && hit >= 0 && hit !== this.sel) { this.sel = hit; OW.sfx('ui_move'); }
      if (m.confirm || (I.mouse.clicked && hit >= 0)) {
        if (I.mouse.clicked && hit >= 0) this.sel = hit;
        if (!OW.Save.unlocked(this.sel)) { OW.sfx('wrong'); this.denyT = 0.5; return; }
        OW.sfx('ui_select');
        OW.App.startLevel(this.sel, OW.App.players);
        return;
      }
      if (I.wasPressed('Tab')) { OW.App.players = OW.App.players === 1 ? 2 : 1; OW.sfx('ui_move'); }
      this.denyT = Math.max(0, (this.denyT || 0) - dt);
    },
    draw: function (ctx, t) {
      var n = OW.LEVELS.length;
      OW.Art.drawMenuBackground(ctx, t);
      OW.Art.drawPanel(ctx, 30, 16, 1220, 488, { color: '#16102e', alpha: 0.86, noShadow: true });
      drawCalendar(ctx, 60, 36, 26);
      U.text(ctx, tr('ui.lv.title'), 96, 58, { size: 24, align: 'left', color: '#ffffff' });
      U.text(ctx, tr('ui.lv.mode', { mode: tr(OW.App.players === 1 ? 'ui.lv.mode1' : 'ui.lv.mode2') }), 1220, 56, { size: 16, align: 'right', color: '#ffd23f' });

      // rejilla de semanas
      var weeks = 10, ww = GW / weeks;
      for (var w = 0; w < weeks; w++) {
        var wx = GX + w * ww;
        ctx.fillStyle = w % 2 ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.065)';
        ctx.fillRect(wx, GY, ww, n * ROW_H + 28);
        U.text(ctx, tr('ui.lv.week', { n: w + 1 }), wx + ww / 2, GY + 20, { size: 13, color: 'rgba(207,198,239,0.7)', weight: 'normal' });
      }
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(GX, GY + 28, GW, 2);

      var rects = [];
      for (var k = 0; k < n; k++) rects.push(barRect(k, n));
      // línea "HOY" en el sprint seleccionado
      var sr = rects[this.sel];
      ctx.save();
      ctx.strokeStyle = 'rgba(255,93,115,0.9)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(sr.x, GY - 4); ctx.lineTo(sr.x, GY + n * ROW_H + 28); ctx.stroke();
      ctx.restore();
      ctx.font = 'bold 12px ' + C.FONT;
      var tw = ctx.measureText(tr('ui.lv.today')).width + 14;
      ctx.fillStyle = '#ff5d73'; U.roundRect(ctx, sr.x - tw / 2, GY - 24, tw, 18, 6); ctx.fill();
      U.text(ctx, tr('ui.lv.today'), sr.x, GY - 11, { size: 12, color: '#fff' });

      // dependencias (flechas fin → inicio)
      for (var d = 0; d < n - 1; d++) {
        var a = rects[d], b = rects[d + 1], ax = a.x + a.w + 12, ay = a.y + a.h / 2, bx = b.x - 4, by = b.y + b.h / 2;
        ctx.strokeStyle = OW.Save.unlocked(d + 1) ? 'rgba(255,255,255,0.55)' : 'rgba(160,160,180,0.3)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.bezierCurveTo(ax + 30, ay, ax + 30, by - 4, bx - 26, by); ctx.lineTo(bx, by); ctx.stroke();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath(); ctx.moveTo(bx + 2, by); ctx.lineTo(bx - 7, by - 5); ctx.lineTo(bx - 7, by + 5); ctx.fill();
      }

      for (var i = 0; i < n; i++) {
        var lv = OW.LEVELS[i], r = rects[i], unlocked = OW.Save.unlocked(i), sel = i === this.sel;
        var col = unlocked ? LV_COLORS[i % LV_COLORS.length] : '#555a6e', stars = OW.Save.data.stars[i] | 0;
        var pulse = sel ? 1 + Math.sin(t * 5) * 0.04 : 1;
        ctx.save();
        ctx.translate(r.x + r.w / 2, r.y + r.h / 2); ctx.scale(pulse, pulse); ctx.translate(-r.x - r.w / 2, -r.y - r.h / 2);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; U.roundRect(ctx, r.x + 2, r.y + 5, r.w, r.h, 10); ctx.fill();
        ctx.fillStyle = col; U.roundRect(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
        // progreso (estrellas) como relleno más oscuro
        ctx.fillStyle = 'rgba(26,16,51,0.18)'; U.roundRect(ctx, r.x, r.y + r.h - 8, r.w * (stars / 3), 8, 4); ctx.fill();
        ctx.strokeStyle = sel ? '#ffffff' : '#1a1033'; ctx.lineWidth = sel ? 3 : 2; U.roundRect(ctx, r.x, r.y, r.w, r.h, 10); ctx.stroke();
        // nº de sprint
        ctx.fillStyle = '#1a1033'; ctx.beginPath(); ctx.arc(r.x + 22, r.y + r.h / 2, 14, 0, Math.PI * 2); ctx.fill();
        if (unlocked) U.text(ctx, String(lv.id), r.x + 22, r.y + r.h / 2 + 6, { size: 16, color: col });
        else lockIcon(ctx, r.x + 22, r.y + r.h / 2);
        var nm = lvName(lv), fs = fitText(ctx, nm, r.w - 44 - 78, 17);
        U.text(ctx, nm, r.x + 44, r.y + r.h / 2 + 6, { size: fs, align: 'left', color: unlocked ? '#1a1033' : '#c8c8d8' });
        for (var s = 0; s < 3; s++) OW.Art.drawIcon(ctx, s < stars ? 'star' : 'star_empty', r.x + r.w - 62 + s * 22, r.y + r.h / 2, 16);
        ctx.restore();
        // hito (rombo) al final de la barra
        var mx = r.x + r.w + 6, my = r.y + r.h / 2;
        ctx.fillStyle = stars > 0 ? '#ffd23f' : 'rgba(255,255,255,0.25)';
        ctx.beginPath(); ctx.moveTo(mx, my - 8); ctx.lineTo(mx + 8, my); ctx.lineTo(mx, my + 8); ctx.lineTo(mx - 8, my); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#1a1033'; ctx.lineWidth = 2; ctx.stroke();
      }
      var last = rects[n - 1];
      if (last) U.text(ctx, '◆ ' + tr('ui.lv.release'), last.x + last.w + 14, last.y - 6, { size: 13, align: 'right', color: '#ffd23f' });

      // panel de detalle
      var L = OW.LEVELS[this.sel], unl = OW.Save.unlocked(this.sel);
      var shakeX = this.denyT > 0 ? Math.sin(t * 60) * 6 : 0, x0 = 180 + shakeX;
      OW.Art.drawPanel(ctx, 150 + shakeX, 516, 980, 166, { alpha: 0.92 });
      U.text(ctx, lvSprint(L) + '  ·  ' + lvTicket(L), x0, 549, { size: 16, align: 'left', color: '#7cff9b', font: C.MONO, weight: 'normal' });
      var title = tr('ui.lv.level', { n: L.id }) + ' · ' + lvName(L);
      U.text(ctx, title, x0, 584, { size: fitText(ctx, title, 640, 28), align: 'left', color: '#ffffff' });
      var motto = lvMotto(L), desc = lvText(L, 'desc', '');
      var line = (motto ? '«' + motto + '»  —  ' : '') + desc;
      U.text(ctx, line, x0, 614, { size: fitText(ctx, line, unl ? 730 : 920, 16, 'normal'), align: 'left', color: '#cfc6ef', weight: 'normal' });
      var hzl = (L.hazards || []);
      var hz = hzl.length ? hzl.map(hazardName).join(' · ') : tr('ui.lv.none');
      var tasks = L.tasks || L.recipes || [];
      var dossiers = L.dossiers != null ? L.dossiers : L.folders != null ? L.folders : L.prs;
      var info = tr('ui.lv.hazards', { list: hz }) + '   ·   ' + tr('ui.lv.tasks', { n: tasks.length }) + (dossiers != null ? '   ·   ' + tr('ui.lv.dossiers', { n: dossiers }) : '');
      U.text(ctx, info, x0, 643, { size: fitText(ctx, info, unl ? 740 : 920, 15, 'normal'), align: 'left', color: '#cfc6ef', weight: 'normal' });
      if (unl) {
        U.text(ctx, tr('ui.lv.record', { n: OW.Save.data.best[this.sel] | 0 }), 1100 + shakeX, 584, { size: 20, align: 'right', color: '#ffffff' });
        var thr = OW.starThresholds(L, OW.App.players);
        for (var q = 0; q < 3; q++) {
          OW.Art.drawIcon(ctx, 'star', 940 + q * 62 + shakeX, 615, 16);
          U.text(ctx, thr[q] + '€', 970 + q * 62 + shakeX, 621, { size: 13, align: 'center', color: '#cfc6ef' });
        }
        U.text(ctx, tr('ui.lv.play'), 1100 + shakeX, 664, { size: 16, align: 'right', color: '#ff7b7b' });
        U.text(ctx, tr('ui.lv.diff', { d: diffName(OW.difficulty()) }), x0, 668, { size: 14, align: 'left', color: OW.difficulty().color, weight: 'normal' });
      } else {
        U.text(ctx, tr('ui.lv.locked'), 1100 + shakeX, 668, { size: 15, align: 'right', color: '#ff7b7b' });
      }
      footer(ctx, tr('ui.lv.footer'));
    }
  };

  /* ---------- Intro con cuenta atrás ---------- */
  S.intro = {
    enter: function () { this.t = 0; this.last = -1; },
    update: function (dt) {
      this.t += dt;
      var ph = this.phase();
      if (ph !== this.last) {
        this.last = ph;
        if (ph >= 1 && ph <= 3) OW.sfx('countdown');
        if (ph === 4) OW.sfx('go');
      }
      if (this.t > 1.4 + 0.75 * 3 + 0.25) OW.App.go('play');
      if (OW.Input.pausePressed()) { OW.App.go('play'); }
    },
    phase: function () {
      if (this.t < 1.4) return 0;
      return Math.min(4, 1 + Math.floor((this.t - 1.4) / 0.75));
    },
    draw: function (ctx, t) {
      var g = OW.App.game, L = g.level;
      g.drawWorld(ctx, t);
      OW.HUD.draw(ctx, g, t, 1 / 60);
      ctx.fillStyle = 'rgba(10,6,24,0.55)'; ctx.fillRect(0, 0, C.W, C.H);
      var ph = this.phase();
      if (ph === 0) {
        var k = U.easeOutBack(U.clamp(this.t / 0.4, 0, 1));
        ctx.save(); ctx.translate(640, 330); ctx.scale(k, k);
        OW.Art.drawPanel(ctx, -350, -120, 700, 280, { alpha: 0.9, title: tr('ui.intro.sprint', { n: L.id, total: OW.LEVELS.length }), titleSize: 15, titleHeight: 30 });
        var motto = lvMotto(L);
        U.text(ctx, lvTicket(L) + (motto ? '  ·  ' + motto : ''), 0, -60, { size: fitText(ctx, lvTicket(L) + '  ·  ' + motto, 640, 20, 'normal'), color: '#7cff9b', weight: 'normal' });
        U.text(ctx, tr('ui.lv.level', { n: L.id }), 0, -20, { size: 30, color: '#fff', stroke: '#2b1b4a', strokeWidth: 6 });
        var nm = lvName(L);
        U.text(ctx, nm, 0, 40, { size: fitText(ctx, nm, 660, 56), color: '#ffd23f', stroke: '#2b1b4a', strokeWidth: 9 });
        var desc = lvText(L, 'desc', '');
        U.text(ctx, desc, 0, 90, { size: fitText(ctx, desc, 660, 22), color: '#fff', stroke: '#2b1b4a', strokeWidth: 5 });
        U.text(ctx, tr(g.solo ? 'ui.intro.solo' : 'ui.intro.coop'), 0, 130, { size: 18, color: '#9fe8ff', stroke: '#2b1b4a', strokeWidth: 4 });
        ctx.restore();
      } else {
        var lt = ((this.t - 1.4) % 0.75) / 0.75;
        var txt = ph === 4 ? tr('ui.intro.go') : String(4 - ph);
        var sc = (ph === 4 ? 1.2 : 1) * (1.6 - U.easeOutCubic(Math.min(1, lt * 2)) * 0.6);
        ctx.save(); ctx.translate(640, 400); ctx.scale(sc, sc); ctx.globalAlpha = 1 - Math.max(0, lt - 0.7) / 0.3;
        U.text(ctx, txt, 0, 0, { size: 140, color: ph === 4 ? '#7cff9b' : '#ffd23f', stroke: '#2b1b4a', strokeWidth: 14 });
        ctx.restore();
      }
    }
  };

  /* ---------- Juego ---------- */
  S.play = {
    enter: function () { this.endT = 0; },
    update: function (dt) {
      var g = OW.App.game;
      if (OW.Input.pausePressed()) { OW.sfx('ui_back'); OW.App.go('pause'); return; }
      g.update(dt);
      if (g.over) OW.App.go('timeup');
    },
    draw: function (ctx, t) {
      var g = OW.App.game;
      g.drawWorld(ctx, t);
      OW.HUD.draw(ctx, g, t, 1 / 60);
    }
  };

  /* ---------- Pausa ---------- */
  S.pause = {
    enter: function () {
      try { OW.Audio.setIntensity(0); } catch (e) { /* nada */ }
      this.list = new ButtonList([
        { label: lbl('ui.pause.resume'), action: function () { OW.App.go('play'); } },
        { label: lbl('ui.pause.restart'), action: function () { OW.App.startLevel(OW.App.game.li, OW.App.players); } },
        { label: lbl('ui.pause.levels'), action: function () { OW.App.go('levels', { sel: OW.App.game.li }); } },
        { label: lbl('ui.pause.menu'), action: function () { OW.App.go('menu'); } }
      ], 500, 240, 280, 58, 16);
    },
    update: function () {
      var m = OW.Input.menu();
      if (OW.Input.pausePressed()) { OW.sfx('ui_select'); OW.App.go('play'); return; }
      this.list.update(m);
    },
    draw: function (ctx, t) {
      var g = OW.App.game;
      g.drawWorld(ctx, t);
      OW.HUD.draw(ctx, g, t, 0);
      ctx.fillStyle = 'rgba(10,6,24,0.65)'; ctx.fillRect(0, 0, C.W, C.H);
      OW.Art.drawPanel(ctx, 440, 140, 400, 430, { title: tr('ui.pause.title'), alpha: 0.92 });
      this.list.draw(ctx, t);
    }
  };

  /* ---------- Fin de la jornada ---------- */
  S.timeup = {
    enter: function () { this.t = 0; OW.sfx('timeup'); try { OW.Audio.setIntensity(0); OW.Audio.stopMusic(); } catch (e) { /* nada */ } },
    update: function (dt) { this.t += dt; if (this.t > 2.2) OW.App.go('results'); },
    draw: function (ctx, t) {
      var g = OW.App.game;
      g.drawWorld(ctx, t);
      OW.HUD.draw(ctx, g, t, 0);
      ctx.fillStyle = 'rgba(10,6,24,' + Math.min(0.6, this.t) + ')'; ctx.fillRect(0, 0, C.W, C.H);
      var k = U.easeOutBack(U.clamp(this.t / 0.5, 0, 1));
      ctx.save(); ctx.translate(640, 380); ctx.scale(k, k);
      U.text(ctx, tr('ui.timeup.title'), 0, 0, { size: 72, color: '#ffd23f', stroke: '#2b1b4a', strokeWidth: 12 });
      U.text(ctx, tr('ui.timeup.sub'), 0, 50, { size: 24, color: '#fff', stroke: '#2b1b4a', strokeWidth: 6 });
      ctx.restore();
    }
  };

  /* ---------- Resultados ---------- */
  /* Devuelve { key, params } (se traduce al dibujar, para que el cambio de idioma no lo deje en el otro). */
  function minutesMessage(g, stars) {
    var s = g.stats || {}, c = [];
    var add = function (key, params) { c.push({ key: key, params: params }); };
    var base = { 3: 3, 2: 2, 1: 3, 0: 3 }[stars] || 3;
    for (var i = 1; i <= base; i++) add('ui.res.m' + stars + '.' + i);
    if ((s.fires | 0) >= 2) add('ui.res.m.fires', { n: s.fires });
    if ((s.burnt | 0) > 0) add('ui.res.m.burnt');
    var notifs = (s.notifs != null ? s.notifs : s.bugs) | 0;
    if (notifs >= 3) add('ui.res.m.bugs', { n: notifs });
    var ceo = (s.ceo != null ? s.ceo : s.meetings) | 0;
    if (ceo >= 2) add('ui.res.m.meetings', { n: ceo });
    if ((s.expired | 0) >= 3) add('ui.res.m.expired', { n: s.expired });
    if ((s.wrong | 0) >= 2) add('ui.res.m.wrong');
    if ((s.coffees | 0) >= 4) add('ui.res.m.coffees', { n: s.coffees });
    if ((s.calls | 0) >= 3) add('ui.res.m.calls', { n: s.calls });
    if ((s.one2ones | 0) >= 2) add('ui.res.m.one2ones', { n: s.one2ones });
    if ((s.delivered | 0) === 0) add('ui.res.m.none');
    if ((s.tips | 0) >= 150) add('ui.res.m.tips');
    return U.pick(c);
  }
  OW.minutesMessage = minutesMessage;

  S.results = {
    enter: function () {
      var g = OW.App.game;
      try { OW.FX.clear(); } catch (e) { /* nada */ }
      this.t = 0; this.shown = 0;
      this.stars = g.starsEarned();
      this.prevStars = OW.Save.data.stars[g.li] | 0;
      this.newBest = g.score > (OW.Save.data.best[g.li] | 0);
      OW.Save.record(g.li, this.stars, g.score);
      this.msg = minutesMessage(g, this.stars);
      OW.music('results');
      var next = g.li + 1, hasNext = next < OW.LEVELS.length && OW.Save.unlocked(next);
      var items = [];
      if (hasNext) items.push({ label: lbl('ui.res.next'), action: function () { OW.App.startLevel(next, OW.App.players); } });
      items.push({ label: lbl('ui.res.retry'), action: function () { OW.App.startLevel(g.li, OW.App.players); } });
      items.push({ label: lbl('ui.res.levels'), action: function () { OW.App.go('levels', { sel: hasNext ? next : g.li }); } });
      var w = 290, total = items.length * w + (items.length - 1) * 20, x0 = 640 - total / 2;
      this.list = new ButtonList(items, 0, 0, w, 56, 0);
      this.list.rects = items.map(function (it, i) { return { x: x0 + i * (w + 20), y: 622, w: w, h: 56 }; });
      this.unlockedMsg = this.prevStars === 0 && this.stars > 0 && next < OW.LEVELS.length;
    },
    update: function (dt) {
      this.t += dt;
      while (this.shown < this.stars && this.t > 0.8 + this.shown * 0.5) {
        this.shown++;
        OW.sfx('star', { index: this.shown });
        OW.fx('confetti', 470 + this.shown * 85, 210, { count: 25 });
      }
      if (this.t < 0.6) return;
      var m = OW.Input.menu();
      var tmp = m.left; m.left = false; m.up = m.up || tmp; tmp = m.right; m.right = false; m.down = m.down || tmp;
      this.list.update(m);
    },
    draw: function (ctx, t) {
      var g = OW.App.game, s = g.stats || {}, L = g.level;
      OW.Art.drawMenuBackground(ctx, t);
      OW.Art.drawPanel(ctx, 240, 30, 800, 566, { alpha: 0.92 });
      U.text(ctx, tr(this.stars > 0 ? 'ui.res.ok' : 'ui.res.ko'), 640, 66, { size: 16, color: this.stars > 0 ? '#7cff9b' : '#ff7b7b' });
      var head = tr('ui.lv.level', { n: L.id }) + ' · ' + lvName(L);
      U.text(ctx, head, 640, 100, { size: fitText(ctx, head, 720, 30), color: '#ffffff' });
      for (var i = 0; i < 3; i++) {
        var on = i < this.shown, k = 1;
        if (on) { var st = this.t - (0.8 + i * 0.5); k = st < 0.35 ? U.easeOutBack(U.clamp(st / 0.35, 0, 1)) : 1; }
        ctx.save(); ctx.translate(555 + i * 85, 178 - (i === 1 ? 14 : 0)); ctx.scale(k, k);
        OW.Art.drawIcon(ctx, on ? 'star' : 'star_empty', 0, 0, 72);
        ctx.restore();
      }
      var expired = s.expired | 0, wrong = s.wrong | 0, delivered = s.delivered | 0;
      var notifs = (s.notifs != null ? s.notifs : s.bugs) | 0;
      var lines = [
        [tr('ui.res.done'), delivered],
        [tr('ui.res.fails'), tr('ui.res.fails_detail', { n: expired + wrong, e: expired, w: wrong })],
        [tr('ui.res.tips'), (s.tips | 0) + '€'],
        [tr('ui.res.calls'), (s.calls | 0) + ' / ' + (s.one2ones | 0)],
        [tr('ui.res.bugs'), notifs],
        [tr('ui.res.fires'), s.fires | 0]
      ];
      for (var j = 0; j < lines.length; j++) {
        U.text(ctx, lines[j][0], 330, 260 + j * 28, { size: 19, align: 'left', color: '#cfc6ef', weight: 'normal' });
        U.text(ctx, String(lines[j][1]), 950, 260 + j * 28, { size: 19, align: 'right', color: '#ffffff' });
      }
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(330, 420, 620, 2);
      U.text(ctx, tr('ui.res.score'), 330, 458, { size: 26, align: 'left', color: '#ffffff' });
      OW.Art.drawIcon(ctx, 'coin', 800, 449, 30);
      U.text(ctx, g.score + '€', 950, 460, { size: 32, align: 'right', color: '#ffffff' });
      if (this.newBest && this.t > 1.5) U.text(ctx, tr('ui.res.best'), 640, 458, { size: 18, color: '#ff7b7b' });
      // acta de la jornada
      ctx.fillStyle = '#fff8ec'; U.roundRect(ctx, 300, 482, 680, 94, 10); ctx.fill();
      ctx.fillStyle = '#ffd23f'; ctx.fillRect(300, 482, 8, 94);
      U.text(ctx, tr('ui.res.minutes', { sprint: lvSprint(L), ticket: lvTicket(L) }), 324, 506, { size: 13, align: 'left', color: '#7a6a90' });
      var msg = this.msg ? '«' + tr(this.msg.key, this.msg.params) + '»' : '';
      U.text(ctx, msg, 324, 536, { size: fitText(ctx, msg, 640, 18), align: 'left', color: '#2b1b4a' });
      var sum = tr('ui.res.summary', { d: delivered, f: expired + wrong });
      U.text(ctx, sum, 324, 562, { size: fitText(ctx, sum, 640, 14, 'normal'), align: 'left', color: '#5a4a78', weight: 'normal' });
      if (this.unlockedMsg && this.t > 2) U.text(ctx, tr('ui.res.unlocked'), 640, 610, { size: 16, color: '#ffd23f', stroke: '#2b1b4a', strokeWidth: 4 });
      if (this.t > 0.6) this.list.draw(ctx, t);
      OW.FX.draw(ctx);
    }
  };
})();
