// Canvas Utilities, Photo Capture & 300 DPI Exporter

export const STICKERS = {
  heart: { html: '<svg viewBox="0 0 24 24"><path d="M12 20.5 C 6.2 16 3.5 12.6 3.5 9.2 C3.5 6.6 5.5 4.9 7.9 4.9 C9.6 4.9 11.1 5.8 12 7.2 C12.9 5.8 14.4 4.9 16.1 4.9 C18.5 4.9 20.5 6.6 20.5 9.2 C20.5 12.6 17.8 16 12 20.5 Z" fill="#C13A2E" stroke="#8E2F26" stroke-width="1.4"/></svg>' },
  star:  { html: '<svg viewBox="0 0 24 24"><path d="M12 1.5 14.2 9.8 22.5 12 14.2 14.2 12 22.5 9.8 14.2 1.5 12 9.8 9.8Z" fill="#C13A2E"/></svg>' },
  note:  { html: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="1.2" fill="#F8F3E6" stroke="#3A362F" stroke-width="1.4"/><path d="M6.5 9.3 c2.5 -1.1 5 .9 7.5 0 m-7.5 3.4 c2.5 -1.1 5 .9 7.5 0 m-7.5 3.4 c2.5 -1.1 5 .9 7.5 0" fill="none" stroke="#3A362F" stroke-width="1.3" stroke-linecap="round"/></svg>' },
  arrow: { html: '<svg viewBox="0 0 24 24"><path d="M3 16 C 8 8 15 6 21 9 M17 5.5 l4.5 3.5 -5 3" fill="none" stroke="#C13A2E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
  tape:  { html: '<svg viewBox="0 0 24 24"><g transform="rotate(-8 12 12)"><rect x="4" y="8.5" width="16" height="7" fill="rgba(238,234,222,.85)" stroke="rgba(90,85,70,.4)" stroke-width="1" stroke-dasharray="3 2"/></g></svg>' },
  xoxo:  { html: '<svg viewBox="0 0 24 24"><text x="12" y="17" text-anchor="middle" font-family="Caveat, cursive" font-size="15" fill="#C13A2E">xoxo</text></svg>' }
};

export const STK_KEYS = ['heart', 'star', 'note', 'arrow', 'tape', 'xoxo'];

export const FILTERS = [
  { id: 'original', name: 'ORIGINAL', css: 'none', grain: 0, vig: .22 },
  { id: 'warm',     name: 'WARM',     css: 'sepia(.12) saturate(1.04) contrast(1.02)', grain: 0, vig: .26 },
  { id: 'vintage',  name: 'VINTAGE',  css: 'sepia(.45) saturate(.72) contrast(.94) brightness(1.07)', grain: .06, vig: .3 },
  { id: 'grain',    name: 'GRAIN',    css: 'contrast(.94) brightness(1.05)', grain: .18, vig: .26 },
  { id: 'mono',     name: 'MONO',     css: 'grayscale(1) contrast(1.07) brightness(1.02)', grain: .05, vig: .3 },
  { id: 'noir',     name: 'NOIR',     css: 'grayscale(1) contrast(1.32) brightness(.94)', grain: .1, vig: .5 }
];

export function createGrainNoiseCanvas() {
  if (typeof document === 'undefined') return null;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 140;
  const x = cv.getContext('2d');
  if (!x) return null;
  const d = x.createImageData(140, 140);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = 180 + Math.random() * 75 | 0;
    d.data[i] = v; d.data[i + 1] = v; d.data[i + 2] = v; d.data[i + 3] = 255;
  }
  x.putImageData(d, 0, 0);
  return cv;
}

export function coverInto(ctx, src, sw, sh, dx, dy, dw, dh, mirror = false) {
  if (!src || !sw || !sh || !dw || !dh) return;
  const srcRatio = sw / sh;
  const dstRatio = dw / dh;
  let sx = 0, sy = 0, sWidth = sw, sHeight = sh;

  if (srcRatio > dstRatio) {
    sWidth = sh * dstRatio;
    sx = (sw - sWidth) / 2;
    sy = 0;
    sHeight = sh;
  } else {
    sHeight = sw / dstRatio;
    sx = 0;
    sy = (sh - sHeight) / 2;
    sWidth = sw;
  }

  ctx.save();
  if (mirror) {
    ctx.translate(dx + dw, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(src, sx, sy, sWidth, sHeight, 0, 0, dw, dh);
  } else {
    ctx.drawImage(src, sx, sy, sWidth, sHeight, dx, dy, dw, dh);
  }
  ctx.restore();
}

export function manualTone(x, W, H, f) {
  if (f.id === 'mono' || f.id === 'noir') {
    x.globalCompositeOperation = 'saturation'; x.fillStyle = '#808080'; x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = 'overlay'; x.fillStyle = f.id === 'noir' ? '#6E6E70' : '#B4B4B4'; x.fillRect(0, 0, W, H);
  } else if (f.id === 'vintage') {
    x.globalCompositeOperation = 'multiply'; x.fillStyle = 'rgba(232,200,150,.28)'; x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = 'screen'; x.fillStyle = 'rgba(255,248,230,.10)'; x.fillRect(0, 0, W, H);
  } else if (f.id === 'grain') {
    x.globalCompositeOperation = 'screen'; x.fillStyle = 'rgba(255,252,244,.10)'; x.fillRect(0, 0, W, H);
  } else if (f.id === 'warm') {
    x.globalCompositeOperation = 'multiply'; x.fillStyle = 'rgba(248,238,220,.16)'; x.fillRect(0, 0, W, H);
  }
  x.globalCompositeOperation = 'source-over';
}

function drawStarPath(x, cx, cy, r) {
  x.beginPath(); x.moveTo(cx, cy - r);
  x.quadraticCurveTo(cx, cy, cx + r, cy); x.quadraticCurveTo(cx, cy, cx, cy + r);
  x.quadraticCurveTo(cx, cy, cx - r, cy); x.quadraticCurveTo(cx, cy, cx, cy - r);
  x.closePath();
}

function drawStickerCanvas(x, type, cx, cy, s, rot) {
  x.save(); x.translate(cx, cy); x.rotate(rot * Math.PI / 180);
  x.lineJoin = 'round'; x.lineCap = 'round';
  if (type === 'heart') {
    x.beginPath();
    x.moveTo(0, s * .9);
    x.bezierCurveTo(-s * 1.1, s * .2, -s * 1.05, -s * .55, -s * .5, -s * .55);
    x.bezierCurveTo(-s * .2, -s * .55, 0, -s * .3, 0, -s * .05);
    x.bezierCurveTo(0, -s * .3, s * .2, -s * .55, s * .5, -s * .55);
    x.bezierCurveTo(s * 1.05, -s * .55, s * 1.1, s * .2, 0, s * .9);
    x.closePath();
    x.fillStyle = '#C13A2E'; x.fill();
    x.strokeStyle = '#8E2F26'; x.lineWidth = Math.max(2, s * .09); x.stroke();
  } else if (type === 'star') {
    x.fillStyle = '#C13A2E'; drawStarPath(x, 0, 0, s * .95); x.fill();
  } else if (type === 'note') {
    const w = s * 1.7, h = s * 1.25;
    x.fillStyle = '#F8F3E6'; x.strokeStyle = '#3A362F'; x.lineWidth = Math.max(1.6, s * .075);
    x.beginPath(); x.rect(-w / 2, -h / 2, w, h); x.fill(); x.stroke();
    x.beginPath();
    x.moveTo(-w * .32, -h * .18); x.bezierCurveTo(-w * .1, -h * .34, w * .1, -h * .02, w * .32, -h * .18);
    x.moveTo(-w * .32, h * .14);  x.bezierCurveTo(-w * .1, -h * .02, w * .1, h * .3, w * .32, h * .14);
    x.stroke();
  } else if (type === 'arrow') {
    x.strokeStyle = '#C13A2E'; x.lineWidth = Math.max(2, s * .11);
    x.beginPath();
    x.moveTo(-s, -s * .45);
    x.bezierCurveTo(-s * .3, -s * .75, s * .4, -s * .7, s, -s * .35);
    x.stroke();
    x.beginPath();
    x.moveTo(s * .55, -s * .8); x.lineTo(s, -s * .35); x.lineTo(s * .35, -s * .05);
    x.stroke();
  } else if (type === 'tape') {
    x.rotate(-.14);
    const w = s * 1.9, h = s * .8;
    x.fillStyle = 'rgba(238,234,222,.85)';
    x.fillRect(-w / 2, -h / 2, w, h);
    x.strokeStyle = 'rgba(90,85,70,.4)'; x.lineWidth = 1.5; x.setLineDash([4, 3]);
    x.strokeRect(-w / 2, -h / 2, w, h); x.setLineDash([]);
  } else if (type === 'xoxo') {
    x.fillStyle = '#C13A2E';
    x.font = `${Math.round(s * 1.05)}px Caveat, cursive`;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('xoxo', 0, 0);
  }
  x.restore();
}

export async function generateStripCanvas(photos, dateStr, filterName, isStudio, roomCode, noiseCv, isSolo = false) {
  try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
  const k = 2;
  const W = 360 * k; // 720px wide
  const pad = 20 * k;
  const pw = W - 2 * pad;
  const phh = Math.round(pw * (540 / 960)); // 360px photo height
  const capH = 40 * k;
  const head = 36 * k;
  const foot = 32 * k;
  const gap = 16 * k;
  const H = Math.round(head + photos.length * (phh + capH + gap) + foot + 16 * k);

  const soloActive = isSolo || roomCode === 'SOLO' || (roomCode && roomCode.startsWith('SOLO'));

  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = '#FFFEFA'; x.fillRect(0, 0, W, H);

  x.fillStyle = '#32302B'; x.font = `${13 * k}px Staatliches, sans-serif`;
  x.textAlign = 'left'; x.fillText(soloActive ? 'SOLO' : 'DUET', pad, head - 10 * k);
  x.textAlign = 'right'; x.fillText('PHOTO BOOTH', W - pad, head - 10 * k);
  x.fillStyle = '#C13A2E'; drawStarPath(x, W / 2, head - 14 * k, 7 * k); x.fill();
  x.textAlign = 'center';

  photos.forEach((p, i) => {
    const y = head + i * (phh + capH + gap);
    if (p.canvas) {
      x.drawImage(p.canvas, 0, 0, 960, 540, pad, y, pw, phh);
    }
    (p.stickers || []).forEach(s => {
      drawStickerCanvas(x, s.type, pad + s.x * pw, y + s.y * phh, pw * .085, s.r);
    });
    if (p.caption) {
      x.fillStyle = '#38352F';
      x.font = `${18 * k}px Caveat, cursive`;
      x.fillText(p.caption, W / 2, y + phh + capH * .7);
    }
  });

  x.fillStyle = '#7A766D'; x.font = `${10 * k}px "Special Elite", monospace`;
  x.fillText(`PHOTO BOOTH · ${dateStr} · TONE ${filterName}${isStudio ? ' · ONE FRAME' : ''} · ${soloActive ? 'SOLO' : 'ROOM ' + roomCode}`, W / 2, H - 14 * k);
  
  if (noiseCv) {
    x.globalCompositeOperation = 'overlay'; x.globalAlpha = .07; x.drawImage(noiseCv, 0, 0, W, H);
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  }
  x.strokeStyle = 'rgba(55,53,48,.3)'; x.lineWidth = k * 1.5; x.strokeRect(1, 1, W - 2, H - 2);

  return c;
}

export async function getStripBlob(photos, dateStr, filterName, isStudio, roomCode, noiseCv, isSolo = false) {
  const canvas = await generateStripCanvas(photos, dateStr, filterName, isStudio, roomCode, noiseCv, isSolo);
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

export async function downloadStripPNG(photos, dateStr, filterName, isStudio, roomCode, noiseCv, isSolo = false) {
  const c = await generateStripCanvas(photos, dateStr, filterName, isStudio, roomCode, noiseCv, isSolo);
  const a = document.createElement('a');
  const soloActive = isSolo || roomCode === 'SOLO' || (roomCode && roomCode.startsWith('SOLO'));
  a.download = `${soloActive ? 'solo' : 'duet'}-strip-${roomCode}-${Date.now()}.png`;
  a.href = c.toDataURL('image/png');
  a.click();
}
