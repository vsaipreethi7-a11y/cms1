import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { randomUUID } from 'crypto';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const contentId = searchParams.get('contentId');
    const assignments = await query<any[]>(
      `SELECT id, content_id AS contentId, title, description, priority, suggested_action AS suggestedAction, status, created_at AS createdAt
       FROM assignments
       ${contentId ? 'WHERE content_id=?' : ''}
       ORDER BY created_at DESC`,
      contentId ? [contentId] : [],
    );
    return NextResponse.json(assignments);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch assignments' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { contentId, title, description, priority, suggestedAction } = body ?? {};
    if (!contentId || !title || !description || !priority || !suggestedAction) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const id = randomUUID();
    await query(
      `INSERT INTO assignments
       (id, content_id, title, description, priority, suggested_action, status)
       VALUES (?,?,?,?,?,?,?)`,
      [id, contentId, title, description, priority, suggestedAction, 'pending'],
    );
    const [created] = await query<any[]>(
      `SELECT id, content_id AS contentId, title, description, priority, suggested_action AS suggestedAction, status, created_at AS createdAt
       FROM assignments WHERE id=?`,
      [id],
    );
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create assignment' }, { status: 500 });
  }
}

