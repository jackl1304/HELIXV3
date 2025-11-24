import { Router } from 'express';
import { db } from '../storage';

const router = Router();

// GET /api/admin/tenants - Alle Tenants abrufen
router.get('/tenants', async (_req, res) => {
  try {
    const result = await (db as any).execute({
      sql: `SELECT
        id, name, subdomain, custom_domain, logo, color_scheme,
        settings, subscription_tier, is_active, created_at, updated_at
      FROM tenants
      ORDER BY created_at DESC`,
      params: []
    });

    const tenants = (result || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      slug: t.subdomain,
      customDomain: t.custom_domain,
      logo: t.logo,
      colorScheme: t.color_scheme || 'blue',
      subscriptionPlan: t.subscription_tier || 'standard',
      subscriptionStatus: t.is_active ? 'active' : 'suspended',
      settings: t.settings || {},
      customerPermissions: (t.settings as any)?.permissions || getDefaultPermissions(),
      maxUsers: (t.settings as any)?.maxUsers || 5,
      maxDataSources: (t.settings as any)?.maxDataSources || 10,
      apiAccessEnabled: (t.settings as any)?.apiAccessEnabled || false,
      customBrandingEnabled: t.subscription_tier === 'enterprise',
      billingEmail: (t.settings as any)?.billingEmail || '',
      contactName: (t.settings as any)?.contactName || '',
      contactEmail: (t.settings as any)?.contactEmail || '',
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));

    res.json(tenants);
  } catch (error: any) {
    console.error('[Admin] Error fetching tenants:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/tenants/:id - Einzelnen Tenant abrufen
router.get('/tenants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await (db as any).execute({
      sql: `SELECT * FROM tenants WHERE id = $1`,
      params: [id]
    });

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenant = result[0];
    res.json({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.subdomain,
      customDomain: tenant.custom_domain,
      logo: tenant.logo,
      colorScheme: tenant.color_scheme || 'blue',
      subscriptionPlan: tenant.subscription_tier || 'standard',
      subscriptionStatus: tenant.is_active ? 'active' : 'suspended',
      settings: tenant.settings || {},
      customerPermissions: (tenant.settings as any)?.permissions || getDefaultPermissions(),
      createdAt: tenant.created_at,
      updatedAt: tenant.updated_at,
    });
  } catch (error: any) {
    console.error('[Admin] Error fetching tenant:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/tenants - Neuen Tenant erstellen
router.post('/tenants', async (req, res) => {
  try {
    const {
      name,
      slug,
      subscriptionPlan,
      billingEmail,
      contactName,
      contactEmail,
      maxUsers,
      maxDataSources,
      apiAccessEnabled,
      colorScheme,
      customerPermissions
    } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const settings = {
      billingEmail,
      contactName,
      contactEmail,
      maxUsers: maxUsers || 5,
      maxDataSources: maxDataSources || 10,
      apiAccessEnabled: apiAccessEnabled || false,
      permissions: customerPermissions || getDefaultPermissions(),
    };

    const result = await (db as any).execute({
      sql: `INSERT INTO tenants (
        id, name, subdomain, color_scheme, settings, subscription_tier, is_active, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, true, NOW(), NOW()
      ) RETURNING *`,
      params: [
        name,
        slug,
        colorScheme || 'blue',
        JSON.stringify(settings),
        subscriptionPlan || 'standard'
      ]
    });

    const newTenant = result[0];
    console.log('[Admin] Created tenant:', newTenant.id);

    res.status(201).json({
      id: newTenant.id,
      name: newTenant.name,
      slug: newTenant.subdomain,
      subscriptionPlan: newTenant.subscription_tier,
      settings: newTenant.settings,
    });
  } catch (error: any) {
    console.error('[Admin] Error creating tenant:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/tenants/:id - Tenant aktualisieren
router.put('/tenants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      subscriptionPlan,
      subscriptionStatus,
      billingEmail,
      contactName,
      contactEmail,
      maxUsers,
      maxDataSources,
      apiAccessEnabled,
      colorScheme,
      customerPermissions,
      logo,
      customDomain
    } = req.body;

    // Hole aktuellen Tenant
    const currentResult = await (db as any).execute({
      sql: `SELECT settings FROM tenants WHERE id = $1`,
      params: [id]
    });

    if (!currentResult || currentResult.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const currentSettings = currentResult[0].settings || {};
    const updatedSettings = {
      ...currentSettings,
      billingEmail: billingEmail !== undefined ? billingEmail : currentSettings.billingEmail,
      contactName: contactName !== undefined ? contactName : currentSettings.contactName,
      contactEmail: contactEmail !== undefined ? contactEmail : currentSettings.contactEmail,
      maxUsers: maxUsers !== undefined ? maxUsers : currentSettings.maxUsers,
      maxDataSources: maxDataSources !== undefined ? maxDataSources : currentSettings.maxDataSources,
      apiAccessEnabled: apiAccessEnabled !== undefined ? apiAccessEnabled : currentSettings.apiAccessEnabled,
      permissions: customerPermissions !== undefined ? customerPermissions : currentSettings.permissions,
    };

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (name) {
      updates.push(`name = $${paramIndex++}`);
      params.push(name);
    }
    if (slug) {
      updates.push(`subdomain = $${paramIndex++}`);
      params.push(slug);
    }
    if (subscriptionPlan) {
      updates.push(`subscription_tier = $${paramIndex++}`);
      params.push(subscriptionPlan);
    }
    if (subscriptionStatus !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(subscriptionStatus === 'active');
    }
    if (colorScheme) {
      updates.push(`color_scheme = $${paramIndex++}`);
      params.push(colorScheme);
    }
    if (logo !== undefined) {
      updates.push(`logo = $${paramIndex++}`);
      params.push(logo);
    }
    if (customDomain !== undefined) {
      updates.push(`custom_domain = $${paramIndex++}`);
      params.push(customDomain);
    }

    updates.push(`settings = $${paramIndex++}`);
    params.push(JSON.stringify(updatedSettings));

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const sql = `UPDATE tenants SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await (db as any).execute({ sql, params });

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const updated = result[0];
    console.log('[Admin] Updated tenant:', updated.id);

    res.json({
      id: updated.id,
      name: updated.name,
      slug: updated.subdomain,
      subscriptionPlan: updated.subscription_tier,
      subscriptionStatus: updated.is_active ? 'active' : 'suspended',
      settings: updated.settings,
    });
  } catch (error: any) {
    console.error('[Admin] Error updating tenant:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/tenants/:id - Tenant löschen
router.delete('/tenants/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await (db as any).execute({
      sql: `DELETE FROM tenants WHERE id = $1 RETURNING id`,
      params: [id]
    });

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    console.log('[Admin] Deleted tenant:', id);
    res.json({ success: true, id });
  } catch (error: any) {
    console.error('[Admin] Error deleting tenant:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/tenants/:id/users - Benutzer eines Tenants abrufen
router.get('/tenants/:id/users', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await (db as any).execute({
      sql: `SELECT
        id, email, name, role, is_active, last_login, metadata, created_at
      FROM users
      WHERE tenant_id = $1
      ORDER BY created_at DESC`,
      params: [id]
    });

    res.json(result || []);
  } catch (error: any) {
    console.error('[Admin] Error fetching tenant users:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/stats - Admin-Statistiken
router.get('/stats', async (_req, res) => {
  try {
    const [tenantsResult, usersResult, activeResult] = await Promise.all([
      (db as any).execute({ sql: 'SELECT COUNT(*)::int as count FROM tenants', params: [] }),
      (db as any).execute({ sql: 'SELECT COUNT(*)::int as count FROM users', params: [] }),
      (db as any).execute({ sql: 'SELECT COUNT(*)::int as count FROM tenants WHERE is_active = true', params: [] })
    ]);

    res.json({
      totalTenants: tenantsResult?.[0]?.count || 0,
      totalUsers: usersResult?.[0]?.count || 0,
      activeTenants: activeResult?.[0]?.count || 0,
      revenue: 0, // Placeholder
      growth: 0, // Placeholder
    });
  } catch (error: any) {
    console.error('[Admin] Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Hilfsfunktion für Default Permissions
function getDefaultPermissions(): any {
  return {
    dashboard: true,
    regulatoryUpdates: true,
    legalCases: false,
    knowledgeBase: false,
    newsletters: false,
    analytics: false,
    reports: false,
    dataCollection: false,
    globalSources: false,
    historicalData: false,
    administration: false,
    userManagement: false,
    systemSettings: false,
    auditLogs: false,
    analyticsInsights: false,
    advancedAnalytics: false,
  };
}

export default router;
