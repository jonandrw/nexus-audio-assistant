import React from "react";
import { Channel } from "./ChannelList";
import { Brain, Cpu } from "lucide-react";
import { AICard } from "./AICard";
import { useAIStore } from "@/lib/ai-store";

interface AIPilotPanelProps {
  activeChannel: Channel | null;
}

export function AIPilotPanel({ activeChannel }: AIPilotPanelProps) {
  const alerts = useAIStore(state => state.alerts);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-transparent border-none">
        <div className="panel-header flex justify-between items-center bg-zinc-950 border-none px-4 py-2">
            <div className="flex items-center gap-2 text-emerald-500">
                <Cpu className="w-3 h-3" /> 
                <span className="text-white text-[10px]">AI DIAGNOSTICS</span>
            </div>
            <span className="text-[9px] text-emerald-500 font-mono px-1 border border-emerald-500/30">MONITORING</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 bg-zinc-950">
            {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-30">
                    <Brain className="w-8 h-8 text-zinc-500 mb-2" />
                    <p className="text-[9px] text-zinc-400 font-mono text-center tracking-widest">SYSTEM CLEAR<br/>NO ANOMALIES</p>
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
