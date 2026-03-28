# Changelog

All notable changes to this project are documented in this file.
Versions correspond to the files in the `versions/` directory.

---

## [editor] — Layout responsivo, undo/redo e melhorias de UI

### Added
- **Botões Undo / Redo (↩ ↪)** na top bar, separados dos botões de arquivo por uma linha vertical sutil. Ficam desabilitados (opacidade 20%) enquanto a pilha está vazia e refletem o estado em tempo real a cada pincelada, undo, redo ou novo arquivo.
- **Brush size responsivo**: em landscape (painel lateral) o controle é um slider horizontal que usa a largura disponível do painel; em portrait (barra inferior) um stepper compacto `[−][n][+]`. Os dois controles coexistem no HTML; CSS alterna entre eles via `#scale-wrap:not(.portrait)`.

### Changed
- **Layout portrait corrigido**: o painel horizontal abaixo do canvas tinha `width: 900px` fixo no CSS, enquanto o canvas mede ~540 px. O cálculo de escala em `scaleLayout()` usava o tamanho errado como `nativeW`, causando sobreposição e desalinhamento. Corrigido: a largura do painel é agora definida via JS (`panel.style.width = canvasW + 'px'`) antes de medir o `offsetHeight`, garantindo que a escala CSS seja calculada com as dimensões reais.
- **Botões de ferramenta em portrait**: em janelas portrait os quatro botões (✏ ⌫ ◎ M) agora empilham verticalmente e ficam centralizados na seção, sem sobreposição com a seção de pincéis.
- **Overflow da seção Brushes corrigido**: os `.layer-name` (texto "CIRCLES", "SHADING"…) são ocultados em portrait via CSS, reduzindo a largura real de cada `.layer-row` de ~168 px para ~118 px, eliminando o overflow de 48 px que invadia a seção de ferramentas.
- **Botão Mask**: texto "Mask" substituído por "M" com estilo `tool-icon` (28 × 28 px), consistente com os demais botões de ferramenta.
- **Color wheel**: reduzido de 90 px → 64 px. Barra de preview de cor: 16 px → 10 px de altura. Painel lateral: 220 px → 180 px. `nativeW` atualizado no cálculo de escala.
- **Palette Save / Load**: removido o label "Palette |" (redundante); os botões Save e Load agora ficam centralizados dentro da seção via `justify-content: center`. `#swatches-wrap` não tem mais largura fixa, estica com o painel.
- **Atalhos de teclado**: ocultos na status bar em portrait mode (janela mais estreita), onde não há espaço útil para exibi-los.

---

## [v08] — Sistema de cores Melódico v3 (base hue única por modo)

### Changed
- **Arquitetura do sistema de cores do Modo Melódico completamente reescrita** para eliminar o arco-íris que aparecia ao ativar o modo.
- **Causa raiz do arco-íris**: a versão anterior mapeava `spinAngle` → 1 de 12 setores do círculo de quintas → 1 de 3 hues da paleta (tônica/escala/tensão). Setores in-scale tinham hue ~30° e out-of-scale ~210° (180° de diferença). A interpolação entre setores adjacentes com hues tão distantes atravessava metade do espectro. Como `spinAngle` inclui `t * spinRate` (rotação contínua), esses arcos de arco-íris giravam ao redor do círculo.
- **Nova abordagem**: hue base único por modo (`melodicBaseHue`) que converge suavemente para `MODE_PALETTES[activeScale][0]` com fator 0.04 (~3–5 s). Variação per-caractere limitada a ±40° ao redor da base via onda angular suave, gradiente radial e oscilação temporal lenta.
- `chordTension` agora afeta apenas saturação (+10% max) e luminosidade (−4% max), nunca o hue — dissonância torna a paleta levemente mais vívida e escura sem produzir artefatos de cor.
- `MODE_PALETTES` substituiu `MODE_PRIMARY_HUE` como constante de identidade de cor por modo: `[hue tônica, hue escala, hue tensão, sat máxima]`. Lócrio tem sat máxima 25 (dessaturado/terroso).

