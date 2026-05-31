const { getDb, setCors, dbError } = require('../_db.js');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const sql = getDb();
  const { id } = req.query;
  try {
    if (req.method === 'PUT') {
      const { name, type, beds, max_guests, price_per_night, status, amenities } = req.body;
      const rows = await sql`
        UPDATE rooms SET
          name            = COALESCE(${name            ?? null}, name),
          type            = COALESCE(${type            ?? null}, type),
          beds            = COALESCE(${beds            ?? null}, beds),
          max_guests      = COALESCE(${max_guests      ?? null}, max_guests),
          price_per_night = COALESCE(${price_per_night ?? null}, price_per_night),
          status          = COALESCE(${status          ?? null}, status),
          amenities       = COALESCE(${amenities       ?? null}, amenities)
        WHERE id = ${id} RETURNING *
      `;
      return res.status(200).json(rows[0]);
    }
    if (req.method === 'DELETE') {
      await sql`DELETE FROM rooms WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: dbError(err) });
  }
};
