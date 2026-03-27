# Guia de Desenvolvimento

Este projeto usa uma estrutura modular durante o desenvolvimento, mas gera um arquivo standalone para distribuição.

## Estrutura de Arquivos

```
visualizer/
├── src/
│   ├── index.html        # Template principal (usa <script src>)
│   └── animations.js     # Biblioteca de animações (edite aqui!)
├── build.sh              # Script de build
└── index.html            # Resultado final standalone (não edite diretamente)
```

## Workflow de Desenvolvimento

### 1. Desenvolvimento Local (Modo Dev-Friendly)

Para testar mudanças durante desenvolvimento:

```bash
# Inicie servidor local na pasta src/
cd src
python -m http.server 8000

# Abra no navegador
http://localhost:8000
```

**Vantagens:**
- Edite `src/animations.js` e apenas dê refresh no navegador
- Sem necessidade de build a cada mudança
- Arquivos separados e organizados

### 2. Adicionar Nova Animação

Edite `src/animations.js` e adicione sua animação ao objeto `ANIMATION_LIBRARY`:

```javascript
// src/animations.js

const ANIMATION_LIBRARY = {
  helix: { ... },
  concentric_waves: { ... },

  // ADICIONE SUA NOVA ANIMAÇÃO AQUI ↓
  minha_animacao: {
    name: 'Minha Animação',
    description: 'Descrição do comportamento visual',

    params: {
      // Parâmetros ajustáveis
    },

    compute: {
      spinAngle(ctx) { /* ... */ },
      waves(ctx) { /* ... */ },
      layerSelection(ctx) { /* ... */ }
    }
  }
};
```

Depois adicione a opção no dropdown em `src/index.html`:

```html
<select id="anim-select" onchange="setAnimation(this.value)">
  <option value="helix">Hélice</option>
  <option value="concentric_waves">Ondas Concêntricas</option>
  <option value="minha_animacao">Minha Animação</option>
</select>
```

### 3. Build para Deploy

Antes de fazer commit, gere o `index.html` standalone:

```bash
./build.sh
```

Isso irá:
1. Ler `src/animations.js`
2. Ler `src/index.html`
3. Inline o conteúdo de `animations.js` dentro do HTML
4. Gerar `index.html` standalone na raiz

### 4. Commit

```bash
# Adicione tanto os arquivos src/ quanto o index.html gerado
git add src/ index.html
git commit -m "Add nova animação: minha_animacao"
git push
```

## Deploy (GitHub Pages)

O GitHub Pages continua servindo `index.html` na raiz — **nada muda** para os usuários finais!

Eles podem:
1. Acessar via GitHub Pages URL
2. Baixar `index.html` standalone e abrir localmente

## Verificação Rápida

**Teste standalone:**
```bash
./build.sh
xdg-open index.html
```

**Teste dev:**
```bash
cd src && python -m http.server 8000
# Abra http://localhost:8000
```

## Importante

- **NÃO edite `index.html` diretamente** — ele é gerado pelo build!
- **Sempre edite `src/animations.js`** para mudanças em animações
- **Rode `./build.sh`** antes de cada commit
- O `index.html` gerado **deve ser commitado** (é o que vai pro GitHub Pages)

## Troubleshooting

**Erro "ANIMATION_LIBRARY is not defined":**
- Certifique-se de que rodou `./build.sh`
- Ou use servidor local na pasta `src/`

**Animação não aparece no dropdown:**
- Verifique se adicionou a `<option>` em `src/index.html`
- Rode `./build.sh` novamente

**Mudanças não aparecem:**
- Se testando standalone: rode `./build.sh` + hard refresh (Ctrl+Shift+R)
- Se testando em dev: apenas refresh (Ctrl+R)
