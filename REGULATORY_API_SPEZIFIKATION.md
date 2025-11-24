# REGULATORY API SPEZIFIKATION

Version: 0.1 (Entwurf)
Zweck: Einheitliche REST-Schnittstelle für alle regulatorischen, normativen und gesetzlichen Änderungen inkl. Maßnahmen, Dokumente, Impacts und Audit-Verlauf.

## 1. Allgemeine Prinzipien
- Basis-URL: `/api/` (z. B. `/api/regulations`)
- Format: JSON UTF-8
- Authentifizierung: Bearer Token (später JWT oder Session) – Rollen aus RBAC (siehe Architekturplan)
- Pagination: `?page=1&limit=50` (Standard `limit = 25`, Max `limit = 200`)
- Sortierung: `?sort=published_date:desc,priority:desc`
- Filter: Mehrfach kombinierbar (AND-Logik). Beispiel: `?jurisdiction=EU&priority_gte=4&action_required=true`
- Zeiträume: `?since=2024-01-01&until=2025-11-23`
- Fehlerformat:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "priority_gte muss eine Zahl sein",
    "details": { "field": "priority_gte", "value": "x" }
  }
}
```
- Rate Limiting (später): HTTP 429 mit `Retry-After` Header.

## 2. Endpunktübersicht
| Ressource | Pfad | Methoden | Beschreibung |
|-----------|------|----------|--------------|
| Regulatorische Updates | `/api/regulations` | GET, POST, PATCH, DELETE | Behörden-/Leitlinien-/Zulassungsänderungen |
| Einzelnes Update | `/api/regulations/:id` | GET, PATCH, DELETE | Detailansicht / Aktualisierung |
| Normänderungen | `/api/norms` | GET, POST | ISO / IEC Change Records |
| Gesetzesänderungen | `/api/laws` | GET, POST | Gesetzliche Artikel & Revisionen |
| Maßnahmen (Actions) | `/api/actions` | GET, POST, PATCH | Abgeleitete Compliance Tasks |
| Dokumente | `/api/documents` | GET, POST | Zugeordnete Artefakte |
| Impacts | `/api/impacts` | GET, POST | Impact Matrix Einträge |
| Audit Trail | `/api/audit-trail` | GET | Änderungen & Events |
| Bulk Import Trigger | `/api/import/:sourceKey/trigger` | POST | Manueller Importstart |
| Statistiken / KPIs | `/api/regulations/stats` | GET | Aggregierte Kennzahlen |

## 3. Query-Parameter (generisch)
| Parameter | Bedeutung | Beispiel |
|-----------|-----------|---------|
| `page` | Seite (>=1) | `page=2` |
| `limit` | Anzahl je Seite | `limit=50` |
| `sort` | Kommagetrennte Feld:richtung Paare | `sort=priority:desc,published_date:asc` |
| `jurisdiction` | Rechtsraum | `jurisdiction=EU` |
| `priority_gte` | Mindestpriorität | `priority_gte=3` |
| `priority_lte` | Max. Priorität | `priority_lte=4` |
| `risk_level` | Risiko | `risk_level=high` |
| `type` | Update Typ | `type=approval` |
| `action_required` | Bool Filter | `action_required=true` |
| `search` | Volltext (Titel/Beschreibung) | `search=cybersecurity` |
| `since` | Start Datum ISO | `since=2024-01-01` |
| `until` | End Datum ISO | `until=2025-11-23` |
| `standard_code` | Normcode | `standard_code=ISO 13485` |
| `law_code` | Gesetzescode | `law_code=MDR 2017/745` |

## 4. Beispiel: GET /api/regulations
Request:
```
GET /api/regulations?jurisdiction=EU&priority_gte=4&action_required=true&sort=published_date:desc&page=1&limit=25
Authorization: Bearer <token>
```
Response (gekürzt):
```json
{
  "data": [
    {
      "id": "a1b2c3",
      "title": "MDR Update zu Post-Market Surveillance",
      "description": "Erweiterte Anforderungen an klinische Nachbeobachtung.",
      "type": "regulation",
      "jurisdiction": "EU",
      "published_date": "2025-07-30",
      "effective_date": "2025-09-15",
      "priority": 5,
      "risk_level": "high",
      "action_required": true,
      "action_deadline": "2025-10-01",
      "fda_k_number": null,
      "tags": ["MDR","PMS"],
      "status": "current",
      "revision": 3,
      "base_id": "mdr-pms-001",
      "source_name": "EUR-Lex",
      "hash": "sha256:..."
    }
  ],
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 134,
    "pages": 6,
    "filters": {
      "jurisdiction": "EU",
      "priority_gte": 4,
      "action_required": true
    }
  }
}
```

## 5. POST /api/regulations (Erstellen)
Body Felder (Auszug):
```json
{
  "title": "FDA Guidance Cybersecurity Update",
  "description": "Neue Anforderungen an Secure Development Lifecycle.",
  "type": "guidance",
  "jurisdiction": "US",
  "published_date": "2025-08-12",
  "effective_date": "2025-12-01",
  "priority": 4,
  "risk_level": "medium",
  "action_required": true,
  "action_deadline": "2025-12-31",
  "document_url": "https://fda.gov/...",
  "source_url": "https://fda.gov/...",
  "tags": ["cybersecurity","software"],
  "fda_k_number": null,
  "fda_applicant": null
}
```
Erfolgsantwort:
```json
{
  "id": "new-id",
  "status": "created"
}
```
Validierungsfehler -> HTTP 400.

## 6. PATCH /api/regulations/:id
Partielle Aktualisierung – nur erlaubte Felder:
```json
{
  "priority": 5,
  "action_deadline": "2025-11-30",
  "action_required": true
}
```
Antwort: `{ "id": "...", "status": "updated" }`

## 7. GET /api/norms
Spezifische zusätzliche Filter:
| Parameter | Bedeutung |
|-----------|-----------|
| `standard_code` | Norm-Code exakt |
| `requires_gap_analysis` | Bool |
| `impact_class` | process/product/documentation/software |

Beispiel: `GET /api/norms?standard_code=ISO 13485&impact_class=process&priority_gte=3`

## 8. GET /api/laws
Zusätzliche Filter:
| Parameter | Bedeutung |
|-----------|-----------|
| `law_code` | Gesetzeskennung |
| `article` | Artikelfilter |
| `compliance_deadline_before` | Deadline vor Datum |

Beispiel: `GET /api/laws?law_code=MDR 2017/745&article=85&compliance_deadline_before=2025-12-31`

## 9. GET /api/actions
Filter für Maßnahmen:
| Parameter | Bedeutung |
|-----------|-----------|
| `status` | open/in_progress/blocked/done/verified |
| `due_before` | Fällig vor Datum |
| `owner_role` | Rolle verantwortliche Person |
| `reference_type` | regulatory/norm/law |

Beispiel: `GET /api/actions?status=open&due_before=2025-10-01&reference_type=regulatory`

## 10. POST /api/actions
```json
{
  "reference_type": "regulatory",
  "reference_id": "a1b2c3",
  "title": "Gap Analyse PMS Prozesse",
  "description": "Überprüfung der geänderten MDR PMS Anforderungen",
  "owner_role": "qm",
  "due_date": "2025-09-15",
  "risk_level": "high"
}
```
Antwort: `{ "id": "action-id", "status": "created" }`

## 11. GET /api/documents
Filter: `reference_type`, `reference_id`, `doc_type`
Beispiel: `/api/documents?reference_type=regulatory&reference_id=a1b2c3&doc_type=gap_analysis`

## 12. POST /api/documents
```json
{
  "reference_type": "regulatory",
  "reference_id": "a1b2c3",
  "doc_type": "summary",
  "title": "Kurzfassung MDR PMS Update",
  "url": "https://internal-storage/summary-mdr-pms.pdf"
}
```
Antwort: `{ "id": "doc-id", "status": "created" }`

## 13. GET /api/impacts
Filter: `reference_type`, `process_impact=true`, `software_impact=true` etc.
Beispiel: `/api/impacts?software_impact=true&validation_required=true`

## 14. POST /api/impacts
```json
{
  "reference_type": "regulatory",
  "reference_id": "a1b2c3",
  "process_impact": true,
  "software_impact": false,
  "documentation_impact": true,
  "validation_required": true,
  "requalification_required": false
}
```
Antwort: `{ "id": "impact-id", "status": "created" }`

## 15. GET /api/audit-trail
Filter: `entity_type`, `entity_id`, `action`, Zeitfenster (`since`, `until`).
Beispiel: `/api/audit-trail?entity_type=regulation&entity_id=a1b2c3&since=2025-07-01`

Antwort (gekürzt):
```json
{
  "data": [
    {
      "id": "evt1",
      "entity_type": "regulation",
      "entity_id": "a1b2c3",
      "action": "update",
      "performed_by": "user123",
      "performed_role": "qm",
      "before": { "priority": 4 },
      "after": { "priority": 5 },
      "timestamp": "2025-08-01T09:30:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 25, "total": 12 }
}
```

## 16. GET /api/regulations/stats
Aggregationen für Dashboard:
Antwort:
```json
{
  "counts": {
    "total": 134,
    "high_priority": 27,
    "action_required": 54,
    "overdue_actions": 5
  },
  "by_jurisdiction": {
    "EU": 58,
    "US": 42,
    "DE": 12
  },
  "recent": {
    "last_7_days": 9,
    "last_30_days": 23
  }
}
```

## 17. Sicherheitsaspekte / Rollen
| Methode | Ressource | Rollen (min) |
|---------|----------|--------------|
| GET | Alle | viewer |
| POST | regulations/norms/laws | qm / legal / super_admin |
| PATCH | regulations/norms/laws | qm / legal / super_admin |
| DELETE | regulations/norms/laws | super_admin |
| POST actions | qm / dev / super_admin |
| PATCH actions | qm / dev |
| POST documents | qm / legal / dev |
| POST impacts | qm |
| GET audit-trail | audit / super_admin |

403 wenn Rolle nicht ausreicht.

## 18. Fehlercodes
| Code | Bedeutung |
|------|-----------|
| 400 | Validierungsfehler |
| 401 | Nicht authentifiziert |
| 403 | Keine Berechtigung |
| 404 | Nicht gefunden |
| 409 | Konflikt (Revision / Duplikat) |
| 422 | Semantischer Fehler (z. B. unmögliche Deadline) |
| 500 | Interner Fehler |
| 503 | Quelle temporär nicht verfügbar |

## 19. Performance / Caching
- GET Endpunkte können `ETag` Header liefern (Hash der Response).
- Client sendet `If-None-Match` → 304 bei Unverändert.
- Heavy Aggregationen (stats) in 5-Minuten Cache (Redis / Memory).

## 20. Erweiterungen (Future)
- Webhook: POST bei High-Risk Änderung an registrierte URL.
- GraphQL Gateway für kombinierte Queries.
- Streaming Endpoint SSE: `/api/regulations/stream` für Live-Updates.
- Batch-POST: `/api/regulations/bulk` für mehrere Datensätze.

## 21. OpenAPI Draft (Kurz)
```yaml
openapi: 3.0.0
info:
  title: Helix Regulatory API
  version: 0.1.0
paths:
  /api/regulations:
    get:
      summary: Liste regulatorischer Updates
      parameters:
        - in: query
          name: jurisdiction
          schema: { type: string }
        - in: query
          name: priority_gte
          schema: { type: integer }
      responses:
        '200':
          description: OK
    post:
      summary: Neues regulatorisches Update anlegen
      responses:
        '201': { description: Created }
  /api/regulations/{id}:
    get:
      summary: Einzelnes Update
    patch:
      summary: Teilaktualisierung
    delete:
      summary: Löschen
```

## 22. Testansätze
- Unit: Normalisierung + Validierung (Zod Schema).
- Integration: CRUD Durchläufe pro Ressource.
- Lasttest: Mehrfach GET /regulations mit Filterkombination.
- Sicherheit: Rollenmatrix gegen Endpoints (403).
- Deduplikation: Neue Revision erkennt Hash-Wechsel.

---
Nächster Schritt: Frontend Views (Stakeholder-Sichten) konzipieren.
