/**
 * color.js
 * HSV-based color detection for clothing and skin tones.
 * HSV is used instead of HSL because it gives much more accurate
 * hue readings for real-world camera colors.
 */

/**
 * Convert RGB (0-255) to HSV.
 * @returns {[number, number, number]} [hue 0-360, saturation 0-1, value 0-1]
 */
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d > 0) {
    if      (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else                h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, max === 0 ? 0 : d / max, max];
}

/**
 * Convert HSL to a hex color string.
 */
function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1))))).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Detect whether a person is in frame by looking for skin-tone pixels
 * in the face zone (top 28% of the canvas).
 *
 * @returns {number} ratio of skin pixels (0-1). > 0.09 = person present.
 */
function detectPerson(data, W, H) {
  const yA = Math.floor(H * 0.02);
  const yB = Math.floor(H * 0.28);
  let skin = 0, total = 0;

  for (let y = yA; y < yB; y++) {
    for (let x = Math.floor(W * 0.15); x < Math.floor(W * 0.85); x++) {
      const i = (y * W + x) * 4;
      const [h, sv, v] = rgbToHsv(data[i], data[i + 1], data[i + 2]);
      total++;
      // Skin: warm hue, moderate saturation, mid-to-high value
      const isSkin = (h <= 40 || h >= 340) && sv >= 0.10 && sv <= 0.68 && v >= 0.28 && v <= 0.97;
      if (isSkin) skin++;
    }
  }
  return skin / total;
}

/**
 * Extract the dominant clothing hue from the torso zone (y 30-72%).
 * Skips skin tones, near-white, near-black, and low-saturation pixels.
 *
 * @returns {number|null} raw hue in degrees (0-360), or null if no clear color found.
 */
function getClothingHue(data, W, H) {
  const yA = Math.floor(H * 0.30);
  const yB = Math.floor(H * 0.72);

  // 72 bins × 5° each = full 360° coverage
  const bins = new Float32Array(72);
  let total  = 0;

  for (let y = yA; y < yB; y++) {
    for (let x = 4; x < W - 4; x++) { // skip frame edges (background)
      const i = (y * W + x) * 4;
      const [h, sv, v] = rgbToHsv(data[i], data[i + 1], data[i + 2]);

      if (v  < 0.15) continue; // too dark
      if (v  > 0.97) continue; // near-white
      if (sv < 0.20) continue; // unsaturated / gray

      // Reject skin tones in HSV space
      if ((h <= 35 || h >= 340) && sv >= 0.15 && sv <= 0.65 && v >= 0.35 && v <= 0.95) continue;

      const bin = Math.floor(h / 5) % 72;
      // Weight by saturation² — vivid colors dominate dull ones
      const w = sv * sv * v;
      bins[bin] += w;
      total     += w;
    }
  }

  if (total < 8) return null;

  // Gaussian smooth across bins (handles hue spread in real fabrics)
  const sm = new Float32Array(72);
  const K  = [0.15, 0.2, 0.3, 1.0, 0.3, 0.2, 0.15];
  for (let i = 0; i < 72; i++) {
    let s = 0;
    for (let d = -3; d <= 3; d++) s += bins[(i + d + 72) % 72] * K[d + 3];
    sm[i] = s;
  }

  // Peak bin
  let peak = 0;
  for (let i = 1; i < 72; i++) if (sm[i] > sm[peak]) peak = i;

  // Weighted centroid around peak
  let wH = 0, wT = 0;
  for (let d = -4; d <= 4; d++) {
    const bi = (peak + d + 72) % 72;
    wH += (bi * 5 + 2.5) * sm[bi];
    wT += sm[bi];
  }

  return wT > 0 ? (wH / wT + 360) % 360 : peak * 5 + 2.5;
}

/**
 * Snap a raw hue to one of 8 bold canonical color zones.
 * Zones are tuned so blue (200-265°) is always Blue, not Green.
 *
 * @returns {{ name: string, center: number }} zone name and canonical hue center
 */
function snapToZone(raw) {
  const zones = [
    { name: 'Red',    center:   5, lo: 330, hi:  18 }, // wraps 0°
    { name: 'Orange', center:  28, lo:  18, hi:  44 },
    { name: 'Yellow', center:  58, lo:  44, hi:  72 },
    { name: 'Green',  center: 120, lo:  72, hi: 165 },
    { name: 'Teal',   center: 180, lo: 165, hi: 200 },
    { name: 'Blue',   center: 225, lo: 200, hi: 265 },
    { name: 'Purple', center: 280, lo: 265, hi: 310 },
    { name: 'Pink',   center: 325, lo: 310, hi: 330 },
  ];
  for (const z of zones) {
    if (z.lo > z.hi) { if (raw >= z.lo || raw < z.hi) return z; }
    else              { if (raw >= z.lo && raw < z.hi) return z; }
  }
  return zones[5]; // fallback: Blue
}
