// api/_db.js — shared Neon client
import { neon } from '@neondatabase/serverless';

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Add it in Vercel → Settings → Environment Variables.');
  }
  const sql = neon(process.env.DATABASE_URL);
  return sql;
}

export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Friendly error wrapper — turns postgres errors into readable messages
export function dbError(err) {
  const msg = err.message || String(err);
  if (msg.includes('does not exist')) {
    return 'Table not found. Please run schema.sql in your Neon SQL Editor first.';
  }
  if (msg.includes('DATABASE_URL')) {
    return 'Database not configured. Add DATABASE_URL to Vercel environment variables.';
  }
  if (msg.includes('duplicate key')) {
    return 'A record with that ID already exists.';
  }
  if (msg.includes('foreign key')) {
    return 'Referenced record does not exist.';
  }
  return msg;
}
