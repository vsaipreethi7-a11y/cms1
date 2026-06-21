import mysql from 'mysql2/promise';

const globalForMysql = globalThis as unknown as {
  mysqlPool: mysql.Pool | undefined;
};

function getDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    try {
      require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });
    } catch {}
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return url;
}


export const pool: mysql.Pool =
  globalForMysql.mysqlPool ??
  mysql.createPool({
    uri: getDatabaseUrl(),
    connectionLimit: 10,
    enableKeepAlive: true,
  });

if (process.env.NODE_ENV !== 'production') globalForMysql.mysqlPool = pool;

export async function query<T = any>(sql: string, params: any[] = []) {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}

