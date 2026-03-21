# Referências técnicas para um audio visualizer em Unicode

**O ecossistema para construir um visualizador de áudio baseado em caracteres Unicode é surpreendentemente rico e maduro.** Projetos como cava (5.9k stars) já provaram que caracteres Unicode block elements (`▁▂▃▄▅▆▇█`) oferecem resolução sub-célula suficiente para visualizações de espectro convincentes, enquanto bibliotecas como drawille demonstram que padrões Braille (`⠀⠁⠂…⣿`) transformam cada célula de texto em uma grade de 2×4 pixels. O Processing, com suas bibliotecas Minim e Sound, fornece toda a infraestrutura necessária para análise FFT em tempo real — e a integração com LLMs já foi validada em projetos acadêmicos recentes, como o sistema apresentado no ACM IMX 2025 que conecta Essentia → ChatGPT → geração visual. A prototipagem mais rápida possível está no browser: **synth.textmode.art** combina motor visual textmode com padrões sonoros ao vivo, pronto para uso imediato.

---

## Visualizadores de terminal que definem o estado da arte

O projeto mais importante como referência técnica é o **cava** (Console-based Audio Visualizer), disponível em [github.com/karlstav/cava](https://github.com/karlstav/cava). Escrito em C com **~5.900 stars**, ele usa os caracteres Unicode block elements `▁▂▃▄▅▆▇█` (U+2581–U+2588) para barras de espectro com resolução de 8 níveis por célula de caractere. Sua arquitetura — captura de áudio → FFTW3 → cálculo de bandas → normalização com smoothing → renderização a 60fps — é o modelo a seguir. Suporta PipeWire, PulseAudio, ALSA, JACK, PortAudio, e tem modo raw que exporta dados para outros programas.

O **cli-visualizer** ([github.com/dpayne/cli-visualizer](https://github.com/dpayne/cli-visualizer), ~2.100 stars, C++) expandiu essa abordagem com modos de visualização diversificados: espectro, atrator de Lorenz e elipses. Seu diferencial é o suporte a caracteres configuráveis via `visualizer.spectrum.character` e algoritmos de suavização sofisticados (Savitzky-Golay, estilo MonsterCat). O repositório original foi deletado, mas forks ativos existem em [github.com/69keks/cli-visualizer-git](https://github.com/69keks/cli-visualizer-git).

O **ncmpcpp** ([github.com/ncmpcpp/ncmpcpp](https://github.com/ncmpcpp/ncmpcpp)) merece atenção especial por seu modo `visualizer_spectrum_smooth_look`, que usa a mesma técnica de blocos Unicode do cava, e pela opção `visualizer_spectrum_smooth_look_legacy_computing` que emprega caracteres Unicode do bloco Symbols for Legacy Computing (U+1FB00–U+1FB9F) — sextantes que oferecem grade 2×3 por célula.

Outros projetos relevantes nessa categoria:

- **catnip** ([github.com/noriah/catnip](https://github.com/noriah/catnip)) — Go, arquitetura limpa com módulos separados para `graphic` e `dsp`
- **aviz** ([github.com/wolandark/aviz](https://github.com/wolandark/aviz)) — múltiplos modos (bars, wave, spectrum, circle, fire) com configuração YAML
- **cli-viz** ([github.com/sam1am/cli-viz](https://github.com/sam1am/cli-viz)) — Python, sistema de plugins incluindo "Neural Dreamscape"

---

## O ecossistema Processing para análise de áudio

### Minim versus Sound Library

A escolha entre as duas bibliotecas de áudio do Processing impacta diretamente a qualidade da visualização. O **Minim** ([code.compartmental.net/minim](https://code.compartmental.net/minim/) | [github.com/ddf/Minim](https://github.com/ddf/Minim)) oferece controle superior de FFT com `logAverages(22, 3)` para bandas por oitava, múltiplas funções de janelamento (Hamming, Hann, Blackman), e classe `BeatDetect` integrada. A Sound Library ([processing.org/reference/libraries/sound](https://processing.org/reference/libraries/sound/)), mantida oficialmente pela Processing Foundation, retorna valores **normalizados entre 0 e 1** — o que simplifica enormemente o mapeamento para caracteres Unicode.

Para este projeto, **Minim com `logAverages` é a recomendação** por produzir bandas de frequência perceptualmente uniformes, essenciais para visualização musical. O código fundamental:

```java
fft = new FFT(player.bufferSize(), player.sampleRate());
fft.logAverages(22, 3); // ~31 bandas por oitava
// No draw():
fft.forward(player.mix);
smoothed[i] += (fft.getAvg(i) - smoothed[i]) * 0.25; // suavização exponencial
```

### Renderização Unicode no Processing

Processing suporta caracteres Unicode via `createFont()`, mas com ressalvas importantes. A função `createFont("DejaVu Sans Mono", 16, true)` renderiza a partir de fontes TTF/OTF do sistema e suporta o conjunto completo de caracteres da fonte — diferente de `loadFont()` que carrega bitmaps pré-rasterizados com subset limitado. **O renderer FX2D tem melhor suporte a caracteres especiais Unicode** que o JAVA2D padrão. Fontes recomendadas para block elements: **DejaVu Sans Mono**, **Noto Sans Mono**, ou **GNU Unifont**.

A otimização crítica é **construir linhas inteiras como strings** em vez de renderizar caracteres individuais — reduz de `cols × rows` chamadas a `text()` para apenas `rows` chamadas, diferença entre 30fps e 5fps em grids grandes.

### Projetos Processing como ponto de partida

| Projeto | URL | O que demonstra |
|---------|-----|-----------------|
| **fftTerrain** | [github.com/pelinski/fftTerrain](https://github.com/pelinski/fftTerrain) | Processing + Sound library FFT com mic e arquivo |
| **Music-Visualizer** | [github.com/JoaquinBadillo/Music-Visualizer](https://github.com/JoaquinBadillo/Music-Visualizer) | Barras de espectro FFT com mic/LineIn |
| **processing-audio-visualizer** | [github.com/ThomasJones/processing-audio-visualizer](https://github.com/ThomasJones/processing-audio-visualizer) | Visualização com entrada MIDI via MidiBus |
| **Processing-Visuals-Tool** | [github.com/jain7th/Processing-Visuals-Tool](https://github.com/jain7th/Processing-Visuals-Tool) | Minim + interface interativa |
| **laser_letters** | [github.com/ffd8/laser_letters](https://github.com/ffd8/laser_letters) | Tipografia reativa a áudio com Minim + Geomerative |
| **QuiFFT** | [github.com/mileshenrichs/QuiFFT](https://github.com/mileshenrichs/QuiFFT) | Biblioteca Java FFT utilizável no JVM do Processing |

O tutorial completo mais útil é o do **Generative Hut** ([generativehut.com/post/using-processing-for-music-visualization](https://www.generativehut.com/post/using-processing-for-music-visualization)), que inclui código completo de Minim FFT com smoothing.

---

## Caracteres Unicode como paleta visual

A escolha dos caracteres determina a linguagem visual do projeto. Existem seis conjuntos Unicode estratégicos para visualização de áudio:

**Block Elements (U+2580–U+259F)** são os mais importantes. Os blocos verticais `▁▂▃▄▅▆▇█` oferecem 8 níveis de altura — a técnica usada pelo cava para barras de espectro. Os shade characters `░▒▓█` fornecem 4 níveis de densidade, ideais para heatmaps. A combinação de `▀` (upper half) e `▄` (lower half) com cores foreground/background **dobra a resolução vertical** — técnica usada pelo pixterm ([github.com/eliukblau/pixterm](https://github.com/eliukblau/pixterm)).

**Braille Patterns (U+2800–U+28FF)** oferecem a maior resolução: 2×4 pixels por célula, transformando um terminal 80×24 em uma tela de 160×96 "pixels". A biblioteca **drawille** ([github.com/asciimoo/drawille](https://github.com/asciimoo/drawille), 3.200 stars, Python) é a referência fundamental. Cada caractere Braille é calculado como `0x2800 + soma dos bits`, onde o pixel_map mapeia posições (x,y) para bits:

```
|bit0 bit3|   → 0x01 0x08
|bit1 bit4|   → 0x02 0x10
|bit2 bit5|   → 0x04 0x20
|bit6 bit7|   → 0x40 0x80
```

Existem ports de drawille em Go ([github.com/exrook/drawille-go](https://github.com/exrook/drawille-go)), Node.js ([github.com/madbence/node-drawille](https://github.com/madbence/node-drawille)), Nim ([github.com/PMunch/drawille-nim](https://github.com/PMunch/drawille-nim) — com sistema de camadas XOR), e Lua ([github.com/asciimoo/lua-drawille](https://github.com/asciimoo/lua-drawille) — com suporte 3D e L-systems). Todos esses conceitos são portáveis para Processing/Java.

**Símbolos para Legacy Computing (U+1FB00–U+1FB9F)**, adicionados no Unicode 13.0, incluem sextantes (grade 2×3 = 6 sub-pixels por célula, 64 combinações). Resolução intermediária entre quadrantes e Braille, sem os artefatos visuais dos pontos Braille.

**Formas geométricas (U+25A0–U+25FF)** — `■□▪▫●○▲▶▼◀◆◇` — servem como elementos decorativos, marcadores de pico, e para compor formas animadas. **Box Drawing (U+2500–U+257F)** fornece bordas e grades para organização visual.

---

## LLMs como "diretores criativos" do visualizador

A integração de LLMs com visualização de áudio já foi validada academicamente. O projeto mais relevante é o sistema apresentado no **ACM IMX 2025** que implementa o pipeline completo: stream de áudio → modelos Essentia TensorFlow classificam gênero, tempo, instrumentos, emoção e mood → **ChatGPT traduz features classificadas em prompts de imagem** → modelo de geração visual cria o output. Construído em TouchDesigner, ele demonstra que a arquitetura funciona em tempo real.

O **Generative Disco** ([github.com/hellovivian/generative-disco](https://github.com/hellovivian/generative-disco), Columbia University/Hugging Face) usa GPT-4 como brainstormer de prompts visuais: o usuário define intervalos musicais, o LLM gera descrições de cenas com transições (cor, tempo, sujeito, estilo), e Stable Diffusion renderiza. O **AI Co-Artist** (arXiv:2512.08951) vai além: o LLM gera e evolui código GLSL de shaders audio-reativos através de algoritmos evolutivos.

### Quatro arquiteturas viáveis para integração LLM

**Arquitetura 1 — LLM periódico como diretor de mood:** Features de áudio são extraídas continuamente, mas o LLM é consultado a cada 2–8 segundos para definir parâmetros estéticos de alto nível (paleta, estilo, densidade de caracteres). Entre consultas, a renderização usa FFT diretamente para reatividade frame-a-frame. **Latência aceitável**, bom equilíbrio entre criatividade e responsividade.

**Arquitetura 2 — Partitura visual pré-computada:** Antes da reprodução, o LLM analisa metadados/gênero da música e gera uma "partitura visual" — sequência de temas, paletas, regras de transição. Durante a reprodução, detecção de beat dispara transições planejadas. **Elimina problemas de latência.** Usado pelo Generative Disco.

**Arquitetura 3 — Narrativa textual generativa:** Classificação MIR (via Essentia/librosa) alimenta o LLM a cada 5–10s para gerar texto narrativo/poético em resposta ao mood da música. O texto gerado é exibido como parte do visual — tipografia reativa. **Ideal para o aspecto "narrativa visual" do projeto.**

**Arquitetura 4 — Geração de código pelo LLM:** O LLM gera/evolui código Processing ou GLSL com parâmetros audio-reativos. O código gerado executa a velocidade nativa. **Melhor performance**, mas mais complexo de implementar. Demonstrado pelo AI Co-Artist.

A combinação mais promissora para prototipagem rápida: usar **essentia.js** para extração profunda de features (mood, gênero, features espectrais) alimentando o LLM, enquanto **p5.js Sound** ou **Minim** fornecem FFT frame-a-frame para reatividade instantânea.

---

## Bibliotecas de análise de áudio comparadas

| Biblioteca | Linguagem | Tempo real | FFT | Beat | Mood/Gênero | Melhor uso |
|-----------|-----------|-----------|-----|------|-------------|------------|
| **Minim** | Java/Processing | ✅ | ✅ logAverages, windowing | ✅ BeatDetect | ❌ | Sketches Processing desktop |
| **Sound Library** | Java/Processing | ✅ | ✅ normalizado 0–1 | ❌ | ❌ | Prototipagem rápida Processing |
| **p5.js Sound** | JavaScript | ✅ | ✅ + getEnergy("bass") | ✅ PeakDetect | ❌ | Visualização no browser |
| **essentia.js** | JS/WASM | ✅ | ✅ | ✅ | ✅ ML models | MIR completa para LLM |
| **librosa** | Python | ❌ offline | ✅ STFT, CQT, mel | ✅ | ❌ | Pré-análise, pesquisa |
| **aubio** | C/Python | ✅ | ✅ | ✅ | ❌ | Onset/pitch/beat em tempo real |
| **oscP5** | Java/Processing | ✅ rede | N/A | N/A | N/A | Comunicação entre apps |

O **oscP5** ([sojamo.de/libraries/oscp5](https://sojamo.de/libraries/oscp5/)) merece destaque especial: permite conectar Processing a SuperCollider, Max/MSP, Ableton Live, ou qualquer fonte OSC — viabilizando arquiteturas distribuídas onde análise de áudio e renderização rodam em processos separados. Para p5.js, existe o [p5js-osc](https://github.com/genekogan/p5js-osc) via Node.js.

---

## O caminho mais rápido para um protótipo funcional

Para prototipagem imediata no browser, três ferramentas se destacam. O **synth.textmode.art** ([synth.textmode.art](https://synth.textmode.art/)) combina um motor de síntese visual textmode com o **Strudel** (port JavaScript do TidalCycles) para padrões sonoros algorítmicos — é literalmente um ambiente de live coding que une som e arte textmode, pronto para uso no browser sem instalação.

O **textmode.js** ([code.textmode.art](https://code.textmode.art/) | [github.com/humanbydefinition/textmode.js](https://github.com/humanbydefinition/textmode.js)) é a biblioteca standalone mais relevante: zero dependências, WebGL2, suporte a fontes TTF/OTF, sistema de camadas com blend modes, filtros, e exportação para TXT/SVG/GIF/vídeo. Seu predecessor **p5.asciify** ([p5.textmode.art](https://p5.textmode.art/) | [github.com/humanbydefinition/p5.asciify](https://github.com/humanbydefinition/p5.asciify)) integra-se diretamente ao p5.js — usa shaders GLSL para converter qualquer sketch WEBGL em ASCII/textmode em tempo real, mapeando brilho para caracteres por densidade visual.

Para Processing desktop (Java), o caminho é mais manual mas totalmente viável. O sketch mínimo funcional:

```java
import ddf.minim.*; import ddf.minim.analysis.*;
Minim minim; AudioPlayer player; FFT fft;
char[] bars = {'▁','▂','▃','▄','▅','▆','▇','█'};
float[] smooth;

void setup() {
  size(960, 540);
  textFont(createFont("DejaVu Sans Mono", 14, true));
  minim = new Minim(this);
  player = minim.loadFile("musica.mp3", 2048);
  player.loop();
  fft = new FFT(player.bufferSize(), player.sampleRate());
  fft.logAverages(22, 3);
  smooth = new float[fft.avgSize()];
}

void draw() {
  background(0); fill(0, 255, 0);
  fft.forward(player.mix);
  StringBuilder line = new StringBuilder();
  for (int i = 0; i < fft.avgSize(); i++) {
    smooth[i] += (fft.getAvg(i) - smooth[i]) * 0.25;
    int idx = constrain((int)(smooth[i] * 2), 0, bars.length-1);
    line.append(bars[idx]);
  }
  text(line.toString(), 10, height/2);
}
```

---

## Artistas e referências na cena de creative coding

**Ryoji Ikeda** ([ryojiikeda.com](https://www.ryojiikeda.com/)) é a referência conceitual mais importante: seu trabalho converte dados (texto, som, imagens) em padrões de barcode preto-e-branco sincronizados com som eletrônico. Obras como *test pattern* (2008) e *datamatics* (2006) são essencialmente estética textmode em escala monumental.

O **TMDC — Text Mode Demo Contest** ([tmdc.scene.org](https://tmdc.scene.org/)) é a competição anual dedicada exclusivamente a demos em modo texto com música. Com mais de 20 edições, demonstra o que é possível dentro de restrições estritas de caracteres. O framework open-source de **mu6k** (grupo Brainstorm), disponível no site do TMDC, oferece base pronta para demos textmode.

Para tipografia sonora-reativa, **Patrik Hübner** ([patrik-huebner.com](https://www.patrik-huebner.com/)) criou a identidade dinâmica da Philharmonie Luxembourg, que interage com música ao vivo via tipografia generativa. O **laser_letters** ([github.com/ffd8/laser_letters](https://github.com/ffd8/laser_letters)) de Ted Davis demonstra tipografia audio-reativa em Processing usando Minim + biblioteca Geomerative para extrair geometria de glifos.

No live coding, o **P5LIVE** ([teddavis.org/p5live](https://www.teddavis.org/p5live/)), também de Ted Davis, funciona como ambiente colaborativo de VJ com integração Strudel. O **Hydra** ([hydra.ojack.xyz](https://hydra.ojack.xyz/)) de Olivia Jack inclui análise FFT via biblioteca Meyda e aceita qualquer canvas como input.

A lista curada **awesome-audio-visualization** ([github.com/willianjusten/awesome-audio-visualization](https://github.com/willianjusten/awesome-audio-visualization)) — mantida por **Willian Justen**, desenvolvedor brasileiro — é o diretório mais completo de recursos de visualização de áudio, incluindo bibliotecas, experimentos e tutoriais.

### A cena brasileira

A comunidade brasileira de creative coding é ativa e bem conectada. **Alexandre Villares** ([abav.lugaralgum.com](https://abav.lugaralgum.com/) | [github.com/villares](https://github.com/villares)), professor e artista visual em São Paulo com doutorado pela Unicamp (2025), é figura central. Co-organizou a **Noite de Processing** no Garoa Hacker Clube (2016–2024), produz materiais educacionais open-source, e trabalha com Processing + Python (py5).

**Monica Rizzolli** ([monicarizzolli.io](https://monicarizzolli.io/)) co-fundou a Noite de Processing e se tornou a artista generativa brasileira mais reconhecida internacionalmente com *Fragments of an Infinite Field* no Art Blocks (2021). Sua colaboração com Tony de Marco em tipografias generativas (fonte Tomorrow para Google Fonts) é diretamente relevante.

O **Algorave Brasil** ([algoravebrasil.gitlab.io](https://algoravebrasil.gitlab.io/eventos/2024/pt/) | @algoravebr no Instagram) organiza eventos de live coding desde 2022, com comunicação via Telegram (@algoravebrasil). O festival **MULTIVERSO** ([multiverso.cc](https://multiverso.cc/)), curado por Igor Abreu no Rio de Janeiro, é o primeiro festival brasileiro dedicado a arte generativa e creative coding. Destaque para a instalação sonora interativa **Quanta — Trajeto Orquestrado** (André Anastácio, Igor Abreu, Alberto Harres, Carlos Oliveira, Vitor Zanon) na Central do Brasil. O evento **Compoética 2025** sinaliza vitalidade contínua da comunidade.

---

## Considerações técnicas para implementação

### Mapeamento FFT → Unicode

Três estratégias de mapeamento servem a propósitos visuais distintos. **Amplitude-para-altura** usa `▁▂▃▄▅▆▇█` (8 níveis) onde cada banda de frequência vira uma coluna com altura proporcional — resultado visual tipo equalizador, técnica do cava. **Amplitude-para-densidade** usa `░▒▓█` (4 níveis) preenchendo áreas com diferentes "pesos" visuais — resultado tipo heatmap. **Braille de alta resolução** usa a técnica drawille para plotar formas de onda e espectrogramas com **2× resolução horizontal e 4× vertical**.

A escala logarítmica é obrigatória para resultados musicalmente significativos. O `logAverages(22, 3)` do Minim agrupa frequências em bandas por oitava, alinhando-se à percepção humana. Para conversão manual: `logIndex = pow(2, map(i, 0, cols, log(1)/log(2), log(bands)/log(2)))`.

### Performance

Renderização de texto é cara no Processing. A otimização mais impactante: **concatenar linhas inteiras como `StringBuilder`** e usar uma chamada `text()` por linha. Usar renderer P2D com `createFont()` para aceleração de hardware. Grid de **60×30 caracteres a 30fps é realista**; 120×60 a 60fps exige a abordagem alternativa de pré-renderizar cada caractere como `PImage` e usar `image()` em vez de `text()`. Para web, a abordagem de shader do p5.asciify/textmode.js é ordens de magnitude mais rápida.

Buffer FFT de **1024 ou 2048 samples** é o sweet spot: resolução de frequência adequada sem latência perceptível. Smoothing exponencial (`smooth[i] += (raw[i] - smooth[i]) * factor`) é indispensável — fator 0.1 para movimento lento/suave, 0.25 para responsividade equilibrada, 0.5+ para quase-raw.

## Conclusão

O projeto proposto se situa na interseção de três ecossistemas maduros: análise de áudio em tempo real (Minim/Sound/essentia.js), arte textmode (cava/drawille/textmode.js), e geração criativa por IA (Generative Disco/AI Co-Artist). O caminho mais eficiente para prototipagem é começar no browser com **synth.textmode.art** ou **p5.js + p5.asciify + p5.sound** para validar conceitos visuais rapidamente, e então portar para Processing desktop quando precisar de controle fino sobre FFT (via Minim `logAverages`) e renderização Unicode. Para a integração LLM, a arquitetura mais pragmática é a de "partitura visual pré-computada" — o LLM gera um plano criativo completo baseado em metadados/classificação da música, e a renderização em tempo real segue esse plano com FFT governando a reatividade frame-a-frame. A cena brasileira, centrada na comunidade Algorave Brasil e nos materiais educacionais de Alexandre Villares, oferece tanto inspiração quanto potenciais colaboradores.