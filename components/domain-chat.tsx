'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDomainSettings } from '@/hooks/use-domain-settings';
import { useTranslation } from '@/lib/i18n';
import { DomainSettingsDialog } from './domain-settings-dialog';

interface Question {
  id: string;
  text: string;
}

export default function DomainChat() {
  const { settings } = useDomainSettings();
  const t = useTranslation();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stage, setStage] = useState<'intro' | 'questions' | 'domains' | 'feedback' | 'complete'>('intro');
  const [initialBrief, setInitialBrief] = useState('');
  const [questions, setQuestions] = useState<Array<Question>>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [available, setAvailable] = useState<Array<string>>([]);
  const [taken, setTaken] = useState<Array<string>>([]);
  const [feedback, setFeedback] = useState<Record<string, { like: boolean | null; reason: string }>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);

  async function startSession() {
    const res = await fetch('/api/domain/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initial_brief: initialBrief }),
    });
    const data = await res.json();
    setSessionId(data.session_id);
    setQuestions(data.questions || []);
    setStage('questions');
  }

  async function submitAnswers() {
    if (!sessionId) return;
    await fetch(`/api/domain/sessions/${sessionId}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    await fetch(`/api/domain/sessions/${sessionId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });
    const r = await fetch(`/api/domain/sessions/${sessionId}/generate`, { method: 'POST' });
    const d = await r.json();
    setAvailable(d.available || []);
    setTaken(d.taken || []);
    setStage('domains');
  }

  function toggleLike(domain: string, like: boolean) {
    setFeedback((prev) => {
      const entry = prev[domain] || { like: null, reason: '' };
      return { ...prev, [domain]: { ...entry, like } };
    });
  }

  async function submitFeedback() {
    if (!sessionId) return;
    const liked: Record<string, string> = {};
    const disliked: Record<string, string> = {};
    Object.entries(feedback).forEach(([name, info]) => {
      if (info.like === true) liked[name] = info.reason;
      else if (info.like === false) disliked[name] = info.reason;
    });
    const r = await fetch(`/api/domain/sessions/${sessionId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ liked, disliked }),
    });
    const d = await r.json();
    setQuestions(d.questions || []);
    setAnswers({});
    setFeedback({});
    setStage('questions');
  }

  if (stage === 'intro') {
    return (
      <div className="max-w-xl mx-auto p-4 space-y-4">
        <DomainSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        <p>{t('domainProjectPrompt')}</p>
        <Input value={initialBrief} onChange={(e) => setInitialBrief(e.target.value)} />
        <div className="flex gap-2">
          <Button onClick={startSession}>{t('send')}</Button>
          <Button variant="ghost" onClick={() => setSettingsOpen(true)}>
            {t('settings')}
          </Button>
        </div>
      </div>
    );
  }

  if (stage === 'questions') {
    return (
      <div className="max-w-xl mx-auto p-4 space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="border rounded-lg p-3 space-y-2">
            <div>{q.text}</div>
            <Input
              value={answers[q.id] || ''}
              onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
            />
          </div>
        ))}
        <Button onClick={submitAnswers}>{t('send')}</Button>
      </div>
    );
  }

  if (stage === 'domains') {
    return (
      <div className="max-w-xl mx-auto p-4 space-y-4">
        <h2 className="text-xl font-semibold">{t('domainSuggested')}</h2>
        {available.map((d) => (
          <div key={d} className="border rounded p-2">
            {d}
          </div>
        ))}
        {taken.length > 0 && <div className="text-sm opacity-60">{taken.join(', ')}</div>}
        <div className="flex gap-2">
          <Button onClick={() => setStage('feedback')}>{t('continue')}</Button>
          <Button variant="ghost" onClick={() => setStage('complete')}>
            {t('cancel')}
          </Button>
        </div>
      </div>
    );
  }

  if (stage === 'feedback') {
    return (
      <div className="max-w-xl mx-auto p-4 space-y-4">
        {available.map((domain) => {
          const item = feedback[domain] || { like: null, reason: '' };
          return (
            <div key={domain} className="flex items-center gap-2 border rounded p-2">
              <Button
                type="button"
                variant={item.like === true ? 'default' : 'outline'}
                onClick={() => toggleLike(domain, true)}
              >
                👍
              </Button>
              <Button
                type="button"
                variant={item.like === false ? 'default' : 'outline'}
                onClick={() => toggleLike(domain, false)}
              >
                👎
              </Button>
              <span className="flex-1 px-2">{domain}</span>
              <Input
                className="max-w-[10rem]"
                placeholder={t('reasonPlaceholder')}
                value={item.reason}
                onChange={(e) =>
                  setFeedback({ ...feedback, [domain]: { ...item, reason: e.target.value } })
                }
              />
            </div>
          );
        })}
        <Button onClick={submitFeedback}>{t('send')}</Button>
      </div>
    );
  }

  return <div className="p-4">{t('conversationComplete')}</div>;
}
