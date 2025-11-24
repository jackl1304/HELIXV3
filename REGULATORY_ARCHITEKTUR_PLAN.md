# REGULATORY ARCHITEKTUR & DATENMODELL (Helix)

## 1. Ziel & Scope
Ziel ist eine ganzheitliche, versionierte und auditierbare Abbildung sämtlicher regulatorischer Änderungen (Gesetze, Normen, Leitlinien, behördliche Entscheidungen) für MedTech / Medizinprodukte / Pharma über mindestens die letzten 24 Monate sowie fortlaufend. Alle Stakeholder (QM, Entwicklung, Management, Vorstand) erhalten kontextabhängige, priorisierte Information und klare Handlungsempfehlungen.

## 2. Stakeholder-Rollen & Kernanforderungen
| Rolle | Fokus | Benötigte Sichten | Aktionen |
|-------|-------|------------------|----------|
| QM-Beauftragte | Compliance-Vollständigkeit, Fristen | Änderungstimeline, Impact-Matrix, CAPA-Status | Maßnahmen anlegen, Fristen bestätigen |
| Entwickler:innen | Technische Auswirkungen (Software / Dokumentation) | Technische Impact-Liste, Mappings zu Komponenten | Tickets generieren, Implementierungsstatus pflegen |
| Regulatory / Legal | Juristische Bewertung | Gesetzes-/Normversionen, Konsolidierte Quellen | Kommentieren, Priorisierung |
| Vorstand / Management | Risiko & KPI | KPI-Dashboard (Offene Maßnahmen, Fristeneinhaltung, Risiko-Score) | Genehmigungen, Budgetfreigaben |
| Data Steward | Datenqualität & Quellen | Import-Log, Fehlerquoten | Re-Import starten, Quellenpflege |
| Audit / Interne Revision | Nachvollziehbarkeit | Vollständiger Änderungsverlauf, Signaturen | Export, Prüffälle anlegen |

## 3. Domänen-Module
1. Quellenverwaltung (Source Registry)
2. Regulatorische Änderungen (Regulatory Updates)
3. Normänderungen (Standards Evolution)
4. Gesetzesänderungen (Legislative Tracking)
5. Impact & Maßnahmen (Actions / Tasks)
6. Dokumente & Artefakte (Documents Repository)
7. Historisierung & Versionierung
8. Benachrichtigung & Reporting
9. Audit Logging & Governance

## 4. Datenfluss (High-Level)
```
Externe Quellen (API / Scrape / Feed)
  -> Ingestion Layer (Adapter, Normalisierung)
     -> Validation & Enrichment (Mapping von Codes, Klassifikation, Priorität)
        -> Persistenz (Core Tabellen + Version & Delta Tabellen)
           -> Aggregation Views (KPIs, Timeline, Impact-Matrix)
              -> API Endpoints (REST / ggf. GraphQL)
                 -> Frontend (Stakeholder-spezifische Sichten)
                    -> Aktionen zurück (Maßnahmen, Kommentare, Status)
                       -> Audit Trail + Benachrichtigungen
```

## 5. Versionierungsstrategie
- Jede Änderung (Update / Norm / Gesetz) erhält eine `base_id` + `revision` Nummer.
- Delta-Änderungen werden in separater Tabelle (`*_versions`) mit diff Feldern gespeichert.
- Hash (SHA256) über Normalisierte Nutzdaten zur Integritätsprüfung.
- Statusfelder: `is_current`, `superseded_at`.

