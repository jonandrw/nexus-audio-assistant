import React from 'react';
import { Wifi } from 'lucide-react';

export function NetworkPanel() {
    return (
        <div className="panel p-4 h-32 flex flex-col shrink-0">
            <div className="flex justify-between items-center mb-2">
                <h2 className="panel-header mb-0 border-none pb-0">NETWORK</h2>
                <Wifi className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex justify-between items-baseline mb-2">
                <span className="font-mono text-slate-300">192.168.1.100</span>
                <span className="text-xs text-slate-400">1000 Mbps</span>
            </div>
            <div className="flex-1 w-full bg-slate-900/50 rounded overflow-hidden flex items-end">
                <div className="sparkline"></div>
            </div>
        </div>
    );
}
