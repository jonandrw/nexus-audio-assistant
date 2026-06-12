"use client";

import React, { useState } from 'react';
import { X, Network, Monitor } from 'lucide-react';
import { useUiStore } from '@/lib/ui-store';

export function SettingsModal() {
  const { isSettingsOpen, closeSettings } = useUiStore();
  const [activeTab, setActiveTab] = useState<'network' | 'display'>('network');

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[600px] bg-zinc-950 border border-zinc-800 shadow-2xl flex flex-col font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-900 bg-zinc-900/50">
          <h2 className="text-lg font-bold text-white tracking-widest uppercase font-heading">
            Configuración <span className="text-brand font-light">Global</span>
          </h2>
          <button 
            onClick={closeSettings}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex h-[400px]">
          {/* Sidebar */}
          <div className="w-48 border-r border-zinc-900 bg-zinc-950/50 p-2 flex flex-col gap-1">
            <button 
              onClick={() => setActiveTab('network')}
              className={`flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${activeTab === 'network' ? 'bg-brand/10 text-brand border-r-2 border-brand' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
            >
              <Network className="w-4 h-4" />
              Red & OSC
            </button>
            <button 
              onClick={() => setActiveTab('display')}
              className={`flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${activeTab === 'display' ? 'bg-brand/10 text-brand border-r-2 border-brand' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
            >
              <Monitor className="w-4 h-4" />
              Apariencia
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 bg-zinc-950 overflow-y-auto custom-scrollbar">
            {activeTab === 'network' && (
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-800 pb-2">Conexión a Consola M32</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-widest">Dirección IP</label>
                    <input 
                      type="text" 
                      defaultValue="192.168.1.100" 
                      className="w-full bg-black border border-zinc-800 p-2 text-sm text-white focus:border-brand focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-widest">Puerto OSC</label>
                    <input 
                      type="text" 
                      defaultValue="10023" 
                      className="w-full bg-black border border-zinc-800 p-2 text-sm text-white focus:border-brand focus:outline-none font-mono"
                    />
                  </div>
                  <button className="bg-zinc-800 hover:bg-brand hover:text-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors w-full mt-4">
                    Reconectar
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'display' && (
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-800 pb-2">Opciones Visuales</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Modo Alto Contraste</span>
                    <input type="checkbox" className="accent-brand w-4 h-4 bg-black border-zinc-800" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Animaciones Fluidas (GPU)</span>
                    <input type="checkbox" defaultChecked className="accent-brand w-4 h-4 bg-black border-zinc-800" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
