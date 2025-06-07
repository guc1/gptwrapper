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
import { useUpgradePopup } from '@/hooks/use-upgrade-popup';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
}

const plans: Array<Plan> = [
  {
    id: 'basic-model',
    name: 'BASIC MODEL',
    description: 'The fast and reliable model.',
    price: '€4.99',
    image: '/placeholder.png',
  },
  {
    id: 'gemiddeld-model',
    name: 'GEMMIDDELD MODEL',
    description: 'Very good model capable of most tasks.',
    price: '€9.99',
    image: '/placeholder.png',
  },
  {
    id: 'top-model',
    name: 'TOP MODEL',
    description: 'Best state of the art model capable of everything.',
    price: '€19.99',
    image: '/placeholder.png',
  },
];

export function UpgradeDialog() {
  const { isOpen, closePopup } = useUpgradePopup();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { data: session } = useSession();

  const currentType = session?.user?.type;
  const PLAN_TYPE_MAP: Record<string, string> = {
    'basic-model': 'basic',
    'gemiddeld-model': 'gemiddeld',
    'top-model': 'top',
  };

  async function checkout(planId: string) {
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upgrade Account</DialogTitle>
          <DialogDescription>
            Select a model to unlock unlimited access.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-4 mt-4">
          {plans.map((plan) => {
            if (PLAN_TYPE_MAP[plan.id] === currentType) return null;
            return (
              <div
                key={plan.id}
                className="border rounded-md p-4 flex flex-col items-start w-full sm:w-1/3"
              >
                <img
                  src={plan.image}
                  alt={plan.name}
                  className="h-24 w-full object-cover rounded"
                />
              <h3 className="mt-2 font-semibold">{plan.name}</h3>
              <p className="text-sm text-muted-foreground">
                {plan.description}
              </p>
              <p className="font-bold mt-2">{plan.price}</p>
              <Button
                className="mt-2 w-full"
                onClick={() => checkout(plan.id)}
                disabled={loadingId === plan.id}
              >
                {loadingId === plan.id ? 'Loading...' : 'Purchase'}
              </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
