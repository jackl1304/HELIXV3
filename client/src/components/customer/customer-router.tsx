import React, { useState, useEffect } from "react";

// Direct imports - NO lazy loading for zero Suspense issues
import CustomerDashboard from "@/pages/customer-dashboard";

// JSON-based Customer Portal - NO complex routing or Suspense
interface CustomerData {
  tenantId: string;
  permissions: string[];
  theme: string;
}

export default function CustomerRouter() {
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simple JSON-based customer data loading
    const loadCustomerData = async () => {
      try {
        // Mock tenant ID - in production würde das aus Auth Context kommen
        const mockTenantId = '030d3e01-32c4-4f95-8d54-98be948e8d4b';
        const response = await fetch(`/api/tenant/${mockTenantId}/settings`);
        if (response.ok) {
          const data = await response.json();
          setCustomerData({
            tenantId: data.tenantId,
            permissions: Object.keys(data.permissions || {}),
            theme: 'default'
          });
        } else {
          // Fallback für Entwicklung
          setCustomerData({
            tenantId: mockTenantId,
            permissions: ['dashboard', 'analyticsInsights'],
            theme: 'default'
          });
        }
      } catch (error) {
        console.error('Error loading customer data:', error);
        // Fallback für Entwicklung
        setCustomerData({
          tenantId: '030d3e01-32c4-4f95-8d54-98be948e8d4b',
          permissions: ['dashboard', 'analyticsInsights'],
          theme: 'default'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomerData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Customer Portal wird geladen...</p>
        </div>
      </div>
    );
  }

  // Simple direct rendering - no complex routing
  return <CustomerDashboard />;
}
