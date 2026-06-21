import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function GET() {
  try {
    const [config] = await query<any[]>('SELECT * FROM bridge_config WHERE id = 1');
    return NextResponse.json(config || {});
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch config' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { whatsapp_enabled, telegram_token, telegram_enabled, email_user, email_pass, email_enabled } = body;

    await query(
      `UPDATE bridge_config SET 
        whatsapp_enabled = ?, 
        telegram_token = ?, 
        telegram_enabled = ?, 
        email_user = ?, 
        email_pass = ?, 
        email_enabled = ? 
      WHERE id = 1`,

      [
        !!whatsapp_enabled,
        telegram_token || null,
        !!telegram_enabled,
        email_user || null,
        email_pass || null,
        !!email_enabled
      ]
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update config' }, { status: 500 });
  }
}
