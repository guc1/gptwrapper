'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useSidebar } from '@/components/ui/sidebar';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { MessageLimitIndicator } from '@/components/message-limit-indicator';
import { Button } from '@/components/ui/button';
import { useUpgradePopup } from '@/hooks/use-upgrade-popup';
import { useTranslation } from '@/lib/i18n';
import { useSession } from 'next-auth/react';

export function DomainAgentHeader({
  onOpenSettings,
  onOpenLogs,
}: {
  onOpenSettings: () => void;
  onOpenLogs: () => void;
}) {
  const { toggleSidebar, open: isSidebarOpen } = useSidebar();
  const { openPopup: openUpgradePopup } = useUpgradePopup();
  const { data: session } = useSession();
  const t = useTranslation();
  const [hidden, setHidden] = useState(false);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    function onScroll() {
      const y = window.scrollY;
      if (y > lastY && y > 64) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      setLastY(y);
    }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [lastY]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={clsx(
        'stickyHeader px-4 md:px-6 h-14 md:h-16 flex items-center gap-2 transition-transform duration-200 ease-out',
        { withSidebar: isSidebarOpen },
        hidden && '-translate-y-full',
      )}
      style={{ background: 'rgba(255,255,255,.15)' }}
    >
      <SidebarToggle />
      <div className="flex-1" />
      {session?.user && (
        <MessageLimitIndicator userId={session.user.id} className="hidden md:flex" />
      )}
      <Button variant="ghost" onClick={onOpenSettings} className="h-8 px-3 text-sm">
        {t('settings')}
      </Button>
      <Button variant="ghost" onClick={onOpenLogs} className="h-8 px-3 text-sm">
        {t('logs')}
      </Button>
      <Button
        variant="outline"
        className="ml-2 h-8 px-3 text-sm"
        onClick={() => openUpgradePopup()}
      >
        {t('upgrade')}
      </Button>
    </motion.header>
  );
}
