import { ChatSDKError } from './errors';

const API_URL = process.env.DOMAIN_API_URL || 'http://161.35.152.9:8000';
const API_KEY = process.env.DOMAIN_API_KEY || 'alksdfjoij09U908FHSFJoidhf9s8dfh9g87buvweuih87329UFI';

async function domainFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let message = 'Request failed';
    try {
      const err = await res.json();
      message = err.message || JSON.stringify(err);
    } catch {}
    throw new ChatSDKError('bad_request:api', message);
  }

  return res.json() as Promise<T>;
}

export async function createSession(initialBrief: string) {
  return domainFetch<{ id: string; questions: Array<{ id: string; text: string }> }>('/sessions', {
    method: 'POST',
    body: JSON.stringify({ initial_brief: initialBrief }),
  });
}

export async function getSettings(id: string) {
  return domainFetch(`/sessions/${id}/settings`);
}

export async function updateSettings(id: string, settings: any) {
  return domainFetch(`/sessions/${id}/settings`, {
    method: 'POST',
    body: JSON.stringify(settings),
  });
}

export async function sendAnswers(id: string, payload: any) {
  return domainFetch(`/sessions/${id}/answers`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function generateDomains(id: string) {
  return domainFetch(`/sessions/${id}/generate`, {
    method: 'POST',
  });
}

export async function sendFeedback(id: string, payload: any) {
  return domainFetch(`/sessions/${id}/feedback`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
