// ===========================================================
// ПОНГ · 8БИТ — тач-управление.
// Крупные .ctrl-btn кнопки (DOM-оверлей) + Pointer Events с МУЛЬТИТАЧЕМ:
// оба игрока могут держать кнопки одновременно. Режим hold-to-move.
//
// ДАБЛ-ОРИЕНТАЦИЯ (ключевое). Игроки стоят слева/справа и смотрят друг
// на друга. Блок .controls-right повёрнут в CSS на 180°, поэтому глифы
// ◀/▶ и их порядок визуально зеркалятся для правого игрока.
//
// Маппинг ПРЯМОЙ по data-dir (направление задаётся в index.html):
//   data-dir="up"   -> ракетка вверх  (к screen-top, -Y)
//   data-dir="down" -> ракетка вниз   (к screen-bottom, +Y)
//
// Игроки стоят по бокам и смотрят друг на друга, поэтому «лево/право»
// у них зеркальны, и data-dir для глифов ◀/▶ ПРОТИВОПОЛОЖНЫ:
//  • Левый игрок (смотрит вправо): его «лево» = верх экрана.
//    ◀ -> data-dir="up", ▶ -> data-dir="down".
//  • Правый игрок (смотрит влево, развёрнут на 180°): его «лево» = низ
//    экрана. Глиф ◀ воспринимается им как ◀ (поворот глифа и поворот
//    самого игрока компенсируют друг друга), поэтому ◀ -> data-dir="down",
//    ▶ -> data-dir="up". Так нажатие «влево» у каждого двигает ракетку
//    к его телу-левой стороне.
// ===========================================================

import { Sfx } from "./audio.js";

export function setupControls(opts = {}) {
  const root = opts.container || document;
  const onInput = opts.onInput || (() => {});
  const onFirstGesture = opts.onFirstGesture || (() => {});

  let firstDone = false;
  const buttons = Array.from(root.querySelectorAll(".ctrl-btn"));
  // pointerId -> { btn, player, dir } для корректного мультитача.
  const activePointers = new Map();
  const listeners = [];

  const bind = (el, type, fn, optsArg) => {
    el.addEventListener(type, fn, optsArg);
    listeners.push(() => el.removeEventListener(type, fn, optsArg));
  };

  for (const btn of buttons) {
    const player = parseInt(btn.dataset.player, 10) || 0;
    const dir = btn.dataset.dir === "down" ? "down" : "up";

    const press = (e) => {
      e.preventDefault();
      if (activePointers.has(e.pointerId)) return;
      activePointers.set(e.pointerId, { btn, player, dir });
      try {
        btn.setPointerCapture(e.pointerId);
      } catch (_) {
        /* not critical */
      }
      btn.classList.add("is-active");
      Sfx.tap();
      if (!firstDone) {
        firstDone = true;
        onFirstGesture();
      }
      onInput(player, dir, true);
    };

    const release = (e) => {
      const entry = activePointers.get(e.pointerId);
      if (!entry) return;
      activePointers.delete(e.pointerId);
      entry.btn.classList.remove("is-active");
      onInput(entry.player, entry.dir, false);
    };

    bind(btn, "pointerdown", press);
    bind(btn, "pointerup", release);
    bind(btn, "pointercancel", release);
    bind(btn, "lostpointercapture", release);
    bind(btn, "contextmenu", (e) => e.preventDefault());
  }

  return {
    destroy() {
      for (const off of listeners) off();
      activePointers.clear();
    },
  };
}

export default setupControls;
