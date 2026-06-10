// ===========================================================
// ПОНГ · 8БИТ — bootstrap, game loop и конечный автомат экранов.
// Дизайн в стиле брендбука: светлый фон, фиолетовый акцент.
// ===========================================================

import BRAND from "./brand.js";
import { Sfx } from "./audio.js";
import { makeQRCanvas } from "./blobs.js";
import { PongGame } from "./game.js";
import { Renderer } from "./render.js";
import { setupControls } from "./controls.js";
import { drawBug } from "./mascots.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const game = new PongGame(BRAND.game);
const renderer = new Renderer(ctx);

// PNG гусеницы для standby экрана
const standbyCaterpillarImg = new Image();
standbyCaterpillarImg.crossOrigin = "anonymous";
standbyCaterpillarImg.src = "/images/standby_caterpillar.png";

let W = 0;
let H = 0;
let dpr = 1;

const STATE = {
  ATTRACT: "attract",
  COUNTDOWN: "countdown",
  PLAYING: "playing",
  POINT: "point",
  GAMEOVER: "gameover",
};

let state = STATE.ATTRACT;
let stateTime = 0;
let winner = -1;
let qrCanvas = null;
let elapsed = 0;

const POINT_PAUSE = 1.1;

function syncControlsLayout() {
  const layout = renderer.getLayout();
  const c = layout.controls;
  const root = document.documentElement;
  root.style.setProperty("--control-top", `${c.y}px`);
  root.style.setProperty("--control-left-x", `${c.leftX}px`);
  root.style.setProperty("--control-right-x", `${c.rightX}px`);
  root.style.setProperty("--control-gap", `${c.gap}px`);
  root.style.setProperty("--control-size", `${c.size}px`);
  root.style.setProperty("--label-top", `${c.labelY}px`);
}

function resize() {
  dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  renderer.setSize(W, H);
  const field = renderer.getFieldRect();
  game.resize(field.w, field.h);
  syncControlsLayout();
}

function setState(s) {
  state = s;
  stateTime = 0;
  window._debugState = s;
}

function startMatch() {
  // Показываем кнопки при начале игры
  document.getElementById("controls").style.display = "";
  game.resetMatch();
  renderer.clearParticles();
  game.reset(Math.random() < 0.5 ? -1 : 1);
  setState(STATE.COUNTDOWN);
}

function goAttract() {
  qrCanvas = null;
  game.clearInput();
  game.resetMatch();
  renderer.clearParticles();
  renderer.clearMascots();
  // Скрываем кнопки в standby режиме
  document.getElementById("controls").style.display = "none";
  setState(STATE.ATTRACT);
}

function goGameOver() {
  winner = game.winner;
  game.clearInput();
  qrCanvas = null;
  Sfx.win();
  setState(STATE.GAMEOVER);
}

function serveAfterPoint() {
  const dir = game.lastScorer === 0 ? +1 : -1;
  game.reset(dir);
  setState(STATE.COUNTDOWN);
}

let fullscreenTried = false;
function tryFullscreen() {
  if (fullscreenTried) return;
  fullscreenTried = true;
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (req && !document.fullscreenElement) {
    try {
      const p = req.call(el);
      if (p && p.catch) p.catch(() => {});
    } catch (_) {}
  }
}

function hitRect(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function handleBottomButtonClick(x, y) {
  if (state === STATE.ATTRACT) return false;

  const rects = renderer.getBottomButtonRects();
  if (!rects) return false;

  // Сначала «Режим сна» — у правой кнопки раньше была широкая прозрачная зона.
  if (hitRect(rects.sleep, x, y)) {
    Sfx.unlock();
    goAttract();
    return true;
  }
  if (hitRect(rects.restart, x, y)) {
    Sfx.unlock();
    startMatch();
    return true;
  }
  return false;
}

function pointerToCanvasCoords(e) {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: e.clientX - bounds.left,
    y: e.clientY - bounds.top,
    inside:
      e.clientX >= bounds.left &&
      e.clientX <= bounds.right &&
      e.clientY >= bounds.top &&
      e.clientY <= bounds.bottom,
  };
}

function onCanvasPointerDown(e) {
  const { x, y, inside } = pointerToCanvasCoords(e);
  if (!inside) return false;
  if (handleBottomButtonClick(x, y)) {
    e.preventDefault();
    e.stopPropagation();
    return true;
  }
  return false;
}

function onUserTap() {
  Sfx.unlock();
  tryFullscreen();
  if (state === STATE.ATTRACT) {
    startMatch();
    return true;
  }
  if (state === STATE.GAMEOVER) {
    goAttract();
    return true;
  }
  return false;
}
window.onUserTap = onUserTap;

