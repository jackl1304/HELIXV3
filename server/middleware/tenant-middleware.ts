import { Request, Response, NextFunction } from 'express';
import { db } from '../storage';

export interface TenantRequest extends Request {
  tenant?: {
    id: string;
    name: string;
    permissions: Record<string, boolean>;
    subscriptionPlan: string;
    settings: any;
  };
}

/**
 * Middleware zur Verifizierung und Ladung von Tenant-Daten aus der URL
 * Erwartet /tenant/:tenantId/* Format
 */
export async function loadTenant(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const tenantId = req.params.tenantId || req.query.tenantId as string;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const result = await (db as any).execute({
      sql: `SELECT id, name, subdomain, settings, subscription_tier, is_active FROM tenants WHERE id = $1`,
      params: [tenantId]
    });

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenant = result[0];

    if (!tenant.is_active) {
      return res.status(403).json({ error: 'Tenant account is suspended' });
    }

    req.tenant = {
      id: tenant.id,
      name: tenant.name,
      permissions: (tenant.settings as any)?.permissions || {},
      subscriptionPlan: tenant.subscription_tier,
      settings: tenant.settings || {},
    };

    next();
  } catch (error: any) {
    console.error('[TenantMiddleware] Error loading tenant:', error);
    res.status(500).json({ error: 'Failed to load tenant data' });
  }
}

/**
 * Middleware zur Prüfung spezifischer Berechtigungen
 * @param permission - Name der zu prüfenden Berechtigung
 */
export function requirePermission(permission: string) {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return res.status(401).json({ error: 'Tenant context required' });
    }

    const hasPermission = req.tenant.permissions[permission] === true;

    if (!hasPermission) {
      return res.status(403).json({
        error: `Access denied: ${permission} permission required`,
        permission,
        available: Object.keys(req.tenant.permissions).filter(k => req.tenant?.permissions[k])
      });
    }

    next();
  };
}

/**
 * Middleware zur Prüfung ob Subscription-Plan Zugriff erlaubt
 * @param allowedPlans - Array von erlaubten Subscription-Plänen
 */
export function requireSubscription(allowedPlans: string[]) {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return res.status(401).json({ error: 'Tenant context required' });
    }

    const hasPlan = allowedPlans.includes(req.tenant.subscriptionPlan);

    if (!hasPlan) {
      return res.status(403).json({
        error: 'Subscription upgrade required',
        currentPlan: req.tenant.subscriptionPlan,
        requiredPlans: allowedPlans
      });
    }

    next();
  };
}

/**
 * Middleware zur Rate-Limiting basierend auf Tenant-Limits
 */
export async function checkTenantLimits(req: TenantRequest, res: Response, next: NextFunction) {
  if (!req.tenant) {
    return res.status(401).json({ error: 'Tenant context required' });
  }

  try {
    // Hier kann erweiterte Logik für API-Rate-Limits, Datenlimits etc. implementiert werden
    const apiAccessEnabled = req.tenant.settings?.apiAccessEnabled;

    if (req.path.includes('/api/') && !apiAccessEnabled) {
      return res.status(403).json({
        error: 'API access not enabled for this tenant',
        upgradeRequired: true
      });
    }

    next();
  } catch (error: any) {
    console.error('[TenantMiddleware] Error checking limits:', error);
    res.status(500).json({ error: 'Failed to check tenant limits' });
  }
}
