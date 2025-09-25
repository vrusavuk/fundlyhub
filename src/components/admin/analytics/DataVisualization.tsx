import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalFundraisers: number;
  activeFundraisers: number;
  totalDonations: number;
  totalRaised: number;
  averageDonation: number;
  conversionRate: number;
  userGrowthRate: number;
  revenueGrowthRate: number;
}

interface DataVisualizationProps {
  data: AnalyticsData;
  period: '7d' | '30d' | '90d' | '1y';
  focus?: 'overview' | 'users' | 'campaigns' | 'donations';
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function DataVisualization({ data, period, focus = 'overview' }: DataVisualizationProps) {
  // Generate mock time series data based on period
  const timeSeriesData = useMemo(() => {
    const points = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - points);
    
    return Array.from({ length: points }, (_, i) => {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      
      // Generate realistic-looking mock data with trends
      const dayFactor = Math.sin((i / points) * Math.PI * 2) * 0.3 + 1;
      const randomFactor = 0.8 + Math.random() * 0.4;
      
      return {
        date: date.toISOString().split('T')[0],
        users: Math.floor((data.totalUsers / points) * dayFactor * randomFactor),
        donations: Math.floor((data.totalDonations / points) * dayFactor * randomFactor),
        raised: Math.floor((data.totalRaised / points) * dayFactor * randomFactor),
        campaigns: Math.floor((data.totalFundraisers / points) * dayFactor * randomFactor),
      };
    });
  }, [data, period]);

  const categoryData = useMemo(() => [
    { name: 'Medical', value: 35, campaigns: 245, raised: 125000 },
    { name: 'Education', value: 28, campaigns: 189, raised: 89000 },
    { name: 'Emergency', value: 20, campaigns: 156, raised: 156000 },
    { name: 'Animal', value: 12, campaigns: 78, raised: 45000 },
    { name: 'Business', value: 5, campaigns: 34, raised: 23000 },
  ], []);

  const performanceData = useMemo(() => [
    { metric: 'User Engagement', current: 78, target: 85 },
    { metric: 'Campaign Success Rate', current: 64, target: 70 },
    { metric: 'Conversion Rate', current: data.conversionRate, target: 8 },
    { metric: 'Average Donation Growth', current: 15, target: 20 },
    { metric: 'Platform Health', current: 92, target: 95 },
  ], [data.conversionRate]);

  const formatXAxisTick = (tickItem: string) => {
    const date = new Date(tickItem);
    if (period === '7d') {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (period === '30d') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (period === '90d') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short' });
    }
  };

  if (focus === 'users') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Growth Trend</CardTitle>
            <CardDescription>New user registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatXAxisTick}
                  fontSize={12}
                />
                <YAxis fontSize={12} />
                <Tooltip 
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value: number) => [value.toLocaleString(), 'New Users']}
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Engagement Metrics</CardTitle>
            <CardDescription>Key performance indicators for user activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Daily Active Users', value: Math.floor(data.activeUsers * 0.1), total: data.activeUsers },
              { label: 'Weekly Active Users', value: Math.floor(data.activeUsers * 0.4), total: data.activeUsers },
              { label: 'Monthly Active Users', value: data.activeUsers, total: data.totalUsers },
            ].map((metric) => (
              <div key={metric.label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{metric.label}</span>
                  <span>{metric.value.toLocaleString()} / {metric.total.toLocaleString()}</span>
                </div>
                <Progress value={(metric.value / metric.total) * 100} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (focus === 'campaigns') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Categories</CardTitle>
            <CardDescription>Distribution of campaigns by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value}%)`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}%`, 'Percentage']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>Success rates and funding by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'raised' ? `$${value.toLocaleString()}` : value.toLocaleString(), 
                    name === 'raised' ? 'Total Raised' : 'Campaigns'
                  ]}
                />
                <Legend />
                <Bar dataKey="campaigns" fill="hsl(var(--primary))" name="Campaigns" />
                <Bar dataKey="raised" fill="hsl(var(--secondary))" name="Total Raised ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (focus === 'donations') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Donation Trends</CardTitle>
            <CardDescription>Daily donation amounts and counts</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatXAxisTick}
                  fontSize={12}
                />
                <YAxis fontSize={12} />
                <Tooltip 
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value: number, name: string) => [
                    name === 'raised' ? `$${value.toLocaleString()}` : value.toLocaleString(),
                    name === 'raised' ? 'Amount Raised' : 'Donations'
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="donations" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Donations"
                />
                <Line 
                  type="monotone" 
                  dataKey="raised" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  name="Amount Raised ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Donation Insights</CardTitle>
            <CardDescription>Key metrics and patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">${data.averageDonation.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Average Donation</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{data.conversionRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Conversion Rate</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Small Donations (&lt; $50)</span>
                  <span>65%</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Medium Donations ($50-$200)</span>
                  <span>25%</span>
                </div>
                <Progress value={25} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Large Donations (&gt; $200)</span>
                  <span>10%</span>
                </div>
                <Progress value={10} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Overview mode
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Growth</CardTitle>
            <CardDescription>Key metrics over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatXAxisTick}
                  fontSize={12}
                />
                <YAxis fontSize={12} />
                <Tooltip 
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Users"
                />
                <Line 
                  type="monotone" 
                  dataKey="campaigns" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  name="Campaigns"
                />
                <Line 
                  type="monotone" 
                  dataKey="donations" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={2}
                  name="Donations"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Goals</CardTitle>
            <CardDescription>Progress towards key objectives</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {performanceData.map((item) => (
              <div key={item.metric} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{item.metric}</span>
                  <div className="flex items-center gap-2">
                    <span>{item.current}%</span>
                    <Badge variant={item.current >= item.target ? 'default' : 'secondary'}>
                      Target: {item.target}%
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={Math.min((item.current / item.target) * 100, 100)} 
                  className="h-2" 
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
          <CardDescription>Daily revenue and donation patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxisTick}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip 
                labelFormatter={(label) => `Date: ${label}`}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
              />
              <Area 
                type="monotone" 
                dataKey="raised" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary))" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}