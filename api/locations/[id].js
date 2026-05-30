// api/locations/[id].js
import { getDb, setCors } from '../_db.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getDb();
  const { id } = req.query;

  try {
    if (req.method === 'PUT') {
      const { name, city, address, icon, description, active } = req.body;
      const rows = await sql`
        UPDATE locations SET
          name = COALESCE(${name}, name),
          city = COALESCE(${city}, city),
          address = COALESCE(${address}, address),
          icon = COALESCE(${icon}, icon),
          description = COALESCE(${description}, description),
          active = COALESCE(${active}, active)
        WHERE id = ${id}
        RETURNING *
      `;
      return res.status(200).json(rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
