// === Animações Arquivadas ===
// Estas animações foram removidas do visualizer principal mas mantidas aqui para consulta futura.

/*
  tunnel — Túnel Infinito
  Voo através de túnel com anéis reativos ao áudio
*/
const ARCHIVED_tunnel = {
  name: 'Túnel Infinito',
  description: 'Voo através de túnel com anéis reativos ao áudio',

  params: {
    // Geometria do túnel
    depthK: 6.5,              // força da perspectiva
    uScale: 6.0,              // densidade angular
    vScale: 12.0,             // densidade radial (stripes)

    // Velocidades base
    baseScrollSpeed: 0.22,    // movimento para frente
    baseRotation: 0.012,      // rotação do túnel

    // High frequency → velocidade
    highScrollBoost: 0.4,     // acelera scroll
    highRotationBoost: 0.06,  // acelera rotação

    // Mid frequency → densidade
    midDensityBoost: 4.0,     // mais stripes

    // Bass frequency → warping
    bassWarpStrength: 0.32,   // força da distorção
    bassWarpFreqU: 2.8,       // frequência horizontal
    bassWarpFreqV: 3.5,       // frequência vertical

    // Beat effects
    beatFlashIntensity: 0.7,  // brilho no beat
    beatPulseWidth: 0.12,     // largura do anel pulsante

    // Fades
    centerFadeRadius: 0.15,   // fade no centro
    centerFadePower: 1.8,     // suavidade do fade
    edgeFadeStart: 0.85,      // início do fade na borda

    // Modo de padrão
    patternMode: 'stripes',   // 'stripes' | 'checkerboard'

    // Layers
    vLayerFreq: 2.2,
    uLayerFreq: 1.5,
    bandLayerWeight: 1.6,
    beatLayerBoost: 2.5
  },

  compute: {
    spinAngle(ctx) {
      const { angle, t, smoothHigh, globalSpin } = ctx;
      const p = this.params;
      const highSpin = p.baseRotation + smoothHigh * p.highRotationBoost;
      return angle + globalSpin + t * highSpin;
    },

    waves(ctx) {
      const { normDist, dist, angle, t, smoothBass, smoothMid, smoothHigh,
              beatPulse, pulseRadius } = ctx;
      const p = this.params;

      // === 1. SINGULARIDADE NO CENTRO ===
      const safeDist = Math.max(dist, 0.1);
      if (normDist < p.centerFadeRadius) {
        return Math.pow(normDist / p.centerFadeRadius, p.centerFadePower) * 0.3;
      }

      // === 2. COORDENADAS UV ===
      const scrollSpeed = p.baseScrollSpeed + smoothHigh * p.highScrollBoost;
      const rotationSpeed = p.baseRotation + smoothHigh * p.highRotationBoost;

      let u = (angle + Math.PI) / (Math.PI * 2) * p.uScale + t * rotationSpeed;
      let v = p.depthK / safeDist + t * scrollSpeed;

      // === 3. FLASH DE BEAT ===
      v += beatPulse * p.beatFlashIntensity;

      // === 4. WARPING POR BASS ===
      const warp = smoothBass * p.bassWarpStrength;
      u += Math.sin(v * p.bassWarpFreqV + t * 0.5) * warp;
      v += Math.sin(u * p.bassWarpFreqU + t * 0.3) * warp * 0.7;

      // === 5. DENSIDADE REATIVA A MID ===
      const vScale = p.vScale + smoothMid * p.midDensityBoost;

      // === 6. PADRÃO DE TEXTURA ===
      let pattern;

      if (p.patternMode === 'stripes') {
        // Stripes verticais
        pattern = Math.floor(v * vScale) % 2;

      } else {
        // Checkerboard
        const patternX = Math.floor(u) % 2;
        const patternY = Math.floor(v * vScale) % 2;
        pattern = (patternX + patternY) % 2;
      }

      // === 7. ANEL PULSANTE DO BEAT ===
      const vPeriod = (Math.PI * 2) / vScale;
      const vMod = ((v % vPeriod) + vPeriod) % vPeriod;
      const vPhase = vMod / vPeriod;
      const phaseDist = Math.min(
        Math.abs(vPhase - pulseRadius),
        1 - Math.abs(vPhase - pulseRadius)
      );
      const pulseRing = Math.max(0, 1 - phaseDist / p.beatPulseWidth) * beatPulse;

      // === 8. FADES DE DISTÂNCIA ===
      // Perto = brilhante, longe = escuro
      const depthBrightness = 1.0 - normDist * 0.35;

      // Fade na borda
      const edgeFade = normDist > p.edgeFadeStart
        ? (1 - normDist) / (1 - p.edgeFadeStart)
        : 1.0;

      // === 9. COMBINAR ===
      let intensity = pattern * 0.75 + pulseRing * 0.25;
      intensity *= depthBrightness * edgeFade;

      return Math.max(0, Math.min(1, intensity));
    },

    layerSelection(ctx) {
      const { angleFraction, bandVal, crest, beatPulse, normDist, NL, t } = ctx;
      const p = this.params;

      // Aproximar UV para seleção de layer
      const vApprox = p.depthK / (normDist + 0.01) + t * p.baseScrollSpeed;
      const uApprox = angleFraction * p.uScale;

      // Variar layers com UV + áudio
      const vVariation = Math.sin(vApprox * p.vLayerFreq) * NL * 0.5;
      const uVariation = Math.sin(uApprox * p.uLayerFreq) * NL * 0.3;
      const bandComponent = bandVal * p.bandLayerWeight * NL;
      const beatBoost = beatPulse * p.beatLayerBoost * NL;

      return vVariation + uVariation + bandComponent + beatBoost;
    }
  }
};

