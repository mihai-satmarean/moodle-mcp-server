#!/bin/bash

# Script pentru instalarea Moodle MCP Server în Cursor
# Configurează Cursor să folosească serverul MCP local

echo "🚀 Instalare Moodle MCP Server în Cursor..."
echo "📍 CWD: $(pwd)"
echo "📁 Build path: $(pwd)/build/index.js"
echo "============================================================"

# Verifică dacă fișierul build există
if [ ! -f "build/index.js" ]; then
    echo "❌ Fișierul build/index.js nu există!"
    echo "🔧 Rulează: npm run build"
    exit 1
fi

echo "✅ Fișierul build/index.js există"

# Verifică dacă .env există
if [ ! -f ".env" ]; then
    echo "❌ Fișierul .env nu există!"
    echo "🔧 Creează fișierul .env cu configurația Moodle"
    exit 1
fi

echo "✅ Fișierul .env există"

# Verifică dacă configurația MCP există
if [ ! -f "cursor-mcp-config.json" ]; then
    echo "❌ Fișierul cursor-mcp-config.json nu există!"
    echo "🔧 Creează configurația MCP"
    exit 1
fi

echo "✅ Fișierul cursor-mcp-config.json există"

# Afișează configurația MCP
echo ""
echo "📋 Configurația MCP pentru Cursor:"
echo "============================================================"
cat cursor-mcp-config.json | jq '.' 2>/dev/null || cat cursor-mcp-config.json

echo ""
echo "🔧 Instrucțiuni de instalare în Cursor:"
echo "============================================================"
echo "1. Deschide Cursor"
echo "2. Mergi la Settings (Cmd/Ctrl + ,)"
echo "3. Caută 'MCP' sau 'Model Context Protocol'"
echo "4. Adaugă configurația din cursor-mcp-config.json"
echo "5. Sau copiază conținutul în claude_desktop_config.json"
echo ""
echo "📍 Calea completă pentru server:"
echo "   $(pwd)/build/index.js"
echo ""
echo "🔑 Token Moodle:"
echo "   $(grep MOODLE_API_TOKEN .env | cut -d'=' -f2 | head -c8)..."
echo ""
echo "🎯 Tools MCP disponibile:"
echo "   - get_students: Lista cursanților"
echo "   - get_assignments: Temele disponibile"
echo "   - get_quizzes: Quiz-urile disponibile"
echo "   - get_submissions: Predările cursanților"
echo "   - provide_feedback: Feedback și note"
echo "   - get_submission_content: Conținutul predărilor"
echo "   - get_quiz_grade: Notele la quiz-uri"
echo ""
echo "✅ Instalare completă! Cursor poate folosi Moodle MCP Server-ul local."
echo ""
echo "🧪 Pentru testare:"
echo "   - Deschide Cursor"
echo "   - Încearcă: 'Listează cursanții din cursul 1'"
echo "   - Sau: 'Arată temele disponibile'"
