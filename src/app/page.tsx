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

export const MOCK_CHANNELS: Channel[] = [
  { id: "01", number: 1, name: "Pastor Main", type: "Mic / Wireless", icon: "Mic", level: -12.4, color: "text-brand", active: true, muted: false, solo: true },
  { id: "02", number: 2, name: "Pastor Lapel", type: "Mic / Wireless", icon: "Mic", level: -18.6, color: "text-blue-400", active: true, muted: false, solo: false },
  { id: "03", number: 3, name: "Worship Vocal", type: "Mic / Wireless", icon: "Mic", level: -8.3, color: "text-purple-400", active: true, muted: false, solo: false },
  { id: "04", number: 4, name: "Keyboard L", type: "DI / Stereo", icon: "Keyboard", level: -22.1, color: "text-red-400", active: true, muted: false, solo: false },
  { id: "05", number: 5, name: "Keyboard R", type: "DI / Stereo", icon: "Keyboard", level: -23.4, color: "text-yellow-400", active: true, muted: false, solo: false },
  { id: "06", number: 6, name: "Acoustic Guitar", type: "DI / Mono", icon: "Guitar", level: -16.2, color: "text-orange-400", active: true, muted: false, solo: false },
  { id: "07", number: 7, name: "Electric Guitar", type: "Amp / Mic", icon: "Guitar", level: -14.8, color: "text-orange-400", active: true, muted: false, solo: false },
  { id: "08", number: 8, name: "Bass", type: "DI / Mono", icon: "Guitar", level: -10.7, color: "text-blue-500", active: true, muted: false, solo: false },
  { id: "09", number: 9, name: "Drum Kick", type: "Mic / Dynamic", icon: "Drum", level: -6.1, color: "text-red-500", active: true, muted: true, solo: false },
  { id: "10", number: 10, name: "Drum Snare", type: "Mic / Dynamic", icon: "Drum", level: -7.3, color: "text-red-400", active: true, muted: false, solo: false },
  { id: "11", number: 11, name: "Drum OH L", type: "Mic / Condenser", icon: "Mic2", level: -13.2, color: "text-red-300", active: true, muted: false, solo: false },
  { id: "12", number: 12, name: "Drum OH R", type: "Mic / Condenser", icon: "Mic2", level: -13.0, color: "text-red-300", active: true, muted: false, solo: false },
];

export default function DashboardPage() {
  const [channels, setChannels] = useState<Channel[]>(MOCK_CHANNELS);
  const [activeChannelId, setActiveChannelId] = useState<string | null>("01");
  const activeChannel = channels.find((c) => c.id === activeChannelId) || null;

  const toggleMute = (id: string) => {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, muted: !c.muted } : c));
  };

  const toggleSolo = (id: string) => {
    // Solo un canal en Solo por simplicidad del mockup, o aditivo
    setChannels(prev => prev.map(c => c.id === id ? { ...c, solo: !c.solo } : { ...c, solo: false }));
  };

  return (
    <AudioEngineProvider>
      <div className="h-screen flex flex-col overflow-hidden text-sm bg-[#0f172a] text-slate-200 font-sans">
        {/* HEADER */}
        <TopBar />

        <main className="flex-1 overflow-hidden p-4 flex gap-4">
          {/* SIDEBAR IZQUIERDO: Canales */}
          <aside className="w-72 flex flex-col gap-4 shrink-0">
            <ChannelList 
              channels={channels} 
              activeChannelId={activeChannelId} 
              onSelectChannel={setActiveChannelId} 
              onToggleMute={toggleMute}
              onToggleSolo={toggleSolo}
            />
          </aside>

          {/* CENTER SECTION */}
          <section className="flex-1 flex flex-col gap-4 min-w-0">
            <RTACanvas activeChannel={activeChannel} />
            
            <div className="h-64 flex gap-4 shrink-0">
              <DynamicsPanel />
              <EqPanel />
              <CompPanel />
            </div>
          </section>

          {/* SIDEBAR DERECHO */}
          <aside className="w-72 flex flex-col gap-4 shrink-0">
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
