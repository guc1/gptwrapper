'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useUpgradePopup } from '@/hooks/use-upgrade-popup';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Plan {
  id: string;
  name: string;
  description: string;
  price?: string;
  image: string;
}

const plans: Array<Plan> = [
  {
    id: 'basic-model',
    name: 'BASIC MODEL',
    description: 'The fast and reliable model.',
    price: '€4.99',
    image: '/placeholder.png', // replace with your image path
  },
  {
    id: 'gemiddeld-model',
    name: 'GEMMIDDELD MODEL',
    description: 'Very good model capable of most tasks.',
    price: '€9.99',
    image: '/placeholder.png', // replace with your image path
  },
  {
    id: 'top-model',
    name: 'TOP MODEL',
    description: 'Best state of the art model capable of everything.',
    price: '€19.99',
    image: '/placeholder.png', // replace with your image path
  },
  {
    id: 'coming-soon',
    name: 'COMING SOON',
    description: 'New model available soon.',
    image: '/placeholder.png', // replace with your image path
  },
];

export function UpgradeDialog() {
  const { isOpen, closePopup } = useUpgradePopup();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  const ownedModels = session?.user?.models ?? [];

  async function checkout(planId: string) {
    if (!session?.user || session.user.type === 'guest') {
      closePopup();
      try {
        sessionStorage.setItem('pendingPlanId', planId);
      } catch {
        // ignore
      }
      router.push(`/login?planId=${planId}`);
      return;
    }

    setLoadingId(planId);
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    });
    const data = await res.json();
    setLoadingId(null);
    if (data.url) {
      window.location.href = data.url;
    }
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={closePopup}>
      <DialogOverlay className="backdrop-blur-sm" />
      <DialogContent className="max-w-4xl p-6">
        <DialogHeader>
          <DialogTitle>Upgrade Account</DialogTitle>
          <DialogDescription>
            Select a model to unlock unlimited access.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 mt-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            if (ownedModels.includes(plan.id)) return null;
            const isComingSoon = plan.id === 'coming-soon';
            return (
              <div
                key={plan.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex flex-col"
              >
                <Image
                  src={plan.image}
                  alt={plan.name}
                  width={300}
                  height={96}
                  className="h-24 w-full rounded object-cover"
                />
                <h3 className="mt-4 font-semibold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>
                {!isComingSoon && (
                  <>
                    <p className="font-bold mb-2">{plan.price}</p>
                    <Button
                      className="w-full"
                      onClick={() => checkout(plan.id)}
                      disabled={loadingId === plan.id}
                    >
                      {loadingId === plan.id ? 'Loading...' : 'Purchase'}
                    </Button>
                  </>
                )}
                {isComingSoon && (
                  <p className="font-bold">COMING SOON</p>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
