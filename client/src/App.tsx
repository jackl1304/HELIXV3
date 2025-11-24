import React, { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ResponsiveLayout } from "@/components/responsive-layout";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { LanguageProvider } from "@/contexts/LanguageContext";

// Core Pages (eager loading)
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

// Dynamic Import Error Handler
const withErrorHandling = (importFn: () => Promise<any>) => {
  return React.lazy(() =>
    importFn().catch(error => {
      console.error('Dynamic import failed:', error);
      // Fallback to NotFound component on import failure
      return { default: NotFound };
    })
  );
};

const RechtsprechungAnalyse = withErrorHandling(() => import("@/pages/rechtsprechung-analyse"));

// Lazy load components with error handling for better performance and stability
const Dashboard = withErrorHandling(() => import("@/pages/dashboard"));
const Analytics = withErrorHandling(() => import("@/pages/analytics"));
const CustomerDashboard = withErrorHandling(() => import("@/pages/customer-dashboard"));
const CustomerRegulatoryUpdates = withErrorHandling(() => import("@/pages/customer-regulatory-updates"));
const CustomerLegalCases = withErrorHandling(() => import("@/pages/customer-legal-cases"));
const CustomerKnowledgeBase = withErrorHandling(() => import("@/pages/customer-knowledge-base"));
const CustomerAnalytics = withErrorHandling(() => import("@/pages/customer-analytics"));
const CustomerAIInsights = withErrorHandling(() => import("@/pages/customer-ai-insights"));
const CustomerNewsletters = withErrorHandling(() => import("@/pages/customer-newsletters"));
const CustomerSettings = withErrorHandling(() => import("@/pages/customer-settings"));
const CustomerDataCollection = withErrorHandling(() => import("@/pages/customer-data-collection"));
const CustomerGlobalSources = withErrorHandling(() => import("@/pages/customer-global-sources"));
const CustomerHistoricalData = withErrorHandling(() => import("@/pages/customer-historical-data"));
const SystemSettings = withErrorHandling(() => import("@/pages/system-settings"));
const RegulatoryUpdates = withErrorHandling(() => import("@/pages/regulatory-updates"));
const DataCollection = withErrorHandling(() => import("@/pages/data-collection"));
const NewsletterAdmin = withErrorHandling(() => import("@/pages/newsletter-admin"));
const EmailManagement = withErrorHandling(() => import("@/pages/email-management"));
const KnowledgeBase = withErrorHandling(() => import("@/pages/knowledge-base"));
const RechtsprechungFixed = withErrorHandling(() => import("@/pages/rechtsprechung-fixed"));
const ZulassungenGlobal = withErrorHandling(() => import("@/pages/zulassungen-global"));
const LaufendeZulassungen = withErrorHandling(() => import("@/pages/laufende-zulassungen"));
const SyncManager = withErrorHandling(() => import("@/pages/sync-manager"));
const GlobalSources = withErrorHandling(() => import("@/pages/global-sources"));
const NewsletterManager = withErrorHandling(() => import("@/pages/newsletter-manager"));
const HistoricalData = withErrorHandling(() => import("@/pages/historical-data"));
const AdminCustomers = withErrorHandling(() => import("@/pages/admin-customers"));
const UserManagement = withErrorHandling(() => import("@/pages/user-management"));
const Administration = withErrorHandling(() => import("@/pages/administration"));
const AuditLogs = withErrorHandling(() => import("@/pages/audit-logs"));
const ContentAnalysis = withErrorHandling(() => import("@/pages/ai-content-analysis"));
const AnalyticsInsights = withErrorHandling(() => import("@/pages/ai-insights"));
const GripIntegration = withErrorHandling(() => import("@/pages/grip-integration"));
const CustomerAreas = withErrorHandling(() => import("@/pages/customer-areas"));
const CustomerArea1 = withErrorHandling(() => import("@/pages/customer-area-1"));
const CustomerArea2 = withErrorHandling(() => import("@/pages/customer-area-2"));
const CustomerArea3 = withErrorHandling(() => import("@/pages/customer-area-3"));
const CustomerArea3Projects = withErrorHandling(() => import("@/pages/customer-area-3-projects"));
const CustomerArea3NewProject = withErrorHandling(() => import("@/pages/customer-area-3-new-project"));
const CustomerArea3Projektakte = withErrorHandling(() => import("@/pages/customer-area-3-projektakte"));
const Patents = withErrorHandling(() => import("@/pages/patents"));
const KIAssistant1 = withErrorHandling(() => import("@/pages/ki-assistant-1"));
const KIAssistant2 = withErrorHandling(() => import("@/pages/ki-assistant-2"));
const KIAssistant3 = withErrorHandling(() => import("@/pages/ki-assistant-3"));
const ChatRag = withErrorHandling(() => import("@/pages/chat-rag"));

