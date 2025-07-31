'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { toast } from '@/components/toast';
import { useTranslation } from '@/lib/i18n';
import type { DomainSettings } from '@/lib/domainClient';
import * as api from '@/lib/domainClient';
import { useSession } from 'next-auth/react';
import { useSWRConfig } from 'swr';
import DomainAgentHeader from '@/components/domainagent-header';
import '../../themes/assistenten.css';
import { motion } from 'framer-motion';
import { LoaderIcon } from '@/components/icons';
import clsx from 'clsx';

interface Question { id: string; text: string; }

const defaultSettings: DomainSettings = {
  local_dev: false,
  creators: ['A'],
  generation_count: 1,
  show_logs: false,
};

export default function DomainAgentPage() {
  const t = useTranslation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [brief, setBrief] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string,string>>({});
  const [domains, setDomains] = useState<string[]>([]);
  const [history, setHistory] = useState<{ available: string[]; taken: string[] }>({
    available: [],
    taken: [],
  });
  const [feedback, setFeedback] = useState<Record<string,{liked:boolean; comment:string}>>({});
  const [phase, setPhase] = useState<'start'|'questions'|'suggestions'|'done'>('start');
  const [settings, setSettings] = useState<DomainSettings>(defaultSettings);
  const [openSettings, setOpenSettings] = useState(false);
  const [openLogs, setOpenLogs] = useState(false);
  const [logs, setLogs] = useState<Array<{ id: string; type: string; request: any; response?: any }>>([]);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const { mutate } = useSWRConfig();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('domainAgentState');
      if (stored) {
        const s = JSON.parse(stored);
        setSessionId(s.sessionId ?? null);
        setChatId(s.chatId ?? null);
        setBrief(s.brief ?? '');
        setQuestions(s.questions ?? []);
        setAnswers(s.answers ?? {});
        setDomains(s.domains ?? []);
        setFeedback(s.feedback ?? {});
        setPhase(s.phase ?? 'start');
        setSettings(s.settings ?? defaultSettings);
        setHistory(s.history ?? { available: [], taken: [] });
        setLogs(s.logs ?? []);
      }
    } catch {
      // ignore parsing errors
    }
  }, []);

  useEffect(() => {
    if (sessionId && openSettings) {
      api.getSettings(sessionId).then(setSettings).catch(() => {});
    }
  }, [sessionId, openSettings]);

  useEffect(() => {
    const state = {
      sessionId,
      chatId,
      brief,
      questions,
      answers,
      domains,
      feedback,
      phase,
      settings,
      history,
      logs,
    };
    try {
      localStorage.setItem('domainAgentState', JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [sessionId, chatId, brief, questions, answers, domains, feedback, phase, settings, history, logs]);

  async function start() {
    setLoading(true);
    try {
      const res = await api.startSession(brief);
      setLogs((l) => [
        ...l,
        { id: crypto.randomUUID(), type: 'createSession', request: { initial_brief: brief }, response: res },
      ]);
      setSessionId(res.session_id);
      setChatId(res.chat_id);
      setQuestions(res.questions);
      setAnswers({});
      setDomains([]);
      setFeedback({});
      setHistory({ available: [], taken: [] });
      await api.saveSettings(res.session_id, settings);
      setLogs((l) => [...l, { id: crypto.randomUUID(), type: 'saveSettings', request: settings }]);
      setPhase('questions');
      if (session?.user?.id) {
        mutate(`/api/message-status?userId=${session.user.id}`);
      }
    } catch (err:any) {
      toast({ type: 'error', description: err.message });
    }
    setLoading(false);
  }

  async function submitAnswers() {
    if (!sessionId) return;
    setLoading(true);
    try {
      const ansRes = await api.sendAnswers(sessionId, { answers });
      setLogs((l) => [
        ...l,
        { id: crypto.randomUUID(), type: 'sendAnswers', request: { answers }, response: ansRes },
      ]);
      const gen = await api.generate(sessionId);
      setLogs((l) => [...l, { id: crypto.randomUUID(), type: 'generate', request: {}, response: gen }]);
      setDomains(gen.available);
      setHistory((h) => ({
        available: [...h.available, ...gen.available],
        taken: [...h.taken, ...gen.taken],
      }));
      setPhase('suggestions');
    } catch (err:any) {
      toast({ type: 'error', description: err.message });
    }
    setLoading(false);
  }

  async function sendFeedback(continueLoop: boolean) {
    if (!sessionId) return;
    setLoading(true);
    try {
      const liked: Record<string,string> = {};
      const disliked: Record<string,string> = {};
      Object.entries(feedback).forEach(([d, f]) => {
        if (f.liked) liked[d] = f.comment;
        else disliked[d] = f.comment;
      });
      if (continueLoop) {
        const fb = await api.sendFeedback(sessionId, { liked, disliked });
        if (chatId) {
          await api.logContinue(chatId);
          if (session?.user?.id) {
            mutate(`/api/message-status?userId=${session.user.id}`);
          }
        }
        setLogs((l) => [
          ...l,
          { id: crypto.randomUUID(), type: 'sendFeedback', request: { liked, disliked }, response: fb },
        ]);
        setQuestions(fb.questions);
        setFeedback({});
        setDomains([]);
        setPhase('questions');
      } else {
        const fb = await api.sendFeedback(sessionId, { liked, disliked });
        setLogs((l) => [
          ...l,
          { id: crypto.randomUUID(), type: 'sendFeedback', request: { liked, disliked }, response: fb },
        ]);
        setPhase('done');
      }
    } catch (err:any) {
      toast({ type: 'error', description: err.message });
    }
    setLoading(false);
  }

  function updateAnswer(id: string, value: string) {
    setAnswers((a) => ({ ...a, [id]: value }));
  }

  function updateFeedback(domain: string, liked: boolean) {
    setFeedback((f) => ({ ...f, [domain]: { liked, comment: f[domain]?.comment || '' } }));
  }

  function updateComment(domain: string, comment: string) {
    setFeedback((f) => ({ ...f, [domain]: { liked: f[domain]?.liked || false, comment } }));
  }

  return (
    <>
      <DomainAgentHeader
        onOpenSettings={() => setOpenSettings(true)}
        onOpenLogs={() => setOpenLogs(true)}
        showLogs={settings.show_logs}
        overlayOpen={openSettings || openLogs}
        history={history}
      />
      <div className="mx-auto max-w-2xl p-4 space-y-6">
      <Sheet open={openSettings} onOpenChange={setOpenSettings}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t('settings')}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={settings.local_dev} onChange={(e)=>setSettings({...settings, local_dev:e.target.checked})} />
              {t('domainSettingsLocalDev')}
            </label>
            <div>
              <div className="mb-2">{t('domainSettingsCreators')}</div>
              {['A','B','C'].map((c) => (
                <label key={c} className="mr-3 inline-flex items-center gap-1">
                  <input type="checkbox" checked={settings.creators.includes(c)} onChange={(e)=>{
                    setSettings((s)=>{
                      const set = new Set(s.creators);
                      if(e.target.checked) set.add(c); else set.delete(c);
                      return { ...s, creators: Array.from(set) };
                    });
                  }} /> {c}
                </label>
              ))}
            </div>
            <label htmlFor="gen-count" className="flex flex-col gap-1">
              {t('domainSettingsGenerationCount')}
              <Input id="gen-count" type="number" value={settings.generation_count} onChange={(e)=>setSettings({...settings, generation_count:Number(e.target.value)})} />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={settings.show_logs} onChange={(e)=>setSettings({...settings, show_logs:e.target.checked})} />
              {t('domainSettingsShowLogs')}
            </label>
            {sessionId && (
              <Button onClick={() => api.saveSettings(sessionId, settings).catch(err=>toast({type:'error',description:err.message}))}>{t('apply')}</Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {settings.show_logs && (
        <Sheet open={openLogs} onOpenChange={setOpenLogs}>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>{t('logs')}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4 overflow-y-auto pr-2 h-full">
              {logs.map((log) => (
                <div key={log.id} className="border rounded p-2 text-xs space-y-1">
                  <div className="font-semibold">{log.type}</div>
                  <pre className="whitespace-pre-wrap break-all">
                    {JSON.stringify(log.request, null, 2)}
                  </pre>
                  {log.response && (
                    <pre className="whitespace-pre-wrap break-all">
                      {JSON.stringify(log.response, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-sm text-muted-foreground">{t('noLogs')}</div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {phase === 'start' && (
        <div className="space-y-4 text-center mt-10">
          <div className="text-lg font-semibold">{t('domainAgentPrompt')}</div>
          <Textarea
            className="rounded-xl bg-white/10 backdrop-blur-md border border-white/30 shadow-lg"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
          />
          <Button onClick={start} className="mt-2 h-11 px-6" disabled={loading}>
            {loading && (
              <span className="animate-spin inline-block mr-2">
                <LoaderIcon />
              </span>
            )}
            {t('send')}
          </Button>
        </div>
      )}

      {phase === 'questions' && (
        <motion.div className="space-y-4" initial="hidden" animate="show" variants={{hidden:{},show:{transition:{staggerChildren:0.1}}}}>
          {questions.map((q) => {
            const inputId = `q-${q.id}`;
            return (
              <motion.label
                key={q.id}
                htmlFor={inputId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="flex flex-col gap-1 p-4 rounded-xl border border-white/30 bg-white/10 backdrop-blur-md shadow"
              >
                {q.text}
                <Input
                  id={inputId}
                  value={answers[q.id] || ''}
                  onChange={(e) => updateAnswer(q.id, e.target.value)}
                />
              </motion.label>
            );
          })}
          <Button onClick={submitAnswers} disabled={loading} className="h-11 px-6">
            {loading && (
              <span className="animate-spin inline-block mr-2">
                <LoaderIcon />
              </span>
            )}
            {t('send')}
          </Button>
        </motion.div>
      )}

      {phase === 'suggestions' && (
        <div className="space-y-4">
          {domains.map((d) => (
            <motion.div
              key={d}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 border rounded p-2 bg-white/10 backdrop-blur-md shadow"
            >
              <button
                type="button"
                onClick={() => updateFeedback(d, true)}
                className={
                  clsx(
                    'p-1 rounded-full',
                    feedback[d]?.liked
                      ? 'text-green-600 ring-2 ring-green-500'
                      : 'text-muted-foreground hover:bg-white/20'
                  )
                }
              >
                👍
              </button>
              <button
                type="button"
                onClick={() => updateFeedback(d, false)}
                className={
                  clsx(
                    'p-1 rounded-full',
                    feedback[d] && !feedback[d].liked
                      ? 'text-red-600 ring-2 ring-red-500'
                      : 'text-muted-foreground hover:bg-white/20'
                  )
                }
              >
                👎
              </button>
              <span className="flex-1 text-center">{d}</span>
              <Input
                placeholder=""
                value={feedback[d]?.comment || ''}
                onChange={(e) => updateComment(d, e.target.value)}
              />
            </motion.div>
          ))}
          <div className="flex gap-2">
            <Button onClick={() => sendFeedback(true)} disabled={loading} className="h-10 px-6">
              {loading && (
                <span className="animate-spin inline-block mr-2">
                  <LoaderIcon />
                </span>
              )}
              {t('continue')}
            </Button>
            <Button variant="outline" onClick={() => sendFeedback(false)} disabled={loading} className="h-10 px-6">
              {t('stop')}
            </Button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="space-y-2">
          <div>{t('done')}</div>
          <div>
            <strong>{t('history')}:</strong>{' '}
            {history.available.length > 0 && (
              <span>
                {t('domainHistoryAvailable')}: {history.available.join(', ')}{' '}
              </span>
            )}
            {history.taken.length > 0 && (
              <span>
                {history.available.length > 0 ? '| ' : ''}
                {t('domainHistoryTaken')}: {history.taken.join(', ')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
