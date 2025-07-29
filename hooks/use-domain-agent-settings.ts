import { create } from 'zustand';

export interface DomainAgentSettings {
  local: boolean;
  creators: Array<'A' | 'B' | 'C'>;
  generationCount: number;
}

interface Store extends DomainAgentSettings {
  setLocal: (v: boolean) => void;
  toggleCreator: (c: 'A' | 'B' | 'C') => void;
  setGenerationCount: (n: number) => void;
}

export const useDomainAgentSettings = create<Store>((set) => ({
  local: false,
  creators: [],
  generationCount: 1,
  setLocal: (v) => set({ local: v }),
  toggleCreator: (c) =>
    set((s) => ({
      creators: s.creators.includes(c)
        ? s.creators.filter((x) => x !== c)
        : [...s.creators, c],
    })),
  setGenerationCount: (n) => set({ generationCount: n }),
}));
