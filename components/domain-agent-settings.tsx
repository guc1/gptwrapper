'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDomainAgentSettings } from '@/hooks/use-domain-agent-settings';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';

export function DomainAgentSettings({ trigger }: { trigger: React.ReactNode }) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const { local, creators, generationCount, setLocal, toggleCreator, setGenerationCount } =
    useDomainAgentSettings();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>{trigger}</Sheet.Trigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('settings')}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-2">
            <input
              id="local"
              type="checkbox"
              checked={local}
              onChange={(e) => setLocal(e.target.checked)}
            />
            <label htmlFor="local" className="text-sm">
              {t('localMode')}
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="model"
              type="checkbox"
              checked={!local}
              onChange={(e) => setLocal(!e.target.checked)}
            />
            <label htmlFor="model" className="text-sm">
              {t('modelMode')}
            </label>
          </div>
          <div className="space-y-2">
            <p className="text-sm">{t('selectCreators')}</p>
            <div className="flex gap-2">
              {(['A','B','C'] as const).map((c) => (
                <Button
                  key={c}
                  type="button"
                  variant={creators.includes(c) ? 'default' : 'outline'}
                  onClick={() => toggleCreator(c)}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="count" className="text-sm">
              {t('generationCount')}
            </label>
            <Input
              id="count"
              type="number"
              min={1}
              value={generationCount}
              onChange={(e) => setGenerationCount(Number(e.target.value))}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
