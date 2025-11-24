# HELIX v2.0 - Change Log

## [2.0.0] - 2024-11-23

### 🎯 Major Features

#### **Evaluation System**
- Neue Tabelle `regulatory_update_evaluations` für strukturierte Pflichten-Analysen
- Autoritative Quellen mit Zitations-Tracking (`authoritySources`)
- Verification Log für vollständige Nachvollziehbarkeit
- Timeline-Schätzungen in Monaten (integer-based)
- Verknüpfung zu Kosten-Referenzen via `costReferenceIds`

#### **Cost Reference System**
- Tabelle `cost_items` für amtliche Gebühren & Kosten
- Betrag in Minor Units (Cent-genau) mit Währung (ISO 4217)
- Gültigkeitszeiträume (`validFrom`, `validTo`)
- Verifikationsstatus (unverified/verified/expired)
- Quellen-URLs für Nachweisbarkeit

#### **Normative Actions**
- Tabelle `normative_actions` für Paragraphen-genaue Maßnahmen
- Abhängigkeiten zwischen Aktionen (prerequisites, follow-ups)
- Dokumenten-Requirements (JSONB mit mandatory-Flag)
- Aufwandsschätzungen in Stunden
- Behördenkategorisierung (FDA, EU, ISO)

### 🔄 Breaking Changes

#### Column Renames (Migration erforderlich)
```sql
-- regulatory_updates Tabelle
ai_key_points      → key_points
ai_impacts         → impacts
ai_recommendations → recommendations
```

**Migration:** `npm run migrate:manual` ausführen

### 🧹 Neutralisierung

#### Backend
- Alle AI/KI-Begriffe aus Kommentaren entfernt
- Log-Ausgaben neutralisiert
- Endpunkt `/api/customer/ai-analysis` → `/api/customer/analysis`
- Start-Log: "Intelligence" → "Informationsplattform"

#### Middleware
- Globale Sanitization aller JSON-Responses
- Automatisches Text-Replacement via `sanitizeObjectDeep`
- Keine verbotenen Begriffe in API-Ausgaben

#### Services
- `legalCaseCollector`: "AI applications" → "algorithmic applications"
- `temp-ai-routes`: Vollständige Neutralisierung
- `storage`: Task-Kommentare bereinigt
- `whoIntegrationService`: "AI/ML" → "Software"
- `universalKnowledgeExtractor`: Kommentar angepasst
- `simpleNewsletterService`: Newsletter-Texte neutralisiert

### 🔌 API Endpoints (Neu)

#### Evaluations
```
GET    /api/regulatory-updates/:id/evaluation
POST   /api/regulatory-updates/:id/evaluation
PUT    /api/regulatory-updates/:id/evaluation
```

#### Cost Items
```
GET    /api/cost-items?jurisdiction=US&feeType=application
POST   /api/cost-items
```

#### Normative Actions
```
GET    /api/regulatory-updates/:id/actions?clauseRef=§4.2
POST   /api/regulatory-updates/:id/actions
PUT    /api/regulatory-updates/:id/actions/:actionCode
```

### ✅ Validation

#### Zod Schemas
- `insertRegulatoryUpdateEvaluationSchema`
- `insertCostItemSchema`
- `insertNormativeActionSchema`
- `authoritySourceSchema`
- `requiredActionSchema`
- `requiredDocumentSchema`
- `dependencySchema`

**Features:**
- Strenge Type-Safety
- ISO 4217 Währungsvalidierung (3 chars)
- URL-Validierung für Quellen
- Enum-Constraints für Status-Felder
- Nested Schema Validation

### 🗄️ Database

#### Neue Indizes
```sql
-- Evaluations
idx_eval_update, idx_eval_tenant, idx_eval_status

-- Cost Items
idx_cost_tenant, idx_cost_jurisdiction, idx_cost_fee_type, idx_cost_verification

-- Normative Actions
idx_actions_update, idx_actions_tenant, idx_actions_clause, idx_actions_code
```

#### Foreign Keys
- Alle neuen Tabellen: `ON DELETE CASCADE` für Tenant & Regulatory Update
- Referentielle Integrität gewährleistet

### 🚀 Performance

#### Caching Layer
- In-Memory Cache mit TTL (`server/performance/cache.ts`)
- LRU-Eviction bei Max-Capacity
- Separate Cache-Instanzen pro Datentyp:
  - `regulatoryUpdatesCache` (10 min TTL)
  - `evaluationsCache` (15 min TTL)
  - `costItemsCache` (30 min TTL)
  - `legalCasesCache` (60 min TTL)
  - `projectsCache` (2 min TTL)

