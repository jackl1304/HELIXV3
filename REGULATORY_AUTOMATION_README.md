## Regulatory Automation Erweiterungen (Stand 23.11.2025)

### Neue Funktionen
- HTML Parsing: MDCG Guidance & MHRA Device Alerts (Cheerio)
- Klassifikation: Heuristischer `riskScore` (0–100) + `aiKeyPoints`
- Dedup verbessert: Titel + Datum + Quelle + `hashed_title` Normalisierung
- Embeddings (optional): Embedding-API `text-embedding-3-small` für semantische Suche (`embedding` Spalte)
- Status Endpoint: `GET /api/reg-automation/status` (Quell-Counts, letzter Lauf, Fehler)

### Neue Schema-Felder
- `regulatory_updates.hashed_title` (Index) – schnelle Duplikaterkennung
- `regulatory_updates.embedding` – Vektor (pgvector, 1536 Dimensionen)
- `risk_score`, `ai_key_points` werden nun gefüllt

### Environment Variablen
```
REG_AUTO_ENABLED=true            # Aktiviert automatische Speicherung (sonst nur dryRun bei CLI ohne --dry)
REG_MAX_ITEMS=75                 # Globaler Cap nach Sammlung
REG_EMBED_ENABLED=true           # Embeddings generieren (OPENAI_API_KEY erforderlich)
EMBEDDING_API_KEY=sk-...            # API Key für Embeddings
```

Optional (zukünftige Erweiterungen):
```
REG_SOURCES="fda_enforcement,mdcg_guidance,mhra_alerts"  # Quellliste filtern
```

### Nutzung
CLI Dry-Run (nur sammeln, keine Speicherung):
```bash
node server/services/regulatoryUpdateCollector.ts --dry
```

Live-Lauf (Speichern aktiviert):
```bash
export REG_AUTO_ENABLED=true
node server/services/regulatoryUpdateCollector.ts
```

Embeddings aktivieren:
```bash
export OPENAI_API_KEY=sk-xxxx
export REG_EMBED_ENABLED=true
node server/services/regulatoryUpdateCollector.ts
```

### Status Abrufen
```bash
curl http://localhost:5000/api/reg-automation/status | jq
```

Antwort-Beispiel:
```json
{
  "run": {
    "lastRunAt": "2025-11-23T11:05:10.123Z",
    "durationSec": 4.21,
    "collected": 42,
    "stored": 38,
    "errors": []
  },
  "sources": [
    { "id": "fda_enforcement", "name": "FDA Device Enforcement", "enabled": true, "type": "alert", "region": "US", "count": 120 },
    { "id": "mdcg_guidance", "name": "MDCG Guidance", "enabled": true, "type": "guidance", "region": "EU", "count": 85 },
    { "id": "mhra_alerts", "name": "MHRA Alerts", "enabled": true, "type": "alert", "region": "UK", "count": 64 }
  ],
  "embedEnabled": true
}
```

### Erweiterungspotential
- Feinere Datums-Extraktion (Parsing von PDF-Dateinamen / Detailseiten)
- NLP-Kategorisierung (Produktklasse, Prozessbereich)
- Priorisierung mit ML statt heuristisch
- Delta-Erkennung: Unterschiede zwischen alter & neuer Version eines Dokuments
- Scheduler (cron) für periodische Läufe (z.B. stündlich)

### Sicherheits- & Qualitätsaspekte
- Rate Limits: Retry/Backoff für HTML/JSON Quellen implementiert
- Datenvalidierung: Minimale Normalisierung (Hash, Titel-Länge begrenzt)
- Fehlerrobustheit: Fallback-Einträge bei Parsingfehlern statt harter Abbruch

### Audit / Rückverfolgbarkeit
- Jede Speicherung versieht Datensatz mit `created_at`/`updated_at`
- Dedup verhindert Mehrfacheinträge pro Quelle + Titel + Datum
- Embeddings erlauben später semantische Änderungsverfolgung

### Nächste Prioritäten (empfohlen)
1. CourtListener Pagination
2. API Filter (Quelle, Risiko, Zeitraum)
3. Dashboard-Karten (Top RiskScore, Neue Guidance, Alerts letzte 7 Tage)
4. Batch-Embedding für alte Datensätze nach Aktivierung
5. Automatische Maßnahmen-Prefill aus aiKeyPoints

---
Maintained by HELIX Regulatory Intelligence.
