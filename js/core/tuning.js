/* OVERMANAGING — CORE: ajustes de equilibrio (tuning).
 *
 * Aquí están TODOS los números que deciden la dificultad: velocidad de los PM, café, CEO,
 * tiempos del flujo de documentos, agenda, tareas, dificultades y parámetros de cada nivel.
 *  - Cambia un valor, guarda y recarga la página.
 *  - O pulsa F9 en el juego (panel de desarrollador): ajusta en vivo y usa "Exportar tuning.js"
 *    para generar este mismo fichero con tus valores y sustituirlo aquí.
 *  - Los mapas de los niveles están en js/core/levels.js; los textos, en js/i18n/strings_core.js.
 * Unidades: s = segundos · px/s = píxeles por segundo (una casilla mide 64 px) · × = multiplicador.
 *
 * CAMBIOS DE ESTRUCTURA respecto a OVERWORKING (para el panel F9, js/core/devpanel.js):
 *  - recipes            → tasks      (+ callValue, callTime, one2oneValue, one2oneTime, maxCalls)
 *  - bugs               → notifs     (notificaciones; mismos campos)
 *  - pipeline.compileTime → pipeline.printTime · testTime → signTime · reviewTime → minutesTime
 *    (+ pipeline.phoneHold, pipeline.one2oneHold)
 *  - difficulties[i]: sin name/desc (son textos: OW.t('diff.<i>.name'/'diff.<i>.desc'), expuestos
 *    como getters no enumerables d.name / d.desc); bugs → notifs.
 *  - levels[id]: recipes → tasks · prs → dossiers · bugChance → notifChance
 */
