import React, { useState } from 'react';
import { Terminal } from 'lucide-react';

interface LogEvent {
    id: number;
    time: string;
    message: string;
    type: 'info' | 'warn' | 'error' | 'success';
}

export function EventLog() {
    const [events] = useState<LogEvent[]>([
        { id: 1, time: "10:42:15", message: "OSC: /ch/01/mix/on 1", type: "info" },
        { id: 2, time: "10:42:12", message: "AI: Enmascaramiento detectado en CH 01", type: "warn" },
        { id: 3, time: "10:40:05", message: "Motor de DSP inicializado a 48kHz", type: "success" },
        { id: 4, time: "10:39:50", message: "OSC: Handshake establecido (192.168.1.50)", type: "success" }
    ]);

    const getColor = (type: string) => {
        switch(type) {
            case 'warn': return 'text-yellow-500';
            case 'error': return 'text-red-500';
            case 'success': return 'text-emerald-500';
            default: return 'text-zinc-400';
        }
    };

    return (
        <div className="flex flex-col h-48 shrink-0 bg-zinc-950 border-none">
            <div className="panel-header flex items-center gap-2 bg-zinc-950 border-none px-4 py-2">
                <Terminal className="w-3 h-3 text-zinc-500" /> 
                <span className="text-[10px]">SYSTEM LOG</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-1 space-y-0.5">
                {events.map((ev) => (
                    <div key={ev.id} className="flex gap-2 text-[9px] font-mono leading-tight hover:bg-zinc-900/50 p-1 border-b border-zinc-900">
                        <span className="text-zinc-600 shrink-0">[{ev.time}]</span> 
                        <span className={`${getColor(ev.type)} truncate`}>{ev.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
