import React from 'react';

export function BottomBar() {
    return (
        <footer className="h-20 border-t border-slate-700 bg-slate-800 p-4 flex flex-col justify-center shrink-0">
            <h2 className="panel-header mb-2 !border-none !pb-0 text-xxs">SYSTEM OVERVIEW</h2>
            <div className="flex justify-between items-end h-full gap-8">
                <div className="flex-1 flex flex-col justify-end">
                    <div className="text-xs text-slate-400 mb-1">Audio Inputs</div>
                    <div className="text-lg font-mono leading-none">32</div>
                    <div className="h-4 mt-1 opacity-50"><div className="sparkline w-full !h-[10px]"></div></div>
                </div>
                <div className="flex-1 flex flex-col justify-end">
                    <div className="text-xs text-slate-400 mb-1">Active Sources</div>
                    <div className="text-lg font-mono leading-none">18</div>
                    <div className="h-4 mt-1 opacity-50"><div className="sparkline w-full !h-[10px]"></div></div>
                </div>
                 <div className="flex-1 flex flex-col justify-end">
                    <div className="text-xs text-slate-400 mb-1">OSC Msg / sec</div>
                    <div className="text-lg font-mono leading-none">145</div>
                    <div className="h-4 mt-1 opacity-50"><div className="sparkline w-full !h-[10px]"></div></div>
                </div>
                <div className="flex-1 flex flex-col justify-end">
                    <div className="text-xs text-slate-400 mb-1">Latency</div>
                    <div className="text-lg font-mono leading-none">4.2 <span className="text-sm">ms</span></div>
                    <div className="h-4 mt-1 opacity-50"><div className="sparkline w-full !h-[10px]"></div></div>
                </div>
                <div className="flex-1 flex flex-col justify-end">
                    <div className="text-xs text-slate-400 mb-1">CPU Usage</div>
                    <div className="text-lg font-mono leading-none">12%</div>
                    <div className="h-4 mt-1 opacity-50"><div className="sparkline w-full !h-[10px]"></div></div>
                </div>
                <div className="flex-1 flex flex-col justify-end">
                    <div className="text-xs text-slate-400 mb-1">Packet Loss</div>
                    <div className="text-lg font-mono leading-none">0.0%</div>
                    <div className="h-4 mt-1 opacity-50"><div className="sparkline w-full !h-[10px]"></div></div>
                </div>
            </div>
        </footer>
    );
}
