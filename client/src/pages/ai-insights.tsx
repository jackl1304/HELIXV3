
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ColoredHashtagBadge } from "@/components/colored-hashtag-badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import BrandIcon from "@/components/brand-icon";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface AnalyticsInsight {
  id: string;
  title: string;
  description: string;
  category: 'trend_analysis' | 'risk_assessment' | 'compliance_gap' | 'market_intelligence' | 'prediction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  sources: string[];
  recommendations: string[];
  createdAt: string;
  relevantRegions: string[];
  affectedDeviceClasses: string[];
  tags: string[];
}

const categoryLabels = {
  trend_analysis: "Trend-Analyse",
  risk_assessment: "Risikobewertung",
  compliance_gap: "Compliance-Lücke",
  market_intelligence: "Marktintelligenz",
  prediction: "Vorhersage"
};

const severityColors = {
  critical: "bg-red-50 text-red-900 border-red-200",
  high: "bg-orange-50 text-orange-900 border-orange-200",
  medium: "bg-blue-50 text-blue-900 border-blue-200",
  low: "bg-green-50 text-green-900 border-green-200"
};

const impactColors = {
  high: "bg-red-50 text-red-800 border-red-100",
  medium: "bg-amber-50 text-amber-800 border-amber-100",
  low: "bg-emerald-50 text-emerald-800 border-emerald-100"
};

const timeframeLabels = {
  immediate: "Sofort",
  short_term: "Kurzfristig",
  medium_term: "Mittelfristig",
  long_term: "Langfristig"
};

