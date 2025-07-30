import type { NextRequest } from 'next/server';

const API_URL = process.env.DOMAIN_API_URL || 'http://161.35.152.9:8000';
const API_KEY = process.env.DOMAIN_API_KEY || 'alksdfjoij09U908FHSFJoidhf9s8dfh9g87buvweuih87329UFI';

async function proxy(req: NextRequest, { params }: { params: { path?: string[] } }) {
  const subPath = params.path ? `/${params.path.join('/')}` : '';
  const url = `${API_URL}${subPath}${req.nextUrl.search}`;
  const init: RequestInit = {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.text();
  }
  const res = await fetch(url, init);
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
  });
}

export async function GET(request: NextRequest, ctx: { params: { path?: string[] } }) {
  return proxy(request, ctx);
}
export async function POST(request: NextRequest, ctx: { params: { path?: string[] } }) {
  return proxy(request, ctx);
}
export async function PUT(request: NextRequest, ctx: { params: { path?: string[] } }) {
  return proxy(request, ctx);
}
export async function PATCH(request: NextRequest, ctx: { params: { path?: string[] } }) {
  return proxy(request, ctx);
}
export async function DELETE(request: NextRequest, ctx: { params: { path?: string[] } }) {
  return proxy(request, ctx);
}