### Removed
- `melodicSectorHue` (Float32Array de 12 elementos) — substituído por `melodicBaseHue` (float único)
- `snapMelodicHues()` — função auxiliar que inicializava os setores; não é mais necessária
- Step 9 do `updateHarmonic()` (loop de 12 setores) — substituído por 4 linhas de convergência de `melodicBaseHue`

---

## [v07] — Frente 3: Modo Melódico (análise harmônica)

### Added
- **Modo Melódico** — segundo modo de visualização, selecionável via botão toggle no painel de controle. O modo padrão continua sendo o Rítmico (comportamento inalterado).
- **Chroma extraction** — LUT pré-calculada (`CHROMA_BINS`, Uint8Array de 1024 posições) mapeia cada bin FFT ao seu pitch class (0–11). Calculada uma única vez no init. Energia por pitch class é acumulada a partir dos 1024 bins brutos e normalizada para produzir `smoothChroma` (suavização assimétrica: attack 0.25, decay 0.06).
- **YIN pitch detection** — implementação inline do algoritmo YIN (~60 linhas de JS puro, sem dependências externas). Opera sobre `yinBuffer` (2048 amostras do domínio do tempo via `getFloatTimeDomainData()`). Retorna `{f0, confidence}`; usado para confirmar `rootNote` quando `confidence > 0.85`.
- **Krumhansl-Schmuckler key finding** — correlação de Pearson entre `smoothChroma` e 84 perfis modais (7 modos × 12 rotações). Perfis dos 7 modos da igreja incluídos inline. `scaleSmooth[]` suaviza as mudanças de modo (~3–5 s de transição).
- **Tensão harmônica** (`chordTension`) — combinação de entropia de Shannon do chroma (chroma uniforme = tensão máxima) e presença de trítono (distância de 6 semitons entre bins fortes).
- **Personalidades visuais por modo** — cada modo modal aplica offsets de hue, saturação, luminosidade e caos de layer (via `scaleSmooth[]` como peso de blend contínuo):
  - Iônio: +0° hue, +12% sat, +8% lig — brilhante, estável
  - Dórico: −20° hue — frio, equilibrado
  - Frígio: −50° hue, −8% sat, −6% lig — escuro, agitado
  - Lídio: +35° hue, +15% sat, +12% lig — etéreo, violeta
  - Mixolídio: +18° hue, +8% sat — laranja quente
  - Eólio: −30° hue, −5% sat, −8% lig — azul profundo
  - Lócrio: −80° hue, −15% sat, −18% lig, chaos=1.0 — caótico, monocromático
- **`harmonicConf`** — variável de gate (0–1) que escala todos os offsets modais. Cresce com a confiança do K-S e decai para 0 em silêncio, percussão pura, ou quando o modo Rítmico está ativo. Garante degradação graciosa sem código condicional no loop de caracteres.
- **Throttle de análise** — `updateHarmonic()` roda a cada 6 frames (~10 fps), não a cada frame de renderização, para preservar os 60 fps.
- **Debug panel expandido** — quatro novos campos: Root note, Scale/mode, Chord tension, Harmonic conf.

### Changed
- Hue formula no loop de caracteres agora inclui `modalShift = (modeHueOff + chordTension*12) * harmonicConf`
- `layerFloat` agora inclui perturbação de caos: `tensionChaos * sin(t*3 + normDist*4)`
- `sat` e `lig` agora incluem `modeSatOff * harmonicConf` e `modeLigOff * harmonicConf`
- Arquivo renomeado de `unicode_visualizer.html` para `index.html`

---

## [v06] — first GitHub release

### Changed
- Trail fade opacity reduced from `0.32` → `0.09`: characters persist much longer on screen, creating denser trails
- Intensity cutoff lowered from `0.08` → `0.03`: more characters visible at low amplitudes
- Alpha blending changed from linear (`intensity * 2.0 + 0.05`) to power curve (`intensity^0.8`): weak characters fade out more gradually

