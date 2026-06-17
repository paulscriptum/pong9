// ===========================================================
// ПОНГ · 8БИТ — bootstrap, game loop и конечный автомат экранов.
// ===========================================================

import BRAND from "./brand.js";
import { Sfx } from "./audio.js";
import { makeQRCanvas } from "./blobs.js";
import { PongGame } from "./game.js";
import { Renderer } from "./render.js";
import { setupControls } from "./controls.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const game = new PongGame(BRAND.game);
const renderer = new Renderer(ctx);

const standbyLayer = document.getElementById("standby-layer");
const standbyWormVideo = document.getElementById("standby-worm");

let standbyWormReady = false;

function onStandbyWormReady() {
  if (!standbyWormVideo || standbyWormVideo.videoWidth <= 0) return;
  standbyWormReady = true;
  syncStandbyWormPlayback();
}

if (standbyWormVideo) {
  standbyWormVideo.addEventListener("loadedmetadata", onStandbyWormReady);
  standbyWormVideo.addEventListener("canplay", onStandbyWormReady);
  standbyWormVideo.addEventListener("error", () => {
    standbyWormReady = false;
  });
}

function syncStandbyLayer() {
  if (standbyLayer) standbyLayer.hidden = state !== STATE.ATTRACT;
}

function syncStandbyWormPlayback() {
  if (!standbyWormVideo) return;
  if (state !== STATE.ATTRACT || !standbyWormReady) {
    if (!standbyWormVideo.paused) standbyWormVideo.pause();
    return;
  }
  if (standbyWormVideo.paused) {
    standbyWormVideo.play().catch(() => {});
  }
}

// Speech bubble на экране сна: левые угла по очереди, 3 с показ + 8 с пауза.
const STANDBY_BUBBLE_CORNERS = {
  showSeconds: 3,
  pauseSeconds: 8,
  startDelay: 2,
  appearSeconds: 0.35,
};
window._standbyBubbleCorners = STANDBY_BUBBLE_CORNERS;

function getStandbyBubbleState() {
  const { showSeconds, pauseSeconds, startDelay, appearSeconds } = STANDBY_BUBBLE_CORNERS;
  const t = elapsed - startDelay;
  if (t < 0) return null;

  const cycleDuration = showSeconds + pauseSeconds;
  const cycle = Math.floor(t / cycleDuration);

  const phaseT = t - cycle * cycleDuration;
  if (phaseT >= showSeconds) return null;

  const appear = Math.min(1, phaseT / appearSeconds);
  return {
    corner: cycle % 2,
    alpha: appear,
    scale: 0.88 + 0.12 * appear,
  };
}

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
  root.style.setProperty("--control-size", `${c.size}px`);
  root.style.setProperty("--ctl-l-up-x", `${c.leftUp.x}px`);
  root.style.setProperty("--ctl-l-up-y", `${c.leftUp.y}px`);
  root.style.setProperty("--ctl-l-down-x", `${c.leftDown.x}px`);
  root.style.setProperty("--ctl-l-down-y", `${c.leftDown.y}px`);
  root.style.setProperty("--ctl-r-up-x", `${c.rightUp.x}px`);
  root.style.setProperty("--ctl-r-up-y", `${c.rightUp.y}px`);
  root.style.setProperty("--ctl-r-down-x", `${c.rightDown.x}px`);
  root.style.setProperty("--ctl-r-down-y", `${c.rightDown.y}px`);
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
  syncStandbyLayer();
  if (s === STATE.ATTRACT && standbyWormVideo) {
    standbyWormVideo.currentTime = 0;
  }
  syncStandbyWormPlayback();
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
  document.getElementById("controls").style.display = "none";
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
  // Пилюли есть только на игровых экранах (на standby и финальном их нет).
  if (state === STATE.ATTRACT || state === STATE.GAMEOVER) return false;

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

// Отладочный хук: показать финальный экран без игры (для проверки вёрстки).
window._debugGameOver = (w = 0, s0 = 5, s1 = 3) => {
  game.scores[0] = s0;
  game.scores[1] = s1;
  winner = w;
  qrCanvas = null;
  document.getElementById("controls").style.display = "none";
  setState(STATE.GAMEOVER);
};

