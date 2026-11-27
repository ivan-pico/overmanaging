# OVERMANAGING

Co-op caótico tipo "cocina frenética" en el que eres **Project Manager IT**. La cola de pedidos es tu
**agenda** del día: van entrando citas (revisar el presupuesto, la reunión de equipo, el seguimiento con
el cliente, el comité de dirección, llamadas, one-to-ones...) y hay que cumplirlas antes de que caduquen.
Para cada reunión hay que preparar un **dossier** con los documentos adecuados: coger el encargo,
redactarlo, imprimirlo, firmarlo, meterlo en la carpeta y llevarla a la sala de reuniones. Todo ello
mientras la impresora se atasca y arde, las notificaciones bloquean las mesas y el CEO aparece con
"una ideíta rápida".

Hermano de [OVERWORKING](https://overworking.gohan.cat/) (mismo motor, el caos visto desde el
otro lado del Gantt). HTML5 Canvas + JavaScript vanilla. No necesita build, ni dependencias, ni servidor:
todos los gráficos y el audio se generan por código. **Bilingüe: catalán (por defecto) y castellano.**

## Cómo jugar

Abre `index.html` en un navegador moderno (Chrome, Firefox, Edge): basta con hacer doble clic.
El audio se activa al pulsar la primera tecla.

- **1 jugador**: manejas a dos PM y alternas entre ellos con `Tab` (o `Y` en el mando).
- **2 jugadores**: co-op local en el mismo teclado o con mandos.

## Jugar online

**https://overmanaging.gohan.cat/** (castellano: `https://overmanaging.gohan.cat/?lang=es`)

### Despliegue en GitHub Pages

El juego es estático, así que se publica tal cual:

1. En GitHub: *Settings → Pages → Build and deployment → Source: Deploy from a branch*, rama `main`, carpeta `/ (root)`.
2. En *Custom domain* pon `overmanaging.gohan.cat` (el fichero `CNAME` ya lo indica) y, en el DNS de gohan.cat, crea `CNAME overmanaging ivan-pico.github.io`.
3. (Opcional) Da de alta la URL en Google Search Console y envía `sitemap.xml`.

La página incluye metadatos SEO, Open Graph/Twitter (`img/og-image.png`), datos estructurados
`VideoGame` (JSON-LD), `hreflang` ca/es, `manifest.webmanifest` (instalable como PWA), `robots.txt` y
`sitemap.xml`. Si cambia la URL pública, actualízala en `index.html` (canonical, hreflang, `og:*`, JSON-LD),
`js/page.js` (constante `BASE`), `sitemap.xml` y `robots.txt`.
Bajo la pantalla de juego hay una sección "Sobre el joc" en HTML (también traducida): al bajar a leerla la
partida se pausa.

## Idioma

- **Catalán por defecto**; castellano disponible.
- Se cambia en **Opciones → Idioma** (`←`/`→`, `Enter`, ratón o mando), con la pastilla **CA | ES** de la
  pantalla de título y del menú (clic), con la tecla **`L`** en título/menú/opciones, con `Y` del mando en
  la pantalla de título, o con los enlaces *Català / Castellano* de la página.
- El cambio es en caliente (lienzo y HTML) y se recuerda en `localStorage` (`overmanaging_lang_v1`).
- `index.html?lang=es` (o `?lang=ca`) fuerza el idioma al cargar.
- Motor: `js/i18n/i18n.js` (`OW.t('clave', {param})`, `OW.I18N.setLang/onChange/applyDom`). Textos:
  `strings_core.js` (juego: `game.*`, `lvl.*`, `task.*`, `lane.*`, `diff.*`, `hazard.*`...),
  `strings_art.js` (`art.*`) y `strings_ui.js` (`ui.*` menús y HUD, `dev.*` panel F9, `page.*` castellano
  de la página). El catalán de la página está escrito directamente en `index.html` (para que se vea sin
  JavaScript y lo indexen los buscadores) y `js/page.js` lo registra como `ca` al arrancar.

## Controles

| Acción | Jugador 1 | Jugador 2 | Mando |
|---|---|---|---|
| Mover | `W A S D` | Flechas | Stick / cruceta |
| Coger / dejar | `E` | `.` (punto) | A |
| Acción (mantener) | `F` | `,` (coma) | X |
| Dash (esquivar) | `Shift` izq. | `-` / `/` | B |
| Cambiar de PM (solo) | `Tab` | `Tab` | Y |
| Pausa | `Esc` / `P` | `Esc` / `P` | Start |
| Silenciar | `M` | `M` | — |
| Idioma (menús) | `L` | `L` | Y (título) |

