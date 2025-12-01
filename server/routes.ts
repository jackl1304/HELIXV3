import express from 'express';
import { registerLegalRoutes } from './routes/legal.routes.js';
import { registerDataRoutes } from './routes/data.routes.js';
import { registerAuthRoutes } from './routes/auth.routes.js';
import { registerCoreRoutes } from './routes/core.routes.js';

export function registerRoutes(app: express.Application) {
  // Register all route modules
  registerLegalRoutes(app);
  registerDataRoutes(app);
  registerAuthRoutes(app);
  registerCoreRoutes(app);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });
}
