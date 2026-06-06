import { create } from 'zustand';
import { Channel } from '@/components/dashboard/ChannelList';

export interface Scene {
  id: string;
  name: string;
  timestamp: number;
  channels: Channel[];
}

interface ConsoleState {
  channels: Channel[];
  savedScenes: Scene[];
  updateChannelState: (address: string, args: any[]) => void;
  setChannels: (channels: Channel[]) => void;
  saveScene: (sceneName: string) => void;
  loadScene: (sceneId: string) => void;
  hydrateScenes: () => void;
}

// Inicializamos 32 canales físicos genéricos como lienzo en blanco
const initializeChannels = (): Channel[] => {
  const channels: Channel[] = [];
  for (let i = 1; i <= 32; i++) {
    const idStr = i.toString().padStart(2, '0');
    channels.push({
      id: idStr,
      number: i,
      name: `CH ${idStr}`,
      level: -60, // silencio inicial
      active: true,
      muted: false,
      solo: false,
    });
  }
  return channels;
};

export const useConsoleStore = create<ConsoleState>((set) => ({
  channels: initializeChannels(),
  savedScenes: [],
  setChannels: (channels) => set({ channels }),
  
  hydrateScenes: () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mixvision_scenes');
      if (saved) {
        set({ savedScenes: JSON.parse(saved) });
      }
    }
  },

  saveScene: (sceneName) => set((state) => {
    const newScene: Scene = {
      id: `scene_${Date.now()}`,
      name: sceneName,
      timestamp: Date.now(),
      channels: JSON.parse(JSON.stringify(state.channels)) // deep clone
    };
    const newScenes = [...state.savedScenes, newScene];
    if (typeof window !== 'undefined') {
      localStorage.setItem('mixvision_scenes', JSON.stringify(newScenes));
    }
    return { savedScenes: newScenes };
  }),

  loadScene: (sceneId) => set((state) => {
    const scene = state.savedScenes.find(s => s.id === sceneId);
    if (scene) {
      return { channels: JSON.parse(JSON.stringify(scene.channels)) };
    }
    return state;
  }),

  updateChannelState: (address, args) => set((state) => {
    // Ejemplo de dirección OSC: /ch/01/mix/on
    // Ejemplo de nombre OSC: /ch/01/config/name
    
    const parts = address.split('/');
    if (parts.length >= 4 && parts[1] === 'ch') {
      const channelId = parts[2]; // "01"
      
      const newChannels = state.channels.map(ch => {
        if (ch.id === channelId) {
          const updatedCh = { ...ch };
          
          if (parts[3] === 'mix' && parts[4] === 'on') {
            // En M32, valor 0 = Muteado, valor 1 = Desmuteado
            updatedCh.muted = args[0] === 0;
          }
          if (parts[3] === 'config' && parts[4] === 'name') {
            updatedCh.name = args[0];
          }
          if (parts[3] === 'mix' && parts[4] === 'fader') {
            // M32 Scale approx: 0.0 to 1.0 (0.5 is approx 0dB or similar log scale)
            // Linear mock for UI translation (-60dB to +10dB)
            const faderVal = args[0] as number;
            updatedCh.level = faderVal >= 0.5 ? (faderVal - 0.5) * 20 : -60 + (faderVal * 120);
          }
          
          return updatedCh;
        }
        return ch;
      });
      
      return { channels: newChannels };
    }
    
    return state; // Retorna el estado sin cambios si no es una ruta conocida
  }),
}));
