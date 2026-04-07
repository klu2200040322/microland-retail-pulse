import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface AppHeaderProps {
  voiceEnabled: boolean;
  onToggleVoice: () => void;
}

export function AppHeader({ voiceEnabled, onToggleVoice }: AppHeaderProps) {
  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <h1 className="text-lg font-semibold text-foreground">
          Retail Intelligence
        </h1>
      </div>
      <Button
        variant={voiceEnabled ? "default" : "outline"}
        size="sm"
        onClick={onToggleVoice}
        className="gap-2"
      >
        {voiceEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        Voice Command
      </Button>
    </header>
  );
}
