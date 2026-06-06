"use client";

import React from 'react';
import { Waves, Network, Server, Microchip, Timer, Activity, Moon, Settings, ChevronDown } from 'lucide-react';
import { useNetworkStore } from '@/lib/network-store';

export function TopBar() {
  const { latencyMs, isConnected } = useNetworkStore();
  const [liveSeconds, setLiveSeconds] = React.useState(0);

  React.useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => setLiveSeconds(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <header className="h-16 border-b border-slate-700 bg-slate-800 flex items-center justify-between px-4 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
                <Waves className="text-brand w-5 h-5" />
            </div>
            <div>
                <h1 className="font-bold text-base leading-tight tracking-wide flex items-center gap-2">
                    MIXVISION <span className="text-brand font-light">PRO</span>
                </h1>
                <p className="text-xxs text-slate-400">Audio Analysis & Control System</p>
            </div>
        </div>

        {/* Top Metrics */}
        <div className="hidden md:flex items-center gap-4 text-xs">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700 transition-colors ${isConnected ? 'bg-zinc-900/50' : 'bg-red-950/20'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-brand animate-pulse' : 'bg-red-500'}`}></div>
                <span className={`${isConnected ? 'text-brand' : 'text-red-500'} font-medium`}>{isConnected ? 'LIVE' : 'OFFLINE'}</span>
                <span className="text-slate-400 ml-1 font-mono">{formatTime(liveSeconds)}</span>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-900/50 px-3 py-1.5 rounded border border-slate-700">
                <Network className={`${isConnected ? 'text-brand' : 'text-red-500'} w-4 h-4`} />
                <div className="flex flex-col">
                    <span className="font-medium text-slate-200">M32 <span className={`${isConnected ? 'text-slate-400' : 'text-red-500'} text-xxs font-normal`}>{isConnected ? 'CONNECTED' : 'OFFLINE'}</span></span>
                    <span className="text-xxs text-slate-500 font-mono">192.168.1.50</span>
                </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-900/50 px-3 py-1.5 rounded border border-slate-700">
                <Server className="text-brand w-4 h-4" />
                <div className="flex flex-col">
                    <span className="font-medium text-slate-200">OSC</span>
                    <span className="text-xxs text-slate-500">ACTIVE</span>
                </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-900/50 px-3 py-1.5 rounded border border-slate-700">
                <Microchip className="text-brand w-4 h-4" />
                <div className="flex flex-col">
                    <span className="font-medium text-slate-200">AUDIO ENGINE</span>
                    <span className="text-xxs text-slate-500">RUNNING</span>
                </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-900/50 px-3 py-1.5 rounded border border-slate-700">
                <Timer className="text-brand w-4 h-4" />
                <div className="flex flex-col">
                    <span className="font-medium text-slate-200">LATENCY</span>
                    <span className="text-xxs text-slate-500">{latencyMs > 0 ? `${latencyMs} ms` : '--'}</span>
                </div>
            </div>

             <div className="flex items-center gap-3 bg-slate-900/50 px-3 py-1.5 rounded border border-slate-700">
                <Activity className="text-brand w-4 h-4" />
                <div className="flex flex-col">
                    <span className="font-medium text-slate-200">SAMPLE RATE</span>
                    <span className="text-xxs text-slate-500">48 kHz</span>
                </div>
            </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300">
                <Moon className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300">
                <Settings className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
                <img src="https://ui-avatars.com/api/?name=Admin&background=334155&color=fff" alt="User" className="w-8 h-8 rounded-full border border-slate-600" />
                <div className="hidden sm:block">
                    <div className="text-sm font-medium flex items-center">Admin <ChevronDown className="w-3 h-3 text-slate-400 ml-1" /></div>
                    <div className="text-xxs text-slate-400">Administrator</div>
                </div>
            </div>
        </div>
    </header>
  );
}
