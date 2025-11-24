import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Calendar,
  Globe,
  Activity,
  Filter,
  AlertTriangle,
  Clock,
  Download,
  ExternalLink,
  Package,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Brain,
  Database,
  Pencil,
  CheckCircle2,
  FolderOpen,
  PlayCircle
} from "@/components/icons";

interface RegulatoryUpdate {
  id: string;
  title: string;
  description: string;
  content: string;
  type: string;
  category: string;
  device_type: string;
  risk_level: string;
  jurisdiction: string;
  published_date: string;
  effective_date: string;
  priority: number;
  action_required: boolean;
  action_type: string;
  action_deadline: string;
  implementation_guidance: string;
  document_url: string | null;
  guidance_documents: Array<{
    name: string;
    url: string;
    type: string;
    description: string;
  }> | null;
  affected_products: string[] | null;
  estimated_implementation_cost: number | null;
  estimated_implementation_time: string | null;
  tags: string[] | null;

  // Source information (joined from data_sources table)
  source_name: string | null;
  source_url: string | null;
  source_description: string | null;
  source_country: string | null;

  // FDA-specific fields
  fda_k_number: string | null;
  fda_applicant: string | null;
  fda_product_code: string | null;
  fda_device_class: string | null;
  fda_regulation_number: string | null;
  fda_decision_date: string | null;
  fda_status: string | null;
}

