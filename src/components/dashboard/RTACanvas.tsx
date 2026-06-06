"use client";

import React, { useEffect, useRef } from "react";
import { Settings2, ChevronDown, Expand } from "lucide-react";
import { Channel } from "./ChannelList";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAudioEngine } from "@/lib/audio-context";
import { FeedbackDetector, MaskingDetector, calculateRMS } from "@/lib/audio-analyzer";
import { useAIStore } from "@/lib/ai-store";
import { useAudioStore } from "@/lib/audio-store";

interface RTACanvasProps {
  activeChannel: Channel | null;
}

export function RTACanvas({ activeChannel }: RTACanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waterfallCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const detectorRef = useRef<FeedbackDetector>(new FeedbackDetector());
  const maskingDetectorRef = useRef<MaskingDetector>(new MaskingDetector());
  const addAlert = useAIStore(state => state.addAlert);
  const setRmsLevel = useAudioStore(state => state.setRmsLevel);
  
  const { 
    isListening, devices, selectedDeviceId, setSelectedDeviceId, 
    toggleListening, getFrequencyData, getSampleRate, getFloatTimeDomainData
  } = useAudioEngine();

  // Drawing the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const waterfallCanvas = waterfallCanvasRef.current;
    if (!canvas || !waterfallCanvas) return;
    
    const ctx = canvas.getContext("2d", { alpha: false });
    const waterfallCtx = waterfallCanvas.getContext("2d", { alpha: false });
    if (!ctx || !waterfallCtx) return;

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
    const floatTimeData = new Float32Array(4096 / 2);

    const draw = () => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      renderBackgroundAndGrid(w, h);

      if (isListening) {
        getFrequencyData(dataArray);
        getFloatTimeDomainData(floatTimeData);

        // --- Cálculo de Dinámicas (RMS Centralizado) ---
        const rmsDb = calculateRMS(floatTimeData);
        setRmsLevel(rmsDb);

        // --- Análisis DSP en tiempo real (Zustand) ---
        const alert = detectorRef.current.analyze(dataArray, getSampleRate());
        if (alert) {
          const freq = Math.round(alert.frequencyHz);
          const channelStr = activeChannel ? activeChannel.number.toString().padStart(2, '0') : "01";
          
          addAlert({
             id: `alert-${Date.now()}-${freq}`,
             type: "alert",
             title: "¡Riesgo de Acople!",
             description: alert.message,
             actionText: `Cortar -7.5dB`,
             targetChannel: channelStr,
             targetFreq: freq
          });
        }

        // --- Detección de Enmascaramiento (Masking) ---
        // Clonamos el buffer simulando un segundo canal compitiendo en graves (60-250Hz)
        const dummyData2 = new Uint8Array(dataArray); 
        const maskingAlert = maskingDetectorRef.current.analyze(dataArray, dummyData2, getSampleRate());
        
        if (maskingAlert) {
          addAlert({
             id: `masking-${Date.now()}-${maskingAlert.targetFreq}`,
             type: "masking",
             title: maskingAlert.title,
             description: maskingAlert.description,
             actionText: maskingAlert.actionText,
             targetChannel: "01",
             targetFreq: maskingAlert.targetFreq
          });
        }

        const gradient = ctx.createLinearGradient(0, h, 0, 0);
        gradient.addColorStop(0, "rgba(34, 197, 94, 0.4)"); 
        gradient.addColorStop(0.6, "rgba(234, 179, 8, 0.5)"); 
        gradient.addColorStop(1, "rgba(239, 68, 68, 0.6)"); 

        ctx.fillStyle = gradient;

        const bufferLength = dataArray.length;
        const barWidth = (w / bufferLength) * 2.5; 
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * h;
          ctx.fillRect(x, h - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }

        // --- Espectrograma Waterfall (Hardware Accelerated) ---
        const wfW = waterfallCanvas.width / dpr;
        const wfH = waterfallCanvas.height / dpr;

        // 1. Desplazar hacia abajo 1 píxel todo el lienzo existente (Ultra rápido, 0 coste de RAM)
        waterfallCtx.drawImage(
          waterfallCanvas, 
          0, 0, wfW * dpr, (wfH - 1) * dpr, 
          0, 1 * dpr, wfW * dpr, (wfH - 1) * dpr
        );

        // 2. Dibujar la nueva línea de frecuencias en Y = 0
        const wfBarWidth = (wfW * dpr) / bufferLength;
        for (let i = 0; i < bufferLength; i++) {
          const val = dataArray[i];
          let r = 0, g = 0, b = 0;
          
          if (val < 50) {
            // Silencio (Negro)
            r = 11; g = 15; b = 21; // #0B0F15 base background
          } else if (val < 120) {
            // Negro a Verde
            g = Math.floor(((val - 50) / 70) * 180);
          } else if (val < 200) {
            // Verde a Amarillo
            g = 180 + Math.floor(((val - 120) / 80) * 75);
            r = Math.floor(((val - 120) / 80) * 255);
          } else {
            // Amarillo a Rojo Intenso
            r = 255;
            g = 255 - Math.floor(((val - 200) / 55) * 255);
          }
          
          waterfallCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          waterfallCtx.fillRect(i * wfBarWidth, 0, Math.ceil(wfBarWidth), 1 * dpr);
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
      const wfParent = waterfallCanvas.parentElement;
      if (wfParent) {
        dpr = window.devicePixelRatio || 1;
        waterfallCanvas.width = wfParent.clientWidth * dpr;
        waterfallCanvas.height = wfParent.clientHeight * dpr;
        waterfallCanvas.style.width = `${wfParent.clientWidth}px`;
        waterfallCanvas.style.height = `${wfParent.clientHeight}px`;
        
        // Rellenar fondo inicial
        waterfallCtx.fillStyle = "#0B0F15";
        waterfallCtx.fillRect(0, 0, waterfallCanvas.width, waterfallCanvas.height);
      }
    });

    resizeObserver.observe(canvas.parentElement!);
    resizeObserver.observe(waterfallCanvas.parentElement!);
    draw();

    return () => {
      resizeObserver.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isListening, getFrequencyData, getSampleRate, activeChannel, addAlert]); 

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
          
          {/* Espectrograma Real (Waterfall) Hardware Accelerated */}
          <div className="h-1/3 border border-slate-700/50 rounded bg-[#0B0F15] relative overflow-hidden flex flex-col justify-between p-1">
              <canvas ref={waterfallCanvasRef} className="absolute inset-0 w-full h-full block z-0" />
              
              {/* Overlays de Tiempo */}
              <div className="relative z-10 flex justify-between text-xxs text-slate-500 font-mono px-2 pt-1 pointer-events-none mix-blend-difference"><span>20k</span><span>0 s</span></div>
              <div className="relative z-10 flex justify-between text-xxs text-slate-500 font-mono px-2 pointer-events-none mix-blend-difference"><span>2k</span><span>-2 s</span></div>
              <div className="relative z-10 flex justify-between text-xxs text-slate-500 font-mono px-2 pointer-events-none mix-blend-difference"><span>200</span><span>-4 s</span></div>
              <div className="relative z-10 flex justify-between text-xxs text-slate-500 font-mono px-2 pb-1 pointer-events-none mix-blend-difference"><span>20</span><span>-6 s</span></div>
          </div>
      </div>
    </div>
  );
}
