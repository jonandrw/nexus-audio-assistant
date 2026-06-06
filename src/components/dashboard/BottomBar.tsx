import React from 'react';
import { useNetworkStore } from '@/lib/network-store';

export function BottomBar() {
    const { latencyMs, memoryBytes, isConnected } = useNetworkStore();
    const memoryMb = (memoryBytes / 1024 / 1024).toFixed(1);

    return (
        <footer className="h-8 border-t border-zinc-900 bg-zinc-950 px-4 flex items-center justify-between shrink-0 text-[10px] text-slate-400 font-mono tracking-wider">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <span className="text-zinc-600">INPUTS</span>
                    <span className="text-slate-300">32</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-zinc-600">ACTIVE</span>
                    <span className="text-slate-300">18</span>
                </div>
            </div>
            
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <span className="text-zinc-600">OSC TX/S</span>
                    <span className={`${isConnected ? 'text-slate-300' : 'text-zinc-600'}`}>{isConnected ? '~120' : '0'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-zinc-600">RTT</span>
                    <span className={latencyMs > 150 ? 'text-red-400' : 'text-slate-300'}>{latencyMs > 0 ? `${latencyMs}ms` : '--'}</span>
                </div>
                <div className="flex items-center gap-2 border-l border-zinc-800 pl-6">
                    <span className="text-zinc-600">V8 HEAP</span>
                    <span className={(memoryBytes / 1024 / 1024) > 400 ? 'text-red-400' : 'text-slate-300'}>{memoryMb}MB</span>
                </div>
                <div className="flex items-center gap-2 ml-4">
                    <div className={`w-1.5 h-1.5 rounded-none ${isConnected ? 'bg-brand' : 'bg-red-500'}`}></div>
                    <span className={`${isConnected ? 'text-brand' : 'text-red-500'} font-bold`}>{isConnected ? 'SYNCED' : 'OFFLINE'}</span>
                </div>
            </div>
        </footer>
    );
}
