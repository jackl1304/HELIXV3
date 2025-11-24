# Helix V3 – Copilot Projekt-Instruktionen

Diese Datei liefert kontextspezifische Regeln, damit AI Coding Agents sofort produktiv arbeiten. Fokus: Regulatory Intelligence Plattform (Node.js + Express + React + Drizzle ORM) mit strikter Neutralisierung von KI-Marketing-Begriffen.

## 1. Architektur-Kerngedanke
Single Node.js Prozess (Express) dient API + statisches Frontend (Vite Build) auf Port 5000. Entwicklungsmodus: integrierter Vite Dev-Server (`server/index.ts` → `setupVite`). Multi-Tenant & Domain-Logik serverseitig (Tabellen: `tenants`, `users`). Separater Minimal-FastAPI Dienst (`app/main.py`) nur Health-Dummy – NICHT erweitern außer explizit verlangt.

## 2. Wichtige Verzeichnisse & Aliasse
- Backend: `server/` (Entry `index.ts`, Routing `routes.ts`, Services `services/*`)
- Frontend: `client/src` (Aliasse: `@` → `client/src`, `@shared` → `shared`, `@assets` → `attached_assets`)
- Gemeinsame Typen & Schema: `shared/schema.ts` (Drizzle + Zod)
- Migration Config: `drizzle.config.ts` (Schema → `shared/schema.ts`)
- Import-/Enrichment-Skripte: `scripts/*.ts` (Batch Data Ops)

## 3. Start-, Build- & Datenbank-Workflows
```bash
npm run dev            # Dev (Express + Vite)
npm run build          # Frontend build + esbuild Server Bundle
npm start              # Produktion (nutzt dist/index.js)
npm run db:push        # Schema zu DB pushen (Drizzle)
npm run migrate:manual # Spezifische Migration ausführen
npm run test:sanitization # Prüft neutrale Terminologie
```
Docker-Compose startet volle Umgebung (App, Postgres, Redis, Nginx, Monitoring). Port immer 5000 intern wie extern.

## 4. API Muster & Konventionen
- Alle neuen Endpoints unter Präfix `/api` registrieren via `registerRoutes(app)` oder separatem Router.
- Validation: `zod.safeParse` gegen Insert-Schemas aus `createInsertSchema` (siehe Beispiele in `routes.ts`: `insertRegulatoryUpdateEvaluationSchema`).
- Response-Sanitization: JSON Antworten werden automatisch durch Middleware neutralisiert (`sanitizeObjectDeep`). Keine „AI/KI“ Marketing-Begriffe einfügen – nutzt vorhandene Neutralisierung, nicht umgehen.
- Fehlerformat für API: `{ error: string, message?: string }`, Statuscodes konsistent (400 Validation, 404 Not Found, 500 Server).
- Health Endpoints: `/health`, `/api/health` sind High-Priority – NICHT entfernen, bei Refactors erhalten.
- Concurrency Guard Beispiel: Bulk Sync nutzt Flag `syncInProgress` in `routes.ts` – bei neuen Massenjobs identisches Muster anwenden.

## 5. Datenmodell Highlights (für neue Features)
- Deduplikation: `regulatory_updates.hashedTitle` – bei neuen Insert-Funktionen Hash berechnen um Doppelimporte zu vermeiden.
- Mehrfeld-Analytik: Verwende vorhandene Felder statt frei erfundener (z.B. `riskScore`, `timeToMarketMonths`, `embedding`). Keine neuen Finanz-/Analysefelder ohne Migration.
- Multi-Tenant: Tabellen mit `tenantId` müssen im Code **immer** gefiltert werden (z.B. `WHERE tenant_id = ?`). Bei neuen APIs Tenant-Kontext anfordern (Header/Subdomain) – konsistent mit existierenden Services.

## 6. Typ-/Schema Workflow
1. Neue Tabelle: erweitere `shared/schema.ts` (Index hinzufügen wenn oft gefiltert: Jurisdiction, Status, Date).
2. Generiere Migration manuell: `npm run migrate:manual` (Datei unter `migrations/` anpassen).
3. Validierungs-Schema: `createInsertSchema(table)` aus Drizzle-Zod; ergänze Zod Refines für geschäftskritische Constraints.
4. Endpoint: safeParse → DB Operation → Sanitized Response.

## 7. Frontend Patterns
- State: TanStack Query (`useQuery({ queryKey: [...], queryFn })`). Cache invalidieren nach Mutationen mit `queryClient.invalidateQueries(['...'])`.
- Routing: `App.tsx` mit Wouter; neue Seiten unter `pages/`, Navigation im Layout ergänzen.
- Styling: Tailwind Klassen + shadcn/ui; nutze vorhandene Farb- und Radius-Variablen (`tailwind.config.ts`). Kein Inline-Style für Theme-abhängige Werte.
- Icons: Alias `lucide-react` zeigt auf interne Komponenten – Standard-Imports anpassen.

## 8. Logging & Monitoring
- Nutze simples `console.log` Pattern wie bereitgestellt (Method, Pfad, Dauer). Für strukturierte Logs Winston integrieren (bereits Dependency). Keine sensiblen personenbezogenen Daten loggen.
- Bei langlaufenden Prozessen: Sofortige Antwort + `setImmediate` Hintergrundarbeit (Bulk Sync Beispiel).

## 9. Sicherheit & Sanitization
- Sicherheits-Header bereits gesetzt im `index.ts`; bei neuen Middlewares Reihenfolge beachten (Logging → Sanitization → Routes).
- Keine direkten ungefilterten externen Antworten weiterreichen: Immer minimal transformieren & durch Sanitization gehen.

## 10. Performanz & Skalierung
- Batch Import: Verwende bestehende Skript-Struktur (`scripts/import-*.ts`). Bei neuen Quellen: eigenes Script + optional Scheduler-Hook (`dailySyncScheduler`).
- Vermeide unnötige große JSON Felder in Kern-Tabellen – nutze `metadata` für flexible Erweiterungen.

## 11. Beispiel – Neuer Validierter Endpoint
```typescript
app.post('/api/cost-items', async (req, res) => {
  const parsed = insertCostItemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });
  const created = await storage.createCostItem(parsed.data); // Drizzle Insert
  res.status(201).json(created); // Wird automatisch neutralisiert
});
```

## 12. Was NICHT tun
- Keine generischen „KI“-Optimierungs-Endpunkte erstellen (Neutralität wahren)
- Python FastAPI Service nicht zum Hauptbackend ausbauen
- Nicht CORS/Sicherheits-Header entfernen oder abschwächen
- Keine Direct SQL ohne Drizzle außer Migrationen

## 13. Tests & Qualität
- Terminologie-Test: `npm run test:sanitization`
- Typprüfung: `npm run check`
- Vor größerem Refactor: Health Endpoint & Kern-Routen (`/api/regulatory-updates`) manuell verifizieren.

## 14. Nächste Schritte für Agenten
Bei neuen Features zuerst prüfen: passt es in existierende Tabellen? Falls nicht → Schema + Migration + InsertSchema + Route + Frontend Query.

Feedback erwünscht: Unklare Bereiche oder fehlende wiederkehrende Pattern bitte melden.
