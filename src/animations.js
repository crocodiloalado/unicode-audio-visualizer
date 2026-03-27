// === Animation Library ===
const ANIMATION_LIBRARY = {
  helix: {
    name: 'Hélice',
    description: 'Rotação helicoidal com ondas radiais concêntricas',

    params: {
      baseSpinRate: 0.012,
      bassSpinMult: 0.07,
      ampSpinMult: 0.025,
      spiralFactor: 0.006,
      waves: [
        { freq: 5,  speed: 0.22, bassBoost: 0.7  },
        { freq: 8,  speed: 0.35, midBoost: 0.5   },
        { freq: 11, speed: 0.50, highBoost: 0.35 }
      ],
      layerAngularWeight: 1.0,
      layerBandWeight: 1.2,
      layerCrestWeight: 0.6
    },

    compute: {
      spinAngle(ctx) {
        const { angle, normDist, t, smoothBass, smoothAmp, globalSpin } = ctx;
        const p = this.params;
        const spinRate = p.baseSpinRate + smoothBass * p.bassSpinMult + smoothAmp * p.ampSpinMult;
        return angle + globalSpin + t * spinRate + t * p.spiralFactor * normDist;
      },

      waves(ctx) {
        const { normDist, t, smoothBass, smoothMid, smoothHigh } = ctx;
        const p = this.params;
        const waves = p.waves.map((w, i) => {
          return Math.sin(normDist * w.freq - t * (w.speed +
            (i === 0 ? smoothBass * w.bassBoost :
             i === 1 ? smoothMid * w.midBoost :
             smoothHigh * w.highBoost))) * 0.5 + 0.5;
        });

        const totalEnergy = smoothBass + smoothMid + smoothHigh + 0.001;
        return waves[0] * (smoothBass / totalEnergy) +
               waves[1] * (smoothMid / totalEnergy) +
               waves[2] * (smoothHigh / totalEnergy);
      },

      layerSelection(ctx) {
        const { angleFraction, bandVal, crest, tensionChaos, NL } = ctx;
        const p = this.params;
        return angleFraction * NL * p.layerAngularWeight +
               bandVal * p.layerBandWeight +
               crest * p.layerCrestWeight +
               tensionChaos;
      }
    }
  },

  tunnel: {
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
  },

  tunnel_v3: {
    name: 'Túnel Retro v3',
    description: 'Efeito clássico de túnel com perspectiva 3D e movimento contínuo',

    params: {
      uSegments: 8,          // segmentos ao redor do túnel
      vRings: 12,            // densidade de anéis
      scrollSpeed: 1.8,      // velocidade de deslocamento frontal
      rotationSpeed: 0.15,   // rotação suave do túnel
      depthK: 0.8,           // curvatura da perspectiva
      
      // Áudio (opcional para o efeito base)
      bassWarp: 0.25,        // distorção radial por graves
      highJitter: 0.05       // vibração angular por agudos
    },

    compute: {
      spinAngle(ctx) {
        const { angle, t, smoothHigh, globalSpin } = ctx;
        const p = this.params;
        // Rotação contínua + pequena interferência de agudos
        return angle + globalSpin + t * p.rotationSpeed + smoothHigh * p.highJitter;
      },

      waves(ctx) {
        const { normDist, t, smoothBass, smoothMid, beatPulse } = ctx;
        const p = this.params;

        // 1. Mapeamento de Perspectiva (V)
        // Usamos 1/dist para criar a sensação de profundidade infinita
        // Adicionamos um pequeno offset para evitar a singularidade no centro exato
        const perspectiveV = p.depthK / (normDist + 0.06);
        
        // 2. Coordenadas de Textura Animadas
        // V aumenta com o tempo (movimento para frente)
        // U é o ângulo normalizado (0-1)
        const v = perspectiveV + t * p.scrollSpeed;
        const u = (ctx.angleFraction * p.uSegments);

        // 3. Padrão Checkerboard (Xadrez)
        const checkU = Math.floor(u) % 2;
        const checkV = Math.floor(v * p.vRings) % 2;
        let pattern = (checkU === checkV) ? 1.0 : 0.2;

        // 4. Interferência de Áudio
        // Graves "empurram" as paredes para fora
        const audioWall = smoothBass * p.bassWarp;
        pattern += audioWall * (1.0 - normDist); // Mais forte nas bordas

        // 5. Fade de Profundidade (Fog)
        // O centro (normDist próximo a 0) deve ser mais escuro
        const fog = Math.min(1.0, normDist * 4.0);
        
        // Brilho no beat
        const beatFlash = beatPulse * 0.4;

        return (pattern + beatFlash) * fog;
      },

      layerSelection(ctx) {
        const { normDist, smoothAmp, NL } = ctx;
        // Camadas mais sólidas no fundo (bordas), mais leves no centro
        // Usando Layer 1 (blocos) ou Layer 3 (box drawing) para estrutura
        const baseLayer = 1.0; // Inicia na camada de blocos
        const depthEffect = (1.0 - normDist) * 2.0;
        return baseLayer + depthEffect + smoothAmp * 2.0;
      }
    }
  }
};

let activeAnimation = 'helix';

function setAnimation(animKey) {
  if (ANIMATION_LIBRARY[animKey]) {
    activeAnimation = animKey;
  }
}

/* === TEMPLATE DE NOVA ANIMAÇÃO ===

nome_da_animacao: {
  name: 'Nome em Português',
  description: 'Descrição do comportamento visual',

  params: {
    // Parâmetros numéricos ajustáveis
    // Exemplo: velocidades, frequências, multiplicadores
  },

  compute: {
    // OBRIGATÓRIO: como calcular o ângulo de spin
    spinAngle(ctx) {
      const { angle, normDist, t, smoothBass, smoothMid, smoothHigh, globalSpin } = ctx;
      const p = this.params;

      // Retorne o ângulo modificado
      return angle; // ou cálculo mais complexo
    },

    // OBRIGATÓRIO: como calcular ondas/cristas
    waves(ctx) {
      const { normDist, t, smoothBass, smoothMid, smoothHigh, beatPulse } = ctx;
      const p = this.params;

      // Retorne valor 0-1 representando intensidade da onda
      return 0.5;
    },

    // OBRIGATÓRIO: como selecionar layer
    layerSelection(ctx) {
      const { angleFraction, normDist, bandVal, crest, tensionChaos, NL } = ctx;
      const p = this.params;

      // Retorne float que será convertido em índice de layer
      return angleFraction * NL;
    }
  }
}

=== FIM DO TEMPLATE === */
