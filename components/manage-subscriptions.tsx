'use client';

import Image from 'next/image';
import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { fetcher } from '@/lib/utils';
import { plans } from '@/lib/plans';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { format } from 'date-fns';

interface Subscription {
  modelId: string;
  expiresAt: string | null;
  canceled: boolean;
}

export function ManageSubscriptions() {
  const { data, mutate } = useSWR<{ subscriptions: Subscription[] }>('/api/subscriptions', fetcher);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const router = useRouter();
  const t = useTranslation();

  async function checkout(planId: string) {
    setLoadingId(planId);
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    });
    const json = await res.json();
    setLoadingId(null);
    if (json.url) {
      window.location.href = json.url;
    }
  }

  async function cancel(planId: string) {
    if (!confirm(t('confirmCancelQuestion'))) return;
    setLoadingId(planId);
    await fetch('/api/subscriptions/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, reason }),
    });
    setLoadingId(null);
    setReason('');
    mutate();
  }

  const subs = data?.subscriptions ?? [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 px-10 py-10">
      {plans.map((plan) => {
        const subscription = subs.find((s) => s.modelId === plan.id && !s.canceled);
        const canceledSub = subs.find(
          (s) =>
            s.modelId === plan.id &&
            s.canceled &&
            s.expiresAt &&
            new Date(s.expiresAt) > new Date(),
        );
        const comingSoon = plan.id === 'coming-soon';
        return (
          <div key={plan.id} className="model-card bg-white dark:bg-gray-800 rounded-[28px] shadow-lg flex flex-col justify-between p-4 m-2">
            <div className="flex flex-col flex-1">
              <Image src={plan.image} alt={plan.name} width={300} height={176} className="object-cover rounded-t-lg" />
              <h3 className="font-semibold text-lg leading-tight mt-4">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              {!comingSoon && plan.price && <p className="mt-4 font-bold text-base">{plan.price}</p>}
              {canceledSub?.expiresAt && (
                <p className="mt-2 text-sm">
                  {t('validUntil', {
                    date: format(new Date(canceledSub.expiresAt), 'PPP'),
                    time: format(new Date(canceledSub.expiresAt), 'p'),
                  })}
                </p>
              )}
            </div>
            {!comingSoon ? (
              subscription ? (
                <>
                  <textarea className="mt-2 w-full border rounded p-1" placeholder={t('reasonPlaceholder')} value={reason} onChange={(e) => setReason(e.target.value)} />
                  <Button className="mt-2 w-full" onClick={() => cancel(plan.id)} disabled={loadingId === plan.id}>
                    {loadingId === plan.id ? t('loading') : t('cancelSubscription')}
                  </Button>
                </>
              ) : (
                <>
                  <Button className="mt-4 w-full" onClick={() => checkout(plan.id)} disabled={loadingId === plan.id}>
                    {loadingId === plan.id ? t('loading') : t('purchase')}
                  </Button>
                  <Link href="/compare" className="mt-2 text-center text-sm font-semibold text-gray-800 hover:underline dark:text-zinc-200">
                    {t('compareModels')}
                  </Link>
                </>
              )
            ) : (
              <p className="mt-4 text-center text-sm text-muted-foreground font-semibold">{t('comingSoon')}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
