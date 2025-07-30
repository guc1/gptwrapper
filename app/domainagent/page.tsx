'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from '@/components/toast';
import { useTranslation } from '@/lib/i18n';
import type { DomainSettings } from '@/lib/domainClient';
import * as api from '@/lib/domainClient';
import { DomainAgentHeader } from '@/components/domainagent-header';
import { LoaderIcon, ThumbUpIcon, ThumbDownIcon } from '@/components/icons';
import { motion } from 'framer-motion';

interface Question { id: string; text: string; }

export default function DomainAgentPage() {
  const t = useTranslation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [brief, setBrief] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string,string>>({});
  const [domains, setDomains] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Record<string,{liked:boolean; comment:string}>>({});
  const [phase, setPhase] = useState<'start'|'questions'|'suggestions'|'done'>('start');
  const [settings, setSettings] = useState<DomainSettings>({
    local_dev: false,
    creators: ['A'],
    generation_count: 1,
    show_logs: false,
  });
  const [openSettings, setOpenSettings] = useState(false);
  const [openLogs, setOpenLogs] = useState(false);
  const [logs, setLogs] = useState<Array<{ id: string; type: string; request: any; response?: any }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionId && openSettings) {
      api.getSettings(sessionId).then(setSettings).catch(() => {});
    }
  }, [sessionId, openSettings]);

  async function start() {
    try {
      setLoading(true);
      const res = await api.createSession(brief);
      setLogs((l) => [
        ...l,
        { id: crypto.randomUUID(), type: 'createSession', request: { initial_brief: brief }, response: res },
      ]);
      setSessionId(res.session_id);
      setQuestions(res.questions);
      await api.saveSettings(res.session_id, settings);
      setLogs((l) => [...l, { id: crypto.randomUUID(), type: 'saveSettings', request: settings }]);
      setPhase('questions');
    } catch (err:any) {
      toast({ type: 'error', description: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswers() {
    if (!sessionId) return;
    try {
      setLoading(true);
      const ansRes = await api.sendAnswers(sessionId, { answers });
      setLogs((l) => [
        ...l,
        { id: crypto.randomUUID(), type: 'sendAnswers', request: { answers }, response: ansRes },
      ]);
      const gen = await api.generate(sessionId);
      setLogs((l) => [...l, { id: crypto.randomUUID(), type: 'generate', request: {}, response: gen }]);
      setDomains(gen.available);
      setPhase('suggestions');
    } catch (err:any) {
      toast({ type: 'error', description: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function sendFeedback(continueLoop: boolean) {
    if (!sessionId) return;
    try {
      setLoading(true);
      const liked: Record<string,string> = {};
      const disliked: Record<string,string> = {};
      Object.entries(feedback).forEach(([d, f]) => {
        if (f.liked) liked[d] = f.comment;
        else disliked[d] = f.comment;
      });
      if (continueLoop) {
        const fb = await api.sendFeedback(sessionId, { liked, disliked });
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
    } finally {
      setLoading(false);
    }
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
      />
      <div className="mx-auto max-w-2xl p-4 space-y-6">
      <Sheet open={openSettings} onOpenChange={setOpenSettings}>
        <SheetTrigger asChild>
          <Button variant="outline">{t('settings')}</Button>
        </SheetTrigger>
        <SheetContent className="p-6">
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
          <SheetTrigger asChild>
            <Button variant="outline">{t('logs')}</Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-6">
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
        <div className="space-y-4 text-center">
          <div className="text-lg font-medium">{t('domainAgentPrompt')}</div>
          <Textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            className="glassBubble w-full h-32 text-lg p-4"
          />
          <Button onClick={start} className="mt-2 frostedGlow-orangeDeep relative px-6">
            {loading ? (
              <span className="absolute inset-y-0 right-4 flex items-center animate-spin"><LoaderIcon /></span>
            ) : null}
            {t('send')}
          </Button>
        </div>
      )}

      {phase === 'questions' && (
        <div className="space-y-4">
          {questions.map((q, index) => {
            const inputId = `q-${q.id}`;
            return (
              <motion.label
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                key={q.id}
                htmlFor={inputId}
                className="flex flex-col gap-2 glassBubble p-4"
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
          <Button onClick={submitAnswers} className="relative">
            {loading ? (
              <span className="absolute inset-y-0 right-4 flex items-center animate-spin"><LoaderIcon /></span>
            ) : null}
            {t('send')}
          </Button>
        </div>
      )}

      {phase === 'suggestions' && (
        <div className="space-y-4">
          {domains.map((d)=>(
            <motion.div
              key={d}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 glassBubble p-3"
            >
              <button
                type="button"
                onClick={() => updateFeedback(d, true)}
                className={`glassIcon ${feedback[d]?.liked ? 'bg-green-600 text-white' : ''}`}
              >
                <ThumbUpIcon />
              </button>
              <button
                type="button"
                onClick={() => updateFeedback(d, false)}
                className={`glassIcon ${feedback[d] && !feedback[d]?.liked ? 'bg-red-600 text-white' : ''}`}
              >
                <ThumbDownIcon />
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
            <Button onClick={() => sendFeedback(true)} className="relative">
              {loading ? (
                <span className="absolute inset-y-0 right-4 flex items-center animate-spin"><LoaderIcon /></span>
              ) : null}
              {t('continue')}
            </Button>
            <Button variant="outline" onClick={() => sendFeedback(false)} className="relative">
              {loading ? (
                <span className="absolute inset-y-0 right-4 flex items-center animate-spin"><LoaderIcon /></span>
              ) : null}
              {t('stop')}
            </Button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div>{t('done')}</div>
      )}
      </div>
    </>
  );
}
