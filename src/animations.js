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
        const perspectiveV = p.depthK / (normDist + 0.06);

        // 2. Coordenadas de Textura Animadas
        const v = perspectiveV + t * p.scrollSpeed;
        const u = (ctx.angleFraction * p.uSegments);

        // 3. Padrão Checkerboard (Xadrez)
        const checkU = Math.floor(u) % 2;
        const checkV = Math.floor(v * p.vRings) % 2;
        let pattern = (checkU === checkV) ? 1.0 : 0.2;

        // 4. Interferência de Áudio
        const audioWall = smoothBass * p.bassWarp;
        pattern += audioWall * (1.0 - normDist); // Mais forte nas bordas

        // 5. Fade de Profundidade (Fog)
        const fog = Math.min(1.0, normDist * 4.0);

        // Brilho no beat
        const beatFlash = beatPulse * 0.4;

        return (pattern + beatFlash) * fog;
      },

      layerSelection(ctx) {
        const { normDist, smoothAmp, NL } = ctx;
        const baseLayer = 1.0;
        const depthEffect = (1.0 - normDist) * 2.0;
        return baseLayer + depthEffect + smoothAmp * 2.0;
      }
    }
  },

  plasma: {
    name: 'Plasma',
    description: 'Campo fluido demoscene com modulação musical contínua',

    params: {
      baseSpin: 0.002,
      midSpinBoost: 0.01,
      bassRadialAmp: 0.45,
      midFreqBoost: 3.0,
      highGrain: 0.22,
      beatContrast: 0.35,
      layerBandWeight: 1.3,
      layerCrestWeight: 0.9
    },

    compute: {
      spinAngle(ctx) {
        const { angle, t, smoothMid, globalSpin } = ctx;
        const p = this.params;
        return angle + globalSpin + t * (p.baseSpin + smoothMid * p.midSpinBoost);
      },

      waves(ctx) {
        const { angle, normDist, t, smoothBass, smoothMid, smoothHigh, beatPulse } = ctx;
        const p = this.params;

        const freqBase = 6 + smoothMid * p.midFreqBoost;
        const radialAmp = 0.7 + smoothBass * p.bassRadialAmp;

        const x = Math.cos(angle) * normDist * freqBase;
        const y = Math.sin(angle) * normDist * (freqBase * 0.92);

        let value = 0;
        value += Math.sin(x * 1.6 + t * 0.9);
        value += Math.sin(y * 1.25 - t * 1.15);
        value += Math.sin((x + y) * 1.1 + t * 0.65);
        value += Math.sin(normDist * (11 + smoothBass * 9) - t * (1.7 + smoothMid * 0.8)) * radialAmp;

        const grain = Math.sin((x * 4.2 - y * 3.7) + t * 3.2) * (smoothHigh * p.highGrain);
        value += grain;

        // normalize from approx [-4.6, 4.6] to [0,1]
        let crest = value / 9.2 + 0.5;
        crest = Math.max(0, Math.min(1, crest));

        const contrast = 1 + beatPulse * p.beatContrast;
        return Math.pow(crest, 0.85) * contrast;
      },

      layerSelection(ctx) {
        const { angleFraction, bandVal, crest, NL } = ctx;
        const p = this.params;
        return angleFraction * NL * 0.35 + bandVal * p.layerBandWeight + crest * p.layerCrestWeight;
      }
    }
  },

  vortex: {
    name: 'Vórtice',
    description: 'Espiral centrípeta com braços reativos a graves e médios',

    params: {
      baseSpin: 0.01,
      bassSpinBoost: 0.03,
      radialPitch: 10,
      bassCompression: 0.35,
      midArmsBoost: 4.0,
      highEdgeJitter: 0.12,
      shockWidth: 0.12
    },

    compute: {
      spinAngle(ctx) {
        const { angle, t, normDist, smoothBass, globalSpin } = ctx;
        const p = this.params;
        const spin = p.baseSpin + smoothBass * p.bassSpinBoost;
        return angle + globalSpin + t * spin + normDist * 0.22;
      },

      waves(ctx) {
        const { angle, normDist, t, smoothBass, smoothMid, smoothHigh, beatPulse, pulseRadius } = ctx;
        const p = this.params;

        const r = normDist * (1 + smoothBass * p.bassCompression);
        const arms = 2 + smoothMid * p.midArmsBoost;
        const phase = arms * angle + r * (p.radialPitch + smoothBass * 6) - t * (1.5 + smoothMid * 1.1);

        let spiral = Math.sin(phase) * 0.5 + 0.5;
        const edgeNoise = Math.sin(angle * 18 + t * 4.5) * smoothHigh * p.highEdgeJitter * Math.pow(normDist, 1.6);
        spiral = Math.max(0, Math.min(1, spiral + edgeNoise));

        const core = Math.exp(-r * (2.2 - smoothBass * 0.8));
        const body = spiral * (0.55 + core * 0.45);

        const ringDist = Math.abs(normDist - pulseRadius);
        const shock = Math.max(0, 1 - ringDist / p.shockWidth) * beatPulse;

        return Math.max(0, Math.min(1, body * 0.9 + shock * 0.5));
      },

      layerSelection(ctx) {
        const { angleFraction, bandVal, crest, tensionChaos, NL } = ctx;
        return angleFraction * NL * 0.5 + bandVal * 1.2 + crest * 1.0 + tensionChaos * 0.6;
      }
    }
  },

  planeta: {
    name: 'Planeta',
    description: 'Rotação planetária com bandas atmosféricas diferenciais e turbulência musical',

    params: {
      baseSpin:        0.06,   // velocidade base de rotação
      differentialRate: 0.14,  // externo gira mais rápido que interno
      bandCount:       4,      // número de bandas atmosféricas
      bassSpinMult:    2.5,    // bass acelera rotação
      midTurbulence:   0.7,    // mid controla turbulência das bandas
      highDetail:      0.5,    // high adiciona textura de nuvens finas
    },

    compute: {
      spinAngle(ctx) {
        const { angle, normDist, t, smoothBass, smoothMid, globalSpin } = ctx;
        const p = this.params;

        // Rotação base com bass acelerando
        const rotation = t * p.baseSpin * (1 + smoothBass * p.bassSpinMult);

        // Rotação diferencial: camadas externas giram mais devagar
        // (camadas de nuvens vs. superfície)
        const diff = normDist * t * p.differentialRate;

        // Ondas concêntricas de banda: cria as faixas horizontais
        const bandPhase = normDist * Math.PI * p.bandCount;
        const bandWave = Math.sin(bandPhase + t * 0.25 + smoothMid * p.midTurbulence) * 0.4;

        return angle + globalSpin + rotation + diff + bandWave;
      },

      waves(ctx) {
        const { normDist, t, smoothBass, smoothMid, smoothHigh, beatPulse } = ctx;
        const p = this.params;

        // Bandas atmosféricas: padrão concêntrico que deriva com o tempo
        const bands = (Math.sin(normDist * Math.PI * p.bandCount * 2
                       + t * 0.18 + smoothMid * 1.1) + 1) * 0.5;

        // Textura de nuvens finas (alta frequência radial)
        const clouds = (Math.sin(normDist * 24 + t * 1.2 + smoothHigh * p.highDetail) + 1) * 0.22;

        // Brilho atmosférico na borda (limb brightening)
        const limb = Math.max(0, (normDist - 0.80) * 5) * (0.6 + beatPulse * 0.5);

        // Pulso de beat: relâmpago/tempestade
        const storm = beatPulse * (0.4 + smoothBass * 0.3) * (normDist < 0.7 ? 1 : 0.3);

        return Math.min(1, bands * 0.52 + clouds * 0.28 + limb * 0.25 + storm * 0.3);
      },

      layerSelection(ctx) {
        const { normDist, bandVal, crest, tensionChaos } = ctx;
        const p = this.params;

        // Estrutura atmosférica por profundidade (raio):
        // Centro (0-0.3):  braille ⠿ — superfície/oceano (layer 2)
        // Meio  (0.3-0.6): box ╬    — camada de nuvens   (layer 3)
        // Borda (0.6-1.0): círculos ○ — atmosfera fina    (layer 0-1)
        const radial = normDist * 3.8;
        return radial + bandVal * 0.5 + crest * 0.4 + tensionChaos * 0.6;
      }
    }
  },

  tempestade: {
    name: 'Tempestade',
    description: 'Furacão ciclônico com olho calmo, muro denso e braços espirais reativos',

    params: {
      baseSpin:    0.22,   // rotação base do vórtice
      spinBoost:   0.90,   // bass amplifica rotação
      spiralTight: 1.85,   // quão fechada é a espiral
      eyeRadius:   0.16,   // raio do olho calmo
      wallRadius:  0.38,   // raio do muro do furacão
      wallWidth:   0.16,   // largura do muro
      armCount:    3,      // número de braços espirais
    },

    compute: {
      spinAngle(ctx) {
        const { angle, normDist, t, smoothBass, smoothHigh, globalSpin, beatPulse } = ctx;
        const p = this.params;

        // Furacão real: centro gira mais rápido (velocidade inversamente prop. ao raio)
        const r = normDist * 0.85 + 0.15;  // evitar divisão por zero
        const spin = t * (p.baseSpin + smoothBass * p.spinBoost) / r;

        // Espiral: fase radial cria braços
        const spiral = normDist * p.spiralTight * (1 + smoothBass * 1.4);

        // Rajadas com beat (turbulência)
        const gust = beatPulse * 0.30 * Math.sin(normDist * 9 + t * 2.8);

        // Fricção de borda: extremo periférico desacelera
        const edgeDamp = normDist > 0.82 ? (1 - (normDist - 0.82) * 3) : 1;

        return angle + globalSpin + (spin + spiral + gust) * edgeDamp;
      },

      waves(ctx) {
        const { normDist, t, smoothBass, smoothMid, smoothHigh, beatPulse, angleFraction } = ctx;
        const p = this.params;

        // Olho: zona calma no centro
        const inEye = normDist < p.eyeRadius;
        const eyeFactor = inEye
          ? (normDist / p.eyeRadius)           // suave de 0 no centro → 1 na borda do olho
          : 1.0;

        // Muro do furacão: pico gaussiano de intensidade
        const wallDist = Math.abs(normDist - p.wallRadius);
        const wall = Math.exp(-(wallDist / p.wallWidth) ** 2)
                     * (0.75 + smoothBass * 0.70);

        // Braços espirais via angleFraction modulada
        const arms = (Math.sin(angleFraction * Math.PI * p.armCount * 2
                      + normDist * 4.5 + t * 0.5 + smoothMid * 0.8) + 1) * 0.28;

        // Relâmpagos com beat (fora do olho)
        const lightning = beatPulse * 0.55 * (inEye ? 0 : 1);

        // Névoa periférica
        const fog = Math.max(0, (normDist - 0.78) * 4) * 0.35;

        return Math.min(1, eyeFactor * (wall + arms + fog) + lightning);
      },

      layerSelection(ctx) {
        const { normDist, bandVal, crest, tensionChaos } = ctx;
        const p = this.params;

        // Olho: sparkles ✶ (layer 4) — calmo e brilhante
        if (normDist < p.eyeRadius * 1.1)
          return 4.0 + crest * 0.6;

        // Muro: braille ⠿ denso (layer 2) — parede sólida
        if (normDist < p.wallRadius + p.wallWidth)
          return 2.0 + bandVal * 0.9 + tensionChaos * 0.5;

        // Braços: box drawing ╬ (layer 3) — estrutura espiral
        if (normDist < 0.78)
          return 3.0 + crest * 0.6 + tensionChaos * 0.4;

        // Periferia: círculos ○ (layer 0-1) — névoa exterior
        return crest * 2.2 + bandVal * 0.5;
      }
    }
  },

  braille_constellation: {
    name: 'Constelação Braille',
    description: 'Campo estelar orbital com clusters e cintilação musical',

    params: {
      baseOrbit: 0.25,
      midOrbitBoost: 0.55,
      bassBreath: 0.28,
      highTwinkle: 0.35,
      sparsity: 0.68,
      clusterScale: 10.0,
      beatBurst: 0.55
    },

    compute: {
      spinAngle(ctx) {
        const { angle, t, smoothMid, globalSpin } = ctx;
        const p = this.params;
        return angle + globalSpin + t * (p.baseOrbit + smoothMid * p.midOrbitBoost) * 0.08;
      },

      waves(ctx) {
        const { angle, normDist, t, smoothBass, smoothMid, smoothHigh, beatPulse } = ctx;
        const p = this.params;

        const breath = 1 + smoothBass * p.bassBreath;
        const rr = normDist * breath;
        const a = angle + t * (0.18 + smoothMid * 0.25);

        const cx = Math.cos(a * 2.0) * rr * p.clusterScale;
        const cy = Math.sin(a * 1.7) * rr * (p.clusterScale * 0.9);
        const field =
          Math.sin(cx + t * 0.8) *
          Math.cos(cy - t * 1.1) *
          Math.sin((cx + cy) * 0.45 + t * 0.55);

        const twinkle = Math.sin(t * 7.5 + rr * 22 + a * 6) * (smoothHigh * p.highTwinkle);
        const signal = field * 0.8 + twinkle;

        const threshold = p.sparsity - smoothBass * 0.08 - beatPulse * 0.05;
        const ridge = Math.max(0, signal - threshold);
        let stars = Math.pow(ridge * 2.6, 1.8);

        const burst = beatPulse * p.beatBurst * Math.max(0, 1 - rr * 1.25);
        stars += burst;

        return Math.max(0, Math.min(1, stars));
      },

      layerSelection(ctx) {
        const { crest, bandVal } = ctx;
        // lock around Braille layer (index 2), with slight variation
        return 2.0 + crest * 0.7 + bandVal * 0.2;
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
