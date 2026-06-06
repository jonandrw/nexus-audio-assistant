"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Settings2 } from "lucide-react";
import { useAudioEngine } from "@/lib/audio-context";

export function CompPanel() {
  const { isListening, getTimeDomainData } = useAudioEngine();
  const [gainReduction, setGainReduction] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isListening) {
      setGainReduction(0);
      return;
    }

    const dataArray = new Uint8Array(2048);
    const thresholdDb = -20;
    const ratio = 4;

    const updateComp = () => {
      getTimeDomainData(dataArray);
      let sumSquares = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const norm = (dataArray[i] / 128.0) - 1.0;
        sumSquares += norm * norm;
      }
      const rms = Math.sqrt(sumSquares / dataArray.length);
      let db = 20 * Math.log10(rms || 0.0001);
      
      let gr = 0;
      if (db > thresholdDb) {
        // Reducción de ganancia = (Entrada - Umbral) * (1 - 1/Ratio)
        gr = (db - thresholdDb) * (1 - 1/ratio);
      }

      setGainReduction(prev => {
        // Ataque rápido, relajación más lenta para el GR visual
        return prev < gr ? prev + (gr - prev) * 0.4 : prev + (gr - prev) * 0.05;
      });

      animationRef.current = requestAnimationFrame(updateComp);
    };

    updateComp();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isListening, getTimeDomainData]);

  const grValue = Math.min(gainReduction, 30); // Max 30dB GR visual
  
  return (
    <div className="panel flex-1 p-4 flex flex-col relative">
        <h2 className="panel-header mb-4 pb-2 border-b border-slate-800">COMPRESSOR</h2>
        <button className="absolute top-4 right-4 text-slate-500 hover:text-white">
            <Settings2 className="w-4 h-4" />
        </button>

        <div className="flex-1 flex gap-4">
            {/* GR Meter */}
            <div className="w-8 flex flex-col bg-slate-900 border border-slate-700/50 rounded overflow-hidden relative">
                {/* GR se dibuja desde arriba hacia abajo */}
                <div className="absolute top-0 w-full bg-red-500/80 transition-all duration-75 ease-out" style={{height: `${(grValue / 30) * 100}%`}}></div>
                <div className="absolute inset-0 flex flex-col justify-between py-1 px-0.5 text-[8px] text-slate-500 font-mono text-center z-10 mix-blend-difference pointer-events-none">
                    <span>0</span><span>10</span><span>20</span><span>30</span>
                </div>
            </div>

            {/* Curva de Transferencia */}
            <div className="flex-1 border border-slate-700/50 rounded bg-slate-900/30 overflow-hidden relative">
                <div className="absolute inset-0" style={{background: 'linear-gradient(45deg, transparent 49%, rgba(100,116,139,0.2) 50%, transparent 51%)'}}></div>
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full preserve-3d" preserveAspectRatio="none">
                    {/* Curva */}
                    <path d="M0,100 L50,50 L100,35" fill="none" stroke="#22c55e" strokeWidth="2" className="drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    {/* Punto activo (simulación que se mueve con el GR) */}
                    <circle cx={50 + (grValue * 1.5)} cy={50 - (grValue * 0.45)} r="4" fill="#0B0F15" stroke="#22c55e" strokeWidth="2" className="transition-all duration-75 ease-out" />
                </svg>
            </div>
        </div>

        <div className="flex justify-between mt-4">
            <div>
                <div className="text-[9px] text-slate-500">THR</div>
                <div className="text-xs font-mono text-slate-300">-20.0</div>
            </div>
            <div>
                <div className="text-[9px] text-slate-500">RATIO</div>
                <div className="text-xs font-mono text-slate-300">4.0:1</div>
            </div>
            <div>
                <div className="text-[9px] text-slate-500">ATK</div>
                <div className="text-xs font-mono text-slate-300">12ms</div>
            </div>
            <div className="text-right">
                <div className="text-[9px] text-slate-500">GR</div>
                <div className={`text-xs font-mono ${grValue > 0.5 ? 'text-red-400' : 'text-slate-500'}`}>
                    -{grValue.toFixed(1)}
                </div>
            </div>
        </div>
    </div>
  );
}
