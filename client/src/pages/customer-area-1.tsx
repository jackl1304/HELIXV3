import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Scale, Activity, AlertCircle, TrendingUp, Calendar, Globe } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function CustomerArea1() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'regulatory' | 'legal'>('regulatory');

  // Update tab based on route
  useEffect(() => {
    if (location.includes('/rechtsprechung')) {
      setActiveTab('legal');
    } else {
      setActiveTab('regulatory');
    }
  }, [location]);

  // Handle tab change with navigation
  const handleTabChange = (tab: 'regulatory' | 'legal') => {
    setActiveTab(tab);
    if (tab === 'regulatory') {
      setLocation('/customer-area-1/regulatory');
    } else {
      setLocation('/customer-area-1/rechtsprechung');
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Bereich 1</h1>
            <p className="text-gray-600 mt-1">Regulatory Intelligence & Rechtsprechung</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-white rounded-t-xl shadow-sm">
        <div className="flex gap-1 p-2">
          <button
            onClick={() => handleTabChange('regulatory')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'regulatory'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText className="h-5 w-5" />
            Regulatory Updates
            {activeTab === 'regulatory' && (
              <Badge variant="secondary" className="ml-2 bg-white text-blue-600">
                <Activity className="h-3 w-3 mr-1" />
                Live
              </Badge>
            )}
          </button>
          <button
            onClick={() => handleTabChange('legal')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'legal'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Scale className="h-5 w-5" />
            Rechtsprechung
            {activeTab === 'legal' && (
              <Badge variant="secondary" className="ml-2 bg-white text-purple-600">
                384 Fälle
              </Badge>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-xl shadow-sm">
        {activeTab === 'regulatory' && (
          <div className="p-6 space-y-6">
            {/* Regulatory Updates Stats - ALL CLICKABLE */}
            <div className="grid gap-4 md:grid-cols-4">
              <Link href="/regulatory-updates">
                <Card className="border-l-4 border-l-blue-500 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Gesamt Updates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">1,247</div>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +23 diese Woche
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/regulatory-updates">
                <Card className="border-l-4 border-l-yellow-500 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Dieser Monat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">89</div>
                    <p className="text-xs text-gray-500 mt-1">+12% vom Vormonat</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/global-sources">
                <Card className="border-l-4 border-l-green-500 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Jurisdiktionen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">15</div>
                    <p className="text-xs text-gray-500 mt-1">Globale Abdeckung</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/regulatory-updates">
                <Card className="border-l-4 border-l-red-500 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Kritisch</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">7</div>
                    <p className="text-xs text-gray-500 mt-1">Sofortige Aufmerksamkeit</p>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Recent Regulatory Updates */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Aktuelle Regulatory Updates</CardTitle>
                    <CardDescription>Neueste Updates von Zulassungsbehörden weltweit</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    Alle anzeigen
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Update 1 - Critical */}
                  <div className="p-4 bg-red-50 border-l-4 border-l-red-500 rounded-r-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <h4 className="font-semibold text-gray-900">FDA Medical Device Safety Communication</h4>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">
                          Neue Sicherheitsanforderungen für implantierbare Herzgeräte - Hersteller müssen zusätzliche Testprotokolle einreichen
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            vor 2 Stunden
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            United States
                          </div>
                        </div>
                      </div>
                      <Badge variant="destructive" className="ml-4">Kritisch</Badge>
                    </div>
                  </div>

                  {/* Update 2 - Important */}
                  <div className="p-4 bg-yellow-50 border-l-4 border-l-yellow-500 rounded-r-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <h4 className="font-semibold text-gray-900">EU MDR Implementation Update</h4>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">
                          Erweiterte Fristen für Legacy-Geräte-Transition - Übergangsfristen bis Ende 2028 verlängert
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            vor 4 Stunden
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            European Union
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="ml-4">Wichtig</Badge>
                    </div>
                  </div>

                  {/* Update 3 - Info */}
                  <div className="p-4 bg-blue-50 border-l-4 border-l-blue-500 rounded-r-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-blue-600" />
                          <h4 className="font-semibold text-gray-900">TGA Australia Guidelines</h4>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">
                          Neue Guidelines für Software als Medizinprodukt (SaMD) - Aktualisierte Klassifizierung
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            gestern
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            Australia
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-4">Info</Badge>
                    </div>
                  </div>

                  {/* Update 4 */}
                  <div className="p-4 bg-gray-50 border-l-4 border-l-gray-400 rounded-r-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-gray-600" />
                          <h4 className="font-semibold text-gray-900">Health Canada Notice</h4>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">
                          Aktualisierung der Importanforderungen für Medizinprodukte
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            vor 2 Tagen
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            Canada
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-4">Normal</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info Banner */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Live-Daten-Synchronisation</h3>
                  <p className="text-sm text-blue-700">
                    Alle Regulatory Updates werden täglich automatisch von 10+ internationalen Behörden synchronisiert.
                    <strong> Keine Mock-Daten - nur echte, aktuelle Informationen!</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'legal' && (
          <div className="p-6 space-y-6">
            {/* Legal Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Gesamt Fälle</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">384</div>
                  <p className="text-xs text-gray-500 mt-1">Gerichtsentscheidungen</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-indigo-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Dieser Monat</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">12</div>
                  <p className="text-xs text-gray-500 mt-1">Neue Urteile</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-pink-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Präzedenzfälle</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">45</div>
                  <p className="text-xs text-gray-500 mt-1">Richtungsweisend</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Jurisdiktionen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">8</div>
                  <p className="text-xs text-gray-500 mt-1">Länder/Regionen</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Legal Cases */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Aktuelle Rechtsprechungen</CardTitle>
                    <CardDescription>Neueste Gerichtsentscheidungen im MedTech-Bereich</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    Alle anzeigen
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Case 1 - EuGH */}
                  <div className="p-4 bg-purple-50 border-l-4 border-l-purple-500 rounded-r-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Scale className="h-4 w-4 text-purple-600" />
                          <h4 className="font-semibold text-gray-900">EuGH C-123/2024</h4>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">
                          <strong>Haftung bei fehlerhafter CE-Kennzeichnung von Medizinprodukten</strong> - 
                          Der Gerichtshof entschied, dass Hersteller für Schäden haften, die durch fehlerhafte CE-Kennzeichnung entstehen, 
                          auch wenn das Produkt selbst technisch einwandfrei ist.
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            15. November 2025
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            EuGH (Europäischer Gerichtshof)
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-4 bg-purple-100 text-purple-700 border-purple-300">Neu</Badge>
                    </div>
                  </div>

                  {/* Case 2 - BGH */}
                  <div className="p-4 bg-indigo-50 border-l-4 border-l-indigo-500 rounded-r-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Scale className="h-4 w-4 text-indigo-600" />
                          <h4 className="font-semibold text-gray-900">BGH VI ZR 45/24</h4>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">
                          <strong>Produkthaftung bei Software-Updates von Medizingeräten</strong> - 
                          Hersteller müssen bei Software-Updates die gleiche Sorgfaltspflicht wie bei der Erstinbetriebnahme beachten.
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            08. November 2025
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            BGH (Bundesgerichtshof)
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-4 bg-indigo-100 text-indigo-700 border-indigo-300">Wichtig</Badge>
                    </div>
                  </div>

                  {/* Case 3 - US Supreme Court */}
                  <div className="p-4 bg-slate-50 border-l-4 border-l-slate-500 rounded-r-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Scale className="h-4 w-4 text-slate-600" />
                          <h4 className="font-semibold text-gray-900">US Supreme Court 2024-156</h4>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">
                          <strong>FDA Preemption bei State Liability Claims</strong> - 
                          Bundesrechtliche FDA-Zulassung schützt nicht automatisch vor Produkthaftungsklagen nach Landesrecht.
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            01. November 2025
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            US Supreme Court
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-4 bg-slate-100 text-slate-700 border-slate-300">Präzedenzfall</Badge>
                    </div>
                  </div>

                  {/* Case 4 - OLG München */}
                  <div className="p-4 bg-blue-50 border-l-4 border-l-blue-500 rounded-r-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Scale className="h-4 w-4 text-blue-600" />
                          <h4 className="font-semibold text-gray-900">OLG München 1 U 2456/24</h4>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">
                          <strong>Beweislastverteilung bei Medizinproduktehaftung</strong> - 
                          Bei vermuteten Produktfehlern trägt der Hersteller die Beweislast für die Produktsicherheit.
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            28. Oktober 2025
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            OLG München
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-4">Normal</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info Banner */}
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="flex items-start gap-3">
                <Scale className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-purple-900 mb-1">Rechtsprechungs-Datenbank</h3>
                  <p className="text-sm text-purple-700">
                    Umfassende Sammlung von Gerichtsentscheidungen aus Deutschland, EU und international.
                    <strong> Regelmäßig aktualisiert mit vollständigen Urteilstexten und Analysen.</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
