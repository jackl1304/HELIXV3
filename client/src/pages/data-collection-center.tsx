import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  RefreshCw as Sync,
  Shield,
  Activity,
  Globe,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Settings,
  Eye
} from "@/components/icons";
import { useToast } from "@/hooks/use-toast";

function DataCollectionCenter() {
  const { toast } = useToast(); // Initialize toast
  const queryClient = useQueryClient();
  const [lastSync, setLastSync] = useState(null); // State to track last sync time
  const [isSyncing, setIsSyncing] = useState(false); // State to track overall sync process

  // Data Sources Query
  const { data: dataSources = [] } = useQuery({
    queryKey: ['/api/data-sources'],
  });

  // Real-time sync status
  const { data: syncStatus = {} } = useQuery({
    queryKey: ['/api/sync-status'],
  });

  // Mutation for syncing all sources
  const { mutate: syncAllSources, isPending: isSyncingAll } = useMutation({
    mutationFn: async () => {
      console.log('Frontend: Starting sync for all active sources');
      setIsSyncing(true);

      try {
        const response = await fetch('/api/data-sources/sync-all', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Sync all error response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        let result;
        try {
          result = await response.json();
        } catch (error) {
          console.error('Failed to parse JSON response:', error);
          throw new Error('Invalid response format');
        }

        console.log('Frontend: Sync result:', result);

        // Refresh data sources after sync
        await queryClient.invalidateQueries({ queryKey: ['data-sources'] });
        await queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

      } catch (error: any) {
        console.error('Frontend: Sync all error:', error);
        toast({
          title: "Sync Failed",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsSyncing(false);
        // The original code intended to set lastSync here, but it's better to do it on success.
        // For now, we'll rely on the toast for feedback.
      }
    },
    onError: (error) => {
      console.error('Frontend: Sync all error in mutation:', error);
      // The toast is already handled within mutationFn, this onError might be redundant
      // or could be used for a different type of error not caught by mutationFn.
      // For now, we'll keep the toast within mutationFn for immediate feedback.
    }
  });


  return (
    <div className="space-y-6">
      {/* Header - EXACT wie Screenshots */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Database className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Data Collection Center</h1>
              <p className="text-gray-600 mt-1">Monitor and manage 70 global regulatory data sources with Executive-Controls</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-600">Auto-Sync</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Data Quality</span>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Live Monitoring</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center space-x-4">
        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => syncAllSources()} disabled={isSyncingAll}>
          {isSyncingAll ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V4C6.477 4 4 6.477 4 9h2zm2 5a6 6 0 006 6v2c3.313 0 6-2.687 6-6h-2a4 4 0 01-4-4H6z"></path>
              </svg>
              Syncing...
            </>
          ) : (
            <>
              <Sync className="w-4 h-4 mr-2" />
              Sync All Sources
            </>
          )}
        </Button>
        <Button variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Source
        </Button>
        <Button variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button className="py-2 px-1 border-b-2 border-blue-500 font-medium text-sm text-blue-600">
            Data Sources
          </button>
          <button className="py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700">
            Sync History
          </button>
          <button className="py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700">
            Settings
          </button>
        </nav>
      </div>

      {/* Regulatory Data Sources Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">⭐ Regulatorische Datenquellen</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">22 aktiv</span>
            <Badge variant="destructive" className="text-xs">19 Regulatorische Daten</Badge>
            <span className="text-sm text-gray-600">27 deaktiv</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* FDA Medical Device Databases */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">FDA Medical Device Databases</CardTitle>
                <Badge className="bg-blue-600 text-white text-xs">Aktiv</Badge>
              </div>
              <p className="text-xs text-gray-600">US - Regulatorisch</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-600">Global Standards</span>
                </div>
                <Button size="sm" variant="outline" className="text-xs px-2 py-1">
                  <Eye className="w-3 h-3 mr-1" />
                  Sync Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* WHO Global Atlas of Medical Devices */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">WHO Global Atlas of Medical Devices</CardTitle>
                <Badge className="bg-blue-600 text-white text-xs">Aktiv</Badge>
              </div>
              <p className="text-xs text-gray-600">Global - Standards</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-600">Global Standards</span>
                </div>
                <Button size="sm" variant="outline" className="text-xs px-2 py-1">
                  <Eye className="w-3 h-3 mr-1" />
                  Sync Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* MedTech Europe Regulatory Convergence */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">MedTech Europe Regulatory Convergence</CardTitle>
                <Badge className="bg-blue-600 text-white text-xs">Aktiv</Badge>
              </div>
              <p className="text-xs text-gray-600">EU - Compliance</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-600">Global Standards</span>
                </div>
                <Button size="sm" variant="outline" className="text-xs px-2 py-1">
                  <Eye className="w-3 h-3 mr-1" />
                  Sync Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* NCBI Global Regulation Framework */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">NCBI Global Regulation Framework</CardTitle>
                <Badge className="bg-green-600 text-white text-xs">Aktiv</Badge>
              </div>
              <p className="text-xs text-gray-600">Global - Standards</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-600">Global Standards</span>
                </div>
                <Button size="sm" variant="outline" className="text-xs px-2 py-1">
                  <Eye className="w-3 h-3 mr-1" />
                  Sync Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* IQVIA MedTech Compliance Blog */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">IQVIA MedTech Compliance Blog</CardTitle>
                <Badge className="bg-green-600 text-white text-xs">Aktiv</Badge>
              </div>
              <p className="text-xs text-gray-600">Global - Analyse</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-600">Global Standards</span>
                </div>
                <Button size="sm" variant="outline" className="text-xs px-2 py-1">
                  <Eye className="w-3 h-3 mr-1" />
                  Sync Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* MedBoard Regulatory Intelligence */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">MedBoard Regulatory Intelligence</CardTitle>
                <Badge variant="secondary" className="text-xs">Premium</Badge>
              </div>
              <p className="text-xs text-gray-600">Global - Dashboard</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-600">Global Standards</span>
                </div>
                <Button size="sm" variant="outline" className="text-xs px-2 py-1">
                  <Eye className="w-3 h-3 mr-1" />
                  Sync Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Newsletter Sources Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">⭐ Newsletter-Quellen</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">7 aktiv</span>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
              <Sync className="w-3 h-3 mr-1" />
              Newsletter Sync
            </Button>
            <span className="text-sm text-gray-600">7 gesamt</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* FDA News & Updates */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">FDA News & Updates</CardTitle>
                <Badge className="bg-blue-600 text-white text-xs">Aktiv</Badge>
              </div>
              <p className="text-xs text-gray-600">Neue Verweise täglich und neue Bekanntmachungen</p>
              <p className="text-xs text-gray-500">US - Regulatorisch</p>
            </CardHeader>
          </Card>

          {/* EMA Newsletter */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">EMA Newsletter</CardTitle>
                <Badge className="bg-green-600 text-white text-xs">Aktiv</Badge>
              </div>
              <p className="text-xs text-gray-600">Newsletter von einer großer med Behörde</p>
              <p className="text-xs text-gray-500">EU - Regulatorisch</p>
            </CardHeader>
          </Card>

          {/* MedTech Dive */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">MedTech Dive</CardTitle>
                <Badge className="bg-orange-600 text-white text-xs">Aktiv</Badge>
              </div>
              <p className="text-xs text-gray-600">Daily business coverage and business analysis briefings</p>
              <p className="text-xs text-gray-500">Global - Branchen</p>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Newsletter Sources Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">⭐ Newsletter-Quellen</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">7 aktiv</span>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
              <Sync className="w-3 h-3 mr-1" />
              Newsletter Sync
            </Button>
            <span className="text-sm text-gray-600">7 gesamt</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* FDA News & Updates */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">FDA News & Updates</CardTitle>
                <Badge className="bg-blue-600 text-white text-xs">Aktiv</Badge>
              </div>
              <p className="text-xs text-gray-600">Neue Verweise täglich und neue Bekanntmachungen</p>
              <p className="text-xs text-gray-500">US - Regulatorisch</p>
            </CardHeader>
          </Card>

          {/* EMA Newsletter */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">EMA Newsletter</CardTitle>
                <Badge className="bg-green-600 text-white text-xs">Aktiv</Badge>
              </div>
              <p className="text-xs text-gray-600">Newsletter von einer großer med Behörde</p>
              <p className="text-xs text-gray-500">EU - Regulatorisch</p>
            </CardHeader>
          </Card>

          {/* MedTech Dive */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">MedTech Dive</CardTitle>
                <Badge className="bg-orange-600 text-white text-xs">Aktiv</Badge>
              </div>
              <p className="text-xs text-gray-600">Daily business coverage and business analysis briefings</p>
              <p className="text-xs text-gray-500">Global - Branchen</p>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Recent Sync Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">FDA Historical Archive</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Recent - Type: regulatory - Last sync: 16.8.2025, 15:06:34</span>
              </div>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                <Sync className="w-3 h-3 mr-1" />
                Sync Now
              </Button>
            </div>
            <p className="text-xs text-gray-600 pl-7">https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DataCollectionCenter;