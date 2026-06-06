import React from "react";
import { Mic, Mic2, Plus, MoreVertical, ChevronDown, Music } from "lucide-react";
import { cn } from "@/lib/utils";

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
  // Función para renderizar el medidor LED
  const getLedMeter = (level: number) => {
    const totalBars = 15;
    const activeBars = Math.max(0, Math.min(totalBars, Math.floor((level + 60) / 4)));
    
    return (
      <div className="flex items-end h-2 mt-1">
        {Array.from({ length: totalBars }).map((_, i) => {
          let colorClass = "meter-off";
          if (i < activeBars) {
            if (i < 10) colorClass = "meter-green";
            else if (i < 13) colorClass = "meter-yellow";
            else colorClass = "meter-red";
          }
          return <div key={i} className={`meter-bar ${colorClass}`} />;
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Lista de Canales */}
      <div className="panel flex-1 flex flex-col overflow-hidden">
        <div className="p-4 pb-2 flex justify-between items-center border-b border-slate-700">
          <h2 className="text-xs font-semibold tracking-wide text-slate-400">CANALES</h2>
          <span className="text-xs text-brand font-medium">12 <span className="text-slate-500">/ 32</span></span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {channels.map((ch) => {
            const isActive = activeChannelId === ch.id;
            const Icon = IconMap[ch.icon || "Mic"] || Mic;
            const bgClass = isActive ? "bg-slate-700/50 border-slate-600" : "bg-transparent border-transparent hover:bg-slate-800/50";
            
            return (
              <div 
                key={ch.id} 
                onClick={() => onSelectChannel(ch.id)}
                className={cn("flex items-center gap-3 p-2 rounded border cursor-pointer group", bgClass)}
              >
                <div className={cn("w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0", ch.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="text-sm font-medium text-slate-200 truncate pr-2">
                      <span className="text-slate-500 font-mono text-xs mr-1">{ch.id}</span>
                      {ch.name}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{ch.level.toFixed(1)} dB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xxs text-slate-500 truncate">{ch.type}</span>
                  </div>
                  {getLedMeter(ch.level)}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <div 
                    onClick={(e) => { e.stopPropagation(); onToggleMute(ch.id); }}
                    className={cn("btn-icon", ch.muted && "bg-red-500/20 text-red-500 border-red-500/50 border")}>M</div>
                  <div 
                    onClick={(e) => { e.stopPropagation(); onToggleSolo(ch.id); }}
                    className={cn("btn-icon", ch.solo && "bg-yellow-500/20 text-yellow-500 border-yellow-500/50 border")}>S</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-slate-700 flex justify-between items-center">
          <button className="text-xs text-slate-300 hover:text-white flex items-center gap-2">
            <Plus className="w-3 h-3" /> AGREGAR CANAL
          </button>
          <button className="text-slate-400 hover:text-white">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scene Panel */}
      <div className="panel p-4 h-32 flex flex-col shrink-0">
        <h2 className="panel-header mb-3 pb-3">ESCENA</h2>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-900 border border-slate-700 rounded p-2 flex justify-between items-center cursor-pointer">
            <span className="text-sm text-slate-200">Servicio Dominical</span>
            <ChevronDown className="text-slate-500 w-3 h-3" />
          </div>
          <button className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-xs font-medium transition-colors">GUARDAR</button>
        </div>
        <div className="text-xxs text-slate-500 mt-2">Guardado: Hace 2 min</div>
      </div>
    </div>
  );
}
