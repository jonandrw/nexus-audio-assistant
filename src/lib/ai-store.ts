import { create } from 'zustand';
import { AISuggestion } from '@/components/dashboard/AICard';

interface AIState {
  alerts: AISuggestion[];
  addAlert: (alert: AISuggestion) => void;
  removeAlert: (id: string) => void;
}

export const useAIStore = create<AIState>((set) => ({
  alerts: [],
  addAlert: (newAlert) => set((state) => {
    // Evitar duplicados para la misma frecuencia y canal
    const isDuplicate = state.alerts.some(
      a => a.targetFreq === newAlert.targetFreq && a.targetChannel === newAlert.targetChannel
    );
    if (isDuplicate) return state;
    
    return { alerts: [newAlert, ...state.alerts] };
  }),
  removeAlert: (id) => set((state) => ({
    alerts: state.alerts.filter((a) => a.id !== id)
  }))
}));
