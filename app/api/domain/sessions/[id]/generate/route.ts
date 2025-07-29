import { NextResponse } from 'next/server';

const BASE_URL = process.env.DOMAIN_API_URL;
const API_KEY = process.env.DOMAIN_API_KEY;

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  if (!BASE_URL || !API_KEY) {
    return NextResponse.json({ error: 'Domain API not configured' }, { status: 500 });
  }
  const res = await fetch(`${BASE_URL}/sessions/${params.id}/generate`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
    },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