// Текстовые помощники
function drawText(text, x, y, size, color, font = BRAND.fonts.brand) {
  ctx.font = `500 ${size}px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function update(dt) {
  renderer.updateParticles(dt);
  renderer.updateMascots(dt);

  switch (state) {
    case STATE.ATTRACT:
      break;

    case STATE.COUNTDOWN:
      if (stateTime >= BRAND.game.countdownSeconds) setState(STATE.PLAYING);
      break;

    case STATE.PLAYING: {
      const events = game.update(dt);
      let scored = false;
      for (const e of events) {
        if (e.type === "paddle") {
          renderer.burst(e.x, e.y, 12, BRAND.palette);
          // Показываем маскота при отбивании (30% шанс)
          if (Math.random() < 0.3) {
            renderer.showMascot(e.x, e.y, false);
          }
        } else if (e.type === "wall") {
          renderer.burst(e.x, e.y, 6, [BRAND.colors.ink]);
        } else if (e.type === "score") {
          scored = true;
          // Показываем маскота при голе (всегда)
          const field = renderer.getFieldRect();
          renderer.showMascot(field.w / 2, field.h * 0.72, true);
        }
      }
      if (game.over) {
        goGameOver();
      } else if (scored) {
        setState(STATE.POINT);
      }
      break;
    }

    case STATE.POINT:
      if (stateTime >= POINT_PAUSE) serveAfterPoint();
      break;

    case STATE.GAMEOVER:
      if (stateTime >= BRAND.game.gameOverSeconds) goAttract();
      break;
  }
}

function draw() {
  switch (state) {
    case STATE.ATTRACT:
      drawAttract();
      break;
    case STATE.COUNTDOWN:
      drawCountdown();
      break;
    case STATE.PLAYING:
      drawPlay();
      break;
    case STATE.POINT:
      drawPoint();
      break;
    case STATE.GAMEOVER:
      drawGameOver();
      break;
  }
}

function drawAttract() {
  const min = Math.min(W, H);

  // Фиолетовый фон на ВЕСЬ экран (fullscreen standby)
  ctx.save();
  ctx.fillStyle = BRAND.colors.accent;
  ctx.fillRect(0, 0, W, H);

  // Текст "НАЖМИТЕ, ЧТОБЫ ИГРАТЬ" по центру (пульсирующий)
  ctx.globalAlpha = 0.85 + 0.15 * Math.sin(elapsed * 2.5);
  ctx.font = `700 ${min * 0.05}px ${BRAND.fonts.brand}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = BRAND.colors.ink;
  ctx.fillText("НАЖМИТЕ, ЧТОБЫ ИГРАТЬ", W / 2, H * 0.4);
  ctx.globalAlpha = 1;

  // Анимированная PNG гусеница внизу экрана — плавно ползёт справа налево.
  if (standbyCaterpillarImg.complete && standbyCaterpillarImg.naturalWidth > 0) {
    const catH = min * 0.08;
    const aspectRatio = standbyCaterpillarImg.naturalWidth / standbyCaterpillarImg.naturalHeight;
    const catW = catH * aspectRatio;

    const crawl = elapsed * 2.4;
    const speed = 72; // px/s — ровное движение без рывков
    const totalPath = W + catW * 3;
    const rawX = ((elapsed * speed) % totalPath + totalPath) % totalPath;
    const catX = W + catW - rawX;
    const baseY = H * 0.72;

    // Мягкая волна по полу, без подскоков и поворотов всего спрайта.
    const waveY = Math.sin(crawl) * catH * 0.035;
    // Лёгкое «дыхание» тела inchworm — якорь внизу, не прыжок палкой.
    const breathe = Math.max(0, Math.sin(crawl));
    const scaleX = 1 - 0.07 * breathe;
    const scaleY = 1 + 0.05 * breathe;

    ctx.save();
    const cx = catX - catW / 2;
    const cy = baseY + catH;
    ctx.translate(cx, cy + waveY);
    ctx.scale(scaleX, scaleY);
    ctx.drawImage(standbyCaterpillarImg, -catW / 2, -catH, catW, catH);
    ctx.restore();
  }

  ctx.restore();
}

