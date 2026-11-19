// =====================================================================
//  PARÁMETROS DE LA TAREA (réplica de "Metamemoria_60", E-Prime 3)
//  Todos los tiempos en milisegundos.
// =====================================================================
const CONFIG = {
  // --- Guardado de datos
  // ID del experimento en DataPipe (los datos llegan a Google Drive).
  // Si se deja vacío (""), los datos se descargan en el computador como antes.
  DATAPIPE_EXPERIMENT_ID: "Z4700n0HSJHr",

  // --- Estudio de cada bloque (confirmado: MetaDur = 50000 en los logs + aviso de 10 s = 60 s)
  STUDY_MS: 50000,
  WARNING_MS: 10000,            // pantalla "Quedan 10 segundos"

  // --- Estudio de la práctica (lista de letras): mitad del tiempo = 30 s
  PRACTICE_STUDY_MS: 20000,
  PRACTICE_WARNING_MS: 10000,

  // --- Cruz de fijación
  FIXATION_MS: 1000,              // antes de cada pregunta (tesis: 1 s)
  FIXATION_BEFORE_STUDY_MS: 1000, // antes de la lista de estudio (la cruz existe; duración POR CONFIRMAR)
  FIXATION_FONT_PX: 40,           // tamaño de la "+": POR CONFIRMAR

  // --- Respuestas
  AFC_LIMIT_MS: 8000,             // límite del 2AFC (confirmado)
  CONF_LIMIT_MS: 30000,           // límite de la confianza (decisión: 30 s; la original esperaba ~90 s)
  SKIP_CONF_IF_NO_AFC: true,      // sin respuesta en el 2AFC: no hay confianza, sigue cruz + siguiente ensayo (confirmado)
  CONF_KEYS: ["1", "2", "3", "4"],
  ADVANCE_KEY: "2",               // tecla para avanzar instrucciones y carteles

  // --- Pantalla
  STRETCH: false,                 // false: cada imagen con su proporción original (4:3), ajustada al alto de la pantalla
                                  // true: imágenes estiradas a todo el ancho de la pantalla
  HIDE_CURSOR: true,              // ocultar el puntero durante la tarea

  // --- Pantallas (rutas dentro de img/)
  INSTRUCTIONS: [
    "img/Instrucciones/Diapositiva1.png", // logo laboratorio
    "img/Instrucciones/Diapositiva2.png", // Hola
    "img/Instrucciones/Diapositiva3.png", // primera etapa (60 s)
    "img/Instrucciones/Diapositiva4.png", // segunda etapa
    "img/Instrucciones/Diapositiva5.png", // confianza
    "img/Instrucciones/Diapositiva6.png", // importante
    "img/Instrucciones/Diapositiva7.png", // práctica
  ],
  END_PRACTICE_IMAGE: "img/Instrucciones/Diapositiva8.png",
  BETWEEN_BLOCKS_IMAGE: "img/Instrucciones/cartelfinbloques.png",
  END_IMAGE: "img/BaseImg/Cartel_final.png", // alternativa: "img/Instrucciones/Diapositiva9.png"
  CONFIDENCE_IMAGE: "img/BaseImg/Confi2.png",

  PRACTICE_STUDY_IMAGE: "img/BaseImg/MemoriaPractice.png",
  PRACTICE_WARNING_IMAGE: "img/BaseImg/MemoriaPractice_copia.png",

  // Bloques: número E-Prime (1, 2, 3) -> lista
  BLOCKS: {
    "1": { list: "05A", study: "img/BaseImg/Meta05A.png", warning: "img/BaseImg/Meta05Acopia.png" },
    "2": { list: "10A", study: "img/BaseImg/Meta10A.png", warning: "img/BaseImg/Meta10Acopia.png" },
    "3": { list: "10B", study: "img/BaseImg/Meta10B.png", warning: "img/BaseImg/Meta10Bcopia.png" },
  },
  ORDERS: ["123", "132", "213", "231", "312", "321"],
};
