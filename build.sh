#!/bin/bash
# build.sh - Gera index.html standalone com animações inline

set -e

echo "🔨 Building standalone index.html..."

# Usa sed para substituir a tag do script pelo conteúdo do arquivo animations.js envolto em tags <script>
# Criamos um arquivo temporário para facilitar
TEMP_FILE=$(mktemp)

# Lê o início do arquivo até a linha do script
sed '/<script src="animations.js"><\/script>/,$d' src/index.html >"$TEMP_FILE"

# Adiciona o conteúdo do script
echo "<script>" >>"$TEMP_FILE"
cat src/animations.js >>"$TEMP_FILE"
echo "</script>" >>"$TEMP_FILE"

# Adiciona o restante do arquivo
sed '1,/<script src="animations.js"><\/script>/d' src/index.html >>"$TEMP_FILE"

# Move para o destino final
mv "$TEMP_FILE" index.html

echo "✅ Build concluído: index.html"
echo ""
echo "📦 Arquivos:"
echo "   - src/index.html       (dev: use com servidor local)"
echo "   - src/animations.js    (dev: edite animações aqui)"
echo "   - index.html           (standalone: commit este arquivo)"
echo ""
echo "🚀 Para testar localmente durante dev:"
echo "   cd src && python -m http.server 8000"
echo "   Abra http://localhost:8000"
echo ""
echo "📤 Para commit:"
echo "   git add index.html src/"
echo "   git commit -m 'Atualizar visualizador'"
