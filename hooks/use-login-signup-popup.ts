// hooks/use-login-signup-popup.ts
import { create } from 'zustand';

interface LoginSignupPopupState {
  isOpen: boolean;
  chatContext?: {
    chatId: string;
    guestUserId: string;
    unsentPrompt: string;
  };
  openPopup: (context?: LoginSignupPopupState['chatContext']) => void;
  closePopup: () => void;
}

export const useLoginSignupPopup = create<LoginSignupPopupState>((set) => ({
  isOpen: false,
  chatContext: undefined,
  openPopup: (context) => set({ isOpen: true, chatContext: context }),
  closePopup: () => set({ isOpen: false, chatContext: undefined }),
}));