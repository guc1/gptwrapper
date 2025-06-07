import { create } from 'zustand';

interface UpgradePopupState {
  isOpen: boolean;
  openPopup: () => void;
  closePopup: () => void;
}

export const useUpgradePopup = create<UpgradePopupState>((set) => ({
  isOpen: false,
  openPopup: () => set({ isOpen: true }),
  closePopup: () => set({ isOpen: false }),
}));
