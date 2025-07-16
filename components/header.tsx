'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MenuIcon } from '@/components/icons'
import { useSidebar } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'

export default function Header() {
  const { toggleSidebar } = useSidebar()
  const t = useTranslation()
  const [hidden, setHidden] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) return
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setHidden(y > lastY && y > 80)
      lastY = y
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`header sticky top-0 z-[999] mx-auto flex max-w-[1280px] items-center justify-between px-6 transition-all duration-200 backdrop-blur-[14px] backdrop-saturate-[160%] border-b border-white/30 bg-white/15 h-14 md:h-16 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      } ${hidden ? '-translate-y-full' : ''}`}
    >
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={t('toggleSidebar')}
        className="md:hidden rounded-md p-2"
      >
        <MenuIcon />
      </button>
      <Link href="/assistenten/info" className="text-sm">
        Info over Assistenten
      </Link>
      <Button
        data-testid="upgrade-button"
        className="upgrade-button rounded-full px-4 py-2 text-white"
        style={{
          background: 'linear-gradient(to right, var(--brand-accent), #FFE3D2)',
        }}
      >
        Upgrade model
      </Button>
    </div>
  )
}
