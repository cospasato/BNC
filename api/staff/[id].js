const { getDb, setCors, dbError } = require('../_db.js');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  let sql;
  try { sql = getDb(); } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  try {
    if (req.method === 'PUT') {
      const { name, phone, role, location_id, pin, active } = req.body || {};
      const rows = pin
        ? await sql`
            UPDATE staff SET
              name        = COALESCE(${name        ?? null}, name),
              phone       = COALESCE(${phone       ?? null}, phone),
              role        = COALESCE(${role        ?? null}, role),
              location_id = COALESCE(${location_id ?? null}, location_id),
              pin_hash    = ${pin},
              active      = COALESCE(${active      ?? null}, active)
            WHERE id = ${id}
            RETURNING id, name, email, phone, role, location_id, active, created_at`
        : await sql`
            UPDATE staff SET
              name        = COALESCE(${name        ?? null}, name),
              phone       = COALESCE(${phone       ?? null}, phone),
              role        = COALESCE(${role        ?? null}, role),
              location_id = COALESCE(${location_id ?? null}, location_id),
              active      = COALESCE(${active      ?? null}, active)
            WHERE id = ${id}
            RETURNING id, name, email, phone, role, location_id, active, created_at`;
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: `Staff '${id}' not found` });
      }
      return res.status(200).json(rows[0]);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('staff PUT error:', err.message);
    return res.status(500).json({ error: dbError(err) });
  }
};
