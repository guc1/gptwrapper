import { create } from 'zustand';

interface AgentPopupState {
  isOpen: boolean;
  openPopup: () => void;
  closePopup: () => void;
}

export const useAgentPopup = create<AgentPopupState>((set) => ({
  isOpen: false,
  openPopup: () => set({ isOpen: true }),
  closePopup: () => set({ isOpen: false }),
}));
