const { getDb, setCors } = require('./_db.js');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  let sql;
  try { sql = getDb(); } catch (e) { return res.status(500).json({ error: e.message }); }

  try {
    // Auto-run all migrations safely (IF NOT EXISTS / try-catch each)
    const migrations = [
      // Therapist new columns
      `ALTER TABLE therapists ADD COLUMN IF NOT EXISTS pin_hash TEXT`,
      `ALTER TABLE therapists ADD COLUMN IF NOT EXISTS photos TEXT[] NOT NULL DEFAULT '{}'`,
      `ALTER TABLE therapists ADD COLUMN IF NOT EXISTS availability TEXT NOT NULL DEFAULT 'available'`,
      `ALTER TABLE therapists ADD COLUMN IF NOT EXISTS email_unique TEXT`,
      // Rooms new columns (added back with description + amenities)
      `ALTER TABLE rooms ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE rooms ADD COLUMN IF NOT EXISTS amenities TEXT[] NOT NULL DEFAULT '{}'`,
      // Drop location_id from rooms if it exists (leftover from old lodge schema)
      `ALTER TABLE rooms DROP COLUMN IF EXISTS location_id`,
      `ALTER TABLE rooms DROP COLUMN IF EXISTS room_type`,
      `ALTER TABLE rooms DROP COLUMN IF EXISTS capacity`,
      `ALTER TABLE rooms DROP COLUMN IF EXISTS status`,
      `ALTER TABLE rooms DROP COLUMN IF EXISTS beds`,
      `ALTER TABLE rooms DROP COLUMN IF EXISTS max_guests`,
      `ALTER TABLE rooms DROP COLUMN IF EXISTS price_per_night`,
      `ALTER TABLE rooms DROP COLUMN IF EXISTS photos`,
      `ALTER TABLE rooms DROP COLUMN IF EXISTS video_url`,
      // Commission columns
      `ALTER TABLE therapists ADD COLUMN IF NOT EXISTS commission_pct NUMERIC NOT NULL DEFAULT 0`,
      `ALTER TABLE staff ADD COLUMN IF NOT EXISTS commission_pct NUMERIC NOT NULL DEFAULT 0`,
      // Pricing: add room_id column (plain TEXT, no FK to avoid issues)
      `ALTER TABLE pricing ADD COLUMN IF NOT EXISTS room_id TEXT`,
      // Make room_type nullable so old rows still work
      `ALTER TABLE pricing ALTER COLUMN room_type DROP NOT NULL`,
      `ALTER TABLE pricing ALTER COLUMN room_type SET DEFAULT NULL`,
    ];

    const results = [];
    for (const m of migrations) {
      try { await sql.unsafe(m); results.push({ ok: true, sql: m.slice(0, 60) }); }
      catch(e) { results.push({ ok: false, sql: m.slice(0, 60), err: e.message }); }
    }

    // Sync email_unique for existing therapists
    await sql`UPDATE therapists SET email_unique = email WHERE email IS NOT NULL AND email_unique IS NULL`.catch(()=>{});

    // Count rows in each table
    const tables = ['staff','therapists','rooms','services','pricing','appointments','reception_log','customers','payment_methods'];
    const counts = {};
    for (const t of tables) {
      try { const r = await sql.unsafe(`SELECT COUNT(*)::int AS n FROM ${t}`); counts[t] = r[0].n; }
      catch(e) { counts[t] = `missing: ${e.message}`; }
    }

    return res.status(200).json({ ok: true, message: 'MASSAGE TZ — setup complete ✓', migrations: results, counts });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
