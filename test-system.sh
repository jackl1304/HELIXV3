#!/bin/bash
# Forensische End-to-End System-Prüfung
# Prüft: Datenbank → API → JSON Response → Datenqualität

echo "═══════════════════════════════════════════════════════════"
echo "🔍 HELIX V3 - FORENSISCHE SYSTEM-PRÜFUNG"
echo "═══════════════════════════════════════════════════════════"
echo ""

BASE_URL="http://localhost:5000"

# Farben für Output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test-Funktion
test_endpoint() {
    local name=$1
    local endpoint=$2
    local expected_field=$3

    echo -e "${YELLOW}[TEST]${NC} $name"
    echo "       Endpoint: $endpoint"

    response=$(curl -s "$BASE_URL$endpoint")

    if [ -z "$response" ]; then
        echo -e "       ${RED}✗ FAIL${NC} - Keine Antwort"
        return 1
    fi

    # Prüfe ob gültiges JSON
    if ! echo "$response" | jq empty 2>/dev/null; then
        echo -e "       ${RED}✗ FAIL${NC} - Kein gültiges JSON"
        echo "       Response: ${response:0:100}..."
        return 1
    fi

    # Prüfe erwartetes Feld
    if [ -n "$expected_field" ]; then
        field_value=$(echo "$response" | jq -r ".[0].$expected_field // .\"$expected_field\" // empty" 2>/dev/null)
        if [ -z "$field_value" ] || [ "$field_value" = "null" ]; then
            echo -e "       ${RED}✗ FAIL${NC} - Feld '$expected_field' fehlt oder null"
            return 1
        fi
        echo -e "       ${GREEN}✓ PASS${NC} - Feld '$expected_field' vorhanden: $field_value"
    else
        echo -e "       ${GREEN}✓ PASS${NC} - Gültiges JSON empfangen"
    fi

    echo ""
}

# Test-Funktion für Datenqualität
test_data_quality() {
    local endpoint=$1
    local limit=$2

    echo -e "${YELLOW}[DATEN-QUALITÄT]${NC} $endpoint"

    response=$(curl -s "$BASE_URL$endpoint?limit=$limit")
    count=$(echo "$response" | jq 'length' 2>/dev/null)

    if [ -z "$count" ] || [ "$count" = "0" ]; then
        echo -e "       ${RED}✗ FAIL${NC} - Keine Daten vorhanden"
        return 1
    fi

    echo "       Anzahl Einträge: $count"

    # Prüfe ersten Eintrag auf kritische Felder
    first=$(echo "$response" | jq '.[0]' 2>/dev/null)

    # Prüfe Pflichtfelder
    title=$(echo "$first" | jq -r '.title // empty')
    source=$(echo "$first" | jq -r '.source // .source_name // empty')
    date=$(echo "$first" | jq -r '.publishedAt // .published_date // .created_at // empty')

    echo ""
    echo "       📋 Beispiel-Eintrag:"
    echo "       ├─ Titel: ${title:0:60}..."
    echo "       ├─ Quelle: $source"
    echo "       └─ Datum: $date"

    # Validierung
    if [ -z "$title" ] || [ "$title" = "null" ]; then
        echo -e "       ${RED}✗ FAIL${NC} - Titel fehlt"
        return 1
    fi

    if [ -z "$source" ] || [ "$source" = "null" ] || [ "$source" = "unknown" ]; then
        echo -e "       ${RED}✗ FAIL${NC} - Quelle fehlt oder 'unknown'"
        return 1
    fi

    if [ -z "$date" ] || [ "$date" = "null" ]; then
        echo -e "       ${RED}✗ FAIL${NC} - Datum fehlt"
        return 1
    fi

    echo -e "       ${GREEN}✓ PASS${NC} - Alle Pflichtfelder vorhanden"
    echo ""
}

# 1. Health Checks
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  HEALTH & READINESS CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_endpoint "Health Check" "/health" "status"
test_endpoint "Readiness Check" "/ready" "ready"

# 2. API Endpoints
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  API ENDPOINT TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_endpoint "Data Sources" "/api/data-sources" "name"
test_endpoint "Regulatory Updates" "/api/regulatory-updates?limit=1" "title"

# 3. Datenqualität
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  DATENQUALITÄT PRÜFUNG"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_data_quality "/api/regulatory-updates" 10

# 4. Duplikat-Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  DUPLIKAT-CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${YELLOW}[CHECK]${NC} Prüfe auf doppelte Titel in API Response"

response=$(curl -s "$BASE_URL/api/regulatory-updates?limit=100")
titles=$(echo "$response" | jq -r '.[].title' 2>/dev/null | sort)
duplicates=$(echo "$titles" | uniq -d | wc -l)

if [ "$duplicates" -gt 0 ]; then
    echo -e "       ${RED}✗ FAIL${NC} - $duplicates doppelte Titel gefunden in API Response"
    echo "$titles" | uniq -d | head -5
else
    echo -e "       ${GREEN}✓ PASS${NC} - Keine Duplikate in API Response"
fi

echo ""

# 5. Kategorien-Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  KATEGORIEN & TYPEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${YELLOW}[ANALYSE]${NC} Prüfe vorhandene Kategorien"

response=$(curl -s "$BASE_URL/api/regulatory-updates?limit=500")

# Zähle verschiedene Typen
types=$(echo "$response" | jq -r '.[].type // "unknown"' 2>/dev/null | sort | uniq -c | sort -rn)
echo "       Typen-Verteilung:"
echo "$types" | head -10 | sed 's/^/       /'

echo ""

# Zähle Quellen
sources=$(echo "$response" | jq -r '.[].source // .source_name // "unknown"' 2>/dev/null | sort | uniq -c | sort -rn)
echo "       Quellen-Verteilung:"
echo "$sources" | head -10 | sed 's/^/       /'

echo ""

# 6. Zusammenfassung
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 ZUSAMMENFASSUNG"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

total_updates=$(curl -s "$BASE_URL/api/regulatory-updates" | jq 'length' 2>/dev/null)
total_sources=$(curl -s "$BASE_URL/api/data-sources" | jq 'length' 2>/dev/null)

echo "📦 Gesamtanzahl regulatory_updates: $total_updates"
echo "📚 Gesamtanzahl data_sources: $total_sources"
echo ""
echo "✅ Prüfung abgeschlossen"
echo ""
