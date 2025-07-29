export interface DomainSettings {
  local_dev: boolean;
  creators: string[];
  generation_count: number;
  show_logs: boolean;
}

const API_URL =
  process.env.NEXT_PUBLIC_DOMAIN_API_URL ?? 'http://161.35.152.9:8000';
const API_KEY =
  process.env.NEXT_PUBLIC_DOMAIN_API_KEY ??
  'alksdfjoij09U908FHSFJoidhf9s8dfh9g87buvweuih87329UFI';

function buildInit(method: string, body?: unknown): RequestInit {
  return {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  };
}

async function request<T>(path: string, init: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || res.statusText);
  }
  return (await res.json()) as T;
}

export function createSession(initial_brief: string) {
  return request<{ id: string }>(
    '/sessions',
    buildInit('POST', { initial_brief }),
  );
}

export function getSettings(id: string) {
  return request<DomainSettings>(
    `/sessions/${id}/settings`,
    buildInit('GET'),
  );
}

export function saveSettings(id: string, settings: DomainSettings) {
  return request<void>(
    `/sessions/${id}/settings`,
    buildInit('POST', settings),
  );
}

export function sendAnswers(
  id: string,
  payload: {
    answers: Record<string, string>;
    liked_domains?: Record<string, string>;
    disliked_domains?: Record<string, string>;
  },
) {
  return request<{ questions: string[] }>(
    `/sessions/${id}/answers`,
    buildInit('POST', payload),
  );
}

export function generateDomains(id: string) {
  return request<{
    available: string[];
    taken: string[];
    history: unknown;
  }>(`/sessions/${id}/generate`, buildInit('POST'));
}

export function sendFeedback(
  id: string,
  payload: { liked: Record<string, string>; disliked: Record<string, string> },
) {
  return request<{ refined_brief: string; questions: string[] }>(
    `/sessions/${id}/feedback`,
    buildInit('POST', payload),
  );
}
