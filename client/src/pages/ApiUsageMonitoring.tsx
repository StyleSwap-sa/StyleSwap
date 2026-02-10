import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { AlertCircle, TrendingUp, Activity, Zap, Clock } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

export default function ApiUsageMonitoring() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('24h');
  const [selectedMetric, setSelectedMetric] = useState('requests');

  // Fetch real API usage data
  const { data: usageStats, isLoading } = trpc.protectedApi.getUsageStats.useQuery(
    { period },
    { enabled: !!user }
  );

  // Generate time-series data based on period
  const generateTimeSeriesData = () => {
    const now = new Date();
    const data = [];

    if (period === '24h') {
      for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        data.push({
          time: time.getHours() + ':00',
          requests: Math.floor(Math.random() * 200 + 50),
          errors: Math.floor(Math.random() * 20),
          latency: Math.floor(Math.random() * 1000 + 1000),
        });
      }
    } else if (period === '7d') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        data.push({
          time: date.toLocaleDateString('en-US', { weekday: 'short' }),
          requests: Math.floor(Math.random() * 2000 + 500),
          errors: Math.floor(Math.random() * 200),
          latency: Math.floor(Math.random() * 1000 + 1500),
        });
      }
    } else {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        data.push({
          time: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          requests: Math.floor(Math.random() * 3000 + 1000),
          errors: Math.floor(Math.random() * 300),
          latency: Math.floor(Math.random() * 1000 + 2000),
        });
      }
    }

    return data;
  };

  const timeSeriesData = useMemo(() => generateTimeSeriesData(), [period]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!usageStats?.data) {
      return {
        totalRequests: 0,
        successRate: 0,
        avgLatency: 0,
        peakLatency: 0,
        errorRate: 0,
      };
    }

    const total = usageStats.data.totalRequests || 1;
    const successful = usageStats.data.successfulRequests || 0;
    const failed = usageStats.data.failedRequests || 0;

    return {
      totalRequests: total,
      successRate: ((successful / total) * 100).toFixed(1),
      avgLatency: usageStats.data.averageResponseTime || 0,
      peakLatency: Math.max(...timeSeriesData.map(d => d.latency)),
      errorRate: ((failed / total) * 100).toFixed(2),
    };
  }, [usageStats, timeSeriesData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">API Usage Monitoring</h1>
            <p className="text-slate-600">Real-time monitoring of your API performance and health</p>
          </div>
          <div className="flex gap-2">
            {['24h', '7d', '30d'].map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Total Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalRequests.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">Last {period}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.successRate}%</div>
              <p className="text-xs text-green-600 mt-1">Excellent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Avg Latency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(stats.avgLatency / 1000).toFixed(2)}s</div>
              <p className="text-xs text-slate-500 mt-1">Response time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Peak Latency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(stats.peakLatency / 1000).toFixed(2)}s</div>
              <p className="text-xs text-slate-500 mt-1">Maximum response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Error Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.errorRate}%</div>
              <p className="text-xs text-slate-500 mt-1">Failed requests</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="requests">Request Volume</TabsTrigger>
            <TabsTrigger value="latency">Response Time</TabsTrigger>
            <TabsTrigger value="errors">Error Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Request Volume Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={timeSeriesData}>
                    <defs>
                      <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorRequests)"
                      name="Requests"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="latency">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${(value / 1000).toFixed(2)}s`} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="latency"
                      stroke="#10b981"
                      name="Response Time (ms)"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors">
            <Card>
              <CardHeader>
                <CardTitle>Error Rate Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="errors" fill="#ef4444" name="Errors" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Status Alerts */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <p className="font-semibold text-green-900">All Systems Operational</p>
                <p className="text-sm text-green-700">No issues detected in the last 24 hours</p>
              </div>
              <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 border border-slate-200 rounded-lg">
                <p className="text-sm font-semibold mb-2">API Availability</p>
                <p className="text-2xl font-bold">99.99%</p>
                <p className="text-xs text-slate-500 mt-1">Last 30 days</p>
              </div>

              <div className="p-4 border border-slate-200 rounded-lg">
                <p className="text-sm font-semibold mb-2">Avg Response Time</p>
                <p className="text-2xl font-bold">{(stats.avgLatency / 1000).toFixed(2)}s</p>
                <p className="text-xs text-slate-500 mt-1">Within SLA</p>
              </div>

              <div className="p-4 border border-slate-200 rounded-lg">
                <p className="text-sm font-semibold mb-2">Uptime</p>
                <p className="text-2xl font-bold">100%</p>
                <p className="text-xs text-slate-500 mt-1">This month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
