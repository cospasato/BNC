// api/rooms/[id].js
import { getDb, setCors } from '../_db.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getDb();
  const { id } = req.query;

  try {
    if (req.method === 'PUT') {
      const { name, type, beds, max_guests, price_per_night, status, amenities } = req.body;
      const rows = await sql`
        UPDATE rooms SET
          name = COALESCE(${name}, name),
          type = COALESCE(${type}, type),
          beds = COALESCE(${beds}, beds),
          max_guests = COALESCE(${max_guests}, max_guests),
          price_per_night = COALESCE(${price_per_night}, price_per_night),
          status = COALESCE(${status}, status),
          amenities = COALESCE(${amenities}, amenities)
        WHERE id = ${id}
        RETURNING *
      `;
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      await sql`DELETE FROM rooms WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
