/**
 * main.js
 * Entry point. Initialises the camera and runs the main analysis loop.
 * Ties together color detection (color.js), aura rendering (aura.js),
 * and doodle drawing (doodle.js).
 */

// ── Elements ──────────────────────────────────────────────────────────────────
const videoEl     = document.getElementById('video');
const analysisCanvas = document.getElementById('canvas');
const analysisCtx = analysisCanvas.getContext('2d');
const phEl        = document.getElementById('ph');
const doodlePanelEl = document.getElementById('doodlePanel');
const doodleCanvasEl = document.getElementById('doodleCanvas');
const doodleCtx   = doodleCanvasEl.getContext('2d');
const dbgEl       = document.getElementById('dbg');

// Low-res analysis canvas — matches oval aspect ratio (1:2.15)
analysisCanvas.width  = 48;
analysisCanvas.height = 103;

// ── Thresholds ────────────────────────────────────────────────────────────────
const PERSON_ON_THRESH  = 0.09; // skin ratio to trigger aura ON
const PERSON_OFF_THRESH = 0.05; // skin ratio to trigger aura OFF

// ── State ─────────────────────────────────────────────────────────────────────
let presenceSmooth  = 0;
let auraActive      = false;
let smoothHue       = 225;
let targetHue       = 225;
let lastZoneName    = '';
let doodleScheduled = false;

// ── Main analysis loop ────────────────────────────────────────────────────────
function loop() {
  const W = analysisCanvas.width;
  const H = analysisCanvas.height;

  analysisCtx.drawImage(videoEl, 0, 0, W, H);
  const frame = analysisCtx.getImageData(0, 0, W, H);
  const data  = frame.data;

  // 1. Person detection
  const skinRatio    = detectPerson(data, W, H);
  presenceSmooth     = presenceSmooth * 0.85 + skinRatio * 0.15;
  const personHere   = presenceSmooth > PERSON_ON_THRESH;
  const personGone   = presenceSmooth < PERSON_OFF_THRESH;

  if (personHere && !auraActive) {
    auraActive = true;
    auraShow();
    dbgEl.textContent = 'PERSON DETECTED';
  }

  if (personGone && auraActive) {
    auraActive    = false;
    lastZoneName  = '';
    doodleScheduled = false;
    auraHide();
    doodlePanelEl.classList.remove('show', 'pop');
    dbgEl.textContent = 'NO PERSON';
  }

  // 2. Clothing colour + aura render
  if (auraActive) {
    const rawHue = getClothingHue(data, W, H);

    if (rawHue !== null) {
      const zone = snapToZone(rawHue);
      targetHue = zone.center;
      dbgEl.textContent = `skin:${(presenceSmooth * 100).toFixed(0)}%  raw:${Math.round(rawHue)}° → ${zone.name} (${zone.center}°)`;

      // Trigger doodle when color zone changes
      if (zone.name !== lastZoneName && !doodleScheduled) {
        doodleScheduled = true;
        lastZoneName    = zone.name;
        const hex       = hslToHex(zone.center, 80, 48);

        setTimeout(() => {
          drawDoodle(doodleCtx, hex, zone.center);
          doodlePanelEl.classList.remove('pop');
          void doodlePanelEl.offsetWidth; // force reflow for animation restart
          doodlePanelEl.classList.add('show', 'pop');
          doodleScheduled = false;
        }, 400);
      }
    } else {
      // Neutral outfit (white/black/gray) → soft lavender aura
      targetHue = 260;
      dbgEl.textContent = `skin:${(presenceSmooth * 100).toFixed(0)}%  neutral outfit`;

      if (lastZoneName !== 'neutral' && !doodleScheduled) {
        doodleScheduled = true;
        lastZoneName    = 'neutral';
        setTimeout(() => {
          drawDoodle(doodleCtx, '#9b8ec4', 260);
          doodlePanelEl.classList.remove('pop');
          void doodlePanelEl.offsetWidth;
          doodlePanelEl.classList.add('show', 'pop');
          doodleScheduled = false;
        }, 400);
      }
    }

    // Smooth hue toward target and render
    smoothHue = lerpHue(smoothHue, targetHue);
    renderAura(smoothHue);
  }

  requestAnimationFrame(loop);
}

// ── Camera initialisation ─────────────────────────────────────────────────────
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 1280 } },
      audio: false,
    });
    videoEl.srcObject = stream;
    await videoEl.play();
    phEl.classList.add('hidden');
    requestAnimationFrame(loop);
  } catch (e) {
    phEl.textContent = 'allow camera access';
    console.error('Camera error:', e);
  }
}

startCamera();
