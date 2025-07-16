'use client';

import Link from 'next/link';
import { MenuIcon, InfoIcon } from '@/components/icons';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export interface SiteHeaderProps {
  showSidebarToggle?: boolean;
  showInfo?: boolean;
  showUpgrade?: boolean;
  children?: React.ReactNode;
}

export function SiteHeader({
  showSidebarToggle = true,
  showInfo = true,
  showUpgrade = true,
  children,
}: SiteHeaderProps) {
  const { open: isSidebarOpen, toggleSidebar } = useSidebar();
  const t = useTranslation();

  return (
    <header
      className={cn(
        'sticky top-0 left-0 z-[999] flex items-center border-b border-white/25 backdrop-blur-[14px] backdrop-saturate-[160%] px-4',
        isSidebarOpen &&
          'ml-[var(--sidebar-width)] w-[calc(100vw-var(--sidebar-width))] transition-[margin-left,width] duration-200 ease-out',
      )}
      style={{ background: 'rgba(255,255,255,.12)' }}
    >
      {showSidebarToggle && (
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={t('toggleSidebar')}
          className="size-10 rounded-full border border-white/30 bg-white/20 backdrop-blur-sm backdrop-saturate-150 flex items-center justify-center hover:shadow-[0_0_8px_rgba(255,255,255,0.5)]"
        >
          <MenuIcon size={24} />
        </button>
      )}
      {children}
      <div className="flex-grow" />
      {showInfo && (
        <Link
          href="/agentupdate"
          rel="noopener noreferrer"
          className="btn info flex items-center gap-2 rounded-full border border-white/40 backdrop-blur-sm px-3 h-9 text-sm transition-colors hover:bg-gradient-to-r hover:from-[var(--brand-accent)] hover:to-[#FFE3D2] hover:text-white"
        >
          <InfoIcon size={24} />
          <span className="max-[420px]:sr-only">{t('agentUpdateInfo')}</span>
        </Link>
      )}
      {showUpgrade && (
        <Link
          href="#"
          className="btn upgrade ml-1 rounded-full bg-gradient-to-r from-[var(--brand-accent)] to-[#FFE3D2] text-white px-4 h-9 flex items-center shadow transition-shadow hover:shadow-[0_0_8px_rgba(255,255,255,0.5)]"
        >
          {t('upgradeModel')}
        </Link>
      )}
    </header>
  );
}

