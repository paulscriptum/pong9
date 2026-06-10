// ===========================================================
// Бренд-токены 8БИТ + игровой конфиг. Единый источник правды.
// Редизайн: чёрный фон, белое поле, монохромный UI.
// ===========================================================

export const BRAND = {
  colors: {
    bg: "#000000",
    field: "#ffffff",
    text: "#ffffff",
    ink: "#0c0c0c",
    accent: "#873CF5", // фиолетовый из макета (кнопки управления)
    accentDark: "#6B2FD0",
    dim: "#888888",
    line: "rgba(0,0,0,0.25)",
    fieldBorder: "#000000",
    pill: "#ffffff",
    pillText: "#000000",
  },

  palette: ["#873CF5", "#6B5CE7", "#000000", "#ffffff", "#888888"],

  fonts: {
    display: '"CoFo Driffter", "Comic Sans MS", cursive',
    brand: '"CoFo Driffter", "Comic Sans MS", cursive',
    ui: '"CoFo Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },

  // Брендинг.
  brandName: "БИТ",
  title: "БИТ PONG",
  cta: "ИГРАЙ",
  ctaLine2: "ПО БИТНОМУ",
  ctaSub: "Сканируй и учись!",
  url: "https://t.me/journal_yandex_education",

  promoRotateSeconds: 4,
  promoPhrases: [
    "Физический мир\nначинается\nс движения",
    "Улови траекторию",
    "Управляй движением",
    "Освой физику движения",
    "От пикселей\nк роботам",
  ],

  layout: {
    // Точные пропорции игрового экрана из Figma (716×452, поле 446×284 @ 135,77).
    fieldWidthRatio: 446 / 716,
    fieldHeightRatio: 284 / 452,
    fieldTopRatio: 77 / 452,
    fieldRadiusRatio: 0.02,
    controlsInsetRatio: 0.035,
    // Размеры шрифтов из макета (px при 452pt высоты).
    type: {
      titlePong: 43 / 452,
      playerLabel: 13 / 452,
      pillLabel: 15 / 452,
      promoLabel: 11 / 452,
    },
  },

  // Игровые параметры.
  game: {
    targetScore: 5,
    paddleHeightRatio: 0.32,
    paddleWidthPx: 38,
    paddleMarginRatio: 0.04,
    ballRadiusPx: 18,
    ballStartSpeedRatio: 0.38,
    ballSpeedup: 1.04,
    maxBallSpeedRatio: 1.0,
    maxBounceAngle: Math.PI / 3,
    paddleSpeedRatio: 1.2,
    countdownSeconds: 3,
    gameOverSeconds: 20,
  },
};

export default BRAND;
