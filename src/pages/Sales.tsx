import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

export default function Sales() {
  const { data: sales } = useQuery({
    queryKey: ["sales-with-products"],
    queryFn: async () => {
      const { data } = await supabase.from("sales").select("*, inventory(product_name)").order("sale_date");
      return data || [];
    },
  });

  // Monthly aggregation
  const monthlySales = sales?.reduce((acc: Record<string, { revenue: number; units: number }>, s) => {
    const month = s.sale_date.substring(0, 7);
    if (!acc[month]) acc[month] = { revenue: 0, units: 0 };
    acc[month].revenue += s.revenue;
    acc[month].units += s.units_sold;
    return acc;
  }, {});

  const chartData = Object.entries(monthlySales || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      revenue: Math.round((data as any).revenue),
      units: (data as any).units,
    }));

  // Simple linear forecast: add 2 future months
  const forecastData = [...chartData];
  if (chartData.length >= 2) {
    const last = chartData[chartData.length - 1];
    const prev = chartData[chartData.length - 2];
    const revTrend = last.revenue - prev.revenue;
    const unitTrend = last.units - prev.units;
    for (let i = 1; i <= 2; i++) {
      const [y, m] = last.month.split("-").map(Number);
      const nm = m + i > 12 ? m + i - 12 : m + i;
      const ny = m + i > 12 ? y + 1 : y;
      forecastData.push({
        month: `${ny}-${String(nm).padStart(2, "0")}`,
        revenue: Math.max(0, Math.round(last.revenue + revTrend * i)),
        units: Math.max(0, last.units + unitTrend * i),
      });
    }
  }

  // Top products by revenue
  const productRevenue = sales?.reduce((acc: Record<string, { name: string; revenue: number }>, s) => {
    const name = (s as any).inventory?.product_name || "Unknown";
    if (!acc[name]) acc[name] = { name, revenue: 0 };
    acc[name].revenue += s.revenue;
    return acc;
  }, {});
  const topProducts = Object.values(productRevenue || {})
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map((p) => ({ ...p, revenue: Math.round(p.revenue) }));

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Sales Insights</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend & Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(220, 10%, 45%)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(220, 10%, 45%)', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(0, 0%, 100%)',
                      border: '1px solid hsl(220, 15%, 88%)',
                      borderRadius: '0.5rem',
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? `$${value.toLocaleString()}` : value,
                      name === 'revenue' ? 'Revenue' : 'Units Sold',
                    ]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(220, 70%, 50%)" strokeWidth={2.5} dot={{ r: 3 }} name="Revenue" />
                  <Line type="monotone" dataKey="units" stroke="hsl(160, 60%, 45%)" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="Units Sold" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              * Dashed portions represent forecasted values based on recent trends
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fill: 'hsl(220, 10%, 45%)', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fill: 'hsl(220, 10%, 45%)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(0, 0%, 100%)',
                      border: '1px solid hsl(220, 15%, 88%)',
                      borderRadius: '0.5rem',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="hsl(220, 70%, 50%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
