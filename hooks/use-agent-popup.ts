import { create } from 'zustand';
import type { Agent } from '@/lib/agents';

interface AgentPopupState {
  isOpen: boolean;
  agent: Agent | null;
  openPopup: (agent: Agent) => void;
  closePopup: () => void;
}

export const useAgentPopup = create<AgentPopupState>((set) => ({
  isOpen: false,
  agent: null,
  openPopup: (agent) => set({ isOpen: true, agent }),
  closePopup: () => set({ isOpen: false, agent: null }),
}));
