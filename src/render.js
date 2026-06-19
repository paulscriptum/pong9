// ===========================================================
// ПОНГ · 8БИТ — отрисовка в стиле брендбука.
// Используем PNG изображения для ракеток и мяча.
// ===========================================================

import BRAND from "./brand.js";
import { drawPixelNumber } from "./mascots.js";

function loadImage(src) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  return img;
}

// Игровые объекты (ассеты из макета)
const paddleLeftImg = loadImage("/images/ui/paddle_left.png");
const paddleRightImg = loadImage("/images/ui/paddle_right.png");
const ballImg = loadImage("/images/ui/ball_apple.png");

// UI редизайна
const fieldFrameImg = loadImage("/images/ui/field_frame.png?v=6");

function fieldFrameInsets() {
  // Внутренние отступы белой зоны в ассете 4526×2906.
  return { insetX: 17 / 4526, insetY: 32 / 2906 };
}

function fieldFrameDrawRect(field) {
  const { insetX, insetY } = fieldFrameInsets();
  const w = field.w / (1 - 2 * insetX);
  const h = field.h / (1 - 2 * insetY);
  return {
    x: field.x - w * insetX,
    y: field.y - h * insetY,
    w,
    h,
  };
}
const bgWinImg = loadImage("/images/ui/bg_win.png");
const starburstImg = loadImage("/images/ui/starburst.png");
const logoBitImg = loadImage("/images/ui/logo_bit.png");
const centerMascotImg = loadImage("/images/ui/center_mascot.png");
// Трофей — два слоя как в макете: белая подложка-аутлайн + чёрный кубок
const iconTrophyWhiteImg = loadImage("/images/ui/icon_trophy_white.png");
const iconTrophyBlackImg = loadImage("/images/ui/icon_trophy_black.png");
const iconSleepHandImg = loadImage("/images/ui/icon_sleep_hand.png");
const speechBubbleImg = loadImage("/images/ui/speech_bubble.png");
const uiIconPlayer1Img = loadImage("/images/ui/icon_player_1.png");
const uiIconPlayer2Img = loadImage("/images/ui/icon_player_2.png");
const pillRestartImg = loadImage("/images/ui/pill_restart.png");
const pillSleepImg = loadImage("/images/ui/pill_sleep.png");

// Маскоты для эффектов при отбивании и голах (PNG с прозрачным фоном)
const mascotImages = [];
const mascotPaths = [
  "/images/mascots/hello.png",   // 0 - черный, нужен invert
  "/images/mascots/wow.png",     // 1 - черный, нужен invert
  "/images/mascots/win.png",     // 2 - черный, нужен invert
  "/images/mascots/score.png",   // 3 - черный, нужен invert
  "/images/mascots/star.png",    // 4 - черный, нужен invert
  "/images/mascots/smile.png",   // 5 - черный, нужен invert
  "/images/mascots/gamepad.png", // 6 - черный, нужен invert
  "/images/mascots/cool.png",    // 7 - черный, нужен invert
  "/images/mascots/caterpillar.svg", // 8
  "/images/mascots/wavy.svg",    // 9
  "/images/mascots/sad.svg"      // 10
];

const mascotSizeScale = { 1: 1.2, 5: 0.5 };
const mascotInvertOnField = false;
mascotPaths.forEach((path, i) => {
  mascotImages[i] = new Image();
  mascotImages[i].crossOrigin = "anonymous";
  mascotImages[i].src = path;
});

function drawRotated(ctx, img, x, y, w, h, angleRad) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(angleRad);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawRotated180(ctx, img, x, y, w, h) {
  drawRotated(ctx, img, x, y, w, h, Math.PI);
}

// Метрики «БИТ» в logo_bit.png (297px высота).
const LOGO_BIT_TOP = 42 / 297;
const LOGO_BIT_CAP = 238 / 297;
const LOGO_BIT_BASELINE = 280 / 297;
const WIN_BG_SCALE = 1.15;
const BUBBLE_FONT = '700 %sizepx %family';
const BUBBLE_FONT_FAMILY = BRAND.fonts.brand;

// Короткие слова, которые нельзя оставлять в конце строки.
const BUBBLE_ORPHAN_WORDS = new Set([
  "а", "и", "в", "во", "на", "с", "со", "к", "ко", "по", "за", "из", "изо", "от", "ото", "до",
  "для", "при", "про", "без", "над", "под", "о", "об", "обо", "у", "не", "ни", "но", "да", "же",
  "ли", "бы", "что", "как", "то", "та", "те", "уже", "ещё", "еще", "или", "ты", "мы", "он", "она",
]);

const PROMO_BUBBLE = {
  textOffsetY: -0.1,
  lineHeight: 1.16,
  baseHeightRatio: 0.073,
  minScale: 0.42,
  maxScale: 1.65,
  padX: 0.2,
  padTop: 0.18,
  padBottom: 0.14,
  sizeScale: 1.15,
  fontHeightRatio: 0.0132,
  textPadX: 4,
  textPadY: 3,
};

