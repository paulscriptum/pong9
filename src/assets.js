// SVG assets exported from Figma brandbook. They are drawn as images on canvas
// so the game keeps canvas-based physics while the visual layer stays asset-driven.

const SVG_DIR = "../assets/svg/????????/";

export const SVG_ASSETS = {
  logo: { file: "Group 2131330233.svg", w: 1208, h: 311 },
  titleStrip: { file: "Group 2131330040.svg", w: 535, h: 119 },
  spiky: { file: "Group 1171274544.svg", w: 233, h: 203 },
  smileBug: { file: "Group 1171274666.svg", w: 102, h: 66 },
  faceBug: { file: "Group 1171274569.svg", w: 63, h: 70 },
  chip: { file: "Group 2131329989.svg", w: 67, h: 37 },
  waveBug: { file: "Group 1171274571.svg", w: 78, h: 46 },
  tallMascot: { file: "Group 2131330293.svg", w: 400, h: 640 },
  bigSmile: { file: "Group 2131330228.svg", w: 410, h: 353 },
};

const imageCache = new Map();
const tintCache = new Map();

function assetURL(asset) {
  try {
    return new URL(`${SVG_DIR}${asset.file}`, import.meta.url).href;
  } catch (_) {
    return `assets/svg/????????/${asset.file}`;
  }
}

export function getSvgImage(key) {
  const asset = SVG_ASSETS[key];
  if (!asset || typeof Image === "undefined") return null;
  let img = imageCache.get(key);
  if (img) return img;
  img = new Image();
  img.decoding = "async";
  img.src = assetURL(asset);
  imageCache.set(key, img);
  return img;
}

export function preloadSvgAssets() {
  for (const key of Object.keys(SVG_ASSETS)) getSvgImage(key);
}

export function isSvgReady(key) {
  const img = getSvgImage(key);
  return !!img && img.complete && img.naturalWidth > 0;
}

function getTintedCanvas(key, color) {
  const img = getSvgImage(key);
  const asset = SVG_ASSETS[key];
  if (!asset || !isSvgReady(key) || typeof document === "undefined") return null;

  const cacheKey = `${key}|${color}`;
  let canvas = tintCache.get(cacheKey);
  if (canvas) return canvas;

  canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || asset.w;
  canvas.height = img.naturalHeight || asset.h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  tintCache.set(cacheKey, canvas);
  return canvas;
}

export function drawSvgAsset(ctx, key, cx, cy, boxW, boxH, opts = {}) {
  const asset = SVG_ASSETS[key];
  if (!asset || !ctx || !(boxW > 0) || !(boxH > 0)) return false;
  const source = opts.tint ? getTintedCanvas(key, opts.tint) : getSvgImage(key);
  if (!source || !isSvgReady(key)) return false;

  const naturalW = source.width || source.naturalWidth || asset.w;
  const naturalH = source.height || source.naturalHeight || asset.h;
  const crop = opts.crop || {};
  const sx = crop.x ?? 0;
  const sy = crop.y ?? 0;
  const sourceW = crop.w ?? naturalW;
  const sourceH = crop.h ?? naturalH;
  const fit = opts.cover ? Math.max(boxW / sourceW, boxH / sourceH) : Math.min(boxW / sourceW, boxH / sourceH);
  const w = sourceW * fit;
  const h = sourceH * fit;

  ctx.save();
  ctx.translate(cx, cy);
  if (opts.rotate) ctx.rotate(opts.rotate);
  if (opts.alpha != null) ctx.globalAlpha *= opts.alpha;
  if (opts.filter) ctx.filter = opts.filter;
  ctx.drawImage(source, sx, sy, sourceW, sourceH, -w / 2, -h / 2, w, h);
  ctx.restore();
  return true;
}

preloadSvgAssets();
