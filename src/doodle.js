/**
 * doodle.js
 * Draws a randomized hand-drawn style figure onto the doodle canvas.
 * Each call uses a time+hue-seeded random so the same color gives a
 * different pose every time a new person steps into frame.
 */

let _seed = 1;
const rand = () => {
  _seed = (_seed * 16807) % 2147483647;
  return (_seed - 1) / 2147483646;
};

/**
 * Draw a wobbly sketch line using a quadratic bezier.
 */
function sk(ctx, x1, y1, x2, y2, w = 2) {
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x1 + (rand() - .5) * 1.5, y1 + (rand() - .5) * 1.5);
  ctx.quadraticCurveTo(
    (x1 + x2) / 2 + (rand() - .5) * 5,
    (y1 + y2) / 2 + (rand() - .5) * 5,
    x2 + (rand() - .5) * 1.5,
    y2 + (rand() - .5) * 1.5
  );
  ctx.stroke();
}

/**
 * Draw a full doodle figure onto the given canvas context.
 *
 * @param {CanvasRenderingContext2D} ctx  - doodle canvas context
 * @param {string}  hex  - outfit color as hex string
 * @param {number}  hue  - hue in degrees (used to seed the random pose)
 */
function drawDoodle(ctx, hex, hue) {
  // Seed ensures same hue → different pose each call (time-based variation)
  _seed = (Math.round(hue) * 17 + Date.now() % 9999) || 1;

  const W = ctx.canvas.width;   // 85
  const H = ctx.canvas.height;  // 130

  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = hex;
  ctx.fillStyle   = hex;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';

  // ── Layout ──────────────────────────────────────────────────────────────────
  const cx    = 42 + (rand() - .5) * 4;
  const lean  = (rand() - .5) * 4;
  const hY    = 14;              // head centre y
  const hRx   = 10, hRy = 12;   // head radii x/y
  const shY   = hY + hRy + 5;   // shoulder y
  const hipY  = shY + 32;
  const knY   = hipY + 26;
  const ftY   = knY + 24;
  const shW   = 15 + rand() * 4; // shoulder half-width
  const hipW  = 10 + rand() * 3; // hip half-width

  // ── Head ────────────────────────────────────────────────────────────────────
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 24; i++) {
    const t = (i / 24) * Math.PI * 2;
    const x = cx + lean * .3 + (hRx + (rand() - .5) * .7) * Math.cos(t);
    const y = hY  +             (hRy + (rand() - .5) * .7) * Math.sin(t);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  // ── Face ────────────────────────────────────────────────────────────────────
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(cx + lean * .3 - 3.8, hY - 2, 1.2, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx + lean * .3 + 3.8, hY - 2, 1.2, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + lean * .3 - 3, hY + 4);
  ctx.quadraticCurveTo(cx + lean * .3, hY + 7.5, cx + lean * .3 + 3, hY + 4);
  ctx.stroke();

  // ── Neck ────────────────────────────────────────────────────────────────────
  sk(ctx, cx + lean * .3 - 2, hY + hRy, cx + lean * .5 - 2, shY, .9);
  sk(ctx, cx + lean * .3 + 2, hY + hRy, cx + lean * .5 + 2, shY, .9);

  // ── Torso (filled outfit shape) ──────────────────────────────────────────────
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + lean - shW,  shY);
  ctx.lineTo(cx + lean + shW,  shY);
  ctx.lineTo(cx + lean + hipW, hipY);
  ctx.lineTo(cx + lean - hipW, hipY);
  ctx.closePath();
  ctx.globalAlpha = 0.28; ctx.fill();
  ctx.globalAlpha = 1;    ctx.stroke();

  // ── Arms ────────────────────────────────────────────────────────────────────
  const pose = Math.floor(rand() * 3); // 0=down, 1=out, 2=on-hip
  const aLx  = pose === 1 ? cx + lean - shW - 5 : pose === 2 ? cx + lean - shW - 7 : cx + lean - shW + 2;
  const aRx  = pose === 1 ? cx + lean + shW + 5 : pose === 2 ? cx + lean + shW + 7 : cx + lean + shW - 2;
  const aY   = pose === 2 ? hipY - 4 : hipY + 2;
  sk(ctx, cx + lean - shW, shY + 3, aLx, aY, 2);
  sk(ctx, cx + lean + shW, shY + 3, aRx, aY, 2);
  ctx.beginPath(); ctx.arc(aLx, aY + 2, 2.2, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(aRx, aY + 2, 2.2, 0, Math.PI * 2); ctx.stroke();

  // ── Legs ────────────────────────────────────────────────────────────────────
  const lX = cx + lean - hipW * .4;
  const rX = cx + lean + hipW * .4;
  sk(ctx, lX, hipY, lX - 3, knY, 2); sk(ctx, lX - 3, knY, lX - 4, ftY, 2);
  sk(ctx, rX, hipY, rX + 3, knY, 2); sk(ctx, rX + 3, knY, rX + 4, ftY, 2);
  sk(ctx, lX - 4, ftY, lX - 11, ftY + 2, 1.2);
  sk(ctx, rX + 4, ftY, rX + 11, ftY + 2, 1.2);

  // ── Collar detail ───────────────────────────────────────────────────────────
  ctx.lineWidth = 1.2;
  if (rand() > .5) {
    sk(ctx, cx + lean - 3, shY + 1, cx + lean, shY + 8, .9);
    sk(ctx, cx + lean + 3, shY + 1, cx + lean, shY + 8, .9);
  } else {
    ctx.beginPath();
    ctx.arc(cx + lean, shY + 3, 4.5, Math.PI + .4, Math.PI * 2 - .4);
    ctx.stroke();
  }
}
