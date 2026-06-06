"use client";

import React, { useState, useEffect } from "react";
import { Save, Upload, Loader2 } from "lucide-react";
import { useConsoleStore } from "@/lib/console-store";
import { sendOscCommand } from "@/lib/osc-client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Channel } from "./ChannelList";

export function SceneManager() {
  const { savedScenes, saveScene, loadScene, hydrateScenes, channels } = useConsoleStore();
  const [newSceneName, setNewSceneName] = useState("");
  const [selectedSceneId, setSelectedSceneId] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Cargar escenas del localStorage al iniciar
  useEffect(() => {
    hydrateScenes();
  }, [hydrateScenes]);

  const handleSave = () => {
    if (!newSceneName.trim()) {
      toast.error("Por favor, ingresa un nombre para la escena.");
      return;
    }
    saveScene(newSceneName);
    toast.success(`Escena "${newSceneName}" guardada en el navegador.`);
    setNewSceneName("");
  };

  const handleLoad = async () => {
    if (!selectedSceneId) return;
    const scene = savedScenes.find(s => s.id === selectedSceneId);
    if (!scene) return;

    setIsUploading(true);
    toast.loading(`Cargando escena "${scene.name}" a la M32...`);
    
    // Primero, cargamos en la UI de inmediato
    loadScene(scene.id);

    // Segundo, disparamos la ráfaga hacia el hardware físico con iteración asíncrona segura
    try {
      await sendOscBurst(scene.channels);
      toast.dismiss();
      toast.success(`Escena "${scene.name}" inyectada en la mesa con éxito.`);
    } catch (err) {
      toast.dismiss();
      toast.error("Hubo un problema sincronizando algunos canales.");
    } finally {
      setIsUploading(false);
    }
  };

  // Función asíncrona para despachar la ráfaga a 32 canales evitando Buffer Overflow
  const sendOscBurst = async (chList: Channel[]) => {
    for (const ch of chList) {
      // 1. Enviar el nombre
      await sendOscCommand(`/ch/${ch.id}/config/name`, [ch.name]);
      // Regla FOH: Retardo de seguridad para la consola
      await new Promise(resolve => setTimeout(resolve, 20)); 
      
      // 2. Enviar estado de Mute (M32: 0 = Muted, 1 = Unmuted)
      await sendOscCommand(`/ch/${ch.id}/mix/on`, [ch.muted ? 0 : 1]);
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  };

  return (
    <div className="panel p-4 flex flex-col shrink-0">
      <h2 className="panel-header mb-3 pb-3 border-b border-slate-700/50">ESCENAS (SNAPSHOTS)</h2>
      
      <div className="flex flex-col gap-3">
        {/* Guardar Escena */}
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            placeholder="Nueva Escena..." 
            value={newSceneName}
            onChange={(e) => setNewSceneName(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand transition-colors"
          />
          <button 
            onClick={handleSave}
            className="bg-brand/20 text-brand border border-brand/50 hover:bg-brand/30 px-3 py-2 rounded text-xs font-medium transition-colors flex items-center gap-2"
          >
            <Save className="w-3 h-3" /> GUARDAR
          </button>
        </div>

        {/* Cargar Escena */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-900 border border-slate-700 rounded flex items-center overflow-hidden">
            <Select value={selectedSceneId} onValueChange={setSelectedSceneId}>
              <SelectTrigger className="border-none bg-transparent h-auto py-2 px-3 focus:ring-0 gap-2 text-slate-200 text-xs w-full">
                <SelectValue placeholder="Seleccionar Escena" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-300">
                {savedScenes.length === 0 ? (
                  <SelectItem value="empty" disabled className="text-xs">No hay escenas guardadas</SelectItem>
                ) : (
                  savedScenes.map(scene => (
                    <SelectItem key={scene.id} value={scene.id} className="text-xs focus:bg-slate-700 cursor-pointer">
                      {scene.name} <span className="text-slate-500 ml-2">({new Date(scene.timestamp).toLocaleTimeString()})</span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <button 
            onClick={handleLoad}
            disabled={!selectedSceneId || isUploading}
            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-3 py-2 rounded text-xs font-medium transition-colors flex items-center gap-2"
          >
            {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} CARGAR
          </button>
        </div>
      </div>
    </div>
  );
}
