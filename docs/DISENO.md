# OVERMANAGING — Documento de diseño y CONTRATO entre agentes

Juego hermano de OVERWORKING (copiado como base en esta carpeta). Mismo motor (Canvas 1280×720,
JS vanilla, scripts clásicos con `defer`, sin build, funciona con `file://`), mismos controles,
co-op 1–2 jugadores, dificultades, panel F9, guardado en localStorage.

**Cambio de temática:** ya no eres dev, eres **Project Manager IT**. Ya no hay "platos/pedidos":
la cola de pedidos es la **AGENDA** del día. Van entrando **citas/tareas** con hora límite y hay que
cumplirlas antes de que caduquen.

**Idiomas:** catalán (`ca`, POR DEFECTO) y castellano (`es`). Selector en el menú de Opciones
(y también accesible desde la pantalla de título). NINGÚN texto visible puede ir en duro en el código:
todo pasa por `OW.t('clave')` (ver `js/i18n/i18n.js`, ya escrito, no tocar su API).

Nombres: juego **OVERMANAGING**. Claves de localStorage con prefijo `overmanaging_` (no `overworking_`)
para no pisar el progreso del otro juego: `overmanaging_save_v1`, `overmanaging_tuning_v1`,
`overmanaging_lang_v1`.

---

## 1. Flujo principal (equivalencias con el juego original)

