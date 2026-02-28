# 🎨 Aura Camera

An interactive art installation that reads your outfit's color and generates a personalized aura glow around you — plus a hand-drawn doodle of your silhouette.

Built for a project exploring **the self through code**: the piece responds to whoever stands in front of it, making each person's aura unique to what they're wearing in that moment.

---

## How it works

1. **Allow Web Cam Access** — point it at yourself, standing ~2-3ft back
2. **Person detection** — skin-tone pixels in the face zone confirm someone is present
3. **Clothing color extraction** — the torso region is sampled in HSV color space, filtered to remove skin/background/gray, and the dominant hue is extracted
4. **Aura rendering** — 4 concentric glow rings are painted with offset harmonious hues, creating a dramatic rainbow-edge effect
5. **Doodle** — a randomized hand-drawn figure appears in the outfit's color whenever a new person steps in
6. **Empty frame** — aura disappears completely when no one is detected

---

## Color zones

Raw detected hues are snapped to 8 bold canonical zones:

| Zone   | Hue range |
|--------|-----------|
| Red    | 330–18°   |
| Orange | 18–44°    |
| Yellow | 44–72°    |
| Green  | 72–165°   |
| Teal   | 165–200°  |
| Blue   | 200–265°  |
| Purple | 265–310°  |
| Pink   | 310–330°  |

Neutral outfits (white/black/gray) get a soft lavender aura.

---

## Running locally

No build step needed — it's plain HTML/CSS/JS.

```bash
# Option 1: Python server (recommended — camera requires http/https)
python3 -m http.server 8000
# then open http://localhost:8000

# Option 2: VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

> ⚠️ Camera access requires either `localhost` or `https://`. Opening `index.html` directly as a `file://` URL may block camera access in some browsers.

---

## File structure

```
aura-cam/
├── index.html        # Entry point
├── README.md
└── src/
    ├── style.css     # All styles — layout, oval, glow rings, doodle panel
    ├── color.js      # HSV color detection (clothing hue + person detection)
    ├── doodle.js     # Hand-drawn figure generator
    ├── aura.js       # Glow ring rendering + hue smoothing
    └── main.js       # Camera init + main analysis loop
```

---

## Debug bar

A debug overlay in the top-left shows the raw detected hue and skin ratio in real time. To remove it for exhibition, delete the `<div id="dbg">` from `index.html` and `#dbg` from `style.css`.

---

## Tips for best results

- Stand **2–3 feet** from the camera so your torso fills the frame
- Works best with **solid colored clothing** — patterns still work but may average out
- Wear something colorful — white/black/gray triggers the neutral lavender aura
- Good lighting helps the color detection significantly
