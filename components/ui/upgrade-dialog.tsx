'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { useUpgradePopup } from '@/hooks/use-upgrade-popup'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'
import { plans } from '@/lib/plans'

export function UpgradeDialog() {
  const { isOpen, closePopup } = useUpgradePopup()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const { data: session } = useSession()
  const router = useRouter()
  const t = useTranslation()

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
      <DialogContent className="bg-transparent shadow-none border-none p-0 max-w-none rounded-none sm:rounded-none">
        <div className="mx-auto mb-10 bg-white/90 dark:bg-gray-900/90 px-6 py-3 rounded-full backdrop-blur-md shadow transition-transform duration-200 hover:scale-105 w-full max-w-lg flex flex-col items-center justify-center text-center">
          <DialogHeader className="upgrade-header space-y-1 text-center">
            <DialogTitle className="text-xl font-medium">{t('upgradeAccount')}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">{t('selectModel')}</DialogDescription>
          </DialogHeader>
        </div>
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 px-10 py-10">
          {plans.map((plan) => {
            const owned = ownedModels.includes(plan.id)
            const comingSoon = plan.id === 'coming-soon'
            return (
              <div
                key={plan.id}
                className="model-card group bg-white dark:bg-gray-800 rounded-[28px] shadow-lg transition-transform duration-200 ease-out hover:scale-[1.04] hover:shadow-2xl flex flex-col justify-between p-4 m-2"
              >
                <div className="flex flex-col flex-1">
                  <Image
                    src={plan.image}
                    alt={t(plan.nameKey)}
                    width={300}
                    height={176}
                    className="object-cover rounded-t-lg transition-transform duration-200 ease-out group-hover:scale-105"
                  />
                  <h3 className="font-semibold text-lg leading-tight mt-4">{t(plan.nameKey)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t(plan.descriptionKey)}</p>
                  {!comingSoon && plan.price && (
                    <p className="mt-4 font-bold text-base">{plan.price}</p>
                  )}
                </div>
                {!comingSoon ? (
                  <>
                    {owned ? (
                      <Button className="mt-4 w-full" disabled>
                        {t('purchased')}
                      </Button>
                    ) : (
                      <Button
                        className="mt-4 w-full"
                        onClick={() => checkout(plan.id)}
                        disabled={loadingId === plan.id}
                      >
                        {loadingId === plan.id ? t('loading') : t('purchase')}
                      </Button>
                    )}
                    <Link
                      href="/compare"
                      className="mt-2 text-center text-sm font-semibold text-gray-800 hover:underline dark:text-zinc-200"
                    >
                      {t('compareModels')}
                    </Link>
                  </>
                ) : (
                  <p className="mt-4 text-center text-sm text-muted-foreground font-semibold">{t('comingSoon')}</p>
                )}
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
