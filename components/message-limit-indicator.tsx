'use client';

import useSWR from 'swr';
import { cn, fetcher } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Ensure this path is correct
import { useEffect, useState } from 'react';
import { formatDistanceToNowStrict, format, isPast } from 'date-fns';
import type { UserType } from '@/lib/user-types';
import { LoaderIcon } from './icons';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations();
  const [tooltipContent, setTooltipContent] = useState<string>('');
  const [displayMessagesLeft, setDisplayMessagesLeft] = useState<string>('...');

  useEffect(() => {
    if (data) {
      const { messagesLeft, maxMessages, nextResetTimestamp, userType } = data;

      if (userType === 'guest') {
        setDisplayMessagesLeft(
          t('free_messages_left', { count: messagesLeft })
        );
        if (nextResetTimestamp) {
          if (isPast(new Date(nextResetTimestamp))) {
            setTooltipContent(t('messages_have_reset'));
          } else {
            setTooltipContent(
              `Resets ${formatDistanceToNowStrict(new Date(nextResetTimestamp), { addSuffix: true })} (at ${format(new Date(nextResetTimestamp), 'p')})`,
            );
          }
        } else {
           setTooltipContent(t('one_free_per_day'));
        }
      } else {
        setDisplayMessagesLeft(`${messagesLeft} of ${maxMessages} left`);
        // For registered users, we might not have a precise 'nextResetTimestamp' if it's just "daily"
        // The API would need to provide a consistent timestamp for this if precise countdown is desired.
        // For now, a general message.
      setTooltipContent(t('limit_resets_daily'));
      }
    } else if (error) {
      setDisplayMessagesLeft(t('limit_na'));
      setTooltipContent(t('could_not_load_limit'));
    } else if (isLoading) {
      setDisplayMessagesLeft('...');
      setTooltipContent(t('loading_message_limit'));
    }
  }, [data, error, isLoading]);


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
        {t('limit_na')}
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