'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MenuIcon } from '@/components/icons';
import { useSidebar } from '@/components/ui/sidebar';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function AssistentenHeader() {
  const { toggleSidebar } = useSidebar();
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
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`sticky top-0 z-[999] backdrop-blur-[14px] backdrop-saturate-[160%] border-b border-white/30 bg-white/15 h-14 md:h-16 flex items-center justify-between px-6 transition-transform duration-200 ease-out ${hidden ? '-translate-y-full' : ''}`}
      style={{
        background: 'rgba(255,255,255,.15)',
      }}
    >
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={t('toggleSidebar')}
        className="md:hidden p-2 rounded-md"
      >
        <MenuIcon />
      </button>
      <div className="flex-1" />
      <Link
        href="/assistenten/info"
        className="text-sm hover:underline"
      >
        Info over Assistenten
      </Link>
      <Link
        href="#"
        className="ml-3 rounded-full bg-gradient-to-r from-[var(--brand-accent)] to-[#FFE3D2] text-white px-4 py-1.5 shadow transition-shadow hover:shadow-[0_0_8px_rgba(255,255,255,0.5)]"
      >
        Upgrade model
      </Link>
    </motion.header>
  );
}
