// ===========================================================
// ???? � 8??? � ??????????? ????????? ??????? (?????? line-art).
// ?????? ?????? ?? ????????? �8??? PONG�: ????? ??????? � ????????
// (??????? ??????? ????????? + ??????????? ?????? + ?????), ?????? �
// ??????? ??????? (?????? ???????? ?????? ? ??????). ??? � ??? ?
// ????????? ? ??????????. ???? ???, ????-??????, ????? ? ?????????? ????.
//
// ??? ????????? � ?????????, ????/??????? ?????????????, ???????
// ?????????????? ??? ?????? ???????? ? ????? ????????? ??? ???.
// ===========================================================

function strokeCircle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2);
  ctx.stroke();
}

function fillDot(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2);
  ctx.fill();
}

// ?????? ????: ??? ?????-????? + ????-??????. ??? ???????? ???????.
// mood: 1 � ??????, -1 � ??????. size � ???????? �??????� ????.
export function drawFace(ctx, x, y, size, color, lw, mood = 1) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  const eyeR = Math.max(0.8, size * 0.12);
  const ex = size * 0.42;
  const ey = -size * 0.22;
  fillDot(ctx, x - ex, y + ey, eyeR);
  fillDot(ctx, x + ex, y + ey, eyeR);
  ctx.beginPath();
  if (mood >= 0) {
    ctx.arc(x, y + size * 0.02, size * 0.46, 0.15 * Math.PI, 0.85 * Math.PI);
  } else {
    ctx.arc(x, y + size * 0.42, size * 0.46, 1.18 * Math.PI, 1.82 * Math.PI);
  }
  ctx.stroke();
  ctx.restore();
}

// ????????: ???????????? ??????? ??????? ?????????, ?????? ??????.
// ????????? ??????? (cx � ????? X, top � ????, w/h � ???????? ???????).
export function drawCaterpillar(ctx, cx, top, w, h, color, t = 0) {
  const segR = Math.min(w * 0.5, h * 0.08);
  const usable = h - segR * 2;
  const n = Math.max(5, Math.round(usable / (segR * 1.4)) + 1);
  const step = usable / (n - 1);
  const lw = Math.max(2, segR * 0.16);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // ??????? ????? (??? ??????????), ????? ???????? ??????.
  for (let i = 1; i < n; i++) {
    const cy = top + segR + step * i;
    const wig = Math.sin(t * 2 + i * 0.6) * segR * 0.06;
    const lx = cx - segR * 0.86 + wig;
    const rx = cx + segR * 0.86 + wig;
    ctx.beginPath();
    ctx.moveTo(lx, cy - segR * 0.18);
    ctx.lineTo(lx - segR * 0.55, cy - segR * 0.05);
    ctx.moveTo(lx, cy + segR * 0.2);
    ctx.lineTo(lx - segR * 0.55, cy + segR * 0.4);
    ctx.moveTo(rx, cy - segR * 0.18);
    ctx.lineTo(rx + segR * 0.55, cy - segR * 0.05);
    ctx.moveTo(rx, cy + segR * 0.2);
    ctx.lineTo(rx + segR * 0.55, cy + segR * 0.4);
    ctx.stroke();
  }

  for (let i = n - 1; i >= 0; i--) {
    const cy = top + segR + step * i;
    const wig = Math.sin(t * 2 + i * 0.6) * segR * 0.06;
    const x = cx + wig;
    const r = i === 0 ? segR * 1.12 : segR;
    // ???????? ?????-?????, ????? ?????????? ????????? ??? ?????? ??????.
    ctx.save();
    ctx.fillStyle = "#050505";
    fillDot(ctx, x, cy, r);
    ctx.restore();
    strokeCircle(ctx, x, cy, r);
    if (i === 0) {
      // ??????: ????? + ????.
      ctx.beginPath();
      ctx.moveTo(x - r * 0.4, cy - r * 0.86);
      ctx.lineTo(x - r * 0.6, cy - r * 1.45);
      ctx.moveTo(x + r * 0.4, cy - r * 0.86);
      ctx.lineTo(x + r * 0.6, cy - r * 1.45);
      ctx.stroke();
      fillDot(ctx, x - r * 0.6, cy - r * 1.5, lw * 0.9);
      fillDot(ctx, x + r * 0.6, cy - r * 1.5, lw * 0.9);
      drawFace(ctx, x, cy, r * 0.66, color, lw, 1);
    }
  }
  ctx.restore();
}

