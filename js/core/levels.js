/* OVERMANAGING — CORE: tareas de agenda y niveles (mapas 18×9 hechos a mano y datos estéticos).
 * Los parámetros de equilibrio de cada nivel están en js/core/tuning.js (OW.TUNING.levels).
 * Los textos (nombres de tarea, de nivel, descripciones, sprint/motto...) están en js/i18n/strings_core.js
 * y se exponen aquí como getters que llaman a OW.t al leerlos (nunca se guarda un texto traducido).
 *
 * Leyenda de mapa:
 *  .  suelo            #  pared              C  mesa/encimera     E  mesa con extintor
 *  F  src_budget       B  src_plan           D  src_report        K  escritorio (desk)
 *  S  impresora        T  mesa de firmas     P  pila de dossiers  Y  sala de reuniones
 *  R  actas            X  destructora        Q  cafetera          L  teléfono
 *  N  escritorio de equipo (one-to-one)      p  planta            r  estantería   w  pizarra
 *  > < ^ v  cinta de correo interno          1 2  aparición jugadores           M  aparición del CEO
 */
(function () {
  'use strict';
  var OW = window.OW, tr = OW.tr || function (k) { return k; };

  /* Tareas de agenda. kind: 'dossier' (llevar un dossier con esos carriles a la sala de reuniones),
   * 'call' (atender el teléfono) o 'one2one' (escritorio de un compañero concreto).
   * nameKey: clave i18n; el getter .name la traduce al leerla (compatibilidad con código que lea .name). */
  OW.TASKS = {
    budget_meeting: { kind: 'dossier', lanes: ['budget'] },
    daily: { kind: 'dossier', lanes: ['plan'] },
    status: { kind: 'dossier', lanes: ['report'] },
    business: { kind: 'dossier', lanes: ['budget', 'plan'] },
    presentation: { kind: 'dossier', lanes: ['plan', 'report'] },
    steering: { kind: 'dossier', lanes: ['budget', 'report'] },
    board: { kind: 'dossier', lanes: ['budget', 'plan', 'report'] },
    call: { kind: 'call', lanes: [], needs: 'phone' },
    one2one: { kind: 'one2one', lanes: [], needs: 'team_desk' }
  };
  Object.keys(OW.TASKS).forEach(function (id) {
    var tk = OW.TASKS[id];
    tk.id = id; tk.nameKey = 'task.' + id;
    Object.defineProperty(tk, 'name', { enumerable: false, get: function () { return tr('task.' + id, { name: '…' }); } });
  });
  OW.RECIPES = OW.TASKS; // alias de compatibilidad (hud/menus/devpanel antiguos)
  // Puntos y segundos por nº de carriles: los valores están en js/core/tuning.js (alias, mismo array).
  OW.TASK_VALUE = OW.RECIPE_VALUE = OW.TUNING.tasks.value;
  OW.TASK_TIME = OW.RECIPE_TIME = OW.TUNING.tasks.time;

  OW.LEGEND = {
    '#': 'wall', 'C': 'counter', 'E': 'counter', 'F': 'src_budget', 'B': 'src_plan', 'D': 'src_report', 'K': 'desk',
    'S': 'printer', 'T': 'approval', 'P': 'folder_stack', 'Y': 'meeting_room', 'R': 'minutes', 'X': 'shredder', 'Q': 'coffee',
    'L': 'phone', 'N': 'team_desk', 'p': 'plant', 'r': 'bookshelf', 'w': 'whiteboard',
    '>': 'conveyor', '<': 'conveyor', '^': 'conveyor', 'v': 'conveyor'
  };
  /* Carril que da cada fuente de documentos. */
  OW.SOURCE_LANE = { src_budget: 'budget', src_plan: 'plan', src_report: 'report' };

  /* Miembros del equipo (NPC de los escritorios N, por orden de aparición en el mapa).
   * El nombre se traduce con OW.t('npc.<i>') (son nombres propios, pero así quedan en i18n). */
  OW.NPCS = [
    { color: '#ff8a65', hair: 0 }, { color: '#4db6ac', hair: 1 }, { color: '#ba68c8', hair: 2 },
    { color: '#ffd54f', hair: 3 }, { color: '#7986cb', hair: 1 }, { color: '#a1887f', hair: 2 }
  ];
  OW.npcName = function (i) { return tr('npc.' + i); };

  OW.LEVELS = [
    {
      id: 1, theme: 'startup', ticket: 'PRJ-101',
      tutorial: true,
      hazards: [],
      map: [
        '##wFCBCCKCKCCSCS##',
        'C................C',
        'L..1..........2..Y',
        'X....CCTCCTCC....Y',
        'C....CPCCCCEC....C',
        'C................R',
        'Q................C',
        'r................p',
        '##CCpCCKCKCCrCpC##'
      ]
    },
    {
      id: 2, theme: 'coworking', ticket: 'PRJ-214',
      hazards: ['notif'],
      map: [
        '##FCBCDC##CKCKCK##',
        'C.......##.......S',
        'C..1..........2..S',
        'Y...CCTC..CTCC...C',
        'Y...CPCC..CCEC...S',
        'C.......pp.......C',
        'R...............QC',
        'C.......ww.......X',
        '##NCKCNC##LCwCrC##'
      ]
    },
    {
      id: 3, theme: 'consulting', ticket: 'PRJ-307',
      hazards: ['notif', 'manager'],
      map: [
        '##LFCBCDCCKCKCKC##',
        'S................C',
        'S..1..##w##...2..T',
        'C.....r...r......T',
        'Y..CC.r.M.....CC.C',
        'Y..CP.##w##...CE.C',
        'R................C',
        'C................Q',
        '##NCXCNCKCKCNSCC##'
      ]
    },
    {
      id: 4, theme: 'corporate', ticket: 'PRJ-412',
      hazards: ['notif', 'conveyor', 'heat'],
      map: [
        '#CFCBCDCKCrCTCTCC#',
        'S.........r......Y',
        'S..1......r...2..Y',
        'K...CC..>>>>>C...C',
        'S...CE.......P...C',
        'C.........r......R',
        'L................C',
        'X................Q',
        '#CNKCKCNSCrCNCCXC#'
      ]
    },
    {
      id: 5, theme: 'quarterclose', ticket: 'PRJ-599',
      hazards: ['notif', 'manager', 'conveyor', 'blackout'],
      map: [
        '##CFCBCDCCKCKCKC##',
        'S.......CC.......Y',
        'S..1....TT....2..Y',
        'L...CC.......C...C',
        'R...PE..>>>>CX...C',
        'C...CC......CC...Q',
        'S.......CC.......C',
        'C.......TC...M...C',
        '##NCKCKNCCwCNSCC##'
      ]
    }
  ];

  /* Textos de cada nivel (getters traducidos): name, desc, sprint, motto.
   * Alias de OVERWORKING para menús antiguos: branch → sprint, commit → motto, hash → ticket. */
  OW.LEVELS.forEach(function (lv) {
    var p = 'lvl.' + lv.id + '.';
    var get = function (k) { return function () { return tr(p + k); }; };
    var defs = { name: get('name'), desc: get('desc'), sprint: get('sprint'), motto: get('motto'),
      branch: get('sprint'), commit: get('motto') };
    Object.keys(defs).forEach(function (k) { Object.defineProperty(lv, k, { enumerable: false, configurable: true, get: defs[k] }); });
    Object.defineProperty(lv, 'hash', { enumerable: false, configurable: true, get: function () { return lv.ticket; } });
  });

  /* Parámetros de equilibrio de cada nivel (duración, tareas, citas, peligros, estrellas...):
   * viven en OW.TUNING.levels[id] (js/core/tuning.js). syncLevels() los copia sobre OW.LEVELS;
   * se llama al cargar, al empezar cada partida y cada vez que el panel de ajustes cambia algo. */
  OW.LEVEL_PARAMS = ['duration', 'tasks', 'weights', 'dossiers', 'notifChance', 'manager', 'conveyors', 'heat', 'darkness',
    'blackouts', 'maxOrders', 'orderGap', 'startOrders', 'stars', 'timeMul'];
  OW.syncLevels = function () {
    OW.LEVELS.forEach(function (lv) {
      var t = OW.TUNING.levels[lv.id];
      if (!t) return;
      OW.LEVEL_PARAMS.forEach(function (k) {
        if (t[k] !== undefined) lv[k] = Array.isArray(t[k]) ? t[k].slice() : t[k];
      });
      // alias de compatibilidad (menús antiguos): recipes → tasks, prs → dossiers
      lv.recipes = lv.tasks; lv.prs = lv.dossiers;
    });
  };
  OW.syncLevels();

  /* Umbrales de estrellas: los del nivel son para 2 jugadores; en solitario (un jugador
   * manejando dos PM con Tab) se exige un porcentaje (OW.TUNING.tasks.soloStars). */
  OW.starThresholds = function (lv, players) {
    var f = (players === 1 ? OW.TUNING.tasks.soloStars : 1) * OW.difficulty().stars;
    return lv.stars.map(function (v) { return Math.round(v * f / 10) * 10; });
  };

  /* Nombres de peligros (getters traducidos). */
  OW.HAZARD_NAMES = {};
  ['notif', 'manager', 'conveyor', 'heat', 'blackout'].forEach(function (h) {
    Object.defineProperty(OW.HAZARD_NAMES, h, { enumerable: true, get: function () { return tr('hazard.' + h); } });
  });
  Object.defineProperty(OW.HAZARD_NAMES, 'bug', { enumerable: false, get: function () { return tr('hazard.notif'); } });

  /* Estaciones que tiene el mapa de un nivel ({ tipo: nº }). */
  OW.levelStations = function (lv) {
    var out = {};
    lv.map.forEach(function (row) {
      for (var c = 0; c < row.length; c++) { var ty = OW.LEGEND[row.charAt(c)]; if (ty) out[ty] = (out[ty] || 0) + 1; }
    });
    return out;
  };

  /* Validación de mapas (sólo avisa en consola si alguno está mal formado). */
  OW.LEVELS.forEach(function (lv) {
    if (lv.map.length !== OW.C.ROWS) console.warn('Nivel ' + lv.id + ': filas = ' + lv.map.length);
    lv.map.forEach(function (row, r) {
      if (row.length !== OW.C.COLS) console.warn('Nivel ' + lv.id + ' fila ' + r + ': columnas = ' + row.length);
    });
  });
})();
