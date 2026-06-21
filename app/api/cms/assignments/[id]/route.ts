import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    await query('UPDATE assignments SET status = COALESCE(?, status) WHERE id=?', [body?.status ?? null, id]);
    const [updated] = await query<any[]>(
      `SELECT id, content_id AS contentId, title, description, priority, suggested_action AS suggestedAction, status, created_at AS createdAt
       FROM assignments WHERE id=?`,
      [id],
    );
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update assignment' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await query('DELETE FROM assignments WHERE id=?', [id]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to delete assignment' }, { status: 500 });
  }
}

