import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Database, Bot, Wifi } from "lucide-react";

export default function SettingsPage() {
  const items = [
    { label: "Platform", value: "Microland Retail Intelligence", icon: Database, status: "active" },
    { label: "Version", value: "1.0.0", icon: Shield, status: "info" },
    { label: "Backend", value: "Connected", icon: Wifi, status: "active" },
    { label: "AI Chatbot", value: "Active", icon: Bot, status: "active" },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-1">System configuration and status</p>
      </div>

      <Card className="card-elevated border-0">
        <CardHeader>
          <CardTitle className="text-lg">System Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3 border-b last:border-0 border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </div>
              <Badge
                variant="outline"
                className={
                  item.status === "active"
                    ? "bg-success/10 text-success border-success/20"
                    : "bg-secondary text-muted-foreground"
                }
              >
                {item.value}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
