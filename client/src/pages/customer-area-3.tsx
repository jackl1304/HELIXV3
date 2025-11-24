import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, Lock } from "@/components/icons";

export default function CustomerArea3() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Bereich 3</h1>
        <p className="text-gray-600">Spezialisierter Kundenbereich - Details folgen</p>
      </div>

      <Card className="border-2 border-indigo-300">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg">
              <Layers className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Bereich 3
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Beschreibung folgt in Kürze
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="p-6 bg-indigo-50 rounded-xl border border-indigo-200">
              <h3 className="font-semibold text-indigo-900 mb-2">Informationen</h3>
              <p className="text-sm text-indigo-700">
                Dieser Bereich wird derzeit konfiguriert. Detaillierte Funktionen und Inhalte werden in Kürze verfügbar sein.
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-gray-500">
              <Lock className="h-5 w-5" />
              <span className="text-sm">Weitere Details folgen</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
