"use client";

import { useEffect, useRef } from 'react';
import { useConsoleStore } from './console-store';
import { sendOscCommand } from './osc-client';

export function useMidiController() {
  const updateChannelState = useConsoleStore(state => state.updateChannelState);
  
  // Debouncer optimizado por canal para evitar Network Flood
  const timeoutRefs = useRef<{ [key: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    let midiAccess: MIDIAccess | null = null;

    const onMidiMessage = (message: MIDIMessageEvent) => {
      const command = message.data[0];
      const noteOrCC = message.data[1];
      const velocity = message.data[2]; // 0 a 127

      // Comandos MIDI de tipo Control Change (CC)
      const isControlChange = command >= 176 && command <= 191;

      if (isControlChange && noteOrCC >= 0 && noteOrCC <= 31) {
        // Mapeamos faders físicos (CC 0-31) a los canales de la mesa M32 (1-32)
        const channelIndex = noteOrCC;
        const channelStr = (channelIndex + 1).toString().padStart(2, '0');
        const oscAddress = `/ch/${channelStr}/mix/fader`;
        
        // Normalización lineal para OSC (0.0 a 1.0)
        const normalizedFader = velocity / 127;
        
        // 1. UI update Zero Layout Shift: Inyectamos el valor a Zustand directamente
        updateChannelState(oscAddress, [normalizedFader]);

        // 2. Debouncer FOH para proteger la M32
        if (timeoutRefs.current[channelStr]) {
          clearTimeout(timeoutRefs.current[channelStr]);
        }
        
        timeoutRefs.current[channelStr] = setTimeout(() => {
          sendOscCommand(oscAddress, [normalizedFader]).catch(err => {
             console.error("Error enviando MIDI a OSC", err);
          });
        }, 40); // 40ms Debounce por canal
      }
    };

    const initMidi = async () => {
      try {
        if (navigator.requestMIDIAccess) {
          midiAccess = await navigator.requestMIDIAccess();
          
          for (const input of midiAccess.inputs.values()) {
            input.onmidimessage = onMidiMessage;
          }

          midiAccess.onstatechange = (e) => {
             const port = e.port as MIDIInput;
             if (port.type === 'input') {
                if (port.state === 'connected') {
                   port.onmidimessage = onMidiMessage;
                   console.log(`MIDI Conectado: ${port.name}`);
                } else {
                   port.onmidimessage = null;
                   console.log(`MIDI Desconectado: ${port.name}`);
                }
             }
          };
        }
      } catch (err) {
        console.warn("Web MIDI API no disponible o denegada", err);
      }
    };

    initMidi();

    // Limpieza estricta de Memory Leaks
    return () => {
      if (midiAccess) {
        for (const input of midiAccess.inputs.values()) {
          input.onmidimessage = null;
        }
      }
      Object.values(timeoutRefs.current).forEach(clearTimeout);
    };
  }, [updateChannelState]);
}
