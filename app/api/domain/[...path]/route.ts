import { type NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.DOMAIN_API_URL;
const API_KEY = process.env.DOMAIN_API_KEY;

async function proxy(request: NextRequest, path: string[]) {
  if (!API_URL || !API_KEY) {
    return new NextResponse('Domain API not configured', { status: 500 });
  }
  const url = `${API_URL}/${path.join('/')}${request.nextUrl.search}`;
  const init: RequestInit = {
    method: request.method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    cache: 'no-store',
  };
  if (request.method !== 'GET') {
    const bodyText = await request.text();
    init.body = bodyText;
  }

  const res = await fetch(url, init);
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(request, path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(request, path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(request, path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(request, path);
}
