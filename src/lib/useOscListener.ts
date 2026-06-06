import { useEffect, useState } from 'react';
import { useConsoleStore } from './console-store';
import { useNetworkStore } from './network-store';
import { toast } from 'sonner';

export function useOscListener() {
  const updateChannelState = useConsoleStore(state => state.updateChannelState);
  const { setConnectionStatus, reconnectTrigger, setLatency } = useNetworkStore();

  useEffect(() => {
    let evtSource: EventSource | null = null;

    const connect = () => {
      evtSource = new EventSource('/api/osc/listen');

      evtSource.onopen = () => {
        setConnectionStatus(true);
        console.log("Conectado al servidor OSC SSE (Puerto 10024)");
        toast.success("Enlace bidireccional con la Midas M32 establecido.");
      };

    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Intercepción del Heartbeat para Telemetría FOH (Round-Trip Time)
        if (data.address === "/pong") {
           const sentTimestamp = data.args[0] as number;
           const currentLatency = Date.now() - sentTimestamp;
           setLatency(currentLatency);
           return;
        }

        if (data.error) {
          if (data.error === "EADDRINUSE") {
             toast.error("El puerto 10024 ya está en uso. Por favor, reinicia el servidor Next.js.");
          }
          return;
        }
        
        // Log para depurar qué manda la consola
        // console.log("OSC In:", data.address, data.args);
        
        // Despachar al Zustand store
        updateChannelState(data.address, data.args);
      } catch (err) {
        console.error("Error parseando mensaje SSE:", err);
      }
    };

      evtSource.onerror = (err) => {
        console.error("Fallo en la conexión bidireccional SSE:", err);
        setConnectionStatus(false);
        evtSource?.close();
      };
    };

    connect();

    return () => {
      if (evtSource) {
        evtSource.close(); // Limpieza cuando el componente se desmonta o reconecta
        setConnectionStatus(false);
      }
    };
  }, [updateChannelState, setConnectionStatus, reconnectTrigger, setLatency]);

  return null;
}
