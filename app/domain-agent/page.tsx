'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/toast';
import { useTranslation } from '@/lib/i18n';
import {
  createSession,
  updateSettings,
  sendAnswers,
  generateDomains,
} from '@/lib/domainClient';

interface Question {
  id: string;
  text: string;
}

export default function DomainAgentPage() {
  const t = useTranslation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initialBrief, setInitialBrief] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [domains, setDomains] = useState<string[]>([]);
  const [settings, setSettings] = useState({
    local_dev: false,
    creators: [] as string[],
    generation_count: 3,
    show_logs: false,
  });

  const [openSettings, setOpenSettings] = useState(false);

  async function start() {
    try {
      const res = await createSession(initialBrief);
      setSessionId(res.id);
      setQuestions(res.questions || []);
    } catch (err: any) {
      toast({ type: 'error', description: err.message || 'Error' });
    }
  }

  async function submitAnswers() {
    if (!sessionId) return;
    try {
      await updateSettings(sessionId, settings);
      const res = await sendAnswers(sessionId, { answers });
      setQuestions(res.questions || []);
      const gen = await generateDomains(sessionId);
      setDomains(gen.available || []);
    } catch (err: any) {
      toast({ type: 'error', description: err.message || 'Error' });
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      {!sessionId && (
        <div className="space-y-2">
          <Label htmlFor="brief">{t('domainBriefPrompt')}</Label>
          <Input
            id="brief"
            value={initialBrief}
            onChange={(e) => setInitialBrief(e.target.value)}
          />
          <div className="flex justify-between">
            <Dialog open={openSettings} onOpenChange={setOpenSettings}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline">
                  {t('settings')}
                </Button>
              </DialogTrigger>
              <DialogContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Mode</Label>
                  <Select
                    value={settings.local_dev ? 'local' : 'model'}
                    onValueChange={(v) =>
                      setSettings((s) => ({ ...s, local_dev: v === 'local' }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">local_dev</SelectItem>
                      <SelectItem value="model">model</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Generation Count</Label>
                  <Input
                    type="number"
                    value={settings.generation_count}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        generation_count: Number.parseInt(e.target.value, 10),
                      }))
                    }
                  />
                </div>
              </DialogContent>
            </Dialog>
            <Button type="button" onClick={start} disabled={!initialBrief.trim()}>
              {t('continue')}
            </Button>
          </div>
        </div>
      )}

      {sessionId && questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="space-y-2">
              <Label htmlFor={q.id}>{q.text}</Label>
              <Input
                id={q.id}
                value={answers[q.id] || ''}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                }
              />
            </div>
          ))}
          <Button type="button" onClick={submitAnswers}>
            {t('send')}
          </Button>
        </div>
      )}

      {sessionId && questions.length === 0 && domains.length > 0 && (
        <div className="space-y-2">
          {domains.map((d) => (
            <div key={d} className="border rounded p-2">{d}</div>
          ))}
        </div>
      )}
    </div>
  );
}
