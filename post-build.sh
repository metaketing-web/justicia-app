#!/bin/bash
# Script de post-build pour copier automatiquement les assets

echo "🔧 Post-build: Copie des assets..."

# Copier tous les assets depuis public_assets vers dist
cp /home/ubuntu/public_assets/* /home/ubuntu/dist/ 2>/dev/null

echo "✅ Assets copiés:"
ls -lh /home/ubuntu/dist/*.{png,gif,ico,js} 2>/dev/null | grep -E "justicia|favicon|pdf.worker" | wc -l
echo "fichiers copiés"

echo "✅ Post-build terminé!"
