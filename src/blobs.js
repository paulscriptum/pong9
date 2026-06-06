// ===========================================================
// Брендовые маскоты 8БИТ: РЕАЛЬНЫЕ ассеты, экспортированные прямо из
// Figma («8БИТ Журнал | Brand»). Монохромные стикеры — перекрашиваем
// (тинт) под фон: белым на чёрном поле, акцентом — по желанию.
//
// Сигнатуры экспортов менять нельзя — на них опирается render.js / main.js:
//   drawSmiley(ctx, x, y, size, t=0)
//   createBlobLaunch(opts={}) -> { update(dt), draw(ctx), done }
//   makeQRCanvas(url, size) -> HTMLCanvasElement | null
// ===========================================================

import BRAND from "./brand.js";
import { drawFace } from "./mascots.js";

// ---------- мелкие хелперы ----------

// Скруглённый прямоугольник (без зависимости от ctx.roundRect).
function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

// ---------- загрузка и тинт реальных ассетов ----------
// Файлы лежат в /assets/mascots/ и экспортированы из Figma как PNG с
// прозрачным фоном (монохром, чёрная заливка на прозрачном).

const SMILEY = "smiley.png";
const BLOBS = [
  "blob-01.png",
  "blob-02.png",
  "blob-03.png",
  "blob-04.png",
  "blob-05.png",
  "blob-06.png",
  "blob-07.png",
];
const ALL_ASSETS = [SMILEY, ...BLOBS];

// Путь резолвим относительно этого модуля (src/blobs.js) — устойчиво к
// тому, из какого корня раздаётся статика (python3 -m http.server и т.п.).
function assetURL(name) {
  try {
    return new URL(`../assets/mascots/${name}`, import.meta.url).href;
  } catch (_) {
    return `assets/mascots/${name}`;
  }
}

const _imgCache = new Map(); // name -> HTMLImageElement
function getImage(name) {
  let img = _imgCache.get(name);
  if (img) return img;
  if (typeof Image === "undefined") return null;
  img = new Image();
  img.decoding = "async";
  img.src = assetURL(name);
  _imgCache.set(name, img);
  return img;
}

function isReady(img) {
  return !!img && img.complete && img.naturalWidth > 0;
}

// Предзагрузка всех маскотов на старте модуля.
(function preload() {
  if (typeof Image === "undefined") return;
  for (const n of ALL_ASSETS) getImage(n);
})();

// Тинт монохромного стикера в заданный цвет через offscreen-canvas:
// рисуем картинку → source-in заливаем целевым цветом. Кэшируем по (имя|цвет).
const _tintCache = new Map();
function getTinted(name, color) {
  const img = getImage(name);
  if (!isReady(img)) return null;
  if (typeof document === "undefined") return null;

  const key = name + "|" + color;
  let cv = _tintCache.get(key);
  if (cv) return cv;

  cv = document.createElement("canvas");
  cv.width = img.naturalWidth;
  cv.height = img.naturalHeight;
  const cx = cv.getContext("2d");
  if (!cx) return null;

  cx.drawImage(img, 0, 0);
  cx.globalCompositeOperation = "source-in";
  cx.fillStyle = color || "#ffffff";
  cx.fillRect(0, 0, cv.width, cv.height);

  _tintCache.set(key, cv);
  return cv;
}

// Размер «вписать» картинку в коробку box×box с сохранением пропорций.
function fitContain(iw, ih, box) {
  if (!(iw > 0) || !(ih > 0)) return { w: box, h: box };
  const s = Math.min(box / iw, box / ih);
  return { w: iw * s, h: ih * s };
}

