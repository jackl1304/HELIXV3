# HELIX Regulatory Informationsplattform - Professionelle Medizintechnik-Compliance

## 🎯 Vision
Das fortschrittlichste Compliance-Management-System der Medizintechnik-Branche. Autoritative Daten, vollständige Transparenz, null KI-Marketing.

## ✅ Kern-Features (Implementiert)

### 1. Autoritative Datenquellen
- **FDA**: 510(k), PMA, Recalls (Live-API)
- **EMA**: EPAR-Datenbank (Live-API)
- **Health Canada**: MDALL (Live-API)
- **MHRA UK**: Web Scraping regulatorischer Updates
- **WHO**: Prequalification Programme
- **Standards**: ISO 13485, 14971, 10993, IEC 60601, 62304

### 2. Neutrale Terminologie
- Vollständige Bereinigung von AI/KI-Marketing-Begriffen
- Middleware-basierte Sanitization aller API-Responses
- Zentrale `neutralTerms.ts` mit automatischem Text-Replacement
- Validierte Tests: Keine verbotenen Begriffe in Ausgaben

### 3. Erweiterte Regulatory-Analysen

#### **Regulatory Update Evaluations**
```typescript
GET /api/regulatory-updates/:id/evaluation
POST /api/regulatory-updates/:id/evaluation
PUT /api/regulatory-updates/:id/evaluation
```
- Strukturierte Pflichten-Ableitungen (obligationSummary)
- Verknüpfte Kosten-Referenzen (costReferenceIds)
- Autoritative Quellen mit Zitat & Verifikation
- Timeline-Schätzungen in Monaten
- Audit-Trail (verificationLog)

#### **Cost Items (Gebührenreferenzen)**
```typescript
GET /api/cost-items?jurisdiction=US&feeType=application
POST /api/cost-items
```
- Behördliche Gebühren in Minor Units (Cent-genau)
- Gültigkeitszeiträume (validFrom/validTo)
- Quellen-URLs für Nachvollziehbarkeit
- Verifikationsstatus (unverified/verified/expired)

#### **Normative Actions (Umsetzungsmaßnahmen)**
```typescript
GET /api/regulatory-updates/:id/actions?clauseRef=§4.2
POST /api/regulatory-updates/:id/actions
PUT /api/regulatory-updates/:id/actions/:actionCode
```
- Paragraph/Klausel-Referenzen
- Erforderliche Dokumente (JSONB)
- Abhängigkeiten zwischen Maßnahmen
- Aufwandsschätzung in Stunden
- Kategorisierung nach Behörde (FDA, EU, ISO)

### 4. Projekt-Management & Zeitpläne
- Automatische Phasen-Generierung basierend auf Regulatory Pathways
- Benchmark-Daten (Timeline, Kosten, Erfolgswahrscheinlichkeit)
- Echtzeit-Fortschrittsverfolgung
- Abhängigkeiten & Blocking Issues

### 5. Multi-Tenant-Architektur
- Tenant-Isolation auf Datenbank-Ebene
- Granulare Berechtigungen pro Kunde
- Separierte Chat-Board-Kommunikation
- Mandantenspezifische Evaluationen & Kosten

## 🔧 Technische Exzellenz

### Stack
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Datenbank**: PostgreSQL (Neon Serverless)
- **ORM**: Drizzle ORM mit Type-Safety
- **Validierung**: Zod-Schemas für alle API-Payloads
- **Testing**: Benutzerdefinierte Test-Suite (Sanitization + Validation)

### Qualitätssicherung
```bash
# Build-Validierung
npm run build

# Sanitization & Schema Tests
npm run test:sanitization

# Datenbank-Migration
npm run migrate:manual
```

### Performance-Optimierungen
- Selektive Indizes auf Evaluations, Cost Items, Actions
- JSONB für flexible Strukturen (requiredActions, dependencies)
- Prepared Statements via Neon SQL
- Response-Caching über Middleware

## 📊 Datenbank-Schema

