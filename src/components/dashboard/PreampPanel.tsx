"use client";

import React, { useState } from 'react';
import { Settings2 } from "lucide-react";
import { sendOscCommand } from "@/lib/osc-client";
import { DraggableValue } from "./DraggableValue";

export function PreampPanel({ activeChannelId }: { activeChannelId: string }) {
  const [phantomOn, setPhantomOn] = useState(false);
  const [phaseInvert, setPhaseInvert] = useState(false);
  const [gainDb, setGainDb] = useState(0); // -12 to 60
  const [showMenu, setShowMenu] = useState(false);

  const togglePhantom = async () => {
    const nextState = !phantomOn;
    setPhantomOn(nextState);
    await sendOscCommand(`/ch/${activeChannelId}/preamp/phantom`, [nextState ? 1 : 0]);
  };

  const togglePhase = async () => {
    const nextState = !phaseInvert;
    setPhaseInvert(nextState);
    await sendOscCommand(`/ch/${activeChannelId}/preamp/invert`, [nextState ? 1 : 0]);
  };

  const handleGainChange = (val: number) => {
    setGainDb(val);
  };

  const handleGainComplete = async (val: number) => {
    // Normalizar -12 a 60 hacia 0.0 a 1.0. Rango total = 72
    const normalized = (val + 12) / 72;
    await sendOscCommand(`/ch/${activeChannelId}/preamp/gain`, [normalized]);
  };

  return (
    <div className="flex flex-col flex-1 min-w-0 min-h-0 bg-black overflow-hidden">
        <div className="flex justify-between items-center bg-zinc-950 border-b border-zinc-900 px-4 py-2 shrink-0 relative">
            <span className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase">PREAMP</span>
            <button onClick={() => setShowMenu(!showMenu)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <Settings2 className="w-3 h-3" />
            </button>
            {showMenu && (
                <div className="absolute top-full right-2 mt-1 w-24 bg-black border border-zinc-800 shadow-2xl z-50">
                    <button onClick={() => { setGainDb(0); handleGainComplete(0); }} className="w-full text-left px-3 py-1.5 text-[9px] font-bold font-mono text-emerald-500 hover:bg-zinc-900 transition-colors">
                        RESET GAIN
                    </button>
                </div>
            )}
        </div>

        <div className="flex-1 flex flex-col p-1.5 gap-1.5 justify-between">
            <div className="flex gap-1.5 shrink-0">
                <button 
                  onClick={togglePhantom}
                  className={`flex-1 py-3 text-[10px] font-bold font-mono border border-zinc-900 transition-colors ${phantomOn ? 'bg-red-900 text-red-500 border-red-900' : 'bg-black text-zinc-500 hover:bg-zinc-900'}`}
                >
                  +48V
                </button>
                <button 
                  onClick={togglePhase}
                  className={`flex-1 py-3 text-[10px] font-bold font-mono border border-zinc-900 transition-colors ${phaseInvert ? 'bg-zinc-800 text-emerald-500' : 'bg-black text-zinc-500 hover:bg-zinc-900'}`}
                >
                  Ø PHASE
                </button>
            </div>

            <div className="flex-1 border border-zinc-900 bg-black flex flex-col items-center justify-center min-h-0">
                <div className="text-[8px] text-zinc-500 font-mono mb-2">ANALOG GAIN</div>
                <DraggableValue 
                    value={gainDb}
                    min={-12} max={60} step={0.5}
                    onChange={handleGainChange}
                    onComplete={handleGainComplete}
                    format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} dB`}
                    className="text-2xl font-bold font-mono text-emerald-500 cursor-ns-resize"
                />
            </div>
            
            <div className="grid grid-cols-2 gap-[1px] bg-zinc-900 border border-zinc-900 text-center shrink-0">
                <div className="bg-black py-1">
                    <div className="text-[8px] text-zinc-500 font-mono">TRIM</div>
                    <div className="text-[10px] font-mono text-zinc-600">0.0 dB</div>
                </div>
                <div className="bg-black py-1">
                    <div className="text-[8px] text-zinc-500 font-mono">SRC</div>
                    <div className="text-[10px] font-mono text-emerald-500 font-bold uppercase">IN {activeChannelId}</div>
                </div>
            </div>
        </div>
    </div>
  );
}
