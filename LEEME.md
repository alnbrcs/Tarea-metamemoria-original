# Tarea de metamemoria: réplica en jsPsych de la versión E-Prime ("Metamemoria_60")

## Cómo correrla
- **En línea:** subir la carpeta completa a un repositorio de GitHub y activar GitHub Pages. El enlace a la tarea es el de `index.html`.
- **Local:** abrir `index.html` con Chrome, Edge o Firefox (doble clic).
- En la primera pantalla se ingresa el código del participante y se elige el orden de bloques (los 6 órdenes posibles). Con eso se pasa a pantalla completa y empieza la tarea.
- Atajo para dejar todo precargado: `index.html?id=P01&orden=321`.
- Para revisar la tarea rápido: `index.html?rapido=1` acorta los tiempos de estudio (3 s + 2 s en los bloques). Esas sesiones también se envían, con `_RAPIDO` en el nombre del archivo y `modo_rapido = 1`, para borrarlas fácilmente.
- Para interrumpir una sesión: **Ctrl + Shift + Q**. Se envía lo registrado hasta ese momento, con `sesion_completa = 0`. El ensayo que se estaba mostrando no se guarda.

## Estructura (igual a la original)
1. Instrucciones: Diapositiva1–7 de Carteles_Consuelo. Se avanza con la tecla "2". A la Diapositiva1 (logo del laboratorio) se le agregó el texto "Presione “2” para continuar", copiado de la Diapositiva2; en la original no lo tiene.
2. Práctica: lista de pares de letras (20 s + 10 s con el aviso "Quedan 10 segundos") y 5 preguntas en orden fijo (practica1–5), cada una con su confianza. Al final, Diapositiva8.
3. Tres bloques en el orden elegido. Números de E-Prime: 1 = 05A, 2 = 10A, 3 = 10B. Cada bloque:
   - cruz de fijación + lista de 20 pares (50 s) + la misma lista con "Quedan 10 segundos" (10 s);
   - 20 ensayos en orden aleatorio: cruz de 1 s → 2AFC (clic izquierdo o derecho, máximo 8 s) → confianza 1–4 por teclado (máximo 30 s). Si no hay respuesta en el 2AFC, no se muestra la confianza y se pasa a la cruz del ensayo siguiente.
4. Cartel "¡Atención! Un nuevo ciclo…" después de los bloques 1 y 2.
5. Pantalla final (Cartel_final) y descarga de los datos.

Las imágenes son las originales, convertidas a PNG. Se muestran con su proporción original (4:3), ajustadas al alto de la pantalla y con bordes blancos a los lados (`STRETCH: false` en `config.js`). El par WQ repetido de la lista 05A se mantiene tal cual.

## Datos
Con `DATAPIPE_EXPERIMENT_ID` definido en `config.js` (actualmente `Z4700n0HSJHr`), al terminar se envía a DataPipe, y de ahí a Google Drive, **un CSV por participante**: `metamemoria_original_<id>_orden<orden>_<fecha-hora>.csv`, con una fila por pregunta (5 de práctica + 60 de prueba).
- Mientras se envía, el participante ve "Guardando datos. Por favor, no cierre esta página." (dura uno o dos segundos) y después "Datos guardados. ¡Gracias por participar!".
- Si el envío falla (por ejemplo, sin internet), el CSV se descarga en el computador del participante y aparece un aviso para que te lo envíe.
- Si alguien cierra la página a mitad de la tarea, DataPipe recupera lo que alcanzó a registrarse como un archivo `.partial.json`. Ese archivo viene en el formato bruto de jsPsych: una entrada por pantalla, no por pregunta.

Si `DATAPIPE_EXPERIMENT_ID` se deja vacío (`""`), no se envía nada: se descargan en el computador el CSV y los datos brutos de jsPsych (.json), y al final aparece una tabla con el acierto por bloque.

| columna | significado |
|---|---|
| participante, orden_bloques | lo ingresado al inicio |
| fase | `practica` o `prueba` |
| posicion_bloque | 1–3 (0 = práctica) |
| bloque_eprime | número del bloque en E-Prime (1 = 05A, 2 = 10A, 3 = 10B) |
| lista | 05A, 10A, 10B, practica |
| ensayo_en_bloque, ensayo_global | orden de presentación (global = 1–60, solo prueba) |
| item, estimulo_eprime | número del ítem y nombre del archivo original (igual que `QuestStim`) |
| lado_correcto, RC | Izq/Der; RC 1 = izquierda, 2 = derecha (igual que E-Prime) |
| par_izquierda, par_derecha, objetivo, distractor | pares en letras de FUENTEFALSA |
| resp | 1 = clic izquierdo, 2 = clic derecho, vacío = sin respuesta (equivale a `MetaPregunta.RESP`) |
| acc | 1/0; sin respuesta = 0, igual que E-Prime (equivale a `MetaPregunta.ACC`) |
| rt_ms | tiempo de respuesta del 2AFC desde que aparece la imagen |
| timeout | 1 si se acabaron los 8 s sin respuesta |
| conf_mostrada, confianza, conf_rt_ms | pantalla de confianza (equivale a `Confi2.RESP` y `Confi2.RT`) |
| conf_timeout | 1 si la confianza se mostró y pasaron los 30 s sin respuesta |
| sesion_completa | 1 si la sesión llegó al final; 0 si se interrumpió con Ctrl + Shift + Q |

## Parámetros (`config.js`)
Todos los tiempos y las imágenes se cambian ahí.
- `CONF_LIMIT_MS` (30000): límite de la confianza. Es una decisión: en el ejecutable original la confianza esperó alrededor de 90 s.
- `SKIP_CONF_IF_NO_AFC` (true): igual que en la original.

Supuestos que quedan:
- `FIXATION_BEFORE_STUDY_MS` (1000): la cruz antes de la lista existe, pero su duración es un supuesto.
- `FIXATION_FONT_PX` (40): tamaño de la "+".
- `END_IMAGE`: Cartel_final.png; la alternativa es Diapositiva9.png.
