import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Mic } from "lucide-react";
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
    { role: "assistant", content: "Hello! I'm your Microland retail assistant. Ask me about inventory, sales, or stock levels. You can also use the 🎤 mic button!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
    setListening(true);
  };

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
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error." }]);
    }
    setLoading(false);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg glow hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <MessageCircle className="h-6 w-6 text-primary-foreground" />
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-4rem)] rounded-2xl glass shadow-2xl flex flex-col animate-scale-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 gradient-primary">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm text-primary-foreground">Microland AI</p>
                <p className="text-[11px] text-primary-foreground/70">Ask anything about your data</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "gradient-primary text-primary-foreground rounded-br-md"
                      : "bg-card text-card-foreground rounded-bl-md shadow-sm border border-border/50"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start animate-slide-up">
                <div className="bg-card rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-border/50">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary/40 animate-pulse-soft" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-primary/40 animate-pulse-soft" style={{ animationDelay: '200ms' }} />
                    <span className="h-2 w-2 rounded-full bg-primary/40 animate-pulse-soft" style={{ animationDelay: '400ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t bg-card">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-2"
            >
              <Button
                type="button"
                variant={listening ? "default" : "outline"}
                size="icon"
                onClick={startListening}
                className={`shrink-0 ${listening ? 'animate-pulse-soft gradient-primary border-0' : ''}`}
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={listening ? "Listening..." : "Ask about inventory, sales..."}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!input.trim() || loading} className="shrink-0 gradient-primary border-0">
                <Send className="h-4 w-4 text-primary-foreground" />
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
      return `Our best-selling item is "${best.name}" with ${best.units} total units sold! 🏆`;
    }
    return "I couldn't find sales data to determine the best-selling item.";
  }

  if (q.includes("low stock") || q.includes("low on stock") || q.includes("reorder") || q.includes("out of stock")) {
    const { data } = await supabase.from("inventory").select("*");
    if (data) {
      const lowStock = data.filter((item) => item.stock_level < item.reorder_point);
      if (lowStock.length === 0) return "All products are above their reorder points. No alerts! ✅";
      const list = lowStock.map((item) => `• ${item.product_name}: ${item.stock_level} in stock (reorder at ${item.reorder_point})`).join("\n");
      return `⚠️ ${lowStock.length} products are low on stock:\n${list}`;
    }
    return "I couldn't retrieve inventory data.";
  }

  if (q.includes("revenue") || q.includes("total sales") || q.includes("how much")) {
    const { data } = await supabase.from("sales").select("revenue");
    if (data) {
      const total = data.reduce((sum, s) => sum + s.revenue, 0);
      return `Total revenue is $${total.toLocaleString("en-US", { minimumFractionDigits: 2 })} 💰`;
    }
    return "I couldn't retrieve sales data.";
  }

  if (q.includes("how many products") || q.includes("inventory count") || q.includes("total products")) {
    const { count } = await supabase.from("inventory").select("*", { count: "exact", head: true });
    return `We currently have ${count} products in our inventory 📦`;
  }

  if (q.includes("categor")) {
    const { data } = await supabase.from("inventory").select("category");
    if (data) {
      const cats = [...new Set(data.map((d) => d.category))];
      return `We have ${cats.length} categories: ${cats.join(", ")} 🏷️`;
    }
  }

  return "I can help with:\n• \"What is our best-selling item?\"\n• \"Which products are low on stock?\"\n• \"What is our total revenue?\"\n• \"How many products do we have?\"\n\nTry asking one of these! 🤖";
}
