'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { useAgentPopup } from '@/hooks/use-agent-popup';
import { useTranslation } from '@/lib/i18n';
import useSWRInfinite from 'swr/infinite';
import { fetcher } from '@/lib/utils';
import { format } from 'date-fns';
import { useEffect, useRef } from 'react';
import type { Chat } from '@/lib/db/schema';

export function AgentDialog() {
  const { isOpen, closePopup } = useAgentPopup();
  const t = useTranslation();

  const agentId = 'demo-agent';

  const listRef = useRef<HTMLDivElement>(null);
  const {
    data: pages,
    setSize,
    isValidating,
  } = useSWRInfinite<{ chats: Array<Chat>; nextCursor: string | null }>(
    (pageIndex, previousPageData) => {
      if (previousPageData && !previousPageData.nextCursor) return null;
      const cursor = previousPageData ? previousPageData.nextCursor : null;
      return `/api/agents/${agentId}/chats?limit=5${
        cursor ? `&cursor=${cursor}` : ''
      }`;
    },
    fetcher,
    { revalidateFirstPage: false, parallel: true, fallbackData: [], shouldRetryOnError: false },
  );

  const chats = pages ? pages.flatMap((p) => p.chats) : [];
  const nextCursor = pages?.[pages.length - 1]?.nextCursor;

  useEffect(() => {
    if (isOpen) {
      setSize(1);
    }
    if (!listRef.current) return;
    function onScroll() {
      if (!listRef.current) return;
      if (
        listRef.current.scrollTop + listRef.current.clientHeight >=
          listRef.current.scrollHeight - 4 &&
        nextCursor &&
        !isValidating
      ) {
        setSize((s) => s + 1);
      }
    }
    const el = listRef.current;
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [nextCursor, isValidating, setSize, isOpen]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={closePopup}>
      <DialogContent className="bg-transparent shadow-none border-none p-0 max-w-none rounded-none">
        <VisuallyHidden>
          <DialogTitle>{t('agents')}</DialogTitle>
        </VisuallyHidden>
        <div className="relative mx-auto w-full max-w-[52rem]">
          <div className="absolute inset-0 rounded-[28px] frostedGlow frostedGlow-grey pointer-events-none" />
          <div className="relative p-6 sm:p-8 rounded-[28px] bg-white/90 dark:bg-gray-900/80 backdrop-blur-md shadow">
            <h2 className="font-bold text-xl text-center mb-4">Luna</h2>
            <div className="w-full aspect-video rounded-xl overflow-hidden shadow-inner mb-4">
              <img
                src="/images/demo-thumbnail.png"
                alt=""
                aria-label={t('agentDemoAria')}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-center opacity-80 max-w-prose mx-auto mb-6">
              This assistant helps you craft creative narratives quickly.
            </p>
            <h3 className="font-medium mb-2 text-left">
              {t('chatsWithAssistant')}
            </h3>
            <div
              ref={listRef}
              className="frostedGlow frostedGlow-peach rounded-xl max-h-60 overflow-y-auto divide-y divide-white/10 mb-4"
            >
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-white/20 transition-shadow"
                  onClick={() => {
                    window.location.href = `/chat/${chat.id}`;
                  }}
                >
                  <div className="flex justify-between">
                    <span>{chat.title}</span>
                    <span className="text-xs opacity-70">
                      {format(new Date(chat.updatedAt), 'P')}
                    </span>
                  </div>
                </button>
              ))}
              {isValidating && (
                <div className="py-2 text-center text-sm opacity-70">
                  {t('loading')}
                </div>
              )}
            </div>
            {nextCursor ? (
              <div className="text-center text-sm opacity-70 mb-2">{t('loadMore')}</div>
            ) : null}
            <div className="flex justify-center">
              <Button className="bg-gradient-to-r from-[var(--brand-accent)] to-[#FFE3D2] text-white px-4 h-9 flex items-center shadow transition-shadow hover:shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                {t('goToChat')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
