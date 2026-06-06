// ===========================================================
// ИНТЕРФЕЙС (контракт). Полную реализацию делает AUDIO-воркер.
// Сигнатуры менять нельзя — на них опирается main.js / controls.js.
//
// 8-bit SFX на WebAudio (синтез square/triangle, без файлов).
//  - init():        создать AudioContext (лениво)
//  - unlock():      возобновить контекст по первому жесту пользователя
//  - bounceWall():  отскок мяча от верх/низ стенки
//  - bouncePaddle():удар мячом по ракетке
//  - score():       гол / очко
//  - win():         победный джингл
//  - tap():         тап по тач-кнопке
// ===========================================================

// Единый общий AudioContext + мастер-гейн. Создаются лениво в init().
let ctx = null;
let master = null;

// Достаём конструктор AudioContext с учётом старого webkit-префикса.
function getAudioContextCtor() {
  if (typeof window === "undefined") return null;
  return window.AudioContext || window.webkitAudioContext || null;
}

// Текущее «сейчас» аудио-движка (с запасом, чтобы старты не наезжали друг на друга).
function now() {
  return ctx ? ctx.currentTime : 0;
}

// Один тон: осциллятор -> собственный gain (короткая огибающа) -> master.
// freq — частота в Гц, может быть массивом [from, to] для глайда (slide).
function tone({
  type = "square",
  freq = 440,
  start = 0,
  duration = 0.1,
  gain = 0.3,
  attack = 0.005,
  release = 0.04,
} = {}) {
  if (!ctx || !master) return;

  const t0 = now() + start;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = type;

  // Частота: либо фиксированная, либо линейный глайд [from, to].
  if (Array.isArray(freq)) {
    osc.frequency.setValueAtTime(freq[0], t0);
    osc.frequency.linearRampToValueAtTime(freq[1], t0 + duration);
  } else {
    osc.frequency.setValueAtTime(freq, t0);
  }

  // Короткая AR-огибающая, чтобы избежать щелчков и накопления громкости.
  const peak = Math.max(0.0001, gain);
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  env.gain.setValueAtTime(peak, t0 + Math.max(attack, duration - release));
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(env);
  env.connect(master);

  osc.start(t0);
  osc.stop(t0 + duration + 0.02);

  // Подчищаем граф после остановки.
  osc.onended = () => {
    try {
      osc.disconnect();
      env.disconnect();
    } catch (_) {
      /* no-op */
    }
  };
}

export const Sfx = {
  // Лениво создаём единственный AudioContext + master gain. Безопасно при повторных вызовах.
  init() {
    if (ctx) return;
    const Ctor = getAudioContextCtor();
    if (!Ctor) return; // окружение без WebAudio — тихий no-op

    try {
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = 0.25; // скромная общая громкость
      master.connect(ctx.destination);
    } catch (_) {
      ctx = null;
      master = null;
    }
  },

  // Возобновляем контекст по первому жесту пользователя (политика автоплея).
  // Безопасно вызывать многократно.
  unlock() {
    if (!ctx) this.init();
    if (ctx && ctx.state === "suspended" && typeof ctx.resume === "function") {
      try {
        ctx.resume();
      } catch (_) {
        /* no-op */
      }
    }
  },

  // Короткий высокий блип — мяч отскочил от верх/низ стенки.
  bounceWall() {
    this.init();
    if (!ctx) return;
    tone({ type: "square", freq: 880, duration: 0.06, gain: 0.28 });
  },

  // Более «толстый» и чуть ниже блип — удар по ракетке.
  bouncePaddle() {
    this.init();
    if (!ctx) return;
    tone({ type: "square", freq: 440, duration: 0.08, gain: 0.3 });
    tone({ type: "triangle", freq: 220, duration: 0.09, gain: 0.22 });
  },

  // Нисходящий «buzzy» звук проигранного очка.
  score() {
    this.init();
    if (!ctx) return;
    tone({ type: "square", freq: [440, 110], duration: 0.35, gain: 0.28 });
    tone({ type: "triangle", freq: [220, 70], duration: 0.35, gain: 0.18 });
  },

  // Короткий бодрый победный джингл — арпеджио из square-нот (C-E-G-C).
  win() {
    this.init();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const step = 0.1;
    notes.forEach((f, i) => {
      tone({
        type: "square",
        freq: f,
        start: i * step,
        duration: 0.12,
        gain: 0.26,
      });
    });
  },

  // Крошечный клик по тач-кнопке.
  tap() {
    this.init();
    if (!ctx) return;
    tone({
      type: "square",
      freq: 1200,
      duration: 0.03,
      gain: 0.2,
      attack: 0.002,
      release: 0.015,
    });
  },
};

export default Sfx;
