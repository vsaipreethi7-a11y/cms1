import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/mysql';

export async function GET() {
  const diag: any = {
    status: 'unknown',
    database: 'unknown',
    tables: [],
    error: null,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      HAS_FILE_PREFIX: process.env.DATABASE_URL?.startsWith('file:'),
    }
  };

  try {
    // Try a simple query
    const result = await query('SELECT 1 as connected');
    diag.status = result[0]?.connected === 1 ? 'connected' : 'failed';

    // Get database name
    const dbName = await query('SELECT DATABASE() as db');
    diag.database = dbName[0]?.db;

    // List tables
    const tables = await query('SHOW TABLES');
    diag.tables = tables.map((t: any) => Object.values(t)[0]);

    return NextResponse.json(diag);
  } catch (e: any) {
    diag.status = 'error';
    diag.error = e.message;
    return NextResponse.json(diag, { status: 500 });
  }
}
