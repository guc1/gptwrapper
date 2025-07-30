export interface DomainSettings {
  local_dev: boolean;
  creators: string[];
  generation_count: number;
  show_logs: boolean;
}

export interface DomainQuestion {
  id: string;
  text: string;
}

const DOMAIN_API_URL = process.env.DOMAIN_API_URL;
const DOMAIN_API_KEY = process.env.DOMAIN_API_KEY;

async function request<T>(path: string, options?: RequestInit) {
  const res = await fetch(`${DOMAIN_API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": DOMAIN_API_KEY ?? "",
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }
  return res.json() as Promise<T>;
}

export async function createSession(initial_brief: string) {
  return request<{ session_id: string; questions: DomainQuestion[] }>(
    "/sessions",
    { method: "POST", body: JSON.stringify({ initial_brief }) },
  );
}

export async function getSettings(id: string) {
  return request<DomainSettings>(`/sessions/${id}/settings`, { method: "GET" });
}

export async function saveSettings(id: string, settings: DomainSettings) {
  return request<void>(`/sessions/${id}/settings`, {
    method: "POST",
    body: JSON.stringify(settings),
  });
}

export async function sendAnswers(id: string, answers: Record<string, string>) {
  return request<{ prompt: string; questions: DomainQuestion[] }>(
    `/sessions/${id}/answers`,
    { method: "POST", body: JSON.stringify({ answers }) },
  );
}

export async function generate(id: string) {
  return request<{ available: string[]; taken: string[]; history: unknown }>(
    `/sessions/${id}/generate`,
    { method: "POST" },
  );
}

export async function sendFeedback(
  id: string,
  liked: Record<string, string>,
  disliked: Record<string, string>,
) {
  return request<{ refined_brief: string; questions: DomainQuestion[] }>(
    `/sessions/${id}/feedback`,
    {
      method: "POST",
      body: JSON.stringify({ liked, disliked }),
    },
  );
}
