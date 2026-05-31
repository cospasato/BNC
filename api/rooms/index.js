// api/rooms/index.js
import { getDb, setCors } from '../_db.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getDb();

  try {
    if (req.method === 'GET') {
      const { location_id } = req.query;
      const rows = location_id
        ? await sql`SELECT * FROM rooms WHERE location_id = ${location_id} ORDER BY name ASC`
        : await sql`SELECT * FROM rooms ORDER BY location_id, name ASC`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { location_id, name, type, beds, max_guests, price_per_night, status, amenities } = req.body;
      const rows = await sql`
        INSERT INTO rooms (location_id, name, type, beds, max_guests, price_per_night, status, amenities)
        VALUES (
          ${location_id}, ${name}, ${type || 'Standard'}, ${beds || 1},
          ${max_guests || 2}, ${price_per_night}, ${status || 'available'},
          ${amenities || []}
        )
        RETURNING *
      `;
      return res.status(201).json(rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Rooms error:', err);
    return res.status(500).json({ error: dbError(err) });
  }
}
