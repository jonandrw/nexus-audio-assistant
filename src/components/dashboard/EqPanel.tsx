"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Settings2 } from "lucide-react";
import { sendOscCommand } from "@/lib/osc-client";

interface EqBand {
  id: number;
  type: string;
  freq: number;
  gain: number;
  q: number;
}

export function EqPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Estado Local de 4 Bandas Paramétricas
  const [bands, setBands] = useState<EqBand[]>([
    { id: 1, type: "HPF", freq: 80, gain: 0, q: 1 },
    { id: 2, type: "LMF", freq: 400, gain: 0, q: 1 },
    { id: 3, type: "HMF", freq: 2500, gain: 0, q: 1 },
    { id: 4, type: "LPF", freq: 10000, gain: 0, q: 1 },
  ]);

  const [draggingBandId, setDraggingBandId] = useState<number | null>(null);

  // Mapeo Logarítmico (X: 20Hz a 20kHz, Y: +15dB a -15dB)
  const freqToX = (freq: number) => {
    const minLog = Math.log10(20);
    const maxLog = Math.log10(20000);
    const currLog = Math.log10(Math.max(20, Math.min(20000, freq)));
    return ((currLog - minLog) / (maxLog - minLog)) * 100;
  };

  const xToFreq = (xPercent: number) => {
    const minLog = Math.log10(20);
    const maxLog = Math.log10(20000);
    const p = Math.max(0, Math.min(100, xPercent)) / 100;
    const logVal = minLog + p * (maxLog - minLog);
    return Math.pow(10, logVal);
  };

  const gainToY = (gain: number) => {
    const clamped = Math.max(-15, Math.min(15, gain));
    return 50 - (clamped / 15) * 50;
  };

  const yToGain = (yPercent: number) => {
    const p = Math.max(0, Math.min(100, yPercent));
    return ((50 - p) / 50) * 15;
  };

  // Interpolación de Curva Bézier para dibujar la campana
  const generateEqPath = () => {
    const sorted = [...bands].sort((a, b) => freqToX(a.freq) - freqToX(b.freq));
    let d = `M 0 50 L ${freqToX(sorted[0].freq)} ${gainToY(sorted[0].gain)}`;
    
    for(let i=0; i < sorted.length; i++){
        const b = sorted[i];
        const x = freqToX(b.freq);
        const y = gainToY(b.gain);
        
        if (i === 0) {
            d = `M 0 50 Q ${x - 5} 50, ${x} ${y}`;
        } else {
            const prev = sorted[i-1];
            const px = freqToX(prev.freq);
            const py = gainToY(prev.gain);
            const cpX = (px + x) / 2;
            d += ` S ${cpX} ${py}, ${x} ${y}`;
        }
    }
    
    const last = sorted[sorted.length-1];
    d += ` Q ${freqToX(last.freq) + 5} 50, 100 50`;
    
    return d;
  };

  const generateFillPath = () => {
    return `${generateEqPath()} L 100 100 L 0 100 Z`;
  };

  // Interactividad: Eventos de Ratón / Toque
  const handlePointerDown = (id: number) => (e: React.PointerEvent) => {
    setDraggingBandId(id);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingBandId === null || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    const newFreq = xToFreq(xPercent);
    const newGain = yToGain(yPercent);

    setBands(prev => prev.map(b => b.id === draggingBandId ? { ...b, freq: newFreq, gain: newGain } : b));
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    if (draggingBandId !== null) {
      const b = bands.find(b => b.id === draggingBandId);
      if (b) {
        // OSC WIRING: Normalización para enviar a la Midas M32
        const normalizedGain = (b.gain + 15) / 30; // 0.0 a 1.0
        
        const minLog = Math.log10(20);
        const maxLog = Math.log10(20000);
        const normalizedFreq = (Math.log10(b.freq) - minLog) / (maxLog - minLog);
        
        // Disparo de ráfaga limpia a la red (Solo cuando se suelta el clic - Debouncer Humano)
        await sendOscCommand(`/ch/01/eq/${b.id}/g`, [normalizedGain]);
        await sendOscCommand(`/ch/01/eq/${b.id}/f`, [normalizedFreq]);
      }
      setDraggingBandId(null);
      (e.target as Element).releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className="panel flex-1 p-4 flex flex-col relative">
        <h2 className="panel-header mb-4 pb-2 border-b border-slate-800">EQUALIZER</h2>
        <button className="absolute top-4 right-4 text-slate-500 hover:text-white">
            <Settings2 className="w-4 h-4" />
        </button>

        <div 
          ref={containerRef}
          className="flex-1 border border-slate-700/50 rounded bg-slate-900/30 overflow-hidden relative touch-none"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
            {/* Grid Logarítmico Visual */}
            <div className="absolute inset-0" style={{background: 'linear-gradient(90deg, rgba(30,41,59,0.5) 1px, transparent 1px), linear-gradient(180deg, rgba(30,41,59,0.5) 1px, transparent 1px)', backgroundSize: '20% 50%'}}></div>
            <div className="absolute top-1/2 left-0 right-0 border-t border-slate-600/50 border-dashed"></div>
            
            {/* Lienzo SVG del EQ */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full preserve-3d overflow-visible" preserveAspectRatio="none">
                {/* Relleno inferior */}
                <path 
                  d={generateFillPath()} 
                  fill="url(#eqGradient)" 
                  opacity="0.15"
                />
                
                {/* Línea principal */}
                <path 
                  d={generateEqPath()} 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="2" 
                  className="drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" 
                />
                <defs>
                    <linearGradient id="eqGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                </defs>
                
                {/* Nodos de Control (Drag & Drop) */}
                {bands.map((b) => {
                  const isActive = draggingBandId === b.id;
                  return (
                    <circle 
                      key={b.id}
                      cx={freqToX(b.freq)} 
                      cy={gainToY(b.gain)} 
                      r={isActive ? "5" : "3.5"} 
                      fill="#0B0F15" 
                      stroke="#10b981" 
                      strokeWidth="2" 
                      className={`cursor-grab ${isActive ? "cursor-grabbing drop-shadow-[0_0_8px_rgba(16,185,129,1)]" : "hover:r-4"} transition-all duration-75`}
                      onPointerDown={handlePointerDown(b.id)}
                    />
                  );
                })}
            </svg>

            {/* Eje X Etiquetas */}
            <div className="absolute bottom-1 left-2 right-2 flex justify-between text-[8px] text-slate-500 font-mono pointer-events-none">
                <span>20</span><span>1k</span><span>20k</span>
            </div>
        </div>
        
        <div className="grid grid-cols-4 gap-1 mt-4 text-center">
            {bands.map((b) => (
              <div key={b.id}>
                  <div className="text-[9px] text-slate-500">{b.type}</div>
                  <div className={`text-xs font-mono ${draggingBandId === b.id ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                    {b.gain > 0 ? '+' : ''}{b.gain.toFixed(1)}
                  </div>
              </div>
            ))}
        </div>
    </div>
  );
}
