import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function GET() {
  try {
    const mappings = await query<any[]>('SELECT * FROM bridge_mappings');
    return NextResponse.json(mappings);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch mappings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { hashtag, connectionId } = await req.json();
    if (!hashtag || !connectionId) {
      return NextResponse.json({ error: 'Missing hashtag/connectionId' }, { status: 400 });
    }

    await query(
      'INSERT INTO bridge_mappings (hashtag, connection_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE connection_id = ?',
      [hashtag, connectionId, connectionId]
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to save mapping' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await query('DELETE FROM bridge_mappings WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to delete mapping' }, { status: 500 });
  }
}
