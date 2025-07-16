'use client';

import { AgentCard, type AgentCardProps } from '@/components/agents/agent-card';
import { useTranslation } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AgentsPage() {
  const t = useTranslation();

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
      <header className="space-y-2">
        <h1 className="text-4xl font-bold">{t('aiAgentsTitle')}</h1>
        <p className="text-muted-foreground">{t('aiAgentsSubtitle')}</p>
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
        <h2 className="text-2xl font-semibold">{t('searchAgents')}</h2>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 opacity-70" />
          <Input className="h-14 rounded-[24px] pl-10 shadow-inner" placeholder={t('askAboutAgentsPlaceholder')} disabled />
        </div>
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
