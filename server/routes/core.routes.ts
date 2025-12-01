import type { Express } from "express";

/**
 * Core API routes - basic functionality and utilities
 */
export function registerCoreRoutes(app: Express) {
  // Basic test endpoint
  app.get('/api/test', (req, res) => {
    res.json({
      message: 'API is working',
      timestamp: new Date().toISOString(),
      version: '3.0.0'
    });
  });

  // Compliance Guide Download (Markdown)
  app.get('/api/compliance-guide', async (req, res) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const guidePath = path.resolve(__dirname, '../../COMPLIANCE_BOSS_GUIDE_MDR_IVDR_2025.md');

      if (!fs.existsSync(guidePath)) {
        return res.status(404).json({ error: 'Guide not found' });
      }

      const content = fs.readFileSync(guidePath, 'utf-8');
      res.setHeader('Content-Type', 'text/markdown');
      res.send(content);
    } catch (error: any) {
      console.error('Error serving compliance guide:', error);
      res.status(500).json({
        error: 'Failed to load guide',
        message: error.message
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '3.0.0'
    });
  });
}
