"use client";

import { create } from 'zustand';
import { useEffect } from 'react';
import { sendOscCommand } from './osc-client';

interface NetworkState {
  latencyMs: number;
  memoryBytes: number;
  isConnected: boolean;
  reconnectTrigger: number;
  setLatency: (ms: number) => void;
  setMemory: (bytes: number) => void;
  setConnectionStatus: (status: boolean) => void;
  forceReconnect: () => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  latencyMs: 0,
  memoryBytes: 0,
  isConnected: false,
  reconnectTrigger: 0,
  setLatency: (ms) => set({ latencyMs: ms }),
  setMemory: (bytes) => set({ memoryBytes: bytes }),
  setConnectionStatus: (status) => set({ isConnected: status }),
  forceReconnect: () => set((state) => ({ reconnectTrigger: state.reconnectTrigger + 1 })),
}));

// Hook Global de Telemetría
export function useTelemetry() {
  const isConnected = useNetworkStore(state => state.isConnected);
  const setMemory = useNetworkStore(state => state.setMemory);

  useEffect(() => {
    // 1. Loop de Ping (Round-Trip Time a la Consola)
    const pingInterval = setInterval(() => {
      if (isConnected) {
        // Enviamos la marca de tiempo actual a la M32 o Servidor
        // La consola (o el simulador) debe regresar un mensaje OSC en /pong con el mismo valor
        sendOscCommand('/ping', [Date.now()]).catch(console.error);
      }
    }, 2000);

    // 2. Monitor de Hardware V8 (Garbage Collector Memory)
    const memInterval = setInterval(() => {
      const perf = performance as any;
      if (perf && perf.memory) {
        setMemory(perf.memory.usedJSHeapSize);
      }
    }, 1000);

    return () => {
      clearInterval(pingInterval);
      clearInterval(memInterval);
    };
  }, [isConnected, setMemory]);
}
