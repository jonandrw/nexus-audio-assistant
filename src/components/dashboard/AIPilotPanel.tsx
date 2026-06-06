import React from "react";
import { Channel } from "./ChannelList";
import { Brain } from "lucide-react";
import { AICard } from "./AICard";
import { useAIStore } from "@/lib/ai-store";

interface AIPilotPanelProps {
  activeChannel: Channel | null;
}

export function AIPilotPanel({ activeChannel }: AIPilotPanelProps) {
  const alerts = useAIStore(state => state.alerts);

  return (
    <div className="panel flex-1 p-4 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
            <h2 className="text-xs font-semibold tracking-wide text-brand flex items-center gap-2">
                <Brain className="w-4 h-4" /> PILOTO IA
            </h2>
            <span className="text-xs bg-brand/20 text-brand px-2 rounded-full border border-brand/30 animate-pulse">ACTIVO</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {alerts.length === 0 ? (
                <div className="text-center mt-10">
                    <p className="text-[10px] text-zinc-600 font-mono">Análisis IA activo. Sistema estable.</p>
                </div>
            ) : (
                alerts.map((sug) => (
                    <AICard key={sug.id} suggestion={sug} />
                ))
            )}
        </div>
    </div>
  );
}