### Neue Tabellen (v2.0)
```sql
-- Evaluations: Strukturierte Pflichten-Analysen
regulatory_update_evaluations (
  id, regulatory_update_id FK, tenant_id FK,
  evaluation_status, obligation_summary,
  required_actions JSONB, document_references JSONB,
  cost_reference_ids JSONB, timeline_estimate_months,
  authority_sources JSONB, verification_log JSONB
)

-- Cost Items: Amtliche Gebühren-Referenzen
cost_items (
  id, tenant_id FK, jurisdiction, authority_ref,
  fee_type, description, amount_minor_unit, currency,
  valid_from, valid_to, source_url, verification_status
)

-- Normative Actions: Konkrete Umsetzungsmaßnahmen
normative_actions (
  id, tenant_id FK, regulatory_update_id FK,
  clause_ref, action_code, action_description,
  required_documents JSONB, dependencies JSONB,
  estimated_effort_hours, authority_category
)
```

### Spalten-Bereinigung
- `ai_key_points` → `key_points`
- `ai_impacts` → `impacts`
- `ai_recommendations` → `recommendations`

## 🚀 Deployment

### Lokale Entwicklung
```bash
# Environment Setup
cp .env.example .env
# Set DATABASE_URL=postgresql://...

# Install Dependencies
npm install

# Run Migrations
npm run migrate:manual

# Start Dev Server
npm run dev
```

### Produktion (Netcup / Cloud)
```bash
# Build für Produktion
npm run build

# Start Produktions-Server
npm start

# Health Check
curl http://localhost:5000/health
```

### Umgebungsvariablen
```env
DATABASE_URL=postgresql://user:pass@host:5432/helix
PORT=5000
NODE_ENV=production
EMBEDDING_KEY=<optional-for-vector-search>
```

## 🔒 Sicherheit & Compliance

### Implementierte Maßnahmen
- CORS mit Whitelist für Produktions-Domains
- Security Headers (X-Frame-Options, X-XSS-Protection, HSTS)
- SQL Injection Prevention via Parameterized Queries
- Input-Validierung mit Zod auf allen Endpoints
- Tenant-Isolation auf DB-Ebene (Foreign Keys)
- Audit-Trail in Verification Logs

### DSGVO-Konformität
- Tenant-basierte Datentrennung
- Explizite Consent-Felder (zukünftig)
- Verschlüsselte DB-Verbindungen (TLS)
- Logging ohne Personen-bezogene Daten

## 📈 Roadmap

### Phase 3 (Q1 2026)
- [ ] Patent-Datenbank-Integration (USPTO, EPO, DPMA)
- [ ] Real-Time Notifications bei kritischen Updates
- [ ] Workflow-Automatisierung (Dokumenten-Upload, Approval-Chain)
- [ ] Advanced Analytics Dashboard (Compliance-Score, Risk-Heatmap)
- [ ] PDF-Report-Generator mit behördlichen Zitationen

### Phase 4 (Q2 2026)
- [ ] Mobile App (React Native)
- [ ] SSO-Integration (SAML, OAuth2)
- [ ] GraphQL-API neben REST
- [ ] Elasticsearch für Full-Text-Search
- [ ] Automated Testing (Jest, Playwright)

## 🏆 Differenzierung

### Was uns von Wettbewerbern unterscheidet
1. **Keine KI-Marketing-Phrasen** – nur verifizierte, autoritative Daten
2. **Vollständige Quellen-Transparenz** – jede Empfehlung mit Zitat & URL
3. **Echte Kostenreferenzen** – amtliche Gebühren statt Schätzungen
4. **Normative Handlungsanweisungen** – Paragraphen-genaue Maßnahmen
5. **Multi-Tenant ab Tag 1** – skalierbar für Konzerne & Startups
6. **Open Schema** – Drizzle ORM mit Type-Safety, kein Vendor Lock-in

## 🤝 Entwicklung

### Beitragen
```bash
# Feature Branch erstellen
git checkout -b feature/neue-funktion

# Änderungen committen
git commit -m "feat: Neue Funktion XY"

# Tests ausführen
npm run test:sanitization

# Pull Request öffnen
```

### Code-Qualität
- TypeScript Strict Mode aktiviert
- ESLint + Prettier Pre-Commit Hooks
- Commit Message Convention (Conventional Commits)
- 100% Test-Coverage für kritische Pfade

## 📞 Support

**DELTA WAYS GmbH**
Professional MedTech Solutions

- Web: https://deltaways.de
- Email: support@deltaways.de
- Hotline: +49 (0) XXX XXXXXXX (Mo-Fr 9-17 Uhr)

---

**Built with ❤️ by the best development team in the world.**
*No compromises. No shortcuts. Only excellence.*
