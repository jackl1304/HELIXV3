# API Referenz - HELIX Regulatory Informationsplattform

## Basis-URL
```
Entwicklung: http://localhost:5000/api
Produktion: https://helix.deltaways.de/api
```

## Authentifizierung
Aktuell: Session-basiert
Zukünftig: Bearer Token (JWT)

---

## 📊 Regulatory Updates

### Liste aller Updates
```http
GET /api/regulatory-updates
```

**Response:**
```json
[
  {
    "id": "reg-001",
    "title": "FDA 510(k) Guidance Update 2024",
    "description": "Updated software validation requirements",
    "type": "regulation",
    "jurisdiction": "US",
    "publishedDate": "2024-03-15T00:00:00Z",
    "actionRequired": true,
    "actionDeadline": "2024-12-31T00:00:00Z",
    "keyPoints": ["Enhanced cybersecurity", "SBOM required"],
    "impacts": "All Class II software devices",
    "recommendations": "Review current validation protocols",
    "authorityVerified": true,
    "authorityRecommendations": "FDA recommends...",
    "riskScore": 85
  }
]
```

---

## 🎯 Evaluations (Neue Feature-Set)

### Evaluation abrufen
```http
GET /api/regulatory-updates/:id/evaluation
```

**Response:**
```json
{
  "id": "eval-001",
  "regulatoryUpdateId": "reg-001",
  "tenantId": "tenant-xyz",
  "evaluationStatus": "reviewed",
  "obligationSummary": "Software validation gemäß ISO 13485 erforderlich",
  "requiredActions": [
    {
      "code": "DOC_VAL",
      "description": "Validierungsdokumentation erstellen",
      "deadline": "2024-12-01T00:00:00Z",
      "authorityRef": "FDA-2024-D-1234"
    }
  ],
  "documentReferences": [
    {
      "title": "FDA Guidance Document",
      "url": "https://fda.gov/...",
      "type": "guidance",
      "clauseRef": "§4.2"
    }
  ],
  "costReferenceIds": ["cost-001", "cost-002"],
  "timelineEstimateMonths": 6,
  "authoritySources": [
    {
      "name": "FDA",
      "citation": "Guidance for Industry - Software Validation",
      "url": "https://fda.gov/doc",
      "docId": "FDA-2024-001",
      "verifiedAt": "2024-11-23T10:00:00Z"
    }
  ],
  "verificationLog": [
    {
      "timestamp": "2024-11-20T14:30:00Z",
      "userId": "user-123",
      "action": "verified_authority_source",
      "notes": "Cross-referenced with FDA database"
    }
  ]
}
```

### Evaluation erstellen/aktualisieren
```http
POST /api/regulatory-updates/:id/evaluation
PUT /api/regulatory-updates/:id/evaluation
```

**Request Body:**
```json
{
  "tenantId": "tenant-xyz",
  "evaluationStatus": "draft",
  "obligationSummary": "Zusammenfassung der Pflichten",
  "requiredActions": [...],
  "authoritySources": [...],
  "timelineEstimateMonths": 6
}
```

**Validation:**
- `regulatoryUpdateId`: Required, string
- `tenantId`: Required, string (min 1 char)
- `evaluationStatus`: Optional, enum: "draft" | "reviewed" | "finalized"
- `authoritySources`: Optional array, validated mit Zod-Schema

---

## 💰 Cost Items (Gebühren-Referenzen)

### Liste Kosten
```http
GET /api/cost-items?jurisdiction=US&feeType=application
```

**Query Parameters:**
- `jurisdiction` (optional): US, EU, DE, etc.
- `feeType` (optional): application, renewal, inspection, etc.

**Response:**
```json
[
  {
    "id": "cost-001",
    "tenantId": "tenant-xyz",
    "jurisdiction": "US",
    "authorityRef": "FDA",
    "feeType": "application_fee",
    "description": "510(k) Antragsgebühr für kleine Unternehmen",
    "amountMinorUnit": 600000,
    "currency": "USD",
    "validFrom": "2024-01-01T00:00:00Z",
    "validTo": "2024-12-31T00:00:00Z",
    "sourceUrl": "https://fda.gov/fee-schedule",
    "evidenceDocumentId": "doc-123",
    "verificationStatus": "verified",
    "createdAt": "2024-11-20T12:00:00Z"
  }
]
```

**Betrag-Hinweis:** `amountMinorUnit` ist in Cent (USD: 600000 = $6,000.00)

### Kosteneintrag erstellen
```http
POST /api/cost-items
```

**Request Body:**
```json
{
  "tenantId": "tenant-xyz",
  "jurisdiction": "US",
  "authorityRef": "FDA",
  "feeType": "application_fee",
  "description": "Antragsgebühr...",
  "amountMinorUnit": 600000,
  "currency": "USD",
  "sourceUrl": "https://fda.gov/...",
  "verificationStatus": "verified"
}
```

