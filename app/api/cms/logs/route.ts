import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function GET() {
  try {
    const logs = await query<any[]>(
      'SELECT id, action, details, timestamp FROM activity_logs ORDER BY timestamp DESC LIMIT 50'
    );
    return NextResponse.json(logs);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch logs' }, { status: 500 });
  }
}
