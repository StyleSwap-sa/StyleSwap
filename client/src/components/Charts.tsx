import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)'];

export function MarketGrowthChart() {
  const data = [
    { year: '2023', value: 104 },
    { year: '2025', value: 162 },
    { year: '2027', value: 256 },
    { year: '2030', value: 455 },
    { year: '2032', value: 630 },
  ];

  return (
    <Card className="neo-card h-full">
      <CardHeader>
        <CardTitle>Market Growth Projection (ZAR Billions)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
              <XAxis dataKey="year" stroke="var(--color-foreground)" />
              <YAxis stroke="var(--color-foreground)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-card)', 
                  border: '2px solid var(--color-border)',
                  boxShadow: '4px 4px 0px 0px var(--color-border)',
                  borderRadius: '0px'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="var(--color-primary)" 
                strokeWidth={4}
                dot={{ r: 6, fill: 'var(--color-background)', stroke: 'var(--color-border)', strokeWidth: 2 }}
                activeDot={{ r: 8, fill: 'var(--color-primary)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function PricingComparisonChart() {
  const data = [
    { name: 'StyleSwap', cost: 0.85, type: 'AI-Based' },
    { name: 'Competitor A', cost: 2.50, type: 'AR-Based' },
    { name: 'Competitor B', cost: 4.00, type: 'Enterprise' },
    { name: 'Competitor C', cost: 1.75, type: 'Mixed' },
  ];

  return (
    <Card className="neo-card h-full">
      <CardHeader>
        <CardTitle>Cost Per Try-On (ZAR)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
              <XAxis dataKey="name" stroke="var(--color-foreground)" />
              <YAxis stroke="var(--color-foreground)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-card)', 
                  border: '2px solid var(--color-border)',
                  boxShadow: '4px 4px 0px 0px var(--color-border)',
                  borderRadius: '0px'
                }} 
              />
              <Bar dataKey="cost" fill="var(--color-primary)">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--color-primary)' : 'var(--color-muted-foreground)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function FeatureComparisonChart() {
  const data = [
    { name: 'Apparel', value: 100 },
    { name: 'Footwear', value: 80 },
    { name: 'Accessories', value: 40 },
    { name: 'Beauty', value: 20 },
  ];

  return (
    <Card className="neo-card h-full">
      <CardHeader>
        <CardTitle>StyleSwap Capability Focus</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                stroke="var(--color-border)"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-card)', 
                  border: '2px solid var(--color-border)',
                  boxShadow: '4px 4px 0px 0px var(--color-border)',
                  borderRadius: '0px'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
