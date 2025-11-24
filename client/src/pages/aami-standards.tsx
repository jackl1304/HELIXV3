import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, CheckCircle, FileText } from "@/components/icons";

interface Standard {
  number: string;
  year: string;
  title: string;
  description: string;
  url: string;
}

const aamiStandards: Standard[] = [
  {
    number: "AAMI TIR30",
    year: "2016",
    title: "Reinigungsprozesse für wiederverwendbare Medizinprodukte",
    description: "A compendium of processes, materials, test methods, and acceptance criteria",
    url: "https://webstore.ansi.org/standards/aami/aamitir302011r2016"
  },
  {
    number: "ANSI/AAMI ST98",
    year: "2022",
    title: "Validierung von Reinigungsprozessen",
    description: "Biological evaluation of medical devices - Part 18: Chemical characterization of medical device materials",
    url: "https://webstore.ansi.org/standards/aami/ansiaamist982022"
  }
];

export default function AAMIStandards() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-teal-600" />
            AAMI Standards für Medizinprodukte
          </h1>
          <p className="text-gray-600 mt-2">
            Standards der Association for the Advancement of Medical Instrumentation
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {aamiStandards.length} Standards
        </Badge>
      </div>

      <Card className="bg-teal-50 border-teal-200">
        <CardHeader>
          <CardTitle className="text-teal-900">Über AAMI Standards</CardTitle>
        </CardHeader>
        <CardContent className="text-teal-800">
          <p>
            AAMI entwickelt Standards für medizinische Geräte und Verfahren mit Fokus auf 
            Sicherheit und Wirksamkeit. Die Standards decken Bereiche wie Sterilisation, 
            Reinigung und biologische Bewertung ab.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {aamiStandards.map((standard) => (
          <Card key={standard.number} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-teal-600" />
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
                className="flex items-center gap-2 text-teal-600 hover:text-teal-800 text-sm font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                ANSI Webstore
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
            href="https://www.aami.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-teal-600 hover:text-teal-800"
          >
            <ExternalLink className="h-4 w-4" />
            AAMI Homepage
          </a>
          <a
            href="https://webstore.ansi.org/industry/medical-devices"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-teal-600 hover:text-teal-800"
          >
            <ExternalLink className="h-4 w-4" />
            ANSI Webstore - Medical Devices
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
