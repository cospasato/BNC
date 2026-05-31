// api/staff/index.js
import { getDb, setCors } from '../_db.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getDb();

  try {
    if (req.method === 'GET') {
      // Never return pin_hash
      const rows = await sql`
        SELECT id, name, email, phone, role, location_id, active, created_at
        FROM staff
        ORDER BY created_at ASC
      `;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { name, email, phone, role, location_id, pin } = req.body;
      if (!name || !email || !pin) return res.status(400).json({ error: 'name, email, pin required' });

      const rows = await sql`
        INSERT INTO staff (name, email, phone, role, location_id, pin_hash)
        VALUES (${name}, ${email}, ${phone || null}, ${role || 'Receptionist'}, ${location_id || null}, ${pin})
        RETURNING id, name, email, phone, role, location_id, active, created_at
      `;
      return res.status(201).json(rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Staff error:', err);
    return res.status(500).json({ error: dbError(err) });
  }
}
