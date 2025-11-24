import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Shield, FileText, Download } from "@/components/icons";

interface Standard {
  number: string;
  year: string;
  title: string;
  description: string;
  url: string;
}

const isoStandards: Standard[] = [
  {
    number: "ISO 14971",
    year: "2019",
    title: "Risikomanagement für Medizinprodukte",
    description: "Anwendung des Risikomanagements auf Medizinprodukte",
    url: "https://www.iso.org/standard/72704.html"
  },
  {
    number: "ISO/TR 24971",
    year: "2020",
    title: "Leitfaden zur Anwendung von ISO 14971",
    description: "Technischer Bericht mit Anwendungshinweisen",
    url: "https://www.iso.org/standard/74437.html"
  },
  {
    number: "ISO 13485",
    year: "2016",
    title: "Qualitätsmanagementsysteme für regulatorische Zwecke",
    description: "QM-System für Design, Entwicklung, Produktion und Vertrieb",
    url: "https://www.iso.org/standard/59752.html"
  },
  {
    number: "ISO 10993-1",
    year: "2018",
    title: "Biologische Bewertung von Medizinprodukten - Teil 1",
    description: "Bewertung und Prüfung im Risikomanagement-Prozess",
    url: "https://www.iso.org/standard/68936.html"
  },
  {
    number: "ISO 11137-1",
    year: "2024",
    title: "Sterilisation durch Strahlung - Teil 1",
    description: "Anforderungen an Entwicklung, Validierung und Routinekontrolle",
    url: "https://www.iso.org/standard/81721.html"
  },
  {
    number: "ISO 11737-1",
    year: "2018",
    title: "Mikrobiologische Methoden - Teil 1",
    description: "Bestimmung der Belastung mit Mikroorganismen",
    url: "https://www.iso.org/standard/66451.html"
  },
  {
    number: "ISO 11607-1",
    year: "2019",
    title: "Verpackung steriler Medizinprodukte - Teil 1",
    description: "Anforderungen an Materialien, Sterilbarrieresysteme",
    url: "https://www.iso.org/standard/70799.html"
  },
  {
    number: "ISO 16061",
    year: "2021",
    title: "Instrumente für nichtaktive Implantate",
    description: "Allgemeine Anforderungen",
    url: "https://www.iso.org/standard/74548.html"
  },
  {
    number: "ISO 20417",
    year: "2021",
    title: "Herstellerinformationen für Medizinprodukte",
    description: "Anforderungen an vom Hersteller bereitzustellende Informationen",
    url: "https://www.iso.org/standard/67943.html"
  },
  {
    number: "ISO 15223-1",
    year: "2021",
    title: "Symbole zur Herstellerinformation",
    description: "Allgemeine Anforderungen",
    url: "https://www.iso.org/standard/77326.html"
  },
  {
    number: "ISO 7153-1",
    year: "2016",
    title: "Metalle für chirurgische Instrumente",
    description: "Rostfreie Stähle",
    url: "https://www.iso.org/standard/66850.html"
  },
  {
    number: "ISO 14630",
    year: "2024",
    title: "Allgemeine Anforderungen für nichtaktive Implantate",
    description: "Nichtaktive chirurgische Implantate",
    url: "https://www.iso.org/standard/76810.html"
  },
  {
    number: "ISO 14937",
    year: "2009",
    title: "Sterilisation - Allgemeine Anforderungen",
    description: "Charakterisierung eines Sterilisiermittels und Entwicklung",
    url: "https://www.iso.org/standard/44954.html"
  },
  {
    number: "ISO 15883-5",
    year: "2021",
    title: "Prüfmethoden für Reinigung von Medizinprodukten",
    description: "Reinigungs-Desinfektionsgeräte",
    url: "https://www.iso.org/standard/68297.html"
  },
  {
    number: "ISO 11135",
    year: "2014",
    title: "Ethylenoxid-Sterilisation",
    description: "Anforderungen an Entwicklung, Validierung und Routineüberwachung",
    url: "https://www.iso.org/standard/56137.html"
  },
  {
    number: "ISO 14644-1",
    year: "2015",
    title: "Reinräume - Teil 1: Klassifizierung",
    description: "Klassifizierung der Luftreinheit anhand der Partikelkonzentration",
    url: "https://www.iso.org/standard/53394.html"
  },
  {
    number: "ISO 7000",
    year: "2019",
    title: "Grafische Symbole auf Geräten",
    description: "Verzeichnis grafischer Symbole",
    url: "https://www.iso.org/standard/78717.html"
  },
  {
    number: "ISO 7010",
    year: "2019",
    title: "Sicherheitsfarben und Zeichen",
    description: "Registrierte Sicherheitszeichen",
    url: "https://www.iso.org/standard/72424.html"
  }
];

export default function ISOStandards() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            ISO Standards für Medizinprodukte
          </h1>
          <p className="text-gray-600 mt-2">
            Internationale Standards der International Organization for Standardization
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {isoStandards.length} Standards
        </Badge>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Über ISO Standards</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <p>
            ISO-Standards sind international anerkannte Normen, die von der International Organization 
            for Standardization entwickelt werden. Sie definieren Anforderungen an Qualität, Sicherheit 
            und Leistung von Medizinprodukten.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isoStandards.map((standard) => (
          <Card key={standard.number} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
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
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                ISO.org Dokument
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
            href="https://www.iso.org/committee/54892.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="h-4 w-4" />
            ISO/TC 194 - Biological and clinical evaluation of medical devices
          </a>
          <a
            href="https://www.iso.org/committee/54996.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="h-4 w-4" />
            ISO/TC 210 - Quality management and general requirements
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
