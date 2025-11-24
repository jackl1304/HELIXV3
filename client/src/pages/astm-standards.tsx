import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileSearch, FileText } from "@/components/icons";

interface Standard {
  number: string;
  year: string;
  title: string;
  description: string;
  url: string;
}

const astmStandards: Standard[] = [
  {
    number: "ASTM E1837-96",
    year: "2014",
    title: "Desinfektionsprozess: Simulated Use Test",
    description: "Standard Practice for Determining Reusable Medical Device Cleanability",
    url: "https://store.astm.org/e1837-96r14.html"
  },
  {
    number: "ASTM F1886/F1886M",
    year: "2024",
    title: "Integrität Siegel: flexible Verpackung",
    description: "Test Method for Determining Integrity of Seals for Flexible Packaging",
    url: "https://store.astm.org/f1886_f1886m-16r24.html"
  },
  {
    number: "ASTM F899-23",
    year: "2023",
    title: "Edelstahlsorten für chirurgische Instrumente",
    description: "Specification for Stainless Steel Surgical Instruments",
    url: "https://store.astm.org/f0899-23.html"
  }
];

export default function ASTMStandards() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileSearch className="h-8 w-8 text-green-600" />
            ASTM Standards für Medizinprodukte
          </h1>
          <p className="text-gray-600 mt-2">
            Standards der American Society for Testing and Materials
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {astmStandards.length} Standards
        </Badge>
      </div>

      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-900">Über ASTM Standards</CardTitle>
        </CardHeader>
        <CardContent className="text-green-800">
          <p>
            ASTM International entwickelt technische Standards für Materialien, Produkte, 
            Systeme und Dienstleistungen. Die ASTM-Standards für Medizinprodukte decken 
            Prüfverfahren, Materialspezifikationen und Qualitätsanforderungen ab.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {astmStandards.map((standard) => (
          <Card key={standard.number} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
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
                className="flex items-center gap-2 text-green-600 hover:text-green-800 text-sm font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                ASTM Store
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
            href="https://www.astm.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-green-600 hover:text-green-800"
          >
            <ExternalLink className="h-4 w-4" />
            ASTM International Homepage
          </a>
          <a
            href="https://store.astm.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-green-600 hover:text-green-800"
          >
            <ExternalLink className="h-4 w-4" />
            ASTM Store - Standards kaufen
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