// Бабл на экране сна: хвост снизу-слева, крепится к голове гусеницы.
const STANDBY_BUBBLE = {
  widthScale: 1.311,
  heightScale: 1.55,
  tailFromCenterX: 0.48,
  tailFromCenterY: 0.68,
  headOffsetX: 0.36,
  headOffsetY: 0.28,
  textAlignX: -0.38,
  textShiftXRatio: 0,
  rotateDeg: 30,
  hideLeftRatio: 0.15,
  anchorYTop: 0.11,
  anchorYBottom: 0.87,
  fontScale: 1.2,
};

function rotatedBubbleBounds(w, h, rot) {
  const hw = w / 2;
  const hh = h / 2;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [lx, ly] of [
    [-hw, -hh],
    [hw, -hh],
    [hw, hh],
    [-hw, hh],
  ]) {
    const rx = lx * cos - ly * sin;
    const ry = lx * sin + ly * cos;
    minX = Math.min(minX, rx);
    maxX = Math.max(maxX, rx);
    minY = Math.min(minY, ry);
    maxY = Math.max(maxY, ry);
  }
  return { minX, maxX, minY, maxY };
}

const FIGMA = {
  w: 716,
  h: 452,
  field: { x: 135, y: 77, w: 446, h: 284 },
  titleY: 41.5,
  buttonSize: 34,
};

// Боковые контролы — доли от gutter (Figma 716×452, поле @ 135, gutter = 135px).
const REF_CONTROLS = {
  btnInset: 48 / 135,
  iconGap: 31 / 135, // подпись на оси кнопок, иконка ближе к полю
  spreadY: 0.267,
  midYOffset: 0.012,
};

