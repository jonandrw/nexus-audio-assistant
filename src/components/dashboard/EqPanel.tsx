"use client";

import React, { useRef, useState } from 'react';
import { Settings2 } from "lucide-react";
import { sendOscCommand } from "@/lib/osc-client";
import { DraggableValue } from "./DraggableValue";

interface EqBand {
  id: number;
  type: string;
  freq: number;
  gain: number;
  q: number;
}

export function EqPanel({ activeChannelId }: { activeChannelId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [bands, setBands] = useState<EqBand[]>([
    { id: 1, type: "HPF", freq: 80, gain: 0, q: 1 },
    { id: 2, type: "LMF", freq: 400, gain: 0, q: 1 },
    { id: 3, type: "HMF", freq: 2500, gain: 0, q: 1 },
    { id: 4, type: "LPF", freq: 10000, gain: 0, q: 1 },
  ]);

  const [activeBandId, setActiveBandId] = useState<number>(1);
  const [draggingBandId, setDraggingBandId] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const resetFlat = async () => {
      const flatBands = [
          { id: 1, type: "HPF", freq: 80, gain: 0, q: 1 },
          { id: 2, type: "LMF", freq: 400, gain: 0, q: 1 },
          { id: 3, type: "HMF", freq: 2500, gain: 0, q: 1 },
          { id: 4, type: "LPF", freq: 10000, gain: 0, q: 1 },
      ];
      setBands(flatBands);
      for (const b of flatBands) {
          const normalizedGain = (b.gain + 15) / 30;
          const minLog = Math.log10(20);
          const maxLog = Math.log10(20000);
          const normalizedFreq = (Math.log10(b.freq) - minLog) / (maxLog - minLog);
          await sendOscCommand(`/ch/${activeChannelId}/eq/${b.id}/g`, [normalizedGain]);
          await sendOscCommand(`/ch/${activeChannelId}/eq/${b.id}/f`, [normalizedFreq]);
          await sendOscCommand(`/ch/${activeChannelId}/eq/${b.id}/q`, [b.q / 10]);
      }
      setShowMenu(false);
  };

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

  const handlePointerDown = (id: number) => (e: React.PointerEvent) => {
    setActiveBandId(id);
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

  const updateBand = (id: number, updates: Partial<EqBand>) => {
    setBands(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const sendBandOsc = async (b: EqBand) => {
      const normalizedGain = (b.gain + 15) / 30;
      const minLog = Math.log10(20);
      const maxLog = Math.log10(20000);
      const normalizedFreq = (Math.log10(b.freq) - minLog) / (maxLog - minLog);
      
      await sendOscCommand(`/ch/${activeChannelId}/eq/${b.id}/g`, [normalizedGain]);
      await sendOscCommand(`/ch/${activeChannelId}/eq/${b.id}/f`, [normalizedFreq]);
      await sendOscCommand(`/ch/${activeChannelId}/eq/${b.id}/q`, [b.q / 10]);
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    if (draggingBandId !== null) {
      const b = bands.find(b => b.id === draggingBandId);
      if (b) {
         await sendBandOsc(b);
      }
      setDraggingBandId(null);
      (e.target as Element).releasePointerCapture(e.pointerId);
    }
  };

  const cycleType = () => {
      const types = ['HPF', 'LMF', 'HMF', 'LPF', 'PEQ', 'VEQ'];
      const current = bands.find(b => b.id === activeBandId);
      if (!current) return;
      const nextType = types[(types.indexOf(current.type) + 1) % types.length];
      updateBand(activeBandId, { type: nextType });
  };

  const activeBand = bands.find(b => b.id === activeBandId)!;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-black">
        <div className="flex justify-between items-center bg-zinc-950 border-b border-zinc-900 px-4 py-2 shrink-0 relative">
            <span className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase">PARAMETRIC EQ</span>
            <button onClick={() => setShowMenu(!showMenu)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <Settings2 className="w-3 h-3" />
            </button>
            {showMenu && (
                <div className="absolute top-full right-2 mt-1 w-24 bg-black border border-zinc-800 shadow-2xl z-50">
                    <button onClick={resetFlat} className="w-full text-left px-3 py-1.5 text-[9px] font-bold font-mono text-red-500 hover:bg-zinc-900 transition-colors">
                        FLAT EQ
                    </button>
                </div>
            )}
        </div>

        <div className="flex-1 flex flex-col p-1.5 gap-1.5">
          <div 
            ref={containerRef}
            className="flex-1 border border-zinc-900 bg-black overflow-hidden relative touch-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
              <div className="absolute inset-0 pointer-events-none" style={{background: 'linear-gradient(90deg, rgba(39,39,42,0.4) 1px, transparent 1px), linear-gradient(180deg, rgba(39,39,42,0.4) 1px, transparent 1px)', backgroundSize: '20% 50%'}}></div>
              <div className="absolute top-1/2 left-0 right-0 border-t border-zinc-800 border-dashed pointer-events-none"></div>
              
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full preserve-3d overflow-visible" preserveAspectRatio="none">
                  <path d={generateFillPath()} fill="url(#eqGradient)" opacity="0.15" />
                  <path d={generateEqPath()} fill="none" stroke="#10b981" strokeWidth="2" className="drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                  <defs>
                      <linearGradient id="eqGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                  </defs>
                  
                  {bands.map((b) => {
                    const isDragging = draggingBandId === b.id;
                    const isActive = activeBandId === b.id;
                    return (
                      <circle 
                        key={b.id}
                        cx={freqToX(b.freq)} 
                        cy={gainToY(b.gain)} 
                        r={isDragging ? "6" : isActive ? "5" : "3.5"} 
                        fill={isActive ? "#10b981" : "#09090b"} 
                        stroke="#10b981" 
                        strokeWidth="2" 
                        className={`cursor-grab ${isDragging ? "cursor-grabbing drop-shadow-[0_0_8px_rgba(16,185,129,1)]" : ""} transition-all duration-75`}
                        onPointerDown={handlePointerDown(b.id)}
                      />
                    );
                  })}
              </svg>

              <div className="absolute bottom-1 left-2 right-2 flex justify-between text-[8px] text-zinc-600 font-mono pointer-events-none">
                  <span>20</span><span>1k</span><span>20k</span>
              </div>
          </div>
          
          <div className="flex flex-col border border-zinc-900 shrink-0">
              <div className="flex bg-black border-b border-zinc-900">
                  {[1,2,3,4].map(id => (
                      <button 
                        key={id}
                        onClick={() => setActiveBandId(id)}
                        className={`flex-1 py-1 text-[9px] font-bold font-mono border-r border-zinc-900 last:border-0 ${activeBandId === id ? 'bg-zinc-800 text-emerald-500' : 'text-zinc-500 hover:bg-zinc-900'}`}
                      >
                          BAND {id}
                      </button>
                  ))}
              </div>
              <div className="grid grid-cols-4 gap-[1px] bg-zinc-900 text-center">
                  <div className="bg-black py-1 cursor-pointer hover:bg-zinc-900 transition-colors" onClick={cycleType}>
                      <div className="text-[8px] text-zinc-500 font-mono">TYPE</div>
                      <div className="text-[10px] font-bold font-mono text-emerald-500">{activeBand.type}</div>
                  </div>
                  <div className="bg-black py-1">
                      <div className="text-[8px] text-zinc-500 font-mono">FREQ</div>
                      <DraggableValue 
                          value={activeBand.freq}
                          min={20} max={20000} step={activeBand.freq > 1000 ? 50 : 5}
                          onChange={(v) => updateBand(activeBand.id, {freq: v})}
                          onComplete={() => sendBandOsc(activeBand)}
                          format={(v) => v >= 1000 ? `${(v/1000).toFixed(2)}k` : `${Math.round(v)}`}
                          className="text-[10px] font-bold font-mono text-slate-300"
                      />
                  </div>
                  <div className="bg-black py-1">
                      <div className="text-[8px] text-zinc-500 font-mono">GAIN</div>
                      <DraggableValue 
                          value={activeBand.gain} min={-15} max={15} step={0.5}
                          onChange={(v) => updateBand(activeBand.id, {gain: v})}
                          onComplete={() => sendBandOsc(activeBand)}
                          format={(v) => `${v>0?'+':''}${v.toFixed(1)}`}
                          className="text-[10px] font-bold font-mono text-slate-300"
                      />
                  </div>
                  <div className="bg-black py-1">
                      <div className="text-[8px] text-zinc-500 font-mono">Q</div>
                      <DraggableValue 
                          value={activeBand.q} min={0.3} max={10} step={0.1}
                          onChange={(v) => updateBand(activeBand.id, {q: v})}
                          onComplete={() => sendBandOsc(activeBand)}
                          format={(v) => v.toFixed(1)}
                          className="text-[10px] font-bold font-mono text-slate-300"
                      />
                  </div>
              </div>
          </div>
        </div>
    </div>
  );
}
