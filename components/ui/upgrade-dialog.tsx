'use client'

import {
  Dialog,
  DialogContent,
  DialogOverlay,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useUpgradePopup } from '@/hooks/use-upgrade-popup'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Plan {
  id: string
  name: string
  description: string
  image: string
  price?: string
}

const plans: Plan[] = [
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
]

export function UpgradeDialog() {
  const { isOpen, closePopup } = useUpgradePopup()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const { data: session } = useSession()
  const router = useRouter()

  const ownedModels = session?.user?.models ?? []

  async function checkout(planId: string) {
    if (!session?.user || session.user.type === 'guest') {
      closePopup()
      try {
        sessionStorage.setItem('pendingPlanId', planId)
      } catch {
        // ignore
      }
      router.push(`/login?planId=${planId}`)
      return
    }

    setLoadingId(planId)
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    })
    const data = await res.json()
    setLoadingId(null)
    if (data.url) {
      window.location.href = data.url
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={closePopup}>
      <DialogOverlay className="backdrop-blur-sm" />
      <DialogContent className="max-w-4xl p-8">
        <div className="mx-auto mb-10 bg-white/90 dark:bg-gray-900/90 px-6 py-3 rounded-full backdrop-blur-md shadow">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-medium">Upgrade Account</h2>
            <p className="text-sm text-muted-foreground">Select a model to unlock unlimited access.</p>
          </div>
        </div>
        <div className="mx-auto max-w-7xl grid gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            if (ownedModels.includes(plan.id)) return null
            const comingSoon = plan.id === 'coming-soon'
            return (
              <div
                key={plan.id}
                className="group bg-white dark:bg-gray-800 rounded-[28px] shadow-lg transition-transform duration-200 ease-out hover:scale-[1.04] hover:shadow-2xl flex flex-col justify-between min-h-[460px] min-w-[240px] p-6"
              >
                <div className="flex flex-col flex-1">
                  <div className="relative w-full h-28 rounded-md overflow-hidden">
                    <Image
                      src={plan.image}
                      alt={plan.name}
                      fill
                      className="object-cover transition-transform duration-200 ease-out group-hover:scale-105"
                    />
                  </div>
                  <h3 className="font-semibold text-lg leading-tight mt-4">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                  {!comingSoon && plan.price && (
                    <p className="mt-4 font-bold text-base">{plan.price}</p>
                  )}
                </div>
                {!comingSoon ? (
                  <Button
                    className="mt-4 w-full"
                    onClick={() => checkout(plan.id)}
                    disabled={loadingId === plan.id}
                  >
                    {loadingId === plan.id ? 'Loading...' : 'Purchase'}
                  </Button>
                ) : (
                  <p className="mt-4 text-center text-sm text-muted-foreground font-semibold">COMING SOON</p>
                )}
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
