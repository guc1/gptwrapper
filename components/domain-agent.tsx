'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';
import {
  createSession,
  getSettings,
  saveSettings,
  sendAnswers,
  generateDomains,
  sendFeedback,
  type DomainSettings,
} from '@/lib/domainClient';
import { ThumbUpIcon, ThumbDownIcon } from '@/components/icons';
import { toast } from './toast';

export function DomainAgent() {
  const t = useTranslation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initial, setInitial] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [domains, setDomains] = useState<string[]>([]);
  const [liked, setLiked] = useState<Record<string, string>>({});
  const [disliked, setDisliked] = useState<Record<string, string>>({});
  const [settings, setSettingsState] = useState<DomainSettings>({
    local_dev: false,
    creators: [],
    generation_count: 2,
    show_logs: false,
  });
  const [openSettings, setOpenSettings] = useState(false);

  async function loadSettings(id: string) {
    try {
      const data = await getSettings(id);
      setSettingsState(data);
    } catch (err) {
      toast({ type: 'error', description: (err as Error).message });
    }
  }

  async function handleInitialSend() {
    try {
      const { id } = await createSession(initial);
      setSessionId(id);
      await loadSettings(id);
      const res = await sendAnswers(id, {
        answers: { brief: initial },
      });
      setQuestions(res.questions);
    } catch (err) {
      toast({ type: 'error', description: (err as Error).message });
    }
  }

  async function handleAnswerSend() {
    if (!sessionId) return;
    try {
      const res = await sendAnswers(sessionId, { answers });
      setQuestions([]);
      setAnswers({});
      const gen = await generateDomains(sessionId);
      setDomains(gen.available);
    } catch (err) {
      toast({ type: 'error', description: (err as Error).message });
    }
  }

  async function handleContinue() {
    if (!sessionId) return;
    try {
      const res = await sendFeedback(sessionId, { liked, disliked });
      setQuestions(res.questions);
      setDomains([]);
      setLiked({});
      setDisliked({});
    } catch (err) {
      toast({ type: 'error', description: (err as Error).message });
    }
  }

  function toggleLike(name: string) {
    setLiked((p) => {
      const copy = { ...p };
      if (copy[name]) delete copy[name];
      else copy[name] = '';
      return copy;
    });
    setDisliked((p) => {
      const copy = { ...p };
      delete copy[name];
      return copy;
    });
  }

  function toggleDislike(name: string) {
    setDisliked((p) => {
      const copy = { ...p };
      if (copy[name]) delete copy[name];
      else copy[name] = '';
      return copy;
    });
    setLiked((p) => {
      const copy = { ...p };
      delete copy[name];
      return copy;
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t('domainAgentDescription')}</h2>
        <Button variant="secondary" onClick={() => setOpenSettings(true)}>
          {t('settings')}
        </Button>
      </div>
      {!sessionId && (
        <div className="space-y-2">
          <p>{t('domainDescribePrompt')}</p>
          <Input value={initial} onChange={(e) => setInitial(e.target.value)} />
          <Button onClick={handleInitialSend}>{t('send')}</Button>
        </div>
      )}
      {sessionId && questions && questions.length > 0 && (
        <div className="space-y-2">
          {questions.map((q) => (
            <div key={q} className="space-y-1">
              <Label>{q}</Label>
              <Input
                value={answers[q] ?? ''}
                onChange={(e) =>
                  setAnswers({ ...answers, [q]: e.target.value })
                }
              />
            </div>
          ))}
          <Button onClick={handleAnswerSend}>{t('send')}</Button>
        </div>
      )}
      {sessionId && domains.length > 0 && (
        <div className="space-y-4">
          {domains.map((d) => (
            <div
              key={d}
              className="flex items-center gap-2 border rounded-md p-2"
            >
              <button
                type="button"
                onClick={() => toggleLike(d)}
                aria-label="like"
                className={liked[d] ? 'text-green-600' : 'text-muted-foreground'}
              >
                <ThumbUpIcon />
              </button>
              <button
                type="button"
                onClick={() => toggleDislike(d)}
                aria-label="dislike"
                className={
                  disliked[d] ? 'text-red-600' : 'text-muted-foreground'
                }
              >
                <ThumbDownIcon />
              </button>
              <span className="flex-1 text-center">{d}</span>
              <Input
                placeholder="Feedback"
                value={liked[d] ?? disliked[d] ?? ''}
                onChange={(e) => {
                  if (liked[d] !== undefined) {
                    setLiked({ ...liked, [d]: e.target.value });
                  } else if (disliked[d] !== undefined) {
                    setDisliked({ ...disliked, [d]: e.target.value });
                  }
                }}
              />
            </div>
          ))}
          <div className="flex gap-2">
            <Button onClick={handleContinue}>{t('continue')}</Button>
            <Button variant="ghost" onClick={() => setDomains([])}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      )}
      <Dialog open={openSettings} onOpenChange={setOpenSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="mode">Mode</Label>
              <select
                id="mode"
                value={settings.local_dev ? 'local' : 'model'}
                onChange={(e) =>
                  setSettingsState({
                    ...settings,
                    local_dev: e.target.value === 'local',
                  })
                }
                className="border rounded-md px-2 py-1"
              >
                <option value="local">local_dev</option>
                <option value="model">model</option>
              </select>
            </div>
            <div className="space-x-2">
              {['A', 'B', 'C'].map((c) => (
                <label key={c} className="space-x-1">
                  <input
                    type="checkbox"
                    checked={settings.creators.includes(c)}
                    onChange={(e) => {
                      const arr = settings.creators.slice();
                      if (e.target.checked) arr.push(c);
                      else {
                        const idx = arr.indexOf(c);
                        if (idx > -1) arr.splice(idx, 1);
                      }
                      setSettingsState({ ...settings, creators: arr });
                    }}
                  />
                  <span>{c}</span>
                </label>
              ))}
            </div>
            <div className="space-y-1">
              <Label htmlFor="count">Generation Count</Label>
              <Input
                id="count"
                type="number"
                value={settings.generation_count}
                onChange={(e) =>
                  setSettingsState({
                    ...settings,
                    generation_count: Number(e.target.value),
                  })
                }
              />
            </div>
            <label className="space-x-1 flex items-center">
              <input
                type="checkbox"
                checked={settings.show_logs}
                onChange={(e) =>
                  setSettingsState({ ...settings, show_logs: e.target.checked })
                }
              />
              <span>Show Logs</span>
            </label>
            <Button
              onClick={async () => {
                if (!sessionId) return;
                try {
                  await saveSettings(sessionId, settings);
                  setOpenSettings(false);
                } catch (err) {
                  toast({ type: 'error', description: (err as Error).message });
                }
              }}
            >
              {t('apply')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
