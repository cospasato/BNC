const { getDb, setCors, dbError } = require('../_db.js');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  let sql;
  try { sql = getDb(); } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  try {
    if (req.method === 'PUT') {
      const { id, name, phone, email, current_pin, new_pin } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });

      // If changing PIN, verify current PIN first
      if (new_pin) {
        if (!current_pin) return res.status(400).json({ error: 'Current PIN required to set a new PIN' });
        const check = await sql`SELECT pin_hash FROM staff WHERE id = ${id}`;
        if (!check.length) return res.status(404).json({ error: 'Account not found' });
        if (check[0].pin_hash !== current_pin)
          return res.status(401).json({ error: 'Current PIN is incorrect' });
      }

      // Check email uniqueness if changing email
      if (email) {
        const existing = await sql`SELECT id FROM staff WHERE lower(email) = lower(${email}) AND id != ${id}`;
        if (existing.length) return res.status(400).json({ error: 'That email is already used by another account' });
      }

      const rows = new_pin
        ? await sql`
            UPDATE staff SET
              name     = COALESCE(${name  ?? null}, name),
              phone    = COALESCE(${phone ?? null}, phone),
              email    = COALESCE(${email ?? null}, email),
              pin_hash = ${new_pin}
            WHERE id = ${id}
            RETURNING id, name, email, phone, role, location_id, active`
        : await sql`
            UPDATE staff SET
              name  = COALESCE(${name  ?? null}, name),
              phone = COALESCE(${phone ?? null}, phone),
              email = COALESCE(${email ?? null}, email)
            WHERE id = ${id}
            RETURNING id, name, email, phone, role, location_id, active`;

      if (!rows.length) return res.status(404).json({ error: 'Account not found' });
      return res.status(200).json(rows[0]);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('profile update error:', err.message);
    return res.status(500).json({ error: dbError(err) });
  }
};
