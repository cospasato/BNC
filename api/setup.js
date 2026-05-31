// api/setup.js — checks DB connection and table status
// Visit /api/setup in browser to verify your database is configured correctly
import { getDb, setCors, dbError } from './_db.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Check env var
  if (!process.env.DATABASE_URL) {
    return res.status(500).json({
      ok: false,
      error: 'DATABASE_URL not set',
      fix: 'Add DATABASE_URL to Vercel → Project → Settings → Environment Variables, then redeploy.',
    });
  }

  try {
    const sql = getDb();

    // Check each table exists
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('locations','rooms','bookings','expenses','staff')
      ORDER BY table_name
    `;

    const found = tables.map(t => t.table_name);
    const required = ['bookings','expenses','locations','rooms','staff'];
    const missing = required.filter(t => !found.includes(t));

    if (missing.length > 0) {
      return res.status(500).json({
        ok: false,
        error: `Missing tables: ${missing.join(', ')}`,
        fix: 'Run schema.sql in Neon Console → SQL Editor, then try again.',
        tables_found: found,
        tables_missing: missing,
      });
    }

    // Count rows in each table
    const [locs, rooms, books, exps, stf] = await Promise.all([
      sql`SELECT COUNT(*) FROM locations`,
      sql`SELECT COUNT(*) FROM rooms`,
      sql`SELECT COUNT(*) FROM bookings`,
      sql`SELECT COUNT(*) FROM expenses`,
      sql`SELECT COUNT(*) FROM staff`,
    ]);

    return res.status(200).json({
      ok: true,
      message: 'Database is configured correctly ✓',
      counts: {
        locations: Number(locs[0].count),
        rooms:     Number(rooms[0].count),
        bookings:  Number(books[0].count),
        expenses:  Number(exps[0].count),
        staff:     Number(stf[0].count),
      },
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: dbError(err),
      fix: 'Check your DATABASE_URL is correct and run schema.sql in Neon SQL Editor.',
      raw: err.message,
    });
  }
}
