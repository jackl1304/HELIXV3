# Customer Management System - Implementierung

## ✅ Implementierte Features

### Backend (Server)

1. **Admin Tenant Management API** (`server/routes/admin-tenants.ts`)
   - `GET /api/admin/tenants` - Alle Tenants abrufen
   - `GET /api/admin/tenants/:id` - Einzelnen Tenant abrufen
   - `POST /api/admin/tenants` - Neuen Tenant erstellen
   - `PUT /api/admin/tenants/:id` - Tenant aktualisieren
   - `DELETE /api/admin/tenants/:id` - Tenant löschen
   - `GET /api/admin/tenants/:id/users` - Benutzer eines Tenants
   - `GET /api/admin/stats` - Admin-Statistiken

2. **Tenant Middleware** (`server/middleware/tenant-middleware.ts`)
   - `loadTenant()` - Lädt Tenant-Daten aus URL
   - `requirePermission()` - Prüft spezifische Berechtigungen
   - `requireSubscription()` - Prüft Subscription-Plan
   - `checkTenantLimits()` - Rate-Limiting pro Tenant

3. **Customer Routes** (`server/routes/customer.ts`)
   - `GET /api/tenant/:tenantId/dashboard/stats` - Dashboard-Statistiken
   - `GET /api/tenant/:tenantId/regulatory-updates` - Regulatory Updates
   - `GET /api/tenant/:tenantId/legal-cases` - Legal Cases
   - `GET /api/tenant/:tenantId/analytics-insights` - Analytics Insights
   - `GET /api/tenant/:tenantId/analytics` - Analytics
   - `GET /api/tenant/:tenantId/settings` - Tenant Settings
   - `GET /api/tenant/:tenantId/users` - User Management
   - Alle Routen mit Permission-Checks

4. **Routes Integration** (`server/routes.ts`)
   - Admin-Routes unter `/api/admin/*`
   - Customer-Routes unter `/api/tenant/:tenantId/*`

### Frontend (Client)

1. **Tenant Settings Hook** (`client/src/hooks/useTenantSettings.tsx`)
   - `useTenantSettings()` - Lädt Tenant-Einstellungen und Permissions
   - `useRequirePermission()` - Hook zur Permission-Prüfung
   - `<PermissionGate>` - Komponente für bedingtes Rendering
   - `<PermissionDenied>` - Fallback für fehlende Permissions

2. **Customer Dashboard Integration** (`client/src/pages/customer-dashboard.tsx`)
   - Verwendet `useTenantSettings()` statt alter Hook
   - Permission-Check für Dashboard-Zugriff
   - Zeigt Fehlermeldung bei fehlender Berechtigung

3. **Admin Customer Management** (`client/src/pages/admin-customers.tsx`)
   - Bereits vorhanden (969 Zeilen)
   - Nutzt jetzt echte Backend-API statt Mock-Daten
   - CRUD-Operationen für Tenants
   - Permissions-Verwaltung über UI

### Database

1. **Migration Script** (`database/migrations/002_customer_management.sql`)
   - Erstellt `tenants` Tabelle falls nicht vorhanden
   - Fügt fehlende Spalten hinzu
   - Erstellt `users` Tabelle mit tenant_id
   - Setzt Default Permissions für existierende Tenants
   - Erstellt Indizes für Performance

## 📋 Permissions System

### Verfügbare Permissions

```typescript
{
  dashboard: boolean;              // Basis-Dashboard
  regulatoryUpdates: boolean;      // Regulatory Updates Seite
  legalCases: boolean;             // Legal Cases Seite
  knowledgeBase: boolean;          // Knowledge Base
  newsletters: boolean;            // Newsletter-Verwaltung
  analytics: boolean;              // Analytics-Seite
  reports: boolean;                // Report-Generierung
  dataCollection: boolean;         // Datensammlung
  globalSources: boolean;          // Globale Datenquellen
  historicalData: boolean;         // Historische Daten
  administration: boolean;         // Admin-Bereich
  userManagement: boolean;         // Benutzerverwaltung
  systemSettings: boolean;         // Systemeinstellungen
  auditLogs: boolean;              // Audit-Logs
  analyticsInsights: boolean;             // Analytics-Insights
  advancedAnalytics: boolean;      // Erweiterte Analytics
}
```

### Permission-Verwendung im Frontend

```tsx
import { useTenantSettings, PermissionGate } from '@/hooks/useTenantSettings';

function MyComponent() {
  const { hasPermission, permissions } = useTenantSettings();

  // Methode 1: Bedingtes Rendering
  if (!hasPermission('analytics')) {
    return <PermissionDenied />;
  }

  // Methode 2: PermissionGate Komponente
  return (
    <PermissionGate permission="analytics">
      <AnalyticsContent />
    </PermissionGate>
  );
}
```

### Permission-Verwendung im Backend

```typescript
import { loadTenant, requirePermission } from '../middleware/tenant-middleware';

// Alle Routen mit Tenant-Context
router.use('/:tenantId/*', loadTenant);

// Spezifische Permission erforderlich
router.get('/:tenantId/analytics',
  requirePermission('analytics'),
  async (req, res) => {
    // Nur erreichbar wenn analytics Permission vorhanden
  }
);
```

