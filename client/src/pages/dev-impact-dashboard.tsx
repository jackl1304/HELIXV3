import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Code, Package, FileText, Wrench, AlertCircle, TrendingUp } from "@/components/icons";
import { useState } from "react";
import type { RegulatoryUpdate } from "@db/schema";

export default function DevImpactDashboard() {
  const [impactFilter, setImpactFilter] = useState<string>("all");

  const { data: updates, isLoading } = useQuery<RegulatoryUpdate[]>({
    queryKey: ["/api/regulatory-updates"],
    queryFn: async () => {
      const res = await fetch("/api/regulatory-updates?limit=100");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Categorize by impact type
  const softwareImpact = updates?.filter(u =>
    u.impactedProcesses?.some((p: string) => p.toLowerCase().includes('software') || p.toLowerCase().includes('code'))
  ) || [];

  const processImpact = updates?.filter(u =>
    u.impactedProcesses && u.impactedProcesses.length > 0
  ) || [];

  const standardUpdates = updates?.filter(u =>
    u.type === 'standard' || u.category?.includes('standard')
  ) || [];

  const technicalGuidance = updates?.filter(u =>
    u.type === 'guidance' || u.title.toLowerCase().includes('guidance') || u.title.toLowerCase().includes('technical')
  ) || [];

  // Implementation Complexity Analysis
  const highComplexity = updates?.filter(u =>
    u.priority <= 2 && u.actionRequired
  ) || [];

  const mediumComplexity = updates?.filter(u =>
    u.priority === 3 && u.actionRequired
  ) || [];

  const lowComplexity = updates?.filter(u =>
    u.priority >= 4 || !u.actionRequired
  ) || [];

  const getImpactBadgeColor = (priority: number) => {
    if (priority === 1) return 'destructive';
    if (priority === 2) return 'default';
    if (priority === 3) return 'secondary';
    return 'outline';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Developer Impact Dashboard</h1>
          <p className="text-muted-foreground">Technical Implementation & Process Changes</p>
        </div>
      </div>

      {/* Impact Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Code className="h-4 w-4" />
              Software Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{softwareImpact.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Code changes required</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Process Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{processImpact.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Workflow adjustments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Standards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{standardUpdates.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Standard updates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Technical Guidance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{technicalGuidance.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Implementation guides</p>
          </CardContent>
        </Card>
      </div>

      {/* Implementation Complexity Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Implementation Complexity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-red-900">High Complexity</h3>
              </div>
              <div className="text-2xl font-bold text-red-600 mb-1">{highComplexity.length}</div>
              <p className="text-sm text-muted-foreground">Major refactoring, architecture changes</p>
            </div>

            <div className="p-4 border-2 border-yellow-200 rounded-lg bg-yellow-50">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-900">Medium Complexity</h3>
              </div>
              <div className="text-2xl font-bold text-yellow-600 mb-1">{mediumComplexity.length}</div>
              <p className="text-sm text-muted-foreground">Module updates, config changes</p>
            </div>

            <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Low Complexity</h3>
              </div>
              <div className="text-2xl font-bold text-green-600 mb-1">{lowComplexity.length}</div>
              <p className="text-sm text-muted-foreground">Documentation, minor tweaks</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="software" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="software">Software Impact</TabsTrigger>
          <TabsTrigger value="process">Process Changes</TabsTrigger>
          <TabsTrigger value="standards">Standards</TabsTrigger>
          <TabsTrigger value="guidance">Technical Guidance</TabsTrigger>
        </TabsList>

        <TabsContent value="software" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Software Development Impact</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : softwareImpact.length === 0 ? (
                <Alert>
                  <AlertDescription>No software-specific regulatory updates found</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {softwareImpact.map((update) => (
                    <div key={update.id} className="p-4 border rounded-lg hover:bg-accent transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{update.title}</h4>
                        <Badge variant={getImpactBadgeColor(update.priority)}>P{update.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{update.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {update.impactedProcesses?.map((process: string, idx: number) => (
                          <Badge key={idx} variant="outline">
                            <Code className="h-3 w-3 mr-1" />
                            {process}
                          </Badge>
                        ))}
                      </div>
                      {update.sourceUrl && (
                        <a
                          href={update.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline mt-2 inline-block"
                        >
                          View Source →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="process" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Process & Workflow Changes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : processImpact.length === 0 ? (
                <Alert>
                  <AlertDescription>No process impact identified</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {processImpact.map((update) => (
                    <div key={update.id} className="p-4 border rounded-lg hover:bg-accent transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{update.title}</h4>
                        <div className="flex gap-2">
                          <Badge variant={getImpactBadgeColor(update.priority)}>P{update.priority}</Badge>
                          <Badge variant="outline">{update.jurisdiction}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{update.description}</p>
                      {update.impactedProcesses && update.impactedProcesses.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Impacted Processes:</h5>
                          <div className="flex flex-wrap gap-2">
                            {update.impactedProcesses.map((process: string, idx: number) => (
                              <Badge key={idx} variant="secondary">
                                <Wrench className="h-3 w-3 mr-1" />
                                {process}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="standards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Standard Updates & Revisions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : standardUpdates.length === 0 ? (
                <Alert>
                  <AlertDescription>No standard updates available</AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Standard</th>
                        <th className="text-left p-2 font-medium">Type</th>
                        <th className="text-left p-2 font-medium">Priority</th>
                        <th className="text-left p-2 font-medium">Published</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standardUpdates.map((update) => (
                        <tr key={update.id} className="border-b hover:bg-accent">
                          <td className="p-2">
                            <a href={update.sourceUrl || '#'} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {update.title}
                            </a>
                          </td>
                          <td className="p-2">
                            <Badge variant="outline">{update.type}</Badge>
                          </td>
                          <td className="p-2">
                            <Badge variant={getImpactBadgeColor(update.priority)}>P{update.priority}</Badge>
                          </td>
                          <td className="p-2 text-sm text-muted-foreground">
                            {update.publishedDate ? new Date(update.publishedDate).toLocaleDateString('de-DE') : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guidance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical Guidance & Implementation Help</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : technicalGuidance.length === 0 ? (
                <Alert>
                  <AlertDescription>No technical guidance documents available</AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {technicalGuidance.map((update) => (
                    <Card key={update.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base line-clamp-2">{update.title}</CardTitle>
                          <Badge variant="outline">{update.jurisdiction}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{update.description}</p>
                        <div className="flex justify-between items-center">
                          <Badge variant={getImpactBadgeColor(update.priority)}>P{update.priority}</Badge>
                          {update.sourceUrl && (
                            <a
                              href={update.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Read Guide →
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
