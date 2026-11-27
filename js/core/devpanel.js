/* OVERMANAGING — UI: panel de ajustes de equilibrio (modo desarrollador).
 *
 * F9 lo abre/cierra en cualquier momento (también ?dev=1 muestra un botón "⚙ DEV"). Mientras está
 * abierto la simulación se congela y las teclas no llegan al juego. Edita OW.TUNING (js/core/tuning.js)
 * en el sitio; los cambios se guardan en localStorage (OW.Tuning, clave overmanaging_tuning_v1) y se
 * pueden exportar como un tuning.js completo para dejarlos permanentes.
 *
 * TOLERANTE con la estructura de tuning.js: los parámetros descritos abajo sólo se muestran si existen,
 * y cualquier valor nuevo de OW.TUNING que no esté descrito aparece igualmente como campo genérico
 * (etiqueta = nombre de la clave). Textos: claves dev.* en js/i18n/strings_ui.js
 * (dev.f.<ruta> = etiqueta, dev.h.<ruta> = ayuda, donde <ruta> es "grupo.clave", "diff.clave" o "level.clave").
 */
(function () {
  'use strict';
  var OW = window.OW, TU = OW && OW.Tuning;
  if (!TU || !document.body) return;

  function tr(key, params) { return OW.t ? OW.t(key, params) : key; }
  function has(key) { return !!(OW.I18N && OW.I18N.has && OW.I18N.has(key)); }
  /* Texto en castellano (para los comentarios del tuning.js exportado, que está escrito en castellano). */
  function trEs(key, params) {
    var I = OW.I18N;
    if (!I) return key;
    var cur = I.lang; I.lang = 'es';
    try { return tr(key, params); } finally { I.lang = cur; }
  }
  function own(o, k) { return o != null && Object.prototype.hasOwnProperty.call(o, k); }

  /* ====================================================================================
   * Descripción de cada parámetro: id de texto, unidad, límites y si el cambio se nota en vivo
   * o al reiniciar el nivel. Etiqueta y ayuda salen de i18n (dev.f.<id> / dev.h.<id>).
   * Unidades que empiezan por '@' se traducen (dev.u.<x>).
   * ==================================================================================== */
  function N(k, unit, min, max, o) {
    o = o || {};
    return { k: k, type: o.type || 'num', unit: unit, min: min, max: max, int: !!o.int,
      live: o.live !== false, idx: o.idx, labels: o.labels, asc: !!o.asc };
  }
  function R(k, unit, min, max, opt) {
    var o = {}; for (var x in opt || {}) o[x] = opt[x];
    o.type = 'tuple'; o.idx = [0, 1]; o.labels = ['@min', '@max']; o.asc = true;
    return N(k, unit, min, max, o);
  }
  var RESTART = { live: false };
  var DOCS = ['@doc1', '@doc2', '@doc3'];

  var GROUPS = [
    { key: 'player', tab: 'player', fields: [
      N('maxSpeed', 'px/s', 20, 2000), N('accel', 'px/s²', 100, 50000), N('friction', 'px/s²', 100, 50000),
      N('dashSpeed', 'px/s', 0, 5000), N('dashTime', 's', 0.02, 2), N('dashCooldown', 's', 0, 10), N('dashTiredKeep', '0–1', 0, 1)
    ] },
    { key: 'coffee', tab: 'player', fields: [
      N('duration', 's', 5, 3600), N('slowBelow', '0–1', 0, 1), N('slowMul', '×', 0.05, 3),
      N('zombieBelow', '0–1', 0, 1), N('zombieMul', '×', 0.05, 3), N('drinkTime', 's', 0.05, 30)
    ] },
    { key: 'manager', tab: 'player', fields: [
      N('chaseSpeed', 'px/s', 0, 2000), N('returnSpeed', 'px/s', 0, 2000), N('catchRadius', 'px', 4, 200),
      N('stunTime', 's', 0, 60), N('immuneAfter', 's', 0, 120), N('dodgeImmune', 's', 0, 60),
      R('firstVisit', 's', 0, 600, RESTART), N('chaseTime', 's', 1, 600), R('awayTime', 's', 0, 600)
    ] },
    { key: 'pipeline', tab: 'flow', fields: [
      N('deskTime', 's', 0.05, 60), N('printTime', 's', 0.05, 120), N('warnAfter', 's', 0, 120), N('burnAfter', 's', 0, 120),
      N('signTime', 's', 0.05, 60), N('minutesTime', 's', 0.05, 60), N('returnDelay', 's', 0, 300), N('conveyorTime', 's', 0.05, 20),
      N('phoneHold', 's', 0.05, 60), N('one2oneHold', 's', 0.05, 60)
    ] },
    { key: 'orders', tab: 'flow', fields: [
      N('expirePenalty', '€', 0, 10000, { int: true }), N('tipFactor', '@xvalue', 0, 10), N('firstGapFactor', '@xgap', 0, 5, RESTART),
      N('emptyRefill', 's', 0, 300), N('singleRefill', 's', 0, 300)
    ] },
    { key: 'tasks', tab: 'flow', fields: [
      N('value', '€', 0, 10000, { type: 'tuple', idx: [1, 2, 3], labels: DOCS, int: true }),
      N('time', 's', 1, 3600, { type: 'tuple', idx: [1, 2, 3], labels: DOCS }),
      N('callValue', '€', 0, 10000, { int: true }), N('callTime', 's', 1, 3600),
      N('one2oneValue', '€', 0, 10000, { int: true }), N('one2oneTime', 's', 1, 3600),
      N('maxCalls', '@calls', 0, 10, { int: true }), N('soloStars', '×', 0.05, 5)
    ] },
    { key: 'fire', tab: 'flow', fields: [
      N('startLevel', '0–1', 0.01, 1), N('growRate', '/s', 0, 10), R('spreadEvery', 's', 0.1, 600), N('extinguishTime', 's', 0.05, 60)
    ] },
    { key: 'notifs', tab: 'flow', fields: [
      N('maxAlive', '@notifs', 0, 50, { int: true }), N('maxChance', '0–1', 0, 1, RESTART), R('speed', 'px/s', 0, 2000), R('sitTime', 's', 0, 600)
    ] },
    { key: 'blackout', tab: 'flow', fields: [
      N('firstAt', 's', 0, 3600, RESTART), N('duration', 's', 2, 120), R('every', 's', 0, 3600), N('darkness', '0–1', 0, 1)
    ] }
  ];

  var DIFF_FIELDS = [
    N('order', '×', 0.05, 20, RESTART), N('gap', '×', 0.05, 20, RESTART), N('heat', '×', 0.05, 20, RESTART),
    N('notifs', '×', 0, 20, RESTART), N('drain', '×', 0, 20), N('boss', '×', 0, 10), N('walk', '×', 0.1, 5),
    N('stars', '×', 0.05, 10), N('maxOrders', '@orders', 0, 5, { int: true, live: false }),
    N('color', '', 0, 0, { type: 'color' }),
    N('name', '', 0, 0, { type: 'text' }), N('desc', '', 0, 0, { type: 'text' })
  ];

  var LEVEL_FIELDS = [
    N('duration', 's', 10, 3600, RESTART),
    N('tasks', '', 0, 0, { type: 'tasks', live: false }),
    N('weights', '', 0.01, 100, { type: 'weights', live: false }),
    N('dossiers', '@dossiers', 0, 20, { int: true, live: false }),
    N('notifChance', '0–1', 0, 1, RESTART),
    N('manager', '', 0, 0, { type: 'bool', live: false }),
    N('conveyors', '', 0, 0, { type: 'bool', live: false }),
    N('heat', '×', 0.05, 20, RESTART),
    N('darkness', '0–1', 0, 1, RESTART),
    N('blackouts', '', 0, 0, { type: 'bool', live: false }),
    N('maxOrders', '@orders', 1, 5, { int: true, live: false }),
    R('orderGap', 's', 0, 600, RESTART),
    N('startOrders', '@orders', 1, 5, { int: true, live: false }),
    N('stars', '€', 0, 100000, { type: 'tuple', idx: [0, 1, 2], labels: ['★', '★★', '★★★'], asc: true, int: true, live: false }),
    N('timeMul', '×', 0.05, 20, RESTART)
  ];
  GROUPS.forEach(function (g) { g.fields.forEach(function (f) { f.id = g.key + '.' + f.k; }); });
  DIFF_FIELDS.forEach(function (f) { f.id = 'diff.' + f.k; });
  LEVEL_FIELDS.forEach(function (f) { f.id = 'level.' + f.k; });

  /* ---------- Campos genéricos para claves de tuning.js no descritas aquí ---------- */
  var LIST_KEYS = { tasks: 1, recipes: 1 };
  function genericField(k, v, id) {
    var f;
    if (typeof v === 'boolean') f = N(k, '', 0, 0, { type: 'bool' });
    else if (typeof v === 'string') f = /^#[0-9a-fA-F]{6}$/.test(v) ? N(k, '', 0, 0, { type: 'color' }) : N(k, '', 0, 0, { type: 'text' });
    else if (Array.isArray(v) && v.length && typeof v[0] === 'string') f = null; // listas de ids: no editables genéricamente
    else if (Array.isArray(v) && v.length && v.length <= 6 && typeof v[0] === 'number') {
      var idx = []; for (var i = 0; i < v.length; i++) idx.push(i);
      f = N(k, '', -1e9, 1e9, { type: 'tuple', idx: idx, labels: idx.map(function (n) { return '#' + (n + 1); }) });
    } else if (typeof v === 'number') f = N(k, '', -1e9, 1e9);
    else f = null;
    if (f) { f.id = id; f.generic = true; }
    return f;
  }
  function described(list, k) { for (var i = 0; i < list.length; i++) if (list[i].k === k) return list[i]; return null; }
  /* Campos de una lista (descritos que existen en `sample` + genéricos para el resto). */
  function fieldsFor(list, sample, idPrefix) {
    var out = [];
    if (!sample || typeof sample !== 'object') return out;
    list.forEach(function (f) { if (own(sample, f.k) || (f.k === 'name' || f.k === 'desc') && f.type === 'text' && own(sample, f.k)) out.push(f); });
    Object.keys(sample).forEach(function (k) {
      if (described(list, k) || LIST_KEYS[k] && described(list, 'tasks')) return;
      var g = genericField(k, sample[k], idPrefix + '.' + k);
      if (g) out.push(g);
    });
    return out;
  }
  /* Grupos reales según OW.TUNING (los descritos, si existen, y cualquier otro objeto de nivel superior). */
  function liveGroups() {
    var T = OW.TUNING, out = [];
    GROUPS.forEach(function (g) {
      if (T[g.key] && typeof T[g.key] === 'object' && !Array.isArray(T[g.key])) out.push({ key: g.key, tab: g.tab, fields: fieldsFor(g.fields, TU.def(g.key) || T[g.key], g.key) });
    });
    Object.keys(T).forEach(function (k) {
      if (k === 'difficulties' || k === 'levels') return;
      for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].key === k) return;
      var v = T[k];
      if (v && typeof v === 'object' && !Array.isArray(v)) out.push({ key: k, tab: 'flow', fields: fieldsFor([], TU.def(k) || v, k), generic: true });
    });
    return out;
  }
  function diffFields() {
    var ds = OW.TUNING.difficulties || [];
    var fs = fieldsFor(DIFF_FIELDS, TU.def('difficulties.0') || ds[0], 'diff');
    return fs;
  }
  function levelFields() {
    var L = OW.TUNING.levels || {}, first = Object.keys(L)[0];
    return first ? fieldsFor(LEVEL_FIELDS, TU.def('levels.' + first) || L[first], 'level') : [];
  }
  function fieldForPath(path) {
    var ps = path.split('.');
    if (ps[0] === 'difficulties' && ps.length === 3) return described(diffFields(), ps[2]);
    if (ps[0] === 'levels' && ps.length === 3) return described(levelFields(), ps[2]);
    if (ps.length === 2) {
      var gs = liveGroups();
      for (var i = 0; i < gs.length; i++) if (gs[i].key === ps[0]) return described(gs[i].fields, ps[1]);
    }
    return null;
  }

  /* ---------- Textos de un campo ---------- */
  function humanize(k) { return String(k).replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/^./, function (c) { return c.toUpperCase(); }); }
  function fLabel(f, T) { T = T || tr; return has('dev.f.' + f.id) ? T('dev.f.' + f.id) : humanize(f.k); }
  function fHelp(f, T) { T = T || tr; return has('dev.h.' + f.id) ? T('dev.h.' + f.id) : (f.generic ? T('dev.generic') : ''); }
  function unitText(u, T) { T = T || tr; return u && u.charAt(0) === '@' ? T('dev.u.' + u.slice(1)) : (u || ''); }
  function subLabel(s) { return s && s.charAt(0) === '@' ? tr('dev.u.' + s.slice(1)) : s; }
  function groupTitle(key, T) { T = T || tr; return has('dev.g.' + key) ? T('dev.g.' + key) : humanize(key); }
  function taskList() { return OW.TASKS || OW.RECIPES || {}; }
  function taskName(id) {
    var t = taskList()[id];
    if (t && t.nameKey && has(t.nameKey)) return tr(t.nameKey, { name: '…' });
    if (has('task.' + id)) return tr('task.' + id, { name: '…' });
    return (t && t.name) || id;
  }
  function laneName(ln) { return has('lane.' + ln) ? tr('lane.' + ln) : ln; }
  function levelName(lv, id) {
    if (OW.UIText && lv) return OW.UIText.lvName(lv);
    return lv && lv.name ? lv.name : tr('ui.lv.level', { n: id });
  }
  function diffName(d, i) {
    if (has('diff.' + i + '.name')) return tr('diff.' + i + '.name');
    return (d && d.name) || '#' + i;
  }

  /* ---------- Validación (también la usa OW.Tuning al cargar overrides de localStorage) ---------- */
  function numOk(f, v) { return typeof v === 'number' && isFinite(v) && v >= f.min && v <= f.max && (!f.int || Math.round(v) === v); }
  function validate(path, v) {
    var f = fieldForPath(path);
    if (!f) return false;
    switch (f.type) {
      case 'num': return numOk(f, v);
      case 'bool': return typeof v === 'boolean';
      case 'text': return typeof v === 'string' && v.length <= 140 && !/[\r\n]/.test(v);
      case 'color': return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
      case 'tuple': {
        var d = TU.def(path);
        if (!Array.isArray(v) || !d || v.length !== d.length) return false;
        for (var i = 0; i < v.length; i++) {
          if (f.idx.indexOf(i) < 0) { if (v[i] !== d[i]) return false; } else if (!numOk(f, v[i])) return false;
        }
        if (f.asc) for (var j = 1; j < f.idx.length; j++) if (v[f.idx[j]] < v[f.idx[j - 1]]) return false;
        return true;
      }
      case 'tasks': {
        if (!Array.isArray(v) || !v.length) return false;
        var T = taskList();
        for (var r = 0; r < v.length; r++) if (!T[v[r]] || v.indexOf(v[r]) !== r) return false;
        return true;
      }
      case 'weights': {
        if (!Array.isArray(v) || !v.length) return false;
        for (var w = 0; w < v.length; w++) if (!numOk(f, v[w])) return false;
        return true;
      }
    }
    return false;
  }
  TU.validate = validate;

  /* ====================================================================================
   * Exportar: genera un js/core/tuning.js completo con los valores actuales y comentarios
   * (en castellano, como el fichero original). Recorre la estructura REAL de OW.TUNING.
   * ==================================================================================== */
  function lit(v) {
    if (typeof v === 'string') return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
    if (Array.isArray(v)) return '[' + v.map(lit).join(', ') + ']';
    return String(v);
  }
  function comment(f) {
    var u = unitText(f.unit, trEs), help = fHelp(f, trEs);
    return fLabel(f, trEs) + (u ? ' [' + u + ']' : '') + '.' + (help ? ' ' + help : '') + (f.live ? '' : ' ' + trEs('dev.restart_suffix'));
  }
  function emitObject(lines, indent, entries) {
    var w = 0;
    entries.forEach(function (e, i) { e.code = e.code + (i < entries.length - 1 ? ',' : ''); if (e.code.length <= 44) w = Math.max(w, e.code.length); });
    entries.forEach(function (e) {
      var pad = e.code.length < w ? new Array(w - e.code.length + 1).join(' ') : '';
      lines.push(indent + e.code + (e.comment ? pad + '  // ' + e.comment : ''));
    });
  }
  /* Entradas de un objeto: primero los campos con descripción, luego cualquier otra clave enumerable. */
  function objEntries(obj, fields) {
    var out = [], seen = {};
    fields.forEach(function (f) {
      if (!own(obj, f.k) || !Object.prototype.propertyIsEnumerable.call(obj, f.k)) return;
      seen[f.k] = 1; out.push({ code: f.k + ': ' + lit(obj[f.k]), comment: comment(f) });
    });
    Object.keys(obj).forEach(function (k) {
      if (seen[k]) return;
      var f = described(fields, k);
      out.push({ code: k + ': ' + lit(obj[k]), comment: f ? comment(f) : '' });
    });
    return out;
  }
  function exportTuningJS() {
    var T = OW.TUNING, L = [];
    L.push('/* OVERMANAGING — CORE: ajustes de equilibrio (tuning).');
    L.push(' *');
    L.push(' * Aquí están TODOS los números que deciden la dificultad: velocidad de los PM, café, CEO,');
    L.push(' * tiempos del flujo de documentos, agenda, tareas, dificultades y parámetros de cada nivel.');
    L.push(' *  - Cambia un valor, guarda y recarga la página.');
    L.push(' *  - O pulsa F9 en el juego (panel de desarrollador): ajusta en vivo y usa "Exportar tuning.js"');
    L.push(' *    para generar este mismo fichero con tus valores y sustituirlo aquí.');
    L.push(' *  - Los mapas de los niveles están en js/core/levels.js; los textos, en js/i18n/strings_core.js.');
    L.push(' * Unidades: s = segundos · px/s = píxeles por segundo (una casilla mide 64 px) · × = multiplicador.');
    L.push(' * (Fichero generado con el panel de ajustes F9.)');
    L.push(' */');
    L.push('(function () {');
    L.push("  'use strict';");
    L.push('  var OW = (window.OW = window.OW || {});');
    L.push('');
    L.push('  OW.TUNING = {');
    var keys = Object.keys(T), groups = liveGroups();
    keys.forEach(function (key, ki) {
      var last = ki === keys.length - 1, v = T[key];
      if (key === 'difficulties' && Array.isArray(v)) {
        var df = diffFields();
        L.push('    /* ' + trEs('dev.g.difficulties') + ' */');
        L.push('    difficulties: [');
        v.forEach(function (d, i) {
          L.push('      { // ' + i + ' · ' + String(trEs('diff.' + i + '.name')).replace(/\*\//g, ''));
          emitObject(L, '        ', objEntries(d, df));
          L.push('      }' + (i < v.length - 1 ? ',' : ''));
        });
        L.push('    ]' + (last ? '' : ','));
      } else if (key === 'levels' && v && typeof v === 'object') {
        var lf = levelFields(), ids = Object.keys(v);
        L.push('    /* ' + trEs('dev.g.levels') + ' */');
        L.push('    levels: {');
        ids.forEach(function (id, i) {
          var nm = has('lvl.' + id + '.name') ? trEs('lvl.' + id + '.name') : 'nivel ' + id;
          L.push('      ' + id + ': { // ' + String(nm).replace(/\*\//g, ''));
          emitObject(L, '        ', objEntries(v[id], lf));
          L.push('      }' + (i < ids.length - 1 ? ',' : ''));
        });
        L.push('    }' + (last ? '' : ','));
      } else if (v && typeof v === 'object' && !Array.isArray(v)) {
        var g = null; groups.forEach(function (x) { if (x.key === key) g = x; });
        L.push('    /* ' + groupTitle(key, trEs) + ' */');
        L.push('    ' + key + ': {');
        emitObject(L, '      ', objEntries(v, g ? g.fields : []));
        L.push('    }' + (last ? '' : ','));
      } else {
        L.push('    ' + key + ': ' + lit(v) + (last ? '' : ','));
      }
      if (!last) L.push('');
    });
    L.push('  };');
    L.push('})();');
    return L.join('\n') + '\n';
  }

  /* ====================================================================================
   * Interfaz (DOM)
   * ==================================================================================== */
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function fmt(v) { return typeof v === 'number' ? String(+v.toFixed(6)) : String(v); }
  function parseNum(s) {
    s = String(s).trim().replace(',', '.');
    if (!/^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/i.test(s)) return NaN;
    return parseFloat(s);
  }
  var same = function (a, b) { return JSON.stringify(a) === JSON.stringify(b); };

  var state = { open: false, tab: 'player', view: null, armedReset: 0 };
  var controls = [];

  var root = el('div', 'owd');
  root.id = 'ow-dev';
  root.hidden = true;
  var backdrop = el('div', 'owd-backdrop');
  var panel = el('section', 'owd-panel');
  panel.setAttribute('role', 'dialog');
  panel.tabIndex = -1;
  root.appendChild(backdrop); root.appendChild(panel);

  var head = el('header', 'owd-head');
  var title = el('div', 'owd-title');
  var titleTxt = el('span', null, '');
  var titleSub = el('span', 'owd-sub', '');
  title.appendChild(el('span', 'owd-gear', '⚙'));
  title.appendChild(document.createTextNode(' '));
  title.appendChild(titleTxt);
  title.appendChild(document.createTextNode(' '));
  title.appendChild(titleSub);
  var counter = el('div', 'owd-counter');
  var closeBtn = el('button', 'owd-x', '✕');
  closeBtn.type = 'button';
  head.appendChild(title); head.appendChild(counter); head.appendChild(closeBtn);

  var note = el('p', 'owd-note');

  var tabs = el('nav', 'owd-tabs');
  var TABS = ['player', 'flow', 'diff', 'levels'];
  var tabBtns = {};
  TABS.forEach(function (t) {
    var b = el('button', 'owd-tab', '');
    b.type = 'button';
    b.addEventListener('click', function () { state.tab = t; state.view = null; render(); });
    tabBtns[t] = b; tabs.appendChild(b);
  });

  var body = el('div', 'owd-body');
  var foot = el('footer', 'owd-foot');
  function btn(cls, fn) {
    var b = el('button', 'owd-btn ' + (cls || ''), '');
    b.type = 'button';
    b.addEventListener('click', fn);
    return b;
  }
  var restartBtn = btn('primary', function () { restartLevel(); });
  var resetAllBtn = btn('danger', function () {
    if (!state.armedReset) {
      state.armedReset = 1; resetAllBtn.textContent = tr('dev.btn.sure');
      setTimeout(function () { state.armedReset = 0; resetAllBtn.textContent = tr('dev.btn.resetall'); }, 3000);
      return;
    }
    state.armedReset = 0; resetAllBtn.textContent = tr('dev.btn.resetall');
    TU.resetAll(); changed(); render(); flash(tr('dev.msg.restored'));
  });
  var exportBtn = btn('', function () { showExport(); });
  var jsonBtn = btn('', function () { showJSON(); });
  var msg = el('span', 'owd-msg');
  foot.appendChild(restartBtn); foot.appendChild(msg);
  foot.appendChild(el('span', 'owd-spacer'));
  foot.appendChild(jsonBtn); foot.appendChild(exportBtn); foot.appendChild(resetAllBtn);

  panel.appendChild(head); panel.appendChild(note); panel.appendChild(tabs); panel.appendChild(body); panel.appendChild(foot);

  var msgT = null;
  function flash(text, bad) {
    msg.textContent = text; msg.className = 'owd-msg show' + (bad ? ' bad' : '');
    clearTimeout(msgT); msgT = setTimeout(function () { msg.className = 'owd-msg'; }, 4000);
  }

  /* ---------- Insignia de esquina: "⚙ DEV" (?dev=1) y aviso de ajustes modificados ---------- */
  var devQuery = /(?:^|[?&])dev=1(?:&|$)/.test(location.search.slice(1));
  var badge = el('div', 'owd-badge');
  var devBtn = el('button', 'owd-chip dev', '⚙ DEV');
  devBtn.type = 'button';
  var modChip = el('button', 'owd-chip mod', '');
  modChip.type = 'button';
  devBtn.addEventListener('click', function () { open(); });
  modChip.addEventListener('click', function () { open(); });
  badge.appendChild(devBtn); badge.appendChild(modChip);
  var host = document.getElementById('juego') || document.body;
  if (host === document.body) badge.classList.add('fixed');
  host.appendChild(badge);
  document.body.appendChild(root);

  /* Textos fijos de la interfaz (se recalculan al cambiar de idioma). */
  function applyStaticTexts() {
    panel.setAttribute('aria-label', tr('dev.aria'));
    titleTxt.textContent = tr('dev.title');
    titleSub.textContent = tr('dev.subtitle');
    closeBtn.title = tr('dev.close');
    note.textContent = '';
    note.appendChild(el('span', 'owd-tag live', tr('dev.tag.live')));
    note.appendChild(document.createTextNode(' ' + tr('dev.note.live') + ' · '));
    note.appendChild(el('span', 'owd-tag rst', tr('dev.tag.restart')));
    note.appendChild(document.createTextNode(' ' + tr('dev.note.restart')));
    TABS.forEach(function (t) { tabBtns[t].textContent = tr('dev.tab.' + t); });
    restartBtn.textContent = tr('dev.btn.restart'); restartBtn.title = tr('dev.btn.restart_title');
    resetAllBtn.textContent = state.armedReset ? tr('dev.btn.sure') : tr('dev.btn.resetall');
    exportBtn.textContent = tr('dev.btn.export'); exportBtn.title = tr('dev.btn.export_title');
    jsonBtn.textContent = tr('dev.btn.json');
    devBtn.title = tr('dev.badge.title');
    modChip.title = tr('dev.badge.mod_title');
  }

  function updateBadge() {
    var n = TU.count();
    devBtn.hidden = !devQuery;
    modChip.hidden = n === 0;
    modChip.textContent = tr('dev.badge.mod', { n: n });
    badge.hidden = devBtn.hidden && modChip.hidden;
    counter.textContent = n ? tr(n === 1 ? 'dev.count.one' : 'dev.count.many', { n: n }) : tr('dev.count.none');
    counter.classList.toggle('on', n > 0);
  }

  /* ---------- Tras cada cambio ---------- */
  function changed() {
    if (OW.syncLevels) OW.syncLevels();
    TU.save();
    controls.forEach(function (c) { c.mark(); });
    updateBadge();
  }

  /* ---------- Controles ---------- */
  function liveTag(f) {
    var t = el('span', 'owd-tag ' + (f.live ? 'live' : 'rst'), f.live ? '●' : '↻');
    t.title = tr(f.live ? 'dev.tip.live' : 'dev.tip.restart');
    return t;
  }
  function resetButton(paths, after) {
    var b = el('button', 'owd-reset', '↺');
    b.type = 'button'; b.tabIndex = -1;
    b.addEventListener('click', function () { paths.forEach(function (p) { TU.reset(p); }); changed(); after(); });
    return b;
  }
  function defText(f, d) {
    if (d === undefined) return '—';
    if (f.type === 'tuple') return f.idx.map(function (i) { return fmt(d[i]); }).join(' / ');
    if (f.type === 'bool') return tr(d ? 'dev.yes' : 'dev.no');
    if (f.type === 'tasks') return d.map(taskName).join(', ');
    if (Array.isArray(d)) return d.map(fmt).join(', ');
    return fmt(d);
  }

  /* Construye el editor de un valor en `path`; devuelve el elemento con los inputs. */
  function makeEditor(f, path, highlightEl) {
    var wrap = el('div', 'owd-ed owd-t-' + f.type);
    var ctl = { paths: [path], root: highlightEl, refresh: null, mark: null };
    var inputs = [];
    if (TU.get(path) === undefined) { wrap.appendChild(el('span', 'owd-unit', '—')); return wrap; }

    function numInput(get, onVal) {
      var i = el('input', 'owd-in');
      i.type = 'text'; i.inputMode = 'decimal'; i.spellcheck = false; i.autocomplete = 'off';
      i.addEventListener('input', function () { onVal(i); });
      i.addEventListener('blur', function () { i.classList.remove('bad'); i.title = ''; ctl.refresh(); });
      i._get = get;
      inputs.push(i);
      return i;
    }
    function bad(i, why) { i.classList.add('bad'); i.title = why; }
    function rangeMsg() { return tr(f.int ? 'dev.range_int' : 'dev.range', { min: f.min, max: f.max }); }

    if (f.type === 'num') {
      var ni = numInput(function () { return fmt(TU.get(path)); }, function (i) {
        var v = parseNum(i.value);
        if (validate(path, v)) { i.classList.remove('bad'); TU.set(path, v); changed(); } else bad(i, rangeMsg());
      });
      wrap.appendChild(ni);
    } else if (f.type === 'tuple') {
      f.idx.forEach(function (ix, n) {
        var cell = el('label', 'owd-sub');
        if (f.labels) cell.appendChild(el('span', 'owd-sublbl', subLabel(f.labels[n])));
        var ti = numInput(function () { var a = TU.get(path); return a ? fmt(a[ix]) : ''; }, function () {
          var cur = TU.get(path).slice(), okAll = true;
          inputs.forEach(function (inp, m) { var v = parseNum(inp.value); cur[f.idx[m]] = v; if (!numOk(f, v)) { okAll = false; bad(inp, rangeMsg()); } else inp.classList.remove('bad'); });
          if (okAll && validate(path, cur)) { TU.set(path, cur); changed(); }
          else if (okAll) inputs.forEach(function (inp) { bad(inp, f.asc ? tr('dev.ascending') : rangeMsg()); });
        });
        cell.appendChild(ti);
        wrap.appendChild(cell);
      });
    } else if (f.type === 'bool') {
      var cb = el('input', 'owd-cb');
      cb.type = 'checkbox';
      cb.addEventListener('change', function () { TU.set(path, cb.checked); changed(); });
      cb._get = function () { return TU.get(path); };
      inputs.push(cb);
      var sw = el('label', 'owd-switch'); sw.appendChild(cb); sw.appendChild(el('span', 'owd-knob'));
      wrap.appendChild(sw);
    } else if (f.type === 'text') {
      var tx = el('input', 'owd-in owd-text');
      tx.type = 'text'; tx.maxLength = 140; tx.spellcheck = false;
      tx.addEventListener('input', function () { if (validate(path, tx.value)) { tx.classList.remove('bad'); TU.set(path, tx.value); changed(); } else bad(tx, tr('dev.max140')); });
      tx._get = function () { return TU.get(path); };
      inputs.push(tx); wrap.appendChild(tx);
    } else if (f.type === 'color') {
      var co = el('input', 'owd-color');
      co.type = 'color';
      co.addEventListener('input', function () { if (validate(path, co.value)) { TU.set(path, co.value); changed(); } });
      co._get = function () { return TU.get(path); };
      inputs.push(co); wrap.appendChild(co);
    } else if (f.type === 'tasks') {
      var wPath = path.replace(/\.[^.]+$/, '.weights');
      ctl.paths.push(wPath);
      var T = taskList(), keys = Object.keys(T), rows = [];
      var wField = described(LEVEL_FIELDS, 'weights');
      var apply = function () {
        var rec = [], wts = [], okW = true;
        rows.forEach(function (r) {
          if (!r.cb.checked) { r.w.classList.remove('bad'); return; }
          var w = parseNum(r.w.value);
          if (!numOk(wField, w)) { okW = false; bad(r.w, tr('dev.weight_range')); } else r.w.classList.remove('bad');
          rec.push(r.key); wts.push(w);
        });
        if (!rec.length) { flash(tr('dev.msg.one_task'), true); return; }
        if (!okW) return;
        if (validate(path, rec) && validate(wPath, wts)) { TU.set(path, rec); TU.set(wPath, wts); changed(); }
      };
      keys.forEach(function (key) {
        var tk = T[key], line = el('label', 'owd-rec');
        var cb = el('input', 'owd-cb'); cb.type = 'checkbox';
        var lanes = el('span', 'owd-lanes'), ln = tk.lanes && tk.lanes.length ? tk.lanes : [tk.kind || key];
        ln.forEach(function (l) { lanes.appendChild(el('i', 'ln-' + l)); });
        var name = el('span', 'owd-recname', taskName(key));
        line.title = taskName(key) + (tk.lanes && tk.lanes.length ? ': ' + tk.lanes.map(laneName).join(' + ') : '');
        var w = el('input', 'owd-in owd-w'); w.type = 'text'; w.inputMode = 'decimal'; w.title = tr('dev.weight');
        var r = { key: key, cb: cb, w: w, last: '2' };
        cb.addEventListener('change', function () { w.disabled = !cb.checked; if (cb.checked && !w.value) w.value = r.last; apply(); });
        w.addEventListener('input', apply);
        w.addEventListener('blur', function () { ctl.refresh(); });
        line.appendChild(cb); line.appendChild(lanes); line.appendChild(name); line.appendChild(w);
        wrap.appendChild(line); rows.push(r);
      });
      ctl.refreshRecipes = function () {
        var rec = TU.get(path) || [], wts = TU.get(wPath) || [];
        rows.forEach(function (r) {
          var i = rec.indexOf(r.key);
          r.cb.checked = i >= 0; r.w.disabled = i < 0; r.w.classList.remove('bad');
          if (i >= 0) { r.w.value = fmt(wts[i] != null ? wts[i] : 1); r.last = r.w.value; } else r.w.value = '';
        });
      };
    }

    ctl.refresh = function () {
      if (ctl.refreshRecipes) ctl.refreshRecipes();
      inputs.forEach(function (i) {
        if (document.activeElement === i && i.type === 'text' && i.classList.contains('bad')) return;
        if (i.type === 'checkbox') i.checked = !!i._get(); else if (i._get) i.value = i._get();
      });
      ctl.mark();
    };
    ctl.mark = function () {
      var mod = ctl.paths.some(function (p) { return !same(TU.get(p), TU.def(p)); });
      highlightEl.classList.toggle('mod', mod);
      highlightEl.title = mod ? tr('dev.modified', { def: defText(f, TU.def(path)) }) : '';
    };
    var rb = resetButton(ctl.paths, function () { ctl.refresh(); });
    rb.title = tr('dev.reset_one', { def: defText(f, TU.def(path)) });
    wrap.appendChild(rb);
    controls.push(ctl);
    ctl.refresh();
    return wrap;
  }

  /* ---------- Pestañas ---------- */
  function renderGroups(tab) {
    var grid = el('div', 'owd-grid');
    liveGroups().filter(function (g) { return g.tab === tab && g.fields.length; }).forEach(function (g) {
      var card = el('section', 'owd-card');
      card.appendChild(el('h3', null, groupTitle(g.key)));
      g.fields.forEach(function (f) {
        var row = el('div', 'owd-row');
        var lab = el('div', 'owd-lab');
        var top = el('div', 'owd-labtop');
        top.appendChild(liveTag(f));
        top.appendChild(el('span', 'owd-name', fLabel(f)));
        lab.appendChild(top);
        lab.appendChild(el('div', 'owd-help', fHelp(f)));
        row.appendChild(lab);
        row.appendChild(makeEditor(f, g.key + '.' + f.k, row));
        row.appendChild(el('span', 'owd-unit', unitText(f.unit)));
        card.appendChild(row);
      });
      grid.appendChild(card);
    });
    return grid;
  }

  function renderTable(fields, cols, pathOf, headOf) {
    var wrap = el('div', 'owd-tablewrap');
    var t = el('table', 'owd-table');
    var thead = el('thead'), tr0 = el('tr');
    tr0.appendChild(el('th', 'owd-corner', tr('dev.param')));
    cols.forEach(function (c, i) { tr0.appendChild(headOf(c, i)); });
    thead.appendChild(tr0); t.appendChild(thead);
    var tb = el('tbody');
    fields.forEach(function (f) {
      if (f.type === 'weights') return; // se edita junto a las tareas
      var row = el('tr');
      var th = el('th', 'owd-rowhead');
      var top = el('div', 'owd-labtop');
      top.appendChild(liveTag(f));
      top.appendChild(el('span', 'owd-name', fLabel(f)));
      if (f.unit) top.appendChild(el('span', 'owd-unit', unitText(f.unit)));
      th.appendChild(top);
      th.appendChild(el('div', 'owd-help', fHelp(f)));
      row.appendChild(th);
      cols.forEach(function (c, i) {
        var td = el('td');
        td.appendChild(makeEditor(f, pathOf(c, i, f), td));
        row.appendChild(td);
      });
      tb.appendChild(row);
    });
    t.appendChild(tb); wrap.appendChild(t);
    return wrap;
  }

  function renderDiff() {
    var ds = OW.TUNING.difficulties || [];
    return renderTable(diffFields(), ds, function (c, i, f) { return 'difficulties.' + i + '.' + f.k; }, function (d, i) {
      var th = el('th', 'owd-colhead');
      var sw = el('span', 'owd-dot'); sw.style.background = d.color || '#888';
      th.appendChild(sw); th.appendChild(document.createTextNode(diffName(d, i)));
      var cur = OW.Save && OW.Save.data.difficulty;
      if (cur === i) th.appendChild(el('span', 'owd-cur', tr('dev.current')));
      return th;
    });
  }
  function renderLevels() {
    var ids = Object.keys(OW.TUNING.levels || {});
    return renderTable(levelFields(), ids, function (id, i, f) { return 'levels.' + id + '.' + f.k; }, function (id) {
      var lv = null; (OW.LEVELS || []).forEach(function (x) { if (String(x.id) === id) lv = x; });
      var th = el('th', 'owd-colhead');
      th.appendChild(el('span', 'owd-num', id));
      th.appendChild(document.createTextNode(levelName(lv, id)));
      var g = OW.App && OW.App.game;
      if (g && lv && g.li === OW.LEVELS.indexOf(lv) && inGame()) th.appendChild(el('span', 'owd-cur', tr('dev.playing')));
      return th;
    });
  }

  /* ---------- Vistas de exportación ---------- */
  function copyText(text, ta) {
    var done = function () { flash(tr('dev.msg.copied')); };
    var fallback = function () {
      try { ta.focus(); ta.select(); if (document.execCommand('copy')) done(); else flash(tr('dev.msg.nocopy'), true); }
      catch (e) { flash(tr('dev.msg.nocopy'), true); }
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
    } catch (e) { fallback(); }
  }
  function download(name, text) {
    try {
      var blob = new Blob([text], { type: 'text/javascript;charset=utf-8' });
      var url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = name; a.style.display = 'none';
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);
      flash(tr('dev.msg.downloaded', { name: name }));
    } catch (e) { flash(tr('dev.msg.nodownload'), true); }
  }
  function textBtn(label, cls, fn) { var b = btn(cls, fn); b.textContent = label; return b; }
  function ioView(titleText, introHtml, text, buttons, editable) {
    var v = el('div', 'owd-io');
    var h = el('div', 'owd-iohead');
    h.appendChild(textBtn(tr('dev.btn.back'), 'ghost', function () { state.view = null; render(); }));
    h.appendChild(el('h3', null, titleText));
    v.appendChild(h);
    var p = el('p', 'owd-iointro'); p.innerHTML = introHtml; v.appendChild(p);
    var ta = el('textarea', 'owd-ta');
    ta.value = text; ta.spellcheck = false; ta.readOnly = !editable;
    v.appendChild(ta);
    var bar = el('div', 'owd-iobar');
    buttons(ta).forEach(function (b) { bar.appendChild(b); });
    v.appendChild(bar);
    return { el: v, ta: ta };
  }
  function showExport() { state.view = 'export'; render(); }
  function showJSON() { state.view = 'json'; render(); }
  function renderExport() {
    var text = exportTuningJS();
    var v = ioView(tr('dev.export.title'), tr('dev.export.intro'), text, function (ta) {
      return [textBtn(tr('dev.btn.copy'), 'primary', function () { copyText(text, ta); }),
        textBtn(tr('dev.btn.download'), '', function () { download('tuning.js', text); })];
    }, false);
    setTimeout(function () { copyText(text, v.ta); }, 0);
    return v.el;
  }
  function renderJSON() {
    var text = JSON.stringify({ format: 'overmanaging-tuning', version: 1, overrides: TU.diff() }, null, 2);
    var v = ioView(tr('dev.json.title'), tr('dev.json.intro'), text, function (ta) {
      return [textBtn(tr('dev.btn.import'), 'primary', function () { importJSON(ta.value); }),
        textBtn(tr('dev.btn.copy_short'), '', function () { copyText(ta.value, ta); })];
    }, true);
    return v.el;
  }
  function flatten(o, pre, out) {
    for (var k in o) {
      if (!own(o, k)) continue;
      var p = pre ? pre + '.' + k : k, v = o[k];
      if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, p, out); else out[p] = v;
    }
    return out;
  }
  function importJSON(txt) {
    var o;
    try { o = JSON.parse(txt); } catch (e) { flash(tr('dev.msg.badjson') + ': ' + e.message, true); return; }
    if (!o || typeof o !== 'object') { flash(tr('dev.msg.badjson'), true); return; }
    var src = o.overrides && typeof o.overrides === 'object' ? o.overrides : o;
    var map = {};
    for (var k in src) {
      if (!own(src, k)) continue;
      if (k.indexOf('.') >= 0) map[k] = src[k];
      else if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k])) flatten(src[k], k, map);
    }
    // tareas y pesos van juntos: aplicar primero las tareas
    var keys = Object.keys(map).sort(function (a, b) { return (/\.weights$/.test(a) ? 1 : 0) - (/\.weights$/.test(b) ? 1 : 0); });
    var ordered = {}; keys.forEach(function (k2) { ordered[k2] = map[k2]; });
    var total = keys.length, okN = TU.apply(ordered);
    changed(); state.view = null; render();
    flash(tr(okN < total ? 'dev.msg.imported_some' : 'dev.msg.imported', { ok: okN, total: total }), okN < total);
  }

  /* ---------- Render principal ---------- */
  function inGame() {
    var A = OW.App;
    return !!(A && A.game && ['play', 'pause', 'intro', 'timeup'].indexOf(A.name) >= 0);
  }
  function render() {
    controls = [];
    body.textContent = '';
    applyStaticTexts();
    for (var k in tabBtns) tabBtns[k].classList.toggle('on', k === state.tab && !state.view);
    try {
      if (state.view === 'export') body.appendChild(renderExport());
      else if (state.view === 'json') body.appendChild(renderJSON());
      else if (state.tab === 'player' || state.tab === 'flow') body.appendChild(renderGroups(state.tab));
      else if (state.tab === 'diff') body.appendChild(renderDiff());
      else body.appendChild(renderLevels());
    } catch (e) {
      console.error('DevPanel:', e);
      body.appendChild(el('p', 'owd-note', tr('dev.msg.render_error') + ' ' + (e && e.message)));
    }
    restartBtn.hidden = !inGame();
    updateBadge();
  }

  /* ---------- Abrir / cerrar ---------- */
  var htmlEl = document.documentElement;
  function open() {
    if (state.open) return;
    state.open = true;
    if (OW.App) OW.App.frozen = true;
    if (OW.Input && OW.Input.releaseAll) OW.Input.releaseAll();
    root.hidden = false;
    htmlEl.classList.add('owd-lock');
    render();
    try { panel.focus({ preventScroll: true }); } catch (e) { panel.focus(); }
  }
  function close() {
    if (!state.open) return;
    state.open = false;
    root.hidden = true;
    htmlEl.classList.remove('owd-lock');
    if (OW.Input && OW.Input.releaseAll) OW.Input.releaseAll();
    if (OW.App) OW.App.frozen = false;
    var c = document.getElementById('game');
    if (c) { try { c.focus({ preventScroll: true }); } catch (e) { c.focus(); } }
  }
  function toggle() { if (state.open) close(); else open(); }
  function restartLevel() {
    var A = OW.App;
    if (!A || !A.game) return;
    var li = A.game.li, pl = A.players;
    close();
    A.startLevel(li, pl, false);
  }

  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  // En fase de captura: F9/Esc se gestionan aquí y no llegan al juego.
  window.addEventListener('keydown', function (e) {
    if (e.code === 'F9' || e.key === 'F9') { e.preventDefault(); e.stopPropagation(); toggle(); return; }
    if (state.open && (e.code === 'Escape' || e.key === 'Escape')) { e.preventDefault(); e.stopPropagation(); close(); }
  }, true);
  if (OW.Input) OW.Input.blockKeys = function () { return state.open; };

  // cambio de idioma en caliente
  if (OW.I18N && OW.I18N.onChange) OW.I18N.onChange(function () { if (state.open) render(); else { applyStaticTexts(); updateBadge(); } });

  applyStaticTexts();
  updateBadge();

  OW.DevPanel = {
    open: open, close: close, toggle: toggle, isOpen: function () { return state.open; },
    exportTuningJS: exportTuningJS, validate: validate, restartLevel: restartLevel,
    tab: function (t) { state.tab = t === 'pipeline' ? 'flow' : t; state.view = null; if (state.open) render(); },
    view: function (v) { state.view = v; if (state.open) render(); },
    importJSON: importJSON, refreshBadge: updateBadge,
    META: { groups: GROUPS, difficulty: DIFF_FIELDS, level: LEVEL_FIELDS, liveGroups: liveGroups }
  };
})();
