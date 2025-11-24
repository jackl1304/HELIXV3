import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Target,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  FileText,
  Calendar,
  ChevronRight,
  Sparkles
} from "@/components/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

interface Project {
  id: string;
  name: string;
  description: string;
  deviceType: string;
  deviceClass: string;
  status: string;
  riskLevel: string;
  priority: number;
  startDate: string;
  targetSubmissionDate: string;
  estimatedCostTotal: number;
  estimatedCostDevelopment: number;
  estimatedCostRegulatory: number;
  similarDevicesFound: any[];
  regulatoryRequirements: any[];
  createdAt: string;
}

export default function CustomerArea3Projects() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch projects from API
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Status badge colors
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: "bg-blue-100 text-blue-800",
      in_development: "bg-purple-100 text-purple-800",
      regulatory_review: "bg-yellow-100 text-yellow-800",
      testing: "bg-orange-100 text-orange-800",
      approval_pending: "bg-amber-100 text-amber-800",
      approved: "bg-green-100 text-green-800",
      on_hold: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Risk level badge colors
  const getRiskColor = (risk: string) => {
    const colors: Record<string, string> = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };
    return colors[risk] || "bg-gray-100 text-gray-800";
  };

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.deviceType?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: projects.length,
    inProgress: projects.filter((p) => p.status === "in_development").length,
    pending: projects.filter((p) => p.status === "approval_pending").length,
    approved: projects.filter((p) => p.status === "approved").length,
    totalCost: projects.reduce((sum, p) => sum + (p.estimatedCostTotal || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Developer & Engineer Bereich
              </h1>
              <p className="text-gray-600 text-lg">
                Intelligentes Projektakten-Management für MedTech-Entwicklung
              </p>
            </div>
            <Link href="/customer-area-3/new-project">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Neue Projektakte
              </Button>
            </Link>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Gesamt Projekte</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">In Entwicklung</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Zulassung Ausstehend</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Zugelassen</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-indigo-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Gesamt Kosten</p>
                    <p className="text-2xl font-bold text-gray-900">
                      €{(stats.totalCost / 1000).toFixed(0)}k
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Suche nach Projekten, Device-Typ, Beschreibung..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 border-2 focus:border-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border-2 rounded-lg focus:border-blue-500 bg-white"
            >
              <option value="all">Alle Status</option>
              <option value="planning">Planung</option>
              <option value="in_development">In Entwicklung</option>
              <option value="regulatory_review">Regulatorische Prüfung</option>
              <option value="testing">Testing</option>
              <option value="approval_pending">Zulassung Ausstehend</option>
              <option value="approved">Zugelassen</option>
            </select>
          </div>
        </div>

        {/* Projects List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Lade Projekte...</p>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Keine Projekte gefunden
              </h3>
              <p className="text-gray-500 mb-6">
                Starten Sie Ihr erstes Projekt mit KI-unterstützter Projektakten-Erstellung
              </p>
              <Link href="/customer-area-3/new-project">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Neue Projektakte erstellen
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-2xl">{project.name}</CardTitle>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace("_", " ").toUpperCase()}
                        </Badge>
                        <Badge className={getRiskColor(project.riskLevel)}>
                          {project.riskLevel.toUpperCase()} RISK
                        </Badge>
                      </div>
                      <CardDescription className="text-base">
                        {project.description}
                      </CardDescription>
                    </div>
                    <Link href={`/customer-area-3/projects/${project.id}`}>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Device-Typ</p>
                        <p className="font-semibold">{project.deviceType || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Klasse</p>
                        <p className="font-semibold">{project.deviceClass || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Ziel-Einreichung</p>
                        <p className="font-semibold">
                          {project.targetSubmissionDate
                            ? new Date(project.targetSubmissionDate).toLocaleDateString(
                                "de-DE"
                              )
                            : "TBD"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-sm text-gray-600">Geschätzte Kosten</p>
                        <p className="font-semibold">
                          €{((project.estimatedCostTotal || 0) / 1000).toFixed(0)}k
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AI Insights */}
                  {project.similarDevicesFound &&
                    project.similarDevicesFound.length > 0 && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-5 w-5 text-purple-600" />
                          <p className="font-semibold text-gray-900">
                            Insights: {project.similarDevicesFound.length} ähnliche Devices gefunden
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">
                          Automatische Kostenanalyse und Anforderungen wurden generiert
                        </p>
                      </div>
                    )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
