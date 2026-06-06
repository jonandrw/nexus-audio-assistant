"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Settings2 } from "lucide-react";
import { useAudioEngine } from "@/lib/audio-context";

export function EqPanel() {
  const { isListening, getFrequencyData } = useAudioEngine();
  const [bands, setBands] = useState({ low: 0, mid: 0, high: 0 });
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isListening) {
      setBands({ low: 0, mid: 0, high: 0 });
      return;
    }

    const dataArray = new Uint8Array(4096 / 2);

    const updateEq = () => {
      getFrequencyData(dataArray);
      
      // Agrupación simple de bandas (Low, Mid, High)
      let lowSum = 0, midSum = 0, highSum = 0;
      const bufferLength = dataArray.length;
      
      for(let i=0; i<21; i++) lowSum += dataArray[i]; // ~0-250Hz
      for(let i=21; i<340; i++) midSum += dataArray[i]; // ~250-4kHz
      for(let i=340; i<bufferLength; i++) highSum += dataArray[i]; // ~4k+

      const lowAvg = lowSum / 21;
      const midAvg = midSum / (340 - 21);
      const highAvg = highSum / (bufferLength - 340);

      // Suavizado visual de la curva
      setBands(prev => ({
        low: prev.low + (lowAvg - prev.low) * 0.15,
        mid: prev.mid + (midAvg - prev.mid) * 0.15,
        high: prev.high + (highAvg - prev.high) * 0.15
      }));

      animationRef.current = requestAnimationFrame(updateEq);
    };

    updateEq();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isListening, getFrequencyData]);

  // Mapeamos energía de 0-255 a coordenadas de SVG
  const lowY = 60 - (bands.low / 255) * 20;
  const midY = 40 - (bands.mid / 255) * 30;
  const highY = 50 - (bands.high / 255) * 20;

  return (
    <div className="panel flex-1 p-4 flex flex-col relative">
        <h2 className="panel-header mb-4 pb-2 border-b border-slate-800">EQUALIZER</h2>
        <button className="absolute top-4 right-4 text-slate-500 hover:text-white">
            <Settings2 className="w-4 h-4" />
        </button>

        <div className="flex-1 border border-slate-700/50 rounded bg-slate-900/30 overflow-hidden relative">
            {/* Grid Estático */}
            <div className="absolute inset-0" style={{background: 'linear-gradient(90deg, rgba(30,41,59,0.5) 1px, transparent 1px), linear-gradient(180deg, rgba(30,41,59,0.5) 1px, transparent 1px)', backgroundSize: '20% 20%'}}></div>
            
            {/* Curva SVG Dinámica */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full preserve-3d" preserveAspectRatio="none">
                <path 
                  d={`M0,50 Q20,${lowY} 40,50 T80,${midY} T100,${highY}`} 
                  fill="none" 
                  stroke="#22c55e" 
                  strokeWidth="2" 
                  className="drop-shadow-[0_0_8px_rgba(34,197,94,0.5)] transition-all duration-75 ease-out" 
                />
                <path 
                  d={`M0,100 L0,50 Q20,${lowY} 40,50 T80,${midY} T100,${highY} L100,100 Z`} 
                  fill="url(#eqGradient)" 
                  opacity="0.2"
                  className="transition-all duration-75 ease-out"
                />
                <defs>
                    <linearGradient id="eqGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                </defs>
                {/* Nodos de Frecuencia */}
                <circle cx="20" cy={lowY} r="3" fill="#0B0F15" stroke="#22c55e" strokeWidth="2" className="transition-all duration-75 ease-out" />
                <circle cx="50" cy={midY} r="3" fill="#0B0F15" stroke="#22c55e" strokeWidth="2" className="transition-all duration-75 ease-out" />
                <circle cx="80" cy={highY} r="3" fill="#0B0F15" stroke="#22c55e" strokeWidth="2" className="transition-all duration-75 ease-out" />
            </svg>

            <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[8px] text-slate-500 font-mono pointer-events-none">
                <span>100</span><span>1k</span><span>10k</span>
            </div>
        </div>
        
        <div className="grid grid-cols-4 gap-1 mt-4 text-center">
            <div>
                <div className="text-[9px] text-slate-500">LOW</div>
                <div className="text-xs font-mono text-brand">{((bands.low/255)*6).toFixed(1)}</div>
            </div>
            <div>
                <div className="text-[9px] text-slate-500">L-MID</div>
                <div className="text-xs font-mono text-slate-300">-2.0</div>
            </div>
            <div>
                <div className="text-[9px] text-slate-500">H-MID</div>
                <div className="text-xs font-mono text-brand">{((bands.mid/255)*6).toFixed(1)}</div>
            </div>
            <div>
                <div className="text-[9px] text-slate-500">HIGH</div>
                <div className="text-xs font-mono text-brand">{((bands.high/255)*3).toFixed(1)}</div>
            </div>
        </div>
    </div>
  );
}
