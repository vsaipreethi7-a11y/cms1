import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cmsId, items, replaceExisting } = body ?? {};
    if (!cmsId || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Missing cmsId/items' }, { status: 400 });
    }

    if (replaceExisting) {
      await query('DELETE FROM cms_content_items WHERE cms_id=?', [cmsId]);
    }

    // Insert rows one by one (keeps code simple and compatible)
    let createdCount = 0;
    for (const i of items) {
      // If caller provides id, keep it; otherwise generate a stable-ish id
      const id = i?.id || `bulk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      await query(
        `INSERT INTO cms_content_items
         (id, cms_id, title, body, author, status, date, tags, word_count)
         VALUES (?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           title=VALUES(title),
           body=VALUES(body),
           author=VALUES(author),
           status=VALUES(status),
           date=VALUES(date),
           tags=VALUES(tags),
           word_count=VALUES(word_count)`,
        [
          id,
          cmsId,
          i?.title || 'Untitled',
          i?.body || '',
          i?.author || '',
          i?.status || 'draft',
          i?.date ? new Date(i.date) : new Date(),
          JSON.stringify(Array.isArray(i?.tags) ? i.tags : []),
          Number.isFinite(i?.wordCount) ? i.wordCount : 0,
        ],
      );
      createdCount += 1;
    }

    return NextResponse.json({ ok: true, created: createdCount });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed bulk insert' }, { status: 500 });
  }
}

