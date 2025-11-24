import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Shield, FileText } from "@/components/icons";

interface Standard {
  number: string;
  year: string;
  title: string;
  description: string;
  url: string;
}

const iecStandards: Standard[] = [
  {
    number: "IEC 62304",
    year: "2006",
    title: "Software-Lebenszyklusprozesse für Medizinprodukte",
    description: "Anforderungen an Entwicklung und Wartung von Medizinprodukte-Software",
    url: "https://www.iso.org/standard/38421.html"
  },
  {
    number: "IEC 62366-1",
    year: "2015",
    title: "Usability Engineering für Medizinprodukte",
    description: "Anwendung von Usability Engineering auf Medizinprodukte",
    url: "https://www.iso.org/standard/63179.html"
  },
  {
    number: "IEC 60601-1",
    year: "2005",
    title: "Medizinische elektrische Geräte - Sicherheit",
    description: "Allgemeine Festlegungen für die Sicherheit einschließlich der wesentlichen Leistungsmerkmale",
    url: "https://webstore.iec.ch/en/publication/2606"
  },
  {
    number: "IEC 62570",
    year: "2014",
    title: "Magnetfeldsicherheit Markierungen",
    description: "Standardverfahren zur Bestimmung des Bildfelds von bildgebenden Systemen",
    url: "https://webstore.iec.ch/en/publication/7213"
  }
];

export default function IECStandards() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-purple-600" />
            IEC Standards für Medizinprodukte
          </h1>
          <p className="text-gray-600 mt-2">
            Internationale Standards der International Electrotechnical Commission
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {iecStandards.length} Standards
        </Badge>
      </div>

      <Card className="bg-purple-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-900">Über IEC Standards</CardTitle>
        </CardHeader>
        <CardContent className="text-purple-800">
          <p>
            IEC-Standards fokussieren auf elektrische und elektronische Aspekte von Medizinprodukten, 
            insbesondere Sicherheit, Software und Usability. Sie werden von der International 
            Electrotechnical Commission entwickelt.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {iecStandards.map((standard) => (
          <Card key={standard.number} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    {standard.number}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    <Badge variant="secondary">{standard.year}</Badge>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{standard.title}</h3>
                <p className="text-sm text-gray-600">{standard.description}</p>
              </div>
              <a
                href={standard.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-purple-600 hover:text-purple-800 text-sm font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                IEC Dokument
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle>Weitere Ressourcen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <a
            href="https://www.iec.ch/homepage"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-purple-600 hover:text-purple-800"
          >
            <ExternalLink className="h-4 w-4" />
            IEC Homepage
          </a>
          <a
            href="https://webstore.iec.ch"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-purple-600 hover:text-purple-800"
          >
            <ExternalLink className="h-4 w-4" />
            IEC Webstore - Standards kaufen
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
