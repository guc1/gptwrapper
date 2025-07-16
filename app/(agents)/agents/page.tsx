'use client';

import { AgentCard, type AgentCardProps } from '@/components/agents/agent-card';
import { useTranslation } from '@/lib/i18n';
import { SearchInput } from '@/components/search-input';
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
      <header className="top-bar mb-4 flex items-center">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={t('toggleSidebar')}
          className={`md:hidden rounded-md p-2 ${openMobile ? 'backdrop-blur-[6px] bg-background/70' : ''}`}
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
      <style jsx>{`
        .hero {
          text-align: center;
          margin-top: 3rem;
          margin-bottom: 4rem;
        }
        .hero h1 {
          font-size: clamp(2.5rem, 5vw, 4rem);
          letter-spacing: -0.03em;
        }
        .hero .tagline {
          font-size: clamp(1rem, 1.2vw, 1.25rem);
          opacity: 0.8;
          max-width: 52ch;
          margin-inline: auto 2.5rem;
        }
        .hero .search {
          margin-top: 2.25rem;
        }
        section {
          margin-top: 4.5rem;
        }
        @media (max-width: 768px) {
          section {
            margin-top: 3rem;
          }
        }
      `}</style>
    </div>
  );
}
