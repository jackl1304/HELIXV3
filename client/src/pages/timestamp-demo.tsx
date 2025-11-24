import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ContentTimestampBadge, SortedByDateBadge } from '@/components/content-timestamp-badge';
import { Calendar, Clock, TrendingUp } from '@/components/icons';

/**
 * Demo-Seite zur Veranschaulichung der Zeitstempel-Integration
 * Zeigt alle Varianten der ContentTimestampBadge Komponente
 */
export default function TimestampDemo() {
  // Beispiel-Daten
  const sampleUpdate = {
    id: '1',
    title: 'FDA 510(k) Guidance Update 2025',
    publishedAt: new Date('2025-01-15T08:00:00Z'),
    capturedAt: new Date('2025-01-17T14:30:00Z')
  };

  const recentUpdates = [
    { id: '1', title: 'EU MDR Änderung Q4/2024', publishedAt: '2024-12-20', capturedAt: '2024-12-21' },
    { id: '2', title: 'FDA Cyber-Security Guidelines', publishedAt: '2024-11-15', capturedAt: '2024-11-16' },
    { id: '3', title: 'ISO 13485:2024 Draft', publishedAt: '2024-10-05', capturedAt: '2024-10-06' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-8">
      <div className="container mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Zeitstempel-Integration Demo
          </h1>
          <p className="text-xl text-gray-600">
            Beispiele für ContentTimestampBadge in verschiedenen Kontexten
          </p>
        </div>

        {/* Kompakte Version */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Kompakte Zeitstempel (für Listen)
            </CardTitle>
            <CardDescription>
              Minimale Darstellung mit Icons für platzsparende Listen-Ansichten
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-white border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">FDA 510(k) Guidance Update 2025</h3>
                <ContentTimestampBadge
                  publishedAt={sampleUpdate.publishedAt}
                  capturedAt={sampleUpdate.capturedAt}
                  compact
                />
              </div>
              <p className="text-sm text-gray-600">
                Neue Anforderungen für Cyber-Security in Medizinprodukten der Klasse II/III
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <h4 className="font-medium text-gray-700 mb-3">Code-Beispiel:</h4>
              <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
{`<ContentTimestampBadge
  publishedAt={update.published_at}
  capturedAt={update.created_at}
  compact
/>`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Vollständige Version */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Vollständige Badges (für Detail-Ansichten)
            </CardTitle>
            <CardDescription>
              Ausführliche Darstellung mit Labels für Übersichts-Seiten
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-white border rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                EU MDR Annex I Änderungen – Technische Dokumentation
              </h3>

              <ContentTimestampBadge
                publishedAt="2024-12-10T10:00:00Z"
                capturedAt="2024-12-12T15:30:00Z"
                className="mb-4"
              />

              <p className="text-gray-700 leading-relaxed">
                Die Europäische Kommission hat neue Anforderungen an die technische Dokumentation
                veröffentlicht. Diese betreffen insbesondere Software-Medizinprodukte und erfordern
                erweiterte Nachweise zur Cyber-Security.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <h4 className="font-medium text-gray-700 mb-3">Code-Beispiel:</h4>
              <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
{`<ContentTimestampBadge
  publishedAt={update.published_at}
  capturedAt={update.created_at}
/>`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Sortierhinweis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              Sortierhinweis-Badge
            </CardTitle>
            <CardDescription>
              Zeigt Benutzern, dass Inhalte nach Datum sortiert sind
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-white border rounded-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Aktuelle Updates</h3>
                <SortedByDateBadge />
              </div>

              <div className="space-y-3">
                {recentUpdates.map(update => (
                  <div key={update.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="font-medium text-gray-900">{update.title}</span>
                    <ContentTimestampBadge
                      publishedAt={update.publishedAt}
                      capturedAt={update.capturedAt}
                      compact
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <h4 className="font-medium text-gray-700 mb-3">Code-Beispiel:</h4>
              <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
{`import { SortedByDateBadge } from '@/components/content-timestamp-badge';

<SortedByDateBadge />`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Analyseportal-Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Analyseportal Header-Integration
            </CardTitle>
            <CardDescription>
              Wie Zeitstempel im Analyseportal (ehemals KI Assistant) angezeigt werden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                Analyseportal – Regulatorische Informationen
              </h1>
              <div className="text-xs uppercase tracking-wide text-white/60 mb-2">
                Stand: {new Date().toLocaleDateString('de-DE')} • Neueste Inhalte zuerst
              </div>
              <p className="text-white/80 text-lg">
                Fragen zu regulatorischen Änderungen, FDA, EMA, Compliance
              </p>
            </div>

            <div className="mt-4 bg-gray-50 p-4 rounded border border-gray-200">
              <h4 className="font-medium text-gray-700 mb-3">Code-Beispiel:</h4>
              <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
{`<div className="text-xs uppercase tracking-wide text-white/60 mb-2">
  Stand: {new Date().toLocaleDateString('de-DE')} • Neueste Inhalte zuerst
</div>`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Best Practices */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Best Practices</CardTitle>
            <CardDescription className="text-gray-700">
              Empfehlungen für die Verwendung von Zeitstempeln in Helix V3
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <strong className="text-gray-900">Konsistente Formatierung:</strong>
                <p className="text-gray-700 text-sm mt-1">
                  Verwende immer <code className="bg-white px-1 rounded">de-DE</code> Locale für deutsche Datums-Darstellung (23.11.2025)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <strong className="text-gray-900">Sortierung nach Datum:</strong>
                <p className="text-gray-700 text-sm mt-1">
                  Standardmäßig neueste Einträge zuerst. Nutze <code className="bg-white px-1 rounded">.sort((a, b) =&gt; dateB - dateA)</code>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <strong className="text-gray-900">Kompakt vs. Vollständig:</strong>
                <p className="text-gray-700 text-sm mt-1">
                  Listen: <code className="bg-white px-1 rounded">compact</code> Modus. Detail-Ansichten: Vollständige Badges mit Labels
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                4
              </div>
              <div>
                <strong className="text-gray-900">Compliance & Audit:</strong>
                <p className="text-gray-700 text-sm mt-1">
                  Beide Timestamps (publishedAt + capturedAt) zeigen für Nachvollziehbarkeit & Dokumentation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
