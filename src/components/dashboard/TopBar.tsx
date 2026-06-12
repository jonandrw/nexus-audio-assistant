"use client";

import React from 'react';
import { Waves, Settings, Minus, Square, X, Copy, Maximize } from 'lucide-react';
import { useNetworkStore } from '@/lib/network-store';
import { useUiStore } from '@/lib/ui-store';

export function TopBar() {
  const { latencyMs, isConnected } = useNetworkStore();
  const [liveSeconds, setLiveSeconds] = React.useState(0);
  const openSettings = useUiStore(state => state.openSettings);
  const [isMaximized, setIsMaximized] = React.useState(false);

  React.useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => setLiveSeconds(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electron) {
      const unsub = (window as any).electron.onWindowMaximized((max: boolean) => {
        setIsMaximized(max);
      });
      return unsub;
    }
  }, []);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <header 
      className="h-14 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between px-4 shrink-0"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
        {/* Logo */}
        <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-black flex items-center justify-center border border-zinc-800">
                <Waves className="text-emerald-500 w-5 h-5" />
            </div>
            <div className="flex flex-col">
                <h1 className="font-black text-sm tracking-[0.15em] flex items-center gap-2 text-white">
                    NEXUS <span className="text-emerald-500 font-light">PRO</span>
                </h1>
                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">FOH DSP Engine</p>
            </div>
        </div>

        {/* Top Metrics / Status Indicators */}
        <div className="hidden md:flex items-center h-full">
            <div className="flex items-center h-full border-l border-zinc-900 px-6">
                <div className="flex flex-col items-center justify-center">
                    <span className="text-[9px] text-zinc-500 font-mono mb-1">M32 CORE</span>
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-zinc-800'}`}></div>
                        <span className={`text-xs font-bold font-mono tracking-wider ${isConnected ? 'text-emerald-400' : 'text-zinc-600'}`}>{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center h-full border-l border-zinc-900 px-6">
                <div className="flex flex-col items-center justify-center">
                    <span className="text-[9px] text-zinc-500 font-mono mb-1">DSP ENGINE</span>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
                        <span className="text-xs font-bold font-mono tracking-wider text-emerald-400">ACTIVE</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center h-full border-l border-zinc-900 px-6">
                <div className="flex flex-col items-center justify-center">
                    <span className="text-[9px] text-zinc-500 font-mono mb-1">SHOW TIME</span>
                    <span className={`text-xs font-bold font-mono tracking-wider ${isConnected ? 'text-white' : 'text-zinc-600'}`}>
                        {formatTime(liveSeconds)}
                    </span>
                </div>
            </div>
        </div>

        {/* User Actions & Window Controls */}
        <div 
          className="flex items-center gap-2 h-full border-l border-zinc-900 pl-4"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
            <button 
              onClick={openSettings}
              className="w-8 h-8 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-400 transition-colors"
            >
                <Settings className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 pl-2">
                <div className="w-8 h-8 bg-black border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 tracking-wider">
                   FOH
                </div>
            </div>
            
            {/* Window Controls */}
            <div className="flex items-center ml-4 gap-1">
                <button 
                  onClick={() => (window as any).electron?.windowControl('minimize')}
                  className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                    <Minus className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => (window as any).electron?.windowControl('maximize')}
                  className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                    {isMaximized ? <Copy className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                </button>
                <button 
                  onClick={() => (window as any).electron?.windowControl('fullscreen')}
                  className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                  title="Fullscreen"
                >
                    <Maximize className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => (window as any).electron?.windowControl('close')}
                  className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:bg-red-500 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    </header>
  );
}
