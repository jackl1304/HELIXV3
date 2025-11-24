import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  Calendar,
  Globe,
  Filter,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  AlertCircle,
  Scale,
  Briefcase,
  CheckCircle2,
  Clock,
  Building2,
  RefreshCw
} from "@/components/icons";

interface RegulatoryUpdate {
  id: string;
  title: string;
  description: string;
  full_content?: string;
  source_id: string;
  source_name?: string;
  source_url?: string;
  jurisdiction?: string;
  document_type?: string;
  reference_number?: string;
  status?: string;
  published_date?: string;
  created_at?: string;
  url?: string;
  metadata?: {
    formatted?: {
      actionable_insights?: string[];
      risk_category?: string;
      affected_sectors?: string[];
    };
  };
}

/**
 * Professional Regulatory Intelligence Dashboard
 * Displays comprehensive data from 110+ global sources
 */
export default function RegulatoryIntelligence() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>("all");
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [expandedUpdate, setExpandedUpdate] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  
  // Fetch all regulatory updates
  const { data: updates = [], isLoading } = useQuery<RegulatoryUpdate[]>({
    queryKey: ["/api/regulatory-updates"],
  });
  
  // Trigger data collection
  const syncMutation = useMutation({
    mutationFn: async (type?: string) => {
      const endpoint = type 
        ? `/api/data-collection/sync-by-type`
        : `/api/data-collection/sync-all`;
      
      const body = type ? { type } : {};
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) throw new Error('Sync failed');
      return response.json();
    },
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/regulatory-updates"] });
      }, 5000); // Refresh after 5 seconds
    }
  });
  
  // Calculate source type from source_id
  const getSourceType = (sourceId: string): string => {
    if (sourceId.startsWith('fda_') || sourceId.startsWith('ema_') || sourceId.startsWith('mhra_') || sourceId.startsWith('tga_')) {
      return 'regulatory';
    }
    if (sourceId.includes('patent') || sourceId.startsWith('uspto') || sourceId.startsWith('epo') || sourceId.startsWith('wipo')) {
      return 'patents';
    }
    if (sourceId.includes('court') || sourceId.includes('legal') || sourceId.startsWith('pacer') || sourceId.startsWith('bailii')) {
      return 'legal';
    }
    if (sourceId.includes('iso') || sourceId.includes('iec') || sourceId.includes('astm') || sourceId.includes('standards')) {
      return 'standards';
    }
    if (sourceId.includes('safety') || sourceId.includes('recall') || sourceId.includes('rapex')) {
      return 'safety';
    }
    return 'other';
  };
  
  // Filtered and sorted updates
  const filteredUpdates = useMemo(() => {
    return updates.filter((update) => {
      const matchesSearch = 
        update.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        update.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        update.reference_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        update.source_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const sourceType = getSourceType(update.source_id);
      const matchesType = sourceTypeFilter === "all" || sourceType === sourceTypeFilter;
      
      const matchesJurisdiction = jurisdictionFilter === "all" || update.jurisdiction === jurisdictionFilter;
      
      const riskCategory = update.metadata?.formatted?.risk_category || 'Low';
      const matchesRisk = riskFilter === "all" || riskCategory === riskFilter;
      
      return matchesSearch && matchesType && matchesJurisdiction && matchesRisk;
    }).sort((a, b) => {
      const dateA = new Date(a.published_date || a.created_at || 0).getTime();
      const dateB = new Date(b.published_date || b.created_at || 0).getTime();
      return dateB - dateA; // Most recent first
    });
  }, [updates, searchQuery, sourceTypeFilter, jurisdictionFilter, riskFilter]);
  
  // Extract unique jurisdictions
  const jurisdictions = useMemo(() => {
    const unique = new Set(updates.map(u => u.jurisdiction).filter(Boolean));
    return Array.from(unique).sort();
  }, [updates]);
  
  // Statistics
  const stats = useMemo(() => {
    const now = Date.now();
    const last24h = updates.filter(u => {
      const date = new Date(u.published_date || u.created_at || 0).getTime();
      return (now - date) < 24 * 60 * 60 * 1000;
    }).length;
    
    const last7d = updates.filter(u => {
      const date = new Date(u.published_date || u.created_at || 0).getTime();
      return (now - date) < 7 * 24 * 60 * 60 * 1000;
    }).length;
    
    const byType = {
      regulatory: 0,
      patents: 0,
      legal: 0,
      standards: 0,
      safety: 0,
      other: 0
    };
    
    updates.forEach(u => {
      const type = getSourceType(u.source_id);
      byType[type as keyof typeof byType]++;
    });
    
    return { total: updates.length, last24h, last7d, byType };
  }, [updates]);
  
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  const isNew = (publishedDate?: string, createdAt?: string) => {
    const date = new Date(publishedDate || createdAt || 0);
    const now = new Date();
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  };
  
  const getTypeIcon = (sourceId: string) => {
    const type = getSourceType(sourceId);
    switch (type) {
      case 'regulatory': return <Building2 className="w-4 h-4" />;
      case 'patents': return <FileText className="w-4 h-4" />;
      case 'legal': return <Scale className="w-4 h-4" />;
      case 'standards': return <CheckCircle2 className="w-4 h-4" />;
      case 'safety': return <AlertTriangle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };
  
  const getTypeName = (sourceId: string) => {
    const type = getSourceType(sourceId);
    const names: Record<string, string> = {
      regulatory: 'Regulatory',
      patents: 'Patent',
      legal: 'Legal',
      standards: 'Standard',
      safety: 'Safety Alert',
      other: 'General'
    };
    return names[type] || 'Update';
  };
  
  const getRiskBadgeColor = (risk?: string) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading regulatory intelligence...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Regulatory Intelligence</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive monitoring across 110+ global data sources
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate('regulatory')}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Sync Regulatory
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate('patents')}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Sync Patents
          </Button>
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Sync All Sources
          </Button>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all sources
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last 24 Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.last24h}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Recent additions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Regulatory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byType.regulatory}</div>
            <p className="text-xs text-muted-foreground mt-1">
              FDA, EMA, Notified Bodies
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Patents & IP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byType.patents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              USPTO, EPO, WIPO
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Legal Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byType.legal}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Court decisions
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search by title, reference number, source..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Source Type</label>
              <Select value={sourceTypeFilter} onValueChange={setSourceTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="regulatory">Regulatory</SelectItem>
                  <SelectItem value="patents">Patents</SelectItem>
                  <SelectItem value="legal">Legal Cases</SelectItem>
                  <SelectItem value="standards">Standards</SelectItem>
                  <SelectItem value="safety">Safety Alerts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Jurisdiction</label>
              <Select value={jurisdictionFilter} onValueChange={setJurisdictionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jurisdictions</SelectItem>
                  {jurisdictions.map(j => (
                    <SelectItem key={j} value={j}>{j}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Risk Level</label>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Updates List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Showing {filteredUpdates.length} of {updates.length} updates
          </p>
        </div>
        
        {filteredUpdates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No updates found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your filters or sync new data from sources
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredUpdates.map((update) => {
            const isExpanded = expandedUpdate === update.id;
            const riskCategory = update.metadata?.formatted?.risk_category;
            const sectors = update.metadata?.formatted?.affected_sectors || [];
            const insights = update.metadata?.formatted?.actionable_insights || [];
            
            return (
              <Card key={update.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTypeIcon(update.source_id)}
                        <Badge variant="outline">{getTypeName(update.source_id)}</Badge>
                        {isNew(update.published_date, update.created_at) && (
                          <Badge>Neu</Badge>
                        )}
                        {riskCategory && (
                          <Badge variant={getRiskBadgeColor(riskCategory)}>
                            {riskCategory} Risk
                          </Badge>
                        )}
                        {update.reference_number && (
                          <Badge variant="secondary">{update.reference_number}</Badge>
                        )}
                      </div>
                      
                      <CardTitle className="text-xl mb-2">{update.title}</CardTitle>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          <span>{update.source_name || update.source_id}</span>
                        </div>
                        {update.jurisdiction && (
                          <div className="flex items-center gap-1">
                            <Globe className="w-4 h-4" />
                            <span>{update.jurisdiction}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(update.published_date || update.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {update.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(update.url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedUpdate(isExpanded ? null : update.id)}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm mb-4">{update.description}</p>
                  
                  {sectors.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-xs font-medium text-muted-foreground">Affected Sectors:</span>
                      {sectors.map((sector, idx) => (
                        <Badge key={idx} variant="secondary">{sector}</Badge>
                      ))}
                    </div>
                  )}
                  
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      {update.full_content && (
                        <div className="prose prose-sm max-w-none">
                          <h4 className="font-semibold">Technical Details</h4>
                          <div className="whitespace-pre-wrap text-sm">{update.full_content}</div>
                        </div>
                      )}
                      
                      {insights.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Actionable Insights</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {insights.map((insight, idx) => (
                              <li key={idx}>{insight}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {update.document_type && (
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4" />
                          <span className="font-medium">Document Type:</span>
                          <span>{update.document_type}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
