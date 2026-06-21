import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function POST() {
  // Order matters due to FK constraints
  await query('DELETE FROM ai_agent_reports');
  await query('DELETE FROM assignments');
  await query('DELETE FROM cms_content_items');
  await query('DELETE FROM cms_connections');
  return NextResponse.json({ ok: true });
}

