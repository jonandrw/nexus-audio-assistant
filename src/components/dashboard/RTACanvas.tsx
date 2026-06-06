"use client";

import React, { useEffect, useRef } from "react";
import { Headphones, Play, Square, Settings2, ChevronDown, Expand, MicOff } from "lucide-react";
import { Channel } from "./ChannelList";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAudioEngine } from "@/lib/audio-context";

interface RTACanvasProps {
  activeChannel: Channel | null;
}

export function RTACanvas({ activeChannel }: RTACanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const { 
    isListening, devices, selectedDeviceId, setSelectedDeviceId, 
    toggleListening, getFrequencyData 
  } = useAudioEngine();

  // Drawing the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;

    const renderBackgroundAndGrid = (width: number, height: number) => {
      ctx.fillStyle = "#0B0F15";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "#1e293b"; // slate-800
      ctx.lineWidth = 1;
      
      const freqs = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
      freqs.forEach((freq, i) => {
        const x = (i / (freqs.length - 1)) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      });

      for (let db = 0; db >= -60; db -= 12) {
        const y = Math.abs(db / 60) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    };

    const dataArray = new Uint8Array(4096 / 2);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      renderBackgroundAndGrid(w, h);

      if (isListening) {
        getFrequencyData(dataArray);

        const gradient = ctx.createLinearGradient(0, h, 0, 0);
        gradient.addColorStop(0, "rgba(34, 197, 94, 0.4)"); // emerald-500
        gradient.addColorStop(0.6, "rgba(234, 179, 8, 0.5)"); // yellow-500
        gradient.addColorStop(1, "rgba(239, 68, 68, 0.6)"); // red-500

        ctx.fillStyle = gradient;

        const bufferLength = dataArray.length;
        const barWidth = (w / bufferLength) * 2.5; 
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * h;
          ctx.fillRect(x, h - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    const resizeObserver = new ResizeObserver(() => {
      const parent = canvas.parentElement;
      if (parent) {
        dpr = window.devicePixelRatio || 1;
        canvas.width = parent.clientWidth * dpr;
        canvas.height = parent.clientHeight * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${parent.clientWidth}px`;
        canvas.style.height = `${parent.clientHeight}px`;
      }
    });

    resizeObserver.observe(canvas.parentElement!);
    draw();

    return () => {
      resizeObserver.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isListening, getFrequencyData]); 

  return (
    <div className="panel flex-1 flex flex-col p-4 min-h-0">
      <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
              <h2 className="text-xs font-semibold tracking-wide text-slate-400">ANALIZADOR (RTA)</h2>
              
              <div className="bg-slate-900 border border-slate-700 rounded px-3 py-1 flex items-center gap-2 cursor-pointer text-xs">
                <Select value={selectedDeviceId} onValueChange={(val) => { if (val) setSelectedDeviceId(val); }}>
                  <SelectTrigger className="border-none bg-transparent h-auto p-0 focus:ring-0 gap-2 font-mono text-slate-200">
                    <SelectValue placeholder="Seleccionar Interfaz" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-slate-300">
                    {devices.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId} className="text-xs focus:bg-slate-700 cursor-pointer">
                        {device.label || `Dispositivo ${device.deviceId.substring(0,5)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
          </div>
          <div className="flex items-center gap-2">
              <div className="bg-slate-900 border border-slate-700 rounded px-3 py-1 flex items-center gap-2 cursor-pointer text-xs">
                  FFT <ChevronDown className="w-3 h-3 text-slate-500" />
              </div>
              <button
                onClick={toggleListening}
                className={isListening ? "border border-red-500 text-red-500 hover:bg-red-500/10 px-3 py-1 rounded text-xs transition-colors h-auto" : "border border-brand text-brand hover:bg-brand/10 px-3 py-1 rounded text-xs transition-colors h-auto"}
              >
                {isListening ? "DETENER" : "ESCUCHAR"}
              </button>
              <button className="border border-brand text-brand hover:bg-brand/10 px-3 py-1 rounded text-xs transition-colors">INSPECTOR</button>
              <button className="w-7 h-7 rounded bg-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-600"><Expand className="w-3 h-3 text-xs" /></button>
          </div>
      </div>

      {/* Gráficos Principales */}
      <div className="flex-1 flex flex-col gap-4 relative min-h-0">
          {/* Line Chart (EQ/FFT) */}
          <div className="flex-1 relative border border-slate-700/50 rounded bg-slate-900/30 overflow-hidden">
              <canvas ref={canvasRef} className="w-full h-full block" />
              
              {!isListening && (
                <div className="absolute inset-0 bg-[#0B0F15]/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <Settings2 className="w-8 h-8 text-slate-700 mx-auto mb-2 opacity-50" />
                    <p className="text-[10px] font-mono text-slate-500">ESPERANDO SEÑAL DE HARDWARE</p>
                  </div>
                </div>
              )}

              {/* Medidores laterales dentro del gráfico */}
              <div className="absolute right-4 top-4 bottom-4 w-12 flex justify-between pointer-events-none">
                    <div className="flex flex-col justify-end gap-0.5 h-full w-4">
                      {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} className={`w-full h-1 rounded-sm opacity-80 ${i < 20 ? 'bg-brand' : i < 27 ? 'bg-yellow-500' : i < 30 ? 'bg-red-500' : 'bg-slate-700'}`} />
                      ))}
                    </div>
                    <div className="flex flex-col justify-end gap-0.5 h-full w-4">
                       {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} className={`w-full h-1 rounded-sm opacity-80 ${i < 20 ? 'bg-brand' : i < 27 ? 'bg-yellow-500' : i < 30 ? 'bg-red-500' : 'bg-slate-700'}`} />
                      ))}
                    </div>
              </div>
              <div className="absolute right-2 top-2 text-xxs text-slate-500 flex gap-4 pointer-events-none">
                  <span>IN</span><span>OUT</span><span className="text-slate-600">dB</span>
              </div>
          </div>
          
          {/* Espectrograma simulado */}
          <div className="h-1/3 border border-slate-700/50 rounded bg-slate-900/30 relative overflow-hidden flex flex-col justify-between p-1">
              <div className="absolute inset-0 opacity-80" style={{background: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(34,197,94,0.1) 2px, rgba(34,197,94,0.1) 4px), linear-gradient(180deg, rgba(2,6,23,1) 0%, rgba(13,148,136,0.5) 40%, rgba(234,179,8,0.8) 50%, rgba(13,148,136,0.5) 60%, rgba(2,6,23,1) 100%)', filter: 'blur(1px)'}}>
              </div>
              <div className="absolute inset-0 opacity-40 mix-blend-screen" style={{backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\'><filter id=\\'n\\'><feTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.8\\' numOctaves=\\'3\\' stitchTiles=\\'stitch\\'/></filter><rect width=\\'100\\' height=\\'100\\' filter=\\'url(%23n)\\' opacity=\\'0.5\\'/></svg>')"}}></div>
              
              <div className="relative z-10 flex justify-between text-xxs text-slate-500 font-mono px-2 pt-1"><span>20k</span><span>0 s</span></div>
              <div className="relative z-10 flex justify-between text-xxs text-slate-500 font-mono px-2"><span>2k</span><span>-2 s</span></div>
              <div className="relative z-10 flex justify-between text-xxs text-slate-500 font-mono px-2"><span>200</span><span>-4 s</span></div>
              <div className="relative z-10 flex justify-between text-xxs text-slate-500 font-mono px-2 pb-1"><span>20</span><span>-6 s</span></div>
          </div>
      </div>
    </div>
  );
}