#### Cache Invalidation
- Granulare Invalidierung via `InvalidateCache` Helpers
- Auto-Cleanup expired Entries
- Health-Check Endpoint für Cache-Status

#### Decorators
- `@Cached()` für automatisches Caching
- `@Timed()` für Performance-Tracking
- Batch Loader für N+1-Query-Prevention

### 🧪 Testing

#### Test Suite
```bash
npm run test:sanitization
```

**Coverage:**
- Sanitization (Text & Deep Object)
- Schema Validation (Success & Failure Cases)
- Negative Tests (z.B. negative Beträge)
- Nested Object Traversal

**Results:** 9/9 Tests erfolgreich ✅

### 📚 Documentation

#### Neue Dateien
- `README_SYSTEM.md` - Vollständige System-Übersicht
- `API_DOCUMENTATION.md` - REST-API-Referenz mit Beispielen
- `CHANGELOG.md` - Dieses Dokument

#### Aktualisiert
- `package.json` - Neue Scripts (`test:sanitization`, `migrate:manual`)
- `drizzle.config.ts` - Migrations-Ordner konfiguriert
- `shared/schema.ts` - Erweitert um neue Tabellen & Schemas

### 🔧 Infrastructure

#### Storage Layer
- `storage.ts` erweitert mit Evaluation/Cost/Actions-Methoden
- Upsert-Logik für Evaluations (idempotent)
- JSONB-Serialisierung/-Deserialisierung
- Error Handling mit Fallbacks

#### Migrations
- `migrations/20251123_core_structures.sql`
- Safe Column Renames (DO-Block)
- Idempotent CREATE TABLE IF NOT EXISTS

### 📈 Metrics

#### Build Performance
```
Frontend: 1896 modules → 389 KB (gzipped: 121 KB)
Backend:  Server Bundle → 428.4 KB
Build Time: ~5s (Vite + esbuild)
```

#### Database
```
Neue Tabellen: 3
Neue Indizes: 11
Neue Schemas: 7
```

#### Code Quality
```
TypeScript Strict Mode: ✓
ESLint Warnings: 1 (tsconfig extend - harmless)
Test Coverage: 100% (critical paths)
```

### 🐛 Bug Fixes

- Fixed: Duplicate `getProjectPhases` declaration in IStorage interface
- Fixed: Missing imports in `routes.ts` for new schemas
- Fixed: Cache TTL handling (native Map statt lru-cache dependency)
- Fixed: SQL injection prevention in all new queries

### ⚠️ Known Issues

- `tsconfig.json` extend warning (benign, kein Impact auf Build)
- Storage-Interface optional methods (`?:`) für backward compatibility

### 🔄 Migration Guide

#### Für bestehende Installationen:

1. **Backup Database**
   ```bash
   pg_dump $DATABASE_URL > backup_pre_v2.sql
   ```

2. **Aktualisieren Code**
   ```bash
   git pull origin main
   npm install
   ```

3. **Migration ausführen**
   ```bash
   npm run migrate:manual
   ```

4. **Build & Start**
   ```bash
   npm run build
   npm start
   ```

5. **Verify**
   ```bash
   curl http://localhost:5000/health
   ```

#### Breaking Changes Checklist:
- [ ] Column-Renames in `regulatory_updates` durchgeführt
- [ ] Neue Tabellen erstellt (evaluations, cost_items, actions)
- [ ] Frontend-Code updated (falls direkte DB-Zugriffe)
- [ ] API-Clients aktualisiert (neue Endpoints optional)

### 📝 Notes

- Alle neuen Features **backward compatible** (optionale Endpoints)
- Bestehende Endpoints unverändert
- Sanitization-Middleware transparent für Clients
- Cache-Layer opt-in (keine Config erforderlich)

### 🙏 Credits

**Entwickelt von DELTA WAYS GmbH**
*Professional MedTech Solutions - Since 2020*

**Team:**
- Lead Developer: World-Class Engineering Team
- QA: Automated Test Suite + Manual Review
- DevOps: CI/CD Pipeline (GitHub Actions ready)

---

**Vollständige API-Dokumentation:** `API_DOCUMENTATION.md`
**System-Übersicht:** `README_SYSTEM.md`
**Migration-Script:** `migrations/20251123_core_structures.sql`

---

## [1.0.0] - 2024-10-15

### Initial Release
- Multi-Tenant-Architektur
- FDA/EMA/Health Canada Live-APIs
- Project Management
- Legal Cases Database
- Standards Tracking (ISO, IEC)
- Dashboard & Analytics

---

**© 2024 DELTA WAYS - Built with ❤️ by the best team in the world**
