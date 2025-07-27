import { create } from 'zustand';

export interface AgentInfo {
  name: string;
  description: string;
  avatar: string;
  modelId: string;
  instructions: string;
}

interface AgentPopupState {
  isOpen: boolean;
  agent: AgentInfo | null;
  openPopup: (agent: AgentInfo) => void;
  closePopup: () => void;
}

export const useAgentPopup = create<AgentPopupState>((set) => ({
  isOpen: false,
  agent: null,
  openPopup: (agent) => set({ isOpen: true, agent }),
  closePopup: () => set({ isOpen: false, agent: null }),
}));
