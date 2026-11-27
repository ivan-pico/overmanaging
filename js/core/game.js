/* OVERMANAGING — CORE: lógica de partida (estaciones, flujo de documentos, agenda, teléfono,
 * one-to-ones, peligros y dibujado del mundo).
 *
 * Flujo: fuente (src_budget/src_plan/src_report) → encargo 'brief' → escritorio (mantener) → 'draft'
 *   → impresora (sola, se atasca y arde si no se recoge) → 'printout' → mesa de firmas (mantener) → 'approved'
 *   → dentro de un 'dossier' (pila de carpetas) → sala de reuniones: cumple una cita 'dossier' de la agenda.
 *   6 s después el dossier vuelve a Actas como 'dossier_minutes' pendiente; mantener allí para archivarla.
 * Citas 'call': el teléfono suena; manos vacías + mantener Acción 2 s. Citas 'one2one': escritorio del
 *   compañero (team_desk) concreto; manos vacías + mantener 3 s (sin poder moverse).
 * Ningún texto traducido se guarda en estructuras persistentes: se guarda la clave y se traduce al leer.
 */
(function () {
  'use strict';
  var OW = window.OW, C = OW.C, U = OW.U;
  var T = C.TILE;
  var tr = OW.tr || function (k) { return k; };

  var DECOR = { wall: 1, plant: 1, bookshelf: 1, whiteboard: 1 };
  var SURFACE = { counter: 1, desk: 1, approval: 1, conveyor: 1 };
  var SOURCE = OW.SOURCE_LANE || { src_budget: 'budget', src_plan: 'plan', src_report: 'report' };
  /* Tiempos, multas, fuego, notificaciones, apagones...: todo en js/core/tuning.js. Se lee en cada uso
   * (no se copia), así los cambios del panel de ajustes (F9) se notan al instante. */
  var TU = OW.TUNING, PL = TU.pipeline;
  var BUSY_TIME = 1.6; // duración de la animación de "reunión cumplida" en la sala

  function item(kind, lane) { return { kind: kind, lane: lane || null, contents: [], prog: 0 }; }
  OW.makeItem = item;

  /* Sonido con alternativa: si el audio sabe decir qué sonidos tiene (OW.Audio.has) y no tiene el nuevo,
   * suena el del juego original. */
  function sfx(name, fallback, opts) {
    var A = OW.Audio;
    if (fallback) { try { if (A && typeof A.has === 'function' && !A.has(name)) name = fallback; } catch (e) { /* nada */ } }
    OW.sfx(name, opts);
  }

  /* Texto con getter traducido (para banners y similares que viven varios frames). */
  function i18nObj(fields) {
    var o = {};
    Object.keys(fields).forEach(function (k) {
      var v = fields[k];
      if (v && typeof v === 'object' && v.key) {
        Object.defineProperty(o, k, { enumerable: true, get: function () { return tr(v.key, v.params); } });
        o[k + 'Key'] = v.key;
      } else o[k] = v;
    });
    return o;
  }

  /* Tutorial guiado del nivel 1. text: clave i18n (js/i18n/strings_core.js). */
  var TUTORIAL = [
    { ev: 'brief', key: 'tut.1' },
    { ev: 'draft', key: 'tut.2' },
    { ev: 'printout', key: 'tut.3' },
    { ev: 'approved', key: 'tut.4' },
    { ev: 'deliver', key: 'tut.5' },
    { ev: 'call', key: 'tut.6' },
    { ev: null, dur: 8, key: 'tut.7' }
  ];
  TUTORIAL.forEach(function (s) { Object.defineProperty(s, 'text', { enumerable: false, get: function () { return tr(s.key); } }); });
  var TUT_CALL = 5;

  function Game(levelIndex, numPlayers) {
    this.li = levelIndex;
    if (OW.syncLevels) OW.syncLevels();
    this.level = OW.applyDifficulty(OW.LEVELS[levelIndex]);
    this.theme = this.level.theme;
    this.numPlayers = numPlayers;
    this.solo = numPlayers === 1;
    this.t = 0;
    this.timeLeft = this.level.duration;
    this.score = 0; this.scoreBump = 0;
    this.stats = { delivered: 0, expired: 0, wrong: 0, tips: 0, fires: 0, bugs: 0, notifs: 0, meetings: 0,
      burnt: 0, coffees: 0, calls: 0, one2ones: 0, dossiers: 0 };
    this.grid = []; this.stations = [];
    this.players = []; this.notifs = []; this.manager = null;
    this.bugs = this.notifs; // alias (mismo array)
    this.orders = []; this.orderSeq = 0; this.returns = []; this.rockets = [];
    this.phones = []; this.teamDesks = []; this.meetingRooms = [];
    this.shake = 0; this.active = 0; this.over = false;
    this.orderTimer = 2.5;
    this.intensity = 0;
    this.darkness = this.level.darkness || 0;
    this.blackout = { next: TU.blackout.firstAt, t: 0, on: false };
    this.tutorial = this.level.tutorial ? { step: 0, t: 0, callT: 0 } : null;
    this.warnBeepT = 0; this.ringT = 0;
    this.build();
    for (var i = 0; i < (this.level.startOrders || 1); i++) this.spawnOrder(i === 0 && this.level.tutorial ? 'budget_meeting' : null, true);
    this.orderTimer = U.rand(this.level.orderGap[0], this.level.orderGap[1]) * TU.orders.firstGapFactor;
  }

  Game.prototype.build = function () {
    var lv = this.level, spawns = [], mgr = null, firstStack = null, npc = 0;
    for (var r = 0; r < C.ROWS; r++) {
      this.grid.push([]);
      for (var c = 0; c < C.COLS; c++) {
        var ch = lv.map[r].charAt(c), type = OW.LEGEND[ch], st = null;
        if (ch === '1' || ch === '2') spawns[+ch - 1] = { c: c, r: r };
        if (ch === 'M') mgr = { c: c, r: r };
        if (type) {
          st = {
            type: type, col: c, row: r, x: C.OX + c * T, y: C.OY + r * T, dir: null, item: null,
            fire: 0, spreadT: 0, notif: null, cookT: 0, overT: 0, count: 0, dirty: 0, clean: 0, washT: 0,
            convT: 0.5, workT: 0, sfxT: 0, fxT: 0, drinkT: 0, hold: 0, npcIdx: -1
          };
          if (ch === '>') st.dir = { x: 1, y: 0 };
          if (ch === '<') st.dir = { x: -1, y: 0 };
          if (ch === '^') st.dir = { x: 0, y: -1 };
          if (ch === 'v') st.dir = { x: 0, y: 1 };
          if (ch === 'E') st.item = item('extinguisher');
          if (type === 'folder_stack' && !firstStack) firstStack = st;
          if (type === 'phone') this.phones.push(st);
          if (type === 'meeting_room') this.meetingRooms.push(st);
          if (type === 'team_desk') { st.npcIdx = npc++ % OW.NPCS.length; this.teamDesks.push(st); }
          this.stations.push(st);
        }
        this.grid[r].push(st);
      }
    }
    if (firstStack) firstStack.count = lv.dossiers;
    this.folderStack = firstStack;
    this.minutes = this.stations.filter(function (s) { return s.type === 'minutes'; })[0] || null;
    for (var i = 0; i < 2; i++) {
      var sp = spawns[i] || this.anyFloor();
      this.players.push(new OW.Player(i, C.OX + sp.c * T + T / 2, C.OY + sp.r * T + T / 2 + 8));
    }
    if (lv.manager) {
      var m = mgr || this.anyFloor();
      this.manager = new OW.Manager(this, m.c, m.r);
    }
    this.updateSelection();
  };
  Game.prototype.anyFloor = function () {
    for (var r = 1; r < C.ROWS; r++) for (var c = 1; c < C.COLS; c++) if (!this.grid[r][c]) return { c: c, r: r };
    return { c: 1, r: 1 };
  };
  Game.prototype.isSolid = function (c, r) {
    if (c < 0 || r < 0 || c >= C.COLS || r >= C.ROWS) return true;
    return !!this.grid[r][c];
  };
  Game.prototype.stationAt = function (c, r) {
    if (c < 0 || r < 0 || c >= C.COLS || r >= C.ROWS) return null;
    return this.grid[r][c];
  };
  Game.prototype.updateSelection = function () {
    for (var i = 0; i < this.players.length; i++) this.players[i].selected = this.solo && i === this.active;
  };
  Game.prototype.emit = function (ev) {
    var tu = this.tutorial;
    if (!tu) return;
    for (var i = tu.step; i < TUTORIAL.length; i++) {
      if (TUTORIAL[i].ev === ev) { tu.step = i + 1; tu.t = 0; break; }
    }
    if (tu.step === TUT_CALL) tu.callT = 1.2; // pronto sonará el teléfono
  };
  Game.prototype.tutorialText = function () {
    var tu = this.tutorial;
    if (!tu || tu.step >= TUTORIAL.length) return null;
    return tr(TUTORIAL[tu.step].key);
  };
  Game.prototype.tutorialKey = function () {
    var tu = this.tutorial;
    return tu && tu.step < TUTORIAL.length ? TUTORIAL[tu.step].key : null;
  };

  /* ---------------- Agenda (citas) ---------------- */
  Game.prototype.liveOrders = function () { return this.orders.filter(function (o) { return !o.done; }); };
  Game.prototype.liveOf = function (kind) { return this.orders.filter(function (o) { return !o.done && o.kind === kind; }); };
  /* NPC (índice) con un one-to-one pendiente en este escritorio, o la cita en sí. */
  Game.prototype.one2oneFor = function (st) {
    if (!st || st.type !== 'team_desk') return null;
    for (var i = 0; i < this.orders.length; i++) {
      var o = this.orders[i];
      if (!o.done && o.kind === 'one2one' && o.target === st.npcIdx) return o;
    }
    return null;
  };
  /* Índice de un NPC del mapa sin one-to-one pendiente (aleatorio) o null. */
  Game.prototype.freeNpc = function () {
    var self = this, free = this.teamDesks.filter(function (st) { return !self.one2oneFor(st); });
    return free.length ? U.pick(free).npcIdx : null;
  };
  Game.prototype.callsBlocked = function () {
    // tutorial: no hay llamadas al azar hasta pasar el paso del teléfono (ese paso fuerza la suya)
    return !!(this.tutorial && this.tutorial.step <= TUT_CALL && this.t < 120);
  };
  /* ¿Puede salir esta tarea ahora mismo en este mapa? */
  Game.prototype.taskAvailable = function (key) {
    var tk = OW.TASKS[key];
    if (!tk) return false;
    if (tk.kind === 'call') return this.phones.length > 0 && !this.callsBlocked() && this.liveOf('call').length < (TU.tasks.maxCalls || 1);
    if (tk.kind === 'one2one') return this.teamDesks.length > 0 && this.freeNpc() != null;
    return this.meetingRooms.length > 0;
  };
  Game.prototype.rollTask = function () {
    var lv = this.level, keys = [], w = [], total = 0;
    for (var i = 0; i < lv.tasks.length; i++) {
      if (!this.taskAvailable(lv.tasks[i])) continue;
      keys.push(lv.tasks[i]); w.push(lv.weights && lv.weights[i] != null ? lv.weights[i] : 1); total += w[w.length - 1];
    }
    if (!keys.length) return null;
    var roll = Math.random() * total;
    for (var j = 0; j < keys.length; j++) { roll -= w[j]; if (roll <= 0) return keys[j]; }
    return keys[0];
  };
  Game.prototype.spawnOrder = function (forceKey, silent) {
    var lv = this.level, key = forceKey && OW.TASKS[forceKey] ? forceKey : this.rollTask();
    if (!key) return null;
    var tk = OW.TASKS[key], n = tk.lanes.length, time, value, target = null, params = null;
    if (tk.kind === 'call') { time = TU.tasks.callTime; value = TU.tasks.callValue; }
    else if (tk.kind === 'one2one') {
      target = this.freeNpc();
      if (target == null) return null;
      time = TU.tasks.one2oneTime; value = TU.tasks.one2oneValue;
      params = {};
      (function (idx) { Object.defineProperty(params, 'name', { enumerable: true, get: function () { return OW.npcName(idx); } }); })(target);
    } else { time = OW.TASK_TIME[n]; value = OW.TASK_VALUE[n]; }
    time *= (lv.timeMul || 1);
    var o = {
      id: ++this.orderSeq, task: key, key: key, kind: tk.kind, lanes: tk.lanes.slice(), nameKey: tk.nameKey, nameParams: params,
      target: target, timeTotal: time, timeLeft: time, value: value,
      flash: 1, entering: 0, removing: 0, done: false, drawX: null
    };
    // name: traducido al leerlo (no se guarda). time/maxTime: alias de timeLeft/timeTotal (contrato §1.1).
    Object.defineProperty(o, 'name', { enumerable: false, get: function () { return tr(o.nameKey, o.nameParams); } });
    Object.defineProperty(o, 'time', { enumerable: false, get: function () { return o.timeLeft; } });
    Object.defineProperty(o, 'maxTime', { enumerable: false, get: function () { return o.timeTotal; } });
    this.orders.push(o);
    if (!silent) {
      OW.sfx('order_new');
      if (o.kind === 'call') { this.ringT = 0; }
      if (o.kind === 'one2one') {
        var d = this.teamDesks.filter(function (s) { return s.npcIdx === target; })[0];
        if (d) OW.fx('text', d.x + T / 2, d.y - 14, { text: tr('game.one2one_ask', { name: OW.npcName(target) }), color: '#ffe082', size: 16 });
      }
    }
    return o;
  };

  Game.prototype.updateOrders = function (dt) {
    var live = this.liveOrders();
    this.orderTimer -= dt;
    if (live.length === 0) this.orderTimer = Math.min(this.orderTimer, TU.orders.emptyRefill);
    else if (live.length === 1 && !this.tutorialText()) this.orderTimer = Math.min(this.orderTimer, TU.orders.singleRefill);
    if (this.orderTimer <= 0 && live.length < this.level.maxOrders) {
      this.spawnOrder();
      this.orderTimer = U.rand(this.level.orderGap[0], this.level.orderGap[1]);
    }
    // tutorial: en el paso del teléfono se fuerza una llamada (y se repite si caduca)
    var tu = this.tutorial;
    if (tu && tu.step === TUT_CALL && !this.liveOf('call').length && this.phones.length) {
      tu.callT -= dt;
      if (tu.callT <= 0) { this.spawnOrder('call'); tu.callT = 2; }
    }
    for (var i = this.orders.length - 1; i >= 0; i--) {
      var o = this.orders[i];
      o.entering = Math.min(1, o.entering + dt * 2.5);
      o.flash = Math.max(0, o.flash - dt * 1.5);
      if (o.done) {
        o.removing -= dt;
        if (o.removing <= 0) this.orders.splice(i, 1);
        continue;
      }
      o.timeLeft -= dt;
      if (o.timeLeft < 10) o.flash = Math.max(o.flash, 0.35 + 0.35 * Math.sin(this.t * 10));
      if (o.timeLeft <= 0) {
        o.timeLeft = 0; o.done = true; o.removing = 0.5; o.flash = 1; o.failed = true;
        this.stats.expired++;
        this.addScore(-TU.orders.expirePenalty);
        OW.sfx('order_fail');
        OW.fx('text', 640, 150, { text: tr('game.expired', { name: o.name, n: TU.orders.expirePenalty }), color: '#ff6b6b', size: 26 });
        this.shake = Math.max(this.shake, 6);
      }
    }
  };
  Game.prototype.addScore = function (v) {
    this.score = Math.max(0, this.score + v);
    this.scoreBump = 1;
  };

  /* Marca una cita como cumplida: puntos + bonus por rapidez, efectos y estadísticas. */
  Game.prototype.completeOrder = function (o, cx, cy) {
    var frac = o.timeTotal > 0 ? o.timeLeft / o.timeTotal : 0;
    var tip = U.round5(o.value * TU.orders.tipFactor * frac);
    o.done = true; o.removing = 0.5; o.flash = 1; o.delivered = true;
    this.addScore(o.value + tip);
    this.stats.delivered++; this.stats.tips += tip;
    if (o.kind === 'call') this.stats.calls++;
    else if (o.kind === 'one2one') this.stats.one2ones++;
    else this.stats.dossiers++;
    OW.fx('coins', cx, cy - 20, { count: o.kind === 'dossier' ? 10 : 6 });
    OW.fx('text', cx, cy - 50, { text: '+' + o.value + '€', color: '#ffd23f', size: 28 });
    if (tip > 0) OW.fx('text', cx, cy - 80, { text: tr('game.tip', { n: tip }), color: '#7cff9b', size: 20, life: 1.6 });
    return tip;
  };

  /* Entrega de un dossier en la sala de reuniones (antes deployPR). */
  Game.prototype.deliverDossier = function (dossier, st) {
    var cx = st.x + T / 2, cy = st.y + T / 2;
    var match = null;
    for (var i = 0; i < this.orders.length; i++) {
      var o = this.orders[i];
      if (o.done || o.kind !== 'dossier' || !U.sameSet(o.lanes, dossier.contents)) continue;
      if (!match || o.timeLeft < match.timeLeft) match = o;
    }
    if (match) {
      this.completeOrder(match, cx, cy);
      sfx('meeting_done', 'deliver');
      this.shake = Math.max(this.shake, 4);
      OW.fx('confetti', cx, cy - 20, { count: 40 });
      OW.fx('text', cx, cy - 110, { text: tr('game.meeting_done'), color: '#ffffff', size: 20, life: 1.6 });
      this.rockets.push({ x: cx, y: cy - 10, t: 0 });
      this.setBusy(st);
      this.emit('deliver');
    } else {
      this.stats.wrong++;
      OW.sfx('wrong');
      OW.fx('text', cx, cy - 50, { text: tr('game.rejected'), color: '#ff6b6b', size: 22 });
      OW.fx('smoke', cx, cy - 10, { count: 8 });
      this.shake = Math.max(this.shake, 5);
    }
    this.returns.push({ t: PL.returnDelay });
  };
  Game.prototype.deployPR = Game.prototype.deliverDossier; // alias
  /* La sala de reuniones ocupa varias casillas (Y en vertical u horizontal): animarlas todas. */
  Game.prototype.setBusy = function (st) {
    var seen = {}, q = [st];
    while (q.length) {
      var s = q.pop(), k = s.col + ',' + s.row;
      if (seen[k]) continue;
      seen[k] = 1; s.workT = BUSY_TIME;
      var nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var i = 0; i < 4; i++) { var n = this.stationAt(s.col + nb[i][0], s.row + nb[i][1]); if (n && n.type === s.type) q.push(n); }
    }
  };

  /* ---------------- Interacción ---------------- */
  Game.prototype.findTarget = function (p) {
    var fx = p.x + p.dir.x * (p.r + 22), fy = p.y - 6 + p.dir.y * (p.r + 22);
    var st = this.stationAt(Math.floor((fx - C.OX) / T), Math.floor((fy - C.OY) / T));
    if (st && !DECOR[st.type]) return st;
    var best = null, bestD = 1e9;
    for (var i = 0; i < this.stations.length; i++) {
      var s = this.stations[i];
      if (DECOR[s.type]) continue;
      var sx = s.x + T / 2, sy = s.y + T / 2, dx = sx - p.x, dy = sy - p.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d > T * 1.25 || d < 1) continue;
      var dot = (dx * p.dir.x + dy * p.dir.y) / d;
      if (dot < 0.35) continue;
      var score = d * (1.6 - dot);
      if (score < bestD) { bestD = score; best = s; }
    }
    return best;
  };

  Game.prototype.pickDrop = function (p) {
    var st = p.target;
    if (!st) return;
    // el extintor siempre se puede coger, aunque su mesa esté ardiendo (si no, el fuego sería imparable)
    if (st.fire > 0 && !p.held && st.item && st.item.kind === 'extinguisher') { this.take(p, st); return; }
    if (st.fire > 0) { OW.sfx('wrong'); OW.fx('text', st.x + T / 2, st.y - 10, { text: tr('game.fire'), color: '#ff8a50', size: 18 }); return; }
    if (st.notif) { OW.sfx('wrong'); OW.fx('text', st.x + T / 2, st.y - 10, { text: tr('game.blocked_notif'), color: '#ff7b9c', size: 18 }); return; }
    if (!p.held) this.take(p, st); else this.put(p, st);
  };

  Game.prototype.take = function (p, st) {
    var got = null;
    if (SOURCE[st.type]) { got = item('brief', SOURCE[st.type]); this.emit('brief'); }
    else switch (st.type) {
      case 'folder_stack':
        if (st.count > 0) { st.count--; got = item('dossier'); } break;
      case 'minutes':
        if (st.clean > 0) { st.clean--; got = item('dossier'); }
        else if (st.dirty > 0) OW.fx('text', st.x + T / 2, st.y - 10, { text: tr('game.minutes_pending'), color: '#ffb02e', size: 16 });
        break;
      case 'printer':
        if (st.item) {
          got = st.item; st.item = null; st.cookT = 0; st.overT = 0;
          if (got.kind === 'printout') this.emit('printout');
        }
        break;
      case 'meeting_room': case 'shredder': case 'coffee': case 'phone': case 'team_desk': break;
      default:
        if (st.item) { got = st.item; st.item = null; }
    }
    if (got) { p.held = got; OW.sfx('pickup'); }
  };

  function canAdd(dossier, approved) {
    return dossier && dossier.kind === 'dossier' && approved && approved.kind === 'approved' && dossier.contents.indexOf(approved.lane) < 0;
  }

  Game.prototype.put = function (p, st) {
    var h = p.held, ok = false, cx = st.x + T / 2;
    if (SOURCE[st.type]) {
      if (h.kind === 'brief' && h.lane === SOURCE[st.type]) { p.held = null; ok = true; }
    } else switch (st.type) {
      case 'shredder':
        if (h.kind === 'extinguisher') { OW.sfx('wrong'); OW.fx('text', cx, st.y - 10, { text: tr('game.no_shred_ext'), color: '#ffd23f', size: 18 }); return; }
        if (h.kind === 'dossier') { if (h.contents.length) { h.contents = []; OW.sfx('trash'); OW.fx('smoke', cx, st.y + 20, { count: 5 }); } return; }
        p.held = null; OW.sfx('trash'); OW.fx('smoke', cx, st.y + 20, { count: 5 }); return;
      case 'folder_stack':
        if (h.kind === 'dossier' && h.contents.length === 0) { st.count++; p.held = null; ok = true; }
        else if (h.kind === 'approved' && st.count > 0) { st.count--; var ds = item('dossier'); ds.contents.push(h.lane); p.held = ds; ok = true; }
        break;
      case 'minutes':
        if (h.kind === 'dossier' && h.contents.length === 0) { st.clean++; p.held = null; ok = true; }
        break;
      case 'meeting_room':
        if (h.kind === 'dossier' && h.contents.length > 0) { p.held = null; this.deliverDossier(h, st); return; }
        if (h.kind === 'approved') OW.fx('text', cx, st.y - 10, { text: tr('game.need_dossier'), color: '#fff', size: 18 });
        else if (h.kind === 'dossier') OW.fx('text', cx, st.y - 10, { text: tr('game.empty_dossier'), color: '#fff', size: 18 });
        else OW.fx('text', cx, st.y - 10, { text: tr('game.not_for_meeting'), color: '#fff', size: 18 });
        OW.sfx('wrong'); return;
      case 'printer':
        if (!st.item && h.kind === 'draft') {
          st.item = h; p.held = null; st.cookT = 0; st.overT = 0; sfx('print', 'compile_start'); ok = true;
        } else if (st.item && canAdd(h, st.item)) {
          h.contents.push(st.item.lane); st.item = null; ok = true;
        }
        break;
      case 'phone':
        OW.fx('text', cx, st.y - 10, { text: tr('game.phone_hands'), color: '#fff', size: 16 }); OW.sfx('wrong'); return;
      case 'team_desk':
        OW.fx('text', cx, st.y - 10, { text: tr('game.npc_hands'), color: '#fff', size: 16 }); OW.sfx('wrong'); return;
      case 'coffee': break;
      default:
        if (!SURFACE[st.type]) break;
        if (!st.item) {
          st.item = h; p.held = null; ok = true;
          if (st.type === 'conveyor') { st.convT = 0.5; OW.sfx('conveyor'); }
        } else if (canAdd(st.item, h)) {
          st.item.contents.push(h.lane); p.held = null; ok = true;
        } else if (canAdd(h, st.item)) {
          h.contents.push(st.item.lane); st.item = null; ok = true;
        }
    }
    if (ok) { OW.sfx('drop'); OW.fx('dust', cx, st.y + T - 6, { count: 3 }); }
  };

  /* Silenciar una notificación (antes aplastar un bug). */
  Game.prototype.trySquash = function (p) {
    var best = null, bd = 80;
    for (var i = 0; i < this.notifs.length; i++) {
      var b = this.notifs[i];
      if (b.state === 'dead') continue;
      var d = U.dist(p.x, p.y - 12, b.x, b.y);
      if (p.target && b.target === p.target && b.state === 'sit') d = Math.min(d, 30);
      if (d < bd) { bd = d; best = b; }
    }
    if (!best) return false;
    if (best.target) best.target.notif = null;
    best.target = null; best.state = 'dead'; best.deadT = 1.2;
    this.stats.notifs++; this.stats.bugs++;
    p.action = 'squashing'; p.actionHold = 0.25;
    OW.sfx('squash');
    OW.fx('sparks', best.x, best.y, { count: 10, color: '#ff7b9c' });
    OW.fx('text', best.x, best.y - 30, { text: tr('game.notif_squashed'), color: '#ff9fb8', size: 20 });
    return true;
  };

  Game.prototype.doAction = function (p, ctl, dt) {
    p.lockMove = false;
    if (p.stun > 0) { p.action = 'stunned'; return; }
    if (p.actionHold > 0) { p.actionHold -= dt; return; }
    p.action = 'none';
    if (ctl.actPressed && !p.held && this.trySquash(p)) return;
    if (!ctl.act) { p.drinkT = 0; return; }
    var st = p.target;
    if (p.held && p.held.kind === 'extinguisher') { this.spray(p, dt); return; }
    if (!st || st.notif || st.fire > 0) return;
    var it = st.item, cx = st.x + T / 2;
    switch (st.type) {
      case 'desk':
        if (!p.held && it && it.kind === 'brief') {
          p.action = 'typing'; it.prog += dt / PL.deskTime; st.workT = 0.15;
          st.sfxT -= dt; if (st.sfxT <= 0) { st.sfxT = 0.13; OW.sfx('type'); }
          st.fxT -= dt; if (st.fxT <= 0) { st.fxT = 0.18; OW.fx('glyphs', cx, st.y + 10, { count: 2 }); }
          if (it.prog >= 1) {
            st.item = item('draft', it.lane);
            OW.fx('glyphs', cx, st.y + 10, { count: 8 });
            OW.fx('text', cx, st.y - 14, { text: tr('game.drafted'), color: '#7cff9b', size: 16 });
            this.emit('draft');
          }
        }
        break;
      case 'approval':
        if (!p.held && it && it.kind === 'printout') {
          p.action = 'reviewing'; it.prog += dt / PL.signTime; st.workT = 0.15;
          st.sfxT -= dt; if (st.sfxT <= 0) { st.sfxT = 0.3; OW.sfx('type', { pitch: 1.5 }); }
          if (it.prog >= 1) {
            st.item = item('approved', it.lane);
            sfx('stamp', 'test_ok');
            OW.fx('sparks', cx, st.y + 18, { count: 8, color: '#7cff9b' });
            OW.fx('text', cx, st.y - 14, { text: tr('game.approved'), color: '#7cff9b', size: 16 });
            this.emit('approved');
            if (Math.random() < this.level.notifChance && this.aliveNotifs() < TU.notifs.maxAlive) this.spawnNotif(st);
          }
        }
        break;
      case 'minutes':
        if (!p.held && st.dirty > 0) {
          p.action = 'reviewing'; st.washT += dt / PL.minutesTime; st.workT = 0.15;
          st.sfxT -= dt; if (st.sfxT <= 0) { st.sfxT = 0.2; OW.sfx('type', { pitch: 0.8 }); }
          if (st.washT >= 1) {
            st.washT = 0; st.dirty--; st.clean++;
            OW.sfx('review_done');
            OW.fx('confetti', cx, st.y + 10, { count: 12 });
            OW.fx('text', cx, st.y - 14, { text: tr('game.minutes_filed'), color: '#7cff9b', size: 16 });
          }
        }
        break;
      case 'coffee':
        p.action = 'drinking'; p.drinkT += dt / TU.coffee.drinkTime; st.workT = 0.15; st.drinkT = p.drinkT;
        st.fxT -= dt; if (st.fxT <= 0) { st.fxT = 0.25; OW.fx('steam', cx, st.y + 6, { count: 2 }); }
        if (p.drinkT >= 1) {
          p.drinkT = 0; st.drinkT = 0; p.energy = 1; this.stats.coffees++;
          OW.sfx('coffee');
          OW.fx('text', p.x, p.y - 70, { text: tr('game.caffeine'), color: '#ffcc80', size: 20 });
        }
        break;
      case 'phone': {
        if (p.held) { if (ctl.actPressed) OW.fx('text', cx, st.y - 10, { text: tr('game.phone_hands'), color: '#fff', size: 16 }); break; }
        var calls = this.liveOf('call');
        if (!calls.length) { if (ctl.actPressed) OW.fx('text', cx, st.y - 10, { text: tr('game.phone_silent'), color: '#cfd8dc', size: 16 }); break; }
        if (st.hold <= 0) sfx('phone_pickup', 'pickup');
        p.action = 'calling'; p.lockMove = true; st.workT = 0.15;
        st.hold += dt / PL.phoneHold;
        st.fxT -= dt; if (st.fxT <= 0) { st.fxT = 0.5; OW.fx('glyphs', cx, st.y + 4, { count: 1 }); }
        if (st.hold >= 1) {
          st.hold = 0;
          calls.sort(function (a, b) { return a.timeLeft - b.timeLeft; });
          this.completeOrder(calls[0], cx, st.y + T / 2);
          OW.sfx('deliver');
          OW.fx('text', cx, st.y - 100, { text: tr('game.call_done'), color: '#ffffff', size: 18, life: 1.5 });
          OW.fx('sparks', cx, st.y + 16, { count: 8, color: '#9fe8ff' });
          this.emit('call');
        }
        break;
      }
      case 'team_desk': {
        if (p.held) { if (ctl.actPressed) OW.fx('text', cx, st.y - 10, { text: tr('game.npc_hands'), color: '#fff', size: 16 }); break; }
        var o2 = this.one2oneFor(st);
        if (!o2) {
          if (ctl.actPressed) OW.fx('text', cx, st.y - 10, { text: tr('npc.busy.' + U.randInt(0, 3), { name: OW.npcName(st.npcIdx) }), color: '#cfd8dc', size: 16 });
          break;
        }
        p.action = 'talking'; p.lockMove = true; st.workT = 0.15;
        st.hold += dt / PL.one2oneHold;
        st.fxT -= dt; if (st.fxT <= 0) { st.fxT = 0.6; OW.fx('glyphs', cx, st.y + 4, { count: 1 }); }
        if (st.hold >= 1) {
          st.hold = 0;
          this.completeOrder(o2, cx, st.y + T / 2);
          sfx('one2one_done', 'deliver');
          OW.fx('confetti', cx, st.y + 10, { count: 14 });
          OW.fx('text', cx, st.y - 100, { text: tr('game.one2one_done', { name: OW.npcName(st.npcIdx) }), color: '#ffffff', size: 18, life: 1.5 });
          this.emit('one2one');
        }
        break;
      }
    }
  };

  Game.prototype.spray = function (p, dt) {
    p.action = 'spraying';
    var hx = p.x + p.dir.x * 30, hy = p.y - 20 + p.dir.y * 30;
    p.sprayFx = (p.sprayFx || 0) - dt;
    if (p.sprayFx <= 0) { p.sprayFx = 0.05; OW.fx('foam', hx + p.dir.x * 20, hy + p.dir.y * 20, { count: 2, dx: p.dir.x, dy: p.dir.y }); }
    p.sprayS = (p.sprayS || 0) - dt;
    if (p.sprayS <= 0) { p.sprayS = 0.35; OW.sfx('extinguish'); }
    for (var i = 0; i < this.stations.length; i++) {
      var s = this.stations[i];
      if (!(s.fire > 0)) continue;
      var dx = s.x + T / 2 - p.x, dy = s.y + T / 2 - p.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      if (d > T * 1.9) continue;
      if ((dx * p.dir.x + dy * p.dir.y) / d < 0.45 && d > T * 0.9) continue;
      s.fire -= dt / TU.fire.extinguishTime;
      if (s.fire <= 0) {
        s.fire = 0; s.spreadT = 0;
        OW.fx('steam', s.x + T / 2, s.y + 10, { count: 10 });
        OW.fx('text', s.x + T / 2, s.y - 10, { text: tr('game.extinguished'), color: '#9fe8ff', size: 16 });
      }
    }
  };

  Game.prototype.ignite = function (st) {
    // el papel arde: las estanterías también (paredes, plantas y pizarras no)
    if (st.fire > 0 || DECOR[st.type] && st.type !== 'bookshelf') return;
    st.fire = TU.fire.startLevel; st.spreadT = U.rand(TU.fire.spreadEvery[0], TU.fire.spreadEvery[1]);
    if (st.notif) { st.notif.target = null; st.notif.state = 'fly'; st.notif = null; }
    this.stats.fires++;
    OW.sfx('fire');
    this.shake = Math.max(this.shake, 10);
    OW.fx('sparks', st.x + T / 2, st.y + 20, { count: 16 });
  };

  /* ---------------- Notificaciones / CEO helpers ---------------- */
  Game.prototype.aliveNotifs = function () { return this.notifs.filter(function (b) { return b.state !== 'dead'; }).length; };
  Game.prototype.aliveBugs = Game.prototype.aliveNotifs;
  Game.prototype.spawnNotif = function (st) {
    var b = new OW.Notif(st.x + T / 2, st.y + T / 2 - 10);
    this.notifs.push(b);
    OW.sfx('bug_spawn');
    OW.fx('text', b.x, b.y - 30, { text: tr('game.notif_new.' + U.randInt(0, 3)), color: '#ff9fb8', size: 20 });
  };
  Game.prototype.spawnBug = Game.prototype.spawnNotif;
  Game.prototype.randomNotifTarget = function (notif) {
    var cands = this.stations.filter(function (s) { return !DECOR[s.type] && !s.notif && !(s.fire > 0) && s.type !== 'conveyor'; });
    if (!cands.length) return null;
    // preferir estaciones cercanas
    cands.sort(function (a, b) { return U.dist(notif.x, notif.y, a.x, a.y) - U.dist(notif.x, notif.y, b.x, b.y); });
    return cands[Math.floor(Math.random() * Math.min(cands.length, 8))];
  };
  Game.prototype.randomBugTarget = Game.prototype.randomNotifTarget;
  Game.prototype.nearestPlayer = function (x, y) {
    var best = null, bd = 1e9;
    for (var i = 0; i < this.players.length; i++) {
      var p = this.players[i];
      if (p.stun > 0 || p.immune > 0) continue;
      var d = U.dist(x, y, p.x, p.y);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  };
  Game.prototype.findPath = function (x0, y0, x1, y1) {
    var sc = U.clamp(Math.floor((x0 - C.OX) / T), 0, C.COLS - 1), sr = U.clamp(Math.floor((y0 - C.OY) / T), 0, C.ROWS - 1);
    var tc = U.clamp(Math.floor((x1 - C.OX) / T), 0, C.COLS - 1), tr2 = U.clamp(Math.floor((y1 - C.OY) / T), 0, C.ROWS - 1);
    var key = function (c, r) { return r * C.COLS + c; };
    var prev = {}, q = [[sc, sr]], seen = {}; seen[key(sc, sr)] = 1;
    var found = false;
    while (q.length) {
      var n = q.shift();
      if (n[0] === tc && n[1] === tr2) { found = true; break; }
      var nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var i = 0; i < 4; i++) {
        var c = n[0] + nb[i][0], r = n[1] + nb[i][1], k = key(c, r);
        if (seen[k] || this.isSolid(c, r)) continue;
        seen[k] = 1; prev[k] = n; q.push([c, r]);
      }
    }
    if (!found) return [];
    var path = [], cur = [tc, tr2];
    while (!(cur[0] === sc && cur[1] === sr)) { path.unshift({ c: cur[0], r: cur[1] }); cur = prev[key(cur[0], cur[1])]; if (!cur) break; }
    return path;
  };

  /* ---------------- Update ---------------- */
  Game.prototype.controlsFor = function (i) {
    var I = OW.Input;
    if (this.solo) return i === this.active ? I.controls([0, 1], [0, 1, 2, 3]) : { mx: 0, my: 0 };
    return i === 0 ? I.controls([0], [0]) : I.controls([1], [1]);
  };

  Game.prototype.update = function (dt) {
    if (this.over) return;
    this.t += dt;
    this.timeLeft -= dt;
    this.scoreBump = Math.max(0, this.scoreBump - dt * 3);
    this.shake = Math.max(0, this.shake - dt * 25);

    if (this.solo && OW.Input.switchPressed()) {
      this.active = 1 - this.active; this.updateSelection(); OW.sfx('ui_move');
      var ap = this.players[this.active];
      OW.fx('text', ap.x, ap.y - 75, { text: tr('game.me'), color: '#fff', size: 18 });
    }

    var i, p, ctl;
    for (i = 0; i < this.players.length; i++) {
      p = this.players[i];
      ctl = this.controlsFor(i);
      // al teléfono o en un one-to-one no te puedes mover mientras mantienes la acción
      if (p.lockMove && ctl.act) { ctl.mx = 0; ctl.my = 0; ctl.dash = false; }
      p.update(dt, ctl, this);
      p.target = this.findTarget(p);
      if (ctl.pick && p.stun <= 0) this.pickDrop(p);
      this.doAction(p, ctl, dt);
    }
    this.pushPlayers();
    for (i = 0; i < this.stations.length; i++) this.stations[i].highlight = false;
    for (i = 0; i < this.players.length; i++) {
      p = this.players[i];
      if (p.target && (!this.solo || i === this.active)) p.target.highlight = true;
    }

    this.updateStations(dt);

    for (i = this.notifs.length - 1; i >= 0; i--) {
      var b = this.notifs[i];
      b.update(dt, this);
      if (b.state === 'dead') { b.deadT -= dt; if (b.deadT <= 0) this.notifs.splice(i, 1); }
    }
    if (this.manager) this.manager.update(dt, this);

    this.updateOrders(dt);

    for (i = this.returns.length - 1; i >= 0; i--) {
      var r = this.returns[i];
      r.t -= dt;
      if (r.t <= 0) {
        this.returns.splice(i, 1);
        if (this.minutes) { this.minutes.dirty++; OW.fx('text', this.minutes.x + T / 2, this.minutes.y - 10, { text: tr('game.minutes_back'), color: '#ffb02e', size: 16 }); }
        else if (this.folderStack) this.folderStack.count++;
      }
    }
    for (i = this.rockets.length - 1; i >= 0; i--) { this.rockets[i].t += dt; if (this.rockets[i].t > BUSY_TIME) this.rockets.splice(i, 1); }

    this.updateLighting(dt);
    if (this.banner) { this.banner.t += dt; if (this.banner.t > this.banner.dur) this.banner = null; }
    if (this.timeLeft < 30 && !this.warned30) {
      this.warned30 = true;
      this.banner = i18nObj({ text: { key: 'game.banner.30s' }, sub: { key: 'game.banner.30s_sub' }, t: 0, dur: 2 });
    }

    if (this.tutorial) {
      this.tutorial.t += dt;
      var stp = TUTORIAL[this.tutorial.step];
      if (stp && stp.dur && this.tutorial.t > stp.dur) { this.tutorial.step++; this.tutorial.t = 0; }
      if (this.t > 120 && this.tutorial.step < TUTORIAL.length) this.tutorial.step = TUTORIAL.length;
    }

    var inten = this.timeLeft < 30 ? U.clamp(1 - this.timeLeft / 30, 0, 1) : 0;
    if (Math.abs(inten - this.intensity) >= 0.1 || (inten === 0 && this.intensity !== 0)) {
      this.intensity = Math.round(inten * 10) / 10;
      try { OW.Audio.setIntensity(this.intensity); } catch (e) { /* nada */ }
    }

    // tic-tac de los últimos 5 segundos
    var sec = Math.ceil(this.timeLeft);
    if (sec <= 5 && sec >= 1 && sec !== this.lastTick) { this.lastTick = sec; OW.sfx('countdown'); this.scoreBump = Math.max(this.scoreBump, 0.4); }
    if (this.timeLeft <= 0) { this.timeLeft = 0; this.over = true; }
  };

  Game.prototype.pushPlayers = function () {
    var ps = this.players;
    for (var i = 0; i < ps.length; i++) for (var j = i + 1; j < ps.length; j++) {
      var a = ps[i], b = ps[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy), min = a.r + b.r;
      if (d >= min) continue;
      if (d < 0.01) { dx = 1; dy = 0; d = 1; }
      var nx = dx / d, ny = dy / d, ov = min - d;
      var wa = a.dashing() && !b.dashing() ? 0.15 : b.dashing() && !a.dashing() ? 0.85 : 0.5;
      a.x -= nx * ov * (1 - wa); a.y -= ny * ov * (1 - wa);
      b.x += nx * ov * wa; b.y += ny * ov * wa;
      if (a.dashing() && !b.dashing()) { b.vx += nx * 300; b.vy += ny * 300; }
      if (b.dashing() && !a.dashing()) { a.vx -= nx * 300; a.vy -= ny * 300; }
      OW.resolveCircle(this, a, a.r); OW.resolveCircle(this, b, b.r);
    }
  };

  Game.prototype.updateStations = function (dt) {
    var heat = this.level.heat || 1, warnAt = PL.warnAfter / heat, burnAt = warnAt + PL.burnAfter / heat;
    var anyWarn = false, calls = this.liveOf('call').length, answering = false;
    for (var i = 0; i < this.stations.length; i++) {
      var st = this.stations[i];
      st.workT = Math.max(0, st.workT - dt);
      if (st.type === 'coffee' && st.workT <= 0) st.drinkT = 0;
      if (st.type === 'phone') { if (!calls) st.hold = 0; else if (st.workT > 0) answering = true; }
      if (st.type === 'team_desk' && st.hold > 0 && !this.one2oneFor(st)) st.hold = 0;
      if (st.type === 'printer' && st.item) {
        var it = st.item;
        if (it.kind === 'draft') {
          st.cookT += dt;
          st.fxT -= dt; if (st.fxT <= 0) { st.fxT = 0.5; OW.fx('steam', st.x + T / 2, st.y + 4, { count: 1 }); }
          if (st.cookT >= PL.printTime) {
            st.item = item('printout', it.lane); st.overT = 0;
            OW.sfx('compile_done'); OW.fx('sparks', st.x + T / 2, st.y + 16, { count: 8 });
          }
        } else if (it.kind === 'printout' && !(st.fire > 0)) {
          st.overT += dt;
          if (st.overT > warnAt) {
            anyWarn = true;
            st.fxT -= dt; if (st.fxT <= 0) { st.fxT = 0.3; OW.fx('smoke', st.x + T / 2, st.y + 6, { count: 2 }); }
          }
          if (st.overT > burnAt) {
            st.item = item('burnt', it.lane); this.stats.burnt++;
            OW.fx('text', st.x + T / 2, st.y - 14, { text: tr('game.jammed'), color: '#ff5d5d', size: 22 });
            this.ignite(st);
          }
        }
      }
      if (st.fire > 0) {
        st.fire = Math.min(1, st.fire + dt * TU.fire.growRate);
        st.spreadT -= dt;
        st.fxT -= dt; if (st.fxT <= 0) { st.fxT = 0.35; OW.fx('smoke', st.x + T / 2, st.y - 4, { count: 1 }); }
        if (st.spreadT <= 0) {
          st.spreadT = U.rand(TU.fire.spreadEvery[0], TU.fire.spreadEvery[1]);
          var nb = [[1, 0], [-1, 0], [0, 1], [0, -1]], cands = [];
          for (var k = 0; k < 4; k++) {
            var n = this.stationAt(st.col + nb[k][0], st.row + nb[k][1]);
            if (n && !(n.fire > 0) && n.type !== 'wall' && n.type !== 'plant' && n.type !== 'whiteboard') cands.push(n);
          }
          if (cands.length) this.ignite(U.pick(cands));
        }
      }
      if (st.type === 'conveyor' && st.item && !(st.fire > 0) && this.level.conveyors !== false) {
        st.convT += dt / PL.conveyorTime;
        if (st.convT >= 1) {
          st.convT = 1;
          var nx = this.stationAt(st.col + st.dir.x, st.row + st.dir.y);
          if (nx && this.conveyorAccept(nx, st.item)) st.item = null;
        }
      }
    }
    if (anyWarn) {
      this.warnBeepT -= dt;
      if (this.warnBeepT <= 0) { this.warnBeepT = 0.5; OW.sfx('warning'); }
    } else this.warnBeepT = 0;
    // el teléfono suena mientras haya llamadas sin atender (no mientras alguien está al aparato)
    if (calls && !answering && this.phones.length) {
      this.ringT -= dt;
      if (this.ringT <= 0) { this.ringT = 1.2; sfx('phone_ring', 'order_new', { volume: 0.7 }); }
    } else this.ringT = 0;
  };

  Game.prototype.conveyorAccept = function (nx, it) {
    if (nx.fire > 0 || nx.notif) return false;
    if (nx.type === 'conveyor') { if (nx.item) return false; nx.item = it; nx.convT = 0; return true; }
    if (SURFACE[nx.type]) { if (nx.item) { if (canAdd(nx.item, it)) { nx.item.contents.push(it.lane); return true; } return false; } nx.item = it; return true; }
    if (nx.type === 'printer' && !nx.item && it.kind === 'draft') { nx.item = it; nx.cookT = 0; sfx('print', 'compile_start'); return true; }
    if (nx.type === 'meeting_room' && it.kind === 'dossier' && it.contents.length) { this.deliverDossier(it, nx); return true; }
    if (nx.type === 'shredder' && it.kind !== 'dossier' && it.kind !== 'extinguisher') { OW.sfx('trash'); return true; }
    if (nx.type === 'folder_stack' && it.kind === 'dossier' && !it.contents.length) { nx.count++; return true; }
    return false;
  };

  Game.prototype.updateLighting = function (dt) {
    var base = this.level.darkness || 0;
    if (this.level.blackouts) {
      var bo = this.blackout;
      if (!bo.on && this.t >= bo.next) {
        bo.on = true; bo.t = 0; OW.sfx('blackout');
        this.banner = i18nObj({ text: { key: 'game.banner.blackout' }, sub: { key: 'game.banner.blackout_sub' }, t: 0, dur: 2.2 });
      }
      if (bo.on) {
        bo.t += dt;
        var dark, BO = TU.blackout, full = BO.darkness, fadeAt = BO.duration - 1;
        if (bo.t < 0.8) dark = (Math.sin(bo.t * 40) > 0 ? 0.88 : 0.2) * (bo.t / 0.8) + 0.1;
        else if (bo.t < fadeAt) dark = full;
        else dark = U.lerp(full, base, U.clamp((bo.t - fadeAt) / 1, 0, 1));
        this.darkness = dark;
        if (bo.t > BO.duration) { bo.on = false; bo.next = this.t + U.rand(BO.every[0], BO.every[1]); this.darkness = base; }
        return;
      }
    }
    this.darkness = U.approach(this.darkness, base, dt);
  };

  Game.prototype.lights = function (ox, oy) {
    var L = [], s, i, calls = this.liveOf('call').length;
    for (i = 0; i < this.stations.length; i++) {
      s = this.stations[i];
      var cx = s.x + T / 2 + ox, cy = s.y + T / 2 + oy;
      if (s.fire > 0) L.push({ x: cx, y: cy - 10, r: 120 + 30 * s.fire, color: '#ff9a3c' });
      if (SOURCE[s.type]) { L.push({ x: cx, y: cy - 8, r: 40, color: OW.C.LANE_COLORS[SOURCE[s.type]] }); continue; }
      switch (s.type) {
        case 'desk': case 'team_desk': L.push({ x: cx, y: cy - 16, r: 70, color: '#7fd8ff' }); break;
        case 'printer': L.push({ x: cx, y: cy - 4, r: 48, color: s.item && s.item.kind === 'printout' && s.overT > (PL.warnAfter / (this.level.heat || 1)) ? '#ff4040' : '#5cff8a' }); break;
        case 'approval': L.push({ x: cx, y: cy - 8, r: 52, color: '#fff1b8' }); break;
        case 'meeting_room': L.push({ x: cx, y: cy - 8, r: 72, color: '#ffd59a' }); break;
        case 'coffee': L.push({ x: cx, y: cy - 8, r: 40, color: '#ffcc80' }); break;
        case 'phone': L.push({ x: cx, y: cy - 8, r: calls ? 60 : 32, color: calls ? '#ff6b6b' : '#9fe8ff' }); break;
        case 'minutes': L.push({ x: cx, y: cy - 8, r: 40, color: '#c7a6ff' }); break;
      }
    }
    for (i = 0; i < this.players.length; i++) {
      var p = this.players[i];
      L.push({ x: p.x + ox + p.dir.x * 26, y: p.y - 24 + oy + p.dir.y * 26, r: 125, color: '#fff3c4' });
    }
    for (i = 0; i < this.rockets.length; i++) L.push({ x: this.rockets[i].x + ox, y: this.rockets[i].y - this.rockets[i].t * 250 + oy, r: 90, color: '#ffb74d' });
    return L;
  };

  /* ---------------- Dibujado del mundo ---------------- */
  /* Vista de una estación para OW.Art.drawStation (contrato §4). */
  Game.prototype.stationView = function (st) {
    var state = 'idle', progress = null, it = st.item;
    var warnAt = PL.warnAfter / (this.level.heat || 1);
    var v = { type: st.type, dir: st.dir, theme: this.theme, highlight: !!st.highlight, label: null };
    if (st.type === 'printer' && it) {
      if (it.kind === 'draft') { state = 'working'; progress = U.clamp(st.cookT / PL.printTime, 0, 1); }
      else if (it.kind === 'printout') state = st.overT > warnAt ? 'warning' : 'done';
      else if (it.kind === 'burnt') state = 'burnt';
    } else if ((st.type === 'desk' && it && it.kind === 'brief') || (st.type === 'approval' && it && it.kind === 'printout')) {
      if (it.prog > 0) progress = U.clamp(it.prog, 0, 1);
      if (st.workT > 0) state = 'working';
    } else if (st.type === 'minutes' && st.dirty > 0) {
      if (st.washT > 0) progress = st.washT;
      if (st.workT > 0) state = 'working';
    } else if (st.type === 'coffee' && st.drinkT > 0) { progress = st.drinkT; state = 'working'; }
    else if (st.type === 'meeting_room') {
      v.busy = U.clamp(st.workT / BUSY_TIME, 0, 1);
      if (st.workT > 0) state = 'working';
    } else if (st.type === 'phone') {
      v.ringing = this.liveOf('call').length > 0;
      if (st.hold > 0) progress = U.clamp(st.hold, 0, 1);
      if (st.workT > 0) state = 'working';
    } else if (st.type === 'team_desk') {
      var nd = OW.NPCS[st.npcIdx] || OW.NPCS[0];
      v.npc = { name: OW.npcName(st.npcIdx), color: nd.color, hair: nd.hair, idx: st.npcIdx };
      v.wants = !!this.one2oneFor(st);
      if (st.hold > 0) progress = U.clamp(st.hold, 0, 1);
      if (st.workT > 0) state = 'working';
    }
    if (st.type === 'folder_stack') v.count = st.count;
    if (st.type === 'minutes') { v.dirty = st.dirty; v.clean = st.clean; }
    v.hasExt = !!(it && it.kind === 'extinguisher');
    if (st.notif) state = 'blocked';
    if (st.fire > 0) state = 'fire';
    v.blocked = !!st.notif;
    v.fire = st.fire || 0;
    v.state = state; v.progress = progress;
    var up = this.stationAt(st.col, st.row - 1), left = this.stationAt(st.col - 1, st.row);
    v.joinTop = !!(up && up.type === st.type && st.type === 'meeting_room');
    v.joinLeft = !!(left && left.type === st.type && st.type === 'meeting_room');
    return v;
  };

  function badge(ctx, x, y, n, col) {
    ctx.fillStyle = col || '#2b1b4a';
    ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    U.text(ctx, String(n), x, y + 5, { size: 13, color: '#fff' });
  }

  Game.prototype.drawStationItems = function (ctx, st, t) {
    var A = OW.Art, an = A.itemAnchor ? A.itemAnchor(st.type, T) : { x: T / 2, y: T / 2 - 8 };
    var cx = st.x + an.x, cy = st.y + an.y;
    var i;
    if (st.type === 'folder_stack') {
      for (i = 0; i < Math.min(st.count, 4); i++) A.drawItem(ctx, { kind: 'dossier', contents: [], noShadow: i > 0 }, cx, cy - i * 4, 0.9, t);
      if (st.count > 0) badge(ctx, st.x + T - 10, st.y + 10, st.count);
      return;
    }
    if (st.type === 'minutes') {
      for (i = 0; i < Math.min(st.dirty, 3); i++) A.drawItem(ctx, { kind: 'dossier_minutes', contents: [], noShadow: i > 0 }, st.x + 18, cy - i * 4, 0.72, t);
      for (i = 0; i < Math.min(st.clean, 3); i++) A.drawItem(ctx, { kind: 'dossier', contents: [], noShadow: i > 0 }, st.x + 34, cy + 4 - i * 4, 0.72, t);
      if (st.dirty > 0) badge(ctx, st.x + 9, st.y + 50, st.dirty, '#b55d2e');
      if (st.clean > 0) badge(ctx, st.x + T - 9, st.y + 50, st.clean, '#2e8b57');
      return;
    }
    if (!st.item) return;
    var ox = 0, oy = 0;
    if (st.type === 'conveyor' && st.dir) { ox = (st.convT - 0.5) * T * st.dir.x; oy = (st.convT - 0.5) * T * st.dir.y; }
    var bob = st.type === 'printer' && st.item.kind === 'draft' ? Math.sin(t * 10) * 1.5 : 0;
    A.drawItem(ctx, st.item, cx + ox, cy + oy + bob, 1, t);
  };

  Game.prototype.drawWorld = function (ctx, t) {
    var A = OW.Art, i, r, c;
    var ox = 0, oy = 0;
    if (this.shake > 0) { ox = (Math.random() * 2 - 1) * this.shake; oy = (Math.random() * 2 - 1) * this.shake; }
    this.shakeOff = { x: ox, y: oy };
    ctx.save();
    A.drawBackground(ctx, this.theme, t);
    ctx.translate(ox, oy);
    A.drawFloor(ctx, this.theme, C.COLS, C.ROWS, C.OX, C.OY, T, t);

    // entidades agrupadas por fila
    var rows = [];
    for (r = 0; r < C.ROWS; r++) rows.push([]);
    var place = function (y, fn) { var rr = U.clamp(Math.floor((y - C.OY) / T), 0, C.ROWS - 1); rows[rr].push({ y: y, fn: fn }); };
    var self = this;
    this.players.forEach(function (p) {
      place(p.y, function () {
        var v = p.view(t);
        v.name = self.solo ? p.name : 'P' + (p.idx + 1) + ' · ' + p.name;
        // el personaje pinta su propio extintor + chorro al rociar: no duplicar el item cargado
        var showHeld = p.held && !(v.action === 'spraying' && p.held.kind === 'extinguisher');
        var cp = A.getCarryPoint ? A.getCarryPoint(v) : { x: p.x + p.dir.x * 16, y: p.y - 30 };
        var behind = p.dir.y < 0 && !(Math.abs(p.dir.x) > Math.abs(p.dir.y) * 1.1);
        if (showHeld && behind) A.drawItem(ctx, p.held, cp.x, cp.y, 0.85, t);
        A.drawCharacter(ctx, v, t);
        if (showHeld && !behind) A.drawItem(ctx, p.held, cp.x, cp.y, 0.85, t);
        if (p.energy < 0.4) {
          // mini barra de café bajo los pies cuando la energía escasea
          var e = p.energy, bw = 34, bx = p.x - bw / 2, by = p.y + 9;
          var blink = e < 0.1 && Math.sin(t * 10) > 0;
          ctx.fillStyle = 'rgba(20,12,40,0.75)'; U.roundRect(ctx, bx - 2, by - 2, bw + 4, 8, 4); ctx.fill();
          ctx.fillStyle = blink ? '#ffffff' : e < 0.1 ? '#ff4d4d' : '#ffb02e'; U.roundRect(ctx, bx, by, Math.max(4, bw * e), 4, 2); ctx.fill();
          if (A.drawIcon) A.drawIcon(ctx, 'coffee', bx + bw + 9, by + 2, 13);
        }
      });
    });
    this.notifs.forEach(function (b) { place(b.y + 4, function () { A.drawBug(ctx, b.view(), t); }); });
    if (this.manager && this.manager.alpha > 0.01) {
      var m = this.manager;
      place(m.y, function () { ctx.save(); ctx.globalAlpha = m.alpha; A.drawManager(ctx, m.view(), t); ctx.restore(); });
    }

    for (r = 0; r < C.ROWS; r++) {
      for (c = 0; c < C.COLS; c++) {
        var st = this.grid[r][c];
        if (!st) continue;
        A.drawStation(ctx, this.stationView(st), st.x, st.y, T, t);
        this.drawStationItems(ctx, st, t);
      }
      for (c = 0; c < C.COLS; c++) {
        var s2 = this.grid[r][c];
        if (s2 && s2.fire > 0) A.drawFire(ctx, s2.x, s2.y, T, s2.fire, t);
      }
      rows[r].sort(function (a, b) { return a.y - b.y; });
      for (i = 0; i < rows[r].length; i++) rows[r][i].fn();
    }
    for (i = 0; i < this.rockets.length; i++) A.drawRocket(ctx, this.rockets[i].x, this.rockets[i].y, t, this.rockets[i].t / BUSY_TIME);
    OW.FX.draw(ctx);
    ctx.restore();

    if (this.darkness > 0.01) A.drawLighting(ctx, this.lights(ox, oy), this.darkness);
  };

  /* ---------------- Resultados ---------------- */
  Game.prototype.starsEarned = function () {
    var s = OW.starThresholds(this.level, this.numPlayers), n = 0;
    for (var i = 0; i < 3; i++) if (this.score >= s[i]) n = i + 1;
    return n;
  };

  Game.prototype.snapshot = function () {
    var self = this;
    return {
      level: this.li + 1, name: this.level.name, t: +this.t.toFixed(2), timeLeft: +this.timeLeft.toFixed(2), score: this.score,
      stars: this.starsEarned(), stats: JSON.parse(JSON.stringify(this.stats)), solo: this.solo, active: this.active,
      darkness: +this.darkness.toFixed(2),
      orders: this.liveOrders().map(function (o) {
        return { id: o.id, task: o.task, kind: o.kind, name: o.name, nameKey: o.nameKey, lanes: o.lanes, target: o.target, timeLeft: +o.timeLeft.toFixed(1) };
      }),
      players: this.players.map(function (p) {
        return { x: Math.round(p.x), y: Math.round(p.y), col: Math.floor((p.x - C.OX) / T), row: Math.floor((p.y - C.OY) / T),
          dir: { x: +p.dir.x.toFixed(2), y: +p.dir.y.toFixed(2) }, held: p.held ? { kind: p.held.kind, lane: p.held.lane, contents: p.held.contents.slice() } : null,
          energy: +p.energy.toFixed(2), stun: +Math.max(0, p.stun).toFixed(2), action: p.action,
          target: p.target ? { type: p.target.type, col: p.target.col, row: p.target.row } : null };
      }),
      stations: this.stations.filter(function (s) { return !DECOR[s.type]; }).map(function (s) {
        var v = self.stationView(s), o = { type: s.type, col: s.col, row: s.row, state: v.state };
        if (s.item) o.item = { kind: s.item.kind, lane: s.item.lane, contents: s.item.contents.slice(), prog: +(s.item.prog || 0).toFixed(2) };
        if (s.type === 'folder_stack') o.count = s.count;
        if (s.type === 'minutes') { o.dirty = s.dirty; o.clean = s.clean; }
        if (s.type === 'phone') { o.ringing = v.ringing; o.hold = +s.hold.toFixed(2); }
        if (s.type === 'team_desk') { o.npc = v.npc.name; o.npcIdx = s.npcIdx; o.wants = v.wants; o.hold = +s.hold.toFixed(2); }
        if (s.fire > 0) o.fire = +s.fire.toFixed(2);
        return o;
      }),
      notifs: this.notifs.map(function (b) { return { x: Math.round(b.x), y: Math.round(b.y), state: b.state }; }),
      bugs: this.notifs.map(function (b) { return { x: Math.round(b.x), y: Math.round(b.y), state: b.state }; }),
      manager: this.manager ? { x: Math.round(this.manager.x), y: Math.round(this.manager.y), state: this.manager.state } : null,
      tutorial: this.tutorialText(), tutorialKey: this.tutorialKey()
    };
  };

  OW.Game = Game;
  OW.Game.TUTORIAL = TUTORIAL;
})();
