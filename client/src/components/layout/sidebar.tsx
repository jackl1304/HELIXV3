import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  BarChart3,
  Database,
  Globe,
  FileText,
  Newspaper,
  CheckCircle,
  TrendingUp,
  Book,
  Users,
  Settings,
  Archive,
  Shield,
  Search,
  RefreshCw,
  Scale,
  FileSearch,
  ChevronDown,
  ChevronRight,
  Mail,
  BarChart,
  Target,
  Building,
  LogOut,
  Activity,
  UserCircle,
  Crown,
  Layers,
  MessageSquare,
  Brain
} from "@/components/icons";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/use-auth";

// Enhanced navigation structure with DELTA WAYS professional approach
interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  premium?: boolean;
  subItems?: NavigationItem[];
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
  defaultOpen?: boolean;
  hiddenItems?: NavigationItem[];
}

const getNavigationStructure = (t: (key: string) => string): Record<string, NavigationSection> => ({
  // 1. EXECUTIVE OVERVIEW
  overview: {
    title: t('nav.sections.overview'),
    items: [
      { name: t('nav.dashboard'), href: "/", icon: BarChart3 },
      { name: t('nav.analytics'), href: "/analytics", icon: TrendingUp, premium: true },
    ],
    defaultOpen: true
  },

  // 2. KUNDENBEREICHE ⭐ PROMINENT + Fach-Assistenten (neutral)
  customerAreas: {
    title: "🔷 Kundenbereiche",
    items: [
      {
        name: "Bereich 1 - Regulatory",
        href: "/customer-area-1",
        icon: Layers,
        badge: "Neu",
        subItems: [
          { name: "Regulatory Updates", href: "/customer-area-1/regulatory", icon: FileText },
          { name: "Rechtsprechung", href: "/customer-area-1/rechtsprechung", icon: Scale },
          { name: "Regulatory Assistent", href: "/assistent/regulatory", icon: Brain }
        ]
      },
      {
        name: "Bereich 2 - Zulassungen",
        href: "/customer-area-2",
        icon: Layers,
        badge: "Neu",
        subItems: [
          { name: "Globale Zulassungen", href: "/zulassungen/global", icon: Globe },
          { name: "Laufende Zulassungen", href: "/zulassungen/laufende", icon: CheckCircle },
          { name: "Zulassungs-Assistent", href: "/assistent/zulassungen", icon: Brain }
        ]
      },
      {
        name: "Bereich 3",
        href: "/customer-area-3",
        icon: Layers,
        badge: "Live",
        subItems: [
          { name: "Projektübersicht", href: "/customer-area-3/projects", icon: Target },
          { name: "Neue Projektakte", href: "/customer-area-3/new-project", icon: FileText },
          { name: "Projektakte (MDR)", href: "/customer-area-3/projektakte", icon: FileText, badge: "Live" },
          { name: "Formular-Assistent", href: "/customer-area-3/form-assistant", icon: CheckCircle },
          { name: "Global Patents", href: "/patents", icon: Globe },
          { name: "Patent Suche", href: "/patents-search", icon: Search },
          { name: "Projekt-Assistent", href: "/assistent/projekte", icon: Brain }
        ]
      },
    ],
    defaultOpen: true
  },

  // 3. STANDARDS & NORMEN
  standards: {
    title: "STANDARDS & NORMEN",
    items: [
      { name: "ISO Standards", href: "/iso-standards", icon: Shield },
      { name: "IEC Standards", href: "/iec-standards", icon: Shield },
      { name: "ASTM Standards", href: "/astm-standards", icon: FileSearch },
      { name: "EN Standards", href: "/en-standards", icon: Globe },
      { name: "AAMI Standards", href: "/aami-standards", icon: CheckCircle },
      { name: "EU MDR 2017/745", href: "/eu-mdr", icon: Scale }
    ],
    defaultOpen: false
  },

  // 4. PROFESSIONAL TOOLS (collapsible)
  advanced: {
    title: "Professional Tools",
    items: [
      { name: "Data Collection Center", href: "/data-collection-center", icon: Database, badge: "Live" },
      { name: t('nav.dataCollection'), href: "/data-collection", icon: Database },
      { name: t('nav.newsletterAdmin'), href: "/newsletter-admin", icon: Mail },
      { name: t('nav.emailManagement'), href: "/email-management", icon: Mail },
      { name: t('nav.knowledgeBase'), href: "/knowledge-base", icon: Book },
      { name: t('nav.syncManager'), href: "/sync-manager", icon: RefreshCw },
      { name: t('nav.globalSources'), href: "/global-sources", icon: Globe },
      { name: t('nav.newsletterManager'), href: "/newsletter-manager", icon: Newspaper },
      { name: t('nav.historicalData'), href: "/historical-data", icon: Archive },
      { name: t('nav.customerManagement'), href: "/admin-customers", icon: Building, premium: true },
      { name: t('nav.userManagement'), href: "/user-management", icon: Users, premium: true },
      { name: t('nav.systemAdmin'), href: "/administration", icon: Settings, premium: true },
      { name: t('nav.auditLogs'), href: "/audit-logs", icon: FileSearch, premium: true },
    ],
    defaultOpen: false,
    hiddenItems: [
      { name: "Erweiterte Auswertung", href: "/content-analysis", icon: BarChart },
      { name: "Markt & Insights", href: "/analytics-insights", icon: Target },
    ]
  }
});

