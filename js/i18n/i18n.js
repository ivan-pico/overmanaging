/* OVERMANAGING — js/i18n/i18n.js
 * Motor de idiomas. Idiomas: 'ca' (català, por defecto) y 'es' (castellano).
 * Cargar ANTES que cualquier otro script del juego (va justo después de nada: es el primero).
 *
 * API:
 *   OW.I18N.add({ ca: { clave: 'text' }, es: { clave: 'texto' } })   registra textos (cada módulo los suyos)
 *   OW.t('clave', { n: 3 })     traduce; '{n}' en el texto se sustituye por params.n.
 *                               Si falta en el idioma actual cae a 'ca', luego a 'es', y si no a la clave.
 *   OW.I18N.lang                idioma actual ('ca' | 'es')
 *   OW.I18N.setLang('es')       cambia, guarda en localStorage y avisa a los oyentes
 *   OW.I18N.onChange(fn)        fn(lang) tras cada cambio
 *   OW.I18N.LANGS               [{ id:'ca', name:'Català' }, { id:'es', name:'Castellano' }]
 *   OW.I18N.applyDom(root)      traduce el HTML: [data-i18n] → textContent, [data-i18n-html] → innerHTML,
 *                               [data-i18n-attr="attr:clave;attr2:clave2"] → atributos. Actualiza <html lang>.
 * Convención de claves: prefijo por módulo — 'ui.*' menús/HUD, 'game.*' mensajes de partida,
 *   'lvl.*' niveles, 'task.*' tareas de agenda, 'page.*' HTML de la página, 'dev.*' panel F9.
 */
window.OW = window.OW || {};
(function (OW) {
  'use strict';
  var KEY = 'overmanaging_lang_v1';
  var dict = { ca: {}, es: {} };
  var listeners = [];
  var I = OW.I18N = {
    LANGS: [{ id: 'ca', name: 'Català' }, { id: 'es', name: 'Castellano' }],
    lang: 'ca',
    add: function (tables) {
      for (var l in tables) {
        if (!dict[l]) dict[l] = {};
        for (var k in tables[l]) dict[l][k] = tables[l][k];
      }
    },
    has: function (key) { return !!(dict[I.lang][key] || dict.ca[key] || dict.es[key]); },
    setLang: function (l) {
      if (!dict[l] || l === I.lang) return;
      I.lang = l;
      try { window.localStorage.setItem(KEY, l); } catch (e) { /* sin localStorage */ }
      I.applyDom();
      for (var i = 0; i < listeners.length; i++) { try { listeners[i](l); } catch (e) { console.error(e); } }
    },
    onChange: function (fn) { listeners.push(fn); },
    applyDom: function (root) {
      if (typeof document === 'undefined') return;
      root = root || document;
      if (root === document && document.documentElement) document.documentElement.lang = I.lang;
      var els = root.querySelectorAll('[data-i18n]'), i;
      for (i = 0; i < els.length; i++) els[i].textContent = OW.t(els[i].getAttribute('data-i18n'));
      els = root.querySelectorAll('[data-i18n-html]');
      for (i = 0; i < els.length; i++) els[i].innerHTML = OW.t(els[i].getAttribute('data-i18n-html'));
      els = root.querySelectorAll('[data-i18n-attr]');
      for (i = 0; i < els.length; i++) {
        var pairs = els[i].getAttribute('data-i18n-attr').split(';');
        for (var j = 0; j < pairs.length; j++) {
          var p = pairs[j].split(':');
          if (p.length === 2) els[i].setAttribute(p[0].trim(), OW.t(p[1].trim()));
        }
      }
    }
  };
  OW.t = function (key, params) {
    var s = dict[I.lang][key];
    if (s == null) s = dict.ca[key];
    if (s == null) s = dict.es[key];
    if (s == null) return key;
    if (params) s = s.replace(/\{(\w+)\}/g, function (m, n) { return params[n] != null ? params[n] : m; });
    return s;
  };
  try {
    var saved = window.localStorage.getItem(KEY);
    var q = /[?&]lang=(ca|es)\b/.exec(window.location.search);
    if (q) I.lang = q[1]; else if (saved === 'ca' || saved === 'es') I.lang = saved;
  } catch (e) { /* sin localStorage */ }
})(window.OW);
