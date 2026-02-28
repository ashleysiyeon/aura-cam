/**
 * aura.js
 * Handles all aura glow rendering.
 * Applies dramatic multi-hue radial gradients to the four glow rings.
 */

const glowEls = [1, 2, 3, 4].map(i => document.getElementById('g' + i));
const shineEl = document.getElementById('shine');

/**
 * Turn aura on — adds .on class to all glow rings.
 */
function auraShow() {
  glowEls.forEach(g => g.classList.add('on'));
}

/**
 * Turn aura off — removes .on class and clears shine.
 */
function auraHide() {
  glowEls.forEach(g => g.classList.remove('on'));
  shineEl.style.opacity = '0';
}

/**
 * Render the aura gradient for a given smoothed hue.
 * Uses four offset hues across the rings to create a rainbow-edge effect.
 *
 * @param {number} h - display hue in degrees (0-360)
 */
function renderAura(h) {
  const h2 = (h + 55)  % 360;
  const h3 = (h + 115) % 360;
  const h4 = (h + 175) % 360;
  const s  = 90;
  const lA = 70, lB = 80;

  glowEls[0].style.background = `radial-gradient(ellipse 55% 88% at 50% 50%,
    hsl(${h2},${s}%,${lB}%) 0%,
    hsl(${h3},${s}%,${lB}%) 40%,
    hsl(${h4},${s - 8}%,${lB}%) 70%,
    transparent 90%)`;

  glowEls[1].style.background = `radial-gradient(ellipse 55% 88% at 50% 50%,
    hsl(${h},${s}%,${lA}%) 0%,
    hsl(${h2},${s}%,${lB}%) 55%,
    hsl(${h3},${s}%,${lB}%) 80%,
    transparent 95%)`;

  glowEls[2].style.background = `radial-gradient(ellipse 50% 82% at 50% 50%,
    hsl(${h4},${s}%,${lB}%) 0%,
    hsl(${h},${s}%,${lA}%) 60%,
    transparent 88%)`;

  glowEls[3].style.background = `radial-gradient(ellipse 45% 75% at 50% 50%,
    hsl(${h3},${s}%,${lA}%) 0%,
    hsl(${h4},${s}%,${lB}%) 65%,
    transparent 90%)`;

  shineEl.style.opacity    = '0.22';
  shineEl.style.background = `radial-gradient(ellipse at 50% 30%, hsl(${h},50%,96%) 0%, transparent 65%)`;
}

/**
 * Smoothly advance the display hue toward a target hue.
 * Handles 0/360° wraparound correctly.
 *
 * @param {number} current - current smoothed hue
 * @param {number} target  - target hue
 * @param {number} speed   - lerp speed (0-1), default 0.07
 * @returns {number} updated hue
 */
function lerpHue(current, target, speed = 0.07) {
  let diff = target - current;
  if (diff > 180)  diff -= 360;
  if (diff < -180) diff += 360;
  return (current + diff * speed + 360) % 360;
}
