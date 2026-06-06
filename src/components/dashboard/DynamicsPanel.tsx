"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Settings2 } from "lucide-react";
import { useAudioStore } from "@/lib/audio-store";

export function DynamicsPanel() {
  const circleRef = useRef<SVGCircleElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isClipping, setIsClipping] = useState(false);

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
    <div className="panel flex-1 p-4 flex flex-col relative">
        <h2 className="panel-header mb-4 pb-2 border-b border-slate-800">DYNAMICS (VU METER)</h2>
        <button className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
            <Settings2 className="w-4 h-4" />
        </button>

        <div className="flex-1 flex items-center justify-center relative">
            {/* SVG Knob Base */}
            <svg viewBox="0 0 100 100" className="w-32 h-32 transform -rotate-90 drop-shadow-xl">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
                <circle 
                  ref={circleRef}
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="none" 
                  stroke="#22c55e" 
                  strokeWidth="8" 
                  strokeDasharray={dashArray} 
                  strokeDashoffset={dashArray} 
                  className="transition-all duration-75 ease-out" 
                  strokeLinecap="round" 
                />
            </svg>

            {/* Inner Values (Actualizados vía ref) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-500 mb-1">RMS IN</span>
                <span ref={textRef} className="text-xl font-bold font-mono tracking-tighter text-slate-200">
                    -∞
                </span>
                <span className="text-xxs text-slate-500 mt-1 font-mono">dBFS</span>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="bg-slate-900 rounded p-2 text-center border border-slate-800">
                <div className="text-[9px] text-slate-500 mb-1">GATE THRESHOLD</div>
                <div className="text-xs font-mono text-slate-300">-42.0 dB</div>
            </div>
            <div className="bg-slate-900 rounded p-2 text-center border border-slate-800">
                <div className="text-[9px] text-slate-500 mb-1">KEY SOURCE</div>
                <div className="text-xs font-mono text-brand">CH 01</div>
            </div>
        </div>
    </div>
  );
}
