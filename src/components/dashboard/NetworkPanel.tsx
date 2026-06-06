"use client";

import React from 'react';
import { Wifi, RefreshCw } from 'lucide-react';
import { useNetworkStore } from '@/lib/network-store';

export function NetworkPanel() {
    const { latencyMs, memoryBytes, isConnected, forceReconnect } = useNetworkStore();

    // Monitor V8
    const memoryMb = (memoryBytes / 1024 / 1024).toFixed(1);
    const isMemoryCritical = (memoryBytes / 1024 / 1024) > 400; // Umbral de 400MB FOH

    // Lógica del Semáforo de Red
    let statusColor = "bg-red-500";
    let statusText = "DESCONECTADO";
    if (isConnected) {
        if (latencyMs < 50) {
            statusColor = "bg-emerald-500";
            statusText = "ESTABLE";
        } else if (latencyMs < 150) {
            statusColor = "bg-yellow-500";
            statusText = "CONGESTIÓN";
        } else {
            statusColor = "bg-orange-500";
            statusText = "CRÍTICO";
        }
    }

    return (
        <div className={`panel p-4 h-32 flex flex-col shrink-0 relative transition-colors duration-300 ${isMemoryCritical ? 'border-red-500 bg-red-950/20' : ''}`}>
            <div className="flex justify-between items-center mb-2">
                <h2 className="panel-header mb-0 border-none pb-0">NETWORK & HEALTH</h2>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusColor} ${isConnected ? 'animate-pulse' : ''}`}></div>
                    <Wifi className={`w-4 h-4 ${isConnected ? 'text-slate-400' : 'text-red-500'}`} />
                </div>
            </div>
            
            <div className="flex justify-between items-baseline mb-2">
                <span className="font-mono text-slate-300 flex items-center gap-2">
                    192.168.1.50 
                    <span className="text-[10px] tracking-wider text-slate-500">[{statusText}]</span>
                </span>
                <span className="text-xs font-mono text-slate-400">{latencyMs > 0 ? `${latencyMs} ms` : '--'}</span>
            </div>

            <div className="flex justify-between items-end mt-auto border-t border-slate-800 pt-2">
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500">V8 MEMORY USAGE</span>
                    <span className={`text-xs font-mono ${isMemoryCritical ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
                        {memoryMb} MB {isMemoryCritical && '(F5 REQUIRED)'}
                    </span>
                </div>
                
                <button 
                    onClick={forceReconnect}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded text-[10px] font-bold tracking-wider transition-colors"
                >
                    <RefreshCw className={`w-3 h-3 ${!isConnected ? 'animate-spin' : ''}`} />
                    FORZAR RECONEXIÓN
                </button>
            </div>
        </div>
    );
}
