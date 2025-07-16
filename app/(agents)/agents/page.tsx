'use client';

import { AgentCard } from '@/components/agents/agent-card';
import { useTranslation } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { useSidebar } from '@/components/ui/sidebar';

const RECENT = ['LUNA', 'MOGA'];
const RECOMMENDED = ['LUNA', 'MOGA', 'RELA'];

export default function AgentsPage() {
  const t = useTranslation();
  useSidebar();
  return (
    <div className="max-w-[1280px] mx-auto p-[clamp(1rem,4vw,3rem)] space-y-8">
      <Input
        disabled
        placeholder={t('askAboutAgentsPlaceholder')}
        className="rounded-[24px] h-14 shadow-inner"
      />
      <header className="space-y-2 text-center">
        <h1 className="text-4xl font-bold">{t('aiAgentsTitle')}</h1>
        <p className="text-muted-foreground">{t('aiAgentsSubtitle')}</p>
      </header>

      <section className="space-y-2">
        <h2 className="text-2xl font-semibold">{t('recentlyUsed')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {RECENT.map((name) => (
            <AgentCard key={name} name={name} />
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-2xl font-semibold">{t('recommended')}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {RECOMMENDED.map((name) => (
            <AgentCard key={name} name={name} />
          ))}
        </div>
      </section>
    </div>
  );
}
