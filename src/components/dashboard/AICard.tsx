"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Loader2, Zap } from "lucide-react";
import { sendOscCommand } from "@/lib/osc-client";

export interface AISuggestion {
  id: string;
  type: "alert" | "masking" | "optimization";
  title: string;
  description: string;
  actionText: string;
}

interface AICardProps {
  suggestion: AISuggestion;
}

export function AICard({ suggestion }: AICardProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleApply = async () => {
    if (status === "loading" || status === "success") return;
    
    setStatus("loading");
    
    // Usamos las direcciones de prueba solicitadas (simulando que la sugerencia activa esto)
    const address = "/ch/01/mix/on";
    const args = [0]; // 0 para mutear, 1 para desmutear en M32

    const response = await sendOscCommand(address, args);

    if (response.success) {
      setStatus("success");
      // Retornar a idle después de 3s para permitir interactuar de nuevo
      setTimeout(() => setStatus("idle"), 3000);
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
    <Card className="bg-zinc-900 border-zinc-800">
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
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <Button 
          className={`w-full mt-2 transition-all ${
            status === "success" 
              ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
              : status === "error"
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
          size="sm"
          onClick={handleApply}
          disabled={status === "loading" || status === "success"}
        >
          {status === "idle" && suggestion.actionText}
          {status === "loading" && (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Aplicando...
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Aplicado
            </>
          )}
          {status === "error" && (
            <>
              <AlertCircle className="w-4 h-4 mr-2" />
              Error (Reintentar)
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
