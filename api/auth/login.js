// api/auth/login.js
import { getDb, setCors } from '../_db.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, pin } = req.body;
    if (!email || !pin) return res.status(400).json({ error: 'Email and PIN required' });

    const sql = getDb();
    const rows = await sql`
      SELECT id, name, email, role, location_id, active
      FROM staff
      WHERE email = ${email} AND pin_hash = ${pin} AND active = true
      LIMIT 1
    `;

    if (rows.length === 0) return res.status(401).json({ error: 'Invalid email or PIN' });

    const user = rows[0];
    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      locId: user.location_id,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
