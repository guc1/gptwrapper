import { NextResponse } from 'next/server';

const BASE_URL = process.env.DOMAIN_API_URL;
const API_KEY = process.env.DOMAIN_API_KEY;

export async function POST(request: Request) {
  if (!BASE_URL || !API_KEY) {
    return NextResponse.json({ error: 'Domain API not configured' }, { status: 500 });
  }
  const body = await request.json();
  const res = await fetch(`${BASE_URL}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
