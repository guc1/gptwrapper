'use client';

import { AgentCard } from '@/components/agents/agent-card';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AgentsPage() {
  const t = useTranslation();
  return (
    <div className="p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold">{t('aiAgentsTitle')}</h1>
        <p className="text-muted-foreground">{t('aiAgentsSubtitle')}</p>
      </header>

      <section className="space-y-2">
        <h2 className="text-2xl font-semibold">{t('recentlyUsed')}</h2>
        <div className="text-sm text-muted-foreground">
          {t('startUsingAgents')}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-2xl font-semibold">{t('searchAgents')}</h2>
        <div className="flex items-center gap-2">
          <Input disabled placeholder={t('askAboutAgentsPlaceholder')} />
          <Button disabled>{t('send')}</Button>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-2xl font-semibold">{t('recommended')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AgentCard name="LUNA" />
          <AgentCard name="MOGA" />
          <AgentCard name="RELA" />
        </div>
      </section>
    </div>
  );
}
