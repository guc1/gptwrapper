'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useAgentPopup } from '@/hooks/use-agent-popup';
import { useTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';

export function AgentDialog() {
  const { isOpen, agent, closePopup } = useAgentPopup();
  const t = useTranslation();
  const router = useRouter();

  const { data } = useSWR(
    isOpen && agent ? `/api/history?limit=20&modelId=${agent.modelId}` : null,
    fetcher,
  );
  const chats = (data?.chats as Array<{ id: string; title: string }> | undefined) ?? [];

  function goToChat(chatId?: string) {
    closePopup();
    if (chatId) {
      if (agent && agent.id === 'domain-agent') {
        router.push(`/domainagent?chatId=${chatId}`);
      } else {
        router.push(`/chat/${chatId}`);
      }
    } else if (agent) {
      if (agent.id === 'domain-agent') {
        router.push('/domainagent');
      } else {
        router.push(`/?modelId=${agent.modelId}`);
      }
    }
    router.refresh();
  }

  if (!isOpen || !agent) return null;

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
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <h2>{agent.name}</h2>
          <div className="agentPreviewDemo" aria-label={t('agentDemoLabel')} />
          <p className="agentPreviewDescription">{agent.description}</p>
          <div className="agentPreviewDivider" />
          <div className="agentChatListHeader">{t('agentChatListHeading')}</div>
          <div className="agentChatList">
            {chats.map((chat) => (
              <button
                type="button"
                key={chat.id}
                onClick={() => goToChat(chat.id)}
              >
                {chat.title}
              </button>
            ))}
          </div>
          <button type="button" className="goToChatButton" onClick={() => goToChat()}>
            {t('goToChat')}
          </button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