## 6. Tabellenentwürfe (vereinfachtes Schema)
```sql
-- Quellen
CREATE TABLE sources (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('authority','standard_body','legislature','newsletter')),
  country TEXT,
  base_url TEXT,
  reliability_score INT,
  last_fetch TIMESTAMP,
  fetch_frequency TEXT,
  active BOOLEAN DEFAULT TRUE
);

-- Regulatorische Updates (Behörden, Leitlinien, Zulassungen)
CREATE TABLE regulatory_updates (
  id UUID PRIMARY KEY,
  source_id UUID REFERENCES sources(id),
  base_id UUID NOT NULL, -- konstanter Identifier über Revisionen
  revision INT NOT NULL,
  title TEXT,
  description TEXT,
  update_type TEXT, -- z.B. guidance, approval, warning, regulation
  jurisdiction TEXT,
  published_date DATE,
  effective_date DATE,
  priority INT, -- 1-5
  risk_level TEXT, -- low/medium/high
  action_required BOOLEAN,
  action_deadline DATE,
  document_url TEXT,
  status TEXT, -- draft/current/superseded
  hash TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Normänderungen (ISO / IEC / etc.)
CREATE TABLE norm_changes (
  id UUID PRIMARY KEY,
  source_id UUID REFERENCES sources(id),
  base_id UUID NOT NULL,
  revision INT NOT NULL,
  standard_code TEXT, -- ISO 13485, IEC 62304 etc.
  section TEXT, -- Abschnitt der Norm
  change_summary TEXT,
  impact_class TEXT, -- process, product, documentation
  published_date DATE,
  effective_date DATE,
  priority INT,
  requires_gap_analysis BOOLEAN,
  hash TEXT,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Gesetzesänderungen
CREATE TABLE law_changes (
  id UUID PRIMARY KEY,
  source_id UUID REFERENCES sources(id),
  base_id UUID NOT NULL,
  revision INT NOT NULL,
  law_code TEXT, -- MDR 2017/745, national code
  article TEXT,
  change_detail TEXT,
  impact TEXT,
  published_date DATE,
  effective_date DATE,
  compliance_deadline DATE,
  priority INT,
  hash TEXT,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Maßnahmen / Actions (abgeleitet aus Änderungen)
CREATE TABLE actions (
  id UUID PRIMARY KEY,
  reference_type TEXT CHECK (reference_type IN ('regulatory','norm','law')),
  reference_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  owner_role TEXT,
  owner_user TEXT,
  due_date DATE,
  status TEXT CHECK (status IN ('open','in_progress','blocked','done','verified')) DEFAULT 'open',
  risk_level TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Dokumente / Artefakte
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  reference_type TEXT,
  reference_id UUID,
  doc_type TEXT, -- original, summary, gap_analysis, evidence
  title TEXT,
  url TEXT,
  storage_path TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Impact Matrix (vorgefertigt zur schnellen Abfrage)
CREATE TABLE change_impacts (
  id UUID PRIMARY KEY,
  reference_type TEXT,
  reference_id UUID,
  process_impact BOOLEAN,
  product_impact BOOLEAN,
  software_impact BOOLEAN,
  documentation_impact BOOLEAN,
  validation_required BOOLEAN,
  requalification_required BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Trail
CREATE TABLE audit_trail (
  id UUID PRIMARY KEY,
  entity_type TEXT,
  entity_id UUID,
  action TEXT,
  performed_by TEXT,
  performed_role TEXT,
  before JSONB,
  after JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## 7. Indexierung & Performance
- Indizes auf (`jurisdiction`, `published_date`, `priority`, `standard_code`, `law_code`).
- Materialized Views für: Aktuelle Änderungen letzte 30 Tage, Fristen < 60 Tage, Offene Maßnahmen nach Risiko.
- Optional: Volltext-Suche (Postgres `tsvector`) für Titel & Beschreibung.

## 8. Priorisierungslogik (Beispiel)
```
priority = CASE
  WHEN risk_level = 'high' AND action_required THEN 5
  WHEN risk_level = 'high' THEN 4
  WHEN risk_level = 'medium' AND action_required THEN 4
  WHEN risk_level = 'medium' THEN 3
  WHEN action_required THEN 3
  ELSE 2
END
```

## 9. Rollenbasierte Zugriffskontrolle (RBAC)
| Rolle | Lesen | Schreiben | Freigabe | Audit Export |
|-------|-------|----------|----------|--------------|
| viewer | Basisdaten | Nein | Nein | Nein |
| qm | Voll | Aktionen, Bewertungen | Ja (Maßnahmen) | Teil |
| dev | Technische Impacts | Statusänderungen | Nein | Nein |
| legal | Gesetz/Normentext | Kommentare | Nein | Nein |
| management | KPIs | Kommentare | Strategische Freigabe | Ja |
| audit | Voll + Historie | Nein | Nein | Voll |

## 10. Benachrichtigungen & Eskalation
- Trigger bei neuen High-Risk Änderungen.
- Täglicher Digest offen + überfällig.
- Eskalationsstufen (Tage über Frist) → Management + Audit.

## 11. Qualitätssicherung Datenimporte
- Validierung: Pflichtfelder, Datumsformat, Normcode-Syntax.
- Duplikat-Erkennung über Hash + (source_id, base_id, revision).
- Fehlerschlange (Retry mit Backoff, manuelle Markierung als "ignored").

## 12. Roadmap (Kurzfassung)
Phasen:
1. Schema + Demo-Datensätze + Basis-Endpoints.
2. Adapter für 2 Hauptquellen (FDA, MDR).
3. Normänderungen (ISO 13485, IEC 62304) strukturieren.
4. Aktionen + Impact-Bewertung automatisiert.
5. Dashboard KPI + Eskalationslogik.
6. Vollständige Audit & Exportfunktionen.

## 13. Beispiel-API (Zielbild)
`GET /api/regulations?jurisdiction=EU&since=2024-01-01&priority>=4`
Response (gekürzt):
```json
[
  {
    "id": "...",
    "title": "MDR Update XYZ",
    "jurisdiction": "EU",
    "published_date": "2025-07-30",
    "effective_date": "2025-09-15",
    "priority": 5,
    "risk_level": "high",
    "action_required": true,
    "actions": [ { "id": "...", "status": "open", "due_date": "2025-10-01" } ]
  }
]
```

## 14. Sicherheit & Integrität
- Rollenprüfung pro Endpoint.
- Signierung kritischer Datensätze (optional später).
- Rate Limiting für externe Feeds.

## 15. Offene Punkte
- Detaildefinition für `risk_level` Klassifikationsalgorithmus.
- Auswahl finaler Normquellen-Schnittstellen.
- Storage-Strategie für Originaldokumente (S3 / Blob / lokal).

---
Nächster Schritt: Konkrete Tabellenmigrationen + Integrationsstrategie (Schritt 2).
