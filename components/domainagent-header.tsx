'use client';
import { motion } from 'framer-motion';
import { SidebarLeftIcon } from '@/components/icons';
import { useSidebar } from '@/components/ui/sidebar';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { useUpgradePopup } from '@/hooks/use-upgrade-popup';
import { MessageLimitIndicator } from '@/components/message-limit-indicator';
import { SubscriptionIndicator } from '@/components/subscription-indicator';
import { useSession } from 'next-auth/react';
import clsx from 'clsx';

export default function DomainAgentHeader({
  onOpenSettings,
  onOpenLogs,
  onOpenHistory,
  showLogs,
  overlayOpen,
}: {
  onOpenSettings: () => void;
  onOpenLogs: () => void;
  onOpenHistory: () => void;
  showLogs: boolean;
  overlayOpen: boolean;
}) {
  const { toggleSidebar, open: isSidebarOpen } = useSidebar();
  const { data: session } = useSession();
  const { openPopup: openUpgradePopup } = useUpgradePopup();
  const t = useTranslation();

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={clsx('stickyHeader flex items-center gap-2 h-14 md:h-16 px-4 md:px-6', {
        withSidebar: isSidebarOpen,
      })}
      style={{
        background: 'rgba(255,255,255,.15)',
        zIndex: overlayOpen ? 40 : undefined,
      }}
    >
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={t('toggleSidebar')}
        className="assistenten-toggle md:hidden mr-3 size-10 rounded-full backdrop-blur-sm bg-white/20 flex items-center justify-center hover:shadow-[0_0_8px_rgba(255,255,255,0.5)]"
      >
        <SidebarLeftIcon size={24} />
      </button>
      {session?.user?.models?.length ? (
        <SubscriptionIndicator className="hidden sm:block" />
      ) : (
        session?.user && (
          <MessageLimitIndicator userId={session.user.id} className="hidden sm:block" />
        )
      )}
      <div className="flex-1" />
      {session?.user && session.user.models?.length !== 3 && (
        <Button variant="outline" className="hidden md:flex h-9 px-3" onClick={() => openUpgradePopup()}>
          {t('upgrade')}
        </Button>
      )}
      <Button variant="outline" onClick={onOpenSettings} className="h-9 px-3">
        {t('settings')}
      </Button>
      {showLogs && (
        <Button variant="outline" onClick={onOpenLogs} className="h-9 px-3">
          {t('logs')}
        </Button>
      )}
      <Button variant="outline" onClick={onOpenHistory} className="h-9 px-3">
        {t('history')}
      </Button>
    </motion.header>
  );
}
