"use client";

import React, { useState } from "react";
import { Channel, ChannelList } from "@/components/dashboard/ChannelList";
import { RTACanvas } from "@/components/dashboard/RTACanvas";
import { AIPilotPanel } from "@/components/dashboard/AIPilotPanel";
import { TopBar } from "@/components/dashboard/TopBar";
import { BottomBar } from "@/components/dashboard/BottomBar";
import { DynamicsPanel } from "@/components/dashboard/DynamicsPanel";
import { EqPanel } from "@/components/dashboard/EqPanel";
import { CompPanel } from "@/components/dashboard/CompPanel";
import { EventLog } from "@/components/dashboard/EventLog";
import { NetworkPanel } from "@/components/dashboard/NetworkPanel";
import { AudioEngineProvider } from "@/lib/audio-context";
import { useConsoleStore } from "@/lib/console-store";
import { useOscListener } from "@/lib/useOscListener";
import { useMidiController } from "@/lib/useMidiController";
import { useTelemetry } from "@/lib/network-store";
import { sendOscCommand } from "@/lib/osc-client";

export default function DashboardPage() {
  // Inicializamos la conexión bidireccional de hardware y telemetría
  useOscListener();
  useMidiController();
  useTelemetry();
  
  // Obtenemos los canales de la "vida real" desde el store
  const channels = useConsoleStore(state => state.channels);
  const [activeChannelId, setActiveChannelId] = useState<string | null>("01");
  const activeChannel = channels.find((c) => c.id === activeChannelId) || null;

  const toggleMute = async (id: string) => {
    const ch = channels.find(c => c.id === id);
    if (!ch) return;
    
    // Midas M32 OSC: 0 = Muteado, 1 = Desmuteado
    const newValue = ch.muted ? 1 : 0; 
    await sendOscCommand(`/ch/${id}/mix/on`, [newValue]);
    // Nota: No actualizamos el estado local aquí. Esperamos que el paquete OSC de retorno (SSE) confirme el cambio y actualice Zustand
  };

  const toggleSolo = async (id: string) => {
    const ch = channels.find(c => c.id === id);
    if (!ch) return;
    
    // Comando típico para SOLO en M32 (aunque varía si es /config/solo)
    const newValue = ch.solo ? 0 : 1;
    await sendOscCommand(`/-stat/solosw/${id}`, [newValue]); 
  };

  return (
    <AudioEngineProvider>
      <div className="h-screen flex flex-col overflow-hidden text-sm bg-black text-slate-200 font-sans">
        {/* HEADER */}
        <TopBar />

        <main className="flex-1 overflow-hidden p-4 flex gap-4">
          {/* SIDEBAR IZQUIERDO: Canales */}
          <aside className="w-72 flex flex-col gap-4 shrink-0 overflow-hidden">
            <ChannelList 
              channels={channels} 
              activeChannelId={activeChannelId} 
              onSelectChannel={setActiveChannelId} 
              onToggleMute={toggleMute}
              onToggleSolo={toggleSolo}
            />
          </aside>

          {/* CENTER SECTION */}
          <section className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
            <RTACanvas activeChannel={activeChannel} />
            
            <div className="h-64 flex gap-4 shrink-0 overflow-hidden">
              <DynamicsPanel />
              <EqPanel />
              <CompPanel />
            </div>
          </section>

          {/* SIDEBAR DERECHO */}
          <aside className="w-72 flex flex-col gap-4 shrink-0 overflow-hidden">
            <AIPilotPanel activeChannel={activeChannel} />
            <EventLog />
            <NetworkPanel />
          </aside>
        </main>

        {/* FOOTER */}
        <BottomBar />
      </div>
    </AudioEngineProvider>
  );
}
