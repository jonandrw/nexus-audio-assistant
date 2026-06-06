"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Settings2 } from "lucide-react";
import { useAudioEngine } from "@/lib/audio-context";

export function DynamicsPanel() {
  const { isListening, getTimeDomainData } = useAudioEngine();
  const [level, setLevel] = useState(-60);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isListening) {
      setLevel(-60);
      return;
    }

    const dataArray = new Uint8Array(2048);

    const updateLevel = () => {
      getTimeDomainData(dataArray);
      let sumSquares = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const norm = (dataArray[i] / 128.0) - 1.0;
        sumSquares += norm * norm;
      }
      const rms = Math.sqrt(sumSquares / dataArray.length);
      
      // Convertir RMS a dBFS
      let db = 20 * Math.log10(rms || 0.0001);
      if (db < -60) db = -60;
      if (db > 0) db = 0;

      // Suavizado del medidor
      setLevel(prev => {
        const target = db;
        // Ataque rápido, release lento
        return prev < target ? prev + (target - prev) * 0.4 : prev + (target - prev) * 0.05;
      });

      animationRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isListening, getTimeDomainData]);

  // Circunferencia del anillo SVG: r=40 -> 2*PI*40 ≈ 251.2
  const dashArray = 251.2;
  const progress = (level + 60) / 60; // 0 a 1
  const dashOffset = dashArray - (progress * dashArray);
  const isClipping = level > -3;

  return (
    <div className="panel flex-1 p-4 flex flex-col relative">
        <h2 className="panel-header mb-4 pb-2 border-b border-slate-800">DYNAMICS</h2>
        <button className="absolute top-4 right-4 text-slate-500 hover:text-white">
            <Settings2 className="w-4 h-4" />
        </button>

        <div className="flex-1 flex items-center justify-center relative">
            {/* SVG Knob Base */}
            <svg viewBox="0 0 100 100" className="w-32 h-32 transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="none" 
                  stroke={isClipping ? "#ef4444" : "#22c55e"} 
                  strokeWidth="8" 
                  strokeDasharray={dashArray} 
                  strokeDashoffset={dashOffset} 
                  className="transition-all duration-75 ease-out" 
                  strokeLinecap="round" 
                />
            </svg>

            {/* Inner Values */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-500 mb-1">INPUT</span>
                <span className={`text-xl font-bold font-mono tracking-tighter ${isClipping ? 'text-red-400' : 'text-slate-200'}`}>
                    {level <= -59.5 ? '-∞' : level.toFixed(1)}
                </span>
                <span className="text-xxs text-slate-500 mt-1 font-mono">dB</span>
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