(function () {
  'use strict';
  var OW = (window.OW = window.OW || {});

  OW.TUNING = {
    /* Jugador · movimiento */
    player: {
      maxSpeed: 350.0,     // Velocidad máxima [px/s]. Velocidad punta andando con energía llena (una casilla = 64 px). Se multiplica por "walk" de la dificultad.
      accel: 2400,         // Aceleración [px/s²]. Lo rápido que llega a la velocidad máxima al empezar a andar.
      friction: 2800,      // Frenada [px/s²]. Deceleración al soltar las teclas de movimiento.
      dashSpeed: 720,      // Velocidad del dash [px/s]. Impulso inicial del dash.
      dashTime: 0.16,      // Duración del dash [s]. Tiempo que dura el impulso del dash.
      dashCooldown: 0.75,  // Espera entre dashes [s]. Tiempo mínimo entre dos dashes.
      dashTiredKeep: 0.7   // Dash con sueño [0–1]. Parte del dash que se conserva aunque estés agotado: dash × (k + (1 − k) × multiplicador de cansancio).
    },

    /* Café y energía */
    coffee: {
      duration: 90,      // Duración del café [s]. Segundos que dura la energía llena con gasto ×1 (la dificultad lo multiplica con "drain").
      slowBelow: 0.3,    // Umbral cansado [0–1]. Con menos energía que esto vas más lento.
      slowMul: 0.75,     // Velocidad cansado [×]. Multiplicador de velocidad cuando estás cansado.
      zombieBelow: 0.1,  // Umbral zombi [0–1]. Con menos energía que esto vas en modo zombi.
      zombieMul: 0.5,    // Velocidad zombi [×]. Multiplicador de velocidad en modo zombi.
      drinkTime: 1       // Tiempo en la cafetera [s]. Segundos manteniendo acción en la cafetera para recargar.
    },

    /* CEO ("una ideíta rápida...") — la entidad interna sigue llamándose manager */
    manager: {
      chaseSpeed: 120,       // Velocidad persiguiendo [px/s]. Velocidad del CEO cuando te persigue (× "boss" de la dificultad).
      returnSpeed: 100,      // Velocidad volviendo [px/s]. Velocidad del CEO cuando vuelve a su despacho (× "boss").
      catchRadius: 34,       // Radio de captura [px]. Distancia a la que te atrapa para contarte su idea.
      stunTime: 2.5,         // Duración de la idea [s]. Tiempo que te deja aturdido con su "ideíta rápida".
      immuneAfter: 5,        // Inmunidad tras la idea [s]. Tiempo que no puede volver a atraparte.
      dodgeImmune: 1,        // Inmunidad al esquivar [s]. Inmunidad al esquivarlo con un dash.
      firstVisit: [14, 20],  // Primera visita [s]. Segundos (aleatorio entre mín y máx) hasta que aparece por primera vez. (al reiniciar nivel)
      chaseTime: 14,         // Tiempo persiguiendo [s]. Cuánto te persigue antes de rendirse.
      awayTime: [16, 24]     // Tiempo entre visitas [s]. Segundos fuera (aleatorio entre mín y máx) antes de volver a salir.
    },

    /* Flujo de documentos (encargo → borrador → impreso → aprobado → dossier) */
    pipeline: {
      deskTime: 2.5,     // Redactar (escritorio) [s]. Segundos manteniendo acción para convertir un encargo en borrador.
      printTime: 4,      // Imprimir (impresora) [s]. Segundos que tarda la impresora en imprimir el borrador.
      warnAfter: 5,      // Aviso de atasco [s]. Segundos con el impreso sin recoger hasta que empieza a pitar (÷ heat del nivel).
      burnAfter: 3,      // Incendio tras el aviso [s]. Segundos desde el aviso hasta que la impresora arde (÷ heat del nivel).
      signTime: 1.5,     // Firmar (mesa de firmas) [s]. Segundos manteniendo acción para aprobar un impreso.
      minutesTime: 2,    // Archivar acta [s]. Segundos manteniendo acción para limpiar un dossier devuelto con acta.
      returnDelay: 6,    // Vuelta del dossier con acta [s]. Segundos tras una reunión hasta que el dossier vuelve a Actas.
      conveyorTime: 1.1, // Cinta: tiempo por casilla [s]. Segundos que tarda un objeto en recorrer una casilla de cinta.
      phoneHold: 2,      // Atender el teléfono [s]. Segundos manteniendo acción (manos vacías) para atender una llamada.
      one2oneHold: 3     // One-to-one [s]. Segundos manteniendo acción (manos vacías) en el escritorio del compañero.
    },

    /* Agenda (citas) */
    orders: {
      expirePenalty: 30,    // Multa por caducada [€]. Dinero que se resta cuando caduca una cita.
      tipFactor: 0.6,       // Bonus máximo [× valor]. Bonus = valor × esto × fracción de tiempo restante (redondeado a 5).
      firstGapFactor: 0.6,  // Primera cita extra [× espera]. Fracción de la espera normal (orderGap) para la primera cita nueva. (al reiniciar nivel)
      emptyRefill: 1.2,     // Agenda vacía: siguiente en [s]. Si no queda ninguna cita, la siguiente llega como mucho en este tiempo.
      singleRefill: 5       // Con una cita: siguiente en [s]. Si sólo queda una (fuera del tutorial), la siguiente llega como mucho en este tiempo.
    },

    /* Tareas de la agenda */
    tasks: {
      value: [0, 60, 110, 170],  // Puntos base [€]. Valor de una reunión según los documentos que pide (1, 2 o 3 carriles). Afecta a citas nuevas.
      time: [0, 60, 80, 100],    // Tiempo de la reunión [s]. Segundos según nº de documentos (× timeMul del nivel × "order" de la dificultad). Afecta a citas nuevas.
      callValue: 35,             // Puntos de una llamada [€]. Valor de una cita "Llamada del cliente".
      callTime: 25,              // Tiempo de una llamada [s]. Segundos para atenderla (× timeMul × "order").
      one2oneValue: 50,          // Puntos de un one-to-one [€]. Valor de una cita "One-to-one con...".
      one2oneTime: 45,           // Tiempo de un one-to-one [s]. Segundos para hacerlo (× timeMul × "order").
      maxCalls: 2,               // Llamadas a la vez [citas]. Máximo de llamadas pendientes simultáneas.
      soloStars: 0.7             // Estrellas en 1 jugador [×]. Factor de los umbrales de estrellas en modo 1 jugador (los del nivel son para 2).
    },

    /* Fuego */
    fire: {
      startLevel: 0.35,       // Intensidad inicial [0–1]. Intensidad con la que empieza un fuego.
      growRate: 0.35,         // Crecimiento [/s]. Cuánto crece la intensidad del fuego por segundo (máximo 1).
      spreadEvery: [4, 5.5],  // Propagación cada [s]. Cada cuánto (aleatorio entre mín y máx) salta el fuego a una casilla vecina.
      extinguishTime: 0.9     // Tiempo de extintor [s]. Segundos rociando para apagar un fuego al máximo.
    },

    /* Notificaciones (antes "bugs") */
    notifs: {
      maxAlive: 3,       // Máximo a la vez [notif.]. No salen más notificaciones si ya hay tantas vivas.
      maxChance: 0.8,    // Probabilidad máxima [0–1]. Tope de probabilidad de notificación por firma (nivel × dificultad). (al reiniciar nivel)
      speed: [95, 125],  // Velocidad de vuelo [px/s]. Velocidad de cada notificación (aleatoria entre mín y máx).
      sitTime: [9, 14]   // Tiempo bloqueando [s]. Cuánto se queda una notificación posada bloqueando una estación.
    },

    /* Apagones */
    blackout: {
      firstAt: 32,      // Primer apagón [s]. Segundos de partida hasta el primer apagón (niveles con apagones). (al reiniciar nivel)
      duration: 9.5,    // Duración [s]. Duración total de un apagón (incluye 1 s de vuelta de la luz).
      every: [22, 30],  // Siguiente apagón tras [s]. Segundos (aleatorio entre mín y máx) entre el fin de un apagón y el siguiente.
      darkness: 0.9     // Oscuridad [0–1]. Oscuridad durante el apagón (1 = negro total).
    },

    /* Dificultades, en el orden del menú de opciones (por defecto se usa la 1).
     * Nombre y descripción: OW.t('diff.<índice>.name') / OW.t('diff.<índice>.desc') (js/i18n/strings_core.js).
     * Los multiplicadores a 1 equivalen al equilibrio base de tuning.js. */
    difficulties: [
      { // 0 · Becari feliç
        order: 2.2,             // Tiempo de citas [×]. Multiplica el tiempo de cada cita (más = más margen). (al reiniciar nivel)
        gap: 1.4,               // Espera entre citas [×]. Multiplica la espera entre citas nuevas (más = menos agobio). (al reiniciar nivel)
        heat: 0.4,              // Atascos [×]. Multiplica la velocidad a la que se atasca y arde un impreso olvidado (más = antes). (al reiniciar nivel)
        notifs: 0.15,           // Probabilidad de notificación [×]. Multiplica la probabilidad de notificación del nivel. (al reiniciar nivel)
        drain: 0,               // Gasto de café [×]. Multiplica el gasto de energía (0 = no hace falta café).
        boss: 0.5,              // Velocidad del CEO [×]. Multiplica la velocidad del CEO.
        walk: 1,                // Velocidad andando [×]. Multiplica la velocidad máxima de los PM al andar.
        stars: 0.45,            // Umbrales de estrellas [×]. Multiplica los puntos necesarios para cada estrella.
        maxOrders: 1,           // Tope de citas [citas]. Citas simultáneas como máximo (0 = el del nivel). (al reiniciar nivel)
        color: '#7cff9b'        // Color. Color del nombre en el menú.
      },
      { // 1 · Junior optimista
        order: 1.6,                // Tiempo de citas [×]. Multiplica el tiempo de cada cita (más = más margen). (al reiniciar nivel)
        gap: 1.25,                 // Espera entre citas [×]. Multiplica la espera entre citas nuevas (más = menos agobio). (al reiniciar nivel)
        heat: 0.6,                 // Atascos [×]. Multiplica la velocidad a la que se atasca y arde un impreso olvidado (más = antes). (al reiniciar nivel)
        notifs: 0.45,              // Probabilidad de notificación [×]. Multiplica la probabilidad de notificación del nivel. (al reiniciar nivel)
        drain: 0.5,                // Gasto de café [×]. Multiplica el gasto de energía (0 = no hace falta café).
        boss: 0.7,                 // Velocidad del CEO [×]. Multiplica la velocidad del CEO.
        walk: 1,                   // Velocidad andando [×]. Multiplica la velocidad máxima de los PM al andar.
        stars: 0.65,               // Umbrales de estrellas [×]. Multiplica los puntos necesarios para cada estrella.
        maxOrders: 2,              // Tope de citas [citas]. Citas simultáneas como máximo (0 = el del nivel). (al reiniciar nivel)
        color: '#4da3ff'           // Color. Color del nombre en el menú.
      },
      { // 2 · Senior cafeïnat
        order: 1.25,               // Tiempo de citas [×]. Multiplica el tiempo de cada cita (más = más margen). (al reiniciar nivel)
        gap: 1.1,                  // Espera entre citas [×]. Multiplica la espera entre citas nuevas (más = menos agobio). (al reiniciar nivel)
        heat: 0.8,                 // Atascos [×]. Multiplica la velocidad a la que se atasca y arde un impreso olvidado (más = antes). (al reiniciar nivel)
        notifs: 0.75,              // Probabilidad de notificación [×]. Multiplica la probabilidad de notificación del nivel. (al reiniciar nivel)
        drain: 0.8,                // Gasto de café [×]. Multiplica el gasto de energía (0 = no hace falta café).
        boss: 0.85,                // Velocidad del CEO [×]. Multiplica la velocidad del CEO.
        walk: 1,                   // Velocidad andando [×]. Multiplica la velocidad máxima de los PM al andar.
        stars: 0.85,               // Umbrales de estrellas [×]. Multiplica los puntos necesarios para cada estrella.
        maxOrders: 0,              // Tope de citas [citas]. Citas simultáneas como máximo (0 = el del nivel). (al reiniciar nivel)
        color: '#ffd23f'           // Color. Color del nombre en el menú.
      },
      { // 3 · PMO de ferro
        order: 0.8,            // Tiempo de citas [×]. Multiplica el tiempo de cada cita (más = más margen). (al reiniciar nivel)
        gap: 0.85,             // Espera entre citas [×]. Multiplica la espera entre citas nuevas (más = menos agobio). (al reiniciar nivel)
        heat: 1.35,            // Atascos [×]. Multiplica la velocidad a la que se atasca y arde un impreso olvidado (más = antes). (al reiniciar nivel)
        notifs: 1.4,           // Probabilidad de notificación [×]. Multiplica la probabilidad de notificación del nivel. (al reiniciar nivel)
        drain: 1.3,            // Gasto de café [×]. Multiplica el gasto de energía (0 = no hace falta café).
        boss: 1.2,             // Velocidad del CEO [×]. Multiplica la velocidad del CEO.
        walk: 1,               // Velocidad andando [×]. Multiplica la velocidad máxima de los PM al andar.
        stars: 1,              // Umbrales de estrellas [×]. Multiplica los puntos necesarios para cada estrella.
        maxOrders: 0,          // Tope de citas [citas]. Citas simultáneas como máximo (0 = el del nivel). (al reiniciar nivel)
        color: '#ff5d73'       // Color. Color del nombre en el menú.
      }
    ],

    /* Parámetros de cada nivel, por id (el mapa y el tema están en levels.js; los textos en strings_core.js).
     * tasks: ids de OW.TASKS (levels.js). Las llamadas ('call') sólo salen si el mapa tiene teléfono (L)
     * y los one-to-one ('one2one') sólo si tiene escritorios de equipo (N). */
    levels: {
      1: { // La Startup
        duration: 170,                                            // Duración de la jornada [s]. Duración de la partida. (al reiniciar nivel)
        tasks: ['budget_meeting', 'daily', 'business', 'call'],   // Tareas (peso). Tareas de agenda que pueden salir y su peso relativo (más peso = sale más). (al reiniciar nivel)
        weights: [3, 3, 2, 2],                                    // Pesos de las tareas. Peso relativo de cada tarea de "tasks" (mismo orden). (al reiniciar nivel)
        dossiers: 3,                                              // Dossiers iniciales [dossiers]. Carpetas de reunión en la pila al empezar. (al reiniciar nivel)
        notifChance: 0,                                           // Prob. de notificación al firmar [0–1]. Probabilidad de que salga una notificación al aprobar un documento (× "notifs" de la dificultad). (al reiniciar nivel)
        manager: false,                                           // CEO. Si aparece el CEO (necesita su casilla M o cualquier suelo). (al reiniciar nivel)
        conveyors: false,                                         // Cintas activas. Si las cintas de correo interno del mapa se mueven. (al reiniciar nivel)
        heat: 1,                                                  // Atascos [×]. Multiplica la velocidad de atasco de la impresora (× "heat" de la dificultad). (al reiniciar nivel)
        darkness: 0,                                              // Oscuridad base [0–1]. Penumbra permanente del nivel (0 = luz normal). (al reiniciar nivel)
        blackouts: false,                                         // Apagones. Si hay apagones periódicos. (al reiniciar nivel)
        maxOrders: 4,                                             // Citas simultáneas [citas]. Máximo de citas a la vez (más de 5 no caben en el HUD). (al reiniciar nivel)
        orderGap: [15, 21],                                       // Espera entre citas [s]. Segundos entre citas nuevas (aleatorio entre mín y máx, × "gap" de la dificultad). (al reiniciar nivel)
        startOrders: 1,                                           // Citas al empezar [citas]. Citas que hay ya al empezar la partida. (al reiniciar nivel)
        stars: [160, 400, 640],                                   // Estrellas (2 jugadores) [€]. Puntos para 1, 2 y 3 estrellas en modo 2 jugadores (× "stars" de la dificultad). (al reiniciar nivel)
        timeMul: 1                                                // Tiempo de citas [×]. Multiplica el tiempo de todas las citas del nivel. (al reiniciar nivel)
      },
      2: { // El Coworking
        duration: 150,
        tasks: ['budget_meeting', 'daily', 'status', 'business', 'presentation', 'call', 'one2one'],
        weights: [2, 2, 2, 2, 2, 1, 2],
        dossiers: 3,
        notifChance: 0.3,
        manager: false,
        conveyors: false,
        heat: 1,
        darkness: 0,
        blackouts: false,
        maxOrders: 4,
        orderGap: [14, 20],
        startOrders: 2,
        stars: [220, 480, 740],
        timeMul: 1
      },
      3: { // La Consultora
        duration: 150,
        tasks: ['budget_meeting', 'daily', 'status', 'business', 'presentation', 'steering', 'call', 'one2one'],
        weights: [2, 2, 2, 2, 2, 2, 1.5, 1.5],
        dossiers: 3,
        notifChance: 0.3,
        manager: true,
        conveyors: false,
        heat: 1,
        darkness: 0,
        blackouts: false,
        maxOrders: 4,
        orderGap: [13, 19],
        startOrders: 2,
        stars: [200, 440, 680],
        timeMul: 1
      },
      4: { // La Multinacional
        duration: 150,
        tasks: ['budget_meeting', 'daily', 'status', 'business', 'presentation', 'steering', 'board', 'call', 'one2one'],
        weights: [2, 2, 2, 2, 2, 2, 1, 1.5, 1.5],
        dossiers: 3,
        notifChance: 0.25,
        manager: false,
        conveyors: true,
        heat: 1.6,
        darkness: 0.45,
        blackouts: false,
        maxOrders: 4,
        orderGap: [13, 19],
        startOrders: 2,
        stars: [220, 460, 700],
        timeMul: 1
      },
      5: { // Tancament de trimestre
        duration: 150,
        tasks: ['budget_meeting', 'daily', 'status', 'business', 'presentation', 'steering', 'board', 'call', 'one2one'],
        weights: [2, 2, 2, 2, 2, 2, 2, 1.5, 1.5],
        dossiers: 4,
        notifChance: 0.35,
        manager: true,
        conveyors: true,
        heat: 1.3,
        darkness: 0,
        blackouts: true,
        maxOrders: 5,
        orderGap: [11, 16],
        startOrders: 2,
        stars: [220, 440, 680],
        timeMul: 0.9
      }
    }
  };
})();
