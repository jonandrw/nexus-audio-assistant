import React from "react";
import { Mic, Mic2, Plus, MoreVertical, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { SceneManager } from "./SceneManager";

export interface Channel {
  id: string;
  number: number;
  name: string;
  level: number;
  type?: string;
  icon?: string;
  color?: string;
  active?: boolean;
  muted?: boolean;
  solo?: boolean;
}

interface ChannelListProps {
  channels: Channel[];
  activeChannelId: string | null;
  onSelectChannel: (id: string) => void;
  onToggleMute: (id: string) => void;
  onToggleSolo: (id: string) => void;
}

const IconMap: Record<string, any> = {
  Mic, Mic2, Keyboard: Music, Guitar: Music, Drum: Music
};

export function ChannelList({ channels, activeChannelId, onSelectChannel, onToggleMute, onToggleSolo }: ChannelListProps) {
  
  // Medidor LED horizontal hiper-denso tipo FOH
  const getLedMeter = (level: number) => {
    const totalBars = 20;
    const activeBars = Math.max(0, Math.min(totalBars, Math.floor((level + 60) / 3.5)));
    
    return (
      <div className="flex h-1 mt-1.5 gap-px w-full bg-black border border-zinc-900 p-px">
        {Array.from({ length: totalBars }).map((_, i) => {
          let colorClass = "bg-zinc-900"; // OFF
          if (i < activeBars) {
            if (i < 12) colorClass = "bg-emerald-500";
            else if (i < 17) colorClass = "bg-yellow-500";
            else colorClass = "bg-red-500";
          }
          return <div key={i} className={`flex-1 h-full ${colorClass}`} />;
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="panel-header flex justify-between items-center">
          <span>TRACKLIST</span>
          <span className="text-emerald-500 tracking-normal font-mono">
             {activeChannelId ? String(channels.find(c => c.id === activeChannelId)?.number || 0).padStart(2, '0') : '--'}
             <span className="text-zinc-600">/{channels.length}</span>
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {channels.map((ch) => {
            const isActive = activeChannelId === ch.id;
            const Icon = IconMap[ch.icon || "Mic"] || Mic;
            const bgClass = isActive ? "bg-zinc-900 border-l-2 border-emerald-500" : "bg-zinc-950 border-l-2 border-transparent hover:bg-zinc-900/40";
            
            return (
              <div 
                key={ch.id} 
                onClick={() => onSelectChannel(ch.id)}
                className={cn("flex flex-col p-2.5 border-b border-zinc-900 cursor-pointer select-none transition-colors", bgClass)}
              >
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-[9px] text-zinc-500 font-mono w-3 shrink-0">{ch.number}</span>
                      <Icon className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>{ch.name}</span>
                   </div>
                   <div className="flex gap-1 shrink-0">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onToggleMute(ch.id); }}
                        className={cn("w-5 h-5 flex items-center justify-center text-[9px] font-bold border transition-colors", ch.muted ? "bg-red-500 text-black border-red-500" : "bg-zinc-950 text-zinc-500 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-300")}
                      >
                        M
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onToggleSolo(ch.id); }}
                        className={cn("w-5 h-5 flex items-center justify-center text-[9px] font-bold border transition-colors", ch.solo ? "bg-yellow-500 text-black border-yellow-500" : "bg-zinc-950 text-zinc-500 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-300")}
                      >
                        S
                      </button>
                   </div>
                </div>
                <div className="flex justify-between items-center mt-1">
                   <span className="text-[9px] font-mono text-zinc-500 tracking-wider">CH {ch.id}</span>
                   <span className="text-[10px] font-mono text-slate-400">{ch.level > -60 ? ch.level.toFixed(1) : '-INF'} dB</span>
                </div>
                {getLedMeter(ch.level)}
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-zinc-900 bg-zinc-950 shrink-0">
        <SceneManager />
      </div>
    </div>
  );
}
