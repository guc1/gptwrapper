'use client';

import { AgentCard, type AgentCardProps } from '@/components/agents/agent-card';
import { useTranslation } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { MenuIcon } from '@/components/icons';
import { useSidebar } from '@/components/ui/sidebar';
import { motion } from 'framer-motion';

export default function AgentsPage() {
  const t = useTranslation();
  const { toggleSidebar, openMobile } = useSidebar();

  const recentlyUsed: AgentCardProps[] = [
    { name: 'Luna', description: 'Creative writing assistant', avatar: 'https://avatar.vercel.sh/luna' },
    { name: 'Moga', description: 'Math tutor bot', avatar: 'https://avatar.vercel.sh/moga' },
  ];

  const recommended: AgentCardProps[] = [
    { name: 'Rela', description: 'Relationship advice', avatar: 'https://avatar.vercel.sh/rela' },
    { name: 'Echo', description: 'Quick Q&A', avatar: 'https://avatar.vercel.sh/echo' },
    { name: 'Beta', description: 'Beta features explorer', avatar: 'https://avatar.vercel.sh/beta' },
  ];

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
  };

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,4vw,3rem)]">
      <header className="top-bar sticky top-0 z-20 flex items-center gap-2 border-b bg-background/70 px-2 py-2">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={t('toggleSidebar')}
          className={openMobile ? 'backdrop-blur-[6px] p-2 rounded-md' : 'p-2 rounded-md'}
        >
          <MenuIcon />
        </button>
      </header>
      <div className="hero mt-12 mb-16 text-center">
        <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-bold tracking-[-0.03em]">
          {t('aiAgentsTitle')}
        </h1>
        <p className="tagline mx-auto max-w-[52ch] opacity-80 text-[clamp(1rem,1.2vw,1.25rem)]">
          {t('aiAgentsSubtitle')}
        </p>
        <div className="search mt-9 relative mx-auto max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 opacity-70" />
          <Input
            className="h-14 rounded-[24px] pl-10 shadow-inner"
            placeholder={t('askAboutAgentsPlaceholder')}
            disabled
          />
        </div>
      </div>

      <section className="space-y-4 mt-12 md:mt-[4.5rem]">
        <h2 className="text-2xl font-semibold">{t('recentlyUsed')}</h2>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-4 recent md:grid-cols-2"
        >
          {recentlyUsed.map((agent) => (
            <AgentCard key={agent.name} {...agent} />
          ))}
        </motion.div>
      </section>
      <section className="space-y-4 mt-12 md:mt-[4.5rem]">
        <h2 className="text-2xl font-semibold">{t('recommended')}</h2>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-4 recommended"
        >
          {recommended.map((agent) => (
            <AgentCard key={agent.name} {...agent} />
          ))}
        </motion.div>
      </section>
    </div>
  );
}
