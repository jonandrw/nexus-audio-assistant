import React from 'react';
import { useNetworkStore } from '@/lib/network-store';

export function BottomBar() {
    const { latencyMs, memoryBytes, isConnected } = useNetworkStore();
    const memoryMb = (memoryBytes / 1024 / 1024).toFixed(1);

    return (
        <footer className="h-20 border-t border-zinc-800 bg-black p-4 flex flex-col justify-center shrink-0">
            <h2 className="panel-header mb-2 !border-none !pb-0 text-xxs">SYSTEM OVERVIEW</h2>
            <div className="flex justify-between items-end h-full gap-8">
                <div className="flex-1 flex flex-col justify-end">
                    <div className="text-xs text-slate-400 mb-1">Audio Inputs</div>
                    <div className="text-lg font-mono leading-none">32</div>
                    <div className="h-4 mt-1 opacity-50"><div className="sparkline w-full !h-[10px]"></div></div>
                </div>
                <div className="flex-1 flex flex-col justify-end">
                    <div className="text-xs text-slate-400 mb-1">Link Status</div>
                    <div className={`text-lg font-mono leading-none ${isConnected ? 'text-brand' : 'text-red-500'}`}>{isConnected ? 'SYNC' : 'DROP'}</div>
                    <div className="h-4 mt-1 opacity-50"><div className="sparkline w-full !h-[10px]"></div></div>
                </div>
                 <div className="flex-1 flex flex-col justify-end">
                    <div className="text-xs text-slate-400 mb-1">OSC Transmit</div>
                    <div className={`text-lg font-mono leading-none ${isConnected ? 'text-slate-200' : 'text-slate-600'}`}>{isConnected ? '~120' : '0'}</div>
                    <div className="h-4 mt-1 opacity-50"><div className="sparkline w-full !h-[10px]"></div></div>
                </div>
                <div className="flex-1 flex flex-col justify-end">
                    <div className="text-xs text-slate-400 mb-1">Hardware RTT</div>
                    <div className="text-lg font-mono leading-none">{latencyMs > 0 ? latencyMs : '--'} <span className="text-sm">ms</span></div>
                    <div className="h-4 mt-1 opacity-50"><div className="sparkline w-full !h-[10px]"></div></div>
                </div>
                <div className="flex-1 flex flex-col justify-end">
                    <div className="text-xs text-slate-400 mb-1">V8 Engine Memory</div>
                    <div className="text-lg font-mono leading-none">{memoryMb} <span className="text-sm">MB</span></div>
                    <div className="h-4 mt-1 opacity-50"><div className="sparkline w-full !h-[10px]"></div></div>
                </div>
            </div>
        </footer>
    );
}
