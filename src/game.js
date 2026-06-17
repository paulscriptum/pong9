// ===========================================================
// ПОНГ · 8БИТ — игровая физика (CORE).
// Класс PongGame: ракетки у левого/правого края ездят по вертикали,
// мяч отскакивает от верх/низ стенок и ракеток, угол отскока зависит
// от точки удара, скорость растёт с каждым ударом, счёт до targetScore.
//
// Система координат — логические CSS-пиксели поля (см. resize()):
//   x: 0 (левый край) .. width (правый край)
//   y: 0 (верх) .. height (низ)
// Игрок 0 — левая ракетка, игрок 1 — правая.
//
// Контракт API: resize(w,h), reset(dir), resetMatch(), setInput(),
// clearInput(), update(dt) -> events[], getState().
// ===========================================================

import BRAND from "./brand.js";
import { Sfx } from "./audio.js";

export class PongGame {
  constructor(cfg = BRAND.game) {
    this.cfg = cfg;
    this.width = 0;
    this.height = 0;
    this._sized = false;

    this.targetScore = cfg.targetScore;
    this.scores = [0, 0];
    this.over = false;
    this.winner = -1;
    this.lastScorer = -1;

    // Намерение движения каждой ракетки (удержание кнопок).
    this.input = [
      { up: false, down: false },
      { up: false, down: false },
    ];

    this.paddles = [
      { side: 0, x: 0, y: 0, w: cfg.paddleWidthPx, h: 0 },
      { side: 1, x: 0, y: 0, w: cfg.paddleWidthPx, h: 0 },
    ];

    this.ball = { x: 0, y: 0, vx: 0, vy: 0, r: cfg.ballRadiusPx, speed: 0 };
  }

  // Пересчёт размеров под текущее поле, с сохранением относительных позиций.
  resize(width, height) {
    const c = this.cfg;
    const newH = c.paddleHeightRatio * height;
    // Визуальные маскот-ракетки стоят глубже в поле, как в референсе.
    const mascotMargin = 0.24 * Math.min(width, height);
    const margin = Math.max(c.paddleMarginRatio * width, mascotMargin);

    for (let i = 0; i < 2; i++) {
      const p = this.paddles[i];
      const centerRatio = this._sized ? (p.y + p.h / 2) / this.height : 0.5;
      p.h = newH;
      p.w = c.paddleWidthPx;
      p.x = i === 0 ? margin : width - margin - p.w;
      p.y = centerRatio * height - p.h / 2;
      p.y = Math.max(0, Math.min(height - p.h, p.y));
    }

    const bxr = this._sized ? this.ball.x / this.width : 0.5;
    const byr = this._sized ? this.ball.y / this.height : 0.5;
    this.ball.r = c.ballRadiusPx;
    this.ball.x = bxr * width;
    this.ball.y = byr * height;

    this.width = width;
    this.height = height;
    this._sized = true;
  }

  // Сброс матча: счёт в ноль, ракетки по центру.
  resetMatch() {
    this.scores = [0, 0];
    this.over = false;
    this.winner = -1;
    this.lastScorer = -1;
    for (const p of this.paddles) p.y = this.height / 2 - p.h / 2;
    this.clearInput();
  }

  // Подача мяча из центра. dir: -1 — влево (к игроку 0), +1 — вправо (к игроку 1).
  reset(dir = Math.random() < 0.5 ? -1 : 1) {
    const c = this.cfg;
    const b = this.ball;
    b.x = this.width / 2;
    b.y = this.height / 2;
    b.speed = c.ballStartSpeedRatio * this.width;
    // Небольшой стартовый угол, чтобы подача не была строго горизонтальной.
    const angle = (Math.random() * 2 - 1) * c.maxBounceAngle * 0.35;
    b.vx = dir * b.speed * Math.cos(angle);
    b.vy = b.speed * Math.sin(angle);
  }

  setInput(player, dir, isDown) {
    const p = this.input[player];
    if (!p || (dir !== "up" && dir !== "down")) return;
    p[dir] = !!isDown;
  }

