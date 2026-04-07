import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, TrendingUp, AlertTriangle, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { data: inventory } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data } = await supabase.from("inventory").select("*");
      return data || [];
    },
  });

  const { data: sales } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data } = await supabase.from("sales").select("*, inventory(product_name)");
      return data || [];
    },
  });

  const totalProducts = inventory?.length || 0;
  const lowStockCount = inventory?.filter((i) => i.stock_level < i.reorder_point).length || 0;
  const totalRevenue = sales?.reduce((sum, s) => sum + s.revenue, 0) || 0;
  const totalUnitsSold = sales?.reduce((sum, s) => sum + s.units_sold, 0) || 0;

  // Aggregate sales by month
  const monthlySales = sales?.reduce((acc: Record<string, number>, s) => {
    const month = s.sale_date.substring(0, 7);
    acc[month] = (acc[month] || 0) + s.revenue;
    return acc;
  }, {});
  const chartData = Object.entries(monthlySales || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({ month, revenue: Math.round(revenue as number) }));

  const stats = [
    { title: "Total Products", value: totalProducts, icon: Package, color: "text-primary" },
    { title: "Units Sold", value: totalUnitsSold.toLocaleString(), icon: TrendingUp, color: "text-accent" },
    { title: "Low Stock Alerts", value: lowStockCount, icon: AlertTriangle, color: "text-warning" },
    { title: "Total Revenue", value: `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-success" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-secondary ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(220, 10%, 45%)' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(220, 10%, 45%)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(220, 15%, 88%)',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="hsl(220, 70%, 50%)" strokeWidth={2.5} dot={{ fill: 'hsl(220, 70%, 50%)', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