| Original (Overworking) | Nuevo (Overmanaging) | id interno nuevo |
|---|---|---|
| Impresora de specs F/B/D | **Fuentes de documentos**: Archivador de Finanzas (F), Tablero de backlog/Jira (B), Tablero del equipo (D) | estaciones `src_budget`, `src_plan`, `src_report` |
| carril front/back/data | **carril** `budget` (Pressupost, ámbar `#ffb02e`), `plan` (Planificació, azul `#4da3ff`), `report` (Informe d'estat, verde `#3ddc84`) | `lane` |
| spec | **Encargo / datos en bruto** (hoja suelta con clip) | item `brief` {lane} |
| Escritorio (mantener acción 2,5 s) | **Escritorio con portátil**: redactar | estación `desk` → item `draft` {lane} |
| Servidor de build (4 s solo; si no se recoge pita → SEGFAULT, arde) | **Impresora**: imprime sola en 4 s; si no recoges a tiempo se atasca y **arde** | estación `printer` → item `printout` {lane}; quemado → `burnt` {lane} |
| Banco de tests (mantener 1,5 s; puede escapar un bug) | **Mesa de firmas**: firmar/sellar ("Aprovat") | estación `approval` → item `approved` {lane} |
| Pila de PRs | **Pila de carpetas de reunión (dossiers)** | estación `folder_stack`, item `dossier` {contents:[lanes]} |
| Deploy (cohete) | **Sala de reuniones**: entregas el dossier; si encaja con una cita de la agenda → se cumple (animación: puerta, aplausos/confeti, "✔ Reunió feta") | estación `meeting_room` |
| Code review (vuelve "con comentarios") | **Actas**: 6 s después de cada reunión el dossier vuelve con acta pendiente a la estación de **archivo de actas**; mantener acción para archivarla → dossier limpio | estación `minutes`, item `dossier_minutes` |
| Papelera /dev/null | **Destructora de papel** | estación `shredder` |
| Extintor HOTFIX | **Extintor** (igual mecánica) | item `extinguisher` |
| Cafetera | Cafetera (igual) | `coffee` |
| Bugs que bloquean estaciones | **Notificaciones** (sobres de correo / burbujas de chat "@here URGENT") que revolotean, se posan en estaciones y las bloquean; se aplastan con Acción (manos vacías) | entidad `notif` (se dibuja con `OW.Art.drawBug`, ver §4) |
| Manager "5 minutitos" (aturde) | **El CEO** con "una ideeta ràpida..." / "una ideíta rápida..." (aturde; el dash lo esquiva) | entidad `manager` (se dibuja con `OW.Art.drawManager`, ahora con aspecto de CEO) |
| Cintas transportadoras | **Cinta de correo interno** | `conveyor` (igual) |
| Apagones | **Apagones** (igual) | `blackout` |
| Cohete del deploy | Efecto de reunión cumplida en la sala | `OW.Art.drawRocket` se reutiliza como "efecto de entrega" (ver §4) |

### 1.1 Mecánicas NUEVAS (no existían)

1. **Teléfono** (`phone`, letra de mapa `L`). Cuando entra en la agenda una cita tipo `call`
   ("Trucada del client"), el teléfono suena (vibra + icono + sfx `phone_ring` en bucle suave cada ~1,2 s).
   El jugador con las **manos vacías** mantiene Acción 2 s en el teléfono → cita cumplida
   (puntos pequeños, tiempo límite corto, ~25 s). Si hay varias llamadas, se atienden de una en una.
2. **One-to-one** (`team_desk`, letra de mapa `N`). Escritorios con un **miembro del equipo** (NPC sentado,
   cada uno con nombre: Laia, Marc, Núria, Pau, Jordi, Aina...). Una cita `one2one` apunta a uno concreto
   ("One-to-one amb Laia"): el NPC levanta la mano y muestra bocadillo. El jugador con las manos vacías
   mantiene Acción 3 s en su escritorio → cumplida. Mientras dura la acción, el jugador no puede moverse.
3. **Tipos de cita de la agenda** (`OW.TASKS`, sustituye a `OW.RECIPES`):

| id | kind | requiere | clave nombre i18n | ca / es |
|---|---|---|---|---|
| `budget_meeting` | dossier | [budget] | `task.budget_meeting` | Revisar pressupost / Revisar presupuesto |
| `daily` | dossier | [plan] | `task.daily` | Reunió d'equip / Reunión de equipo |
| `status` | dossier | [report] | `task.status` | Seguiment amb el client / Seguimiento con el cliente |
| `business` | dossier | [budget, plan] | `task.business` | Reunió amb negoci / Reunión con negocio |
| `presentation` | dossier | [plan, report] | `task.presentation` | Presentació de sprint / Presentación de sprint |
| `steering` | dossier | [budget, report] | `task.steering` | Comitè de seguiment / Comité de seguimiento |
| `board` | dossier | [budget, plan, report] | `task.board` | Comitè de direcció / Comité de dirección |
| `call` | call | teléfono | `task.call` | Trucada del client / Llamada del cliente |
| `one2one` | one2one | team_desk concreto | `task.one2one` ({name}) | One-to-one amb {name} / One-to-one con {name} |

   Cada objeto de pedido/cita en `game.orders` tiene: `{ id, task (id), kind, lanes:[...], name (ya traducido
   al crearlo NO: guardar la clave y traducir al dibujar), target (para one2one: índice/nombre del NPC),
   time, maxTime, value }`. El HUD dibuja la agenda con `OW.Art.drawOrderCard`.

## 2. Leyenda de mapa (18×9) — `levels.js`

```
.  suelo           #  pared            C  mesa/encimera      E  mesa con extintor
F  src_budget      B  src_plan         D  src_report         K  desk (portátil)
S  printer         T  approval         P  folder_stack       Y  meeting_room
R  minutes         X  shredder         Q  coffee             L  phone
N  team_desk       p  plant            r  bookshelf (decorado: estantería/archivo)
w  whiteboard (decorado: pizarra con post-its)
> < ^ v  cinta     1 2  aparición jugadores                  M  aparición del CEO
```

## 3. Niveles (temas para `drawBackground/drawFloor`)

| # | id tema | ca | es | Novedad |
|---|---|---|---|---|
| 1 | `startup` | La Startup | La Startup | Tutorial guiado; pressupost + planificació, teléfono, sin peligros |
| 2 | `coworking` | El Coworking | El Coworking | Tres carriles, notificaciones, one-to-ones |
| 3 | `consulting` | La Consultora | La Consultora | El CEO y sus ideítas |
| 4 | `corporate` | La Multinacional | La Multinacional | Cintas de correo interno, impresoras que se atascan antes, luz tenue |
| 5 | `quarterclose` | Tancament de trimestre | Cierre de trimestre | Todo a la vez + apagones |

Los textos de tutorial y descripciones de nivel van en i18n (`lvl.N.name`, `lvl.N.desc`, `lvl.N.tutorial.K`...).
Los "branch/hash/commit" decorativos del original se sustituyen por algo de PM: `sprint` ("Sprint 1"),
`ticket` ("PRJ-101") y `motto` (frase tipo "Kick-off: alinear expectatives") — también en i18n.

## 4. Contrato de la API gráfica (`OW.Art`, agente ART) — mismas firmas que el original

- `drawStation(ctx, st, x, y, tile, t)` con `st.type` ∈ { wall, counter, src_budget, src_plan, src_report, desk,
  printer, approval, folder_stack, meeting_room, minutes, shredder, coffee, phone, team_desk, plant, bookshelf,
  whiteboard, conveyor }. Campos de vista (igual que `stationView` original: `state` 'idle'|'working'|'done'|'warning'|
  'burnt', `progress` 0..1, `fire`, `blocked` (notificación posada), `dir`, `hasExt`, `joinLeft/joinTop`, etc.) y NUEVOS:
  - phone: `ringing` (bool), `progress` (atendiendo).
  - team_desk: `npc` {name, color, hair, idx}, `wants` (bool: tiene one-to-one pendiente → mano levantada + bocadillo
    con icono de calendario), `progress`.
  - meeting_room: `busy` (0..1 animación de reunión cumplida reciente).
- `drawItem(ctx, item, cx, cy, scale, t)` con `item.kind` ∈ { brief, draft, printout, approved, burnt, dossier,
  dossier_minutes, extinguisher } y `item.lane` / `item.contents`.
- `drawCharacter(ctx, v, t)`: los jugadores son **Project Managers** (camisa/americana, portátil o tablet,
  auriculares con micro, gafas opcional). Misma estructura de `v` que el original.
- `drawBug(ctx, view, t)` → dibuja una **notificación** (sobre/burbuja de chat roja con "!" o "@"), mismo `view`.
- `drawManager(ctx, view, t)` → dibuja al **CEO** (traje, gafas de sol o chaleco de plumas "tech CEO"), mismo `view`.
- `drawRocket(ctx, x, y, t, k)` → se mantiene la firma, pero dibuja el efecto de "reunión cumplida"
  (p. ej. post-its/confeti y un "✔" que sube con un calendario). Mantener k 0..1.
- `drawOrderCard(ctx, order, x, y, w, h, t, opts)` → **tarjeta de agenda** (hoja de calendario con hora límite,
  icono por kind: dossier = carpeta con los chips de carril necesarios; call = teléfono; one2one = dos caras;
  barra de tiempo restante). El nombre se obtiene con `OW.t(order.nameKey, order.nameParams)` si existe,
  si no `order.name`.
- `drawLaneGlyph(lane)`: budget = "€", plan = barras de Gantt, report = gráfico de quesitos/flecha.
- `A.LANES` = { budget, plan, report } con `name` obtenido por i18n (`lane.budget`...).
- `drawIcon(ctx, name, ...)`: añadir iconos `phone`, `calendar`, `one2one`, `mail`, `globe` (idioma) además de los existentes.
- `drawLogo`: logotipo "OVERMANAGING" (con un toque de calendario/corbata/diagrama de Gantt en vez de código).
- Temas: `startup`, `coworking`, `consulting`, `corporate`, `quarterclose` (fallback `coworking`).
- Ningún texto en idioma dentro del arte salvo vía `OW.t` (las etiquetas cortas de estaciones mejor con pictogramas;
  si se escribe texto, que sea por `OW.t('art.xxx')` y no cachearlo en el sprite, o regenerar el caché al cambiar idioma
  con `OW.I18N.onChange`).

## 5. Audio (`OW.Audio`, agente ART) — `OW.sfx(name)`

Se mantienen todos los nombres del original (blackout, bug_spawn, coffee, compile_done, compile_start, conveyor,
countdown, dash, deliver, drop, extinguish, fire, go, manager, order_fail, order_new, pickup, review_done, squash,
star, stun, test_ok, timeup, trash, type, ui_back, ui_move, ui_select, warning, wrong) — CORE puede seguir usándolos
con su significado nuevo (compile_* = impresora, test_ok = firma, review_done = acta archivada, bug_spawn = notificación).
NUEVOS que ART debe añadir: `phone_ring` (ring-ring corto), `phone_pickup`, `one2one_done`, `meeting_done`
(aplauso corto), `stamp` (golpe de sello), `print` (ruido de impresora corto). La música puede mantenerse
(opcional: retocarla para que suene más "oficina/lounge").

## 6. i18n — reparto de ficheros (cada agente es dueño del suyo)

- `js/i18n/i18n.js` — motor (escrito; no cambiar la API).
- `js/i18n/strings_core.js` — agente CORE: `game.*`, `lvl.*`, `task.*`, `lane.*`, `npc.*`, `tut.*`, textos flotantes.
- `js/i18n/strings_art.js` — agente ART: `art.*` (si necesita alguno).
- `js/i18n/strings_ui.js` — agente UI: `ui.*`, `page.*`, `dev.*`.
Formato: `OW.I18N.add({ ca: {...}, es: {...} });` Siempre las dos lenguas, catalán correcto (apostrofaciones,
"l'equip", "d'estat", accents oberts/tancats: "pressupost", "reunió", "trucada", "comitè").
El catalán es el idioma por defecto. Al cambiar de idioma en caliente, lo que se dibuja cada frame cambia solo
(porque se llama a `OW.t` al dibujar); NO cachear strings traducidos en estructuras persistentes.

## 7. Propiedad de ficheros (NO editar ficheros de otro agente)

| Agente | Ficheros |
|---|---|
| **CORE** (jugabilidad) | `js/core/game.js`, `levels.js`, `tuning.js`, `entities.js`, `config.js`, `fallbacks.js`, `input.js`, `main.js`, `js/i18n/strings_core.js` |
| **ART** (gráficos y audio) | `js/art/*.js` excepto nada, `js/audio.js`, `tools/*`, `js/i18n/strings_art.js` |
| **UI** (menús, HUD, idioma, web) | `js/core/menus.js`, `js/core/hud.js`, `js/core/devpanel.js`, `js/page.js`, `index.html`, `css/*`, `README.md`, `manifest.webmanifest`, `robots.txt`, `sitemap.xml`, `icons/*`, `img/*`, `js/i18n/strings_ui.js` |

Orden de scripts en `index.html` (UI lo mantiene): `js/i18n/i18n.js` PRIMERO, luego `strings_*.js`, luego audio,
art, core como en el original.

## 8. Pruebas

Chrome headless disponible: `google-chrome --headless=new --disable-gpu --screenshot=/ruta.png --window-size=1280,720
"file:///home/ivan/Projects/Overmanaging/index.html?level=2&players=2&skipintro=1&lang=es"`
(usar `--virtual-time-budget=4000` para dejar que corra). Para errores de consola:
`--enable-logging=stderr --v=0` o un script de node con puppeteer si estuviese (no lo está: usar chrome con
`--dump-dom` o capturar errores pintándolos). Archivos temporales en el scratchpad de la sesión, nunca en el repo.
Cada agente debe asegurarse de que el juego carga sin errores aunque los otros agentes aún no hayan terminado
(usar `OW.t` defensivo, `fallbacks.js` sigue existiendo).
