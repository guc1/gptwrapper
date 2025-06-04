'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Ensure this path is correct
import { useEffect, useState } from 'react';
import { formatDistanceToNowStrict, format, isPast } from 'date-fns';
import type { UserType } from '@/app/(auth)/auth';
import { LoaderIcon } from './icons';

interface MessageStatus {
  messagesLeft: number;
  maxMessages: number;
  nextResetTimestamp: number | null;
  userType: UserType;
}

export function MessageLimitIndicator() {
  const { data, error, isLoading } = useSWR<MessageStatus>(
    '/api/message-status',
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    },
  );
  const [tooltipContent, setTooltipContent] = useState<string>('');
  const [displayMessagesLeft, setDisplayMessagesLeft] = useState<string>('...');

  useEffect(() => {
    if (data) {
      const { messagesLeft, maxMessages, nextResetTimestamp, userType } = data;

      if (userType === 'guest') {
        setDisplayMessagesLeft(`${messagesLeft} free message${messagesLeft === 1 ? '' : 's'} left`);
        if (nextResetTimestamp) {
          if (isPast(new Date(nextResetTimestamp))) {
            setTooltipContent('Messages have reset. You can send a message.');
          } else {
            setTooltipContent(
              `Resets ${formatDistanceToNowStrict(new Date(nextResetTimestamp), { addSuffix: true })} (at ${format(new Date(nextResetTimestamp), 'p')})`,
            );
          }
        } else {
           setTooltipContent(`1 free message per day. Resets daily.`);
        }
      } else {
        setDisplayMessagesLeft(`${messagesLeft} of ${maxMessages} left`);
        // For registered users, we might not have a precise 'nextResetTimestamp' if it's just "daily"
        // The API would need to provide a consistent timestamp for this if precise countdown is desired.
        // For now, a general message.
        setTooltipContent(`Message limit resets daily.`);
      }
    } else if (error) {
      setDisplayMessagesLeft('Limit N/A');
      setTooltipContent('Could not load message limit.');
    } else if (isLoading) {
      setDisplayMessagesLeft('...');
      setTooltipContent('Loading message limit...');
    }
  }, [data, error, isLoading]);


  if (isLoading) {
    return (
      <div className="text-xs text-muted-foreground px-2 py-1 animate-pulse flex items-center gap-1">
        <LoaderIcon size={12} /> Loading...
      </div>
    );
  }

  if (error || !data) {
    return <div className="text-xs text-muted-foreground px-2 py-1">Limit N/A</div>;
  }

   if (data.userType !== 'guest') {
     return null;
   }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="text-xs text-muted-foreground cursor-default px-2 py-1 border rounded-md bg-background hover:bg-accent">
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