import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';

export interface TenantPermissions {
  dashboard: boolean;
  regulatoryUpdates: boolean;
  legalCases: boolean;
  knowledgeBase: boolean;
  newsletters: boolean;
  analytics: boolean;
  reports: boolean;
  dataCollection: boolean;
  globalSources: boolean;
  historicalData: boolean;
  administration: boolean;
  userManagement: boolean;
  systemSettings: boolean;
  auditLogs: boolean;
  analyticsInsights: boolean;
  advancedAnalytics: boolean;
}

export interface TenantSettings {
  tenantId: string;
  name: string;
  subscriptionPlan: string;
  permissions: TenantPermissions;
  settings: {
    maxUsers?: number;
    maxDataSources?: number;
    apiAccessEnabled?: boolean;
    [key: string]: any;
  };
}

/**
 * Hook zum Laden von Tenant-Einstellungen und Permissions
 * Wird auf allen Customer-Seiten verwendet
 */
export function useTenantSettings() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params?.tenantId;

  const { data, isLoading, error } = useQuery<TenantSettings>({
    queryKey: [`/api/tenant/${tenantId}/settings`],
    enabled: !!tenantId,
  });

  return {
    tenantId,
    settings: data,
    permissions: data?.permissions,
    isLoading,
    error,
    hasPermission: (permission: keyof TenantPermissions) => {
      return data?.permissions?.[permission] === true;
    },
    subscriptionPlan: data?.subscriptionPlan,
  };
}

/**
 * Hook zur Prüfung spezifischer Permissions
 * Wirft Fehler wenn Permission fehlt
 */
export function useRequirePermission(permission: keyof TenantPermissions) {
  const { permissions, hasPermission } = useTenantSettings();

  if (!permissions) {
    return { loading: true, allowed: false };
  }

  const allowed = hasPermission(permission);

  return {
    loading: false,
    allowed,
    permissions,
  };
}

/**
 * Komponente für Permission-Gate
 * Rendert Kinder nur wenn Permission vorhanden
 */
export function PermissionGate({
  permission,
  children,
  fallback = <PermissionDenied permission={permission} />,
}: {
  permission: keyof TenantPermissions;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasPermission, isLoading } = useTenantSettings();

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Lädt...</div>;
  }

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Standard Fallback für fehlende Permissions
 */
function PermissionDenied({ permission }: { permission: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-full">
        <svg
          className="w-12 h-12 text-yellow-600 dark:text-yellow-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m0 0v2m0-2h2m-2 0H10m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold mb-2">Zugriff eingeschränkt</h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        Ihr aktueller Subscription-Plan beinhaltet keinen Zugriff auf <strong>{permission}</strong>.
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        Bitte kontaktieren Sie Ihren Administrator für ein Upgrade.
      </p>
      <button
        onClick={() => window.history.back()}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Zurück
      </button>
    </div>
  );
}
