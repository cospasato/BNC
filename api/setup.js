const { getDb, setCors, dbError } = require('./_db.js');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  let sql;
  try { sql = getDb(); } catch (e) { return res.status(500).json({ error: e.message }); }

  try {
    // Check spa tables exist
    const found = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('staff','therapists','rooms','services','appointments','reception_log','customers','payment_methods')
    `;
    const names = found.map(r => r.table_name);
    const missing = ['staff','therapists','rooms','services','appointments','reception_log','customers','payment_methods'].filter(t => !names.includes(t));

    if (missing.length > 0) {
      return res.status(200).json({ ok: false, message: 'Missing tables: ' + missing.join(', ') + '. Run schema.sql in Neon SQL Editor.', missing });
    }

    // Auto-run therapist column migrations (safe - IF NOT EXISTS)
    const migrations = [
      sql`ALTER TABLE therapists ADD COLUMN IF NOT EXISTS pin_hash TEXT`,
      sql`ALTER TABLE therapists ADD COLUMN IF NOT EXISTS photos TEXT[] NOT NULL DEFAULT '{}'`,
      sql`ALTER TABLE therapists ADD COLUMN IF NOT EXISTS availability TEXT NOT NULL DEFAULT 'available'`,
      sql`ALTER TABLE therapists ADD COLUMN IF NOT EXISTS email_unique TEXT`,
    ];
    const migResults = [];
    for (const m of migrations) {
      try { await m; migResults.push('ok'); } catch(e) { migResults.push(e.message); }
    }
    // Set email_unique from email for existing rows
    await sql`UPDATE therapists SET email_unique = email WHERE email IS NOT NULL AND email_unique IS NULL`.catch(()=>{});

    const [st,th,rm,sv,ap,rl,cu,pm] = await Promise.all([
      sql`SELECT COUNT(*)::int AS n FROM staff`,
      sql`SELECT COUNT(*)::int AS n FROM therapists`,
      sql`SELECT COUNT(*)::int AS n FROM rooms`,
      sql`SELECT COUNT(*)::int AS n FROM services`,
      sql`SELECT COUNT(*)::int AS n FROM appointments`,
      sql`SELECT COUNT(*)::int AS n FROM reception_log`,
      sql`SELECT COUNT(*)::int AS n FROM customers`,
      sql`SELECT COUNT(*)::int AS n FROM payment_methods`,
    ]);

    return res.status(200).json({
      ok: true,
      message: 'MASSAGE TZ database ready ✓',
      migrations: migResults,
      counts: { staff: st[0].n, therapists: th[0].n, rooms: rm[0].n, services: sv[0].n, appointments: ap[0].n, reception_log: rl[0].n, customers: cu[0].n, payment_methods: pm[0].n }
    });
  } catch (err) {
    return res.status(500).json({ error: dbError(err) });
  }
};
