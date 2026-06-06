import React, { useState } from 'react';

interface LogEvent {
    id: number;
    time: string;
    message: string;
}

export function EventLog() {
    const [events] = useState<LogEvent[]>([
        { id: 1, time: "10:42:15", message: "OSC: /ch/01/mix/on 1" },
        { id: 2, time: "10:42:12", message: "IA: Alerta de acople en CH 01" },
        { id: 3, time: "10:40:05", message: "Sistema: Motor de audio iniciado" },
        { id: 4, time: "10:39:50", message: "OSC: Conectado a 192.168.1.50" }
    ]);

    return (
        <div className="panel h-48 p-4 flex flex-col shrink-0">
            <h2 className="panel-header mb-3">EVENTOS</h2>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 text-xs font-mono">
                {events.map((ev) => (
                    <div key={ev.id} className="flex gap-2 text-slate-400">
                        <span className="text-slate-500">{ev.time}</span> 
                        <span>{ev.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
