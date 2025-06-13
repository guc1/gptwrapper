'use client';

import useSWR from 'swr';
import { fetcher, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useTranslation } from '@/lib/i18n';

interface Subscription {
  modelId: string;
  expiresAt: string | null;
  canceled: boolean;
}

export function SubscriptionIndicator({ className }: { className?: string }) {
  const { data } = useSWR<{ subscriptions: Subscription[] }>('/api/subscriptions', fetcher, { refreshInterval: 30000 });
  const t = useTranslation();

  if (!data) return null;
  const subs = data.subscriptions.filter((s) => !s.canceled && s.expiresAt);
  if (subs.length === 0) return null;
  const earliest = subs.sort((a, b) => (new Date(a.expiresAt as string).getTime() > new Date(b.expiresAt as string).getTime() ? 1 : -1))[0];
  const date = format(new Date(earliest.expiresAt as string), 'PPP');
  const time = format(new Date(earliest.expiresAt as string), 'p');
  return (
    <div className={cn('text-xs text-muted-foreground px-2 py-1 border rounded-md', className)}>
      {t('validUntil', { date, time })}
    </div>
  );
}
