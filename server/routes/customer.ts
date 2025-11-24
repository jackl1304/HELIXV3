import { Router } from 'express';
import { loadTenant, requirePermission } from '../middleware/tenant-middleware';

const router = Router();

// Alle Customer-Routen verwenden loadTenant Middleware
router.use('/:tenantId/*', loadTenant);

// Dashboard - Basis-Berechtigung
router.get('/:tenantId/dashboard/stats', requirePermission('dashboard'), async (req, res) => {
  try {
    const tenant = (req as any).tenant;
    // Tenant-spezifische Statistiken
    res.json({
      tenantId: tenant.id,
      stats: {
        regulatoryUpdates: 0,
        legalCases: 0,
        analyticsInsights: 0,
        // Placeholder für echte Daten
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Regulatory Updates - Erfordert regulatoryUpdates Permission
router.get('/:tenantId/regulatory-updates', requirePermission('regulatoryUpdates'), async (req, res) => {
  try {
    const tenant = (req as any).tenant;
    // Regulatory Updates für diesen Tenant
    res.json({
      tenantId: tenant.id,
      updates: [],
      // Placeholder
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Legal Cases - Erfordert legalCases Permission
router.get('/:tenantId/legal-cases', requirePermission('legalCases'), async (req, res) => {
  try {
    const tenant = (req as any).tenant;
    res.json({
      tenantId: tenant.id,
      cases: [],
      // Placeholder
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics Insights - Erfordert analyticsInsights Permission
router.get('/:tenantId/analytics-insights', requirePermission('analyticsInsights'), async (req, res) => {
  try {
    const tenant = (req as any).tenant;
    res.json({
      tenantId: tenant.id,
      insights: [],
      // Placeholder
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics - Erfordert analytics Permission
router.get('/:tenantId/analytics', requirePermission('analytics'), async (req, res) => {
  try {
    const tenant = (req as any).tenant;
    res.json({
      tenantId: tenant.id,
      analytics: {},
      // Placeholder
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Settings - Jeder authentifizierte Tenant kann seine Settings sehen
router.get('/:tenantId/settings', async (req, res) => {
  try {
    const tenant = (req as any).tenant;
    res.json({
      tenantId: tenant.id,
      name: tenant.name,
      subscriptionPlan: tenant.subscriptionPlan,
      permissions: tenant.permissions,
      settings: tenant.settings,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// User Management - Erfordert userManagement Permission
router.get('/:tenantId/users', requirePermission('userManagement'), async (req, res) => {
  try {
    const tenant = (req as any).tenant;
    // Benutzer dieses Tenants laden
    res.json({
      tenantId: tenant.id,
      users: [],
      // Placeholder
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