Los menús se manejan con flechas/WASD + `Enter`, con el ratón o con el mando.

## Mecánicas

1. **Fuentes de documentos** (ámbar = presupuesto, azul = planificación, verde = informe de estado):
   archivador de finanzas, backlog y tablero del equipo. Coge un encargo.
2. **Escritorio con portátil**: deja el encargo y mantén *Acción* ~2,5 s → borrador.
3. **Impresora**: deja el borrador; imprime sola en 4 s. Si no recoges el papel a tiempo empieza a pitar,
   se atasca y **arde** (el fuego se propaga). Apágalo con el **extintor** manteniendo *Acción* mientras
   miras al fuego. Lo quemado sólo va a la destructora.
4. **Mesa de firmas**: deja el impreso y mantén *Acción* 1,5 s → documento aprobado. A veces sale una
   **notificación** que revolotea y bloquea estaciones: aplástala con *Acción* (manos vacías).
5. **Dossier**: coge una carpeta de la pila y mete un documento aprobado de cada carril que pida la cita
   (puedes dejar el dossier en una mesa e ir añadiendo documentos).
6. **Sala de reuniones**: entrega el dossier. Si coincide con una cita de la agenda → reunión hecha,
   aplausos y puntos (+ bonus de puntualidad). Si no, se rechaza.
7. **Actas**: 6 s después de cada reunión el dossier vuelve con el acta pendiente a la estación de actas;
   mantén *Acción* allí para archivarla y reutilizar la carpeta.
8. **Teléfono**: cuando entra una cita "Llamada del cliente" el teléfono suena; mantén *Acción* 2 s con las
   manos vacías para atenderla.
9. **One-to-one**: un miembro del equipo (Laia, Marc, Núria...) levanta la mano; mantén *Acción* 3 s en
   su escritorio con las manos vacías.
10. **El CEO**: si te atrapa con "una ideíta rápida" te deja parado unos segundos; el dash lo esquiva.
11. **Café**: la energía baja con el tiempo; con poca vas más lento y sin nada vas en modo zombi.
    Mantén *Acción* en la cafetera para recargar.
12. **Destructora** destruye lo que llevas (si es un dossier, lo vacía). **Mesas**: superficie libre.

Citas de la agenda: Revisar presupuesto [presupuesto], Reunión de equipo [planificación],
Seguimiento con el cliente [informe], Reunión con negocio [presupuesto+planificación],
Presentación de sprint [planificación+informe], Comité de seguimiento [presupuesto+informe],
Comité de dirección [los tres], Llamada del cliente (teléfono) y One-to-one con {nombre}.

El HUD muestra la agenda (arriba a la izquierda), el **reloj de oficina** (la jornada va de 9:00 a 18:00,
repartida en la duración del nivel, con el tiempo real restante debajo), la puntuación en € con las
estrellas conseguidas y la energía de cada PM. Cada cita caducada resta 30 €. Las estrellas (1–3) dependen
de la puntuación; en modo 1 jugador los umbrales son un 70 % de los de 2 jugadores. Con al menos 1
estrella se desbloquea el siguiente nivel. El progreso se guarda en `localStorage` (`overmanaging_save_v1`).

## Niveles

Se eligen en un **roadmap** con forma de diagrama de Gantt (cada sprint depende del anterior).

| # | Nivel (ca / es) | Novedad |
|---|---|---|
| 1 | La Startup | Tutorial guiado; presupuesto + planificación y teléfono, sin peligros |
| 2 | El Coworking | Tres carriles, notificaciones y one-to-ones |
| 3 | La Consultora | El CEO y sus ideítas (el dash lo esquiva) |
| 4 | La Multinacional | Cintas de correo interno, impresoras que se atascan antes, luz tenue |
| 5 | Tancament de trimestre / Cierre de trimestre | Todo a la vez + apagones |

## Ajustar la dificultad (tuning)

Todos los parámetros de equilibrio están en **`js/core/tuning.js`** (`OW.TUNING`), cada uno con un
comentario que explica qué hace y su unidad: movimiento y dash de los PM, café, CEO, tiempos del flujo
de documentos (redactar, imprimir, firmar, actas, teléfono, one-to-one), agenda (multa, bonus), tareas
(puntos y tiempos, llamadas, one-to-ones), fuego, notificaciones, apagones, las 4 dificultades y los
parámetros de cada nivel por id (duración, tareas y pesos, dossiers, peligros, citas, estrellas...).
Los mapas están en `levels.js` y los textos en `js/i18n/`. Cambia un valor, guarda y recarga.

