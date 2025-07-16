'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MenuIcon, InfoIcon } from '@/components/icons';
import { useSidebar } from '@/components/ui/sidebar';
import { useEffect, useState } from 'react';
import { useUpgradePopup } from '@/hooks/use-upgrade-popup';
import { useTranslation } from '@/lib/i18n';

export default function AssistentenHeader() {
  const { toggleSidebar } = useSidebar();
  const { openPopup: openUpgradePopup } = useUpgradePopup();
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
      className={`sticky-header sticky top-0 z-[999] flex h-14 md:h-16 items-center border-b border-white/30 bg-white/15 px-4 backdrop-blur-[14px] backdrop-saturate-[160%] transition-transform duration-200 ease-out ${hidden ? '-translate-y-full' : ''}`}
      style={{ background: 'rgba(255,255,255,.15)' }}
    >
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label="Open / sluit navigatie"
        className="sidebar-toggle md:hidden mr-3 ml-1 size-10 rounded-full bg-white/20 backdrop-blur-[6px] shadow-sm hover:shadow-md"
      >
        <MenuIcon size={28} />
      </button>
      <div className="flex-1" />
      <div className="actions flex gap-2">
        <Link
          href="/agentupdate"
          title="Info over Assistenten"
          className="btn-info flex h-9 items-center rounded-full border border-white/40 bg-transparent px-3 font-semibold backdrop-blur-[6px] transition hover:bg-gradient-to-r hover:from-[var(--brand-accent)] hover:to-[#FFE3D2] hover:text-white"
        >
          <InfoIcon size={24} />
          <span className="ml-2 max-[420px]:hidden">Info over Assistenten</span>
        </Link>
        <button
          type="button"
          onClick={openUpgradePopup}
          className="btn-upgrade h-9 rounded-full bg-gradient-to-r from-[var(--brand-accent)] to-[#FFE3D2] px-4 font-semibold text-white shadow transition-shadow hover:shadow-[0_0_8px_rgba(255,255,255,0.5)]"
        >
          Upgrade model
        </button>
      </div>
    </motion.header>
  );
}
