import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Globe, FileText } from "@/components/icons";

interface Standard {
  number: string;
  year: string;
  title: string;
  description: string;
  url: string;
}

const enStandards: Standard[] = [
  {
    number: "EN 556-1",
    year: "2024",
    title: "Sterilität: Anforderungen an als 'STERIL' gekennzeichnete Produkte",
    description: "Requirements for terminally sterilized medical devices",
    url: "https://connect.snv.ch/de/sn-en-556-1-2024"
  },
  {
    number: "EN 868-5",
    year: "2018",
    title: "Verpackungen für Medizinprodukte: Klarsichtbeutel/Siegelung",
    description: "Packaging for terminally sterilized medical devices - Heat-sealable pouches",
    url: "https://connect.snv.ch/de/din-en-868-5-2019"
  }
];

export default function ENStandards() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Globe className="h-8 w-8 text-blue-600" />
            EN Standards für Medizinprodukte
          </h1>
          <p className="text-gray-600 mt-2">
            Europäische Normen (European Standards)
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {enStandards.length} Standards
        </Badge>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Über EN Standards</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <p>
            EN-Standards sind europäische Normen, die vom CEN (European Committee for Standardization) 
            entwickelt werden. Sie sind in allen EU-Mitgliedstaaten harmonisiert und unterstützen 
            die Konformität mit EU-Verordnungen wie der MDR.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {enStandards.map((standard) => (
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
                EN Standard Dokument
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
            href="https://www.cencenelec.eu"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="h-4 w-4" />
            CEN-CENELEC Homepage
          </a>
          <a
            href="https://www.en-standard.eu"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="h-4 w-4" />
            EN Standards Portal
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
