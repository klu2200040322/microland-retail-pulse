import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatWindow() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I'm your Microland retail assistant. Ask me about inventory, sales, or stock levels." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const response = await answerQuestion(userMsg);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
        >
          <MessageCircle className="h-6 w-6 text-primary-foreground" />
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-4rem)] rounded-2xl glass shadow-2xl flex flex-col animate-slide-up">
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Microland AI</p>
                <p className="text-xs text-muted-foreground">Retail Intelligence</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-secondary-foreground rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-muted-foreground animate-pulse-soft">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-border/50">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about inventory, sales..."
                className="flex-1 bg-secondary/50"
              />
              <Button type="submit" size="icon" disabled={!input.trim() || loading} className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

async function answerQuestion(question: string): Promise<string> {
  const q = question.toLowerCase();

  if (q.includes("best-selling") || q.includes("best selling") || q.includes("top selling") || q.includes("most sold")) {
    const { data } = await supabase.from("sales").select("product_id, units_sold, inventory(product_name)");
    if (data && data.length > 0) {
      const totals: Record<string, { name: string; units: number }> = {};
      for (const s of data) {
        const name = (s as any).inventory?.product_name || s.product_id;
        if (!totals[s.product_id]) totals[s.product_id] = { name, units: 0 };
        totals[s.product_id].units += s.units_sold;
      }
      const best = Object.values(totals).sort((a, b) => b.units - a.units)[0];
      return `Our best-selling item is **${best.name}** with ${best.units} total units sold.`;
    }
    return "I couldn't find sales data to determine the best-selling item.";
  }

  if (q.includes("low stock") || q.includes("low on stock") || q.includes("reorder") || q.includes("out of stock")) {
    const { data } = await supabase.from("inventory").select("*");
    if (data) {
      const lowStock = data.filter((item) => item.stock_level < item.reorder_point);
      if (lowStock.length === 0) return "All products are above their reorder points. No low stock alerts!";
      const list = lowStock.map((item) => `• **${item.product_name}**: ${item.stock_level} in stock (reorder at ${item.reorder_point})`).join("\n");
      return `⚠️ **${lowStock.length} products are low on stock:**\n${list}`;
    }
    return "I couldn't retrieve inventory data.";
  }

  if (q.includes("revenue") || q.includes("total sales") || q.includes("how much")) {
    const { data } = await supabase.from("sales").select("revenue");
    if (data) {
      const total = data.reduce((sum, s) => sum + s.revenue, 0);
      return `Total revenue across all recorded sales is **$${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}**.`;
    }
    return "I couldn't retrieve sales data.";
  }

  if (q.includes("how many products") || q.includes("inventory count") || q.includes("total products")) {
    const { count } = await supabase.from("inventory").select("*", { count: "exact", head: true });
    return `We currently have **${count}** products in our inventory.`;
  }

  if (q.includes("categor")) {
    const { data } = await supabase.from("inventory").select("category");
    if (data) {
      const cats = [...new Set(data.map((d) => d.category))];
      return `We have **${cats.length}** product categories: ${cats.join(", ")}.`;
    }
  }

  return "I can help with questions about inventory levels, low stock alerts, best-selling items, revenue, and product categories. Try asking something like:\n• \"What is our best-selling item?\"\n• \"Which products are low on stock?\"\n• \"What is our total revenue?\"";
}
