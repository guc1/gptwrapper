"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import type { DomainQuestion, DomainSettings } from "@/lib/domainClient";
import {
  createSession,
  getSettings,
  saveSettings,
  sendAnswers,
  generate,
  sendFeedback,
} from "@/lib/domainClient";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function DomainAgentPage() {
  const t = useTranslation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [questions, setQuestions] = useState<DomainQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [phase, setPhase] = useState<
    "start" | "questions" | "suggestions" | "done"
  >("start");
  const [settings, setSettings] = useState<DomainSettings>({
    local_dev: false,
    creators: [],
    generation_count: 1,
    show_logs: false,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  async function start() {
    const data = await createSession(input);
    setSessionId(data.session_id);
    setQuestions(data.questions);
    const s = await getSettings(data.session_id);
    setSettings(s);
    setPhase("questions");
  }

  function updateAnswer(id: string, value: string) {
    setAnswers({ ...answers, [id]: value });
  }

  async function submitAnswers() {
    if (!sessionId) return;
    await saveSettings(sessionId, settings);
    const out = await sendAnswers(sessionId, answers);
    const gen = await generate(sessionId);
    setSuggestions(gen.available);
    setQuestions(out.questions);
    setAnswers({});
    setPhase("suggestions");
  }

  async function continueFlow() {
    if (!sessionId) return;
    const liked: Record<string, string> = {};
    const disliked: Record<string, string> = {};
    suggestions.forEach((d) => {
      liked[d] = "";
    });
    const fb = await sendFeedback(sessionId, liked, disliked);
    setQuestions(fb.questions);
    setSuggestions([]);
    setPhase("questions");
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">DomainAgent</h1>
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Settings</Button>
          </DialogTrigger>
          <DialogContent>
            <h2 className="text-lg font-medium mb-2">Settings</h2>
            <label htmlFor="mode" className="block mb-2">
              Mode
            </label>
            <select
              id="mode"
              className="w-full border rounded p-2 mb-4"
              value={settings.local_dev ? "local" : "model"}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  local_dev: e.target.value === "local",
                })
              }
            >
              <option value="local">local_dev</option>
              <option value="model">model</option>
            </select>
            <div className="block mb-2">
              <span className="mr-2">Creators</span>
              <div className="flex gap-2 mt-1">
                {["A", "B", "C"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`px-2 py-1 rounded border ${settings.creators.includes(c) ? "bg-accent" : ""}`}
                    onClick={() =>
                      setSettings((s) => ({
                        ...s,
                        creators: s.creators.includes(c)
                          ? s.creators.filter((x) => x !== c)
                          : [...s.creators, c],
                      }))
                    }
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <label htmlFor="genCount" className="block mb-2">
              Generation Count
            </label>
            <Input
              id="genCount"
              type="number"
              value={settings.generation_count}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  generation_count: Number(e.target.value),
                })
              }
            />
            <div className="flex items-center gap-2 mt-2">
              <input
                id="showLogs"
                type="checkbox"
                checked={settings.show_logs}
                onChange={(e) =>
                  setSettings({ ...settings, show_logs: e.target.checked })
                }
              />
              <label htmlFor="showLogs">Show Logs</label>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {phase === "start" && (
        <div className="space-y-2">
          <p>{t("describeProject") ?? "Describe the business or project:"}</p>
          <Input value={input} onChange={(e) => setInput(e.target.value)} />
          <Button onClick={start}>Send</Button>
        </div>
      )}

      {phase === "questions" && (
        <div className="space-y-2">
          {questions.map((q) => (
            <Input
              key={q.id}
              placeholder={q.text}
              value={answers[q.id] || ""}
              onChange={(e) => updateAnswer(q.id, e.target.value)}
            />
          ))}
          <Button onClick={submitAnswers}>Send</Button>
        </div>
      )}

      {phase === "suggestions" && (
        <div className="space-y-4">
          {suggestions.map((d) => (
            <div key={d} className="border rounded p-2 flex justify-between">
              <span>{d}</span>
            </div>
          ))}
          <div className="flex gap-2">
            <Button onClick={continueFlow}>Continue</Button>
            <Button variant="outline" onClick={() => setPhase("done")}>
              Stop
            </Button>
          </div>
        </div>
      )}

      {phase === "done" && <p>Session complete.</p>}
    </div>
  );
}
