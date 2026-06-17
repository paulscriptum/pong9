// Калибровка головы гусеницы по кадрам standby_worm.webm (1920×1080).
export const STANDBY_WORM_HEAD_TRACK = [
  [0.1, 0.9944, 0.7914],
  [0.3, 0.9797, 0.7928],
  [0.5, 0.9534, 0.7987],
  [0.7, 0.927, 0.8044],
  [0.9, 0.9009, 0.8078],
  [1.1, 0.8753, 0.8065],
  [1.3, 0.8499, 0.8003],
  [1.5, 0.825, 0.7928],
  [1.7, 0.7999, 0.7878],
  [1.9, 0.7739, 0.7885],
  [2.1, 0.7474, 0.7928],
  [2.3, 0.7212, 0.7987],
  [2.5, 0.6947, 0.8044],
  [2.7, 0.6686, 0.8079],
  [2.9, 0.643, 0.807],
  [3.1, 0.6175, 0.802],
  [3.3, 0.5922, 0.7955],
  [3.5, 0.5672, 0.7899],
  [3.7, 0.5417, 0.7876],
  [3.9, 0.5156, 0.7896],
  [4.1, 0.4891, 0.7947],
  [4.3, 0.4628, 0.8007],
  [4.5, 0.4364, 0.806],
  [4.7, 0.4106, 0.8082],
  [4.9, 0.3848, 0.8056],
  [5.1, 0.3598, 0.7994],
  [5.3, 0.3347, 0.7928],
  [5.5, 0.3094, 0.7882],
  [5.7, 0.2838, 0.7881],
  [5.9, 0.2573, 0.7919],
  [6.1, 0.2307, 0.7977],
  [6.3, 0.2045, 0.8036],
  [6.5, 0.1784, 0.8076],
  [6.7, 0.1525, 0.8074],
  [6.9, 0.1271, 0.802],
  [7.1, 0.1021, 0.7946],
  [7.3, 0.0771, 0.7889],
  [7.5, 0.0515, 0.7878],
  [7.7, 0.025, 0.7911],
  [7.9, 0.0041, 0.7968],
];
export const STANDBY_WORM_TRACK_START = 0.1;
export const STANDBY_WORM_TRACK_END = 7.9;

export function sampleWormHead(time) {
  const track = STANDBY_WORM_HEAD_TRACK;
  if (!track.length) return null;
  const t = Math.max(0, time);
  if (t <= track[0][0]) return { x: track[0][1], y: track[0][2] };
  if (t >= track[track.length - 1][0]) return { x: track[track.length - 1][1], y: track[track.length - 1][2] };
  for (let i = 0; i < track.length - 1; i++) {
    const [t0, x0, y0] = track[i];
    const [t1, x1, y1] = track[i + 1];
    if (t >= t0 && t <= t1) {
      const f = (t1 - t0) > 0 ? (t - t0) / (t1 - t0) : 0;
      return { x: x0 + (x1 - x0) * f, y: y0 + (y1 - y0) * f };
    }
  }
  return null;
}

// object-fit: cover — как у #standby-worm в CSS.
export function mapVideoNormToScreen(nx, ny, videoW, videoH, screenW, screenH) {
  const scale = Math.max(screenW / videoW, screenH / videoH);
  const drawnW = videoW * scale;
  const drawnH = videoH * scale;
  const ox = (screenW - drawnW) * 0.5;
  const oy = (screenH - drawnH) * 0.5;
  return { x: ox + nx * drawnW, y: oy + ny * drawnH };
}
