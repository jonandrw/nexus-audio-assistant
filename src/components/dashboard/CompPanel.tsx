"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Settings2 } from "lucide-react";
import { useAudioStore } from "@/lib/audio-store";
import { sendOscCommand } from "@/lib/osc-client";

export function CompPanel() {
  const [thresholdDb, setThresholdDb] = useState(-20);
  const [ratio, setRatio] = useState(4);
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Refs para actualización a 60 FPS sin re-render
  const grMeterRef = useRef<HTMLDivElement>(null);
  const grTextRef = useRef<HTMLDivElement>(null);
  const activePointRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let currentGr = 0;
    
    const unsubscribe = useAudioStore.subscribe((state) => {
      const db = state.rmsLevel;
      let targetGr = 0;
      if (db > thresholdDb) {
        // Reducción de ganancia = (Entrada - Umbral) * (1 - 1/Ratio)
        targetGr = (db - thresholdDb) * (1 - 1 / ratio);
      }
      
      // Suavizado del GR visual
      if (currentGr < targetGr) {
        currentGr += (targetGr - currentGr) * 0.4;
      } else {
        currentGr += (targetGr - currentGr) * 0.05;
      }

      const visualGr = Math.min(currentGr, 30);
      
      if (grMeterRef.current) {
        grMeterRef.current.style.height = `${(visualGr / 30) * 100}%`;
      }
      
      if (grTextRef.current) {
        grTextRef.current.innerText = `-${visualGr.toFixed(1)}`;
        grTextRef.current.className = `text-xs font-mono ${visualGr > 0.5 ? 'text-red-400 font-bold' : 'text-slate-500'}`;
      }

      if (activePointRef.current) {
         // Mapeo del punto de compresión sobre la curva SVG
         const xPercent = ((Math.max(-60, Math.min(0, db)) + 60) / 60) * 100;
         const outDb = db - currentGr;
         const yPercent = 100 - ((Math.max(-60, Math.min(0, outDb)) + 60) / 60) * 100;
         
         activePointRef.current.setAttribute("cx", `${xPercent}`);
         activePointRef.current.setAttribute("cy", `${yPercent}`);
      }
    });

    return () => unsubscribe();
  }, [thresholdDb, ratio]);

  // Manejo de Interacción: Threshold
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width);
    
    // Mapeo: 0 a 1 -> -60dB a 0dB
    let newThr = -60 + (xPercent * 60);
    newThr = Math.max(-60, Math.min(0, newThr));
    setThresholdDb(newThr);
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      (e.target as Element).releasePointerCapture(e.pointerId);
      
      // Enviar OSC. Mapeamos -60 a 0 dB -> 0.0 a 1.0
      const normalizedThr = (thresholdDb + 60) / 60;
      await sendOscCommand('/ch/01/dyn/thr', [normalizedThr]);
    }
  };

  // SVG Path Matemática de la Curva de Transferencia
  const thrX = ((thresholdDb + 60) / 60) * 100;
  const thrY = 100 - thrX; 
  const maxInX = 100;
  const maxOutDb = thresholdDb + (0 - thresholdDb) / ratio;
  const maxOutY = 100 - ((maxOutDb + 60) / 60) * 100;

  const transferPath = `M 0 100 L ${thrX} ${thrY} L ${maxInX} ${maxOutY}`;

  return (
    <div className="panel flex-1 p-4 flex flex-col relative">
        <h2 className="panel-header mb-4 pb-2 border-b border-slate-800">COMPRESSOR</h2>
        <button className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
            <Settings2 className="w-4 h-4" />
        </button>

        <div className="flex-1 flex gap-4">
            {/* GR Meter */}
            <div className="w-8 flex flex-col bg-slate-900 border border-slate-700/50 rounded overflow-hidden relative">
                <div ref={grMeterRef} className="absolute top-0 w-full bg-red-500/80 transition-all duration-75 ease-out" style={{height: '0%'}}></div>
                <div className="absolute inset-0 flex flex-col justify-between py-1 px-0.5 text-[8px] text-slate-500 font-mono text-center z-10 mix-blend-difference pointer-events-none">
                    <span>0</span><span>10</span><span>20</span><span>30</span>
                </div>
            </div>

            {/* Curva de Transferencia Interactiva */}
            <div 
              ref={containerRef}
              className="flex-1 border border-slate-700/50 rounded bg-slate-900/30 overflow-hidden relative touch-none"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
                {/* Grid Visual */}
                <div className="absolute inset-0" style={{background: 'linear-gradient(45deg, transparent 49%, rgba(100,116,139,0.2) 50%, transparent 51%)'}}></div>
                <div className="absolute inset-0" style={{background: 'linear-gradient(90deg, rgba(30,41,59,0.5) 1px, transparent 1px), linear-gradient(180deg, rgba(30,41,59,0.5) 1px, transparent 1px)', backgroundSize: '20% 20%'}}></div>
                
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full preserve-3d overflow-visible" preserveAspectRatio="none">
                    {/* Relleno de reducción */}
                    <path d={`M 0 100 L ${thrX} ${thrY} L ${maxInX} ${100 - maxInX} L ${maxInX} ${maxOutY} Z`} fill="rgba(239, 68, 68, 0.1)" />
                    
                    {/* Línea de Curva */}
                    <path d={transferPath} fill="none" stroke="#22c55e" strokeWidth="2" className="drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                    
                    {/* Threshold Handle (Controlador arrastrable) */}
                    <circle 
                      cx={thrX} 
                      cy={thrY} 
                      r={isDragging ? "6" : "4"} 
                      fill="#0B0F15" 
                      stroke="#22c55e" 
                      strokeWidth="2" 
                      className={`cursor-grab ${isDragging ? "cursor-grabbing drop-shadow-[0_0_8px_rgba(34,197,94,1)]" : "hover:r-5"} transition-all duration-75`}
                      onPointerDown={handlePointerDown}
                    />
                    
                    {/* Punto activo (simulación que se mueve con el audio real) */}
                    <circle ref={activePointRef} cx="0" cy="100" r="3" fill="#ef4444" className="drop-shadow-[0_0_5px_rgba(239,68,68,1)] pointer-events-none transition-all duration-75 ease-out" />
                </svg>
            </div>
        </div>

        <div className="flex justify-between mt-4">
            <div>
                <div className="text-[9px] text-slate-500">THR</div>
                <div className="text-xs font-mono text-brand font-bold">{thresholdDb.toFixed(1)}</div>
            </div>
            <div>
                <div className="text-[9px] text-slate-500">RATIO</div>
                <div className="text-xs font-mono text-slate-300">{ratio.toFixed(1)}:1</div>
            </div>
            <div>
                <div className="text-[9px] text-slate-500">ATK</div>
                <div className="text-xs font-mono text-slate-300">12ms</div>
            </div>
            <div className="text-right">
                <div className="text-[9px] text-slate-500">GR</div>
                <div ref={grTextRef} className="text-xs font-mono text-slate-500">-0.0</div>
            </div>
        </div>
    </div>
  );
}
