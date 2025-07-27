'use client';

import { AgentCard } from '@/components/agents/agent-card';
import { useTranslation } from '@/lib/i18n';
import { SearchInput } from '@/components/search-input';
import AssistentenHeader from '@/components/assistenten-header';
import '../../../themes/assistenten.css';
import { motion } from 'framer-motion';
import { agents } from '@/lib/agents';

export default function AssistentenPage() {
  const t = useTranslation();

  const recentlyUsed = agents.slice(0, 2);
  const recommended = agents.slice(2);

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
  };

  return (
    <>
      <AssistentenHeader />
      <div className="mx-auto max-w-[1280px] px-[clamp(1rem,4vw,3rem)] pb-[clamp(1rem,4vw,3rem)]">
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
            <AgentCard key={agent.id} agent={agent} />
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
            <AgentCard key={agent.id} agent={agent} />
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
          font-size: clamp(2.75rem, 5vw, 4.25rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          background: linear-gradient(90deg,#FFB98B 0%,#FF9FCE 50%,#FFF1A8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shift 8s linear infinite;
        }
        .hero h1:hover {
          font-variation-settings: "wght" 950, "slnt" -10;
          transition: .25s cubic-bezier(.4,0,.2,1);
        }
        @keyframes shift {
          to { background-position: 200% 0; }
        }
        .hero .tagline {
          font-size: clamp(1rem, 1.2vw, 1.25rem);
          opacity: 0.8;
          max-width: 52ch;
          margin-inline: auto 2.5rem;
        }
        .hero .search {
          margin-top: 0;
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
    </>
  );
}
