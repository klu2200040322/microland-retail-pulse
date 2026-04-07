import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, TrendingUp, AlertTriangle, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

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

  const monthlySales = sales?.reduce((acc: Record<string, number>, s) => {
    const month = s.sale_date.substring(0, 7);
    acc[month] = (acc[month] || 0) + s.revenue;
    return acc;
  }, {});
  const chartData = Object.entries(monthlySales || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({ month, revenue: Math.round(revenue as number) }));

  const stats = [
    { title: "Total Products", value: totalProducts, icon: Package, gradient: "gradient-primary", trend: "+3", up: true },
    { title: "Units Sold", value: totalUnitsSold.toLocaleString(), icon: TrendingUp, gradient: "gradient-accent", trend: "+12%", up: true },
    { title: "Low Stock Alerts", value: lowStockCount, icon: AlertTriangle, gradient: "gradient-warm", trend: lowStockCount > 0 ? `${lowStockCount} items` : "All clear", up: false },
    { title: "Total Revenue", value: `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: DollarSign, gradient: "gradient-primary", trend: "+8.2%", up: true },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Your retail intelligence overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={stat.title} className="card-elevated overflow-hidden border-0 animate-slide-up" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl ${stat.gradient}`}>
                  <stat.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${stat.up ? 'text-success' : 'text-warning'}`}>
                  {stat.up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  {stat.trend}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-foreground tracking-tight">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="card-elevated border-0 animate-slide-up" style={{ animationDelay: '240ms', animationFillMode: 'both' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(230, 75%, 57%)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(230, 75%, 57%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 15%, 90%)" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(225, 10%, 45%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(225, 10%, 45%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: 'none',
                    borderRadius: '0.75rem',
                    boxShadow: '0 10px 25px hsl(225 30% 8% / 0.1)',
                    padding: '12px 16px',
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(230, 75%, 57%)" strokeWidth={2.5} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
