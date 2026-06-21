import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const connections = await query<any[]>(
      'SELECT id, name, type, url, api_key AS apiKey, status, created_at AS createdAt FROM cms_connections ORDER BY created_at DESC',
    );
    return NextResponse.json(connections);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch connections' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, type, url, apiKey } = body ?? {};
    if (!name || !type || !url || !apiKey) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const id = randomUUID();
    await query(
      'INSERT INTO cms_connections (id, name, type, url, api_key, status) VALUES (?,?,?,?,?,?)',
      [id, name, type, url, apiKey, 'connected'],
    );

    const [created] = await query<any[]>(
      'SELECT id, name, type, url, api_key AS apiKey, status, created_at AS createdAt FROM cms_connections WHERE id=?',
      [id],
    );
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create connection' }, { status: 500 });
  }
}

