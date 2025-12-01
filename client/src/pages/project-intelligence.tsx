import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Users,
  FileText,
  Lightbulb,
  BarChart3,
  Calendar,
  Shield,
  Zap
} from "lucide-react";
import AIAssistant from "@/components/AIAssistant";

interface ProjectIntelligence {
  projectId: string;
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
  };
  timelineAnalysis: {
    estimated: string;
    similarProjects: number;
    bottlenecks: string[];
  };
  competitiveAnalysis: {
    relevantPatents: any[];
    marketTrends: any[];
  };
  recommendations: string[];
}

interface ComplianceReport {
  deviceType: string;
  region: string;
  complianceStatus: 'compliant' | 'requires_review' | 'non_compliant';
  relevantUpdates: any[];
  relevantLegalCases: any[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  nextReviewDate: string;
}

export default function ProjectIntelligence() {
  const [intelligence, setIntelligence] = useState<ProjectIntelligence | null>(null);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Beispiel-Projektdaten (würde normalerweise aus der Datenbank kommen)
  const sampleProject = {
    id: "proj-001",
    name: "CardioMonitor Pro",
    device_type: "cardiovascular_monitor",
    therapeutic_area: "cardiology",
    risk_level: "medium",
    estimated_approval_date: "2025-06-15",
    status: "development"
  };

  useEffect(() => {
    loadIntelligence();
    loadComplianceReport();
    loadInsights();
  }, []);

  const loadIntelligence = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/project-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectData: sampleProject,
          regulatoryPathway: 'CE_MDR'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIntelligence(data.intelligence);
      }
    } catch (error) {
      console.error('Intelligence loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComplianceReport = async () => {
    try {
      const response = await fetch('/api/ai/compliance-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceType: 'cardiovascular_monitor',
          region: 'EU',
          requirements: ['MDR_2017_745', 'ISO_13485']
        })
      });

      if (response.ok) {
        const data = await response.json();
        setComplianceReport(data.report);
      }
    } catch (error) {
      console.error('Compliance report loading error:', error);
    }
  };

  const loadInsights = async () => {
    try {
      const response = await fetch('/api/ai/insights?category=projects&limit=5');
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights);
      }
    } catch (error) {
      console.error('Insights loading error:', error);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <CheckCircle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Brain className="w-8 h-8 text-blue-600" />
              Projekt-Intelligenz & Compliance
            </h1>
            <p className="text-gray-600 mt-2">
              KI-gestützte Analyse und Handlungsempfehlungen für Medizinprodukte-Projekte
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            Helix AI v2.0
          </Badge>
        </div>

        <Tabs defaultValue="intelligence" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="intelligence">Projekt-Intelligenz</TabsTrigger>
            <TabsTrigger value="compliance">Compliance-Analyse</TabsTrigger>
            <TabsTrigger value="insights">KI-Insights</TabsTrigger>
            <TabsTrigger value="documents">Dokumente & Vorlagen</TabsTrigger>
          </TabsList>

          {/* Projekt-Intelligenz */}
          <TabsContent value="intelligence" className="space-y-6">
            {intelligence && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Risikoanalyse */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Risikoanalyse
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      {getRiskIcon(intelligence.riskAssessment.level)}
                      <span className={`font-medium capitalize ${getRiskColor(intelligence.riskAssessment.level)}`}>
                        {intelligence.riskAssessment.level} Risiko
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Risikofaktoren:</h4>
                      <ul className="space-y-1">
                        {intelligence.riskAssessment.factors.map((factor, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="w-3 h-3 text-orange-500" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline-Analyse */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Timeline-Analyse
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">
                        Geschätzter Abschluss: {new Date(intelligence.timelineAnalysis.estimated).toLocaleDateString('de-DE')}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Potenzielle Engpässe:</h4>
                      <ul className="space-y-1">
                        {intelligence.timelineAnalysis.bottlenecks.map((bottleneck, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            <Clock className="w-3 h-3 text-yellow-500" />
                            {bottleneck}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="text-sm text-gray-600">
                      Ähnliche Projekte in Datenbank: {intelligence.timelineAnalysis.similarProjects}
                    </div>
                  </CardContent>
                </Card>

                {/* Wettbewerbsanalyse */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Wettbewerbsanalyse
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Relevante Patente:</h4>
                        <div className="space-y-2">
                          {intelligence.competitiveAnalysis.relevantPatents.slice(0, 3).map((patent: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              <FileText className="w-4 h-4 text-blue-500" />
                              <span className="text-sm truncate">{patent.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Marktentwicklungen:</h4>
                        <div className="space-y-2">
                          {intelligence.competitiveAnalysis.marketTrends.slice(0, 3).map((trend: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <span className="text-sm truncate">{trend.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Empfehlungen */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5" />
                      KI-Empfehlungen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {intelligence.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Compliance-Analyse */}
          <TabsContent value="compliance" className="space-y-6">
            {complianceReport && (
              <div className="space-y-6">
                {/* Compliance-Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Compliance-Status: {complianceReport.deviceType} ({complianceReport.region})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Badge variant={
                        complianceReport.complianceStatus === 'compliant' ? 'default' :
                        complianceReport.complianceStatus === 'requires_review' ? 'secondary' : 'destructive'
                      }>
                        {complianceReport.complianceStatus === 'compliant' ? 'Konform' :
                         complianceReport.complianceStatus === 'requires_review' ? 'Überprüfung erforderlich' : 'Nicht konform'}
                      </Badge>

                      <Badge variant="outline" className={getRiskColor(complianceReport.riskLevel)}>
                        {complianceReport.riskLevel} Risiko
                      </Badge>

                      <span className="text-sm text-gray-600">
                        Nächste Überprüfung: {new Date(complianceReport.nextReviewDate).toLocaleDateString('de-DE')}
                      </span>
                    </div>

                    <Progress
                      value={complianceReport.complianceStatus === 'compliant' ? 100 :
                             complianceReport.complianceStatus === 'requires_review' ? 75 : 25}
                      className="w-full"
                    />
                  </CardContent>
                </Card>

                {/* Relevante Updates */}
                <Card>
                  <CardHeader>
                    <CardTitle>Relevante Regulatorische Updates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {complianceReport.relevantUpdates.slice(0, 5).map((update: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{update.title}</h4>
                            <p className="text-xs text-gray-600">
                              {update.jurisdiction} • {new Date(update.published_date).toLocaleDateString('de-DE')}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {update.category}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Empfehlungen */}
                <Card>
                  <CardHeader>
                    <CardTitle>Compliance-Empfehlungen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {complianceReport.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* KI-Insights */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {insights.map((insight, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      {insight.type === 'trend' && <TrendingUp className="w-4 h-4" />}
                      {insight.type === 'risk' && <AlertTriangle className="w-4 h-4" />}
                      {insight.type === 'innovation' && <Lightbulb className="w-4 h-4" />}
                      {insight.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">{insight.description}</p>

                    {insight.recommendations && (
                      <div className="space-y-1">
                        <h4 className="font-medium text-xs">Empfehlungen:</h4>
                        <ul className="text-xs space-y-1">
                          {insight.recommendations.slice(0, 2).map((rec: string, recIdx: number) => (
                            <li key={recIdx} className="flex items-start gap-1">
                              <span className="text-blue-500">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Badge variant="outline" className="text-xs w-fit">
                      {insight.priority} Priorität
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Dokumente & Vorlagen */}
          <TabsContent value="documents" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: 'CE-Kennzeichnungsplan',
                  description: 'Vollständiger Plan für CE-Kennzeichnung nach MDR',
                  type: 'regulatory_plan',
                  icon: FileText
                },
                {
                  title: 'Risikomanagement-Bericht',
                  description: 'ISO 14971 konformer Risikomanagement-Bericht',
                  type: 'risk_report',
                  icon: Shield
                },
                {
                  title: 'Klinische Evaluierung',
                  description: 'Dokumentation für klinische Bewertung',
                  type: 'clinical_evaluation',
                  icon: Users
                },
                {
                  title: 'Technische Dokumentation',
                  description: 'Vollständige technische Unterlagen',
                  type: 'technical_docs',
                  icon: Zap
                },
                {
                  title: 'Post-Market Surveillance Plan',
                  description: 'Plan für Marktüberwachung nach Inverkehrbringen',
                  type: 'pms_plan',
                  icon: BarChart3
                },
                {
                  title: 'Validierung & Verifizierung',
                  description: 'Protokolle für V&V Aktivitäten',
                  type: 'validation_plan',
                  icon: CheckCircle
                }
              ].map((doc, idx) => (
                <Card key={idx} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <doc.icon className="w-4 h-4" />
                      {doc.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-600 mb-3">{doc.description}</p>
                    <Button size="sm" className="w-full">
                      Mit KI generieren
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Alle Dokumente werden KI-gestützt generiert und basieren auf aktuellen regulatorischen Anforderungen.
                Bitte überprüfen Sie alle generierten Dokumente vor der Verwendung.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        {/* KI-Assistent */}
        <AIAssistant
          context={{
            currentPage: 'project-intelligence',
            userId: 'demo-user',
            tenantId: 'demo-tenant'
          }}
          className="fixed bottom-4 right-4"
        />
      </div>
    </div>
  );
}
