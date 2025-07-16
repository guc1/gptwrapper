'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { SidebarLeftIcon, InfoIcon } from '@/components/icons';
import { useSidebar } from '@/components/ui/sidebar';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useAgentPopup } from '@/hooks/use-agent-popup';
import clsx from 'clsx';

export default function AssistentenHeader() {
  const { toggleSidebar, open: isSidebarOpen } = useSidebar();
  const t = useTranslation();
  const { isOpen: agentDialogOpen } = useAgentPopup();
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
        'stickyHeader px-4 md:px-6 h-14 md:h-16 transition-transform duration-200 ease-out',
        { withSidebar: isSidebarOpen },
        hidden && '-translate-y-full',
      )}
      style={{ background: 'rgba(255,255,255,.15)', zIndex: agentDialogOpen ? 40 : undefined }}
    >
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={t('toggleSidebar')}
        className="assistenten-toggle md:hidden mr-3 size-10 rounded-full backdrop-blur-sm bg-white/20 flex items-center justify-center hover:shadow-[0_0_8px_rgba(255,255,255,0.5)]"
      >
        <SidebarLeftIcon size={24} />
      </button>
      <div className="flex-1" />
      <div className="actions flex items-center gap-2">
        <Link
          href="/agentupdate"
          className="btn info flex items-center gap-2 rounded-full border border-white/40 backdrop-blur-sm px-3 h-9 text-sm transition-colors hover:bg-gradient-to-r hover:from-[var(--brand-accent)] hover:to-[#FFE3D2] hover:text-white"
          title={t('agentUpdateInfo')}
        >
          <InfoIcon size={24} />
          <span className="max-[420px]:sr-only">{t('agentUpdateInfo')}</span>
        </Link>
        <Link
          href="#"
          className="btn upgrade ml-1 rounded-full bg-gradient-to-r from-[var(--brand-accent)] to-[#FFE3D2] text-white px-4 h-9 flex items-center shadow transition-shadow hover:shadow-[0_0_8px_rgba(255,255,255,0.5)]"
        >
          {t('upgradeModel')}
        </Link>
      </div>
    </motion.header>
  );
}