/*
  tunnel_v4 — Túnel Wireframe v4
  Grade 3D de alta definição com espaços vazios e perspectiva extrema
*/
const ARCHIVED_tunnel_v4 = {
  name: 'Túnel Wireframe v4',
  description: 'Grade 3D de alta definição com espaços vazios e perspectiva extrema',

  params: {
    numLongLines: 10,      // Menos linhas para mais clareza
    ringSpacing: 0.8,      // Anéis mais espaçados
    scrollSpeed: 4.5,      // Velocidade MUITO maior para ser óbvia
    perspective: 0.15,     // Perspectiva mais "profunda"
    lineWidth: 80,         // Linhas ultra-finas e nítidas

    // Áudio
    bassPulse: 0.8,        // O grave "abre" o túnel
    highJitter: 0.12       // Tremor elétrico
  },

  compute: {
    spinAngle(ctx) {
      const { angle, t, smoothHigh, globalSpin } = ctx;
      const p = this.params;
      return angle + globalSpin + smoothHigh * p.highJitter;
    },

    waves(ctx) {
      const { normDist, t, smoothBass, beatPulse } = ctx;
      const p = this.params;

      // 1. Perspectiva Exponencial Agressiva
      if (normDist < 0.05) return 0;

      // Mapeamento Z: quanto menor normDist, maior o Z (mais longe)
      const z = p.perspective / Math.pow(normDist, 1.5);

      // 2. Coordenadas de Grade
      const u = ctx.angleFraction * p.numLongLines;
      const v = z - t * p.scrollSpeed - smoothBass * p.bassPulse;

      // 3. Funções de Linha (Seno com potência altíssima = linha fina)
      const longLine = Math.pow(Math.abs(Math.sin(u * Math.PI)), p.lineWidth);
      const transRing = Math.pow(Math.abs(Math.sin(v * Math.PI * p.ringSpacing)), p.lineWidth * 0.4);

      // 4. Lógica de "Gaiola" (Wireframe)
      let intensity = 0;
      if (longLine > 0.4) intensity = 0.6;
      if (transRing > 0.4) intensity = 1.0;
      if (longLine > 0.4 && transRing > 0.4) intensity = 1.2;

      // 5. Fade de Profundidade
      const brightness = Math.pow(normDist, 0.8);
      return intensity * brightness;
    },

    layerSelection(ctx) {
      const { normDist, smoothAmp, NL } = ctx;
      return 3.0 + smoothAmp * 0.5;
    }
  }
};
