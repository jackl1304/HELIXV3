import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Scale, FileText, Download, AlertCircle } from "@/components/icons";

export default function EUMDR() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Scale className="h-8 w-8 text-blue-700" />
            EU MDR 2017/745
          </h1>
          <p className="text-gray-600 mt-2">
            Verordnung über Medizinprodukte der Europäischen Union
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          EU Regulation
        </Badge>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Über die EU MDR</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-3">
          <p>
            Die EU-Verordnung 2017/745 über Medizinprodukte (Medical Device Regulation - MDR) 
            ist seit dem 26. Mai 2021 vollständig anwendbar und ersetzt die bisherigen 
            Richtlinien 93/42/EWG und 90/385/EWG.
          </p>
          <p>
            Sie legt einheitliche Anforderungen für das Inverkehrbringen und die Überwachung 
            von Medizinprodukten in der Europäischen Union fest.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-700" />
              Offizielle Verordnung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Vollständiger Text der Verordnung (EU) 2017/745 über Medizinprodukte
              </p>
              <Badge className="mb-3">Veröffentlicht: 5. Mai 2017</Badge>
              <p className="text-sm text-gray-600 mb-3">
                Anwendbar seit: 26. Mai 2021
              </p>
            </div>
            <a
              href="https://eur-lex.europa.eu/eli/reg/2017/745/oj/eng"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-700 hover:text-blue-900 text-sm font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              EUR-Lex Dokument (English)
            </a>
            <a
              href="https://eur-lex.europa.eu/eli/reg/2017/745/oj/deu"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-700 hover:text-blue-900 text-sm font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              EUR-Lex Dokument (Deutsch)
            </a>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Wichtige Anforderungen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-700">•</span>
                <span>Verstärkte klinische Bewertung und Nachbeobachtung</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-700">•</span>
                <span>Unique Device Identification (UDI)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-700">•</span>
                <span>EUDAMED Datenbank-Registrierung</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-700">•</span>
                <span>Person Responsible for Regulatory Compliance (PRRC)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-700">•</span>
                <span>Erweiterte Dokumentation und technische Unterlagen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-700">•</span>
                <span>Neue Klassifizierungsregeln</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Anhänge und Leitlinien
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Die MDR enthält 17 Anhänge mit detaillierten Anforderungen:
            </p>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Anhang I: Grundlegende Sicherheits- und Leistungsanforderungen</li>
              <li>• Anhang II/III: Technische Dokumentation</li>
              <li>• Anhang VII-XI: Konformitätsbewertungsverfahren</li>
              <li>• Anhang XIV: Klinische Bewertung</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="h-5 w-5 text-purple-600" />
              MDCG Leitlinien
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Die Medical Device Coordination Group (MDCG) veröffentlicht Leitlinien zur Anwendung der MDR:
            </p>
            <a
              href="https://health.ec.europa.eu/medical-devices-sector/new-regulations/guidance-mdcg-endorsed-documents-and-other-guidance_en"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-purple-600 hover:text-purple-800 text-sm font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              MDCG Guidance Documents
            </a>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle>Weitere Ressourcen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <a
            href="https://health.ec.europa.eu/medical-devices-sector/regulatory-framework_en"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-700 hover:text-blue-900"
          >
            <ExternalLink className="h-4 w-4" />
            EU Commission - Medical Devices Regulatory Framework
          </a>
          <a
            href="https://ec.europa.eu/health/medical-devices-eudamed_en"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-700 hover:text-blue-900"
          >
            <ExternalLink className="h-4 w-4" />
            EUDAMED Database
          </a>
          <a
            href="https://www.bfarm.de/DE/Medizinprodukte/Aufgaben/Benannte-Stellen/_node.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-700 hover:text-blue-900"
          >
            <ExternalLink className="h-4 w-4" />
            BfArM - Benannte Stellen (Deutschland)
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
