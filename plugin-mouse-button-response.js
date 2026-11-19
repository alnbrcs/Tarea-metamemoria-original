/**
 * jsPsych plugin: mouse-button-response
 *
 * Shows an image and waits for a mouse button press anywhere on the screen,
 * reproducing the E-Prime "Mouse" input of the original task:
 *   left button  -> response 1 (left option)
 *   right button -> response 2 (right option)
 *
 * The response is taken on button press (mousedown), as in E-Prime.
 * The browser context menu is blocked while the trial is running.
 */
var jsPsychMouseButtonResponse = (function (jspsych) {
  "use strict";

  const info = {
    name: "mouse-button-response",
    version: "1.0.0",
    parameters: {
      /** Path to the image. */
      stimulus: { type: jspsych.ParameterType.IMAGE, default: undefined },
      /** true: stretch the image to fill the screen (like E-Prime Stretch = Yes). false: keep proportions. */
      stretch: { type: jspsych.ParameterType.BOOL, default: true },
      /** Maximum time to respond, in ms (null = no limit). */
      trial_duration: { type: jspsych.ParameterType.INT, default: null },
      /** Accepted buttons (MouseEvent.button): 0 = left, 2 = right. */
      buttons: { type: jspsych.ParameterType.INT, array: true, default: [0, 2] },
    },
    data: {
      stimulus: { type: jspsych.ParameterType.STRING },
      /** MouseEvent.button pressed (0 left, 2 right), null if no response. */
      button: { type: jspsych.ParameterType.INT },
      /** E-Prime coding: 1 = left, 2 = right, null if no response. */
      response: { type: jspsych.ParameterType.INT },
      /** Response time in ms from image onset, null if no response. */
      rt: { type: jspsych.ParameterType.FLOAT },
    },
  };

  class MouseButtonResponsePlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {
      const cls = trial.stretch ? "mm-full" : "mm-fit";
      display_element.innerHTML =
        '<img class="' + cls + '" src="' + trial.stimulus + '" draggable="false" alt="">';

      let done = false;
      const start = performance.now();

      const onContextMenu = (e) => e.preventDefault();

      const onMouseDown = (e) => {
        if (done) return;
        if (!trial.buttons.includes(e.button)) return;
        e.preventDefault();
        end(e.button, performance.now() - start);
      };

      const cleanup = () => {
        document.removeEventListener("mousedown", onMouseDown, true);
        // On Windows the context menu opens on button RELEASE: keep blocking it
        // until the button has been released.
        const release = () => {
          document.removeEventListener("mouseup", release, true);
          setTimeout(() => document.removeEventListener("contextmenu", onContextMenu, true), 300);
        };
        document.addEventListener("mouseup", release, true);
      };

      const end = (button, rt) => {
        if (done) return;
        done = true;
        cleanup();
        MouseButtonResponsePlugin.activeCleanup = null;
        display_element.innerHTML = "";
        this.jsPsych.finishTrial({
          stimulus: trial.stimulus,
          button: button,
          response: button === 0 ? 1 : button === 2 ? 2 : null,
          rt: rt === null ? null : Math.round(rt * 10) / 10,
        });
      };

      document.addEventListener("mousedown", onMouseDown, true);
      document.addEventListener("contextmenu", onContextMenu, true);
      // Lets the experiment remove the listeners if the session is interrupted.
      MouseButtonResponsePlugin.activeCleanup = () => {
        done = true;
        cleanup();
      };

      if (trial.trial_duration !== null) {
        this.jsPsych.pluginAPI.setTimeout(() => end(null, null), trial.trial_duration);
      }
    }
  }

  MouseButtonResponsePlugin.info = info;
  MouseButtonResponsePlugin.activeCleanup = null;
  return MouseButtonResponsePlugin;
})(jsPsychModule);
