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
      const { name, type, beds, max_guests, price_per_night, status, amenities } = req.body || {};
      const rows = await sql`
        UPDATE rooms SET
          name            = COALESCE(${name            ?? null}, name),
          type            = COALESCE(${type            ?? null}, type),
          beds            = COALESCE(${beds            ?? null}, beds),
          max_guests      = COALESCE(${max_guests      ?? null}, max_guests),
          price_per_night = COALESCE(${price_per_night ?? null}, price_per_night),
          status          = COALESCE(${status          ?? null}, status),
          amenities       = COALESCE(${amenities       ?? null}, amenities)
        WHERE id = ${id}
        RETURNING *
      `;
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: `Room '${id}' not found` });
      }
      return res.status(200).json(rows[0]);
    }
    if (req.method === 'DELETE') {
      await sql`DELETE FROM rooms WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('rooms PUT error:', err.message);
    return res.status(500).json({ error: dbError(err) });
  }
};
