import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, Lock, AlertCircle } from "@/components/icons";
import { Badge } from "@/components/ui/badge";

export default function CustomerAreas() {
  const areas = [
    {
      id: 1,
      title: "Bereich 1",
      description: "Beschreibung folgt in Kürze",
      icon: Layers,
      color: "from-blue-500 to-blue-600",
      status: "In Vorbereitung"
    },
    {
      id: 2,
      title: "Bereich 2",
      description: "Beschreibung folgt in Kürze",
      icon: Layers,
      color: "from-purple-500 to-purple-600",
      status: "In Vorbereitung"
    },
    {
      id: 3,
      title: "Bereich 3",
      description: "Beschreibung folgt in Kürze",
      icon: Layers,
      color: "from-indigo-500 to-indigo-600",
      status: "In Vorbereitung"
    }
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Kundenbereiche</h1>
        <p className="text-gray-600">Zugang zu spezialisierten Bereichen für Ihre individuellen Anforderungen</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {areas.map((area) => {
          const IconComponent = area.icon;
          
          return (
            <Card 
              key={area.id} 
              className="hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 cursor-pointer group"
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${area.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {area.status}
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {area.title}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {area.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <AlertCircle className="h-4 w-4" />
                    <span>Weitere Details folgen</span>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <button 
                      disabled
                      className="w-full py-2 px-4 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Lock className="h-4 w-4" />
                      Noch nicht verfügbar
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Information</h3>
            <p className="text-sm text-blue-700">
              Die Kundenbereiche werden derzeit konfiguriert. Detaillierte Beschreibungen und Funktionen werden in Kürze verfügbar sein.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
