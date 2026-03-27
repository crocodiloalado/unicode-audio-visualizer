# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running

**For end users:** Open `index.html` directly in any modern browser (Chrome, Firefox, Safari with Web Audio API support). Zero dependencies, no build required.

**For development:**
- Modular structure: `src/index.html` + `src/animations.js`
- Test locally: `cd src && python -m http.server 8000`
- Build standalone: `./build.sh` (generates root `index.html`)
- See `DEVELOPMENT.md` for full workflow

## Architecture

This project maintains **single self-contained HTML file** distribution (zero external dependencies) while using modular development structure.

**Distribution:** `index.html` — standalone file with all logic inline
**Development:** `src/` directory with separated concerns (`index.html` + `animations.js`)

### Four main systems:

**Audio System** (`AudioContext`, `AnalyserNode`)
- Accepts MP3/FLAC/WAV/OGG via file input; decoded with `audioCtx.decodeAudioData()`
- FFT size 2048 → 256 usable bins; tracks smoothed bass/mid/high/amplitude values
- Beat detection via bass threshold spike; all values exponentially smoothed (factor ~0.1–0.22)
- Falls back to near-zero data (near-silent) when no audio is loaded

**Harmonic Analysis System** (Modo Melódico — runs only when mode toggle is active)
- Throttled to every 6 frames (~10 fps) to preserve render performance
- Three sub-algorithms run in sequence inside `updateHarmonic()`:
  1. **Chroma extraction**: LUT (`CHROMA_BINS`) maps each of the 1024 FFT bins to a pitch class (0–11, C=0). Energy is accumulated per pitch class and normalised to produce `smoothChroma` (12-element Float32Array, exponentially smoothed with asymmetric attack/decay).
  2. **YIN pitch detection**: `analyser.getFloatTimeDomainData()` fills `yinBuffer` (2048 samples). The YIN algorithm (difference function → CMND → threshold 0.15 → parabolic interpolation) returns `{f0, confidence}`. Used to confirm `rootNote` when `confidence > 0.85`; otherwise root comes from the K-S result.
  3. **Krumhansl-Schmuckler key finding**: `smoothChroma` is correlated (Pearson) against 7 modal profiles × 12 rotations = 84 correlations. The winning mode and root are smoothed via `scaleSmooth[]` (very slow, ~0.04 factor → 3–5 s transitions). `harmonicConf` gates all visual offsets so silence/percussive sections fall back to Rítmico behaviour automatically.
- **Outputs exposed to render loop**: `rootNote` (0–11), `activeScale` (0–6), `chordTension` (0–1), `harmonicConf` (0–1), `scaleSmooth[]` (per-mode confidence)

**Visual Renderer** (HTML5 Canvas 2D, monospace font)
- 90 × 50 character grid (adapts to screen size)
- 6 Unicode character layers, each with its own char set and HSL hue:
  - Layer 0: circles (`·∘○◎●`) — cyan (170°)
  - Layer 1: shading (`░▒▓█▪`) — magenta (300°)
  - Layer 2: Braille (`⠂⠆⠇⠿⣿`) — blue (210°)
  - Layer 3: box drawing (`╌╍═╬▓`) — yellow (50°)
  - Layer 4: sparkles (`∙∗✦✧✶`) — orange (20°)
  - Layer 5: bars (`▁▂▃▅▇`) — green (120°)
- Per-character layer selection driven by distance from center, FFT band values, animated wave patterns, and (in Modo Melódico) harmonic tension chaos
- Circular viewport with radial fade at edges

**Color palette — Modo Rítmico**
- Base hues: blue at center (230°) grading to orange at edge (20°)
- `spectralWarmth` (−1 to +1): bass-heavy music tilts all hues −15°; treble-heavy tilts +15°
- `spectralDensity` (0–1): fraction of bins 1–179 above noise floor; boosts saturation (+18%), lightness (+6%)
- `smoothAmp` adds up to +8% lightness — loud passages are noticeably brighter
- Modal personality offsets (gated by `harmonicConf`, blended via `scaleSmooth[]`): `modeHueOff`, `modeSatOff`, `modeLigOff`, `modeChaos`
- Layer chaos: `tensionChaos = chordTension * modeChaos * 1.5 * harmonicConf` perturbs `layerFloat`

**Hue formula — Modo Rítmico** (per character):
```
hue = (230 - normDist*210) + ((angle/π)*20 + t*8 + smoothAmp*30) + spectralWarmth*8 + (modeHueOff + chordTension*12) * harmonicConf
```

**Color palette — Modo Melódico**

The entire visualization sits in a coherent color family determined by the detected mode. A single `melodicBaseHue` float (updated in step 9 of `updateHarmonic()`, factor 0.04 → ~3–5 s transitions) converges toward `MODE_PALETTES[activeScale][0]`. Per-character hue varies organically within ±40° of this base:

```
hue = melodicBaseHue
    + sin(spinAngle*0.8 + t*0.25) * 14   // angular wave
    + normDist * 10                        // radial gradient
    + sin(t*0.03 + normDist*1.5) * 12 + sin(t*0.07 + 1.3) * 6  // temporal drift
```

`chordTension` affects saturation (+10% max) and lightness (−4% max) only — never hue — so dissonance makes the palette slightly more vivid and darker without producing rainbow artefacts.

**Mode palettes** (`MODE_PALETTES` — `[tonic hue, scale hue, tension hue, max sat]`):

