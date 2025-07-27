'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { motion } from 'framer-motion';
import { useAgentPopup } from '@/hooks/use-agent-popup';
import { useTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';

export function AgentDialog() {
  const { isOpen, closePopup } = useAgentPopup();
  const t = useTranslation();
  const router = useRouter();

  function goToChat() {
    closePopup();
    router.push('/');
    router.refresh();
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={closePopup}>
      <DialogContent className="agentPreviewDialog bg-transparent shadow-none border-none p-0 max-w-none rounded-none">
        <VisuallyHidden>
          <DialogTitle>{t('agents')}</DialogTitle>
        </VisuallyHidden>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.16 }}
          className="agentPreviewCard mx-auto"
        >
          <DialogClose className="agentPreviewClose">
            <span className="sr-only">Close</span>
          </DialogClose>
          <h2>Luna</h2>
          <div className="agentPreviewDemo" aria-label={t('agentDemoLabel')} />
          <p className="agentPreviewDescription">
            Creative writing assistant helping craft engaging stories.
          </p>
          <div className="agentPreviewDivider" />
          <div className="agentChatListHeader">{t('agentChatListHeading')}</div>
          <div className="agentChatList">
            <button type="button">How do I start a novel?</button>
            <button type="button">Generate character ideas</button>
            <button type="button">Outline a mystery plot</button>
            <button type="button">Tips for dialogue</button>
            <button type="button">Suggest a story prompt</button>
          </div>
          <button type="button" className="goToChatButton" onClick={goToChat}>
            {t('goToChat')}
          </button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