**Validation:**
- `amountMinorUnit`: Integer, non-negative
- `currency`: String, length 3 (ISO 4217)
- `sourceUrl`: Valid URL (required)
- `jurisdiction`: Min 2 chars

---

## ⚙️ Normative Actions (Maßnahmen)

### Aktionen für Update abrufen
```http
GET /api/regulatory-updates/:id/actions?clauseRef=§4.2
```

**Query Parameters:**
- `clauseRef` (optional): Filter nach Paragraph/Klausel

**Response:**
```json
[
  {
    "id": "action-001",
    "tenantId": "tenant-xyz",
    "regulatoryUpdateId": "reg-001",
    "clauseRef": "§4.2.1",
    "actionCode": "VAL_DOC",
    "actionDescription": "Validierungsdokumentation gem. ISO 13485 erstellen",
    "requiredDocuments": [
      {
        "name": "Validierungsplan",
        "type": "plan",
        "mandatory": true,
        "sourceRef": "ISO 13485:2016 §4.2"
      }
    ],
    "dependencies": [
      {
        "actionCode": "RISK_ANALYSIS",
        "type": "prerequisite"
      }
    ],
    "estimatedEffortHours": 40,
    "authorityCategory": "ISO",
    "verificationStatus": "verified",
    "createdAt": "2024-11-20T10:00:00Z"
  }
]
```

### Aktion erstellen
```http
POST /api/regulatory-updates/:id/actions
```

**Request Body:**
```json
{
  "tenantId": "tenant-xyz",
  "clauseRef": "§4.2.1",
  "actionCode": "VAL_DOC",
  "actionDescription": "Beschreibung...",
  "requiredDocuments": [...],
  "dependencies": [...],
  "estimatedEffortHours": 40,
  "authorityCategory": "ISO"
}
```

### Aktion aktualisieren
```http
PUT /api/regulatory-updates/:id/actions/:actionCode
```

---

## 📁 Projects

### Alle Projekte abrufen
```http
GET /api/projects
```

### Projekt erstellen (mit Auto-Phasen)
```http
POST /api/projects
```

**Request Body:**
```json
{
  "name": "Neues Medizinprodukt XY",
  "description": "Entwicklung eines...",
  "regulatoryPathwayId": "pathway-001",
  "deviceType": "software",
  "riskClass": "IIa",
  "targetMarkets": ["US", "EU"]
}
```

**Response:**
```json
{
  "project": {...},
  "phases": [
    {
      "id": "phase-001",
      "name": "Feasibility Study",
      "estimatedDurationDays": 30,
      "estimatedCost": 50000
    }
  ]
}
```

### Projekt-Phasen abrufen
```http
GET /api/projects/:id/phases
```

### Phase aktualisieren
```http
PUT /api/projects/:projectId/phases/:phaseId
```

---

## 📋 Legal Cases

### Rechtsprechung durchsuchen
```http
GET /api/rechtsprechung?search=Medizinprodukt&jurisdiction=Deutschland
```

**Query Parameters:**
- `search` (optional): Volltextsuche
- `jurisdiction` (optional): Deutschland, EU, etc.
- `startDate` (optional): ISO date
- `endDate` (optional): ISO date

---

## 🏥 Data Sources

### Alle Quellen abrufen
```http
GET /api/data-sources
```

### Sync-Status
```http
GET /api/sync-status
```

### Manueller Sync
```http
POST /api/sync-all
```

---

## 📊 Dashboard Stats

```http
GET /api/dashboard/stats
```

**Response:**
```json
{
  "totalSources": 12,
  "activeSources": 8,
  "totalUpdates": 1250,
  "recentUpdates": 45,
  "currentSyncStatus": "idle"
}
```

---

## ⚠️ Error Responses

Alle Endpoints folgen einheitlichem Error-Format:

```json
{
  "error": "Validation failed",
  "message": "Invalid request body",
  "timestamp": "2024-11-23T12:00:00Z",
  "path": "/api/cost-items",
  "issues": [
    {
      "path": ["amountMinorUnit"],
      "message": "Expected number, received string"
    }
  ]
}
```

**HTTP Status Codes:**
- `200` OK
- `201` Created
- `400` Bad Request (Validation)
- `404` Not Found
- `500` Internal Server Error

---

## 🔒 Rate Limiting
- Entwicklung: Unbegrenzt
- Produktion: 1000 Requests/Stunde pro IP

---

## 📝 Versioning
API Version: `v2.0`
Backward Compatibility: Garantiert für Major Versions

---

**© 2024 DELTA WAYS - Professional MedTech Solutions**
