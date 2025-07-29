import type { NextRequest } from 'next/server';

const API_URL = process.env.DOMAIN_API_URL || 'http://161.35.152.9:8000';
const API_KEY = process.env.DOMAIN_API_KEY || '';

async function proxy(request: NextRequest, slug: string[]) {
  const url = `${API_URL}/${slug.join('/')}${request.nextUrl.search}`;
  const init: RequestInit = {
    method: request.method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: request.method !== 'GET' ? await request.text() : undefined,
  };

  const resp = await fetch(url, init);
  const text = await resp.text();
  return new Response(text, {
    status: resp.status,
    headers: {
      'Content-Type': resp.headers.get('content-type') || 'application/json',
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  return proxy(request, slug);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  return proxy(request, slug);
}