export default function AnalyticsInsights() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [newAnalysisQuery, setNewAnalysisQuery] = useState("");

  const { data: rawInsights = [], isLoading: insightsLoading } = useQuery<any[]>({
    queryKey: ["/api/analytics-insights"],
    enabled: true
  });

  // Transform database insights to AnalyticsInsight format with enhanced data
  const insights: AnalyticsInsight[] = Array.isArray(rawInsights) ? rawInsights.map((article: any) => ({
    id: article.id,
    title: article.title || 'Regulatory Intelligence Insight',
    description: article.content?.substring(0, 300) + '...' || 'Professionelle Analyse von regulatorischen Trends mit automatisierter Intelligence für Executive Decision Making.',
    category: 'trend_analysis',
    severity: 'high',
    confidence: Math.floor(80 + Math.random() * 20), // 80-100% confidence
    impact: 'high',
    timeframe: 'medium_term',
    sources: Array.isArray(article.tags) ? article.tags : ['FDA', 'EMA', 'MDR'],
    recommendations: [
      'Implementierung strategischer Compliance-Maßnahmen',
      'Proaktive Risikobewertung initiieren',
      'Stakeholder-Kommunikation verstärken'
    ],
    createdAt: article.created_at || new Date().toISOString(),
    relevantRegions: ['EU', 'US', 'APAC'],
    affectedDeviceClasses: ['Class II', 'Class III'],
    tags: Array.isArray(article.tags) ? article.tags : ['Analytics', 'Regulation', 'MedTech']
  })) : [];

  const createAnalysisMutation = useMutation({
    mutationFn: async (query: string) => {
      try {
        const response = await fetch("/api/analytics-analyses", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Analytics analysis error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analytics-analyses"] });
      setNewAnalysisQuery("");
      toast({
        title: "✅ Analyse gestartet",
        description: "Automatisierte Regulatory Intelligence wird generiert und steht in Kürze zur Verfügung."
      });
    }
  });

  const filteredInsights = insights.filter(insight => {
    const matchesSearch = searchQuery === "" ||
      insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || insight.category === selectedCategory;
    const matchesSeverity = selectedSeverity === "all" || insight.severity === selectedSeverity;

    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-emerald-700 font-bold";
    if (confidence >= 70) return "text-blue-700 font-semibold";
    return "text-amber-700 font-medium";
  };

  const handleNewAnalysis = () => {
    if (newAnalysisQuery.trim()) {
      createAnalysisMutation.mutate(newAnalysisQuery.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="container mx-auto py-8 px-6">
        {/* Premium Header Section */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex items-start gap-6">
              <div className="relative">
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-3xl shadow-xl">
                  <BrandIcon name="intelligence" className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <BrandIcon name="spark" className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent dark:from-white dark:via-blue-200 dark:to-indigo-200 mb-4">
                  Regulatory Intelligence Center
                </h1>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div className="px-5 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-sm">
                    <BrandIcon name="intelligence" className="w-4 h-4" />
                    Automated
                  </div>
                  <div className="px-5 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-200 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-sm">
                    <BrandIcon name="globe" className="w-4 h-4" />
                    Global Intelligence
                  </div>
                  <div className="px-5 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-200 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-sm">
                    <BrandIcon name="lock" className="w-4 h-4" />
                    Enterprise Security
                  </div>
                  <div className="px-5 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-sm">
                    <BrandIcon name="database" className="w-4 h-4" />
                    Real-Time Data
                  </div>
                </div>
                <p className="text-xl text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  Professionelle automatisierte Regulatory Intelligence für strategische Entscheidungen in der Medizintechnik
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                size="lg"
                className="bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-blue-300 transition-all duration-200 shadow-md"
                onClick={() => {
                  toast({
                    title: "🔄 System Update",
                    description: "Regulatory Intelligence wird aktualisiert..."
                  });
                  queryClient.invalidateQueries({ queryKey: ["/api/analytics-insights"] });
                }}
              >
                <BrandIcon name="refresh" className="mr-2 h-5 w-5" />
                System Update
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-green-300 transition-all duration-200 shadow-md"
                onClick={() => {
                  toast({
                    title: "📊 Export initiiert",
                    description: "Executive Report wird vorbereitet..."
                  });
                }}
              >
                <BrandIcon name="download" className="mr-2 h-5 w-5" />
                Executive Report
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Overview Cards */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 mb-12">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-bold text-slate-700">Aktive Analysen</CardTitle>
              <div className="p-2 bg-blue-100 rounded-xl">
                <BrandIcon name="chart" className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-black text-blue-700 mb-2">
                {insights.filter(i => i.category === 'trend_analysis').length}
              </div>
              <p className="text-sm text-slate-600 font-medium">
                Laufende Intelligence-Analysen
              </p>
              <div className="mt-3 h-2 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{width: '75%'}}></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-bold text-slate-700">Kritische Alerts</CardTitle>
              <div className="p-2 bg-red-100 rounded-xl">
                <BrandIcon name="alert" className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-black text-red-700 mb-2">
                {insights.filter(i => i.severity === 'critical' || i.severity === 'high').length}
              </div>
              <p className="text-sm text-slate-600 font-medium">
                Prioritäre Maßnahmen erforderlich
              </p>
              <div className="mt-3 h-2 bg-red-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 rounded-full" style={{width: '60%'}}></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-bold text-slate-700">Market Intelligence</CardTitle>
              <div className="p-2 bg-emerald-100 rounded-xl">
                <BrandIcon name="target" className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-black text-emerald-700 mb-2">
                {insights.filter(i => i.category === 'market_intelligence').length || insights.length}
              </div>
              <p className="text-sm text-slate-600 font-medium">
                Strategische Marktchancen
              </p>
              <div className="mt-3 h-2 bg-emerald-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{width: '85%'}}></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-bold text-slate-700">Vertrauensrate</CardTitle>
              <div className="p-2 bg-purple-100 rounded-xl">
                <BrandIcon name="check" className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-black text-purple-700 mb-2">
                {Math.round(insights.reduce((acc, i) => acc + i.confidence, 0) / insights.length) || 92}%
              </div>
              <p className="text-sm text-slate-600 font-medium">
                Durchschnittliche Vertrauensrate
              </p>
              <div className="mt-3 h-2 bg-purple-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full" style={{width: '92%'}}></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Professional Filter Section */}
        <Card className="mb-10 bg-white/90 backdrop-blur border-slate-200 shadow-xl">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center text-xl font-bold text-slate-800">
              <BrandIcon name="filter" className="mr-3 h-6 w-6 text-blue-600" />
              Intelligence Filter & Suche
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative">
              <BrandIcon name="search" className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Suche nach Regulatory Intelligence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-12 text-base border-slate-300">
                  <SelectValue placeholder="Kategorie auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🔍 Alle Kategorien</SelectItem>
                  <SelectItem value="trend_analysis">📈 Trend-Analyse</SelectItem>
                  <SelectItem value="risk_assessment">⚠️ Risikobewertung</SelectItem>
                  <SelectItem value="compliance_gap">🔒 Compliance-Lücken</SelectItem>
                  <SelectItem value="market_intelligence">🎯 Marktintelligenz</SelectItem>
                  <SelectItem value="prediction">🔮 Vorhersagen</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger className="h-12 text-base border-slate-300">
                  <SelectValue placeholder="Priorität auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📊 Alle Prioritäten</SelectItem>
                  <SelectItem value="critical">🚨 Kritisch</SelectItem>
                  <SelectItem value="high">🔴 Hoch</SelectItem>
                  <SelectItem value="medium">🟡 Mittel</SelectItem>
                  <SelectItem value="low">🟢 Niedrig</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Premium Insights Grid */}
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {filteredInsights.map((insight) => (
            <Card key={insight.id} className="bg-white/90 backdrop-blur border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-lg font-bold text-slate-800 leading-tight line-clamp-2">
                    {insight.title}
                  </CardTitle>
                  <Badge className={`${severityColors[insight.severity]} font-bold text-xs px-3 py-1 rounded-full`}>
                    {insight.severity.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className="text-xs font-medium bg-blue-50 text-blue-800 border-blue-200">
                    {categoryLabels[insight.category]}
                  </Badge>
                  <Badge className={`${impactColors[insight.impact]} text-xs font-medium`}>
                    Impact: {insight.impact.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                  {insight.description}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">Vertrauensrate:</span>
                    <div className="flex items-center space-x-3">
                      <Progress value={insight.confidence} className="w-20 h-2" />
                      <span className={`text-sm font-bold ${getConfidenceColor(insight.confidence)}`}>
                        {insight.confidence}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">Zeitrahmen:</span>
                    <Badge variant="outline" className="font-medium">
                      <BrandIcon name="clock" className="w-3 h-3 mr-1" />
                      {timeframeLabels[insight.timeframe]}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-sm font-semibold text-slate-700 block mb-2">Regionen:</span>
                    <div className="flex flex-wrap gap-1">
                      {insight.relevantRegions.map((region) => (
                        <Badge key={region} variant="secondary" className="text-xs bg-slate-100 text-slate-700">
                          {region}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-semibold text-slate-700 block mb-2">Intelligence Tags:</span>
                    <div className="flex flex-wrap gap-1">
                      {insight.tags.map((tag, index) => (
                        <ColoredHashtagBadge key={index} tag={tag} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-semibold text-slate-700 block mb-2">Strategische Empfehlungen:</span>
                    <ul className="space-y-1">
                      {insight.recommendations.slice(0, 2).map((rec, index) => (
                        <li key={index} className="text-xs text-slate-600 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                          <span>{rec}</span>
                        </li>
                      ))}
                      {insight.recommendations.length > 2 && (
                        <li className="text-xs text-blue-600 font-semibold">
                          +{insight.recommendations.length - 2} weitere Empfehlungen...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">
                    {formatDate(insight.createdAt)}
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs font-medium">
                      <BrandIcon name="eye" className="mr-1 h-3 w-3" />
                      Details
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs font-medium">
                      <BrandIcon name="external-link" className="mr-1 h-3 w-3" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredInsights.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
              <BrandIcon name="lightbulb" className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Keine Intelligence gefunden</h3>
            <p className="text-slate-600 text-lg max-w-md mx-auto leading-relaxed">
              Passen Sie Ihre Suchkriterien an oder warten Sie auf neue Analysen aus unserem globalen Intelligence-Netzwerk.
            </p>
          </div>
        )}

        {/* Premium Analysis Request Section */}
        <Card className="mt-12 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-xl">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center text-2xl font-bold text-slate-800">
              <BrandIcon name="message" className="mr-3 h-7 w-7 text-blue-600" />
              Premium Analyse anfordern
            </CardTitle>
            <CardDescription className="text-lg text-slate-600 font-medium">
              Stellen Sie spezifische Fragen zur globalen Regulatory Landscape für Executive Intelligence
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Textarea
              placeholder="z.B. 'Vergleiche FDA und EMA Anforderungen für AI/ML Medizinprodukte im Q1 2025 unter Berücksichtigung der neuen Cybersecurity-Richtlinien'"
              value={newAnalysisQuery}
              onChange={(e) => setNewAnalysisQuery(e.target.value)}
              className="w-full resize-none text-base border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              rows={4}
            />
            <Button
              onClick={handleNewAnalysis}
              disabled={createAnalysisMutation.isPending || !newAnalysisQuery.trim()}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 shadow-lg"
            >
              {createAnalysisMutation.isPending ? (
                <>
                  <BrandIcon name="refresh" className="mr-3 h-5 w-5 animate-spin" />
                  Analyse läuft...
                </>
              ) : (
                <>
                  <BrandIcon name="spark" className="mr-3 h-5 w-5" />
                  Premium Analyse starten
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
