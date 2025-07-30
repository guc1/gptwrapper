export interface DomainSettings {
  local_dev: boolean;
  creators: string[];
  generation_count: number;
  show_logs: boolean;
}

interface Question {
  id: string;
  text: string;
}

// Calls are proxied through an internal Next.js API route to avoid CORS issues
const API_URL = '/domainagent/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  if (!res.ok) {
    let msg = 'Request failed';
    try {
      const data = await res.json();
      msg = data.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function createSession(initialBrief: string): Promise<{ session_id: string; questions: Question[] }>
{
  return request('/sessions', {
    method: 'POST',
    body: JSON.stringify({ initial_brief: initialBrief }),
  });
}

export async function getSettings(sessionId: string): Promise<DomainSettings> {
  return request(`/sessions/${sessionId}/settings`);
}

export async function saveSettings(sessionId: string, settings: DomainSettings): Promise<void> {
  await request(`/sessions/${sessionId}/settings`, {
    method: 'POST',
    body: JSON.stringify(settings),
  });
}

export async function sendAnswers(sessionId: string, body: { answers: Record<string,string>; liked_domains?: {}; disliked_domains?: {}; }): Promise<{ prompt: string; questions: Question[] }>
{
  return request(`/sessions/${sessionId}/answers`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function generate(sessionId: string): Promise<{ available: string[]; taken: string[]; history: any }>
{
  return request(`/sessions/${sessionId}/generate`, { method: 'POST' });
}

export async function sendFeedback(sessionId: string, body: { liked: Record<string,string>; disliked: Record<string,string>; }): Promise<{ refined_brief: string; questions: Question[] }>
{
  return request(`/sessions/${sessionId}/feedback`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
