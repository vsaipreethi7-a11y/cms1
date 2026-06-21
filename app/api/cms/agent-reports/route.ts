import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { randomUUID } from 'crypto';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get('connectionId') || undefined;
    const agentId = searchParams.get('agentId') || undefined;
    const where: string[] = [];
    const params: any[] = [];
    if (connectionId) {
      where.push('connection_id=?');
      params.push(connectionId);
    }
    if (agentId) {
      where.push('agent_id=?');
      params.push(agentId);
    }
    const reports = await query<any[]>(
      `SELECT id, agent_id AS agentId, agent_name AS agentName, connection_id AS connectionId, content_id AS contentId,
              content_title AS contentTitle, result, created_at AS createdAt
       FROM ai_agent_reports
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY created_at DESC
       LIMIT 200`,
      params,
    );
    const mapped = reports.map(r => ({ ...r, result: typeof r.result === 'string' ? JSON.parse(r.result) : r.result }));
    return NextResponse.json(mapped);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { agentId, agentName, connectionId, contentId, contentTitle, result } = body ?? {};
    if (!agentId || !agentName || !connectionId || !contentId || !contentTitle) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const id = randomUUID();
    await query(
      `INSERT INTO ai_agent_reports
       (id, agent_id, agent_name, connection_id, content_id, content_title, result)
       VALUES (?,?,?,?,?,?,?)`,
      [id, agentId, agentName, connectionId, contentId, contentTitle, JSON.stringify(result ?? {})],
    );
    const [created] = await query<any[]>(
      `SELECT id, agent_id AS agentId, agent_name AS agentName, connection_id AS connectionId, content_id AS contentId,
              content_title AS contentTitle, result, created_at AS createdAt
       FROM ai_agent_reports WHERE id=?`,
      [id],
    );
    created.result = typeof created.result === 'string' ? JSON.parse(created.result) : created.result;
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create report' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get('connectionId') || undefined;
    const agentId = searchParams.get('agentId') || undefined;

    if (!connectionId && !agentId) {
      return NextResponse.json({ error: 'Provide connectionId and/or agentId' }, { status: 400 });
    }

    const where: string[] = [];
    const params: any[] = [];
    if (connectionId) {
      where.push('connection_id=?');
      params.push(connectionId);
    }
    if (agentId) {
      where.push('agent_id=?');
      params.push(agentId);
    }
    const res: any = await query<any>(
      `DELETE FROM ai_agent_reports WHERE ${where.join(' AND ')}`,
      params,
    );
    return NextResponse.json({ ok: true, deleted: res?.affectedRows ?? 0 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to delete reports' }, { status: 500 });
  }
}

