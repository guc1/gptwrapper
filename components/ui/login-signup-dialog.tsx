// components/ui/login-signup-dialog.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  // DialogClose, // Removed this
  DialogOverlay,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useLoginSignupPopup } from '@/hooks/use-login-signup-popup';
// import { X } from 'lucide-react'; // No longer needed here if DialogContent provides it
// import { useEffect } from 'react'; // No longer needed for body blur

export function LoginSignupDialog() {
  const { isOpen, closePopup, chatContext } = useLoginSignupPopup();

  // Removed useEffect for body class manipulation

  if (!isOpen) {
    return null;
  }

  const getAuthLink = (basePath: string) => {
    if (chatContext) {
      const params = new URLSearchParams();
      params.append('chatIdToResume', chatContext.chatId);
      params.append('guestUserId', chatContext.guestUserId);
      if (chatContext.unsentPrompt) {
        params.append('unsentPrompt', chatContext.unsentPrompt);
      }
      return `${basePath}?${params.toString()}`;
    }
    return basePath;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(newOpenState) => { if (!newOpenState) closePopup(); }}>
      <DialogOverlay className="backdrop-blur-sm" /> {/* backdrop-blur-sm added by default in globals.css modification or here */}
      <DialogContent
        className="sm:max-w-[425px]"
        onPointerDownOutside={(e) => {
          // Allow closing by clicking outside if desired, or keep e.preventDefault()
          // For now, let's allow closing by clicking outside as per standard dialog behavior
          // e.preventDefault(); 
        }}
        onEscapeKeyDown={closePopup} // This will be handled by DialogPrimitive.Content now
      >
        <DialogHeader>
          <DialogTitle>Continue Chatting</DialogTitle>
          <DialogDescription>
            You've used your free message for today. Please log in or create an account to continue chatting.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col sm:gap-2 pt-4">
          <Button asChild onClick={closePopup} className="w-full">
            <Link href={getAuthLink('/login')}>Login</Link>
          </Button>
          <Button variant="outline" asChild onClick={closePopup} className="w-full">
            <Link href={getAuthLink('/register')}>Create Account</Link>
          </Button>
        </DialogFooter>
        {/* The DialogClose button is now implicitly part of DialogContent from shadcn/ui */}
      </DialogContent>
    </Dialog>
  );
}