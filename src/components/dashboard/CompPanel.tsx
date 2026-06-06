"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Settings2 } from "lucide-react";
import { useAudioStore } from "@/lib/audio-store";
import { sendOscCommand } from "@/lib/osc-client";
import { DraggableValue } from "./DraggableValue";

export function CompPanel({ activeChannelId }: { activeChannelId: string }) {
  const [thresholdDb, setThresholdDb] = useState(-20);
  const [ratio, setRatio] = useState(4);
  const [attack, setAttack] = useState(12);
  const [release, setRelease] = useState(150);
  
  const [isDragging, setIsDragging] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const resetComp = async () => {
      setThresholdDb(0);
      setRatio(1);
      setAttack(12);
      setRelease(150);
      await sendOscCommand(`/ch/${activeChannelId}/dyn/thr`, [1]); // 0dB
      await sendOscCommand(`/ch/${activeChannelId}/dyn/ratio`, [0.01]);
      await sendOscCommand(`/ch/${activeChannelId}/dyn/atk`, [0.12]);
      await sendOscCommand(`/ch/${activeChannelId}/dyn/rel`, [0.15]);
      setShowMenu(false);
  };
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  const grMeterRef = useRef<HTMLDivElement>(null);
  const grTextRef = useRef<HTMLDivElement>(null);
  const activePointRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let currentGr = 0;
    
    const unsubscribe = useAudioStore.subscribe((state) => {
      const db = state.rmsLevel;
      let targetGr = 0;
      if (db > thresholdDb) {
        targetGr = (db - thresholdDb) * (1 - 1 / ratio);
      }
      
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
        grTextRef.current.className = `text-[10px] font-mono ${visualGr > 0.5 ? 'text-red-400 font-bold' : 'text-zinc-500'}`;
      }

      if (activePointRef.current) {
         const xPercent = ((Math.max(-60, Math.min(0, db)) + 60) / 60) * 100;
         const outDb = db - currentGr;
         const yPercent = 100 - ((Math.max(-60, Math.min(0, outDb)) + 60) / 60) * 100;
         
         activePointRef.current.setAttribute("cx", `${xPercent}`);
         activePointRef.current.setAttribute("cy", `${yPercent}`);
      }
    });

    return () => unsubscribe();
  }, [thresholdDb, ratio]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width);
    
    let newThr = -60 + (xPercent * 60);
    newThr = Math.max(-60, Math.min(0, newThr));
    setThresholdDb(newThr);
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      (e.target as Element).releasePointerCapture(e.pointerId);
      
      const normalizedThr = (thresholdDb + 60) / 60;
      await sendOscCommand(`/ch/${activeChannelId}/dyn/thr`, [normalizedThr]);
    }
  };

  const thrX = ((thresholdDb + 60) / 60) * 100;
  const thrY = 100 - thrX; 
  const maxInX = 100;
  const maxOutDb = thresholdDb + (0 - thresholdDb) / ratio;
  const maxOutY = 100 - ((maxOutDb + 60) / 60) * 100;

  const transferPath = `M 0 100 L ${thrX} ${thrY} L ${maxInX} ${maxOutY}`;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-black border-l border-zinc-900">
        <div className="flex justify-between items-center bg-zinc-950 border-b border-zinc-900 px-4 py-2 shrink-0 relative">
            <span className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase">COMPRESSOR</span>
            <button onClick={() => setShowMenu(!showMenu)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <Settings2 className="w-3 h-3" />
            </button>
            {showMenu && (
                <div className="absolute top-full right-2 mt-1 w-28 bg-black border border-zinc-800 shadow-2xl z-50">
                    <button onClick={resetComp} className="w-full text-left px-3 py-1.5 text-[9px] font-bold font-mono text-red-500 hover:bg-zinc-900 transition-colors">
                        RESET COMP
                    </button>
                </div>
            )}
        </div>

        <div className="flex-1 flex flex-col p-1.5 gap-1.5">
            <div className="flex-1 flex gap-1.5">
                <div className="w-6 flex flex-col bg-black border border-zinc-900 overflow-hidden relative">
                    <div ref={grMeterRef} className="absolute top-0 w-full bg-red-500 transition-all duration-75 ease-out" style={{height: '0%'}}></div>
                    <div className="absolute inset-0 flex flex-col justify-between py-1 px-0 text-[8px] text-zinc-500 font-mono text-center z-10 mix-blend-difference pointer-events-none">
                        <span>0</span><span>10</span><span>20</span><span>30</span>
                    </div>
                </div>

                <div 
                  ref={containerRef}
                  className="flex-1 border border-zinc-900 bg-black overflow-hidden relative touch-none"
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                    <div className="absolute inset-0 pointer-events-none" style={{background: 'linear-gradient(45deg, transparent 49%, rgba(39,39,42,0.5) 50%, transparent 51%)'}}></div>
                    <div className="absolute inset-0 pointer-events-none" style={{background: 'linear-gradient(90deg, rgba(39,39,42,0.4) 1px, transparent 1px), linear-gradient(180deg, rgba(39,39,42,0.4) 1px, transparent 1px)', backgroundSize: '20% 20%'}}></div>
                    
                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full preserve-3d overflow-visible" preserveAspectRatio="none">
                        <path d={`M 0 100 L ${thrX} ${thrY} L ${maxInX} ${100 - maxInX} L ${maxInX} ${maxOutY} Z`} fill="rgba(239, 68, 68, 0.15)" />
                        <path d={transferPath} fill="none" stroke="#10b981" strokeWidth="2" className="drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                        
                        <circle 
                          cx={thrX} 
                          cy={thrY} 
                          r={isDragging ? "6" : "4"} 
                          fill="#09090b" 
                          stroke="#10b981" 
                          strokeWidth="2" 
                          className={`cursor-grab ${isDragging ? "cursor-grabbing drop-shadow-[0_0_8px_rgba(16,185,129,1)]" : ""} transition-all duration-75`}
                          onPointerDown={handlePointerDown}
                        />
                        <circle ref={activePointRef} cx="0" cy="100" r="3" fill="#ef4444" className="pointer-events-none transition-all duration-75 ease-out" />
                    </svg>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-[1px] bg-zinc-900 border border-zinc-900 text-center shrink-0 mb-[1px]">
                <div className="bg-black py-1">
                    <div className="text-[8px] text-zinc-500 font-mono">THR</div>
                    <DraggableValue 
                        value={thresholdDb} min={-60} max={0} step={0.5}
                        onChange={setThresholdDb}
                        onComplete={async (val) => await sendOscCommand(`/ch/${activeChannelId}/dyn/thr`, [(val + 60) / 60])}
                        className="text-[10px] font-mono text-emerald-500 font-bold"
                    />
                </div>
                <div className="bg-black py-1">
                    <div className="text-[8px] text-zinc-500 font-mono">RATIO</div>
                    <DraggableValue 
                        value={ratio} min={1} max={100} step={1}
                        onChange={setRatio}
                        onComplete={async (val) => await sendOscCommand(`/ch/${activeChannelId}/dyn/ratio`, [val / 100])}
                        format={(val) => `${val.toFixed(1)}:1`}
                        className="text-[10px] font-mono text-zinc-300"
                    />
                </div>
                <div className="bg-black py-1">
                    <div className="text-[8px] text-zinc-500 font-mono">GR</div>
                    <div ref={grTextRef} className="text-[10px] font-mono text-zinc-500">-0.0</div>
                </div>
            </div>
            
            <div className="grid grid-cols-3 gap-[1px] bg-zinc-900 border border-zinc-900 text-center shrink-0">
                <div className="bg-black py-1">
                    <div className="text-[8px] text-zinc-500 font-mono">ATK</div>
                    <DraggableValue 
                        value={attack} min={1} max={100} step={1}
                        onChange={setAttack}
                        onComplete={async (val) => await sendOscCommand(`/ch/${activeChannelId}/dyn/atk`, [val / 100])}
                        format={(val) => `${val}ms`}
                        className="text-[10px] font-mono text-zinc-300"
                    />
                </div>
                <div className="bg-black py-1">
                    <div className="text-[8px] text-zinc-500 font-mono">HOLD</div>
                    <DraggableValue 
                        value={0} min={0} max={100} step={1}
                        onChange={() => {}}
                        format={(val) => `${val}ms`}
                        className="text-[10px] font-mono text-zinc-300"
                    />
                </div>
                <div className="bg-black py-1">
                    <div className="text-[8px] text-zinc-500 font-mono">REL</div>
                    <DraggableValue 
                        value={release} min={10} max={1000} step={10}
                        onChange={setRelease}
                        onComplete={async (val) => await sendOscCommand(`/ch/${activeChannelId}/dyn/rel`, [val / 1000])}
                        format={(val) => `${val}ms`}
                        className="text-[10px] font-mono text-zinc-300"
                    />
                </div>
            </div>
        </div>
    </div>
  );
}
