# 🚀 Schnellstart: Datenbank für HELIX einrichten

Du hast zwei Optionen:

## Option 1: Neon Database (Empfohlen für Windows - 5 Minuten)

### 1. Kostenloses Neon-Konto erstellen
```
https://neon.tech
→ Sign up (GitHub Login)
→ Create Project: "helix-prod"
→ Region: Frankfurt (EU-Central-1)
```

### 2. Connection String kopieren
```
Nach Projekt-Erstellung siehst du:
postgresql://user:password@ep-xyz.eu-central-1.aws.neon.tech/neondb?sslmode=require

→ Kopiere diese URL!
```

### 3. In .env einfügen
```bash
# Öffne L:\HELIXV3\HELIXV3\.env
# Ersetze die DATABASE_URL Zeile:
DATABASE_URL=postgresql://user:password@ep-xyz.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

### 4. Schema erstellen
```bash
cd L:\HELIXV3\HELIXV3
npm run db:push
```

### 5. Ersten Import starten
```bash
npx tsx scripts/import-fda-510k.ts --limit=50
```

✅ **Fertig!** Neon verwaltet Backups, Skalierung und Updates automatisch.

---

## Option 2: Docker Desktop (Wenn Docker bereits läuft)

### 1. Docker Desktop starten
```
Windows Start → Docker Desktop → Starten
```

### 2. PostgreSQL Container starten
```bash
docker run -d \
  --name helix-postgres \
  -e POSTGRES_USER=helix \
  -e POSTGRES_PASSWORD="helix_prod_2025!" \
  -e POSTGRES_DB=helix \
  -p 5432:5432 \
  postgres:17-alpine
```

### 3. Schema erstellen
```bash
cd L:\HELIXV3\HELIXV3
npm run db:push
```

### 4. Import testen
```bash
npx tsx scripts/import-fda-510k.ts --limit=50
```

---

## Nach erfolgreicher DB-Einrichtung

### 1. Server lokal starten
```bash
npm run dev
# Oder in Production-Modus:
npm run build && npm start
```

### 2. Im Browser öffnen
```
http://localhost:5000
```

### 3. Automatische Imports aktivieren
Die Imports starten automatisch alle 30 Minuten sobald der Server läuft!

Optional: Manueller Import-Trigger:
```bash
curl -X POST http://localhost:5000/api/source-import/trigger
```

### 4. Status prüfen
```bash
# Import-Status
curl http://localhost:5000/api/source-import/status

# Dashboard-Metriken
curl http://localhost:5000/api/dashboard/stats

# Anzahl Updates
curl http://localhost:5000/api/regulatory-updates | jq 'length'
```

---

## Troubleshooting

### "ECONNREFUSED"
→ Datenbank läuft nicht oder DATABASE_URL ist falsch
→ Lösung: Siehe Option 1 oder 2 oben

### "relation does not exist"
→ Schema fehlt in der Datenbank
→ Lösung: `npm run db:push`

### "Duplicate key error"
→ Normal! Bedeutet Import-Skript verhindert Duplikate erfolgreich
→ Alte Einträge werden übersprungen

### Logs auf Netcup Server prüfen
```bash
ssh root@152.53.191.99
pm2 logs helix --lines 100
```

---

## Nächste Schritte nach Neon-Setup

1. ✅ Neon DATABASE_URL in `.env` eintragen
2. ✅ `npm run db:push` ausführen
3. ✅ Ersten Import testen (siehe oben)
4. ✅ Build erstellen: `npm run build`
5. ✅ Auf Netcup deployen (VNC Console nutzen)

Dann läuft alles automatisch alle 30 Minuten!
