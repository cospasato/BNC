const { getDb, setCors, dbError } = require('./_db.js');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  let sql;
  try { sql = getDb(); } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  const { id, location_id } = req.query;

  try {
    // GET /api/rooms or /api/rooms?location_id=X
    if (req.method === 'GET') {
      const rows = location_id
        ? await sql`SELECT * FROM rooms WHERE location_id = ${location_id} ORDER BY name ASC`
        : await sql`SELECT * FROM rooms ORDER BY location_id, name ASC`;
      return res.status(200).json(rows);
    }

    // POST /api/rooms — create
    if (req.method === 'POST') {
      const { location_id: loc, name, type, beds, max_guests, price_per_night, status, amenities } = req.body || {};
      if (!loc || !name || !price_per_night) return res.status(400).json({ error: 'location_id, name, price_per_night required' });
      const rows = await sql`
        INSERT INTO rooms (location_id, name, type, beds, max_guests, price_per_night, status, amenities)
        VALUES (${loc}, ${name}, ${type || 'Standard'}, ${beds || 1}, ${max_guests || 2},
                ${price_per_night}, ${status || 'available'}, ${amenities || []})
        RETURNING *
      `;
      return res.status(201).json(rows[0]);
    }

    // PUT /api/rooms?id=X — update
    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'id required' });
      const { name, type, beds, max_guests, price_per_night, status, amenities } = req.body || {};
      const rows = await sql`
        UPDATE rooms SET
          name            = COALESCE(${name            ?? null}, name),
          type            = COALESCE(${type            ?? null}, type),
          beds            = COALESCE(${beds            ?? null}, beds),
          max_guests      = COALESCE(${max_guests      ?? null}, max_guests),
          price_per_night = COALESCE(${price_per_night ?? null}, price_per_night),
          status          = COALESCE(${status          ?? null}, status),
          amenities       = COALESCE(${amenities       ?? null}, amenities)
        WHERE id = ${id}
        RETURNING *
      `;
      if (!rows.length) return res.status(404).json({ error: `Room '${id}' not found` });
      return res.status(200).json(rows[0]);
    }

    // DELETE /api/rooms?id=X
    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id required' });
      await sql`DELETE FROM rooms WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('rooms error:', err.message);
    return res.status(500).json({ error: dbError(err) });
  }
};
