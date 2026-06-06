"use client";

import React from 'react';
import { Wifi, RefreshCw } from 'lucide-react';
import { useNetworkStore } from '@/lib/network-store';

export function NetworkPanel() {
    const { latencyMs, memoryBytes, isConnected, forceReconnect } = useNetworkStore();

    const memoryMb = (memoryBytes / 1024 / 1024).toFixed(1);
    const isMemoryCritical = (memoryBytes / 1024 / 1024) > 400;

    let statusColor = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]";
    let statusText = "DISCONNECTED";
    if (isConnected) {
        if (latencyMs < 50) {
            statusColor = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]";
            statusText = "STABLE";
        } else if (latencyMs < 150) {
            statusColor = "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]";
            statusText = "CONGESTION";
        } else {
            statusColor = "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]";
            statusText = "CRITICAL";
        }
    }

    return (
        <div className={`flex flex-col h-28 shrink-0 bg-zinc-950 border-none transition-colors duration-300 ${isMemoryCritical ? 'bg-red-950/10' : ''}`}>
            <div className="panel-header flex justify-between items-center bg-zinc-950 border-none px-4 py-2">
                <span className="text-[10px]">NETWORK LINK</span>
                <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 ${statusColor} ${isConnected ? 'animate-pulse' : ''}`}></div>
                    <Wifi className={`w-3 h-3 ${isConnected ? 'text-zinc-500' : 'text-red-500'}`} />
                </div>
            </div>
            
            <div className="px-4 py-2 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-baseline">
                    <div className="flex flex-col">
                        <span className="text-[8px] text-zinc-600 font-mono">TARGET DEVICE</span>
                        <span className="font-mono text-zinc-300 text-xs">192.168.1.50</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] text-zinc-600 font-mono">STATUS</span>
                        <span className={`text-[9px] font-bold font-mono tracking-wider ${isConnected ? 'text-emerald-500' : 'text-red-500'}`}>{statusText}</span>
                    </div>
                </div>

                <div className="flex justify-between items-end border-t border-zinc-900 pt-2 mt-2">
                    <button 
                        onClick={forceReconnect}
                        className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 px-2 py-1 border border-zinc-800 text-[9px] font-bold tracking-wider transition-colors"
                    >
                        <RefreshCw className={`w-2.5 h-2.5 ${!isConnected ? 'animate-spin' : ''}`} />
                        REBOOT
                    </button>
                    
                    <div className="flex flex-col items-end">
                       <span className="text-[8px] text-zinc-600 font-mono">PING (RTT)</span>
                       <span className="text-[10px] font-mono text-slate-300">{latencyMs > 0 ? `${latencyMs}ms` : '--'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
