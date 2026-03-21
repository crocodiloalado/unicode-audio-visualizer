# Unicode Audio Visualizer

A real-time audio visualizer that renders music as animated Unicode characters on an HTML5 canvas. No dependencies, no build step — a single self-contained HTML file.

## Demo

Open `index.html` in any modern browser, or visit the live version via [GitHub Pages](../../).

## How to use

1. Open `index.html` in Chrome, Firefox, or Safari
2. Click **Carregar música** and pick an MP3, FLAC, WAV, or OGG file
3. Watch the visualization react to the audio in real time

No audio loaded? It runs in demo mode with simulated data.

## How it works

The visualizer draws a 90 × 50 character grid on a canvas, updating ~60 fps via `requestAnimationFrame`.

**Audio analysis** — Web Audio API (`AnalyserNode`, FFT size 2048) extracts bass, mid, and high frequency bands. Beat detection fires on bass threshold spikes. All values are exponentially smoothed.

**Character layers** — 6 Unicode sets, each mapped to an audio band and a base hue:

| Layer | Characters | Hue |
|-------|-----------|-----|
| Circles | `·∘○◎●` | Cyan 170° |
| Shading | `░▒▓█▪` | Magenta 300° |
| Braille | `⠂⠆⠇⠿⣿` | Blue 210° |
| Box drawing | `╌╍═╬▓` | Yellow 50° |
| Sparkles | `∙∗✦✧✶` | Orange 20° |
| Bars | `▁▂▃▅▇` | Green 120° |

**Color dynamics** — `spectralWarmth` shifts all hues ±15° based on bass/treble balance. `spectralDensity` boosts saturation and brightness on dense passages. Loud moments are visibly brighter.

## Files

```
index.html        ← the entire app
docs/
  research.md     ← technical research notes (PT)
versions/
  v00–v05.html    ← development history
```

## Requirements

Any browser with Web Audio API support (Chrome 66+, Firefox 76+, Safari 14.1+).