// Stakeholder Dashboards
const QMDashboard = withErrorHandling(() => import("@/pages/qm-dashboard"));
const DevImpactDashboard = withErrorHandling(() => import("@/pages/dev-impact-dashboard"));
const ExecDashboard = withErrorHandling(() => import("@/pages/exec-dashboard"));

// Standards & Normen
const ISOStandards = withErrorHandling(() => import("@/pages/iso-standards"));
const IECStandards = withErrorHandling(() => import("@/pages/iec-standards"));
const ASTMStandards = withErrorHandling(() => import("@/pages/astm-standards"));
const ENStandards = withErrorHandling(() => import("@/pages/en-standards"));
const AAMIStandards = withErrorHandling(() => import("@/pages/aami-standards"));
const EUMDR = withErrorHandling(() => import("@/pages/eu-mdr"));

// Import DataCollectionCenter statically
// Note: This route is handled statically due to potential direct access needs,
// but the error handling wrapper could be applied if it were to be dynamically loaded.
import DataCollectionCenter from "./pages/data-collection-center";

// Simple Auth Hook
function useSimpleAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated");
    setIsAuthenticated(authStatus === "true");
    setIsLoading(false);
  }, []);

  const login = () => {
    localStorage.setItem("isAuthenticated", "true");
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("loginTime");
    setIsAuthenticated(false);
  };

  return { isAuthenticated, isLoading, login, logout };
}

