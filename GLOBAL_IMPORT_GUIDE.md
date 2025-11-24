# Global Import Guide

Dieser Leitfaden beschreibt das Vorgehen zur Ausführung aller regulatorischen Datenimporte (FDA, EMA, WHO, MHRA, Health Canada, TGA, PMDA) inklusive Vorbereitung, Validierung und Fehleranalyse.

## 1. Vorbereitung
- Erforderliche Env Variable: `DATABASE_URL` (Format: `postgres://USER:PASS@HOST:PORT/helix_regulatory`)
- Falls Docker Compose genutzt wird:
  - Setze `POSTGRES_PASSWORD` (z.B. export POSTGRES_PASSWORD=secret)
  - Starte Container: `docker compose up -d postgres`
  - Erzeuge URL lokal: `postgres://helix_user:secret@localhost:5432/helix_regulatory`
- Installiere Abhängigkeiten: `npm install`

## 2. Migration
- Schema push (Drizzle): `npm run db:push`
- Oder manuell: `npx tsx scripts/run-manual-migration.ts migrations/20251123_regulatory_core.sql`
- Validierung: `SELECT table_name FROM information_schema.tables WHERE table_schema='public';`

## 3. Einzelimporte (optional vor Gesamtlauf)
```bash
npx tsx scripts/import-fda-510k.ts --limit=30
npx tsx scripts/import-ema-news.ts --limit=15
npx tsx scripts/import-who-guidance.ts
npx tsx scripts/import-mhra-updates.ts
npx tsx scripts/import-healthcanada-notices.ts
npx tsx scripts/import-tga-updates.ts
npx tsx scripts/import-pmda-announcements.ts
```

## 4. Aggregierter Multi-Import
```bash
npx tsx scripts/import-all-global-sources.ts
```

## 5. Verifikation
Beispiele für schnelle Prüf-SQL (psql oder Neon Console):
```sql
SELECT count(*) FROM regulatory_updates;
SELECT category, count(*) FROM regulatory_updates GROUP BY category ORDER BY count DESC;
SELECT title, published_date FROM regulatory_updates ORDER BY created_at DESC LIMIT 15;
```

## 6. Dedup-Strategie
- Hash: `hashed_title` (SHA-256 Lowercase Titel) + `source_url` → verhindert doppelte Einträge.
- Bei Änderung der Originalquelle (Titeltext ändert sich geringfügig) kann ein neuer Eintrag entstehen. Nachbearbeitungsjob kann später Levenshtein-Clustering implementieren.

## 7. Priorisierung & Risiko
- Initial gesetzt durch Skripte (`priority` grob 1–3, `riskLevel` low/medium).
- Feinabstimmung durch nachgelagerte AI-Auswertung (späterer Schritt).

## 8. Fehlerbehandlung
- Netzwerkfehler → Skript beendet mit Exit Code ≠ 0: Erneut ausführen.
- Einzelne Insert-Fehler werden protokolliert und nicht blockierend behandelt.
- Prüfpunkt: Wenn Gesamtanzahl = 0, zuerst `DATABASE_URL` und Migration prüfen.

## 9. Sicherheit & Rate Limits
- FDA (openFDA) hat Rate Limits → Limit Parameter (`--limit=`) konservativ halten.
- Weitere Quellen: öffentlich, dennoch respektvoll mit Frequenz umgehen; später Cron/Scheduler mit Intervallen (z.B. WHO RSS alle 6h, EMA News täglich, PMDA wöchentlich).

## 10. Nächste Erweiterungen (Roadmap)
- Diff-/Delta-Modus (Nur neue seit letztem Lauf)
- Volltext-Extraktion verlinkter PDF Dokumente (Embedding + Semantic Search)
- KI-Klassifizierung von Impact (Produkt, Prozess, Qualitätssystem)
- Automatisierter Action Workflow (Erstellung von `reg_actions` Einträgen aus neuen Updates)

## 11. Troubleshooting Schnellliste
| Problem | Ursache | Lösung |
|---------|---------|--------|
| Keine Tabellen | Migration nicht ausgeführt | `npm run db:push` oder manueller Runner |
| 0 Einträge nach Aggregator | Netzwerk/Env Problem | Prüfe `DATABASE_URL`, Firewall, wiederhole Einzelskript |
| Duplicate Meldung | Titel bereits vorhanden | Erwartet, Hash greift; kein Handlungsbedarf |
| Langsame Laufzeit | Hohe Limits gesetzt | Reduziere `--limit` Parameter |
| WHO Skript Fehler XML | Feed URL geändert | Aktualisiere `FEED_URL` in Skript |

## 12. Compliance Hinweis
Nur öffentlich zugängliche und lizenzfreie Informationsquellen werden angefragt. Kein Umgehen von Access Controls. Bei späteren kommerziellen Datenfeeds separate Keys & Verträge nutzen.

---
Letzte Aktualisierung: 2025-11-23
