import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  Plus,
  Edit,
  Trash2,
  Shield,
  ClipboardList,
  TestTube,
  Eye,
  FileCheck,
  Archive
} from "@/components/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DOCUMENT_TYPES = [
  { id: "charta", name: "Projektauftrag (Charta)", icon: FileText, color: "blue", section: "1. Projektinitialisierung" },
  { id: "requirements", name: "Anforderungen (Lastenheft)", icon: ClipboardList, color: "purple", section: "2. Anforderungsmanagement" },
  { id: "risks", name: "Risikoanalyse (ISO 14971)", icon: AlertCircle, color: "red", section: "3. Risikomanagement" },
  { id: "design_review", name: "Design-Review Protokoll", icon: Eye, color: "green", section: "4. Design & Entwicklung" },
  { id: "test_plan", name: "Testplan", icon: TestTube, color: "orange", section: "5. Verifizierung & Validierung" },
  { id: "test_protocol", name: "Testprotokoll", icon: CheckCircle2, color: "orange", section: "5. Verifizierung & Validierung" },
  { id: "usability", name: "Usability-Test Bericht", icon: Eye, color: "cyan", section: "6. Gebrauchstauglichkeit" },
  { id: "conformity", name: "Konformitätserklärung (DOC)", icon: FileCheck, color: "indigo", section: "7. Technische Dokumentation" },
  { id: "changes", name: "Änderungsanträge", icon: Edit, color: "yellow", section: "8. Änderungsmanagement" },
  { id: "ncr", name: "Abweichungsberichte (NCR)", icon: AlertCircle, color: "pink", section: "9. Qualitätsmanagement" },
  { id: "closure", name: "Projektabschlussbericht", icon: Archive, color: "slate", section: "10. Projektabschluss" },
];

interface ProjectakteDocument {
  id: string;
  documentType: string;
  title: string;
  status: "draft" | "in_progress" | "completed" | "archived";
  version: number;
  createdAt: string;
  completionPercentage: number;
}

export default function CustomerArea3Projektakte() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("1. Projektinitialisierung");

  // Fetch projektakte documents
  const { data: documents = [], isLoading } = useQuery<ProjectakteDocument[]>({
    queryKey: ["/api/projektakte-documents"],
  });

  const completionPercentage = documents.length > 0 
    ? Math.round((documents.filter(d => d.status === "completed").length / documents.length) * 100)
    : 0;

  const documentsByStatus = {
    draft: documents.filter(d => d.status === "draft").length,
    in_progress: documents.filter(d => d.status === "in_progress").length,
    completed: documents.filter(d => d.status === "completed").length,
  };

  const createDocumentMutation = useMutation({
    mutationFn: async (docType: string) => {
      const response = await fetch("/api/projektakte/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: docType }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to create document");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projektakte-documents"] });
      toast({ title: "✅ Dokument erstellt", description: "Neues Projektakte-Dokument wurde erstellt" });
      setSelectedDocumentType(data.id);
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (docId: string) => {
      const response = await fetch(`/api/projektakte/${docId}`, { method: "DELETE", credentials: "include" });
      if (!response.ok) throw new Error("Failed to delete document");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projektakte-documents"] });
      toast({ title: "✅ Dokument gelöscht" });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/customer-area-3/projects")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              PROJEKTAKTE (MDR 2017/745)
            </h1>
            <p className="text-gray-600 mt-1">Vollständige Medizintechnik-Dokumentation nach regulatorischen Standards</p>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Gesamtfortschritt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{completionPercentage}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${completionPercentage}%` }} />
            </div>
          </CardContent>
        </Card>

        {[
          { label: "Entwurf", value: documentsByStatus.draft, color: "yellow" },
          { label: "In Bearbeitung", value: documentsByStatus.in_progress, color: "orange" },
          { label: "Fertiggestellt", value: documentsByStatus.completed, color: "green" },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold text-${item.color}-600`}>{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Document Types Grid */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 gap-2 h-auto">
          {[...new Set(DOCUMENT_TYPES.map(d => d.section))].map((section) => (
            <TabsTrigger key={section} value={section} className="text-xs cursor-pointer hover:opacity-75 transition-opacity">
              {section.split(". ")[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        {[...new Set(DOCUMENT_TYPES.map(d => d.section))].map((section) => (
          <TabsContent key={section} value={section} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mt-4">{section}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DOCUMENT_TYPES.filter(d => d.section === section).map((docType) => {
                const existingDoc = documents.find(d => d.documentType === docType.id);
                return (
                  <Card key={docType.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <docType.icon className={`h-5 w-5 text-${docType.color}-600`} />
                          <CardTitle className="text-sm">{docType.name}</CardTitle>
                        </div>
                        {existingDoc && (
                          <Badge variant="outline" className="bg-green-100 text-green-700">
                            v{existingDoc.version}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {existingDoc ? (
                        <>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>Status:</span>
                              <Badge variant="outline">{existingDoc.status}</Badge>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>Fertigstellung:</span>
                              <span className="font-semibold">{existingDoc.completionPercentage}%</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => setSelectedDocumentType(existingDoc.id)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Bearbeiten
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              PDF
                            </Button>
                          </div>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full gap-2"
                          onClick={() => createDocumentMutation.mutate(docType.id)}
                          disabled={createDocumentMutation.isPending}
                        >
                          <Plus className="h-4 w-4" />
                          Erstellen
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Document Master File Summary */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-blue-600" />
            Gesamte PRODUKTAKTE (Device Master File)
          </CardTitle>
          <CardDescription>
            Automatische Zusammenstellung aller eingereichten Dokumente mit Versionsübersicht
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Alle Dokumente als ZIP exportieren
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
