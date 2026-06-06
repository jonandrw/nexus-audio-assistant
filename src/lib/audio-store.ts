import { create } from 'zustand';

interface AudioStoreState {
  rmsLevel: number;
  setRmsLevel: (val: number) => void;
}

// Store optimizado: Se usará de forma superficial (`subscribe`) para evitar Layout Shifts
export const useAudioStore = create<AudioStoreState>((set) => ({
  rmsLevel: -96,
  setRmsLevel: (val) => set({ rmsLevel: val }),
}));
