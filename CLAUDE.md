# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running

No build process. Open `unicode_visualizer.html` directly in any modern browser (Chrome, Firefox, Safari with Web Audio API support).

## Architecture

This is a **single self-contained HTML file** (~8.6 KB) with zero external dependencies. All logic lives inline in `unicode_visualizer.html`.

### Three main systems:

**Audio System** (`AudioContext`, `AnalyserNode`)
- Accepts MP3/FLAC/WAV/OGG via file input; decoded with `audioCtx.decodeAudioData()`
- FFT size 2048 → 256 usable bins; tracks smoothed bass/mid/high/amplitude values
- Beat detection via bass threshold spike; all values exponentially smoothed (factor ~0.1–0.22)
- Falls back to simulated FFT data (demo mode) when no audio is loaded

**Visual Renderer** (HTML5 Canvas 2D, monospace font)
- 90 × 50 character grid (adapts to screen size)
- 6 Unicode character layers, each with its own char set and HSL hue:
  - Layer 0: circles (`·∘○◎●`) — cyan (170°)
  - Layer 1: shading (`░▒▓█▪`) — magenta (300°)
  - Layer 2: Braille (`⠂⠆⠇⠿⣿`) — blue (210°)
  - Layer 3: box drawing (`╌╍═╬▓`) — yellow (50°)
  - Layer 4: sparkles (`∙∗✦✧✶`) — orange (20°)
  - Layer 5: bars (`▁▂▃▅▇`) — green (120°)
- Per-character layer selection is driven by distance from center, FFT band values, and animated wave patterns
- Hue per character = base hue + angle offset + time drift + amplitude shift + warmth tilt
- Circular viewport with radial fade at edges

**Color palette & dynamic shifts**
- Base hues: cyan 170°, magenta 300°, blue 210°, yellow 50°, orange 20°, green 120°
- `spectralWarmth` (−1 to +1): bass-heavy music tilts all hues −15°; treble-heavy tilts +15°
- `spectralDensity` (0–1): fraction of bins 1–179 above noise floor; boosts saturation (+18%), lightness (+6%), and lowers the render cutoff threshold so more characters appear
- `smoothAmp` adds up to +8% lightness — loud passages are noticeably brighter
- Intensity formula: `(wave * 0.42 + bandVal * 0.68 + pulse * 0.35) * (0.8 + smoothAmp * 2.5)`

**Animation loop** (`requestAnimationFrame`):
1. Pull FFT data from analyser
2. Update smoothed audio values + beat state
3. Render all 4,500 characters

**UI**: Fixed bottom control panel with file upload and status; song name shown at top. Interface text is in Portuguese.

## Reference material

`contexto/deep-research-audio-unicode-visualizer.md` — research document (in Portuguese) covering alternative terminal visualizers, Unicode character sets, audio analysis libraries, and LLM integration architectures for audio visualizers.