## 🔧 Verwendung

### 1. Migration ausführen

```bash
# Mit psql
psql -U postgres -d helix -f database/migrations/002_customer_management.sql

# Oder über pgAdmin SQL-Tool
```

### 2. Server neu starten

```bash
npm run dev
```

### 3. Admin-Seite öffnen

```
http://localhost:5000/admin-customers
```

### 4. Tenant erstellen

- Auf "Neuen Kunden hinzufügen" klicken
- Firmenname, Slug, Subscription-Plan auswählen
- Permissions individuell konfigurieren
- Limits setzen (Max Users, Data Sources)
- Speichern

### 5. Customer-Bereich testen

```
http://localhost:5000/tenant/{tenantId}/dashboard
```

## 🎯 Workflow

### Admin erstellt/bearbeitet Tenant

1. Admin öffnet `/admin-customers`
2. Wählt Tenant aus Liste oder erstellt neuen
3. Konfiguriert Permissions über Checkboxen
4. Setzt Subscription-Plan (Starter/Professional/Enterprise)
5. Definiert Limits (Users, Data Sources, API Access)
6. Speichert → Backend aktualisiert `tenants` Tabelle

### Customer nutzt Portal

1. Customer navigiert zu `/tenant/{tenantId}/dashboard`
2. `loadTenant` Middleware lädt Tenant-Daten aus DB
3. Frontend ruft `/api/tenant/{tenantId}/settings` auf
4. `useTenantSettings()` Hook cached Permissions
5. Navigation und Seiten werden basierend auf Permissions gerendert
6. Fehlende Permissions → `<PermissionDenied>` Komponente

### Echtzeit-Updates

- Admin ändert Permissions → `PUT /api/admin/tenants/:id`
- Customer refresht Seite → Neue Permissions werden geladen
- Optional: WebSocket/Polling für Live-Updates (zukünftig)

## 📊 Subscription-Pläne

### Starter (€299/Monat)
- Dashboard, Regulatory Updates
- 5 Users, 10 Data Sources
- Basis-Features

### Professional (€899/Monat)
- Alle Starter Features
- Legal Cases, Knowledge Base, Newsletters
- Analytics, Reports
- 10 Users, 20 Data Sources
- API Access

### Enterprise (€2.499/Monat)
- Alle Professional Features
- User Management, Advanced Analytics
- Analytics Insights, Historical Data, Global Sources
- Unbegrenzte Users & Data Sources
- Priority Support

## 🔐 Security

- Alle Tenant-Routen durch `loadTenant` Middleware geschützt
- Permission-Checks auf API-Ebene
- Suspended Tenants können nicht zugreifen (`is_active = false`)
- SQL Injection durch parametrisierte Queries verhindert
- Tenant-Datenisolation über `tenant_id` Foreign Keys

## 🚀 Nächste Schritte

1. **Customer-Seiten erweitern**
   - Permissions zu allen 20 customer-*.tsx Seiten hinzufügen
   - `useTenantSettings()` Hook in jede Seite integrieren

2. **User Management**
   - User-CRUD innerhalb Tenant-Context
   - Role-based Access Control (RBAC)

3. **Billing Integration**
   - Stripe/PayPal Integration
   - Automatische Subscription-Upgrades
   - Rechnungserstellung

4. **Audit Logging**
   - Permission-Änderungen loggen
   - Admin-Aktionen tracken
   - Customer-Aktivität monitoren

5. **WebSocket für Live-Updates**
   - Echtzeit Permission-Änderungen ohne Reload
   - Live-Status-Updates

## 📝 Notizen

- Alle API-Endpunkte nutzen PostgreSQL direkt (kein ORM)
- Settings als JSONB für flexible Konfiguration
- Mock-Daten in Customer-Routen müssen durch echte Datenbank-Abfragen ersetzt werden
- Admin-UI bereits vollständig (969 Zeilen), nur Backend fehlte
- 20 Customer-Seiten identifiziert, noch nicht alle mit Permissions versehen

## 🐛 Bekannte Issues

- Noch keine Validierung für duplicate slugs (Frontend)
- API Error Handling kann verbessert werden
- Rate Limiting noch nicht aktiv implementiert
- WebSocket/Polling für Live-Updates fehlt
- **Server startet nicht wegen regulatoryUpdateCollector.ts require() Fehler (separates Issue, nicht Teil dieser Implementation)**

## ✅ Testing

```bash
# Admin API testen
curl http://localhost:5000/api/admin/tenants

# Tenant erstellen
curl -X POST http://localhost:5000/api/admin/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Corp",
    "slug": "test-corp",
    "subscriptionPlan": "professional",
    "billingEmail": "test@test.com"
  }'

# Customer Settings abrufen
curl http://localhost:5000/api/tenant/{tenantId}/settings

# Permission testen (sollte 403 bei fehlender Permission)
curl http://localhost:5000/api/tenant/{tenantId}/analytics
```