// =====================================================================
// 1) Смайлик-лого 8БИТ (реальный фирменный смайл из Figma)
// =====================================================================
// Монохромный фирменный смайл (глаза + улыбка «◡» с носом-точкой),
// тинтуем белым для чёрного фона. t (сек) даёт лёгкое «дыхание».
export function drawSmiley(ctx, x, y, size, t = 0, color) {
  if (!ctx || !(size > 0)) return;
  const tint = color || (BRAND && BRAND.colors && BRAND.colors.text) || "#ffffff";
  // «Дыхание»: мягкое пульсирование масштаба + микро-покачивание.
  const breathe = 1 + 0.04 * Math.sin(t * 1.8);
  const r = size * 0.5 * breathe;
  const lw = Math.max(1.5, r * 0.16);
  drawFace(ctx, x, y + Math.sin(t * 1.2) * size * 0.012, r, tint, lw, 1);
}

function drawFallbackFace(ctx, x, y, size, color) {
  const r = size * 0.42;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.06);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.12, r * 0.055, 0, Math.PI * 2);
  ctx.arc(x + r * 0.3, y - r * 0.12, r * 0.055, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y + r * 0.03, r * 0.34, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

export function drawMascot(ctx, name, x, y, size, color, t = 0, opts = {}) {
  if (!ctx || !(size > 0)) return;
  const safeName = ALL_ASSETS.includes(name) ? name : BLOBS[0];
  const tint = color || ((BRAND && BRAND.colors && BRAND.colors.text) || "#ffffff");
  const img = getImage(safeName);
  if (!isReady(img)) {
    drawFallbackFace(ctx, x, y, size, tint);
    return;
  }
  const tinted = getTinted(safeName, tint);
  if (!tinted) return;
  const breathe = opts.still ? 1 : 1 + 0.025 * Math.sin(t * 2 + size * 0.01);
  const { w, h } = fitContain(img.naturalWidth, img.naturalHeight, size * breathe);
  ctx.save();
  ctx.translate(x, y);
  if (opts.rotate) ctx.rotate(opts.rotate);
  ctx.drawImage(tinted, -w / 2, -h / 2, w, h);
  ctx.restore();
}

// Процедурный «взлетающий» маскот (шипастый блоб с лицом), центр в (0,0).
function drawLaunchBlob(ctx, size, color, variant, age) {
  const r = size * 0.5;
  const lw = Math.max(2, r * 0.14);
  const spikes = 11 + (variant % 3) * 2;
  const outer = r;
  const inner = r * 0.66;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (let s = 0; s <= spikes * 2; s++) {
    const a = (s * Math.PI) / spikes;
    const rr = s % 2 ? outer : inner;
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr;
    if (s === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  drawFace(ctx, 0, 0, r * 0.6, color, lw, variant % 2 ? -1 : 1);
  ctx.restore();
}

// =====================================================================
// 2) «Взлетающий» блоб для победного экрана (процедурный маскот)
// =====================================================================
// Контроллер «взлёта»: импульс вверх + лёгкая гравитация (дуга),
// плюс покачивание/вращение/сквош для фана. Рисуем СЛУЧАЙНЫЙ реальный
// маскот из набора, перекрашенный в нужный цвет (по умолчанию белый).
// opts: { x, y, vx, vy, size, color, variant }
export function createBlobLaunch(opts = {}) {
  const o = opts || {};
  const white = (BRAND && BRAND.colors && BRAND.colors.text) || "#ffffff";

  const size = o.size > 0 ? o.size : 72;
  const GRAVITY = 240; // px/с² — мягкая, чтобы блоб всё же ушёл за верх

  // Какой именно маскот-вариант (влияет на форму/настроение).
  const variant = Number.isInteger(o.variant) ? o.variant : (Math.random() * 4) | 0;

  const state = {
    x: o.x ?? 0,
    y: o.y ?? 0,
    vx: o.vx ?? (Math.random() * 2 - 1) * 70,
    vy: o.vy ?? -(640 + Math.random() * 180), // импульс вверх
    size,
    variant,
    color: o.color || white,
    rot: 0,
    rotSpeed: (Math.random() * 2 - 1) * 2.2,
    age: 0,
    wobbleAmp: size * 0.14,
    wobbleFreq: 5.5 + Math.random() * 3,
    squash: 0,
  };

  const controller = {
    done: false,
    update(dt) {
      if (controller.done) return;
      // Защита от скачков при больших dt (фоновая вкладка и т.п.).
      const step = clamp(dt || 0, 0, 0.05);
      state.age += step;
      state.vy += GRAVITY * step;
      state.x += state.vx * step;
      state.y += state.vy * step;
      state.rot += state.rotSpeed * step;

      // Сквош/стретч: тянется вертикально на быстром лёте вверх.
      const target = clamp(-state.vy / 1400, -0.35, 0.55);
      state.squash += (target - state.squash) * Math.min(1, step * 8);

      // Готово, когда блоб полностью ушёл за верх экрана (y=0 — верх),
      // либо как страховка — по таймауту.
      if (state.y + state.size * 0.6 < 0 || state.age > 7) {
        controller.done = true;
      }
    },
    draw(ctx) {
      if (!ctx) return;
      const wobbleX = Math.sin(state.age * state.wobbleFreq) * state.wobbleAmp;
      ctx.save();
      ctx.translate(state.x + wobbleX, state.y);
      ctx.rotate(state.rot + Math.sin(state.age * 3) * 0.08);
      const sx = 1 - state.squash * 0.32;
      const sy = 1 + state.squash * 0.42;
      ctx.scale(sx, sy);
      drawLaunchBlob(ctx, state.size, state.color, state.variant, state.age);
      ctx.restore();
    },
  };

  return controller;
}

// =====================================================================
// 3) Офлайн-генерация QR
// =====================================================================
// Ленивая загрузка вендоренного генератора (Kazuhiko Arase, qrcode-generator).
// Пока модуль не подгрузился, makeQRCanvas возвращает null — вызывающий повторит.
let _qrcode = null;
let _qrLoadStarted = false;
let _qrFailed = false;

function ensureQrLoaded() {
  if (_qrcode || _qrLoadStarted) return;
  _qrLoadStarted = true;
  import("../vendor/qrcode.min.js")
    .then((m) => {
      _qrcode = m.default || m.qrcode || null;
      if (!_qrcode) _qrFailed = true;
    })
    .catch(() => {
      _qrFailed = true;
      // Разрешаем повторную попытку загрузки позже.
      _qrLoadStarted = false;
    });
}

// Вернуть offscreen <canvas> с QR для url размером size px на белой
// скруглённой «карточке» (чтобы хорошо сканировался). null — если lib не готова.
export function makeQRCanvas(url, size) {
  if (typeof document === "undefined") return null;
  const px = Math.max(64, Math.round(size || 256));

  if (!_qrcode) {
    ensureQrLoaded();
    return null;
  }

  let qr;
  try {
    qr = _qrcode(0, "M"); // тип 0 — авто-подбор версии под длину данных
    qr.addData(String(url == null ? "" : url));
    qr.make();
  } catch (e) {
    // Очень длинные данные могут не влезть — пробуем максимальную версию.
    try {
      qr = _qrcode(40, "L");
      qr.addData(String(url == null ? "" : url));
      qr.make();
    } catch (e2) {
      return null;
    }
  }

  const count = qr.getModuleCount();
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Белая скруглённая карточка-фон.
  ctx.fillStyle = "#ffffff";
  roundRectPath(ctx, 0, 0, px, px, px * 0.08);
  ctx.fill();

  // Тихая зона (quiet zone) + целочисленный размер модуля для чёткости.
  const margin = Math.round(px * 0.04);
  const avail = px - margin * 2;
  const cell = Math.max(1, Math.floor(avail / count));
  const qrPx = cell * count;
  const offset = Math.round((px - qrPx) / 2);

  ctx.fillStyle = "#000000";
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        ctx.fillRect(offset + c * cell, offset + r * cell, cell, cell);
      }
    }
  }

  return canvas;
}

export default { drawSmiley, createBlobLaunch, makeQRCanvas };
