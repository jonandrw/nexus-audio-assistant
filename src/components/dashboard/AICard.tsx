"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Loader2, Zap } from "lucide-react";
import { sendOscCommand } from "@/lib/osc-client";
import { useAIStore } from "@/lib/ai-store";

// 1. Ampliamos la interfaz para recibir datos dinámicos del motor DSP
export interface AISuggestion {
  id: string;
  type: "alert" | "masking" | "optimization";
  title: string;
  description: string;
  actionText: string;
  // Nuevos campos opcionales para comandos OSC dinámicos
  targetChannel?: string;
  targetFreq?: number;
}

interface AICardProps {
  suggestion: AISuggestion;
}

export function AICard({ suggestion }: AICardProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const removeAlert = useAIStore(state => state.removeAlert);

  const handleApply = async () => {
    if (status === "loading" || status === "success") return;
    setStatus("loading");

    const channelId = suggestion.targetChannel || "01";
    let address = "";
    let args: any[] = [];

    // 2. Lógica Dinámica: Traducir la intención de la IA a comandos de hardware
    if (suggestion.type === "alert" && suggestion.targetFreq) {
      // Si es un acople, atacamos la banda 3 (High-Mid) del EQ paramétrico
      // En la M32, la ganancia (g) va de 0.0 a 1.0 (0.5 es 0dB). 0.25 es un corte profundo (-7.5dB)
      address = `/ch/${channelId}/eq/3/g`;
      args = [0.25];
    } else if (suggestion.type === "masking") {
      // Si es enmascaramiento grave, aplicamos Filtro Paso Alto (HPF) a 80Hz
      address = `/ch/${channelId}/pre/hpon`;
      args = [1]; // 1 para encender
    } else {
      // Fallback: comando de prueba de mute
      address = `/ch/${channelId}/mix/on`;
      args = [0];
    }

    console.log(`[OSC Dispatch] Enviando: ${address} con valor:`, args);

    const response = await sendOscCommand(address, args);

    if (response.success) {
      setStatus("success");
      setTimeout(() => {
        setStatus("idle");
        removeAlert(suggestion.id);
      }, 3000);
    } else {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const getIcon = () => {
    switch (suggestion.type) {
      case "alert": return <AlertCircle className="w-4 h-4 text-red-400" />;
      case "masking": return <Zap className="w-4 h-4 text-yellow-400" />;
      case "optimization": return <Zap className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getBadgeColor = () => {
    switch (suggestion.type) {
      case "alert": return "bg-red-900/50 text-red-300 border-red-800";
      case "masking": return "bg-yellow-900/50 text-yellow-300 border-yellow-800";
      case "optimization": return "bg-emerald-900/50 text-emerald-300 border-emerald-800";
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 shadow-xl border-l-4 border-l-red-500">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={getBadgeColor()}>
            {suggestion.type.toUpperCase()}
          </Badge>
          {getIcon()}
        </div>
        <CardTitle className="text-sm font-bold mt-2 text-zinc-100">{suggestion.title}</CardTitle>
        <CardDescription className="text-xs text-zinc-400 mt-1">
          {suggestion.description}
        </CardDescription>

        {/* Mostramos la frecuencia si la IA la detectó */}
        {suggestion.targetFreq && (
          <div className="mt-2 font-mono text-[10px] text-red-400 bg-red-950/30 p-1 rounded inline-block">
            TARGET: {suggestion.targetFreq} Hz
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <Button
          className={`w-full mt-2 transition-all font-bold ${status === "success"
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : status === "error"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white" // Rojo dominante para alertas de acople
            }`}
          size="sm"
          onClick={handleApply}
          disabled={status === "loading" || status === "success"}
        >
          {status === "idle" && suggestion.actionText}
          {status === "loading" && (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Cortando Frecuencia...
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              EQ Aplicado
            </>
          )}
          {status === "error" && (
            <>
              <AlertCircle className="w-4 h-4 mr-2" />
              Fallo de Red
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}