export default function RegulatoryUpdates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [expandedUpdate, setExpandedUpdate] = useState<string | null>(null);

  const { data: updates = [], isLoading } = useQuery<RegulatoryUpdate[]>({
    queryKey: ["/api/regulatory-updates"],
  });

  const filteredUpdates = updates.filter((update) => {
    const matchesSearch =
      update.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.fda_k_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.fda_applicant?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRegion = !regionFilter || update.jurisdiction === regionFilter;
    const matchesPriority = !priorityFilter ||
      (priorityFilter === "Neuig" && update.priority >= 4) ||
      (priorityFilter === "Normal" && update.priority < 4);
    const matchesType = !typeFilter || update.type === typeFilter;

    return matchesSearch && matchesRegion && matchesPriority && matchesType;
  });

  const toggleExpanded = (id: string) => {
    setExpandedUpdate(expandedUpdate === id ? null : id);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Regulatory Updates
              </h1>
              <p className="text-gray-600 text-lg">
                {updates.length} von {updates.length} Updates
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Regulatorische Updates durchsuchen..."
                  className="pl-9"
                />
              </div>
              <div className="text-sm text-gray-600">
                {filteredUpdates.length} von {updates.length} Ergebnissen
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value={regionFilter || ""}
                onChange={(e) => setRegionFilter(e.target.value || null)}
              >
                <option value="">Alle Regionen</option>
                <option value="US">US</option>
                <option value="EU">EU</option>
                <option value="DE">DE</option>
                <option value="UK">UK</option>
              </select>

              <select
                className="px-3 py-2 border rounded-md text-sm"
                value={priorityFilter || ""}
                onChange={(e) => setPriorityFilter(e.target.value || null)}
              >
                <option value="">Alle Prioritäten</option>
                <option value="Neuig">Neuig</option>
                <option value="Normal">Normal</option>
              </select>

              <select
                className="px-3 py-2 border rounded-md text-sm"
                value={typeFilter || ""}
                onChange={(e) => setTypeFilter(e.target.value || null)}
              >
                <option value="">Alle Typen</option>
                <option value="approval">510(k) / PMA Zulassungen</option>
                <option value="regulation">Verordnungen</option>
                <option value="guidance">Leitlinien</option>
                <option value="standard">Standards</option>
                <option value="alert">Warnungen</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center"
                onClick={() => {
                  setRegionFilter(null);
                  setPriorityFilter(null);
                  setTypeFilter(null);
                  setSearchQuery("");
                }}
              >
                Zurücksetzen
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Updates List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Lade Updates...</p>
            </div>
          </div>
        ) : filteredUpdates.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Keine Updates gefunden
              </h3>
              <p className="text-gray-500">
                Versuchen Sie eine andere Suchanfrage oder Filter
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredUpdates.map((update) => {
              const isExpanded = expandedUpdate === update.id;

              return (
                <Card
                  key={update.id}
                  className="border-l-4 border-l-blue-500 shadow-md"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <CardTitle className="text-xl">
                            {update.fda_k_number ? `FDA 510(k): ` : ''}
                            {update.title}
                            {update.fda_k_number && ` (${update.fda_k_number})`}
                          </CardTitle>
                          <Badge variant="default" className="bg-green-600">
                            Neuig
                          </Badge>
                          {update.jurisdiction && (
                            <Badge variant="outline">
                              {update.jurisdiction}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-base mb-3">
                          {update.fda_applicant && (
                            <div className="text-sm text-gray-600 mb-1">
                              K-Nummer: {update.fda_k_number} Antragsteller: {update.fda_applicant} Produktcode: {update.fda_product_code} Geräteklasse: {update.fda_device_class} Regulierungsnummer: {update.fda_regulation_number} Entscheidungsdatum: {update.fda_decision_date ? new Date(update.fda_decision_date).toLocaleDateString('de-DE', {year: 'numeric', month: '2-digit', day: '2-digit'}) : 'N/A'} Zusammenfassung: {update.description}
                            </div>
                          )}
                          {!update.fda_applicant && update.description}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {update.published_date && (
                          <div className="text-right text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(update.published_date).toLocaleDateString('de-DE', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              })}
                            </div>
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-2"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(update.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0">
                      <Tabs defaultValue="document" className="w-full">
                        <TabsList className="grid w-full grid-cols-5 mb-4">
                          <TabsTrigger value="document" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Dokument
                          </TabsTrigger>
                          <TabsTrigger value="action" className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Handlungsbedarf
                          </TabsTrigger>
                          <TabsTrigger value="implementation" className="flex items-center gap-2">
                            <PlayCircle className="h-4 w-4" />
                            Umsetzung
                          </TabsTrigger>
                          <TabsTrigger value="control" className="flex items-center gap-2">
                            <FolderOpen className="h-4 w-4" />
                            Dokumentensteuerung
                          </TabsTrigger>
                          <TabsTrigger value="metadata" className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Metadaten
                          </TabsTrigger>
                        </TabsList>

                        {/* TAB: Dokument */}
                        <TabsContent value="document">
                          <div className="space-y-4">
                            {/* Dokumenten-Informationen */}
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                Dokumenten-Details
                              </h3>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">Dokumententyp</p>
                                  <p className="text-sm font-semibold">
                                    {update.type === 'approval' && update.fda_k_number ? 'FDA 510(k) Zulassung' :
                                     update.type === 'approval' ? 'Zulassung' :
                                     update.type === 'regulation' ? 'Verordnung' :
                                     update.type === 'guidance' ? 'Leitlinie' :
                                     update.type === 'standard' ? 'Standard' :
                                     update.type === 'alert' ? 'Sicherheitswarnung' : update.type}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs text-gray-600 mb-1">Zuständigkeit</p>
                                  <Badge variant="outline" className="font-semibold">
                                    {update.jurisdiction}
                                  </Badge>
                                </div>

                                {update.fda_k_number && (
                                  <>
                                    <div>
                                      <p className="text-xs text-gray-600 mb-1">K-Nummer</p>
                                      <p className="text-sm font-mono font-semibold">{update.fda_k_number}</p>
                                    </div>

                                    <div>
                                      <p className="text-xs text-gray-600 mb-1">Antragsteller</p>
                                      <p className="text-sm">{update.fda_applicant || 'N/A'}</p>
                                    </div>

                                    <div>
                                      <p className="text-xs text-gray-600 mb-1">Geräteklasse</p>
                                      <Badge className="bg-blue-600">{update.fda_device_class || 'N/A'}</Badge>
                                    </div>

                                    <div>
                                      <p className="text-xs text-gray-600 mb-1">Produktcode</p>
                                      <p className="text-sm font-mono">{update.fda_product_code || 'N/A'}</p>
                                    </div>
                                  </>
                                )}

                                <div>
                                  <p className="text-xs text-gray-600 mb-1">Veröffentlicht</p>
                                  <p className="text-sm">
                                    {update.published_date ?
                                      new Date(update.published_date).toLocaleDateString('de-DE', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      }) : 'N/A'}
                                  </p>
                                </div>

                                {update.effective_date && (
                                  <div>
                                    <p className="text-xs text-gray-600 mb-1">Gültig ab</p>
                                    <p className="text-sm">
                                      {new Date(update.effective_date).toLocaleDateString('de-DE', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* BESCHREIBUNG: Warum, Wieso, Weshalb */}
                            {update.description && (
                              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-lg border-2 border-yellow-300">
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                  <BookOpen className="h-5 w-5 text-amber-600" />
                                  Beschreibung & Begründung
                                </h3>
                                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                                  {update.description}
                                </p>
                                <div className="mt-3 text-xs text-amber-800 bg-amber-100 px-3 py-2 rounded">
                                  💡 <strong>Hinweis:</strong> Diese Beschreibung erklärt die Hintergründe, Gründe und Auswirkungen dieser regulatorischen Änderung.
                                </div>
                              </div>
                            )}

                            {/* QUELLEN-INFORMATIONEN */}
                            {(update.source_name || update.source_url || update.document_url) && (
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-300">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                  <Globe className="h-5 w-5 text-green-600" />
                                  Quellen & Offizielle Dokumente
                                </h3>
                                <div className="space-y-3">
                                  {update.source_name && (
                                    <div className="bg-white p-4 rounded border border-green-200">
                                      <p className="text-xs text-gray-600 mb-1">Datenquelle</p>
                                      <p className="text-sm font-semibold text-gray-900">{update.source_name}</p>
                                      {update.source_country && (
                                        <Badge variant="outline" className="mt-2">
                                          {update.source_country}
                                        </Badge>
                                      )}
                                    </div>
                                  )}

                                  {update.source_url && (
                                    <div className="bg-white p-4 rounded border border-green-200">
                                      <p className="text-xs text-gray-600 mb-2">Offizielle Quelle</p>
                                      <a
                                        href={update.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-2"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                        {update.source_url}
                                      </a>
                                    </div>
                                  )}

                                  {update.document_url && (
                                    <div className="bg-white p-4 rounded border border-green-200">
                                      <p className="text-xs text-gray-600 mb-2">Dokument-Download</p>
                                      <a
                                        href={update.document_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                                      >
                                        <Download className="h-4 w-4" />
                                        Offizielles Dokument herunterladen
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* GUIDANCE DOCUMENTS */}
                            {update.guidance_documents && update.guidance_documents.length > 0 && (
                              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-purple-300">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                  <FileText className="h-5 w-5 text-purple-600" />
                                  Begleitdokumente & Leitfäden ({update.guidance_documents.length})
                                </h3>
                                <div className="grid gap-3">
                                  {update.guidance_documents.map((doc, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-lg border border-purple-200 hover:shadow-md transition-shadow">
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-2">
                                            <FileText className="h-4 w-4 text-purple-600" />
                                            <p className="font-semibold text-sm text-gray-900">{doc.name}</p>
                                          </div>
                                          <Badge variant="outline" className="text-xs mb-2">
                                            {doc.type}
                                          </Badge>
                                          <p className="text-xs text-gray-600 mb-3">{doc.description}</p>
                                          <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                          >
                                            <ExternalLink className="h-3 w-3" />
                                            Dokument öffnen
                                          </a>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Dokumenten-Inhalt */}
                            {update.content && (
                              <div className="prose max-w-none bg-white p-6 rounded-lg border">
                                <h4 className="text-base font-semibold mb-3">Vollständiger Dokumenten-Inhalt</h4>
                                <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                                  {update.content}
                                </div>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        {/* TAB: Handlungsbedarf */}
                        <TabsContent value="action">
                          <div className="space-y-4">
                            {update.action_required ? (
                              <>
                                <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-lg border-2 border-red-300">
                                  <div className="flex items-start gap-4">
                                    <div className="bg-red-600 text-white p-3 rounded-lg">
                                      <AlertTriangle className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                      <h3 className="text-lg font-bold text-red-900 mb-2">
                                        Handlungsbedarf erforderlich
                                      </h3>
                                      <p className="text-sm text-red-800 mb-4">
                                        {update.action_type || 'Maßnahmen erforderlich für Compliance'}
                                      </p>

                                      {update.action_deadline && (
                                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded">
                                          <Clock className="h-5 w-5 text-red-600" />
                                          <div>
                                            <p className="text-xs text-gray-600">Frist</p>
                                            <p className="text-sm font-bold text-red-900">
                                              {new Date(update.action_deadline).toLocaleDateString('de-DE', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                              })}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Betroffene Produkte */}
                                {update.affected_products && update.affected_products.length > 0 && (
                                  <Card className="bg-white">
                                    <CardHeader>
                                      <CardTitle className="text-base flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        Betroffene Produkte
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <ul className="space-y-2">
                                        {update.affected_products.map((product, idx) => (
                                          <li key={idx} className="flex items-center gap-2 text-sm">
                                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                            {product}
                                          </li>
                                        ))}
                                      </ul>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Zugehörige Leitliniendokumente */}
                                {update.guidance_documents && update.guidance_documents.length > 0 && (
                                  <Card className="bg-white">
                                    <CardHeader>
                                      <CardTitle className="text-base flex items-center gap-2">
                                        <BookOpen className="h-5 w-5" />
                                        Leitliniendokumente
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-3">
                                        {update.guidance_documents.map((doc, idx) => (
                                          <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded hover:bg-gray-100 transition">
                                            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                                            <div className="flex-1">
                                              <p className="font-medium text-sm">{doc.name}</p>
                                              <p className="text-xs text-gray-600 mt-1">{doc.description || doc.type}</p>
                                              <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-2"
                                              >
                                                Dokument öffnen <ExternalLink className="h-3 w-3" />
                                              </a>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}
                              </>
                            ) : (
                              <div className="text-center py-12 bg-green-50 rounded-lg border-2 border-green-200">
                                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-green-900 mb-2">
                                  Kein Handlungsbedarf
                                </h3>
                                <p className="text-sm text-green-700">
                                  Dieses Dokument erfordert keine unmittelbaren Maßnahmen.
                                </p>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        {/* TAB: Umsetzung */}
                        <TabsContent value="implementation">
                          <div className="space-y-4">
                            {update.implementation_guidance ? (
                              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                <CardHeader>
                                  <CardTitle className="text-base flex items-center gap-2">
                                    <PlayCircle className="h-5 w-5 text-blue-600" />
                                    Umsetzungsleitfaden
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="prose max-w-none text-sm whitespace-pre-line">
                                    {update.implementation_guidance}
                                  </div>
                                </CardContent>
                              </Card>
                            ) : (
                              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                <PlayCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                <p>Keine Umsetzungsanleitung verfügbar</p>
                              </div>
                            )}

                            {/* Zeitlicher Rahmen */}
                            {update.estimated_implementation_time && (
                              <Card className="bg-white">
                                <CardHeader>
                                  <CardTitle className="text-base flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Zeitlicher Rahmen
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 px-4 py-2 rounded-lg">
                                      <p className="text-2xl font-bold text-blue-900">
                                        {update.estimated_implementation_time}
                                      </p>
                                    </div>
                                    <p className="text-sm text-gray-600">Geschätzte Umsetzungszeit</p>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        </TabsContent>

                        {/* TAB: Dokumentensteuerung */}
                        <TabsContent value="control">
                          <div className="space-y-4">
                            <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
                              <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                  <FolderOpen className="h-5 w-5 text-purple-600" />
                                  Dokumenten-Lifecycle
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <p className="text-xs text-gray-600 mb-1">Status</p>
                                    <Badge className="bg-green-600">Aktiv</Badge>
                                  </div>

                                  <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <p className="text-xs text-gray-600 mb-1">Version</p>
                                    <p className="text-sm font-semibold">1.0</p>
                                  </div>

                                  <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <p className="text-xs text-gray-600 mb-1">Genehmigt</p>
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  </div>

                                  <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <p className="text-xs text-gray-600 mb-1">Überprüfung</p>
                                    <p className="text-sm font-semibold">Jährlich</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Dokumentenhistorie */}
                            <Card className="bg-white">
                              <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                  <Activity className="h-5 w-5" />
                                  Änderungshistorie
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div className="flex items-start gap-3 pb-3 border-b">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold">Initial erstellt</p>
                                      <p className="text-xs text-gray-600">
                                        {update.published_date ?
                                          new Date(update.published_date).toLocaleDateString('de-DE', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          }) : 'Datum nicht verfügbar'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>

                        {/* Metadaten */}
                        <TabsContent value="metadata">
                          <Card className="bg-gray-50">
                            <CardHeader>
                              <CardTitle className="text-base flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                Technische Metadaten
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-semibold">ID:</span>
                                  <p className="text-gray-600 break-all">{update.id}</p>
                                </div>
                                {update.fda_k_number && (
                                  <div>
                                    <span className="font-semibold">K-Nummer:</span>
                                    <p className="text-gray-600">{update.fda_k_number}</p>
                                  </div>
                                )}
                                {update.fda_product_code && (
                                  <div>
                                    <span className="font-semibold">Produktcode:</span>
                                    <p className="text-gray-600">{update.fda_product_code}</p>
                                  </div>
                                )}
                                {update.fda_device_class && (
                                  <div>
                                    <span className="font-semibold">Geräteklasse:</span>
                                    <p className="text-gray-600">{update.fda_device_class}</p>
                                  </div>
                                )}
                                {update.fda_regulation_number && (
                                  <div>
                                    <span className="font-semibold">Regulierungsnummer:</span>
                                    <p className="text-gray-600">{update.fda_regulation_number}</p>
                                  </div>
                                )}
                                {update.category && (
                                  <div>
                                    <span className="font-semibold">Kategorie:</span>
                                    <p className="text-gray-600">{update.category}</p>
                                  </div>
                                )}
                                {update.type && (
                                  <div>
                                    <span className="font-semibold">Typ:</span>
                                    <p className="text-gray-600">{update.type}</p>
                                  </div>
                                )}
                                {update.tags && update.tags.length > 0 && (
                                  <div className="col-span-2">
                                    <span className="font-semibold">Tags:</span>
                                    <div className="flex gap-2 mt-1 flex-wrap">
                                      {update.tags.map((tag, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
