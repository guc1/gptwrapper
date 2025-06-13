'use client';

import useSWR from 'swr';
import { cn, fetcher } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Ensure this path is correct
import { useEffect, useState } from 'react';
import { formatDistanceToNowStrict, format, isPast } from 'date-fns';
import type { UserType } from '@/lib/user-types';
import { LoaderIcon } from './icons';
import { useTranslation } from '@/lib/i18n';
import { useLanguage } from './language-provider';

interface MessageStatus {
  messagesLeft: number;
  maxMessages: number;
  nextResetTimestamp: number | null;
  userType: UserType;
}

export function MessageLimitIndicator({
  userId,
  className,
}: {
  userId: string;
  className?: string;
}) {
  const { data, error, isLoading } = useSWR<MessageStatus>(
    userId ? `/api/message-status?userId=${userId}` : null,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    },
  );
  const [tooltipContent, setTooltipContent] = useState<string>('');
  const [displayMessagesLeft, setDisplayMessagesLeft] = useState<string>('...');
  const t = useTranslation();
  const { lang } = useLanguage();

  useEffect(() => {
    if (data) {
      const { messagesLeft, maxMessages, nextResetTimestamp, userType } = data;

      if (userType === 'guest') {
        setDisplayMessagesLeft(
          t('freeMessagesLeft', {
            count: messagesLeft.toString(),
            plural:
              lang === 'nl'
                ? messagesLeft === 1
                  ? ''
                  : 'en'
                : messagesLeft === 1
                  ? ''
                  : 's',
          }),
        );
        if (nextResetTimestamp) {
          if (isPast(new Date(nextResetTimestamp))) {
            setTooltipContent(t('messagesReset'));
          } else {
            setTooltipContent(
              t('resetsAt', {
                duration: formatDistanceToNowStrict(new Date(nextResetTimestamp), { addSuffix: true }),
                time: format(new Date(nextResetTimestamp), 'p'),
              }),
            );
          }
        } else {
           setTooltipContent(t('oneFreeMessageInfo'));
        }
      } else {
        setDisplayMessagesLeft(
          t('messagesLeftOf', {
            count: messagesLeft.toString(),
            max: maxMessages.toString(),
          }),
        );
        // For registered users, we might not have a precise 'nextResetTimestamp' if it's just "daily"
        // The API would need to provide a consistent timestamp for this if precise countdown is desired.
        // For now, a general message.
        setTooltipContent(t('messageLimitResets'));
      }
    } else if (error) {
      setDisplayMessagesLeft(t('limitNA'));
      setTooltipContent(t('couldNotLoadMessageLimit'));
    } else if (isLoading) {
      setDisplayMessagesLeft('...');
      setTooltipContent(t('loadingMessageLimit'));
    }
  }, [data, error, isLoading, lang, t]);


  if (isLoading) {
    return (
      <div className={cn(
        'text-xs text-muted-foreground px-2 py-1 animate-pulse flex items-center gap-1',
        className,
      )}>
        <LoaderIcon size={12} /> {t('loading')}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={cn('text-xs text-muted-foreground px-2 py-1', className)}>
        {t('limitNA')}
      </div>
    );
  }

   if (data.userType !== 'guest' && data.userType !== 'regular') {
     return null;
   }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'text-xs text-muted-foreground cursor-default px-2 py-1 border rounded-md bg-background hover:bg-accent',
              className,
            )}
          >
            {displayMessagesLeft}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="max-w-xs">
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}