function drawCountdown() {
  renderer.drawPlayfield(game.getState(), elapsed);
  renderer.drawScores(game.scores);

  const min = Math.min(W, H);
  const field = renderer.getFieldRect();
  const left = Math.max(0, BRAND.game.countdownSeconds - stateTime);
  const n = Math.max(1, Math.ceil(left));

  ctx.save();
  ctx.globalAlpha = 0.95;
  drawText(String(n), W / 2, field.y + field.h * 0.5, min * 0.14, BRAND.colors.ink);
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawPlay() {
  renderer.drawPlayfield(game.getState(), elapsed);
  renderer.drawScores(game.scores);
  renderer.drawParticles();
  renderer.drawMascots();
}

function drawPoint() {
  renderer.drawPlayfield(game.getState(), elapsed);
  renderer.drawScores(game.scores);
  renderer.drawParticles();
  renderer.drawMascots();

  const t = stateTime / POINT_PAUSE;
  const a = Math.max(0, 1 - t);
  const min = Math.min(W, H);
  const field = renderer.getFieldRect();

  ctx.globalAlpha = a;
  drawText("ГОЛ!", W / 2, field.y + field.h * 0.5, min * 0.1, BRAND.colors.ink, BRAND.fonts.brand);
  ctx.globalAlpha = 1;
}

function drawGameOver() {
  const min = Math.min(W, H);
  renderer.drawChrome(elapsed);
  const field = renderer.getFieldRect();

  ctx.save();

  // Черный фон поля
  ctx.fillStyle = BRAND.colors.field;
  ctx.beginPath();
  ctx.roundRect(field.x, field.y, field.w, field.h, field.r);
  ctx.fill();

  // Фиолетовая рамка
  ctx.strokeStyle = BRAND.colors.accent;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Победный текст — ровный вертикальный ритм
  drawText("ПОБЕДА!", W / 2, field.y + field.h * 0.14, min * 0.07, BRAND.colors.ink, BRAND.fonts.brand);
  drawText(
    `Игрок ${Math.max(0, winner) + 1}`,
    W / 2,
    field.y + field.h * 0.26,
    min * 0.035,
    BRAND.colors.ink,
    BRAND.fonts.ui
  );
  drawText(
    `${game.scores[0]} : ${game.scores[1]}`,
    W / 2,
    field.y + field.h * 0.37,
    min * 0.04,
    BRAND.colors.ink
  );

  // CTA: «Читайте журнал в телеграме» + жучок в конце.
  // Автоподбор размера, чтобы строка с жучком всегда помещалась в поле.
  const ctaY = field.y + field.h * 0.46;
  const ctaText = "Читайте журнал в телеграме";
  const ctaMaxW = field.w * 0.86;
  let ctaSize = min * 0.028;
  let textW, bugSize, bugGap, ctaTotalW;
  for (let guard = 0; guard < 12; guard++) {
    ctx.font = `500 ${ctaSize}px ${BRAND.fonts.brand}`;
    textW = ctx.measureText(ctaText).width;
    bugSize = ctaSize * 0.95;
    bugGap = bugSize * 0.6;
    ctaTotalW = textW + bugGap + bugSize;
    if (ctaTotalW <= ctaMaxW) break;
    ctaSize *= 0.92;
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = BRAND.colors.ink;

  const ctaX = W / 2 - ctaTotalW / 2;
  ctx.fillText(ctaText, ctaX, ctaY);
  drawBug(ctx, ctaX + textW + bugGap + bugSize * 0.5, ctaY, bugSize, BRAND.colors.ink);

  // QR код — центрирован в нижней половине поля, с подписью под ним
  const qrSize = min * 0.2;
  const qrCenterY = field.y + field.h * 0.71;
  drawQR(W / 2, qrCenterY, qrSize);

  drawText(
    BRAND.ctaSub,
    W / 2,
    qrCenterY + qrSize / 2 + min * 0.028,
    min * 0.02,
    BRAND.colors.ink,
    BRAND.fonts.ui
  );

  ctx.restore();
}

function drawQR(cx, cy, size) {
  if (!qrCanvas) qrCanvas = makeQRCanvas(BRAND.url, Math.round(size));
  if (qrCanvas) {
    ctx.drawImage(qrCanvas, cx - size / 2, cy - size / 2, size, size);
  } else {
    // Плейсхолдер
    ctx.fillStyle = BRAND.colors.ink;
    ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
    ctx.fillStyle = BRAND.colors.field;
    ctx.fillRect(cx - size / 2 + 4, cy - size / 2 + 4, size - 8, size - 8);
  }
}

let lastTs = 0;
function frame(ts) {
  if (!lastTs) lastTs = ts;
  let dt = (ts - lastTs) / 1000;
  lastTs = ts;
  if (dt > 0.05) dt = 0.05;
  elapsed += dt;
  stateTime += dt;

  update(dt);
  draw();

  requestAnimationFrame(frame);
}

function setupKiosk() {
  window.addEventListener("contextmenu", (e) => e.preventDefault());
  window.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
  window.addEventListener("gesturestart", (e) => e.preventDefault());
  window.addEventListener("gesturechange", (e) => e.preventDefault());
  window.addEventListener("gestureend", (e) => e.preventDefault());
  window.addEventListener("dblclick", (e) => e.preventDefault());
  window.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    },
    { passive: false }
  );
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && ["+", "-", "=", "0"].includes(e.key)) {
      e.preventDefault();
    }
  });
}

function init() {
  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);
  
  // Инициализируем state
  setState(STATE.ATTRACT);

  setupKiosk();

  setupControls({
    onFirstGesture: () => Sfx.unlock(),
    onInput: (player, dir, isDown) => {
      game.setInput(player, dir, isDown);
    },
  });

  canvas.addEventListener("pointerdown", (e) => {
    if (onCanvasPointerDown(e)) return;
    e.preventDefault();
    onUserTap();
  });

  // Нижние кнопки — ловим в capture, чтобы клик не уходил в другие обработчики.
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (onCanvasPointerDown(e)) return;
      if (state === STATE.ATTRACT) onUserTap();
    },
    true
  );
  
  // Дополнительные события для совместимости (только standby).
  document.addEventListener("mousedown", (e) => {
    if (state !== STATE.ATTRACT) return;
    onUserTap();
  });
  document.addEventListener("touchstart", (e) => {
    if (state !== STATE.ATTRACT) return;
    onUserTap();
  });

  requestAnimationFrame(frame);
}

init();
