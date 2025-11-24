import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Globe, 
  Search, 
  Filter,
  FileText,
  Zap,
  CheckCircle,
  TrendingUp,
  Award,
  Calendar,
  Building2,
  Users,
  Hash
} from "@/components/icons";

interface Patent {
  id: string;
  patentNumber: string;
  title: string;
  abstract: string;
  applicant: string;
  inventors: string;
  jurisdiction: string;
  filingDate: string;
  publicationDate: string;
  grantDate: string | null;
  status: string;
  deviceType: string;
  riskClass: string;
  source: string;
}

export default function Patents() {
  const [patents, setPatents] = useState<Patent[]>([]);
  const [filtered, setFiltered] = useState<Patent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatents();
  }, []);

  useEffect(() => {
    filterPatents();
  }, [searchTerm, selectedJurisdiction, selectedStatus, patents]);

  const fetchPatents = async () => {
    try {
      setLoading(true);
      // Fetch real patents from worldwide sources
      const response = await fetch('/api/patents/real');
      const data = await response.json();
      console.log('Patent API Response:', data);
      setPatents(data.patents || []);
    } catch (error) {
      console.error('Error fetching patents:', error);
      // Fallback to empty array
      setPatents([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPatents = () => {
    let results = patents;

    if (searchTerm) {
      results = results.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.abstract.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.applicant.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedJurisdiction) {
      results = results.filter(p => p.jurisdiction === selectedJurisdiction);
    }

    if (selectedStatus) {
      results = results.filter(p => p.status === selectedStatus);
    }

    setFiltered(results);
  };

  const jurisdictions = Array.from(new Set(patents.map(p => p.jurisdiction)));
  const statuses = Array.from(new Set(patents.map(p => p.status)));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'granted': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Class I': return 'text-blue-600';
      case 'Class II': return 'text-yellow-600';
      case 'Class III': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Globe className="h-8 w-8" />
              Global Patents Database
            </h1>
            <p className="text-blue-100 text-lg">
              Weltweite Medtech- und Pharma-Patente • USPTO, EPO, WIPO, JPO • Echtzeit-Updates
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold mb-2">{filtered.length}</div>
            <div className="text-blue-100">Patente gefunden</div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Patent durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <select
            value={selectedJurisdiction}
            onChange={(e) => setSelectedJurisdiction(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm"
          >
            <option value="">Alle Jurisdiktionen</option>
            {jurisdictions.map(j => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm"
          >
            <option value="">Alle Status</option>
            {statuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <Button onClick={fetchPatents} className="bg-blue-600 hover:bg-blue-700">
          <Zap className="h-4 w-4 mr-2" />
          Aktualisieren
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Patente</CardTitle>
            <FileText className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{patents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bewilligt</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{patents.filter(p => p.status === 'granted').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ausstehend</CardTitle>
            <TrendingUp className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{patents.filter(p => p.status === 'pending').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jurisdiktionen</CardTitle>
            <Globe className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{jurisdictions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Patents List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Keine Patente gefunden</p>
          </Card>
        ) : (
          filtered.map(patent => (
            <Card key={patent.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-blue-900">{patent.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{patent.abstract}</p>
                    </div>
                    <Badge className={getStatusColor(patent.status)}>
                      {patent.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Hash className="h-4 w-4" />
                        Patent Nr.
                      </div>
                      <p className="font-mono text-sm font-bold">{patent.patentNumber}</p>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        Anmelder
                      </div>
                      <p className="text-sm font-medium">{patent.applicant}</p>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        Jurisdiktion
                      </div>
                      <p className="text-sm font-bold">{patent.jurisdiction}</p>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Award className={`h-4 w-4 ${getRiskColor(patent.riskClass)}`} />
                        Risikoklasse
                      </div>
                      <p className={`text-sm font-bold ${getRiskColor(patent.riskClass)}`}>
                        {patent.riskClass}
                      </p>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Anmeldung
                      </div>
                      <p className="text-sm">{new Date(patent.filingDate).toLocaleDateString('de-DE')}</p>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Veröffentlicht
                      </div>
                      <p className="text-sm">{new Date(patent.publicationDate).toLocaleDateString('de-DE')}</p>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Gerätetyp
                      </div>
                      <p className="text-sm font-medium">{patent.deviceType}</p>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Erfinder
                      </div>
                      <p className="text-sm">{patent.inventors.split(';')[0].trim()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
