"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Settings2, ExternalLink } from "lucide-react";
import { sendOscCommand } from "@/lib/osc-client";
import { DraggableValue } from "./DraggableValue";
import { useConsoleStore, EqBand } from "@/lib/console-store";

export function EqPanel({ activeChannelId }: { activeChannelId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const channel = useConsoleStore(state => state.channels.find(c => c.id === activeChannelId));
  const updateChannel = useConsoleStore(state => state.updateChannel);
  const bands = channel?.eqBands || [
    { id: 1, type: "HPF", freq: 80, gain: 0, q: 1 },
    { id: 2, type: "LMF", freq: 400, gain: 0, q: 1 },
    { id: 3, type: "HMF", freq: 2500, gain: 0, q: 1 },
    { id: 4, type: "LPF", freq: 10000, gain: 0, q: 1 },
  ];

  const [activeBandId, setActiveBandId] = useState<number>(1);
  const [draggingBandId, setDraggingBandId] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 300 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const resetFlat = async () => {
      const flatBands = [
          { id: 1, type: "HPF", freq: 80, gain: 0, q: 1 },
          { id: 2, type: "LMF", freq: 400, gain: 0, q: 1 },
          { id: 3, type: "HMF", freq: 2500, gain: 0, q: 1 },
          { id: 4, type: "LPF", freq: 10000, gain: 0, q: 1 },
      ];
      updateChannel(activeChannelId, { eqBands: flatBands });
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
    return ((currLog - minLog) / (maxLog - minLog)) * dimensions.width;
  };

  const xToFreq = (xPix: number) => {
    const minLog = Math.log10(20);
    const maxLog = Math.log10(20000);
    const p = Math.max(0, Math.min(dimensions.width, xPix)) / dimensions.width;
    const logVal = minLog + p * (maxLog - minLog);
    return Math.pow(10, logVal);
  };

  const gainToY = (gain: number) => {
    const clamped = Math.max(-15, Math.min(15, gain));
    return (dimensions.height / 2) - (clamped / 15) * (dimensions.height / 2);
  };

  const yToGain = (yPix: number) => {
    const p = Math.max(0, Math.min(dimensions.height, yPix));
    return (((dimensions.height / 2) - p) / (dimensions.height / 2)) * 15;
  };

  const generateEqPath = () => {
    let d = "";
    const step = 2; // Resolución de 2 píxeles para máximo rendimiento y suavidad
    for (let x = 0; x <= dimensions.width; x += step) {
      let totalGain = 0;
      const f = xToFreq(x);
      
      for (const b of bands) {
        if (b.gain === 0 && b.type !== 'HPF' && b.type !== 'LPF') continue;
        
        if (b.type === 'HPF') {
          if (f < b.freq) {
             const g = 40 * Math.log10(f / b.freq); // Pendiente de 12dB/octava
             totalGain += Math.max(-60, g);
          }
        } else if (b.type === 'LPF') {
          if (f > b.freq) {
             const g = -40 * Math.log10(f / b.freq);
             totalGain += Math.max(-60, g);
          }
        } else {
          // Aproximación matemática precisa de curva de campana (Bell / PEQ)
          const w = f / b.freq;
          const invW = b.freq / f;
          const denominator = 1 + Math.pow(b.q * (w - invW), 2);
          totalGain += b.gain / denominator;
        }
      }
      
      const y = gainToY(totalGain);
      if (x === 0) d += `M ${x} ${y}`;
      else d += ` L ${x} ${y}`;
    }
    return d;
  };

  const generateFillPath = () => {
    return `${generateEqPath()} L ${dimensions.width} ${dimensions.height} L 0 ${dimensions.height} Z`;
  };

  const handlePointerDown = (id: number) => (e: React.PointerEvent) => {
    setActiveBandId(id);
    setDraggingBandId(id);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingBandId === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPix = e.clientX - rect.left;
    const yPix = e.clientY - rect.top;

    const newFreq = xToFreq(xPix);
    const newGain = yToGain(yPix);

    updateChannel(activeChannelId, { 
      eqBands: bands.map(b => b.id === draggingBandId ? { ...b, freq: newFreq, gain: newGain } : b)
    });
  };

  const updateBand = (id: number, updates: Partial<EqBand>) => {
    updateChannel(activeChannelId, { 
      eqBands: bands.map(b => b.id === id ? { ...b, ...updates } : b)
    });
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

  const handleWheel = (e: React.WheelEvent) => {
    if (activeBandId === null) return;
    const band = bands.find(b => b.id === activeBandId);
    if (!band) return;
    
    // deltaY > 0 (scroll abajo) -> Q menor (más ancho)
    // deltaY < 0 (scroll arriba) -> Q mayor (más estrecho, más precisión)
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    let newQ = band.q + delta;
    newQ = Math.max(0.3, Math.min(10, newQ));
    
    updateBand(activeBandId, { q: newQ });
    
    if ((window as any).qTimeout) clearTimeout((window as any).qTimeout);
    (window as any).qTimeout = setTimeout(() => {
      sendBandOsc({ ...band, q: newQ });
    }, 100);
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
            <div className="flex items-center gap-2">
                <button onClick={() => (window as any).electron?.popoutPanel('eq', activeChannelId)} className="text-zinc-500 hover:text-zinc-300 transition-colors" title="Pop Out">
                    <ExternalLink className="w-3 h-3" />
                </button>
                <button onClick={() => setShowMenu(!showMenu)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                    <Settings2 className="w-3 h-3" />
                </button>
            </div>
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
            onWheel={handleWheel}
          >
              <div className="absolute inset-0 pointer-events-none" style={{background: 'linear-gradient(90deg, rgba(39,39,42,0.4) 1px, transparent 1px), linear-gradient(180deg, rgba(39,39,42,0.4) 1px, transparent 1px)', backgroundSize: '20% 50%'}}></div>
              <div className="absolute top-1/2 left-0 right-0 border-t border-zinc-800 border-dashed pointer-events-none"></div>
              
              <svg viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} className="absolute inset-0 w-full h-full preserve-3d overflow-visible">
                  <path d={generateFillPath()} fill="url(#eqGradient)" opacity="0.15" />
                  <path d={generateEqPath()} fill="none" stroke="#10b981" strokeWidth="2" className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <defs>
                      <linearGradient id="eqGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                  </defs>
                  
                  {/* Crosshairs for dragging band */}
                  {draggingBandId && (
                      <g className="pointer-events-none">
                          <line x1={freqToX(bands.find(b => b.id === draggingBandId)!.freq)} y1="0" x2={freqToX(bands.find(b => b.id === draggingBandId)!.freq)} y2={dimensions.height} stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                          <line x1="0" y1={gainToY(bands.find(b => b.id === draggingBandId)!.gain)} x2={dimensions.width} y2={gainToY(bands.find(b => b.id === draggingBandId)!.gain)} stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                      </g>
                  )}

                  {bands.map((b) => {
                    const isDragging = draggingBandId === b.id;
                    const isActive = activeBandId === b.id;
                    const x = freqToX(b.freq);
                    const y = gainToY(b.gain);
                    return (
                      <g key={b.id} className="cursor-grab hover:cursor-grabbing">
                        {/* Glow and Hit Area */}
                        {(isActive || isDragging) && (
                           <circle cx={x} cy={y} r="16" fill="#10b981" opacity="0.2" className="pointer-events-none animate-pulse" />
                        )}
                        <circle 
                          cx={x} 
                          cy={y} 
                          r="24" 
                          fill="transparent"
                          onPointerDown={handlePointerDown(b.id)}
                        />
                        <circle 
                          cx={x} 
                          cy={y} 
                          r={isDragging ? "7" : isActive ? "6" : "5"} 
                          fill={isActive ? "#10b981" : "#09090b"} 
                          stroke="#10b981" 
                          strokeWidth="2.5" 
                          className={`pointer-events-none transition-all duration-75`}
                        />
                      </g>
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
