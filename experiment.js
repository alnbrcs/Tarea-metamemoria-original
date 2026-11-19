// =====================================================================
//  Réplica en jsPsych de la tarea de metamemoria original (E-Prime 3,
//  "Metamemoria_60"). Estructura reconstruida desde los logs .txt.
// =====================================================================
(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const FAST = params.get("rapido") === "1";
  const C = Object.assign({}, CONFIG);
  if (FAST) {
    // Solo para revisar la tarea rápido: acorta los tiempos de estudio.
    C.STUDY_MS = 3000;
    C.WARNING_MS = 2000;
    C.PRACTICE_STUDY_MS = 2000;
    C.PRACTICE_WARNING_MS = 1000;
  }

  // ------------------------------------------------------------------
  //  Pantalla de configuración (antes de empezar)
  // ------------------------------------------------------------------
  const orderLabel = (o) =>
    o + "  ·  " + o.split("").map((b) => C.BLOCKS[b].list).join(" → ");

  function showSetup() {
    const idPrefill = params.get("id") || "";
    const orderPrefill = params.get("orden") || "";
    const opts = C.ORDERS.map(
      (o) =>
        '<option value="' + o + '"' + (o === orderPrefill ? " selected" : "") + ">" +
        orderLabel(o) + "</option>"
    ).join("");
    document.body.innerHTML =
      '<form id="mm-setup" class="mm-setup" autocomplete="off">' +
      "<h1>Tarea de metamemoria</h1>" +
      (FAST ? '<p class="mm-warn">MODO RÁPIDO: tiempos de estudio acortados. No usar para recoger datos.</p>' : "") +
      '<label>Código del participante<input id="mm-id" required pattern="[A-Za-z0-9_\\-]+" ' +
      'title="Solo letras, números, guion o guion bajo" value="' + idPrefill.replace(/"/g, "") + '"></label>' +
      '<label>Orden de bloques<select id="mm-order" required>' +
      '<option value="" disabled' + (orderPrefill ? "" : " selected") + ">Elegir…</option>" +
      opts + "</select></label>" +
      '<button type="submit">Continuar</button>' +
      "</form>";
    document.getElementById("mm-setup").addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.getElementById("mm-id").value.trim();
      const order = document.getElementById("mm-order").value;
      if (!id || !C.ORDERS.includes(order)) return;
      document.body.innerHTML = "";
      start(id, order);
    });
  }

  // ------------------------------------------------------------------
  //  Experimento
  // ------------------------------------------------------------------
  function start(participant, order) {
    const session = {
      participante: participant,
      orden_bloques: order,
      inicio: new Date(),
      modo_rapido: FAST ? 1 : 0,
      abortada: 0,
    };
    const RECORDS = [];
    let lastRec = null;
    let globalTestTrial = 0;
    const stamp = formatStamp(session.inicio);
    const baseName = "metamemoria_original_" + participant + "_orden" + order + "_" + stamp + (FAST ? "_RAPIDO" : "");
    const csvName = baseName + ".csv";
    const rawName = baseName + "_brutos.json";
    const failedFiles = []; // files that could not be sent and were downloaded instead
    const backupKey = "mm_backup_" + baseName;
    const usePipe = !!C.DATAPIPE_EXPERIMENT_ID && typeof jsPsychExtensionPipe !== "undefined";

    // Final per-question table (adds whether the session was completed).
    const finalCSV = () =>
      toCSV(RECORDS.map((r) => Object.assign({}, r, { sesion_completa: session.abortada ? 0 : 1 })));

    const extensions = [];
    if (usePipe) {
      extensions.push({
        type: jsPsychExtensionPipe,
        params: {
          experiment_id: C.DATAPIPE_EXPERIMENT_ID,
          filename: csvName,
          data_string: finalCSV,
          wait_message: '<p class="mm-msg">Guardando datos. Por favor, no cierre esta página.</p>',
          done_message: '<p class="mm-msg">Datos guardados. ¡Gracias por participar! Ya puede cerrar esta página.</p>',
          on_save: (result) => {
            if (!result.ok) {
              // Upload failed: keep a copy on this computer so the data are not lost.
              download(csvName, finalCSV(), "text/csv;charset=utf-8");
              failedFiles.push(csvName);
              showUploadFailure();
            }
          },
        },
      });
    }

    const jsPsych = initJsPsych({ extensions: extensions, on_finish: () => onFinish() });
    jsPsych.data.addProperties({
      participante: participant,
      orden_bloques: order,
      modo_rapido: session.modo_rapido,
    });

    // Abort with Ctrl + Shift + Q: saves what has been recorded.
    const onAbortKey = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "Q" || e.key === "q")) {
        session.abortada = 1;
        if (jsPsychMouseButtonResponse.activeCleanup) jsPsychMouseButtonResponse.activeCleanup();
        jsPsych.abortExperiment("");
      }
    };
    document.addEventListener("keydown", onAbortKey);

    // Block the browser's right-click menu for the whole session. On Windows
    // (Firefox and Chrome) the menu opens when the button is RELEASED, after the
    // 2AFC response has already been taken on press, so blocking it only during
    // the question is not enough.
    const blockContextMenu = (e) => e.preventDefault();
    window.addEventListener("contextmenu", blockContextMenu, true);

    const backup = () => {
      if (usePipe) return; // online: DataPipe already receives each trial as it happens
      try {
        localStorage.setItem(backupKey, JSON.stringify(RECORDS));
      } catch (err) {
        /* localStorage not available: ignore */
      }
    };

    const imgHTML = (src) =>
      '<img class="' + (C.STRETCH ? "mm-full" : "mm-fit") + '" src="' + src + '" draggable="false" alt="">';

    const screen = (src, opts) => ({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: imgHTML(src),
      choices: opts.key ? [opts.key] : "NO_KEYS",
      trial_duration: opts.duration === undefined ? null : opts.duration,
      data: Object.assign({ imagen: src }, opts.data || {}),
    });

    const fixation = (ms, data) => ({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: '<div class="mm-fix" style="font-size:' + C.FIXATION_FONT_PX + 'px">+</div>',
      choices: "NO_KEYS",
      trial_duration: ms,
      data: Object.assign({ task: "fijacion" }, data || {}),
    });

    const studyPhase = (studySrc, warnSrc, studyMs, warnMs, data) => {
      const t = [];
      if (C.FIXATION_BEFORE_STUDY_MS > 0) t.push(fixation(C.FIXATION_BEFORE_STUDY_MS, Object.assign({ task: "fijacion_estudio" }, data)));
      t.push(screen(studySrc, { duration: studyMs, data: Object.assign({ task: "estudio" }, data) }));
      t.push(screen(warnSrc, { duration: warnMs, data: Object.assign({ task: "estudio_aviso10s" }, data) }));
      return t;
    };

    const questionTrial = (item, meta) => {
      const tdata = {
        fase: meta.fase,
        posicion_bloque: meta.posicion_bloque,
        bloque_eprime: meta.bloque_eprime,
        lista: meta.lista,
        item: item.item,
      };
      return [
        fixation(C.FIXATION_MS, tdata),
        {
          type: jsPsychMouseButtonResponse,
          stimulus: item.img,
          stretch: C.STRETCH,
          trial_duration: C.AFC_LIMIT_MS,
          data: Object.assign({ task: "2afc", RC: item.RC }, tdata),
          on_start: () => {
            meta.counter += 1;
            if (meta.fase === "prueba") globalTestTrial += 1;
          },
          on_finish: (d) => {
            if (session.abortada) return; // trial cut by Ctrl+Shift+Q: not recorded
            const responded = d.response !== null && d.response !== undefined;
            d.acc = responded && d.response === item.RC ? 1 : 0;
            lastRec = {
              participante: session.participante,
              orden_bloques: session.orden_bloques,
              fase: meta.fase,
              posicion_bloque: meta.posicion_bloque,
              bloque_eprime: meta.bloque_eprime,
              lista: meta.lista,
              ensayo_en_bloque: meta.counter,
              ensayo_global: meta.fase === "prueba" ? globalTestTrial : "",
              item: item.item,
              estimulo_eprime: item.eprime,
              lado_correcto: item.lado,
              RC: item.RC,
              par_izquierda: item.izquierda,
              par_derecha: item.derecha,
              objetivo: item.objetivo,
              distractor: item.distractor,
              resp: responded ? d.response : "",
              acc: d.acc,
              rt_ms: responded ? d.rt : "",
              timeout: responded ? 0 : 1,
              conf_mostrada: 0,
              confianza: "",
              conf_rt_ms: "",
              conf_timeout: 0,
              hora: new Date().toISOString(),
              modo_rapido: session.modo_rapido,
            };
            RECORDS.push(lastRec);
            backup();
          },
        },
        {
          timeline: [
            {
              type: jsPsychHtmlKeyboardResponse,
              stimulus: imgHTML(C.CONFIDENCE_IMAGE),
              choices: C.CONF_KEYS,
              trial_duration: C.CONF_LIMIT_MS,
              data: Object.assign({ task: "confianza" }, tdata),
              on_finish: (d) => {
                if (session.abortada) return;
                lastRec.conf_mostrada = 1;
                lastRec.confianza = d.response === null || d.response === undefined ? "" : Number(d.response);
                lastRec.conf_rt_ms = d.rt === null || d.rt === undefined ? "" : Math.round(d.rt * 10) / 10;
                lastRec.conf_timeout = lastRec.confianza === "" ? 1 : 0;
                backup();
              },
            },
          ],
          conditional_function: () => !(C.SKIP_CONF_IF_NO_AFC && lastRec && lastRec.timeout === 1),
        },
      ];
    };

    // ---------------- Timeline ----------------
    const timeline = [];

    const allImages = [].concat(
      C.INSTRUCTIONS,
      [C.END_PRACTICE_IMAGE, C.BETWEEN_BLOCKS_IMAGE, C.END_IMAGE, C.CONFIDENCE_IMAGE,
       C.PRACTICE_STUDY_IMAGE, C.PRACTICE_WARNING_IMAGE],
      Object.values(C.BLOCKS).flatMap((b) => [b.study, b.warning]),
      Object.values(ITEMS).flatMap((l) => l.map((i) => i.img))
    );
    timeline.push({
      type: jsPsychPreload,
      images: allImages,
      message: "Cargando imágenes…",
      error_message: "No se pudieron cargar todas las imágenes. Revise que la carpeta img/ esté junto a index.html.",
      show_detailed_errors: true,
      continue_after_error: false,
    });

    timeline.push({
      type: jsPsychFullscreen,
      fullscreen_mode: true,
      message:
        '<p class="mm-msg">Participante <b>' + participant + "</b> · orden <b>" + orderLabel(order) + "</b></p>" +
        '<p class="mm-msg">La tarea se mostrará en pantalla completa.</p>',
      button_label: "Comenzar",
      on_finish: () => {
        if (C.HIDE_CURSOR) document.body.classList.add("mm-nocursor");
      },
    });

    // Instructions (7 screens)
    C.INSTRUCTIONS.forEach((src, i) =>
      timeline.push(screen(src, { key: C.ADVANCE_KEY, data: { task: "instrucciones", pantalla: i + 1 } }))
    );

    // Practice: letter list (30 s) + 5 questions in fixed order
    const pMeta = { fase: "practica", posicion_bloque: 0, bloque_eprime: "", lista: "practica", counter: 0 };
    timeline.push(...studyPhase(C.PRACTICE_STUDY_IMAGE, C.PRACTICE_WARNING_IMAGE,
      C.PRACTICE_STUDY_MS, C.PRACTICE_WARNING_MS, { fase: "practica", lista: "practica" }));
    ITEMS.practica.forEach((it) => timeline.push(...questionTrial(it, pMeta)));
    timeline.push(screen(C.END_PRACTICE_IMAGE, { key: C.ADVANCE_KEY, data: { task: "fin_practica" } }));

    // Blocks in the chosen order
    order.split("").forEach((b, idx) => {
      const blk = C.BLOCKS[b];
      const meta = { fase: "prueba", posicion_bloque: idx + 1, bloque_eprime: Number(b), lista: blk.list, counter: 0 };
      timeline.push(...studyPhase(blk.study, blk.warning, C.STUDY_MS, C.WARNING_MS,
        { fase: "prueba", lista: blk.list, posicion_bloque: idx + 1 }));
      jsPsych.randomization.shuffle(ITEMS[blk.list]).forEach((it) => timeline.push(...questionTrial(it, meta)));
      if (idx < 2) {
        timeline.push(screen(C.BETWEEN_BLOCKS_IMAGE, { key: C.ADVANCE_KEY, data: { task: "entre_bloques", despues_de: idx + 1 } }));
      }
    });

    timeline.push(screen(C.END_IMAGE, { key: C.ADVANCE_KEY, data: { task: "fin" } }));

    jsPsych.run(timeline);

    // ---------------- Saving ----------------
    // Online (DataPipe): the extension sends the per-question CSV and shows the
    // "Guardando datos" / "Datos guardados" messages; if the upload fails,
    // on_save (above) downloads the CSV on this computer.
    // Local (no DataPipe ID): two files are downloaded, as before.
    async function onFinish() {
      document.removeEventListener("keydown", onAbortKey);
      window.removeEventListener("contextmenu", blockContextMenu, true);
      document.body.classList.remove("mm-nocursor");
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      const rawJSON = jsPsych.data.get().json();

      if (usePipe) {
        // The CSV has already been sent by the extension. Now send the raw jsPsych
        // data as a second file. The "Guardando datos" message stays on screen meanwhile.
        let ok = false;
        try {
          const r = await DataPipe.saveData({
            experiment_id: C.DATAPIPE_EXPERIMENT_ID,
            filename: rawName,
            data: rawJSON,
          });
          ok = !!(r && r.ok);
          if (!ok) console.error("DataPipe no aceptó el JSON (HTTP " + (r && r.status) + ")", r && r.body);
        } catch (err) {
          console.error("No se pudo enviar el JSON a DataPipe", err);
        }
        if (!ok) {
          download(rawName, rawJSON, "application/json");
          failedFiles.push(rawName);
          showUploadFailure();
        }
        return;
      }

      const suffix = session.abortada ? "_INCOMPLETO" : "";
      const localCsv = baseName + suffix + ".csv";
      const localRaw = baseName + suffix + "_brutos.json";
      download(localCsv, finalCSV(), "text/csv;charset=utf-8");
      download(localRaw, rawJSON, "application/json");
      try { localStorage.removeItem(backupKey); } catch (err) { /* ignore */ }
      jsPsych.getDisplayElement().innerHTML = summaryHTML(RECORDS, localCsv, localRaw, session);
    }

    function showUploadFailure() {
      jsPsych.getDisplayElement().innerHTML =
        '<div class="mm-summary"><p class="mm-msg">No se pudieron enviar los datos por internet.</p>' +
        '<p class="mm-msg">Se ' + (failedFiles.length > 1 ? "descargaron" : "descargó") +
        " en este computador:<br><b>" + failedFiles.join("<br>") + "</b></p>" +
        '<p class="mm-msg">Por favor, ' + (failedFiles.length > 1 ? "envíeselos" : "envíeselo") +
        " a la persona a cargo del estudio.</p></div>";
    }
  }

  // ------------------------------------------------------------------
  //  Utilidades
  // ------------------------------------------------------------------
  function formatStamp(d) {
    const p = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  }

  const CSV_COLUMNS = [
    "participante", "orden_bloques", "fase", "posicion_bloque", "bloque_eprime", "lista",
    "ensayo_en_bloque", "ensayo_global", "item", "estimulo_eprime", "lado_correcto", "RC",
    "par_izquierda", "par_derecha", "objetivo", "distractor", "resp", "acc", "rt_ms", "timeout",
    "conf_mostrada", "confianza", "conf_rt_ms", "conf_timeout", "hora", "modo_rapido", "sesion_completa",
  ];

  function toCSV(rows) {
    const cols = CSV_COLUMNS;
    const esc = (v) => {
      const s = v === null || v === undefined ? "" : String(v);
      return /[",\n\\]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    return [cols.join(",")].concat(rows.map((r) => cols.map((c) => esc(r[c])).join(","))).join("\n") + "\n";
  }

  function download(name, content, mime) {
    const blob = new Blob(["﻿" + content], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  function summaryHTML(rows, csvName, rawName, session) {
    const test = rows.filter((r) => r.fase === "prueba");
    const byPos = {};
    test.forEach((r) => {
      const k = r.posicion_bloque + "|" + r.lista;
      byPos[k] = byPos[k] || { n: 0, acc: 0, to: 0 };
      byPos[k].n += 1; byPos[k].acc += r.acc; byPos[k].to += r.timeout;
    });
    const trs = Object.keys(byPos).sort().map((k) => {
      const [pos, list] = k.split("|"); const v = byPos[k];
      return "<tr><td>" + pos + "</td><td>" + list + "</td><td>" + v.n + "</td><td>" +
        Math.round((100 * v.acc) / v.n) + " %</td><td>" + v.to + "</td></tr>";
    }).join("");
    return (
      '<div class="mm-summary">' +
      "<h2>" + (session.abortada ? "Sesión interrumpida" : "Sesión terminada") + "</h2>" +
      "<p>Se descargaron:<br><code>" + csvName + "</code><br><code>" + rawName + "</code></p>" +
      "<p>Si no aparecen, revise si el navegador pidió permiso para descargar varios archivos.</p>" +
      (trs ? "<table><tr><th>Posición</th><th>Lista</th><th>Ensayos</th><th>Acierto</th><th>Sin respuesta</th></tr>" + trs + "</table>" : "") +
      "</div>"
    );
  }

  showSetup();
})();
