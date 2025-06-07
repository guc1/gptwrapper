'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { updateUserTypeAfterCheckout } from '@/app/(chat)/actions';

export function PostCheckoutUpdater({
  userId,
  planId,
}: {
  userId: string;
  planId: string;
}) {
  const router = useRouter();

  useEffect(() => {
    async function update() {
      try {
        await updateUserTypeAfterCheckout({ userId, planId });
      } finally {
        router.replace('/');
      }
    }

    update();
  }, [userId, planId, router]);

  return null;
}