// Professional search field component - Enhanced for better visibility
function ProfessionalSearchField() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/intelligent-search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Search className="h-5 w-5 text-[#1e40af]" />
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Intelligente Suche</h3>
      </div>
      <form onSubmit={handleSearch} className="relative group">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-[#1e40af] group-focus-within:text-[#7c3aed] transition-colors duration-200" />
        <Input
          type="text"
          placeholder="Suche nach Regulierungen, Devices, Zulassungen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-14 pr-4 py-5 bg-gradient-to-r from-white via-blue-50 to-purple-50 backdrop-blur-sm border-2 border-blue-300 rounded-xl text-base font-semibold text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-4 focus:ring-[#1e40af]/30 focus:border-[#7c3aed] hover:border-blue-400 hover:shadow-xl focus:shadow-2xl transition-all duration-200 shadow-lg"
          data-testid="sidebar-search-input"
        />
      </form>
      <p className="text-xs text-gray-500 italic">Drücken Sie Enter zum Suchen</p>
    </div>
  );
}

export function Sidebar() {
  const { t } = useLanguage();
  const [location] = useLocation();
  const { logout } = useAuth();
  const navigationStructure = getNavigationStructure(t);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    Object.entries(navigationStructure).forEach(([key, section]) => {
      initial[key] = section.defaultOpen || false;
    });
    return initial;
  });

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (href: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [href]: !prev[href]
    }));
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isActive = location === item.href || (item.subItems && item.subItems.some(sub => location === sub.href));
    const isExpanded = expandedItems[item.href];
    const IconComponent = item.icon;
    const hasSubItems = item.subItems && item.subItems.length > 0;

    return (
      <div key={item.href}>
        <Link
          to={item.href}
          className={cn(
            "flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 cursor-pointer group",
            isActive
              ? "bg-gradient-to-r from-[#1e40af] to-[#7c3aed] text-white shadow-lg shadow-blue-500/25"
              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
          )}
          onClick={(e) => {
            if (hasSubItems) {
              e.preventDefault();
              toggleItem(item.href);
            }
          }}
        >
          <div className="flex items-center">
            <IconComponent className={cn(
              "mr-3 h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110",
              isActive ? "text-white" : item.premium ? "text-[#7c3aed]" : "text-gray-500"
            )} />
            <span className="text-left font-medium">{item.name}</span>
          </div>

          {/* Badges and indicators */}
          <div className="flex items-center gap-2">
            {hasSubItems && (
              isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            )}
            {item.premium && (
              <Crown className="h-3 w-3 text-yellow-500" />
            )}
            {item.badge && (
              <span className={cn(
                "px-2 py-0.5 text-xs font-bold rounded-full",
                item.badge === 'Live' && "bg-green-100 text-green-700",
                item.badge === 'New' && "bg-blue-100 text-blue-700",
                item.badge === 'Neu' && "bg-blue-100 text-blue-700"
              )}>
                {item.badge}
              </span>
            )}
          </div>
        </Link>

        {/* Sub-items */}
        {hasSubItems && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.subItems!.map(subItem => {
              const subIsActive = location === subItem.href;
              const SubIcon = subItem.icon;

              return (
                <Link
                  key={subItem.href}
                  to={subItem.href}
                  className={cn(
                    "flex items-center px-4 py-2 ml-8 text-sm font-medium rounded-lg transition-all duration-200",
                    subIsActive
                      ? "bg-blue-50 text-blue-700 border-l-4 border-blue-500"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <SubIcon className="mr-2 h-4 w-4" />
                  <span>{subItem.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderHiddenItems = (hiddenItems: NavigationItem[]) => {
    return (
      <div className="flex justify-center space-x-3 py-4 border-t border-gray-100 mt-2">
        {hiddenItems.map((item) => {
          const isActive = location === item.href;
          const IconComponent = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 cursor-pointer group",
                isActive
                  ? "bg-gradient-to-r from-[#1e40af] to-[#7c3aed] text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-100 hover:text-[#1e40af] hover:shadow-md"
              )}
              title={item.name}
            >
              <IconComponent className="h-5 w-5 transition-transform group-hover:scale-110" />
            </Link>
          );
        })}
      </div>
    );
  };

  const renderNavigationSection = (sectionKey: string, section: NavigationSection) => {
    const isExpanded = expandedSections[sectionKey];
    const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

    return (
      <div key={sectionKey} className="mb-6">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center justify-between w-full px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-[#1e40af] transition-colors duration-200 text-left"
        >
          <span>{section.title}</span>
          <ChevronIcon className="h-4 w-4" />
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-1">
            {section.items.map(renderNavigationItem)}
            {section.hiddenItems && renderHiddenItems(section.hiddenItems)}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-80 bg-white/95 backdrop-blur-xl shadow-2xl z-50 overflow-y-auto border-r border-gray-100">
      {/* HELIX Header */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
        <Link to="/" className="block">
          <div className="flex flex-col items-center space-y-3">
            <img
              src="/helix-logo.jpg"
              alt="HELIX"
              className="w-48 h-48 object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
            />
            <div className="text-xs font-semibold text-slate-600">
              Powered by <span className="text-[#1a365d] font-bold">DELTA WAYS</span>
            </div>
          </div>
        </Link>

        {/* Customer Area Button - Professional Design */}
        <div className="mt-6">
          <Link to="/customer-dashboard">
            <button className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-[#1e40af] to-[#7c3aed] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:-translate-y-0.5">
              <UserCircle className="h-4 w-4 mr-2" />
              Customer Portal
            </button>
          </Link>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="mt-6 pb-8 flex-1 overflow-y-auto">
        <div className="px-2 space-y-2">
          {Object.entries(navigationStructure).map(([sectionKey, section]) =>
            renderNavigationSection(sectionKey, section)
          )}
        </div>
      </nav>

      {/* Professional Search - Extra Prominent */}
      <div className="p-5 border-y-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-purple-50 shadow-inner">
        <ProfessionalSearchField />
      </div>

      {/* Professional Deltaways Footer */}
      <div className="border-t border-slate-200 p-4 bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="text-xs space-y-3">
          {/* System Status */}
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium">System Status:</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full deltaways-animate-pulse shadow-sm"></div>
              <span className="text-emerald-600 font-semibold text-[11px] uppercase tracking-wide">Online</span>
            </div>
          </div>

          {/* Data Sources */}
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium">Data Sources:</span>
            <span className="text-[#1a365d] font-bold text-[11px] uppercase tracking-wide">21 Active</span>
          </div>

          {/* Deltaways Branding */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Powered by</span>
              <span className="text-[10px] font-bold bg-gradient-to-r from-[#1a365d] to-slate-700 bg-clip-text text-transparent uppercase tracking-wider">
                DELTAWAYS
              </span>
            </div>
          </div>
        </div>

        {/* Tenant Logout */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <button
            onClick={() => {
              logout();
              window.location.reload();
            }}
            className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span>System Logout</span>
          </button>
        </div>

        {/* DELTA WAYS Credit */}
        <div className="mt-3 pt-3 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400 font-medium">
            Engineered by <span className="text-[#1e40af] font-bold">DELTA WAYS</span>
          </p>
        </div>
      </div>
    </aside>
  );
}
