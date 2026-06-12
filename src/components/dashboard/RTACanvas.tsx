"use client";

import React, { useEffect, useRef } from "react";
import { Settings2, ChevronDown, Expand, ExternalLink } from "lucide-react";
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
  const rtaContainerRef = useRef<HTMLDivElement>(null);
  const meterContainerRef = useRef<HTMLDivElement>(null);
  
  const [drawMode, setDrawMode] = React.useState<'BARS' | 'CURVE'>('BARS');
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  
  const { 
    isListening, devices, selectedDeviceId, setSelectedDeviceId, 
    toggleListening, getFrequencyData, getSampleRate, getFloatTimeDomainData
  } = useAudioEngine();

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        rtaContainerRef.current?.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
  };

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

        // --- Cálculo de Dinámicas (RMS y Pico Centralizado) ---
        const rmsDb = calculateRMS(floatTimeData);
        setRmsLevel(rmsDb);

        let peakLinear = 0;
        for (let i = 0; i < floatTimeData.length; i++) {
            const abs = Math.abs(floatTimeData[i]);
            if (abs > peakLinear) peakLinear = abs;
        }
        const peakDb = 20 * Math.log10(peakLinear || 0.0001);

        // --- Actualización de Medidores LED por DOM Directo ---
        if (meterContainerRef.current) {
            const leftBars = meterContainerRef.current.querySelectorAll('.meter-left > div');
            const rightBars = meterContainerRef.current.querySelectorAll('.meter-right > div');
            
            const rmsActive = Math.max(0, Math.min(40, Math.floor(((rmsDb + 60) / 60) * 40)));
            const peakActive = Math.max(0, Math.min(40, Math.floor(((peakDb + 60) / 60) * 40)));

            for (let i = 0; i < 40; i++) {
                let lColor = "rgb(39 39 42)"; // zinc-800
                if (i < rmsActive) {
                    if (i >= 35) lColor = "#ef4444"; // red-500 (-7.5 to 0 dB)
                    else if (i >= 26) lColor = "#eab308"; // yellow-500 (-21 to -7.5 dB)
                    else lColor = "#10b981"; // emerald-500 (-60 to -21 dB)
                }
                const lBar = leftBars[i] as HTMLElement;
                if (lBar && lBar.style.backgroundColor !== lColor) lBar.style.backgroundColor = lColor;

                let rColor = "rgb(39 39 42)"; 
                if (i < peakActive) {
                    if (i >= 35) rColor = "#ef4444"; 
                    else if (i >= 26) rColor = "#eab308"; 
                    else rColor = "#10b981"; 
                }
                const rBar = rightBars[i] as HTMLElement;
                if (rBar && rBar.style.backgroundColor !== rColor) rBar.style.backgroundColor = rColor;
            }
        }

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
        
        if (drawMode === 'BARS') {
            const barWidth = (w / bufferLength) * 2.5; 
            let xPos = 0;
            for (let i = 0; i < bufferLength; i++) {
              const barHeight = (dataArray[i] / 255) * h;
              ctx.fillRect(xPos, h - barHeight, barWidth, barHeight);
              xPos += barWidth + 1;
            }
        } else {
            ctx.beginPath();
            const sliceWidth = w * 1.0 / bufferLength;
            let xPos = 0;
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 255;
                const y = h - (v * h);
                if (i === 0) ctx.moveTo(xPos, y);
                else ctx.lineTo(xPos, y);
                xPos += sliceWidth;
            }
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            xPos = 0;
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 255;
                const y = h - (v * h);
                if (i === 0) ctx.moveTo(xPos, y);
                else ctx.lineTo(xPos, y);
                xPos += sliceWidth;
            }
            ctx.strokeStyle = "#10b981"; // emerald-500
            ctx.lineWidth = 1.5;
            ctx.stroke();
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
  }, [isListening, getFrequencyData, getSampleRate, activeChannel, addAlert, drawMode]); 

  return (
    <div ref={rtaContainerRef} className="flex-1 flex flex-col min-h-0 bg-black">
      <div className="flex justify-between items-center bg-zinc-950 border-b border-zinc-900 px-4 py-2 shrink-0">
          <div className="flex items-center gap-4">
              <h2 className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">ANALYZER (RTA)</h2>
              
              <div className="bg-black border border-zinc-800 flex items-center gap-2 cursor-pointer text-[10px] font-mono px-2 py-0.5 max-w-[200px]">
                <Select value={selectedDeviceId} onValueChange={(val) => { if (val) setSelectedDeviceId(val); }}>
                  <SelectTrigger className="border-none bg-transparent h-auto p-0 focus:ring-0 gap-2 text-slate-300 w-full overflow-hidden">
                    <SelectValue placeholder="I/O DEVICE">
                      {selectedDeviceId 
                        ? (() => {
                            const idx = devices.findIndex(d => d.deviceId === selectedDeviceId);
                            if (idx === -1) return "I/O DEVICE";
                            const label = devices[idx].label;
                            if (!label) return `INPUT ${idx + 1}`;
                            let clean = label.replace(/\s*\([a-fA-F0-9-]{16,}\)/g, '');
                            clean = clean.replace(/^Default\s*-\s*/i, '');
                            if (clean.length > 25) clean = clean.substring(0, 22) + '...';
                            return clean.toUpperCase();
                          })()
                        : "I/O DEVICE"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-black border-zinc-800 text-slate-300 rounded-none w-[200px]">
                    {devices.map((device, i) => {
                      let cleanLabel = device.label || `INPUT ${i + 1}`;
                      if (device.label) {
                          cleanLabel = cleanLabel.replace(/\s*\([a-fA-F0-9-]{16,}\)/g, '');
                          cleanLabel = cleanLabel.replace(/^Default\s*-\s*/i, '');
                          if (cleanLabel.length > 25) cleanLabel = cleanLabel.substring(0, 22) + '...';
                      }
                      
                      return (
                        <SelectItem key={device.deviceId} value={device.deviceId} className="text-[10px] focus:bg-zinc-800 cursor-pointer rounded-none">
                          {cleanLabel.toUpperCase()}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
          </div>
          <div className="flex items-center gap-1">
              <button 
                  onClick={() => (window as any).electron?.popoutPanel('rta', activeChannel?.id || '01')}
                  className="bg-black border border-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer px-2 py-0.5"
                  title="Pop Out"
              >
                  <ExternalLink className="w-3 h-3 text-xs" />
              </button>
              <button 
                  onClick={() => setDrawMode(m => m === 'BARS' ? 'CURVE' : 'BARS')}
                  className="bg-black border border-zinc-800 flex items-center gap-2 text-[10px] font-mono px-2 py-0.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              >
                  MODE: {drawMode}
              </button>
              <button
                onClick={toggleListening}
                className={isListening ? "border border-red-500 text-red-500 hover:bg-red-500/10 px-3 py-0.5 text-[10px] font-bold font-mono transition-colors" : "border border-emerald-500 text-emerald-500 hover:bg-emerald-500/10 px-3 py-0.5 text-[10px] font-bold font-mono transition-colors"}
              >
                {isListening ? "STOP" : "RUN"}
              </button>
              <button 
                  onClick={toggleFullscreen}
                  className="w-6 h-6 border border-zinc-800 bg-black flex items-center justify-center text-zinc-400 hover:bg-zinc-800 transition-colors"
                  title="Fullscreen RTA"
              >
                  <Expand className="w-3 h-3 text-xs" />
              </button>
          </div>
      </div>

      {/* Gráficos Principales */}
      <div className="flex-1 flex flex-col relative min-h-0">
          {/* Line Chart (EQ/FFT) */}
          <div className="flex-1 relative border-b border-zinc-900 overflow-hidden bg-black">
              <canvas ref={canvasRef} className="w-full h-full block" />
              
              {!isListening && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="text-center">
                    <Settings2 className="w-6 h-6 text-zinc-600 mx-auto mb-2 opacity-50" />
                    <p className="text-[10px] font-mono text-zinc-500 tracking-[0.2em]">WAITING HARDWARE SYNC</p>
                  </div>
                </div>
              )}

              {/* Medidores laterales calibrados estilo M32 */}
              <div className="absolute right-4 top-4 bottom-4 w-16 flex justify-between pointer-events-none opacity-90 bg-black/50 p-1 border border-zinc-900 rounded-sm" ref={meterContainerRef}>
                    {/* Left Meter (RMS) */}
                    <div className="flex flex-col-reverse justify-between gap-[1px] h-full w-3 meter-left">
                      {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} className="w-full flex-1 bg-zinc-800" />
                      ))}
                    </div>
                    
                    {/* dB Scale central */}
                    <div className="flex flex-col justify-between items-center text-[8px] font-bold font-mono text-zinc-500 h-full py-[2px]">
                        <span className="text-red-500">CLIP</span>
                        <span>-10</span>
                        <span>-20</span>
                        <span>-30</span>
                        <span>-40</span>
                        <span>-50</span>
                        <span>-60</span>
                    </div>

                    {/* Right Meter (PEAK) */}
                    <div className="flex flex-col-reverse justify-between gap-[1px] h-full w-3 meter-right">
                       {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} className="w-full flex-1 bg-zinc-800" />
                      ))}
                    </div>
              </div>
              <div className="absolute right-4 top-1 text-[8px] font-bold font-mono text-zinc-600 flex gap-4 w-16 justify-between pointer-events-none">
                  <span>RMS</span><span>PK</span>
              </div>
          </div>
          
          {/* Espectrograma Real (Waterfall) Hardware Accelerated */}
          <div className="h-[30%] border-b border-zinc-900 bg-black relative overflow-hidden flex flex-col justify-between">
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
