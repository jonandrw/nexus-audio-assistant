import React, { useEffect, useState } from "react";
import { Channel } from "./ChannelList";
import { ResonanceAlert } from "@/lib/audio-analyzer";
import { Brain, TriangleAlert, X, Loader2, Check } from "lucide-react";
import { sendOscCommand } from "@/lib/osc-client";
import { toast } from "sonner";

interface AIPilotPanelProps {
  activeChannel: Channel | null;
}

interface AISuggestion {
  id: string;
  type: string;
  title: string;
  description: string;
  actionText: string;
  targetFreq?: number;
}

export function AIPilotPanel({ activeChannel }: AIPilotPanelProps) {
  const [liveSuggestions, setLiveSuggestions] = useState<AISuggestion[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  useEffect(() => {
    const handleAlert = (event: CustomEvent<ResonanceAlert>) => {
      const alert = event.detail;
      const freq = Math.round(alert.frequencyHz);
      
      const newSuggestion: AISuggestion = {
        id: `alert-${Date.now()}`,
        type: "alert",
        title: "RIESGO DE ACOPLE",
        description: `Resonancia detectada en ${freq} Hz. Sugerencia de corte inmediato.`,
        actionText: `APLICAR -6dB (${freq}Hz)`,
        targetFreq: freq
      };

      setLiveSuggestions((prev) => {
        const isDuplicate = prev.some(
          (s) => s.title === newSuggestion.title && Date.now() - parseInt(s.id.split('-')[1]) < 5000
        );
        if (isDuplicate) return prev;
        return [newSuggestion, ...prev];
      });
    };

    window.addEventListener("nexus-ai-alert", handleAlert as EventListener);
    return () => window.removeEventListener("nexus-ai-alert", handleAlert as EventListener);
  }, []);

  const getMockSuggestions = (channel: Channel): AISuggestion[] => {
    if (channel.name.toLowerCase().includes("voz") || channel.name.toLowerCase().includes("pastor")) {
        return [{
            id: "s1",
            type: "optimization",
            title: "OPTIMIZACIÓN EQ",
            description: "Falta claridad en el rango de 3kHz-5kHz. Aplicar filtro de presencia.",
            actionText: "APLICAR +2.5dB",
            targetFreq: 4000
        }];
    }
    return [];
  };

  const suggestions = activeChannel ? [...liveSuggestions, ...getMockSuggestions(activeChannel)] : liveSuggestions;

  const removeSuggestion = (id: string) => {
      setLiveSuggestions(prev => prev.filter(s => s.id !== id));
  };

  const handleApply = async (sug: AISuggestion) => {
    if (processingId || successId) return; // Prevent multiple clicks
    
    setProcessingId(sug.id);

    try {
        const chNum = activeChannel ? activeChannel.number.toString().padStart(2, '0') : "01";
        // Comando hacia la banda 3 del EQ del canal
        const address = `/ch/${chNum}/eq/3/g`;
        const args = [0.25]; // 0.25 en M32 equivale a un corte drástico (aprox -7.5dB)

        const response = await sendOscCommand(address, args);

        if (response.success || response.success === undefined) { 
            // Manejamos el éxito (node-osc a veces no retorna confirmación síncrona si es UDP puro, pero asumimos success si no tira catch)
            setProcessingId(null);
            setSuccessId(sug.id);
            toast.success(`Corte aplicado a CH ${chNum} en ${sug.targetFreq}Hz vía OSC.`);
            
            setTimeout(() => {
                removeSuggestion(sug.id);
                setSuccessId(null);
            }, 3000);
        } else {
            throw new Error(response.error || "Fallo en el puente OSC.");
        }
    } catch (error: any) {
        setProcessingId(null);
        toast.error(`Error de Red OSC: ${error.message}`);
    }
  };

  return (
    <div className="panel flex-1 p-4 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
            <h2 className="text-xs font-semibold tracking-wide text-brand flex items-center gap-2">
                <Brain className="w-4 h-4" /> PILOTO IA
            </h2>
            <span className="text-xs bg-brand/20 text-brand px-2 rounded-full border border-brand/30 animate-pulse">ACTIVO</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {suggestions.length === 0 ? (
                <div className="text-center mt-10">
                    <p className="text-[10px] text-slate-500 font-mono">SIN ANOMALÍAS</p>
                </div>
            ) : (
                suggestions.map((sug) => {
                    const isProcessing = processingId === sug.id;
                    const isSuccess = successId === sug.id;

                    return (
                        <div key={sug.id} className="bg-slate-900/50 border border-slate-700 rounded p-3 relative overflow-hidden group">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${sug.type === 'alert' ? 'bg-red-500' : 'bg-brand'}`}></div>
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-xs font-bold ${sug.type === 'alert' ? 'text-red-400' : 'text-brand'} flex items-center`}>
                                    {sug.type === 'alert' && <TriangleAlert className="w-3 h-3 mr-1" />} {sug.title}
                                </span>
                                <span className="text-xxs text-slate-500 font-mono">CH {activeChannel?.number.toString().padStart(2, '0') || '00'}</span>
                            </div>
                            <p className="text-xs text-slate-300 mb-3">{sug.description}</p>
                            <div className="flex gap-2">
                                <button 
                                  onClick={() => handleApply(sug)}
                                  disabled={isProcessing || isSuccess}
                                  className={`flex-1 flex justify-center items-center gap-2 border rounded py-1 text-xs font-medium transition-all duration-200
                                      ${isSuccess 
                                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' 
                                          : sug.type === 'alert' 
                                              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/50' 
                                              : 'bg-brand/20 hover:bg-brand/30 text-brand border-brand/50'
                                      }
                                      ${isProcessing ? 'opacity-80 cursor-wait' : ''}
                                  `}
                                >
                                    {isProcessing && <Loader2 className="w-3 h-3 animate-spin" />}
                                    {isSuccess && <Check className="w-3 h-3" />}
                                    {!isProcessing && !isSuccess && sug.actionText}
                                    {isSuccess && "APLICADO"}
                                </button>
                                
                                {!isProcessing && !isSuccess && (
                                    <button 
                                      onClick={() => removeSuggestion(sug.id)} 
                                      className="w-8 flex items-center justify-center border border-slate-600 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    </div>
  );
}
