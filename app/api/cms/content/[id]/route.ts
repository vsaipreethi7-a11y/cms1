import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    await query(
      `UPDATE cms_content_items
       SET title = COALESCE(?, title),
           body = COALESCE(?, body),
           author = COALESCE(?, author),
           status = COALESCE(?, status),
           date = COALESCE(?, date),
           tags = COALESCE(?, tags),
           word_count = COALESCE(?, word_count)
       WHERE id = ?`,
      [
        body?.title ?? null,
        body?.body ?? null,
        body?.author ?? null,
        body?.status ?? null,
        body?.date ? new Date(body.date) : null,
        Array.isArray(body?.tags) ? JSON.stringify(body.tags) : null,
        typeof body?.wordCount === 'number' ? body.wordCount : null,
        id,
      ],
    );
    const [updated] = await query<any[]>(
      `SELECT id, cms_id AS cmsId, title, body, author, status, date, tags, word_count AS wordCount
       FROM cms_content_items WHERE id=?`,
      [id],
    );
    updated.tags = Array.isArray(updated.tags) ? updated.tags : JSON.parse(updated.tags || '[]');
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update content' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await query('DELETE FROM cms_content_items WHERE id=?', [id]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to delete content' }, { status: 500 });
  }
}

