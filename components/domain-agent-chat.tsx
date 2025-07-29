'use client';

import { useState } from 'react';
import { useDomainAgentSettings } from '@/hooks/use-domain-agent-settings';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DomainAgentSettings } from './domain-agent-settings';

interface Question {
  id: string;
  text: string;
}

interface GenerateResult {
  available: string[];
  taken: string[];
}

export function DomainAgentChat() {
  const t = useTranslation();
  const settings = useDomainAgentSettings();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<'intro' | 'questions' | 'domains' | 'feedback' | 'done'>('intro');
  const [brief, setBrief] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [domains, setDomains] = useState<GenerateResult | null>(null);
  const [feedback, setFeedback] = useState<Record<string, { status: 'like' | 'dislike' | null; reason: string }>>({});

  async function start() {
    const res = await fetch('/api/domain/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initial_brief: brief }),
    });
    const data = await res.json();
    setSessionId(data.session_id);
    setQuestions(data.questions);
    await fetch(`/api/domain/sessions/${data.session_id}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        local_dev: settings.local,
        creators: settings.creators,
        generation_count: settings.generationCount,
        show_logs: false,
      }),
    });
    setPhase('questions');
  }

  async function sendAnswers() {
    if (!sessionId) return;
    const res = await fetch(`/api/domain/sessions/${sessionId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });
    await res.json();
    await generate();
  }

  async function generate() {
    if (!sessionId) return;
    const res = await fetch(`/api/domain/sessions/${sessionId}/generate`, {
      method: 'POST',
    });
    const data = await res.json();
    setDomains(data);
    const fb: Record<string, { status: 'like' | 'dislike' | null; reason: string }> = {};
    data.available.forEach((d: string) => {
      fb[d] = { status: null, reason: '' };
    });
    setFeedback(fb);
    setPhase('domains');
  }

  async function sendFeedback() {
    if (!sessionId) return;
    const liked: Record<string, string> = {};
    const disliked: Record<string, string> = {};
    Object.entries(feedback).forEach(([domain, entry]) => {
      if (entry.status === 'like') liked[domain] = entry.reason;
      if (entry.status === 'dislike') disliked[domain] = entry.reason;
    });
    const res = await fetch(`/api/domain/sessions/${sessionId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ liked, disliked }),
    });
    const data = await res.json();
    setQuestions(data.questions);
    setAnswers({});
    setDomains(null);
    setPhase('questions');
  }

  if (phase === 'intro') {
    return (
      <div className="p-4 space-y-4 max-w-xl mx-auto">
        <p>{t('describeBusiness')}</p>
        <Input value={brief} onChange={(e) => setBrief(e.target.value)} />
        <div className="flex gap-2">
          <DomainAgentSettings trigger={<Button type="button">{t('settings')}</Button>} />
          <Button onClick={start}>{t('send')}</Button>
        </div>
      </div>
    );
  }

  if (phase === 'questions') {
    return (
      <div className="p-4 space-y-4 max-w-xl mx-auto">
        {questions.map((q) => (
          <div key={q.id} className="space-y-2">
            <p>{q.text}</p>
            <Textarea
              value={answers[q.id] || ''}
              onChange={(e) =>
                setAnswers((s) => ({ ...s, [q.id]: e.target.value }))
              }
            />
          </div>
        ))}
        <Button onClick={sendAnswers}>{t('send')}</Button>
      </div>
    );
  }

  if (phase === 'domains' && domains) {
    return (
      <div className="p-4 space-y-4 max-w-xl mx-auto">
        <div>
          {domains.available.map((d) => (
            <div key={d} className="border px-3 py-2 rounded-md mb-2">
              {d}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setPhase('feedback')}>{t('continue')}</Button>
          <Button variant="secondary" onClick={() => setPhase('done')}>{t('cancel')}</Button>
        </div>
      </div>
    );
  }

  if (phase === 'feedback' && domains) {
    return (
      <div className="p-4 space-y-4 max-w-xl mx-auto">
        {domains.available.map((d) => (
          <div key={d} className="flex items-center gap-2 border p-2 rounded-md">
            <button
              type="button"
              className={`glassIcon ${feedback[d]?.status === 'like' ? 'text-green-500' : 'text-muted-foreground'}`}
              onClick={() =>
                setFeedback((f) => ({
                  ...f,
                  [d]: { ...f[d], status: f[d]?.status === 'like' ? null : 'like' },
                }))
              }
            >
              👍
            </button>
            <button
              type="button"
              className={`glassIcon ${feedback[d]?.status === 'dislike' ? 'text-red-500' : 'text-muted-foreground'}`}
              onClick={() =>
                setFeedback((f) => ({
                  ...f,
                  [d]: { ...f[d], status: f[d]?.status === 'dislike' ? null : 'dislike' },
                }))
              }
            >
              👎
            </button>
            <span className="flex-1">{d}</span>
            <Input
              placeholder={t('feedbackPlaceholder')}
              value={feedback[d]?.reason || ''}
              onChange={(e) =>
                setFeedback((f) => ({
                  ...f,
                  [d]: { ...f[d], reason: e.target.value },
                }))
              }
            />
          </div>
        ))}
        <Button onClick={sendFeedback}>{t('send')}</Button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="p-4 space-y-4 max-w-xl mx-auto">
        <p>{t('chatEnded')}</p>
      </div>
    );
  }

  return null;
}
