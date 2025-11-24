import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Globe, Calendar } from "@/components/icons";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { RegulatoryUpdate } from "@db/schema";

export default function ExecDashboard() {
  const { data: updates, isLoading } = useQuery<RegulatoryUpdate[]>({
    queryKey: ["/api/regulatory-updates"],
    queryFn: async () => {
      const res = await fetch("/api/regulatory-updates?limit=500");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // KPI Calculations
  const totalRegulations = updates?.length || 0;
  const highPriority = updates?.filter(u => u.priority <= 2).length || 0;
  const actionRequired = updates?.filter(u => u.actionRequired).length || 0;
  const criticalRisk = updates?.filter(u => u.riskLevel === 'critical').length || 0;

  // Compliance Score (0-100)
  const complianceScore = updates ? Math.max(0, 100 - (criticalRisk * 5) - (highPriority * 2)) : 0;

  // Jurisdictional Distribution
  const jurisdictionData = updates ? Object.entries(
    updates.reduce((acc, u) => {
      acc[u.jurisdiction] = (acc[u.jurisdiction] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })) : [];

  // Risk Distribution
  const riskData = [
    { name: 'Critical', value: updates?.filter(u => u.riskLevel === 'critical').length || 0, color: '#ef4444' },
    { name: 'High', value: updates?.filter(u => u.riskLevel === 'high').length || 0, color: '#f97316' },
    { name: 'Medium', value: updates?.filter(u => u.riskLevel === 'medium').length || 0, color: '#eab308' },
    { name: 'Low', value: updates?.filter(u => u.riskLevel === 'low').length || 0, color: '#22c55e' },
  ];

  // Monthly Trend (last 6 months)
  const monthlyTrend = updates ? (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = months[month.getMonth()];
      const count = updates.filter(u => {
        if (!u.publishedDate) return false;
        const d = new Date(u.publishedDate);
        return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
      }).length;
      data.push({ month: monthStr, count });
    }
    return data;
  })() : [];

  // Category Distribution
  const categoryData = updates ? Object.entries(
    updates.reduce((acc, u) => {
      const cat = u.category || 'general';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).slice(0, 8) : [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-300';
    if (score >= 60) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Executive Regulatory Dashboard</h1>
          <p className="text-muted-foreground">Strategic Oversight & Compliance KPIs</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          Last Updated: {new Date().toLocaleDateString('de-DE')}
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Regulations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalRegulations}</div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span>Active monitoring</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{highPriority}</div>
            <div className="text-sm text-muted-foreground mt-2">
              {((highPriority / Math.max(totalRegulations, 1)) * 100).toFixed(1)}% of total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Action Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{actionRequired}</div>
            <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span>Pending tasks</span>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${getScoreBgColor(complianceScore)}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(complianceScore)}`}>{complianceScore}</div>
            <Progress value={complianceScore} className="mt-2" />
            <div className="flex items-center gap-1 mt-2 text-sm">
              {complianceScore >= 80 ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">Excellent</span>
                </>
              ) : complianceScore >= 60 ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-yellow-600">Monitor</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-red-600">Urgent</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Regulatory Activity Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="New Regulations" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Risk Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jurisdictional Coverage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Jurisdictional Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={jurisdictionData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8b5cf6" name="Regulations" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown (Top 8)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Critical Issues Alert */}
      {criticalRisk > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="h-5 w-5" />
              Critical Risk Items ({criticalRisk})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {updates?.filter(u => u.riskLevel === 'critical').slice(0, 5).map((update) => (
                <div key={update.id} className="p-3 bg-white rounded border border-red-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium line-clamp-1">{update.title}</h4>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="destructive">P{update.priority}</Badge>
                        <Badge variant="outline">{update.jurisdiction}</Badge>
                      </div>
                    </div>
                    {update.complianceDeadline && (
                      <div className="text-sm text-red-600 font-medium">
                        Deadline: {new Date(update.complianceDeadline).toLocaleDateString('de-DE')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-blue-600">{jurisdictionData.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Jurisdictions</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-purple-600">{categoryData.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Categories</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-green-600">
                {updates?.filter(u => u.publishedDate && new Date(u.publishedDate) >= new Date(Date.now() - 30*24*60*60*1000)).length || 0}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Last 30 Days</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-orange-600">
                {updates?.filter(u => u.complianceDeadline && new Date(u.complianceDeadline) <= new Date(Date.now() + 90*24*60*60*1000)).length || 0}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Deadlines (90d)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
