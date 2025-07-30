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

  useEffect(() => {
    if (sessionId && openSettings) {
      api.getSettings(sessionId).then(setSettings).catch(() => {});
    }
  }, [sessionId, openSettings]);

  async function start() {
    try {
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
    }
  }

  async function submitAnswers() {
    if (!sessionId) return;
    try {
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
    }
  }

  async function sendFeedback(continueLoop: boolean) {
    if (!sessionId) return;
    try {
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
    <div className="mx-auto max-w-2xl p-4 space-y-6">
      <Sheet open={openSettings} onOpenChange={setOpenSettings}>
        <SheetTrigger asChild>
          <Button variant="outline">{t('settings')}</Button>
        </SheetTrigger>
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
          <SheetTrigger asChild>
            <Button variant="outline">{t('logs')}</Button>
          </SheetTrigger>
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
        <div className="space-y-4">
          <div>{t('domainAgentPrompt')}</div>
          <Textarea value={brief} onChange={(e)=>setBrief(e.target.value)} />
          <Button onClick={start} className="mt-2">{t('send')}</Button>
        </div>
      )}

      {phase === 'questions' && (
        <div className="space-y-4">
          {questions.map((q)=>{
            const inputId = `q-${q.id}`;
            return (
              <label key={q.id} htmlFor={inputId} className="flex flex-col gap-1">
                {q.text}
                <Input id={inputId} value={answers[q.id]||''} onChange={(e)=>updateAnswer(q.id,e.target.value)} />
              </label>
            );
          })}
          <Button onClick={submitAnswers}>{t('send')}</Button>
        </div>
      )}

      {phase === 'suggestions' && (
        <div className="space-y-4">
          {domains.map((d)=>(
            <div key={d} className="flex items-center gap-2 border rounded p-2">
              <button type="button" onClick={()=>updateFeedback(d,true)} className={feedback[d]?.liked?'text-green-600':''}>👍</button>
              <button type="button" onClick={()=>updateFeedback(d,false)} className={!feedback[d] || feedback[d]?.liked ? '':'text-red-600'}>👎</button>
              <span className="flex-1 text-center">{d}</span>
              <Input placeholder="" value={feedback[d]?.comment||''} onChange={(e)=>updateComment(d,e.target.value)} />
            </div>
          ))}
          <div className="flex gap-2">
            <Button onClick={()=>sendFeedback(true)}>{t('continue')}</Button>
            <Button variant="outline" onClick={()=>sendFeedback(false)}>{t('stop')}</Button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div>{t('done')}</div>
      )}
    </div>
  );
}