| Modo | Índice | Cor base | Sat máx | Chaos |
|------|--------|----------|---------|-------|
| Iônio | 0 | âmbar 50° | 100 | 0.3 |
| Dórico | 1 | teal 170° | 100 | 0.5 |
| Frígio | 2 | violeta 270° | 100 | 0.8 |
| Lídio | 3 | magenta 290° | 100 | 0.2 |
| Mixolídio | 4 | laranja 25° | 100 | 0.5 |
| Eólio | 5 | azul 215° | 100 | 0.7 |
| Lócrio | 6 | terra 35° | 25 (dessaturado) | 1.0 |

**Modal visual personalities** — Rítmico only (`MODE_HUE_OFFSET`, `MODE_SAT_OFFSET`, `MODE_LIG_OFFSET`, `MODE_CHAOS`):

| Modo | Hue offset | Sat delta | Lig delta | Chaos |
|------|-----------|-----------|-----------|-------|
| Iônio | 0° | +12% | +8% | 0.3 |
| Dórico | −40° | 0% | 0% | 0.5 |
| Frígio | −90° | −18% | −12% | 0.8 |
| Lídio | +70° | +28% | +20% | 0.2 |
| Mixolídio | +35° | +15% | +8% | 0.5 |
| Eólio | −60° | −12% | −14% | 0.7 |
| Lócrio | −140° | −28% | −28% | 1.0 |

**Animation loop** (`requestAnimationFrame`):
1. `t += 0.012` — advance animation clock
2. `updateAudio()` — pull FFT data, update smoothed values, beat detection; if Modo Melódico and playing, call `updateHarmonic()` every 6 frames
3. Compute per-frame modal personality blend (`modeHueOff`, `modeSatOff`, `modeLigOff`, `modeChaos`) — used only in Rítmico
4. Render all 4,500 characters with mode-appropriate HSL formula

**UI**: Fixed bottom control panel with file upload, play/pause, mode toggle ("Melódico"/"Rítmico"), and debug toggle. Song name shown at top. Interface text is in Portuguese.

**Visualization modes**:
- **Rítmico** (default): purely amplitude-driven. `harmonicConf` = 0, all modal offsets inactive.
- **Melódico**: harmonic analysis active. `melodicBaseHue` tracks the dominant mode's tonic hue. `harmonicConf` grows toward K-S confidence; falling back to Rítmico smoothly decays `harmonicConf → 0` (factor 0.05/frame).

## Key global variables

| Variable | Type | Description |
|---|---|---|
| `smoothBass/Mid/High/Amp` | float | Exponentially smoothed frequency band energies |
| `beatPulse`, `pulseRadius` | float | Beat pulse amplitude and ring position |
| `spectralDensity` | float | 0–1, fraction of active spectrum bins |
| `spectralWarmth` | float | −1 to +1, spectral centroid warmth |
| `visualMode` | string | `'rhythmic'` or `'melodic'` |
| `harmonicConf` | float | 0–1, confidence gate for all modal offsets |
| `smoothChroma` | Float32Array(12) | Smoothed chroma vector, one value per pitch class |
| `scaleSmooth` | Float32Array(7) | Per-mode confidence, very slowly smoothed |
| `rootNote` | int | Detected root pitch class (0=C … 11=B) |
| `activeScale` | int | Mode index with highest `scaleSmooth` (0=Iônio … 6=Lócrio) |
| `chordTension` | float | 0–1, entropy + tritone dissonance measure |
| `melodicBaseHue` | float | Current hue base for Modo Melódico; converges to `MODE_PALETTES[activeScale][0]` at factor 0.04 |
| `CHROMA_BINS` | Uint8Array(1024) | LUT: FFT bin → pitch class (255 = ignore) |
| `MODE_PALETTES` | number\[7\]\[4\] | `[tonic hue, scale hue, tension hue, max sat]` per mode |
| `ANIMATION_LIBRARY` | object | Pluggable animation library (in `src/animations.js` during dev) |
| `activeAnimation` | string | Current animation key (default: `'helix'`) |

## Animation Library Architecture

The visualizer uses a pluggable animation system that separates animation logic from core rendering.

**Location:**
- Development: `src/animations.js` (edit here)
- Distribution: Inlined in `index.html` (auto-generated by `build.sh`)

**Structure:**
```javascript
ANIMATION_LIBRARY = {
  animation_key: {
    name: 'Display Name',
    description: 'Brief description',
    params: { /* tunable numeric parameters */ },
    compute: {
      spinAngle(ctx) { /* returns modified angle */ },
      waves(ctx) { /* returns 0-1 wave intensity */ },
      layerSelection(ctx) { /* returns layer index float */ }
    }
  }
}
```

**Animation Context (`animCtx`):**
Object provided to each animation with frame data: `{ angle, normDist, dist, t, smoothBass, smoothMid, smoothHigh, smoothAmp, globalSpin, beatPulse, pulseRadius, fftData, NL, tensionChaos, angleFraction, bandVal, crest }`

**Adding new animations:**
1. Edit `src/animations.js` — add new entry to `ANIMATION_LIBRARY`
2. Edit `src/index.html` — add `<option>` to `#anim-select` dropdown
3. Run `./build.sh` to generate standalone `index.html`
4. See template in `src/animations.js` for structure

**Current animations:**
- `helix` — Helical rotation with radial waves
- `concentric_waves` — Pure radial waves without rotation

## Reference material

`contexto/deep-research-audio-unicode-visualizer.md` — research document (in Portuguese) covering alternative terminal visualizers, Unicode character sets, audio analysis libraries, and LLM integration architectures for audio visualizers.
