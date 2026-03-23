# Roadmap

## Frente 1 — Editor Gráfico

Ferramenta separada para desenhar/comunicar formas, cores e animações desejadas antes de implementar no visualizer.

- Mini-grid circular em resolução reduzida (versão menor da grade 90×50 do visualizer)
- Duas ferramentas iniciais: **pintar** e **apagar**
- Paleta de elementos: os 6 layers documentados no CLAUDE.md
  - Layer 0: circles (`·∘○◎●`) — cyan (170°)
  - Layer 1: shading (`░▒▓█▪`) — magenta (300°)
  - Layer 2: Braille (`⠂⠆⠇⠿⣿`) — blue (210°)
  - Layer 3: box drawing (`╌╍═╬▓`) — yellow (50°)
  - Layer 4: sparkles (`∙∗✦✧✶`) — orange (20°)
  - Layer 5: bars (`▁▂▃▅▇`) — green (120°)

## Frente 2 — Modos de Visualização ✓ (implementado em v07)

Dois modos selecionáveis via botão toggle no painel de controle.

### Modo Rítmico ✓
Comportamento original — responde à amplitude das faixas de frequência (bass, mid, high). Energético, reativo a batidas e dinâmica sonora.

### Modo Melódico ✓
Responde ao **contexto harmônico** identificado em tempo real. Depende da Frente 3 (Análise Harmônica), implementada conjuntamente.

| Modo | Caráter | Resposta visual |
|------|---------|-----------------|
| Iônio (maior) | brilhante, estável | +0° hue, +12% sat, +8% lig, chaos 0.3 |
| Dórico | melancólico-groovy | −20° hue, chaos 0.5 |
| Frígio | sombrio, tenso | −50° hue, −8% sat, −6% lig, chaos 0.8 |
| Lídio | etéreo, flutuante | +35° hue → violeta, +15% sat, +12% lig, chaos 0.2 |
| Mixolídio | dominante, bluesy (escala do baião) | +18° hue → laranja, +8% sat, chaos 0.5 |
| Eólio (menor) | escuro, expressivo | −30° hue → azul profundo, −8% lig, chaos 0.7 |
| Lócrio | instável, dissonante | −80° hue, −15% sat, −18% lig, chaos máximo 1.0 |

As personalidades são aplicadas como **blend contínuo** ponderado por `scaleSmooth[]` — transições suaves de 3–5 s entre modos. `harmonicConf` gatea todos os offsets, zerando-os em silêncio ou percussão pura.

## Frente 3 — Análise Harmônica ✓ (implementado em v07)

Implementada sem dependências externas (~200 linhas de JS puro inline em `index.html`). Três sub-algoritmos:

1. **Chroma extraction** — LUT de 1024 posições mapeia bins FFT → pitch class; acumula energia por nota; produz `smoothChroma[12]`
2. **YIN pitch detection** — algoritmo YIN completo no domínio do tempo; detecta `rootNote` com `confidence > 0.85`
3. **Krumhansl-Schmuckler** — correlação de Pearson contra 7 perfis modais × 12 rotações; produz `activeScale`, `rootNote`, `harmonicConf`

Parâmetros expostos ao render loop: `activeScale`, `rootNote`, `chordTension`, `harmonicConf`, `scaleSmooth[]`

## Frente 4 — Áudio ao Vivo via DAW (Reaper)

Receber sinal de áudio em tempo real de uma DAW em vez de arquivo.

- Fase 1: suporte a single channel via Reaper
- Upgrade posterior: suporte a multicanais de áudio