**Panel de ajustes en el juego (modo desarrollador):** pulsa **F9** en cualquier momento (o abre
`index.html?dev=1`, que muestra un botón `⚙ DEV`). La partida se congela mientras está abierto.

- Pestañas *Jugador*, *Flujo y agenda*, *Dificultades* y *Niveles* (tablas editables), en el idioma activo.
- `●` = se nota al instante; `↻` = se aplica al empezar un nivel: usa **Reiniciar nivel con estos ajustes**.
- Los valores cambiados se resaltan y tienen un botón `↺` para volver al de `tuning.js`.
- Es tolerante con la estructura: si `tuning.js` gana claves nuevas, aparecen como campos genéricos.
- Los cambios se guardan en `localStorage` (`overmanaging_tuning_v1`), sólo en ese navegador; mientras
  haya alguno activo se ve el aviso `DEV: ajustes modificados` en la esquina.
- **Exportar tuning.js** genera el fichero completo (comentarios en castellano) con los valores actuales,
  lo copia y permite descargarlo: sustituye `js/core/tuning.js` por él y los cambios quedan para todos.
- **Exportar / importar JSON** para compartir sólo los cambios; **Restaurar todo por defecto** los borra.

## Estructura

```
index.html              punto de entrada (scripts clásicos con defer, sin módulos: funciona con file://) + SEO
js/page.js              página: idioma del HTML (registra el catalán, applyDom) y pausa al hacer scroll
manifest.webmanifest    PWA · robots.txt, sitemap.xml · img/og-image.png (imagen social 1200×630) · icons/
css/style.css           letterbox del lienzo 1280×720 y página · css/devpanel.css: panel F9
js/i18n/                idiomas
  i18n.js               motor (OW.t, OW.I18N) — se carga el primero
  strings_core.js       textos de jugabilidad · strings_art.js textos del arte · strings_ui.js menús, HUD, F9, página
js/audio.js             OW.Audio: música y SFX sintetizados con WebAudio
js/art/                 OW.Art / OW.FX: todo el dibujo procedural
  art.js                utilidades, temas, fondos, suelos, iluminación, barras de progreso
  characters.js         PM, notificaciones, CEO, equipo, bocadillos
  stations.js           estaciones de trabajo y efecto de reunión cumplida
  items.js              encargos, borradores, impresos, documentos aprobados, dossiers, extintor
  fx.js                 partículas (chispas, humo, confeti, monedas, espuma, texto flotante...)
  ui.js                 paneles, botones, tarjetas de agenda, iconos, logo, fondo de menú
js/core/                lógica del juego
  fallbacks.js          sustitutos mínimos si falta ART o AUDIO
  tuning.js             TODOS los parámetros de equilibrio (OW.TUNING), comentados
  config.js             constantes, utilidades, guardado, overrides de tuning (OW.Tuning)
  input.js              teclado (event.code), mandos (Gamepad API) y ratón
  levels.js             tareas de agenda, mapas 18×9 de cada nivel (+ sus parámetros desde tuning.js)
  entities.js           jugadores, notificaciones y CEO
  game.js               partida: estaciones, flujo de documentos, agenda, peligros, dibujado del mundo
  hud.js                HUD: agenda, reloj de oficina, puntuación, energía, tutorial, avisos
  menus.js              pantallas: título (selector CA|ES), menú, opciones, controles, créditos,
                        roadmap de niveles, intro, pausa, fin de jornada, resultados (acta de la jornada)
  devpanel.js           panel de ajustes en el juego (F9)
  main.js               bucle principal (paso fijo 60 Hz) y ganchos de depuración
tools/                  galería de arte y bancos de pruebas
docs/DISENO.md          diseño y contrato entre módulos
```

### Depuración

- `index.html?level=3&players=2&skipintro=1` arranca directamente un nivel.
- `index.html?screen=levels` (o `menu`, `options`, `controls`, `credits`) abre una pantalla.
- `index.html?lang=es` fuerza el castellano; `?dev=1` muestra el botón del panel de ajustes.
- En consola: `OW.debug.state()`, `OW.debug.startLevel(n, jugadores)`, `OW.debug.skipTime(s)`,
  `OW.debug.unlockAll()`, `OW.debug.setLang('es')`, `OW.I18N.setLang('ca')`...

## Créditos

Un juego de [Ivan Picó](https://gohan.cat) · Gohan Project. Licencia GPL-3.0.
