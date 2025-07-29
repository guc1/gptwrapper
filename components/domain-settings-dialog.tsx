'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDomainSettings } from '@/hooks/use-domain-settings';
import { useTranslation } from '@/lib/i18n';

export function DomainSettingsDialog({ open, onOpenChange }:{ open:boolean; onOpenChange:(o:boolean)=>void }) {
  const { settings, setSettings } = useDomainSettings();
  const t = useTranslation();

  const toggleCreator = (c: string) => {
    setSettings((prev) => {
      const creators = prev.creators.includes(c)
        ? prev.creators.filter((x) => x !== c)
        : [...prev.creators, c];
      return { ...prev, creators };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('settings')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="mode" className="block mb-1">{t('modeLabel')}</label>
            <Select
              id="mode"
              value={settings.local_dev ? 'local' : 'model'}
              onValueChange={(v) => setSettings({ ...settings, local_dev: v === 'local' })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">{t('local')}</SelectItem>
                <SelectItem value="model">{t('model')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <span id="creator-label" className="block mb-1">
              {t('creators')}
            </span>
            <div className="flex gap-2" role="group" aria-labelledby="creator-label">
              {['A', 'B', 'C'].map((c) => (
                <Button
                  key={c}
                  type="button"
                  variant={settings.creators.includes(c) ? 'default' : 'outline'}
                  onClick={() => toggleCreator(c)}
                  className="px-3"
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="generation" className="block mb-1">
              {t('domainsPerAgent')}
            </label>
            <Input
              id="generation"
              type="number"
              min={1}
              value={settings.generation_count}
              onChange={(e) => setSettings({ ...settings, generation_count: Number(e.target.value) })}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