export function computeSceneLayout(w, h) {
  const min = Math.min(w, h);
  const fieldW = w * BRAND.layout.fieldWidthRatio;
  const fieldH = h * BRAND.layout.fieldHeightRatio;
  const field = {
    w: fieldW,
    h: fieldH,
    x: (w - fieldW) / 2,
    y: h * BRAND.layout.fieldTopRatio,
  };
  field.r = min * BRAND.layout.fieldRadiusRatio;

  // Визуальные границы поля (PNG с рамкой) — к ним привязаны боковые кнопки.
  const frameDraw = fieldFrameDrawRect(field);
  const visual = {
    x: frameDraw.x,
    y: frameDraw.y,
    w: frameDraw.w,
    h: frameDraw.h,
  };

  const gutter = visual.x;
  const gutterR = w - visual.x - visual.w;

  const controlSize = Math.max(44, Math.min(90, min * (FIGMA.buttonSize / FIGMA.h)));
  const type = BRAND.layout.type;
  const rc = REF_CONTROLS;
  const btnSpreadY = visual.h * rc.spreadY;
  const fieldMidY = visual.y + visual.h / 2;
  const midY = fieldMidY + visual.h * rc.midYOffset;
  const colLeftX = gutter * rc.btnInset;
  const colRightX = w - gutterR * rc.btnInset;
  const iconGapX = gutter * rc.iconGap;

  return {
    min,
    field,
    title: {
      x: w / 2,
      y: h * (FIGMA.titleY / FIGMA.h),
      logoH: min * (37 / FIGMA.h),
      pongSize: min * type.titlePong,
    },
    controls: {
      size: controlSize,
      leftUp: { x: colLeftX, y: fieldMidY - btnSpreadY },
      leftDown: { x: colLeftX, y: fieldMidY + btnSpreadY },
      rightUp: { x: colRightX, y: fieldMidY - btnSpreadY },
      rightDown: { x: colRightX, y: fieldMidY + btnSpreadY },
      labelLeft: { x: colLeftX, y: midY },
      labelRight: { x: colRightX, y: midY },
      iconLeft: { x: colLeftX + iconGapX, y: midY },
      iconRight: { x: colRightX - iconGapX, y: midY },
      playerLabelSize: min * type.playerLabel,
      iconLeftSize: min * (38 / FIGMA.h),
      iconRightSize: min * (39 / FIGMA.h),
    },
    bottomButtons: {
      y: field.y + field.h + h * (33 / FIGMA.h),
      h: h * (22 / FIGMA.h),
      fontSize: min * type.pillLabel,
    },
    promo: {
      fontSize: min * type.promoLabel,
    },
  };
}

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = 0;
    this.h = 0;
    this.particles = [];
    this.mascotPopups = []; // Маскоты, появляющиеся при отбивании/голах
    this.layout = computeSceneLayout(0, 0);
    this.bottomButtonRects = null;
    this.promoPhrase = BRAND.promoPhrases[0] ?? "";
    this.promoIdx = 0;
    this.promoTimer = 0;
    this.promoAnim = 1;
  }

  _advancePromoPhrase() {
    const phrases = BRAND.promoPhrases;
    if (!phrases.length) return;
    this.promoIdx = (this.promoIdx + 1) % phrases.length;
    this.promoPhrase = phrases[this.promoIdx];
  }

  resetPromoPhrase() {
    const phrases = BRAND.promoPhrases;
    this.promoIdx = 0;
    this.promoPhrase = phrases[0] ?? "";
    this.promoTimer = 0;
    this.promoAnim = 1;
  }

  updatePromo(dt) {
    this.promoTimer += dt;
    if (this.promoAnim < 1) {
      this.promoAnim = Math.min(1, this.promoAnim + dt / 0.35);
    }
    if (this.promoTimer >= BRAND.promoRotateSeconds) {
      this.promoTimer = 0;
      this.promoAnim = 0;
      this._advancePromoPhrase();
    }
  }

  _bubbleFontSize() {
    return Math.max(8, this.h * PROMO_BUBBLE.fontHeightRatio);
  }

  _setBubbleFont(ctx, size, weight = 700) {
    ctx.font = `${weight} ${size}px ${BUBBLE_FONT_FAMILY}`;
  }

  _orphanWord(word) {
    return BUBBLE_ORPHAN_WORDS.has(
      String(word)
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]/gu, "")
    );
  }

  _fixHangingLines(ctx, lines, maxW) {
    const out = [...lines];
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < out.length - 1; i++) {
        const words = out[i].split(/\s+/).filter(Boolean);
        if (words.length < 2) continue;
        const orphan = words[words.length - 1];
        if (!this._orphanWord(orphan)) continue;
        words.pop();
        const next = `${orphan} ${out[i + 1]}`;
        const current = words.join(" ");
        if (current && ctx.measureText(current).width > maxW) continue;
        if (ctx.measureText(next).width > maxW) continue;
        out[i] = current;
        out[i + 1] = next;
        changed = true;
      }
    }
    return out.filter(Boolean);
  }

  _promoHasHardBreaks(text) {
    return String(text).includes("\n");
  }

  _promoHardLines(ctx, text, startSize) {
    this._setBubbleFont(ctx, startSize);
    const lines = String(text)
      .split("\n")
      .map((part) => part.trim())
      .filter(Boolean);
    const lineH = startSize * PROMO_BUBBLE.lineHeight;
    const blockH = lines.length * lineH;
    const maxLineW = Math.max(0, ...lines.map((line) => ctx.measureText(line).width));
    return { lines, size: startSize, lineH, blockH, maxLineW };
  }

  _wrapTextLines(ctx, text, maxW) {
    const parts = String(text).split("\n");
    const lines = [];
    for (const part of parts) {
      const chunk = part.trim();
      if (!chunk) continue;
      const words = chunk.split(/\s+/).filter(Boolean);
      if (!words.length) continue;
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
    }
    return this._fixHangingLines(ctx, lines, maxW);
  }

  _promoTextInset() {
    const scale = this.h / FIGMA.h;
    return {
      x: PROMO_BUBBLE.textPadX * scale,
      y: PROMO_BUBBLE.textPadY * scale,
    };
  }

  _fitPromoText(ctx, text, maxW, maxH, startSize) {
    const lineHeight = PROMO_BUBBLE.lineHeight;
    this._setBubbleFont(ctx, startSize);
    const lines = this._wrapTextLines(ctx, text, maxW);
    const lineH = startSize * lineHeight;
    const blockH = lines.length * lineH;
    const maxLineW = Math.max(0, ...lines.map((line) => ctx.measureText(line).width));
    return { lines, size: startSize, lineH, blockH, maxLineW };
  }

  _promoTextBounds(bubbleW, bubbleH, fit) {
    const inset = this._promoTextInset();
    const padX = fit.size * PROMO_BUBBLE.padX;
    const padT = fit.size * PROMO_BUBBLE.padTop;
    const padB = fit.size * PROMO_BUBBLE.padBottom;
    const maxLineW = Math.max(0, bubbleW - padX * 2 - inset.x * 2);
    const topNeed = 0.5 + PROMO_BUBBLE.textOffsetY;
    const botNeed = 0.5 - PROMO_BUBBLE.textOffsetY;
    const maxBlockH = Math.max(0, bubbleH * Math.min(topNeed, botNeed) * 2 - padT - padB - inset.y);
    const textOy = bubbleH * PROMO_BUBBLE.textOffsetY + inset.y;
    return { textOy, maxLineW, maxBlockH };
  }

  _promoBubbleSize(fit) {
    const inset = this._promoTextInset();
    const padX = fit.size * PROMO_BUBBLE.padX;
    const padT = fit.size * PROMO_BUBBLE.padTop;
    const padB = fit.size * PROMO_BUBBLE.padBottom;
    const topNeed = 0.5 + PROMO_BUBBLE.textOffsetY;
    const botNeed = 0.5 - PROMO_BUBBLE.textOffsetY;
    const bubbleW = (fit.maxLineW + padX * 2 + inset.x * 2) * PROMO_BUBBLE.sizeScale;
    const bubbleH =
      Math.max(
        (fit.blockH / 2 + padT + inset.y) / topNeed,
        (fit.blockH / 2 + padB) / botNeed
      ) * PROMO_BUBBLE.sizeScale;
    return { bubbleW, bubbleH };
  }

  _layoutPromoLines(ctx, text, startSize, maxWrapW) {
    if (this._promoHasHardBreaks(text)) {
      return this._promoHardLines(ctx, text, startSize);
    }
    this._setBubbleFont(ctx, startSize);
    const lines = this._wrapTextLines(ctx, text, maxWrapW);
    const lineH = startSize * PROMO_BUBBLE.lineHeight;
    const blockH = lines.length * lineH;
    const maxLineW = Math.max(0, ...lines.map((line) => ctx.measureText(line).width));
    return { lines, size: startSize, lineH, blockH, maxLineW };
  }

  _promoMaxLineWrap(startSize) {
    const aspect =
      speechBubbleImg.complete && speechBubbleImg.naturalWidth > 0
        ? speechBubbleImg.naturalWidth / speechBubbleImg.naturalHeight
        : 1.79;
    const maxH = this.h * PROMO_BUBBLE.baseHeightRatio * PROMO_BUBBLE.maxScale;
    const maxW = maxH * aspect;
    const padX = startSize * PROMO_BUBBLE.padX;
    const inset = this._promoTextInset();
    return Math.max(0, (maxW - padX * 2 - inset.x * 2) / PROMO_BUBBLE.sizeScale);
  }

  _layoutPromoBubble(text, { fontScale = 1 } = {}) {
    const ctx = this.ctx;
    const aspect =
      speechBubbleImg.complete && speechBubbleImg.naturalWidth > 0
        ? speechBubbleImg.naturalWidth / speechBubbleImg.naturalHeight
        : 1.79;
    const baseH = this.h * PROMO_BUBBLE.baseHeightRatio;
    const minH = baseH * PROMO_BUBBLE.minScale;
    const maxH = baseH * PROMO_BUBBLE.maxScale;
    const minW = minH * aspect * 0.82;
    const maxW = maxH * aspect;
    const fontSize = this._bubbleFontSize() * fontScale;
    const maxLineWrapW = this._promoMaxLineWrap(fontSize);

    const hardBreaks = this._promoHasHardBreaks(text);
    let fit = this._layoutPromoLines(ctx, text, fontSize, maxLineWrapW);
    let bubbleW;
    let bubbleH;

    if (!hardBreaks) {
      for (let i = 0; i < 4; i++) {
        ({ bubbleW, bubbleH } = this._promoBubbleSize(fit));
        bubbleW = Math.max(minW, Math.min(maxW, bubbleW));
        bubbleH = Math.max(minH, Math.min(maxH, bubbleH));
        const bounds = this._promoTextBounds(bubbleW, bubbleH, fit);
        if (fit.blockH <= bounds.maxBlockH && fit.maxLineW <= bounds.maxLineW) break;
        const refit = this._layoutPromoLines(ctx, text, fontSize, bounds.maxLineW);
        if (refit.lines.join("|") === fit.lines.join("|")) {
          fit = refit;
          break;
        }
        fit = refit;
      }
    } else {
      ({ bubbleW, bubbleH } = this._promoBubbleSize(fit));
      bubbleW = Math.max(minW, Math.min(maxW, bubbleW));
      bubbleH = Math.max(minH, Math.min(maxH, bubbleH));
    }

    const bounds = this._promoTextBounds(bubbleW, bubbleH, fit);
    return { bubbleW, bubbleH, fit, baseH, ...bounds };
  }

  getBottomButtonRects() {
    return this.bottomButtonRects;
  }

  setSize(w, h) {
    this.w = w;
    this.h = h;
    this.layout = computeSceneLayout(w, h);
  }

  getFieldRect() {
    return { ...this.layout.field };
  }

  getLayout() {
    return {
      ...this.layout,
      field: { ...this.layout.field },
      controls: { ...this.layout.controls },
    };
  }

  // ---- частицы ----

  burst(x, y, count = 10, colors = BRAND.palette) {
    const base = Math.min(this.w, this.h);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = base * (0.05 + Math.random() * 0.18);
      const life = 0.35 + Math.random() * 0.45;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life,
        maxLife: life,
        size: base * (0.004 + Math.random() * 0.008),
        color: colors[(Math.random() * colors.length) | 0],
      });
    }
  }

  updateParticles(dt) {
    const g = this.h * 0.5;
    const arr = this.particles;
    for (let i = arr.length - 1; i >= 0; i--) {
      const p = arr[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += g * dt;
      p.life -= dt;
      if (p.life <= 0) arr.splice(i, 1);
    }
  }

  drawParticles() {
    const ctx = this.ctx;
    const f = this.layout.field;
    ctx.save();
    ctx.translate(f.x, f.y);
    for (const p of this.particles) {
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      const s = p.size;
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  clearParticles() {
    this.particles.length = 0;
  }

  // ---- маскоты при отбивании/голах ----

  showMascot(x, y, isGoal = false) {
    const base = Math.min(this.w, this.h);
    const imgIndex = Math.floor(Math.random() * mascotImages.length);
    const sizeMul = mascotSizeScale[imgIndex] ?? 1;
    const size = base * 0.08 * sizeMul;
    const life = isGoal ? 1.2 : 0.7;
    
    this.mascotPopups.push({
      x,
      y,
      size,
      life,
      maxLife: life,
      imgIndex,
      scale: 0, // Начинаем с 0 для анимации появления
      vy: -base * 0.05, // Небольшое движение вверх
    });
  }

  updateMascots(dt) {
    const arr = this.mascotPopups;
    for (let i = arr.length - 1; i >= 0; i--) {
      const m = arr[i];
      m.life -= dt;
      m.y += m.vy * dt;
      
      // Анимация масштаба: появление -> показ -> исчезновение
      const progress = 1 - (m.life / m.maxLife);
      if (progress < 0.2) {
        m.scale = progress / 0.2; // Появление
      } else if (progress < 0.7) {
        m.scale = 1; // Полный размер
      } else {
        m.scale = (1 - progress) / 0.3; // Исчезновение
      }
      
      if (m.life <= 0) arr.splice(i, 1);
    }
  }

  drawMascots() {
    const ctx = this.ctx;
    const f = this.layout.field;
    
    ctx.save();
    ctx.translate(f.x, f.y);
    
    for (const m of this.mascotPopups) {
      const img = mascotImages[m.imgIndex];
      if (!img || !img.complete || !img.naturalWidth) continue;
      
      const scale = m.size * m.scale;
      if (scale <= 0) continue;
      
      // Сохраняем пропорции изображения
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      let drawW, drawH;
      if (aspectRatio > 1) {
        drawW = scale;
        drawH = scale / aspectRatio;
      } else {
        drawH = scale;
        drawW = scale * aspectRatio;
      }
      
      ctx.globalAlpha = Math.min(1, m.scale * 1.5);
      
      if (mascotInvertOnField) ctx.filter = "invert(1)";
      ctx.drawImage(img, m.x - drawW / 2, m.y - drawH / 2, drawW, drawH);
      ctx.filter = "none";
    }
    
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  clearMascots() {
    this.mascotPopups.length = 0;
  }

  // ---- хром/обрамление ----

  drawChrome(t = 0) {
    const ctx = this.ctx;
    const { field, title, controls, min, bottomButtons } = this.layout;
    ctx.save();

    ctx.fillStyle = BRAND.colors.bg;
    ctx.fillRect(0, 0, this.w, this.h);

    this.drawTitleBanner(title, min);
    this.drawPlayerLabels(controls);
    this.drawFieldFrame(field);

    this.drawBottomButtons(bottomButtons, field);

    ctx.restore();
  }

  drawFieldFrame(field) {
    const ctx = this.ctx;
    const rect = fieldFrameDrawRect(field);

    if (fieldFrameImg.complete && fieldFrameImg.naturalWidth > 0) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(fieldFrameImg, rect.x, rect.y, rect.w, rect.h);
      return;
    }

    ctx.fillStyle = BRAND.colors.field;
    ctx.beginPath();
    ctx.roundRect(field.x, field.y, field.w, field.h, field.r);
    ctx.fill();
    ctx.strokeStyle = BRAND.colors.fieldBorder;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // Заголовок: лого «✳БИТ» (графика) + «PONG» текстом, по центру.
  drawTitleBanner(title, min) {
    const ctx = this.ctx;
    const cy = title.y;
    const logoH = title.logoH ?? min * 0.082;
    const pongSize = title.pongSize ?? min * 0.095;
    const gap = min * (8 / FIGMA.h);

    ctx.save();
    ctx.font = `700 ${pongSize}px ${BRAND.fonts.brand}`;
    ctx.fillStyle = BRAND.colors.text;

    if (logoBitImg.complete && logoBitImg.naturalWidth > 0) {
      const logoW = (logoBitImg.naturalWidth / logoBitImg.naturalHeight) * logoH;
      const pongW = ctx.measureText("PONG").width;
      const total = logoW + gap + pongW;
      const left = title.x - total / 2;
      ctx.drawImage(logoBitImg, left, cy - logoH / 2, logoW, logoH);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      const pongY = cy - logoH / 2 + logoH * LOGO_BIT_BASELINE;
      ctx.fillText("PONG", left + logoW + gap, pongY);
    } else {
      ctx.textAlign = "center";
      ctx.fillText(BRAND.title, title.x, cy);
    }
    ctx.restore();
  }

  // Лого с подписью журнала — используется на финальном экране.
  drawBrandLogo(x, y, min) {
    const ctx = this.ctx;
    const logoH = min * 0.082;
    ctx.save();
    ctx.fillStyle = BRAND.colors.text;
    let textX = x;

    if (logoBitImg.complete && logoBitImg.naturalWidth > 0) {
      const logoW = (logoBitImg.naturalWidth / logoBitImg.naturalHeight) * logoH;
      ctx.drawImage(logoBitImg, x, y, logoW, logoH);
      textX = x + logoW + min * 0.02;
    } else {
      ctx.font = `700 ${logoH * 0.8}px ${BRAND.fonts.ui}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(BRAND.brandName, x, y);
      textX = x + logoH * 2.2;
    }

    const subSize = min * 0.029;
    ctx.font = `700 ${subSize}px ${BRAND.fonts.ui}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Журнал", textX, y + logoH * 0.32);
    ctx.fillText("Яндекс Образования", textX, y + logoH * 0.32 + subSize * 1.25);
    ctx.restore();
  }

  // Вертикальная подпись: rotationRad = -π/2 — читается снизу вверх, +π/2 — сверху вниз.
  drawVerticalPlayerLabel(ctx, cx, cy, text, fontSize, rotationRad) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotationRad);
    ctx.font = `700 ${fontSize}px ${BRAND.fonts.ui}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = BRAND.colors.text;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  drawSideIcon(ctx, img, cx, cy, h, rotationRad = 0) {
    if (!img?.complete || !img.naturalWidth) return;
    const w = (img.naturalWidth / img.naturalHeight) * h;
    ctx.save();
    ctx.translate(cx, cy);
    if (rotationRad) ctx.rotate(rotationRad);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  drawPillImage(ctx, img, x, y, w, h) {
    if (img?.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, x, y, w, h);
      return;
    }
    this.drawPill(ctx, x, y, w, h);
  }

  drawPlayerLabels(controls) {
    const ctx = this.ctx;
    const labelSize = controls.playerLabelSize;
    // Слева: подпись на оси кнопок, иконка правее (к полю).
    this.drawVerticalPlayerLabel(
      ctx,
      controls.labelLeft.x,
      controls.labelLeft.y,
      "ИГРОК 2",
      labelSize,
      Math.PI / 2
    );
    this.drawSideIcon(
      ctx,
      uiIconPlayer1Img,
      controls.iconLeft.x,
      controls.iconLeft.y,
      controls.iconLeftSize
    );
    // Справа: иконка левее (к полю), подпись на оси кнопок.
    this.drawSideIcon(
      ctx,
      uiIconPlayer2Img,
      controls.iconRight.x,
      controls.iconRight.y,
      controls.iconRightSize
    );
    this.drawVerticalPlayerLabel(
      ctx,
      controls.labelRight.x,
      controls.labelRight.y,
      "ИГРОК 1",
      labelSize,
      -Math.PI / 2
    );
  }

  drawPill(ctx, x, y, w, h) {
    ctx.fillStyle = BRAND.colors.pill;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h / 2);
    ctx.fill();
  }

  _drawPromoBubbleLayout(
    layout,
    bubbleCx,
    bubbleCy,
    { alpha = 1, scale = 1, rotation = 0, fontWeight = 700 } = {}
  ) {
    const ctx = this.ctx;
    const { bubbleW, bubbleH, fit, textOy } = layout;

    ctx.save();
    ctx.translate(bubbleCx, bubbleCy);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    if (speechBubbleImg.complete && speechBubbleImg.naturalWidth > 0) {
      ctx.drawImage(speechBubbleImg, -bubbleW / 2, -bubbleH / 2, bubbleW, bubbleH);
    } else {
      this.drawPill(ctx, -bubbleW / 2, -bubbleH / 2, bubbleW, bubbleH);
    }

    this._setBubbleFont(ctx, fit.size, fontWeight);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = BRAND.colors.pillText;
    let ty = textOy - fit.blockH / 2 + fit.lineH / 2;
    for (const line of fit.lines) {
      ctx.fillText(line, 0, ty);
      ty += fit.lineH;
    }
    ctx.restore();
  }

  drawStandbyBubbleCorner(phrase, corner, { alpha = 1, scale = 1 } = {}) {
    const layout = this._layoutPromoBubble(phrase);
    const bubbleW = layout.bubbleW * STANDBY_BUBBLE.widthScale;
    const bubbleH = layout.bubbleH * STANDBY_BUBBLE.heightScale;
    const rotDeg = corner === 0 ? STANDBY_BUBBLE.rotateDeg : -STANDBY_BUBBLE.rotateDeg;
    const rotation = (rotDeg * Math.PI) / 180;
    const bounds = rotatedBubbleBounds(bubbleW, bubbleH, rotation);
    const hiddenLeft = bubbleW * STANDBY_BUBBLE.hideLeftRatio;
    const bubbleCx = -hiddenLeft - bounds.minX;
    const bubbleCy =
      corner === 0
        ? this.h * STANDBY_BUBBLE.anchorYTop
        : this.h * STANDBY_BUBBLE.anchorYBottom;
    const inset = this._promoTextInset();
    const textOy = bubbleH * PROMO_BUBBLE.textOffsetY + inset.y;

    this._drawPromoBubbleLayout(
      { ...layout, bubbleW, bubbleH, textOy },
      bubbleCx,
      bubbleCy,
      { alpha, scale, rotation }
    );
  }

  drawStandbyBubble(phrase, headX, headY, { alpha = 1, scale = 1 } = {}) {
    const layout = this._layoutPromoBubble(phrase, { fontScale: STANDBY_BUBBLE.fontScale });
    const bubbleW = layout.bubbleW * STANDBY_BUBBLE.widthScale;
    const bubbleH = layout.bubbleH * STANDBY_BUBBLE.heightScale;
    const inset = this._promoTextInset();
    const textOy = bubbleH * PROMO_BUBBLE.textOffsetY + inset.y;
    const bubbleCx = headX + bubbleW * STANDBY_BUBBLE.tailFromCenterX;
    const bubbleCy = headY - bubbleH * STANDBY_BUBBLE.tailFromCenterY;
    this._drawPromoBubbleLayout(
      { ...layout, bubbleW, bubbleH, textOy },
      bubbleCx,
      bubbleCy,
      { alpha, scale, fontWeight: 700 }
    );
  }

  drawStandbyBubbleForCaterpillar(phrase, { pivotX, pivotY, catW, catH, scaleX, scaleY }) {
    const headX = pivotX + (-catW / 2 + catH * STANDBY_BUBBLE.headOffsetX) * scaleX;
    const headY = pivotY + (-catH + catH * STANDBY_BUBBLE.headOffsetY) * scaleY;
    this.drawStandbyBubble(phrase, headX, headY);
  }

  drawCenterPromo(field) {
    const ctx = this.ctx;
    const cx = field.x + field.w / 2;
    const fieldBottom = field.y + field.h;

    // Маскот по центру под полем.
    const mascotH = this.h * 0.111;
    const mascotTop = fieldBottom + this.h * 0.033;
    if (centerMascotImg.complete && centerMascotImg.naturalWidth > 0) {
      const aspect = centerMascotImg.naturalWidth / centerMascotImg.naturalHeight;
      const w = mascotH * aspect;
      ctx.drawImage(centerMascotImg, cx - w / 2, mascotTop, w, mascotH);
    }

    // Спич-баббл правее маскота; размер подстраивается под текст.
    const layout = this._layoutPromoBubble(this.promoPhrase);
    const { bubbleW, bubbleH, baseH } = layout;
    const bubbleX = cx + this.w * 0.024;
    const bubbleY = fieldBottom + this.h * 0.013 - (bubbleH - baseH) * 0.65;

    const animT = 1 - Math.pow(1 - this.promoAnim, 3);
    const scale = 0.9 + 0.1 * animT;
    const alpha = 0.55 + 0.45 * animT;
    const bubbleCx = bubbleX + bubbleW / 2;
    const bubbleCy = bubbleY + bubbleH / 2;

    this._drawPromoBubbleLayout(layout, bubbleCx, bubbleCy, { alpha, scale });
  }

  drawBottomButtons(bottomButtons, field) {
    const ctx = this.ctx;
    const pillH = bottomButtons.h;
    const pillY = bottomButtons.y;
    const fontSize = (bottomButtons.fontSize ?? pillH * 0.62) * 0.84;

    ctx.save();
    ctx.textBaseline = "middle";

    // «Заново»: пилюля у левого края поля, кубок торчит над ней.
    const restartW = field.w * 0.224;
    const restartX = field.x + field.w * 0.031;
    this.drawPillImage(ctx, pillRestartImg, restartX, pillY, restartW, pillH);
    if (iconTrophyWhiteImg.complete && iconTrophyWhiteImg.naturalWidth > 0) {
      const ih = pillH * 1.48;
      const iw =
        (iconTrophyWhiteImg.naturalWidth / iconTrophyWhiteImg.naturalHeight) * ih;
      const ix = restartX + restartW * 0.06;
      const iy = pillY - pillH * 0.25;
      // Белый слой снизу даёт аутлайн на чёрном фоне, сверху чёрный кубок.
      ctx.drawImage(iconTrophyWhiteImg, ix, iy, iw, ih);
      if (iconTrophyBlackImg.complete && iconTrophyBlackImg.naturalWidth > 0) {
        ctx.drawImage(iconTrophyBlackImg, ix + iw * 0.036, iy + ih * 0.022, iw * 0.929, ih * 0.969);
      }
    }
    ctx.font = `700 ${fontSize}px ${BRAND.fonts.ui}`;
    ctx.textAlign = "center";
    ctx.fillStyle = BRAND.colors.pillText;
    ctx.fillText("ЗАНОВО", restartX + restartW * 0.62, pillY + pillH * 0.52);

    // «Режим сна»: пилюля у правого края, «рука со звездой» торчит вверх.
    const sleepW = field.w * 0.249;
    const sleepX = field.x + field.w - sleepW;
    this.drawPillImage(ctx, pillSleepImg, sleepX, pillY, sleepW, pillH);
    if (iconSleepHandImg.complete && iconSleepHandImg.naturalWidth > 0) {
      const ih = pillH * 1.9;
      const iw = (iconSleepHandImg.naturalWidth / iconSleepHandImg.naturalHeight) * ih;
      ctx.drawImage(iconSleepHandImg, sleepX - sleepW * 0.18, pillY + pillH - ih, iw, ih);
    }
    ctx.fillStyle = BRAND.colors.pillText;
    ctx.fillText("РЕЖИМ СНА", sleepX + sleepW * 0.58, pillY + pillH * 0.52);

    this.drawCenterPromo(field);

    // Зоны нажатия (захватываем и торчащие иконки).
    const hitPad = pillH * 0.9;
    this.bottomButtonRects = {
      restart: { x: restartX, y: pillY - hitPad, w: restartW, h: pillH + hitPad },
      sleep: { x: sleepX, y: pillY - hitPad, w: sleepW, h: pillH + hitPad },
    };

    ctx.restore();
  }

  _getFinalQrBurstLayout() {
    const bgAspect = bgWinImg.naturalWidth / bgWinImg.naturalHeight || 1024 / 599;
    let bw = this.w * 0.36;
    let bh = bw / bgAspect;
    const maxBh = this.h * 0.34;
    if (bh > maxBh) {
      bh = maxBh;
      bw = bh * bgAspect;
    }
    const cx = this.w * 0.5;
    const cy = this.h * 0.62;
    return { x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh, cx, cy };
  }

  drawFinalQrBlob(scale = 1) {
    const ctx = this.ctx;
    const burst = this._getFinalQrBurstLayout();
    const sw = burst.w * scale;
    const sh = burst.h * scale;

    if (scale > 0.001) {
      if (bgWinImg.complete && bgWinImg.naturalWidth > 0) {
        ctx.drawImage(bgWinImg, burst.cx - sw / 2, burst.cy - sh / 2, sw, sh);
      } else if (starburstImg.complete && starburstImg.naturalWidth > 0) {
        ctx.drawImage(starburstImg, burst.cx - sw / 2, burst.cy - sh / 2, sw, sh);
      } else {
        ctx.fillStyle = BRAND.colors.pill;
        ctx.beginPath();
        ctx.ellipse(burst.cx, burst.cy, sw / 2, sh / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    return { ...burst, w: sw, h: sh };
  }

  _getFinalBurstLayout() {
    const bgAspect = bgWinImg.naturalWidth / bgWinImg.naturalHeight || 1024 / 599;
    let bw = this.w * 0.716 * WIN_BG_SCALE;
    let bh = bw / bgAspect;
    const maxBh = this.h * 0.72 * WIN_BG_SCALE;
    if (bh > maxBh) {
      bh = maxBh;
      bw = bh * bgAspect;
    }
    const cx = this.w * 0.487;
    const cy = this.h * 0.484;
    return { x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh, cx, cy };
  }

  drawFinalBase() {
    const ctx = this.ctx;
    ctx.fillStyle = BRAND.colors.bg;
    ctx.fillRect(0, 0, this.w, this.h);
  }

  drawFinalLogo() {
    const min = Math.min(this.w, this.h) || 1;
    this.drawBrandLogo(this.w * 0.039, this.h * 0.055, min);
  }

  drawFinalBlob(scale = 1) {
    const ctx = this.ctx;
    const burst = this._getFinalBurstLayout();
    const sw = burst.w * scale;
    const sh = burst.h * scale;

    if (scale > 0.001) {
      if (bgWinImg.complete && bgWinImg.naturalWidth > 0) {
        ctx.drawImage(bgWinImg, burst.cx - sw / 2, burst.cy - sh / 2, sw, sh);
      } else if (starburstImg.complete && starburstImg.naturalWidth > 0) {
        ctx.drawImage(starburstImg, burst.cx - sw / 2, burst.cy - sh / 2, sw, sh);
      } else {
        ctx.fillStyle = BRAND.colors.pill;
        ctx.beginPath();
        ctx.ellipse(burst.cx, burst.cy, sw / 2, sh / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    return burst;
  }

  // База финального экрана: чёрный фон, лого, белая «клякса» (bg_win).
  drawFinalChrome(scale = 1) {
    this.drawFinalBase();
    const burst = this.drawFinalBlob(scale);
    this.drawFinalLogo();
    return burst;
  }

  drawFieldNet() {
    const ctx = this.ctx;
    const f = this.layout.field;
    ctx.save();
    ctx.strokeStyle = BRAND.colors.line;
    ctx.lineWidth = 2;
    ctx.setLineDash([f.h * 0.025, f.h * 0.018]);
    ctx.beginPath();
    ctx.moveTo(f.w / 2, 0);
    ctx.lineTo(f.w / 2, f.h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  drawPlayfield(state, t = 0, opts = {}) {
    const ctx = this.ctx;
    const f = this.layout.field;
    this.drawChrome(t);

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(f.x, f.y, f.w, f.h, f.r);
    ctx.clip();
    ctx.translate(f.x, f.y);

    this.drawFieldNet();
    this.drawPaddles(state, t);
    // На обратном отсчёте мяч прячем — он стоит в центре под цифрой.
    if (!opts.hideBall) this.drawBall(state, t);

    ctx.restore();
  }

  drawPaddles(state, t) {
    const ctx = this.ctx;
    const left = state.paddles[0];
    const right = state.paddles[1];

    const drawPaddle = (img, p) => {
      if (!img.complete || !img.naturalWidth) return;

      const imgAspect = img.naturalWidth / img.naturalHeight;
      const drawH = p.h;
      const drawW = drawH * imgAspect;
      const x = p.x + p.w / 2 - drawW / 2;
      const y = p.y + (p.h - drawH) / 2;
      ctx.drawImage(img, x, y, drawW, drawH);
    };

    drawPaddle(paddleLeftImg, left);
    drawPaddle(paddleRightImg, right);
  }

  drawBall(state, t) {
    const ctx = this.ctx;
    const b = state.ball;
    const size = b.r * 2.5;

    if (ballImg.complete && ballImg.naturalWidth > 0) {
      ctx.save();
      ctx.translate(b.x, b.y);

      // Поворачиваем мяч в направлении движения
      if (b.vx < 0) {
        ctx.scale(-1, 1);
      }

      const imgAspect = ballImg.naturalWidth / ballImg.naturalHeight;
      const drawW = size * imgAspect;
      const drawH = size;

      ctx.drawImage(ballImg, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    } else {
      ctx.fillStyle = BRAND.colors.ink;
      ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
    }
  }

  drawScores(scores) {
    const ctx = this.ctx;
    const f = this.layout.field;
    const min = Math.min(this.w, this.h);
    const cell = min * 0.008;

    ctx.save();

    const scoreY = f.y + f.h * 0.12;

    // Счет слева
    const leftScore = String(scores[0]).padStart(2, "0");
    drawPixelNumber(ctx, leftScore, f.x + f.w * 0.28, scoreY, cell, BRAND.colors.ink);

    // Счет справа
    const rightScore = String(scores[1]).padStart(2, "0");
    drawPixelNumber(ctx, rightScore, f.x + f.w * 0.72, scoreY, cell, BRAND.colors.ink);

    ctx.restore();
  }
}

export default Renderer;