// ??????? ???????: ?????? ???????? ?????? ? ??????.
export function drawSpikyColumn(ctx, cx, top, w, h, color, t = 0) {
  const n = 4;
  const cell = h / n;
  const baseR = Math.min(w * 0.46, cell * 0.4);
  const lw = Math.max(2, baseR * 0.16);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 0; i < n; i++) {
    const cy = top + cell * (i + 0.5);
    const spikes = 13;
    const outer = baseR * 1.5;
    const inner = baseR * 0.92;
    const rot = i * 0.5 + Math.sin(t * 1.4 + i) * 0.04;
    // ???? ????? ????, ?????? � ??????? ??????.
    ctx.beginPath();
    for (let s = 0; s <= spikes * 2; s++) {
      const a = rot + (s * Math.PI) / spikes;
      const jitter = 1 + ((s * 7) % 5) * 0.03;
      const rr = (s % 2 ? outer * jitter : inner);
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr;
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.save();
    ctx.fillStyle = "#050505";
    ctx.fill();
    ctx.restore();
    ctx.stroke();
    drawFace(ctx, cx, cy, baseR * 0.72, color, lw, i % 2 === 0 ? 1 : -1);
  }
  ctx.restore();
}

// ???-???: ??????? ? ??????????-??????? ? ?????????. dir<0 � ????? ?????.
export function drawChip(ctx, x, y, r, color, dir = 0) {
  const lw = Math.max(2, r * 0.16);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // ????-???????.
  const s = r * 0.92;
  ctx.save();
  ctx.fillStyle = "#050505";
  ctx.fillRect(x - s, y - s, s * 2, s * 2);
  ctx.restore();
  ctx.strokeRect(x - s, y - s, s * 2, s * 2);

  // ???????? ?? ????? (?? 3 ? ?????? ???????) + ??????/????? ?? 2.
  const pin = r * 0.34;
  for (let i = -1; i <= 1; i++) {
    const py = y + i * s * 0.5;
    ctx.beginPath();
    ctx.moveTo(x - s, py);
    ctx.lineTo(x - s - pin, py);
    ctx.moveTo(x + s, py);
    ctx.lineTo(x + s + pin, py);
    ctx.stroke();
  }
  for (let i = -1; i <= 1; i += 2) {
    const px = x + i * s * 0.5;
    ctx.beginPath();
    ctx.moveTo(px, y - s);
    ctx.lineTo(px, y - s - pin * 0.8);
    ctx.moveTo(px, y + s);
    ctx.lineTo(px, y + s + pin * 0.8);
    ctx.stroke();
  }

  drawFace(ctx, x, y + s * 0.05, s * 0.62, color, lw * 0.9, 1);

  // ????? ???????? ?????? ????.
  if (dir !== 0) {
    const sgn = dir < 0 ? 1 : -1; // ????? ? ??????????????? ???????
    const bx = x + sgn * (s + pin + r * 0.5);
    ctx.lineWidth = lw * 0.8;
    for (let i = 0; i < 3; i++) {
      const ly = y + (i - 1) * s * 0.6;
      ctx.beginPath();
      ctx.moveTo(bx, ly);
      ctx.lineTo(bx + sgn * r * (0.7 + i * 0.0), ly);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ???-?????? (??????) ????? ?? speech-bubble.
export function drawBug(ctx, x, y, size, color = "#0c0c0c") {
  const lw = Math.max(2, size * 0.07);
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";

  // ?????.
  for (let i = -1; i <= 1; i++) {
    const bx = i * size * 0.34;
    ctx.beginPath();
    ctx.moveTo(bx, size * 0.28);
    ctx.lineTo(bx - size * 0.12, size * 0.62);
    ctx.moveTo(bx, size * 0.28);
    ctx.lineTo(bx + size * 0.12, size * 0.62);
    ctx.stroke();
  }
  // ?????.
  ctx.beginPath();
  ctx.moveTo(-size * 0.22, -size * 0.3);
  ctx.lineTo(-size * 0.4, -size * 0.62);
  ctx.moveTo(size * 0.22, -size * 0.3);
  ctx.lineTo(size * 0.4, -size * 0.62);
  ctx.stroke();
  fillDot(ctx, -size * 0.4, -size * 0.66, lw * 1.1);
  fillDot(ctx, size * 0.4, -size * 0.66, lw * 1.1);

  // ???? (????).
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.6, size * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  // ????? ???? ?? ?????? ????.
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = lw * 0.8;
  fillDot(ctx, -size * 0.18, -size * 0.05, lw * 0.9);
  fillDot(ctx, size * 0.18, -size * 0.05, lw * 0.9);
  ctx.beginPath();
  ctx.arc(0, size * 0.0, size * 0.26, 0.12 * Math.PI, 0.88 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

// ????-?????? 8???: ?????? ?????????? ??????-�???????� ? ???????? ? ?????.
export function drawLogoCreature(ctx, x, y, size, color = "#0c0c0c") {
  const px = size / 8; // 8-?????????? ?????
  ctx.save();
  ctx.translate(x - size / 2, y - size / 2);
  ctx.fillStyle = color;

  // ?????? ?????????? ??????? (8x8), 1 � ??????????? ???????.
  const grid = [
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 1, 1, 0, 1, 1],
  ];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (grid[r][c]) ctx.fillRect(c * px, r * px, px + 0.5, px + 0.5);
    }
  }
  // ??????? ??????.
  ctx.fillRect(3.5 * px, -1.4 * px, px, 1.4 * px);
  ctx.beginPath();
  ctx.arc(4 * px, -1.4 * px, px * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ---- ??????? ?????????? ????? ??? ????? (5x7) ----
const DIGITS = {
  0: ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  1: ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  2: ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  3: ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  4: ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  5: ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  6: ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  7: ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  8: ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  9: ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
};

// ?????????? ????? (??????) ???????? ?????????. cell � ?????? ???????.
// (cx, cy) � ????? ????? ?????.
export function drawPixelNumber(ctx, str, cx, cy, cell, color) {
  const chars = String(str).split("");
  const glyphW = 5 * cell;
  const glyphH = 7 * cell;
  const gap = cell * 1.6;
  const totalW = chars.length * glyphW + (chars.length - 1) * gap;
  let x = cx - totalW / 2;
  const y = cy - glyphH / 2;
  ctx.save();
  ctx.fillStyle = color;
  for (const ch of chars) {
    const g = DIGITS[ch];
    if (g) {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 5; c++) {
          if (g[r][c] === "1") {
            ctx.fillRect(x + c * cell, y + r * cell, cell + 0.5, cell + 0.5);
          }
        }
      }
    }
    x += glyphW + gap;
  }
  ctx.restore();
}

// Горизонтальная гусеница для standby экрана (ползет слева направо)
export function drawHorizontalCaterpillar(ctx, x, y, segR, color, t = 0, segmentCount = 12) {
  const lw = Math.max(2, segR * 0.14);
  const step = segR * 1.4;
  
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Рисуем сегменты справа налево (голова впереди)
  for (let i = segmentCount - 1; i >= 0; i--) {
    const cx = x + i * step;
    const wig = Math.sin(t * 3 + i * 0.5) * segR * 0.08;
    const cy = y + wig;
    const r = i === 0 ? segR * 1.15 : segR;
    
    // Ножки (кроме головы)
    if (i > 0) {
      ctx.beginPath();
      ctx.moveTo(cx, cy + r * 0.7);
      ctx.lineTo(cx - segR * 0.25, cy + r + segR * 0.4);
      ctx.moveTo(cx, cy + r * 0.7);
      ctx.lineTo(cx + segR * 0.25, cy + r + segR * 0.4);
      ctx.stroke();
    }
  }

  // Сегменты тела
  for (let i = segmentCount - 1; i >= 0; i--) {
    const cx = x + i * step;
    const wig = Math.sin(t * 3 + i * 0.5) * segR * 0.08;
    const cy = y + wig;
    const r = i === 0 ? segR * 1.15 : segR;

    // Черная заливка
    ctx.save();
    ctx.fillStyle = "#050505";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Белый контур
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Голова - усики и лицо
    if (i === 0) {
      // Усики
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.4, cy - r * 0.7);
      ctx.lineTo(cx - r * 0.8, cy - r * 1.3);
      ctx.moveTo(cx + r * 0.4, cy - r * 0.7);
      ctx.lineTo(cx + r * 0.8, cy - r * 1.3);
      ctx.stroke();
      
      // Шарики на усиках
      ctx.beginPath();
      ctx.arc(cx - r * 0.8, cy - r * 1.35, lw * 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + r * 0.8, cy - r * 1.35, lw * 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Лицо
      drawFace(ctx, cx, cy, r * 0.6, color, lw, 1);
    }
  }
  
  ctx.restore();
}

// Рисование звезды.
export function drawStar(ctx, x, y, r, color, lw) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.42 : r;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}
