
// Load environment variables first
import { config } from "dotenv";
config();

import express, { type Request, type Response, type NextFunction } from "express";
import { createServer } from "http";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { db, dbDriver } from './db';
import { setupVite, serveStatic } from "./vite";
import { dailySyncScheduler } from './services/dailySyncScheduler';
import { startSourceImportScheduler, getSchedulerStatus, runImmediateImportCycle } from './services/sourceImportScheduler';
import { sanitizeObjectDeep } from '../client/src/lib/neutralTerms';

// Windows-kompatible __dirname für ES-Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Environment detection - Netcup optimized
const isDevelopment = process.env.NODE_ENV !== "production";
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = '0.0.0.0'; // Generic container/host deployment

console.log(`🚀 HELIX Regulatory Informationsplattform`);
console.log(`📍 Environment: ${isDevelopment ? 'development' : 'production'}`);
console.log(`🔗 Binding to: ${HOST}:${PORT}`);

// Enhanced CORS for production
app.use(cors({
  origin: isDevelopment ? true : [
    'https://helix.deltaways.de',
    'https://regulatory.deltaways.de',
    /\.deltaways\.de$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control']
}));

// Enhanced security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (!isDevelopment) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Enhanced request parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Response Sanitization Middleware (entfernt verbotene KI/AI Begriffe aus allen JSON Antworten)
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    try {
      const sanitized = sanitizeObjectDeep(body);
      return originalJson(sanitized);
    } catch (e) {
      console.warn('Sanitization failed, sending original body:', (e as any)?.message);
      return originalJson(body);
    }
  };
  next();
});

// Health check endpoint - HIGHEST PRIORITY
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: isDevelopment ? 'development' : 'production',
    port: PORT,
    host: HOST,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '2.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: isDevelopment ? 'development' : 'production',
    services: ['database', 'apis', 'cache'],
    version: '2.0.0'
  });
});

// API routes setup with enhanced error handling
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Initialize daily sync scheduler for live data sources (NON-BLOCKING)
setImmediate(() => {
  dailySyncScheduler.startScheduledSync()
    .then(() => console.log('✅ Daily sync scheduler started successfully'))
    .catch(error => console.error('⚠️ Daily sync scheduler failed:', error));
});
// Start 30-Minuten Quellen-Import Scheduler
setImmediate(() => {
  startSourceImportScheduler();
});

// Auto-Seeding Guard: Wenn Kern-Tabellen leer sind und AUTO_SEED=1, führe Import-Skripte aus
setImmediate(async () => {
  if (process.env.AUTO_SEED === '1') {
    console.log('[SEED] AUTO_SEED aktiv – starte direkten Import-Zyklus');
    runImmediateImportCycle().catch(e => console.warn('[SEED] Fehler beim Import-Zyklus:', (e as any)?.message));
  }
});

// ❌ ALL MOCK/DEMO DATA SEEDING REMOVED
// Only real data from external sources (FDA, EMA, Health Canada, MHRA, etc.)

// Register all API routes
try {
  registerRoutes(app);
  console.log('✅ API routes registered successfully');
} catch (error) {
  console.error('❌ Critical error registering routes:', error);
  process.exit(1);
}

// Production vs Development setup
if (!isDevelopment) {
  console.log('📦 Production mode: Serving built static files');
  // Uses dist/public via serveStatic helper (Vite build output)
  serveStatic(app);
} else {
  console.log('🔧 Development mode: Setting up Vite dev server');
  setupVite(app, server).catch(error => {
    console.error('❌ Vite setup failed:', error);
  });
}

// Enhanced global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('🚨 Server error:', {
    message: err.message,
    stack: isDevelopment ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  if (req.path.startsWith('/api/')) {
    res.status(err.status || 500).json({
      error: 'Internal server error',
      message: isDevelopment ? err.message : 'Something went wrong',
      timestamp: new Date().toISOString(),
      path: req.path
    });
  } else {
    next(err);
  }
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: `API endpoint not found: ${req.path}`,
    timestamp: new Date().toISOString(),
    available: [
      '/api/health',
      '/api/dashboard/stats',
      '/api/regulatory-updates',
      '/api/rechtsprechung',
      '/api/data-sources',
      '/api/source-import/status',
      '/api/source-import/trigger (POST)'
    ]
  });
});

// Scheduler Status Endpoint
app.get('/api/source-import/status', (req, res) => {
  res.json(getSchedulerStatus());
});

// Manual Import Trigger Endpoint (Admin)
app.post('/api/source-import/trigger', async (req, res) => {
  try {
    console.log('[API] Manual import triggered');
    runImmediateImportCycle().catch(e => console.error('[API] Import error:', e));
    res.json({
      message: 'Import cycle started in background',
      checkStatus: '/api/source-import/status'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// Enhanced server startup
server.listen(PORT, HOST, () => {
  console.log('');
  console.log('🎉 HELIX System Successfully Started!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🌐 Server URL: http://${HOST}:${PORT}`);
  console.log(`📊 Health Check: http://${HOST}:${PORT}/health`);
  console.log(`🔧 Environment: ${isDevelopment ? 'Development' : 'Production'}`);
  console.log(`💾 Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  console.log(`⚡ Process ID: ${process.pid}`);
  console.log('');
  console.log('🏢 Engineered by DELTA WAYS - Professional MedTech Solutions');
  console.log('📱 Deployment ready - Alle plattformspezifischen Alt-Abhängigkeiten entfernt');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

// Enhanced graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  server.close((err) => {
    if (err) {
      console.error('❌ Error during shutdown:', err);
      process.exit(1);
    }

    console.log('✅ Server closed successfully');
    console.log('👋 HELIX System shutdown complete');
    process.exit(0);
  });

  // Force close after 30 seconds
  setTimeout(() => {
    console.error('⚠️ Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

export { app, server };
