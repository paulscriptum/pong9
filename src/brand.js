// ===========================================================
// Бренд-токены 8БИТ + игровой конфиг. Единый источник правды.
// Дизайн из брендбука: светлый фон, фиолетовый акцент, черное поле.
// ===========================================================

export const BRAND = {
  colors: {
    bg: "#E8E4E0", // светло-серый/бежевый фон
    field: "#0c0c0c", // черное игровое поле
    text: "#0c0c0c", // темный текст для UI
    ink: "#ffffff", // белые элементы на поле
    accent: "#6B5CE7", // фиолетовый акцент
    accentDark: "#5A4BD6",
    dim: "#999999",
    line: "rgba(255,255,255,0.4)",
    fieldBorder: "#6B5CE7", // фиолетовая рамка поля
  },

  // Мультиколор-палитра 8БИТ — для частиц/конфетти.
  palette: ["#6B5CE7", "#ffffff", "#E8E4E0", "#0c0c0c"],

  fonts: {
    display: '"CoFo Driffter", "Comic Sans MS", cursive',
    brand: '"CoFo Driffter", "Comic Sans MS", cursive',
    ui: '"CoFo Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },

  // Брендинг.
  brandName: "8БИТ",
  title: "8БИТ PONG",
  cta: "ИГРАЙ ПО-8БИТНОМУ!",
  ctaSub: "Сканируй и переходи",
  url: "https://t.me/journal_yandex_education",

  layout: {
    fieldWidthRatio: 0.68,
    fieldHeightRatio: 0.58,
    fieldRadiusRatio: 0.02,
    controlsInsetRatio: 0.035,
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
