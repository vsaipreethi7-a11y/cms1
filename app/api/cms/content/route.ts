import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { randomUUID } from 'crypto';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cmsId = searchParams.get('cmsId');
    const items = await query<any[]>(
      `SELECT id, cms_id AS cmsId, title, body, author, status, date, tags, word_count AS wordCount
       FROM cms_content_items
       ${cmsId ? 'WHERE cms_id=?' : ''}
       ORDER BY date DESC`,
      cmsId ? [cmsId] : [],
    );
    // mysql2 returns JSON as object for JSON column in many cases; ensure array for tags
    const mapped = items.map(i => ({ ...i, tags: Array.isArray(i.tags) ? i.tags : (i.tags ? JSON.parse(i.tags) : []) }));
    return NextResponse.json(mapped);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch content' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cmsId, title, body: contentBody, author, status, date, tags, wordCount } = body ?? {};
    if (!cmsId || !title) {
      return NextResponse.json({ error: 'Missing cmsId/title' }, { status: 400 });
    }
    const id = randomUUID();
    await query(
      `INSERT INTO cms_content_items
       (id, cms_id, title, body, author, status, date, tags, word_count)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        id,
        cmsId,
        title,
        contentBody || '',
        author || '',
        status || 'draft',
        date ? new Date(date) : new Date(),
        JSON.stringify(Array.isArray(tags) ? tags : []),
        Number.isFinite(wordCount) ? wordCount : 0,
      ],
    );
    const [created] = await query<any[]>(
      `SELECT id, cms_id AS cmsId, title, body, author, status, date, tags, word_count AS wordCount
       FROM cms_content_items WHERE id=?`,
      [id],
    );
    created.tags = Array.isArray(created.tags) ? created.tags : JSON.parse(created.tags || '[]');
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create content' }, { status: 500 });
  }
}