// Текстовые помощники
function drawText(text, x, y, size, color, font = BRAND.fonts.brand, weight = 500) {
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function update(dt) {
  renderer.updateParticles(dt);
  renderer.updateMascots(dt);
  renderer.updatePromo(dt);

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
          renderer.burst(e.x, e.y, 6, BRAND.palette);
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

const STANDBY = {
  bg: "#6B5CE7",
  ink: "#ffffff",
};

function drawAttract() {
  const min = Math.min(W, H);

  ctx.clearRect(0, 0, W, H);
  syncStandbyLayer();
  syncStandbyWormPlayback();

  // Текст "НАЖМИТЕ, ЧТОБЫ ИГРАТЬ" по центру (пульсирующий)
  ctx.save();
  ctx.globalAlpha = 0.85 + 0.15 * Math.sin(elapsed * 2.5);
  ctx.font = `700 ${min * 0.05}px ${BRAND.fonts.brand}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = STANDBY.ink;
  ctx.fillText("НАЖМИТЕ, ЧТОБЫ ИГРАТЬ", W / 2, H * 0.4);
  ctx.globalAlpha = 1;

  if (standbyWormReady) {
    const bubble = getStandbyBubbleState();
    if (bubble) {
      renderer.drawStandbyBubbleCorner(BRAND.standbyPhrase, bubble.corner, {
        alpha: bubble.alpha,
        scale: bubble.scale,
      });
    }
  }

  ctx.restore();
}

function drawCountdown() {
  // Прячем мяч — он стоит в центре и наслаивался бы на цифру отсчёта.
  renderer.drawPlayfield(game.getState(), elapsed, { hideBall: true });
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

// Финальный экран: победа белым на чёрном, QR — в отдельной «кляксе».
const BURST_APPEAR = 0.45;
function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function drawVictoryText(cx, cy, min, appear = 1) {
  const playerN = Math.max(0, winner) + 1;
  const victorySize = min * 0.052;
  const playerSize = min * 0.026;
  const scoreSize = min * 0.04;
  const gap = min * 0.016;
  const blockH = victorySize + playerSize + scoreSize + gap * 2;

  ctx.save();
  const scale = easeOutBack(Math.min(1, appear));
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);

  let y = cy - blockH / 2;
  y += victorySize / 2;
  drawText("ПОБЕДА!", cx, y, victorySize, BRAND.colors.text, BRAND.fonts.brand, 700);
  y += victorySize / 2 + gap + playerSize / 2;
  drawText(`Игрок ${playerN}`, cx, y, playerSize, BRAND.colors.text, BRAND.fonts.ui, 400);
  y += playerSize / 2 + gap + scoreSize / 2;
  drawText(`${game.scores[0]} - ${game.scores[1]}`, cx, y, scoreSize, BRAND.colors.text, BRAND.fonts.brand, 700);
  ctx.restore();
}

function drawGameOverQrContent(burst, min) {
  const headlineSize = min * 0.014;
  const maxW = burst.w * 0.78;
  const lines = wrapTextLines(BRAND.gameOverQrHeadline, headlineSize, BRAND.fonts.ui, maxW, 700);
  const lineH = headlineSize * 1.2;
  const headlineBlockH = lines.length * lineH;
  const qrSize = min * 0.1;
  const subSize = min * 0.017;
  const contentH = headlineBlockH + qrSize + subSize + min * 0.022;
  let y = burst.cy - contentH / 2;

  for (const line of lines) {
    drawText(line, burst.cx, y + lineH / 2, headlineSize, BRAND.colors.ink, BRAND.fonts.ui, 700);
    y += lineH;
  }
  y += min * 0.012;
  drawQR(burst.cx, y + qrSize / 2, qrSize);
  y += qrSize + min * 0.01;
  drawText(BRAND.ctaSub, burst.cx, y + subSize / 2, subSize, BRAND.colors.ink, BRAND.fonts.brand, 700);
}

function drawTextBlock(lines, cx, cy, size, font, weight = 500, lineHeight = 1.3) {
  const lh = size * lineHeight;
  const totalH = lines.length * lh;
  let y = cy - totalH / 2 + lh / 2;
  for (const line of lines) {
    drawText(line, cx, y, size, BRAND.colors.ink, font, weight);
    y += lh;
  }
}

function wrapTextLines(text, size, font, maxW, weight = 500) {
  ctx.font = `${weight} ${size}px ${font}`;
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [];
  let line = words[0];
  for (let i = 1; i < words.length; i++) {
    const test = `${line} ${words[i]}`;
    if (ctx.measureText(test).width <= maxW) line = test;
    else {
      lines.push(line);
      line = words[i];
    }
  }
  lines.push(line);
  return lines;
}

function drawGameOver() {
  const min = Math.min(W, H);
  const appear = Math.min(1, stateTime / BURST_APPEAR);
  const qrAppear = Math.min(1, Math.max(0, stateTime - 0.12) / BURST_APPEAR);

  ctx.save();
  renderer.drawFinalBase();
  renderer.drawFinalLogo();

  drawVictoryText(W / 2, H * 0.32, min, appear);

  const burst = renderer.drawFinalQrBlob(easeOutBack(qrAppear));
  drawGameOverQrContent(burst, min);

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
