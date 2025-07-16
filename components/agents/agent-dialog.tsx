'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAgentPopup } from '@/hooks/use-agent-popup';
import { useTranslation } from '@/lib/i18n';

export function AgentDialog() {
  const { isOpen, closePopup } = useAgentPopup();
  const t = useTranslation();

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={closePopup}>
      <DialogContent className="bg-transparent shadow-none border-none p-0 max-w-none rounded-none">
        <div className="mx-auto w-full max-w-[52rem] p-6 sm:p-8 rounded-[28px] bg-white/40 dark:bg-gray-900/40 backdrop-blur-md shadow transition-transform duration-200 hover:scale-[1.02]">
          <div className="h-60" />
          <div className="mt-6 flex justify-center">
            <Button className="bg-gradient-to-r from-[var(--brand-accent)] to-[#FFE3D2] text-white px-4 h-9 flex items-center shadow transition-shadow hover:shadow-[0_0_8px_rgba(255,255,255,0.5)]">
              {t('goToChat')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
