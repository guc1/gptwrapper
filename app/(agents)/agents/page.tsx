'use client';

import { AgentCard, type AgentCardProps } from '@/components/agents/agent-card';
import { useTranslation } from '@/lib/i18n';
import { SearchInput } from '@/components/agents/search-input';
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
    <div className="mx-auto max-w-[1280px] space-y-12 p-[clamp(1rem,4vw,3rem)]">
      <header className="top-bar">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className={openMobile ? 'backdrop-blur-[6px]' : ''}
        >
          <MenuIcon />
        </button>
      </header>

      <header className="hero">
        <h1>{t('aiAgentsTitle')}</h1>
        <p className="tagline">{t('aiAgentsSubtitle')}</p>
        <SearchInput placeholder={t('askAboutAgentsPlaceholder')} />
      </header>

      <section className="space-y-4">
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

      <section className="space-y-4">
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
