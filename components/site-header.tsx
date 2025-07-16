'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { clsx } from 'clsx'
import { MenuIcon, InfoIcon } from '@/components/icons'
import { useSidebar } from '@/components/ui/sidebar'
import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'
import { useUpgradePopup } from '@/hooks/use-upgrade-popup'

interface SiteHeaderProps {
  showSidebarToggle?: boolean
  showInfo?: boolean
  showUpgrade?: boolean
  children?: ReactNode
}

export function SiteHeader({
  showSidebarToggle = true,
  showInfo = true,
  showUpgrade = true,
  children,
}: SiteHeaderProps) {
  const { toggleSidebar, open: isSidebarOpen } = useSidebar()
  const t = useTranslation()
  const { openPopup: openUpgradePopup } = useUpgradePopup()
  const [hidden, setHidden] = useState(false)
  const [lastY, setLastY] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    function onScroll() {
      const y = window.scrollY
      if (y > lastY && y > 64) {
        setHidden(true)
      } else {
        setHidden(false)
      }
      setLastY(y)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [lastY])

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={clsx(
        'sticky top-0 left-0 z-[999] flex h-14 md:h-16 w-screen items-center border-b border-white/25 bg-white/15 px-4 md:px-6 backdrop-blur-[14px] backdrop-saturate-[160%] transition-[margin,width,transform] duration-200 ease-out',
        hidden && '-translate-y-full',
        isSidebarOpen && 'ml-[var(--sidebar-width)] w-[calc(100vw-var(--sidebar-width))]'
      )}
      style={{ background: 'rgba(255,255,255,.15)' }}
    >
      {showSidebarToggle && (
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={t('toggleSidebar')}
          className="mr-3 flex size-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:shadow-[0_0_8px_rgba(255,255,255,0.5)] md:hidden"
        >
          <MenuIcon size={28} />
        </button>
      )}
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        {showInfo && (
          <Link
            href="/agentupdate"
            className="flex h-9 items-center gap-2 rounded-full border border-white/40 px-3 text-sm backdrop-blur-sm transition-colors hover:bg-gradient-to-r hover:from-[var(--brand-accent)] hover:to-[#FFE3D2] hover:text-white"
            title={t('agentUpdateInfo')}
            rel="noopener noreferrer"
          >
            <InfoIcon size={24} />
            <span className="max-[420px]:sr-only">{t('agentUpdateInfo')}</span>
          </Link>
        )}
        {showUpgrade && (
          <Button
            className="ml-1 h-9 items-center rounded-full bg-gradient-to-r from-[var(--brand-accent)] to-[#FFE3D2] px-4 text-white shadow transition-shadow hover:shadow-[0_0_8px_rgba(255,255,255,0.5)]"
            onClick={() => openUpgradePopup()}
          >
            {t('upgradeModel')}
          </Button>
        )}
        {children}
      </div>
    </motion.header>
  )
}