  clearInput() {
    for (const p of this.input) {
      p.up = false;
      p.down = false;
    }
  }

  update(dt) {
    const events = [];
    if (this.over) return events;
    this._movePaddles(dt);
    this._moveBall(dt, events);
    return events;
  }

  getState() {
    return {
      width: this.width,
      height: this.height,
      paddles: this.paddles,
      ball: this.ball,
      scores: this.scores,
      targetScore: this.targetScore,
      over: this.over,
      winner: this.winner,
      lastScorer: this.lastScorer,
    };
  }

  // ---- внутреннее ----

  _movePaddles(dt) {
    const sp = this.cfg.paddleSpeedRatio * this.height;
    for (let i = 0; i < 2; i++) {
      const inp = this.input[i];
      let d = 0;
      if (inp.up) d -= 1;
      if (inp.down) d += 1;
      if (d === 0) continue;
      const p = this.paddles[i];
      p.y += d * sp * dt;
      if (p.y < 0) p.y = 0;
      const max = this.height - p.h;
      if (p.y > max) p.y = max;
    }
  }

  _moveBall(dt, events) {
    const b = this.ball;
    // Сабстеппинг: не даём мячу «проскочить» ракетку на высокой скорости.
    const dist = Math.hypot(b.vx, b.vy) * dt;
    const steps = Math.max(1, Math.ceil(dist / (b.r * 0.8)));
    const sdt = dt / steps;

    for (let s = 0; s < steps; s++) {
      b.x += b.vx * sdt;
      b.y += b.vy * sdt;

      // Стенки (верх/низ).
      if (b.y - b.r < 0) {
        b.y = b.r;
        b.vy = -b.vy;
        Sfx.bounceWall();
        events.push({ type: "wall", x: b.x, y: b.r });
      } else if (b.y + b.r > this.height) {
        b.y = this.height - b.r;
        b.vy = -b.vy;
        Sfx.bounceWall();
        events.push({ type: "wall", x: b.x, y: this.height - b.r });
      }

      this._paddleCollide(events);

      // Гол.
      if (b.x + b.r < 0) {
        this._score(1, events);
        break;
      }
      if (b.x - b.r > this.width) {
        this._score(0, events);
        break;
      }
    }
  }

  _paddleCollide(events) {
    const b = this.ball;
    const p0 = this.paddles[0];
    if (
      b.vx < 0 &&
      b.x - b.r <= p0.x + p0.w &&
      b.x >= p0.x &&
      b.y >= p0.y - b.r &&
      b.y <= p0.y + p0.h + b.r
    ) {
      this._bounce(p0, +1, events);
      return;
    }
    const p1 = this.paddles[1];
    if (
      b.vx > 0 &&
      b.x + b.r >= p1.x &&
      b.x <= p1.x + p1.w &&
      b.y >= p1.y - b.r &&
      b.y <= p1.y + p1.h + b.r
    ) {
      this._bounce(p1, -1, events);
    }
  }

  _bounce(p, dirSign, events) {
    const b = this.ball;
    const c = this.cfg;
    let rel = (b.y - (p.y + p.h / 2)) / (p.h / 2);
    rel = Math.max(-1, Math.min(1, rel));
    const angle = rel * c.maxBounceAngle;

    b.speed = b.speed * c.ballSpeedup;
    b.vx = dirSign * b.speed * Math.cos(angle);
    b.vy = b.speed * Math.sin(angle);

    // Выталкиваем мяч из ракетки, чтобы не залипал.
    b.x = dirSign > 0 ? p.x + p.w + b.r : p.x - b.r;

    Sfx.bouncePaddle();
    events.push({ type: "paddle", x: b.x, y: b.y, player: p.side });
  }

  _score(scorer, events) {
    this.scores[scorer] += 1;
    this.lastScorer = scorer;
    Sfx.score();
    events.push({ type: "score", player: scorer });
    if (this.scores[scorer] >= this.targetScore) {
      this.over = true;
      this.winner = scorer;
    }
  }
}

export default PongGame;
