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
      const { name, city, address, icon, description, active } = req.body || {};
      const rows = await sql`
        UPDATE locations SET
          name        = COALESCE(${name        ?? null}, name),
          city        = COALESCE(${city        ?? null}, city),
          address     = COALESCE(${address     ?? null}, address),
          icon        = COALESCE(${icon        ?? null}, icon),
          description = COALESCE(${description ?? null}, description),
          active      = COALESCE(${active      ?? null}, active)
        WHERE id = ${id}
        RETURNING *
      `;
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: `Location '${id}' not found in database` });
      }
      return res.status(200).json(rows[0]);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('locations PUT error:', err.message);
    return res.status(500).json({ error: dbError(err) });
  }
};
