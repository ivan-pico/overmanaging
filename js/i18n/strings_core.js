/* OVERMANAGING — js/i18n/strings_core.js (agente CORE)
 * Textos de jugabilidad: lane.*, task.*, npc.*, diff.*, lvl.*, hazard.*, tut.*, ceo.*, game.*
 * Catalán ('ca') es el idioma por defecto. Parámetros entre llaves: {name}, {n}.
 */
window.OW = window.OW || {};
(function (OW) {
  'use strict';
  if (!OW.I18N || typeof OW.I18N.add !== 'function') return;
  OW.I18N.add({
    ca: {
      /* Carrils */
      'lane.budget': 'Pressupost',
      'lane.plan': 'Planificació',
      'lane.report': "Informe d'estat",

      /* Tasques de l'agenda */
      'task.budget_meeting': 'Revisar pressupost',
      'task.daily': "Reunió d'equip",
      'task.status': 'Seguiment amb el client',
      'task.business': 'Reunió amb negoci',
      'task.presentation': 'Presentació de sprint',
      'task.steering': 'Comitè de seguiment',
      'task.board': 'Comitè de direcció',
      'task.call': 'Trucada del client',
      'task.one2one': 'One-to-one amb {name}',

      /* Equip (NPC dels escriptoris) */
      'npc.0': 'Laia', 'npc.1': 'Marc', 'npc.2': 'Núria', 'npc.3': 'Pau', 'npc.4': 'Jordi', 'npc.5': 'Aina',
      'npc.busy.0': '{name}: ara no, que vaig a tope!',
      'npc.busy.1': "{name}: ja en parlarem al one-to-one",
      'npc.busy.2': '{name}: tinc una daily en dos minuts',
      'npc.busy.3': "{name}: m'ho pots escriure per Slack?",

      /* Dificultats */
      'diff.0.name': 'Becari feliç',
      'diff.0.desc': 'Cites sense pressa, sense necessitat de cafè i el CEO de vacances.',
      'diff.1.name': 'Junior optimista',
      'diff.1.desc': '«Això ho tanquem en una reunió.» Molt de marge per aprendre.',
      'diff.2.name': 'Sènior cafeïnat',
      'diff.2.desc': 'Terminis de veritat i dos cafès per hora, però amb ofici.',
      'diff.3.name': 'PMO de ferro',
      'diff.3.desc': 'Agenda plena, comitès encadenats i la impressora en flames. Sort.',

      /* Nivells */
      'lvl.1.name': 'La Startup',
      'lvl.1.desc': 'El teu primer sprint com a PM. Pressupost, planificació i un telèfon que no para.',
      'lvl.1.sprint': 'Sprint 1',
      'lvl.1.motto': 'Kick-off: alinear expectatives',
      'lvl.2.name': 'El Coworking',
      'lvl.2.desc': "Tres carrils, notificacions que ho bloquegen tot i one-to-ones amb l'equip.",
      'lvl.2.sprint': 'Sprint 4',
      'lvl.2.motto': 'Retro: menys reunions per parlar de reunions',
      'lvl.3.name': 'La Consultora',
      'lvl.3.desc': 'Compte amb el CEO i les seves «ideetes ràpides».',
      'lvl.3.sprint': 'Sprint 7',
      'lvl.3.motto': 'Workshop: sinergies transversals',
      'lvl.4.name': 'La Multinacional',
      'lvl.4.desc': "Cintes de correu intern, impressores que s'encallen abans i llum tènue.",
      'lvl.4.sprint': 'Sprint 12',
      'lvl.4.motto': 'Comitè: escalar el risc a qui toqui',
      'lvl.5.name': 'Tancament de trimestre',
      'lvl.5.desc': "Tot alhora. I se'n va la llum.",
      'lvl.5.sprint': 'Sprint 13',
      'lvl.5.motto': 'Q4: tot és prioritat 1',

      /* Perills */
      'hazard.notif': 'Notificacions',
      'hazard.manager': 'El CEO',
      'hazard.conveyor': 'Cintes de correu',
      'hazard.heat': "Impressores que s'encallen",
      'hazard.blackout': 'Apagades',

      /* Tutorial (nivell 1) */
      'tut.1': "Agafa un ENCÀRREC d'un arxivador de Pressupost o Planificació: mira'l i prem E  (J2: tecla .)",
      'tut.2': "Deixa'l en un ESCRIPTORI (E) i MANTÉN F per redactar-lo  (J2: tecla ,)",
      'tut.3': "Porta l'ESBORRANY a la IMPRESSORA. Imprimeix sola... recull-lo abans que s'encalli i cremi!",
      'tut.4': "Posa l'IMPRÈS a la TAULA DE SIGNATURES i MANTÉN F per aprovar-lo",
      'tut.5': "Agafa un DOSSIER de la pila, posa-hi el document aprovat i porta'l a la SALA DE REUNIONS",
      'tut.6': 'Sona el TELÈFON! Amb les mans buides, MANTÉN F al telèfon per atendre la trucada',
      'tut.7': "Reunió feta! Els dossiers tornen a ACTES: mantén F allà per arxivar l'acta i reutilitzar-los",

      /* El CEO */
      'ceo.hello': 'Ei, equip!',
      'ceo.line.0': 'Una ideeta ràpida...',
      'ceo.line.1': 'I si ho fem amb IA?',
      'ceo.line.2': 'Tens cinc minutets?',
      'ceo.line.3': 'Ho podem tenir per ahir?',
      'ceo.line.4': 'He vist una cosa a LinkedIn...',
      'ceo.line.5': 'I si pivotem a blockchain?',
      'ceo.line.6': 'És només un canvi petitet...',
      'ceo.line.7': "Fem una call d'alineament?",

      /* Missatges de partida */
      'game.dodged': 'Esquivat!',
      'game.one2one_ask': '{name} vol parlar amb tu',
      'game.expired': 'Caducada! {name} -{n}€',
      'game.tip': 'Puntualitat +{n}€',
      'game.meeting_done': '✔ Reunió feta',
      'game.rejected': 'Rebutjat! Ningú ha convocat això',
      'game.fire': 'Foc!',
      'game.blocked_notif': 'Hi ha una notificació!',
      'game.minutes_pending': "Primer arxiva l'acta (mantén F)",
      'game.no_shred_ext': "L'extintor no es destrueix!",
      'game.need_dossier': "Posa-ho abans en un dossier",
      'game.empty_dossier': 'El dossier és buit',
      'game.not_for_meeting': 'Això no va a la reunió',
      'game.phone_hands': 'Amb les mans buides!',
      'game.npc_hands': 'Deixa això abans de parlar',
      'game.notif_squashed': 'Silenciada!',
      'game.drafted': 'Esborrany llest',
      'game.approved': '✔ Aprovat',
      'game.minutes_filed': 'Acta arxivada ✔',
      'game.caffeine': 'Cafeïna!',
      'game.phone_silent': 'No truca ningú... de moment',
      'game.call_done': '✔ Trucada atesa',
      'game.one2one_done': '✔ One-to-one amb {name}',
      'game.extinguished': 'Foc apagat',
      'game.notif_new.0': '@here URGENT!',
      'game.notif_new.1': 'Correu nou!',
      'game.notif_new.2': 'Re: Re: Re: FW:',
      'game.notif_new.3': 'Tens 99+ missatges',
      'game.me': 'Jo!',
      'game.minutes_back': 'Dossier amb acta pendent',
      'game.banner.30s': '30 SEGONS!',
      'game.banner.30s_sub': 'Últim esforç abans del comitè',
      'game.banner.blackout': 'APAGADA!',
      'game.banner.blackout_sub': 'Només es veuen pantalles, LEDs i mòbils',
      'game.jammed': 'PAPER ENCALLAT!',
      'game.sound_on': 'So: ON (M)',
      'game.sound_off': 'So: OFF (M)'
    },

    es: {
      /* Carriles */
      'lane.budget': 'Presupuesto',
      'lane.plan': 'Planificación',
      'lane.report': 'Informe de estado',

      /* Tareas de la agenda */
      'task.budget_meeting': 'Revisar presupuesto',
      'task.daily': 'Reunión de equipo',
      'task.status': 'Seguimiento con el cliente',
      'task.business': 'Reunión con negocio',
      'task.presentation': 'Presentación de sprint',
      'task.steering': 'Comité de seguimiento',
      'task.board': 'Comité de dirección',
      'task.call': 'Llamada del cliente',
      'task.one2one': 'One-to-one con {name}',

      /* Equipo */
      'npc.0': 'Laia', 'npc.1': 'Marc', 'npc.2': 'Núria', 'npc.3': 'Pau', 'npc.4': 'Jordi', 'npc.5': 'Aina',
      'npc.busy.0': '{name}: ahora no, ¡que voy a tope!',
      'npc.busy.1': '{name}: ya lo hablamos en el one-to-one',
      'npc.busy.2': '{name}: tengo una daily en dos minutos',
      'npc.busy.3': '{name}: ¿me lo escribes por Slack?',

      /* Dificultades */
      'diff.0.name': 'Becario feliz',
      'diff.0.desc': 'Citas sin prisa, sin necesidad de café y el CEO de vacaciones.',
      'diff.1.name': 'Junior optimista',
      'diff.1.desc': '«Esto lo cerramos en una reunión.» Mucho margen para aprender.',
      'diff.2.name': 'Sénior cafeinado',
      'diff.2.desc': 'Plazos de verdad y dos cafés por hora, pero con oficio.',
      'diff.3.name': 'PMO de hierro',
      'diff.3.desc': 'Agenda llena, comités encadenados y la impresora en llamas. Suerte.',

      /* Niveles */
      'lvl.1.name': 'La Startup',
      'lvl.1.desc': 'Tu primer sprint como PM. Presupuesto, planificación y un teléfono que no para.',
      'lvl.1.sprint': 'Sprint 1',
      'lvl.1.motto': 'Kick-off: alinear expectativas',
      'lvl.2.name': 'El Coworking',
      'lvl.2.desc': 'Tres carriles, notificaciones que lo bloquean todo y one-to-ones con el equipo.',
      'lvl.2.sprint': 'Sprint 4',
      'lvl.2.motto': 'Retro: menos reuniones para hablar de reuniones',
      'lvl.3.name': 'La Consultora',
      'lvl.3.desc': 'Cuidado con el CEO y sus «ideítas rápidas».',
      'lvl.3.sprint': 'Sprint 7',
      'lvl.3.motto': 'Workshop: sinergias transversales',
      'lvl.4.name': 'La Multinacional',
      'lvl.4.desc': 'Cintas de correo interno, impresoras que se atascan antes y luz tenue.',
      'lvl.4.sprint': 'Sprint 12',
      'lvl.4.motto': 'Comité: escalar el riesgo a quien toque',
      'lvl.5.name': 'Cierre de trimestre',
      'lvl.5.desc': 'Todo a la vez. Y se va la luz.',
      'lvl.5.sprint': 'Sprint 13',
      'lvl.5.motto': 'Q4: todo es prioridad 1',

      /* Peligros */
      'hazard.notif': 'Notificaciones',
      'hazard.manager': 'El CEO',
      'hazard.conveyor': 'Cintas de correo',
      'hazard.heat': 'Impresoras que se atascan',
      'hazard.blackout': 'Apagones',

      /* Tutorial (nivel 1) */
      'tut.1': 'Coge un ENCARGO de un archivador de Presupuesto o Planificación: míralo y pulsa E  (J2: tecla .)',
      'tut.2': 'Déjalo en un ESCRITORIO (E) y MANTÉN F para redactarlo  (J2: tecla ,)',
      'tut.3': 'Lleva el BORRADOR a la IMPRESORA. Imprime sola... ¡recógelo antes de que se atasque y arda!',
      'tut.4': 'Pon el IMPRESO en la MESA DE FIRMAS y MANTÉN F para aprobarlo',
      'tut.5': 'Coge un DOSSIER de la pila, mete el documento aprobado y llévalo a la SALA DE REUNIONES',
      'tut.6': '¡Suena el TELÉFONO! Con las manos vacías, MANTÉN F en el teléfono para atender la llamada',
      'tut.7': '¡Reunión hecha! Los dossiers vuelven a ACTAS: mantén F allí para archivar el acta y reutilizarlos',

      /* El CEO */
      'ceo.hello': '¡Ey, equipo!',
      'ceo.line.0': 'Una ideíta rápida...',
      'ceo.line.1': '¿Y si lo hacemos con IA?',
      'ceo.line.2': '¿Tienes cinco minutitos?',
      'ceo.line.3': '¿Lo podemos tener para ayer?',
      'ceo.line.4': 'He visto una cosa en LinkedIn...',
      'ceo.line.5': '¿Y si pivotamos a blockchain?',
      'ceo.line.6': 'Es solo un cambio pequeñito...',
      'ceo.line.7': '¿Hacemos una call de alineamiento?',

      /* Mensajes de partida */
      'game.dodged': '¡Esquivado!',
      'game.one2one_ask': '{name} quiere hablar contigo',
      'game.expired': '¡Caducada! {name} -{n}€',
      'game.tip': 'Puntualidad +{n}€',
      'game.meeting_done': '✔ Reunión hecha',
      'game.rejected': '¡Rechazado! Nadie convocó eso',
      'game.fire': '¡Fuego!',
      'game.blocked_notif': '¡Hay una notificación!',
      'game.minutes_pending': 'Primero archiva el acta (mantén F)',
      'game.no_shred_ext': '¡El extintor no se destruye!',
      'game.need_dossier': 'Mételo antes en un dossier',
      'game.empty_dossier': 'El dossier está vacío',
      'game.not_for_meeting': 'Esto no va a la reunión',
      'game.phone_hands': '¡Con las manos vacías!',
      'game.npc_hands': 'Deja eso antes de hablar',
      'game.notif_squashed': '¡Silenciada!',
      'game.drafted': 'Borrador listo',
      'game.approved': '✔ Aprobado',
      'game.minutes_filed': 'Acta archivada ✔',
      'game.caffeine': '¡Cafeína!',
      'game.phone_silent': 'No llama nadie... de momento',
      'game.call_done': '✔ Llamada atendida',
      'game.one2one_done': '✔ One-to-one con {name}',
      'game.extinguished': 'Fuego apagado',
      'game.notif_new.0': '@here ¡URGENTE!',
      'game.notif_new.1': '¡Correo nuevo!',
      'game.notif_new.2': 'Re: Re: Re: FW:',
      'game.notif_new.3': 'Tienes 99+ mensajes',
      'game.me': '¡Yo!',
      'game.minutes_back': 'Dossier con acta pendiente',
      'game.banner.30s': '¡30 SEGUNDOS!',
      'game.banner.30s_sub': 'Último empujón antes del comité',
      'game.banner.blackout': '¡APAGÓN!',
      'game.banner.blackout_sub': 'Solo se ven pantallas, LEDs y móviles',
      'game.jammed': '¡ATASCO DE PAPEL!',
      'game.sound_on': 'Sonido: ON (M)',
      'game.sound_off': 'Sonido: OFF (M)'
    }
  });
})(window.OW);