---

## [v05]

### Added
- Play/pause button (`▶`) in the control panel
- ID3v2 metadata parser: reads `TIT2` (title) and `TPE1` (artist) tags directly from the audio buffer — song name displayed as `ARTIST — TITLE` instead of raw filename
- `globalSpin`: slow continuous counter-clockwise rotation of the entire visualization, active only while music plays

### Changed
- Trail fade opacity increased from `0.55` → `0.32`: slightly shorter persistence
- Demo mode no longer shows "animação demo ♦" — song name area starts empty

---

## [v04]

### Added
- `globalSpin` variable introduced (initial implementation)
- Differential ring spin: inner and outer rings rotate at slightly different rates

### Changed
- Trail fade opacity changed from `0.55` → `0.32`

---

## [v03]

### Changed
- **Asymmetric smoothing**: audio values now have fast attack and slow decay, making beats feel punchier
  - Bass: `0.35` → `0.40` attack / `0.030` decay
  - Mid: `0.22` → `0.30` attack / `0.022` decay
  - High: `0.16` → `0.24` attack / `0.018` decay
- Animation speed slowed: `t += 0.02` → `t += 0.012`
- Trail fade opacity reduced from `0.82` → `0.55`: longer-lasting trails
- Waves normalized to `[0, 1]` range (`* 0.5 + 0.5`) instead of `[-1, +1]`
- Wave speeds slowed significantly to give a more flowing, less frantic look
- Ring spin: each concentric ring now rotates around the center, speed driven by bass and amplitude
- Layer selection rewritten: radial sectors replace angle-based sectors

---

## [v02]

### Added
- **Debug panel**: live spectrum canvas + readouts for bass, mid, high, amplitude, beat pulse, spectral density, spectral warmth, and source mode — toggled with a "Debug" button
- FFT downsampling improved: 1024 → 256 bins now uses **average** of each group instead of nearest-neighbor skip, reducing aliasing on high frequencies
- Bass now read directly from raw FFT bins (pre-downsampling) for sub-bass accuracy

### Changed
- Frequency band boundaries redefined using actual Hz values at 44100 Hz / 2048-point FFT:
  - Sub-bass: bins 1–4 (21–86 Hz), Low-bass: bins 5–10

---

## [v01]

### Added
- `spectralDensity` (0–1): fraction of bins 1–179 above noise floor; boosts saturation (+18%), lightness (+6%), and lowers the render cutoff
- `spectralWarmth` (−1 to +1): centroid-based warmth — bass-heavy music tilts all hues −15°, treble-heavy tilts +15°
- `pulseRadius`: beat pulse now expands outward as a ring from center, rather than a fixed-radius glow
- Layer mapping (`LAYER_MAP`): layer 5 (bars) remapped to shading (layer 1) to reduce density
- Amplitude boost (`ampBoost = 0.8 + smoothAmp * 2.5`): loud passages are visibly brighter

### Changed
- Frequency bands recalibrated: bass `0–18` → `0–5` bins; mid `18–90` → `5–50`; high `90–256` → `50–180`
- Smoothing factors increased for faster visual response
- Hue calculation now applies `warmthShift` and fixes negative modulo with `(% 360 + 360) % 360`
- Alpha formula updated: `intensity * 1.9 + 0.05` → `intensity * 2.0 + 0.05`

---

## [v00] — initial version

- Single HTML file with no external dependencies
- Web Audio API pipeline: file input → `decodeAudioData` → `AnalyserNode` (FFT 2048) → 256-bin normalized array
- 6 Unicode character layers with fixed hues (cyan, magenta, blue, yellow, orange, green)
- 90 × 50 character grid on HTML5 canvas, adapts to screen size
- Circular viewport with radial fade at edges
- Beat detection via bass threshold spike
- Demo mode with simulated FFT data when no file is loaded
- Exponential smoothing on bass, mid, high, and overall amplitude
