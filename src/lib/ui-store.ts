import { create } from 'zustand';

interface UiState {
  isSettingsOpen: boolean;
  toggleSettings: () => void;
  openSettings: () => void;
  closeSettings: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isSettingsOpen: false,
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
}));
