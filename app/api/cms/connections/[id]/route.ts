import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    await query(
      `UPDATE cms_connections
       SET name = COALESCE(?, name),
           url = COALESCE(?, url),
           api_key = COALESCE(?, api_key),
           type = COALESCE(?, type),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [body?.name ?? null, body?.url ?? null, body?.apiKey ?? null, body?.type ?? null, body?.status ?? null, id],
    );
    const [updated] = await query<any[]>(
      'SELECT id, name, type, url, api_key AS apiKey, status, created_at AS createdAt FROM cms_connections WHERE id=?',
      [id],
    );
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update connection' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await query('DELETE FROM cms_connections WHERE id=?', [id]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to delete connection' }, { status: 500 });
  }
}

