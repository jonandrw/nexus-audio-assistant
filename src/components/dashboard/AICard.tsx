"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Zap } from "lucide-react";
import { sendOscCommand } from "@/lib/osc-client";
import { useAIStore } from "@/lib/ai-store";

export interface AISuggestion {
  id: string;
  type: "alert" | "masking" | "optimization";
  title: string;
  description: string;
  actionText: string;
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

    if (suggestion.type === "alert" && suggestion.targetFreq) {
      address = `/ch/${channelId}/eq/3/g`;
      args = [0.25];
    } else if (suggestion.type === "masking") {
      address = `/ch/${channelId}/pre/hpon`;
      args = [1];
    } else {
      address = `/ch/${channelId}/mix/on`;
      args = [0];
    }

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
      case "alert": return <AlertCircle className="w-3 h-3 text-red-500" />;
      case "masking": return <Zap className="w-3 h-3 text-yellow-500" />;
      case "optimization": return <Zap className="w-3 h-3 text-emerald-500" />;
    }
  };

  const getColorTheme = () => {
    switch (suggestion.type) {
      case "alert": return "border-red-500 bg-red-950/10";
      case "masking": return "border-yellow-500 bg-yellow-950/10";
      case "optimization": return "border-emerald-500 bg-emerald-950/10";
    }
  };

  const getButtonTheme = () => {
    if (status === "success") return "bg-emerald-600 text-white border-emerald-500";
    if (status === "error") return "bg-red-600 text-white border-red-500";
    
    switch (suggestion.type) {
      case "alert": return "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-black border-red-500/50";
      case "masking": return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-black border-yellow-500/50";
      case "optimization": return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black border-emerald-500/50";
    }
  };

  return (
    <div className={`border-l-[3px] border-y border-r border-zinc-900 p-2.5 flex flex-col gap-2 ${getColorTheme()}`}>
      <div className="flex justify-between items-start">
        <div className="flex gap-2 items-center">
            {getIcon()}
            <span className="text-[10px] font-bold text-white uppercase tracking-wider leading-none">{suggestion.title}</span>
        </div>
        <span className="text-[8px] font-mono uppercase px-1 border border-zinc-800 text-zinc-500">{suggestion.type}</span>
      </div>
      
      <p className="text-[9px] text-zinc-400 leading-tight">
        {suggestion.description}
      </p>

      {suggestion.targetFreq && (
        <div className="font-mono text-[9px] text-zinc-300">
          TARGET: <span className="text-red-400 font-bold">{suggestion.targetFreq} Hz</span>
        </div>
      )}

      <button
        className={`mt-1 w-full flex items-center justify-center py-1.5 text-[9px] font-bold font-mono tracking-wider transition-colors border ${getButtonTheme()}`}
        onClick={handleApply}
        disabled={status === "loading" || status === "success"}
      >
          {status === "idle" && suggestion.actionText.toUpperCase()}
          {status === "loading" && (
            <>
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              EXECUTING
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="w-3 h-3 mr-2" />
              APPLIED
            </>
          )}
          {status === "error" && (
            <>
              <AlertCircle className="w-3 h-3 mr-2" />
              TX FAILED
            </>
          )}
      </button>
    </div>
  );
}