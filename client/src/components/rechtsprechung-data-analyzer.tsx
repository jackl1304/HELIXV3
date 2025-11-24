import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Scale,
  Calendar,
  DollarSign,
  Edit,
  Download,
  RefreshCw
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface LegalCaseAnalysis {
  id: string;
  caseNumber: string | null;
  title: string;
  court: string;
  jurisdiction: string;
  decisionDate: Date | null;
  missingFields: string[];
  completeness: number;
  summary: string | null;
  content: string | null;
  verdict: string | null;
  damages: string | null;
}

interface DataQuality {
  totalCases: number;
  completeCases: number;
  incompleteCases: number;
  avgCompleteness: number;
  missingFields: {
    summary: number;
    content: number;
    verdict: number;
    damages: number;
    decisionDate: number;
  };
}

/**
 * Rechtsprechungs-Daten-Analyser & Ausfüll-Tool
 *
 * Aufgabe: "alle daten der rechtssrpechungen asuwerten und ausfüllen"
 *
 * Features:
 * - Analyse aller Rechtsprechungsdaten auf Vollständigkeit
 * - Identifikation fehlender Felder (Verdict, Damages, Summary, etc.)
 * - Automatisches Ausfüllen aus vorhandenen Inhalten
 * - Datenqualitäts-Übersicht mit Statistiken
 * - Batch-Processing für effiziente Datenergänzung
 */
export function RechtsprechungDataAnalyzer() {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('all');
  const queryClient = useQueryClient();

  // Lade Datenqualitäts-Analyse
  const { data: dataQuality, isLoading: qualityLoading } = useQuery<DataQuality>({
    queryKey: ['/api/legal-cases/data-quality'],
  });

  // Lade unvollständige Rechtsfälle
  const { data: incompleteCases, isLoading: casesLoading } = useQuery<LegalCaseAnalysis[]>({
    queryKey: ['/api/legal-cases/incomplete', selectedJurisdiction],
    enabled: selectedJurisdiction !== 'all',
  });

  // Mutation zum Ausfüllen fehlender Daten
  const fillMissingDataMutation = useMutation({
    mutationFn: async (caseId: string) => {
      const response = await fetch(`/api/legal-cases/${caseId}/fill-missing-data`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Fehler beim Ausfüllen');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/legal-cases'] });
    },
  });

  // Batch-Processing aller unvollständiger Fälle
  const fillAllMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/legal-cases/fill-all-missing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jurisdiction: selectedJurisdiction }),
      });
      if (!response.ok) throw new Error('Batch-Processing fehlgeschlagen');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/legal-cases'] });
    },
  });

  const jurisdictions = [
    { value: 'all', label: 'Alle Jurisdiktionen' },
    { value: 'Germany', label: 'Deutschland' },
    { value: 'EU', label: 'Europäische Union' },
    { value: 'USA', label: 'Vereinigte Staaten' },
    { value: 'UK', label: 'Großbritannien' },
    { value: 'Switzerland', label: 'Schweiz' },
  ];

  if (qualityLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Scale className="h-8 w-8 text-blue-600" />
            Rechtsprechungs-Daten-Analyse
          </h1>
          <p className="text-muted-foreground mt-1">
            Datenqualität überprüfen und fehlende Informationen ergänzen
          </p>
        </div>
        <Button
          onClick={() => fillAllMutation.mutate()}
          disabled={fillAllMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {fillAllMutation.isPending ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Edit className="h-4 w-4 mr-2" />
          )}
          Alle Ausfüllen
        </Button>
      </div>

      {/* Datenqualitäts-Übersicht */}
      {dataQuality && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Gesamt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{dataQuality.totalCases}</div>
              <p className="text-xs text-muted-foreground mt-1">Rechtsfälle</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Vollständig
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {dataQuality.completeCases}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((dataQuality.completeCases / dataQuality.totalCases) * 100)}% komplett
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                Unvollständig
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {dataQuality.incompleteCases}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Benötigen Ergänzung
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Edit className="h-4 w-4 text-purple-600" />
                Durchschnitt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {Math.round(dataQuality.avgCompleteness)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Datenqualität
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fehlende Felder Statistik */}
      {dataQuality && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Fehlende Datenfelder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <FileText className="h-8 w-8 text-orange-600 mb-2" />
                <div className="text-2xl font-bold">{dataQuality.missingFields.summary}</div>
                <div className="text-xs text-center text-muted-foreground mt-1">
                  Zusammenfassungen fehlen
                </div>
              </div>

              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <Edit className="h-8 w-8 text-orange-600 mb-2" />
                <div className="text-2xl font-bold">{dataQuality.missingFields.content}</div>
                <div className="text-xs text-center text-muted-foreground mt-1">
                  Inhalte fehlen
                </div>
              </div>

              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <Scale className="h-8 w-8 text-orange-600 mb-2" />
                <div className="text-2xl font-bold">{dataQuality.missingFields.verdict}</div>
                <div className="text-xs text-center text-muted-foreground mt-1">
                  Urteile fehlen
                </div>
              </div>

              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <DollarSign className="h-8 w-8 text-orange-600 mb-2" />
                <div className="text-2xl font-bold">{dataQuality.missingFields.damages}</div>
                <div className="text-xs text-center text-muted-foreground mt-1">
                  Schadensersatz fehlt
                </div>
              </div>

              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <Calendar className="h-8 w-8 text-orange-600 mb-2" />
                <div className="text-2xl font-bold">{dataQuality.missingFields.decisionDate}</div>
                <div className="text-xs text-center text-muted-foreground mt-1">
                  Datum fehlt
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Jurisdiktions-Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Unvollständige Fälle nach Jurisdiktion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {jurisdictions.map((jurisdiction) => (
              <Button
                key={jurisdiction.value}
                variant={selectedJurisdiction === jurisdiction.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedJurisdiction(jurisdiction.value)}
              >
                {jurisdiction.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Unvollständige Fälle Liste */}
      {selectedJurisdiction !== 'all' && (
        <div className="space-y-4">
          {casesLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          ) : incompleteCases && incompleteCases.length > 0 ? (
            incompleteCases.map((legalCase) => (
              <Card key={legalCase.id} className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{legalCase.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Badge variant="outline">{legalCase.jurisdiction}</Badge>
                        <span>•</span>
                        <span>{legalCase.court}</span>
                        {legalCase.caseNumber && (
                          <>
                            <span>•</span>
                            <span>{legalCase.caseNumber}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant={legalCase.completeness >= 80 ? 'default' : 'destructive'}
                        className="text-lg px-3 py-1"
                      >
                        {Math.round(legalCase.completeness)}%
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => fillMissingDataMutation.mutate(legalCase.id)}
                        disabled={fillMissingDataMutation.isPending}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Ausfüllen
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium mb-2">Fehlende Felder:</div>
                      <div className="flex flex-wrap gap-2">
                        {legalCase.missingFields.map((field) => (
                          <Badge key={field} variant="secondary" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {legalCase.summary && (
                      <div className="text-sm text-muted-foreground border-l-2 border-gray-300 pl-3">
                        {legalCase.summary.substring(0, 200)}
                        {legalCase.summary.length > 200 && '...'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
                <div className="text-lg font-medium">Alle Fälle vollständig!</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Keine unvollständigen Fälle in {jurisdictions.find(j => j.value === selectedJurisdiction)?.label}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Export-Option */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export & Dokumentation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Exportiere Datenqualitäts-Bericht für Compliance und Audit-Zwecke
          </p>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export als CSV
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export als PDF
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Vollständiger Bericht
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