function App() {
  const { isAuthenticated, isLoading, login } = useSimpleAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <LanguageProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Toaster />
              <Login onLogin={login} />
            </TooltipProvider>
          </QueryClientProvider>
        </LanguageProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <ResponsiveLayout>
              <React.Suspense fallback={
                <div className="flex items-center justify-center min-h-screen">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              }>
                <Switch>
                  <Route path="/" component={Dashboard} />
                  <Route path="/dashboard" component={Dashboard} />
                  <Route path="/analytics" component={Analytics} />
                  <Route path="/system-settings" component={SystemSettings} />

                  {/* Data Management */}
                  <Route path="/data-collection" component={DataCollection} />
                  {/* DataCollectionCenter is statically imported */}
                  <Route path="/data-collection-center" component={DataCollectionCenter} />
                  <Route path="/newsletter-admin" component={NewsletterAdmin} />
                  <Route path="/email-management" component={EmailManagement} />
                  <Route path="/knowledge-base" component={KnowledgeBase} />

                  {/* Compliance & Regulation */}
                  <Route path="/regulatory-updates" component={RegulatoryUpdates} />
                  <Route path="/rechtsprechung" component={RechtsprechungFixed} />
                  <Route path="/rechtsprechung-analyse" component={RechtsprechungAnalyse} />

                  {/* Stakeholder Dashboards */}
                  <Route path="/qm-dashboard" component={QMDashboard} />
                  <Route path="/dev-impact-dashboard" component={DevImpactDashboard} />
                  <Route path="/exec-dashboard" component={ExecDashboard} />

                  {/* Approvals & Registration */}
                  <Route path="/zulassungen/global" component={ZulassungenGlobal} />
                  <Route path="/zulassungen/laufende" component={LaufendeZulassungen} />

                  {/* Patents & AI Chat */}
                  <Route path="/patents" component={Patents} />
                  <Route path="/chat" component={ChatRag} />
        {/* Neutralisierte Assistent-Routen (vormals /ki-assistant/...) */}
        <Route path="/assistent/regulatory" component={KIAssistant1} />
        <Route path="/assistent/zulassungen" component={KIAssistant2} />
        <Route path="/assistent/projekte" component={KIAssistant3} />
        {/* Alte Legacy-Pfade vorerst weiter erreichbar für bestehende Deep Links */}
        <Route path="/ki-assistant/bereich-1" component={KIAssistant1} />
        <Route path="/ki-assistant/bereich-2" component={KIAssistant2} />
        <Route path="/ki-assistant/bereich-3" component={KIAssistant3} />

                  {/* Standards & Normen */}
                  <Route path="/iso-standards" component={ISOStandards} />
                  <Route path="/iec-standards" component={IECStandards} />
                  <Route path="/astm-standards" component={ASTMStandards} />
                  <Route path="/en-standards" component={ENStandards} />
                  <Route path="/aami-standards" component={AAMIStandards} />
                  <Route path="/eu-mdr" component={EUMDR} />

                  {/* Advanced */}
                  <Route path="/sync-manager" component={SyncManager} />
                  <Route path="/global-sources" component={GlobalSources} />
                  <Route path="/newsletter-manager" component={NewsletterManager} />
                  <Route path="/historical-data" component={HistoricalData} />
                  <Route path="/admin-customers" component={AdminCustomers} />
                  <Route path="/user-management" component={UserManagement} />
                  <Route path="/administration" component={Administration} />
                  <Route path="/audit-logs" component={AuditLogs} />
                  <Route path="/content-analysis" component={ContentAnalysis} />
                  <Route path="/analytics-insights" component={AnalyticsInsights} />
                  <Route path="/grip-integration" component={GripIntegration} />

                  {/* Customer Portal Routes */}
                  <Route path="/customer/dashboard" component={CustomerDashboard} />
                  <Route path="/customer/regulatory-updates" component={CustomerRegulatoryUpdates} />
                  <Route path="/customer/legal-cases" component={CustomerLegalCases} />
                  <Route path="/customer/knowledge-base" component={CustomerKnowledgeBase} />
                  <Route path="/customer/analytics" component={CustomerAnalytics} />
                  <Route path="/customer/insights" component={CustomerAIInsights} />
                  <Route path="/customer/newsletters" component={CustomerNewsletters} />
                  <Route path="/customer/settings" component={CustomerSettings} />
                  <Route path="/customer/data-collection" component={CustomerDataCollection} />
                  <Route path="/customer/global-sources" component={CustomerGlobalSources} />
                  <Route path="/customer/historical-data" component={CustomerHistoricalData} />

                  {/* Customer Areas */}
                  <Route path="/customer-areas" component={CustomerAreas} />
                  <Route path="/customer-area-1" component={CustomerArea1} />
                  <Route path="/customer-area-1/regulatory" component={RegulatoryUpdates} />
                  <Route path="/customer-area-1/rechtsprechung" component={RechtsprechungFixed} />
                  <Route path="/customer-area-2" component={CustomerArea2} />
                  <Route path="/customer-area-3/new-project" component={CustomerArea3NewProject} />
                  <Route path="/customer-area-3/projects" component={CustomerArea3Projects} />
                  <Route path="/customer-area-3/projektakte" component={CustomerArea3Projektakte} />
                  <Route path="/customer-area-3" component={CustomerArea3} />

                  <Route component={NotFound} />
                </Switch>
              </React.Suspense>
            </ResponsiveLayout>
          </TooltipProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
