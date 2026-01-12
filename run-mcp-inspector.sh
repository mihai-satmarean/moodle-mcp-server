#!/bin/bash

# Script pentru rularea MCP Inspector cu Moodle MCP Server
# Nu modifică codul original, doar setează variabilele de mediu

echo "🔍 Pornire MCP Inspector pentru Moodle MCP Server..."
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

# Încarcă environment variables din .env
echo "🔍 Încărcare environment variables din .env..."
source .env

# Verifică dacă toate variabilele sunt setate
if [ -z "$MOODLE_API_URL" ]; then
    echo "❌ MOODLE_API_URL nu este setat"
    exit 1
fi

if [ -z "$MOODLE_API_TOKEN" ]; then
    echo "❌ MOODLE_API_TOKEN nu este setat"
    exit 1
fi

if [ -z "$MOODLE_COURSE_ID" ]; then
    echo "❌ MOODLE_COURSE_ID nu este setat"
    exit 1
fi

echo "✅ Toate environment variables sunt setate:"
echo "   - MOODLE_API_URL: $MOODLE_API_URL"
echo "   - MOODLE_API_TOKEN: ${MOODLE_API_TOKEN:0:8}..."
echo "   - MOODLE_COURSE_ID: $MOODLE_COURSE_ID"

echo ""
echo "🎯 Pornire MCP Inspector..."
echo "📝 Inspector-ul va deschide un browser pentru testarea tools-urilor MCP"
echo "============================================================"

# Rulează MCP Inspector cu environment variables setate
export MOODLE_API_URL
export MOODLE_API_TOKEN
export MOODLE_COURSE_ID

npx @modelcontextprotocol/inspector build/index.js
