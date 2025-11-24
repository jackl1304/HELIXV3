import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar as CalendarIcon, AlertTriangle, CheckCircle, Clock, Filter } from "@/components/icons";
import { useState } from "react";
import type { RegulatoryUpdate } from "@db/schema";

export default function QMDashboard() {
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const { data: updates, isLoading } = useQuery<RegulatoryUpdate[]>({
    queryKey: ["/api/regulatory-updates", priorityFilter, riskFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (riskFilter !== "all") params.set("riskLevel", riskFilter);
      const res = await fetch(`/api/regulatory-updates?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Risk Matrix Calculation
  const riskMatrix = {
    critical: updates?.filter(u => u.riskLevel === 'critical').length || 0,
    high: updates?.filter(u => u.riskLevel === 'high').length || 0,
    medium: updates?.filter(u => u.riskLevel === 'medium').length || 0,
    low: updates?.filter(u => u.riskLevel === 'low').length || 0,
  };

  // Action Required Items
  const actionItems = updates?.filter(u => u.actionRequired) || [];

  // Deadline Analysis
  const upcomingDeadlines = updates?.filter(u => {
    if (!u.complianceDeadline) return false;
    const deadline = new Date(u.complianceDeadline);
    const now = new Date();
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 90 && diffDays >= 0;
  }).sort((a, b) => {
    const aDate = new Date(a.complianceDeadline!).getTime();
    const bDate = new Date(b.complianceDeadline!).getTime();
    return aDate - bDate;
  }) || [];

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityBadgeColor = (priority: number) => {
    if (priority === 1) return 'destructive';
    if (priority === 2) return 'default';
    return 'secondary';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">QM Regulatory Dashboard</h1>
          <p className="text-muted-foreground">Compliance Monitoring & Risk Management</p>
        </div>
        <div className="flex gap-2">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="1">Critical (P1)</SelectItem>
              <SelectItem value="2">High (P2)</SelectItem>
              <SelectItem value="3">Medium (P3)</SelectItem>
              <SelectItem value="4">Low (P4)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Risk Matrix Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Critical Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{riskMatrix.critical}</div>
            <p className="text-xs text-muted-foreground mt-1">Immediate action required</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              High Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{riskMatrix.high}</div>
            <p className="text-xs text-muted-foreground mt-1">Priority review needed</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              Medium Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{riskMatrix.medium}</div>
            <p className="text-xs text-muted-foreground mt-1">Monitor closely</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Low Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{riskMatrix.low}</div>
            <p className="text-xs text-muted-foreground mt-1">Standard review</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Action Required ({actionItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : actionItems.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>No immediate actions required</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {actionItems.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium line-clamp-2">{item.title}</h4>
                      <Badge variant={getRiskBadgeColor(item.riskLevel)}>
                        {item.riskLevel}
                      </Badge>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <Badge variant={getPriorityBadgeColor(item.priority)}>
                        P{item.priority}
                      </Badge>
                      <Badge variant="outline">{item.jurisdiction}</Badge>
                    </div>
                    {item.complianceDeadline && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        Deadline: {new Date(item.complianceDeadline).toLocaleDateString('de-DE')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deadline Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
            <div className="mt-4 space-y-2">
              <h4 className="font-medium text-sm">Next 90 Days ({upcomingDeadlines.length})</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {upcomingDeadlines.slice(0, 5).map((item) => (
                  <div key={item.id} className="text-sm p-2 bg-accent rounded">
                    <div className="font-medium line-clamp-1">{item.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {new Date(item.complianceDeadline!).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Updates Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Regulatory Updates</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Title</th>
                    <th className="text-left p-2 font-medium">Priority</th>
                    <th className="text-left p-2 font-medium">Risk</th>
                    <th className="text-left p-2 font-medium">Jurisdiction</th>
                    <th className="text-left p-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {updates?.slice(0, 20).map((update) => (
                    <tr key={update.id} className="border-b hover:bg-accent">
                      <td className="p-2">
                        <a href={update.sourceUrl || '#'} target="_blank" rel="noopener noreferrer" className="hover:underline line-clamp-1">
                          {update.title}
                        </a>
                      </td>
                      <td className="p-2">
                        <Badge variant={getPriorityBadgeColor(update.priority)}>
                          P{update.priority}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge variant={getRiskBadgeColor(update.riskLevel)}>
                          {update.riskLevel}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">{update.jurisdiction}</Badge>
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
    </div>
  );
}
