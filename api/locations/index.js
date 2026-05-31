const { getDb, setCors, dbError } = require('../_db.js');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const sql = getDb();
  try {
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT l.*,
          COUNT(DISTINCT r.id)::int AS room_count,
          COUNT(DISTINCT b.id)::int AS booking_count
        FROM locations l
        LEFT JOIN rooms r ON r.location_id = l.id
        LEFT JOIN bookings b ON b.location_id = l.id
        WHERE l.active = true
        GROUP BY l.id
        ORDER BY l.created_at ASC
      `;
      return res.status(200).json(rows);
    }
    if (req.method === 'POST') {
      const { name, city, address, icon, description } = req.body;
      if (!name || !city) return res.status(400).json({ error: 'name and city are required' });
      const rows = await sql`
        INSERT INTO locations (name, city, address, icon, description)
        VALUES (${name}, ${city}, ${address||''}, ${icon||'🏙️'}, ${description||''})
        RETURNING *
      `;
      return res.status(201).json(rows[0]);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('locations error:', err.message);
    return res.status(500).json({ error: dbError(err) });
  }
};
