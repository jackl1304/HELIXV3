# 🚀 HELIX - Schnellstart Anleitung

## ✅ Was wurde konfiguriert:

1. **OpenRouter API Key** - Aktiviert für alle Analytics-Services
2. **Windows-Kompatibilität** - Alle Pfade und Skripte angepasst
3. **Datenbank-Support** - PostgreSQL (lokal oder Netcup)
4. **Mock-Datenbank** - Funktioniert auch ohne Datenbank

## 🚀 Projekt starten:

### Option 1: Mit OpenRouter (Empfohlen)
```powershell
.\start-all-with-openrouter.ps1
```

### Option 2: Manuell
```powershell
$env:OPENROUTER_API_KEY="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"
$env:OPENAI_API_KEY=$env:OPENROUTER_API_KEY
$env:ANTHROPIC_API_KEY=$env:OPENROUTER_API_KEY
$env:DATABASE_URL="postgresql://helix_user:helix_password@localhost:5432/helix_regulatory"
$env:NODE_ENV="development"
$env:PORT="5000"
npm run dev
```

## 🗄️ Datenbanken starten (Optional):

### Mit Docker:
```powershell
docker-compose -f docker-compose.dev.yml up -d
```

### Für Netcup:
Verwenden Sie Ihre Netcup PostgreSQL-Datenbank:
```
DATABASE_URL=postgresql://user:password@netcup-db-host:5432/database
```

## 📝 Wichtige Informationen:

- **OpenRouter API**: Unterstützt OpenAI, Anthropic/Claude, und mehr
- **Datenbank**: Funktioniert mit Mock-DB (Entwicklung) oder echter PostgreSQL
- **Netcup**: Keine Neon-Datenbank nötig - verwenden Sie Netcup PostgreSQL
- **Port**: 5000 (http://localhost:5000)

## 🔧 Troubleshooting:

1. **Docker nicht verfügbar**: Projekt läuft mit Mock-Datenbank
2. **Port 5000 belegt**: Ändern Sie PORT in Umgebungsvariablen
3. **Datenbank-Fehler**: Prüfen Sie DATABASE_URL Format

## 🌐 URLs nach Start:

- Frontend & Backend: http://localhost:5000
- Health Check: http://localhost:5000/health
- API: http://localhost:5000/api




