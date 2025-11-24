import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  Sparkles,
  AlertCircle,
  FileText,
  Target,
  TrendingUp
} from "@/components/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface RegulatoryPathway {
  id: string;
  name: string;
  type: string;
  jurisdiction: string;
  average_cost_usd: number;
  average_timeline_months: number;
  min_timeline_months: number;
  max_timeline_months: number;
  description: string;
  key_requirements: string[];
  standard_phases: any;
  applicable_device_classes: string[];
  risk_level: string;
  source: string;
  last_updated: string;
  created_at: string;
}

export default function CustomerArea3NewProject() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    deviceType: "",
    deviceClass: "Class II",
    riskLevel: "medium",
    priority: 2,
    selectedPathwayId: ""
  });

  // Fetch regulatory pathways with real benchmark data
  const { data: pathways = [], isLoading: loadingPathways } = useQuery<RegulatoryPathway[]>({
    queryKey: ["/api/regulatory-pathways"],
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create project");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Projekt erfolgreich erstellt!",
        description: `${formData.name} wurde mit automatisch generierten Phasen erstellt.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setLocation(`/customer-area-3/projects/${data.project.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Fehler beim Erstellen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.deviceType || !formData.selectedPathwayId) {
      toast({
        title: "⚠️ Pflichtfelder fehlen",
        description: "Bitte füllen Sie alle erforderlichen Felder aus.",
        variant: "destructive",
      });
      return;
    }

    createProjectMutation.mutate({
      ...formData,
      regulatoryPathwayId: formData.selectedPathwayId,
      status: "planning",
      startDate: new Date().toISOString(),
    });
  };

  // Get selected pathway details
  const selectedPathway = pathways.find(p => p.id === formData.selectedPathwayId);

  // Filter pathways by device class
  const relevantPathways = pathways.filter(p => 
    p.applicable_device_classes?.includes(formData.deviceClass) ||
    p.applicable_device_classes?.includes("all")
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/customer-area-3/projects")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Projekten
          </Button>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Neues Entwicklungsprojekt
          </h1>
          <p className="text-gray-600 text-lg">
            Erstellen Sie ein neues Projekt mit intelligenter Kosten- und Zeitschätzung basierend auf echten Benchmark-Daten
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Basic Information */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Projekt-Grunddaten
              </CardTitle>
              <CardDescription>
                Geben Sie die grundlegenden Informationen zu Ihrem MedTech-Projekt ein
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Projektname *</Label>
                  <Input
                    id="name"
                    placeholder="z.B. Kardiovaskuläres Monitoring System"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deviceType">Device-Typ *</Label>
                  <Input
                    id="deviceType"
                    placeholder="z.B. Continuous Glucose Monitor"
                    value={formData.deviceType}
                    onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <textarea
                  id="description"
                  placeholder="Detaillierte Beschreibung des Projekts und der geplanten Funktionalität..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full min-h-[100px] px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deviceClass">Device-Klasse</Label>
                  <select
                    id="deviceClass"
                    value={formData.deviceClass}
                    onChange={(e) => setFormData({ ...formData, deviceClass: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Class I">Class I</option>
                    <option value="Class II">Class II</option>
                    <option value="Class IIa">Class IIa</option>
                    <option value="Class IIb">Class IIb</option>
                    <option value="Class III">Class III</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="riskLevel">Risiko-Level</Label>
                  <select
                    id="riskLevel"
                    value={formData.riskLevel}
                    onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Niedrig</option>
                    <option value="medium">Mittel</option>
                    <option value="high">Hoch</option>
                    <option value="critical">Kritisch</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priorität</Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">Niedrig (1)</option>
                    <option value="2">Mittel (2)</option>
                    <option value="3">Hoch (3)</option>
                    <option value="4">Sehr Hoch (4)</option>
                    <option value="5">Kritisch (5)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regulatory Pathway Selection */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Intelligente Zulassungsstrategie
              </CardTitle>
              <CardDescription>
                Wählen Sie den regulatorischen Pfad basierend auf echten 2025 Benchmark-Daten (FDA, EU MDR, ISO)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPathways ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : relevantPathways.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Keine passenden Pathways für {formData.deviceClass} verfügbar</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relevantPathways.map((pathway) => (
                    <div
                      key={pathway.id}
                      onClick={() => setFormData({ ...formData, selectedPathwayId: pathway.id })}
                      className={`cursor-pointer p-4 border-2 rounded-lg transition-all hover:shadow-md ${
                        formData.selectedPathwayId === pathway.id
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-purple-300"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{pathway.name}</h3>
                          <Badge variant="outline" className="mb-2">
                            {pathway.jurisdiction}
                          </Badge>
                        </div>
                        {formData.selectedPathwayId === pathway.id && (
                          <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0" />
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {pathway.description}
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-xs text-gray-500">Durchschn. Kosten</p>
                            <p className="font-semibold text-sm">
                              ${(pathway.average_cost_usd / 1000).toFixed(0)}k
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-xs text-gray-500">Timeline</p>
                            <p className="font-semibold text-sm">
                              {pathway.min_timeline_months}-{pathway.max_timeline_months} Monate
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500">
                          Quelle: {pathway.source} ({new Date(pathway.last_updated).getFullYear()})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Summary & Estimation */}
          {selectedPathway && (
            <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Automatische Projekt-Schätzung
                </CardTitle>
                <CardDescription>
                  Basierend auf echten Benchmark-Daten und dem gewählten Pathway
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Geschätzte Gesamtkosten</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${(selectedPathway.average_cost_usd / 1000).toFixed(0)}k
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Durchschnitt basierend auf {selectedPathway.source}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Geschätzte Timeline</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedPathway.average_timeline_months} Mon.
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Bereich: {selectedPathway.min_timeline_months}-{selectedPathway.max_timeline_months} Monate
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-6 w-6 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Automatische Phasen</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedPathway.standard_phases ? Object.keys(JSON.parse(selectedPathway.standard_phases)).length : 0}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Werden automatisch generiert
                    </p>
                  </div>
                </div>

                {/* Key Requirements */}
                {selectedPathway.key_requirements && selectedPathway.key_requirements.length > 0 && (
                  <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      Hauptanforderungen
                    </h4>
                    <ul className="space-y-2">
                      {selectedPathway.key_requirements.slice(0, 5).map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/customer-area-3/projects")}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={createProjectMutation.isPending || !formData.selectedPathwayId}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8"
            >
              {createProjectMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Erstelle Projekt...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Projekt mit Phasen erstellen
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
