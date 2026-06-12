"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Settings2, ExternalLink } from "lucide-react";
import { useAudioStore } from "@/lib/audio-store";
import { sendOscCommand } from "@/lib/osc-client";
import { DraggableValue } from "./DraggableValue";
import { useConsoleStore } from "@/lib/console-store";

export function DynamicsPanel({ activeChannelId }: { activeChannelId: string }) {
  const circleRef = useRef<SVGCircleElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isClipping, setIsClipping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const channel = useConsoleStore(state => state.channels.find(c => c.id === activeChannelId));
  const updateChannel = useConsoleStore(state => state.updateChannel);
  const gateThr = channel?.gate?.thr ?? -60;
  const setGateThr = (val: number) => updateChannel(activeChannelId, { gate: { thr: val } });

  const resetGate = async () => {
      setGateThr(-60); // min threshold effectively bypasses gate
      await sendOscCommand(`/ch/${activeChannelId}/dyn/thr`, [0]); // -60dB -> 0.0
      setShowMenu(false);
  };

  // Circunferencia del anillo SVG: r=40 -> 2*PI*40 ≈ 251.2
  const dashArray = 251.2;

  useEffect(() => {
    let currentLevel = -60;

    // Suscripción superficial a Zustand para evitar re-renderizados de React a 60FPS
    const unsubscribe = useAudioStore.subscribe((state) => {
      const targetDb = state.rmsLevel;
      
      // Suavizado del medidor analógico (Ataque rápido, release lento)
      if (targetDb > currentLevel) {
        currentLevel += (targetDb - currentLevel) * 0.4;
      } else {
        currentLevel += (targetDb - currentLevel) * 0.05;
      }

      if (circleRef.current) {
        const progress = Math.max(0, Math.min(1, (currentLevel + 60) / 60)); // 0 a 1
        const dashOffset = dashArray - (progress * dashArray);
        circleRef.current.style.strokeDashoffset = `${dashOffset}`;
        
        const clip = currentLevel > -3;
        circleRef.current.style.stroke = clip ? "#ef4444" : "#22c55e"; // red-500 : emerald-500
        
        // Actualizamos estado de clip solo si cambia (evita renders innecesarios)
        if (clip !== isClipping) {
            // Un pequeño truco para mutar sin re-render de estado si queremos máxima eficiencia,
            // pero usar setState aquí es seguro porque el clip cambia muy rara vez.
        }
      }

      if (textRef.current) {
        textRef.current.innerText = currentLevel <= -59.5 ? '-∞' : currentLevel.toFixed(1);
        textRef.current.className = `text-xl font-bold font-mono tracking-tighter ${currentLevel > -3 ? 'text-red-400' : 'text-slate-200'}`;
      }
    });

    return () => unsubscribe();
  }, [dashArray, isClipping]);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-black">
        <div className="flex justify-between items-center bg-zinc-950 border-b border-zinc-900 px-4 py-2 shrink-0 relative">
            <span className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase">NOISE GATE</span>
            <div className="flex items-center gap-2">
                <button onClick={() => (window as any).electron?.popoutPanel('gate', activeChannelId)} className="text-zinc-500 hover:text-zinc-300 transition-colors" title="Pop Out">
                    <ExternalLink className="w-3 h-3" />
                </button>
                <button onClick={() => setShowMenu(!showMenu)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                    <Settings2 className="w-3 h-3" />
                </button>
            </div>
            {showMenu && (
                <div className="absolute top-full right-2 mt-1 w-28 bg-black border border-zinc-800 shadow-2xl z-50">
                    <button onClick={resetGate} className="w-full text-left px-3 py-1.5 text-[9px] font-bold font-mono text-red-500 hover:bg-zinc-900 transition-colors">
                        RESET GATE
                    </button>
                </div>
            )}
        </div>

        <div className="flex-1 flex flex-col p-1.5 gap-1.5">
            <div className="flex-1 flex items-center justify-center relative bg-black border border-zinc-900 overflow-hidden">
                {/* SVG Knob Base */}
                <svg viewBox="0 0 100 100" className="w-28 h-28 transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#09090b" strokeWidth="8" />
                    <circle 
                      ref={circleRef}
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="none" 
                      stroke="#10b981" 
                      strokeWidth="8" 
                      strokeDasharray={dashArray} 
                      strokeDashoffset={dashArray} 
                      className="transition-all duration-75 ease-out" 
                      strokeLinecap="butt" 
                    />
                </svg>

                {/* Inner Values (Actualizados vía ref) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[8px] font-mono text-zinc-500 mb-0.5">RMS IN</span>
                    <span ref={textRef} className="text-xl font-bold font-mono tracking-tighter text-zinc-300">
                        -∞
                    </span>
                    <span className="text-[8px] text-zinc-600 mt-0.5 font-mono">dBFS</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-[1px] bg-zinc-900 border border-zinc-900 text-center shrink-0">
                <div className="bg-black py-1">
                    <div className="text-[8px] text-zinc-500 font-mono">GATE THR</div>
                    <DraggableValue 
                        value={gateThr}
                        min={-80}
                        max={0}
                        step={1}
                        onChange={setGateThr}
                        onComplete={async (val) => {
                            const normalizedGate = (val + 80) / 80;
                            await sendOscCommand(`/ch/${activeChannelId}/gate/thr`, [normalizedGate]);
                        }}
                        className="text-[10px] font-mono text-zinc-400 font-bold"
                    />
                </div>
                <div className="bg-black py-1">
                    <div className="text-[8px] text-zinc-500 font-mono">KEY SRC</div>
                    <div className="text-[10px] font-mono text-emerald-500 font-bold cursor-pointer hover:text-white transition-colors">CH {activeChannelId}</div>
                </div>
            </div>
        </div>
    </div>
  );
}
