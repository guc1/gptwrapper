'use client';

import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAgentPopup } from '@/hooks/use-agent-popup';

export function AgentPopup() {
  const { isOpen, closePopup } = useAgentPopup();

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={closePopup}>
      <DialogOverlay className="backdrop-blur-sm" />
      <DialogContent className="bg-white/20 dark:bg-gray-800/20 border border-white/30 backdrop-blur-lg backdrop-saturate-150 max-w-[52rem] w-full p-6 rounded-2xl shadow-xl transition-transform hover:scale-[1.02]">
        <div className="flex flex-col gap-6 min-h-[24rem]">
          {/* Content goes here */}
          <Button className="self-end mt-auto">Go to chat</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
