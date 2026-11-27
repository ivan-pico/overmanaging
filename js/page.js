/* OVERMANAGING — PÁGINA: integra el lienzo con el contenido "Sobre el joc" que hay debajo.
 * - Idioma del HTML: el texto catalán está escrito en index.html; aquí se registra como 'ca'
 *   (leyendo data-i18n / data-i18n-html / data-i18n-attr) y luego se aplica el idioma actual.
 *   Los cambios de idioma (menú de opciones, botón CA|ES, tecla L o los enlaces de la página)
 *   se ven al instante gracias a OW.I18N.applyDom (lo llama setLang).
 * - Si el jugador baja a leer en mitad de una partida, el juego se pausa.
 * - Los enlaces "Tornar al joc" devuelven el foco al lienzo. */
(function () {
  'use strict';
  var OW = window.OW || {};
  var I = OW.I18N;

  /* ---------- Idioma ---------- */
  if (I) {
    // 1) registrar el catalán que está escrito en el HTML (index.html es la fuente del texto 'ca' de page.*)
    var ca = {};
    var put = function (k, v) { if (k) ca[k] = v; };
    var els = document.querySelectorAll('[data-i18n]'), i;
    for (i = 0; i < els.length; i++) put(els[i].getAttribute('data-i18n'), els[i].textContent.replace(/\s+/g, ' ').trim());
    els = document.querySelectorAll('[data-i18n-html]');
    for (i = 0; i < els.length; i++) put(els[i].getAttribute('data-i18n-html'), els[i].innerHTML.replace(/\s+/g, ' ').trim());
    els = document.querySelectorAll('[data-i18n-attr]');
    for (i = 0; i < els.length; i++) {
      var pairs = els[i].getAttribute('data-i18n-attr').split(';');
      for (var j = 0; j < pairs.length; j++) {
        var p = pairs[j].split(':');
        if (p.length === 2) put(p[1].trim(), els[i].getAttribute(p[0].trim()) || '');
      }
    }
    I.add({ ca: ca });

    // 2) metadatos que dependen del idioma
    var BASE = 'https://overmanaging.gohan.cat/';
    var syncMeta = function (lang) {
      var og = document.querySelector('meta[property="og:locale"]');
      var alt = document.querySelector('meta[property="og:locale:alternate"]');
      if (og) og.setAttribute('content', lang === 'es' ? 'es_ES' : 'ca_ES');
      if (alt) alt.setAttribute('content', lang === 'es' ? 'ca_ES' : 'es_ES');
      var canon = document.querySelector('link[rel="canonical"]');
      if (canon) canon.setAttribute('href', lang === 'es' ? BASE + '?lang=es' : BASE);
      var ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) ogUrl.setAttribute('content', lang === 'es' ? BASE + '?lang=es' : BASE);
      var links = document.querySelectorAll('[data-lang]');
      for (var k = 0; k < links.length; k++) {
        if (links[k].getAttribute('data-lang') === lang) links[k].setAttribute('aria-current', 'true');
        else links[k].removeAttribute('aria-current');
      }
    };
    I.onChange(syncMeta);
    I.applyDom();
    syncMeta(I.lang);

    // 3) enlaces de idioma de la página: cambio en caliente sin recargar
    var langLinks = document.querySelectorAll('[data-lang]');
    for (i = 0; i < langLinks.length; i++) {
      langLinks[i].addEventListener('click', function (e) {
        e.preventDefault();
        I.setLang(this.getAttribute('data-lang'));
      });
    }
  }

  /* ---------- Pausa al hacer scroll y foco del lienzo ---------- */
  var wrap = document.getElementById('juego');
  var canvas = document.getElementById('game');
  if (!wrap || !canvas) return;

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      var e = entries[entries.length - 1];
      if (e.isIntersecting && e.intersectionRatio >= 0.5) return;
      var App = window.OW && window.OW.App;
      if (App && App.name === 'play') { try { App.go('pause'); } catch (err) { /* nada */ } }
    }, { threshold: [0, 0.5] }).observe(wrap);
  }

  var links = document.querySelectorAll('a[href="#juego"]');
  for (var n = 0; n < links.length; n++) {
    links[n].addEventListener('click', function () {
      setTimeout(function () { try { canvas.focus({ preventScroll: true }); } catch (err) { canvas.focus(); } }, 0);
    });
  }
})();
