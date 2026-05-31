// api/locations/index.js
import { getDb, setCors } from '../_db.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getDb();

  try {
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT l.*,
          COUNT(DISTINCT r.id) AS room_count,
          COUNT(DISTINCT b.id) AS booking_count
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
      const rows = await sql`
        INSERT INTO locations (name, city, address, icon, description)
        VALUES (${name}, ${city}, ${address || ''}, ${icon || '🏙️'}, ${description || ''})
        RETURNING *
      `;
      return res.status(201).json(rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Locations error:', err);
    return res.status(500).json({ error: dbError(err) });
  }
}
