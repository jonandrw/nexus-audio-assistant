"use client";

import React, { use } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { EqPanel } from "@/components/dashboard/EqPanel";
import { CompPanel } from "@/components/dashboard/CompPanel";
import { DynamicsPanel } from "@/components/dashboard/DynamicsPanel";
import { PreampPanel } from "@/components/dashboard/PreampPanel";
import { RTACanvas } from "@/components/dashboard/RTACanvas";
import { AudioEngineProvider } from "@/lib/audio-context";
import { useConsoleStore } from "@/lib/console-store";
import { Minus, Square, X, Copy, Maximize } from "lucide-react";

function PopoutHeader({ title }: { title: string }) {
  const [isMaximized, setIsMaximized] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electron) {
      const unsub = (window as any).electron.onWindowMaximized((max: boolean) => {
        setIsMaximized(max);
      });
      return unsub;
    }
  }, []);
  return (
    <div 
      className="h-8 bg-zinc-950 border-b border-zinc-900 flex justify-between items-center px-2 shrink-0"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      <div className="text-[10px] font-bold text-zinc-500 tracking-widest pl-2 uppercase">
        {title} <span className="text-brand font-light">POPOUT</span>
      </div>
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button 
          onClick={() => (window as any).electron?.windowControl('minimize')}
          className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        >
            <Minus className="w-3 h-3" />
        </button>
        <button 
          onClick={() => (window as any).electron?.windowControl('maximize')}
          className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        >
            {isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
        </button>
        <button 
          onClick={() => (window as any).electron?.windowControl('fullscreen')}
          className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          title="Fullscreen"
        >
            <Maximize className="w-3 h-3" />
        </button>
        <button 
          onClick={() => (window as any).electron?.windowControl('close')}
          className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:bg-red-500 hover:text-white transition-colors"
        >
            <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function PopoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const panel = params?.panel as string;
  const channelId = searchParams?.get('channel') || '01';

  const channels = useConsoleStore(state => state.channels);
  const activeChannel = channels.find(c => c.id === channelId) || null;

  let content = null;
  let title = "PANEL";

  switch (panel) {
    case 'eq':
      title = "Parametric EQ";
      content = <EqPanel activeChannelId={channelId} />;
      break;
    case 'comp':
      title = "Compressor";
      content = <CompPanel activeChannelId={channelId} />;
      break;
    case 'gate':
      title = "Noise Gate";
      content = <DynamicsPanel activeChannelId={channelId} />;
      break;
    case 'preamp':
      title = "Preamp";
      content = <PreampPanel activeChannelId={channelId} />;
      break;
    case 'rta':
      title = "Analyzer RTA";
      content = <RTACanvas activeChannel={activeChannel} />;
      break;
    default:
      content = <div className="p-4 text-zinc-500 font-mono">Panel not found</div>;
  }

  return (
    <AudioEngineProvider>
      <div className="h-screen w-screen flex flex-col bg-black text-slate-200 overflow-hidden font-sans border border-zinc-900">
        <PopoutHeader title={title} />
        <div className="flex-1 flex overflow-hidden">
          {content}
        </div>
      </div>
    </AudioEngineProvider>
  );
}
