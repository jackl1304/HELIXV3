https://github.com/jackl1304/HELIXV3# Helix Regulatory Intelligence Platform

Eine umfassende AI-gestützte MedTech-Regulatory-Intelligence-Plattform, die komplexe rechtliche und regulatorische Landschaften durch intelligente Datenanalyse und Echtzeit-Insights vereinfacht.

## 🎯 Überblick

Die Plattform bietet umfassendes Legal Case Management, tiefgreifende Wissensextraktion und multi-jurisdiktionelle regulatorische Überwachung mit erweiterten Datenarchivierungs- und Dokumenten-Intelligence-Funktionen.

## 🚀 Features

- **Regulatory Intelligence**: Automatisierte Sammlung von FDA, EMA, BfArM, Swissmedic und MHRA Updates
- **Legal Case Management**: Umfassende Gerichtsentscheidungsdatenbank mit AI-gestützter Analyse
- **Real-time Monitoring**: Live-Überwachung von regulatorischen Änderungen
- **AI-Powered Analysis**: Intelligente Inhaltsanalyse und Bewertung
- **Multi-Language Support**: Deutsche Benutzeroberfläche mit internationalen Datenquellen
- **Historical Data**: Archivierte Dokumente mit effizienter Suchfunktion

## 🛠️ Tech Stack

### Frontend
- **React 18** mit TypeScript
- **Tailwind CSS** + shadcn/ui Komponenten
- **TanStack Query** für Server State Management
- **Wouter** für Client-side Routing
- **Vite** als Build Tool

### Backend
- **Node.js** mit Express.js
- **TypeScript** (Strict Mode)
- **PostgreSQL** mit Drizzle ORM
- **Neon** (Serverless PostgreSQL)
- **Winston** für strukturiertes Logging
- **Zod** für Input-Validierung

### AI & Services
- **Anthropic Claude** für Content-Analyse
- **SendGrid** für E-Mail-Versand
- **RSS Monitoring** für Echtzeit-Updates

## 📦 Installation

### Voraussetzungen
- Node.js 18+
- PostgreSQL (oder Neon Account)
- npm oder yarn

# Setup
```bash
# Repository klonen
git clone https://github.com/jackl1304/HELIXV3.git
cd helix-platform

# Dependencies installieren
npm install

# Environment konfigurieren
cp .env.example .env
# .env mit Ihren Daten ausfüllen

# Datenbank setup
npm run db:push

# Development Server starten
npm run dev
```

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Optional API Keys
SENDGRID_API_KEY="your-sendgrid-key"
ANTHROPIC_API_KEY="your-anthropic-key"

# Development
NODE_ENV="development"
LOG_LEVEL="info"
```

## 🏗️ Projektstruktur

```
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/    # UI Komponenten
│   │   ├── pages/         # Seiten/Routes
│   │   ├── lib/          # Utilities & Hooks
│   │   └── assets/       # Statische Assets
├── server/                # Node.js Backend
│   ├── controllers/      # Route Handler
│   ├── middleware/       # Express Middleware
│   ├── services/         # Business Logic
│   ├── validators/       # Zod Schemas
│   └── config/          # Konfiguration
├── shared/               # Geteilte TypeScript Types
│   └── types/           # API & Storage Interfaces
└── docs/                # Dokumentation
```

## 🔧 Development

### Scripts
```bash
# Development
npm run dev              # Start dev server
npm run db:push         # Push schema changes
npm run db:studio       # Open Drizzle Studio

# Code Quality
npm run lint            # ESLint check & fix
npm run type-check      # TypeScript check
npm run format          # Prettier formatting

# Build & Deploy
npm run build           # Production build
npm run start           # Start production server
```

### API Entwicklung

#### Neue API Route hinzufügen
1. Controller in `server/controllers/` erstellen
2. Zod Validator in `server/validators/` definieren
3. Route in `server/routes.ts` registrieren
4. Types in `shared/types/` definieren

#### Beispiel:
```typescript
// server/controllers/example.controller.ts
export class ExampleController {
  getItems = asyncHandler(async (req: Request, res: Response) => {
    const items = await storage.getItems();
    res.json({ success: true, data: items });
  });
}

// server/validators/example.validator.ts
export const itemSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['type1', 'type2'])
});
```

### Frontend Entwicklung

#### Neue Seite hinzufügen
1. Komponente in `client/src/pages/` erstellen
2. Route in `client/src/App.tsx` registrieren
3. Navigation in Layout-Komponente hinzufügen

#### API Calls
```typescript
// TanStack Query für API Calls
const { data, isLoading } = useQuery({
  queryKey: ['/api/items'],
  queryFn: () => fetch('/api/items').then(r => r.json())
});
```

## 🏛️ Architektur

### Datenfluss
1. **Sammlung**: Automatisierte APIs sammeln regulatorische Updates
2. **Verarbeitung**: AI-Services analysieren und kategorisieren Inhalte
3. **Speicherung**: PostgreSQL mit optimierten Indizes
4. **Distribution**: REST APIs für Frontend-Zugriff
5. **Monitoring**: Winston Logging + Performance Tracking

### Sicherheit
- Rate Limiting (100 req/15min)
- Input Sanitization & Validation
- Security Headers (XSS, CSRF Protection)
- Environment-basierte Konfiguration
- Strukturierte Error Handling

### Performance
- React Query Caching
- Database Indexing
- Lazy Loading
- Code Splitting
- CDN-ready Assets

## 📊 Monitoring & Logging

### Log Levels
- **Error**: Kritische Fehler, die sofortige Aufmerksamkeit erfordern
- **Warn**: Potentielle Probleme, die überwacht werden sollten
- **Info**: Normale Betriebsinformationen
- **Debug**: Detaillierte Debugging-Informationen

### Strukturierte Logs
```typescript
logger.info('User action completed', {
  userId: user.id,
  action: 'update_profile',
  duration: Date.now() - startTime
});
```

## 🧪 Testing

```bash
# Unit Tests
npm run test

# Coverage Report
npm run test:coverage

# E2E Tests
npm run test:e2e
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Setup
- Setzen Sie `NODE_ENV=production`
- Konfigurieren Sie Production Database
- Setzen Sie alle erforderlichen API Keys
- Aktivieren Sie SSL/TLS

## 📝 Beitrag

1. Fork das Repository
2. Feature Branch erstellen (`git checkout -b feature/amazing-feature`)
3. Commits hinzufügen (`git commit -m 'Add amazing feature'`)
4. Branch pushen (`git push origin feature/amazing-feature`)
5. Pull Request öffnen

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) für Details.

## 🤝 Support

Für Support und Fragen:
- GitHub Issues für Bug Reports
- Dokumentation in `/docs`
- Code-Kommentare für Implementation Details

---

**Helix Regulatory Intelligence Platform** - Transforming Complex Regulatory Information into Actionable Intelligence 🚀