# Helix Dev Server - Test Anleitung

## Problem auf Windows Git Bash
`curl` und PowerShell-Aufrufe aus Git Bash senden SIGINT an den Dev-Server → Server stirbt.

## Lösung: Zwei separate Fenster

### Fenster 1: Dev Server (Git Bash oder PowerShell)
```bash
cd /l/HELIXV3/HELIXV3
npm run dev
```

Server startet auf **http://localhost:5000**

**Wichtig**: Dieses Terminal NICHT schließen, läuft im Foreground.

### Fenster 2: Tests (Neue PowerShell/CMD, NICHT Git Bash)

Öffne **separates** PowerShell-Fenster (nicht aus Git Bash starten):

#### Option A: PowerShell Test-Script
```powershell
cd L:\HELIXV3\HELIXV3
.\test-endpoints.ps1
```

#### Option B: Manuelle curl Tests (CMD oder PowerShell)
```bash
# Health Check
curl http://localhost:5000/health

# Ready Check (DB Ping)
curl http://localhost:5000/ready

# Regulatory Updates (mit source und publishedAt Feldern)
curl "http://localhost:5000/api/regulatory-updates?limit=3"

# Data Sources Liste
curl http://localhost:5000/api/data-sources
```

#### Option C: Browser Test
Öffne im Browser:
- http://localhost:5000/health
- http://localhost:5000/api/regulatory-updates?limit=3

## Was du sehen solltest

### /health
```json
{
  "status": "healthy",
  "timestamp": "2025-11-24T14:05:00.000Z",
  "environment": "production",
  "uptime": 123.45,
  "memoryUsage": {"rss": 89123456, "heapUsed": 45678901}
}
```

### /ready
```json
{
  "ready": true,
  "database": "connected",
  "timestamp": "2025-11-24T14:05:00.000Z"
}
```

### /api/regulatory-updates
Jeder Eintrag sollte haben:
- **source**: Name der Quelle (z.B. "FDA", "EMA", "BfArM")
- **publishedAt**: Datum im ISO 8601 Format
- **title**: Titel des Updates

```json
[
  {
    "id": 123,
    "title": "New Medical Device Regulation",
    "source": "FDA",
    "publishedAt": "2025-01-15T00:00:00.000Z",
    "jurisdiction": "US",
    "...": "..."
  }
]
```

### /api/data-sources
Liste aller konfigurierten Datenquellen (110+):
```json
[
  {"id": 1, "name": "FDA MedWatch", "type": "rss", "url": "...", "active": true},
  {"id": 2, "name": "EMA RSS Feed", "type": "rss", "url": "...", "active": true}
]
```

## Warum kein PM2/Background?

PM2 auf Windows Git Bash kann npm.cmd/npx.cmd nicht korrekt ausführen (versucht Batch-Dateien als JavaScript zu parsen).

**Für Dev**: Foreground in dediziertem Terminal ist akzeptabel und hotreload funktioniert.

**Für Production**: Separates Deployment-Setup ohne esbuild-Bundle (siehe PRODUCTION_DEPLOYMENT_GUIDE.md).

## Nächste Schritte nach erfolgreichen Tests

1. ✅ Bestätige: Alle 4 Endpoints antworten
2. ✅ Bestätige: `source` und `publishedAt` Felder sind gefüllt
3. ✅ Commit working state: `git add . && git commit -m "Dev mode stable, endpoints tested"`
4. 🔄 Production Strategy separat planen (kein esbuild-Bundle)
