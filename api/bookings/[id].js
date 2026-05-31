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
      const { status, paid_amount, add_payment } = req.body || {};
      let rows;
      if (add_payment !== undefined) {
        rows = await sql`
          UPDATE bookings
          SET paid_amount = LEAST(total_amount, paid_amount + ${Number(add_payment)})
          WHERE id = ${id}
          RETURNING *
        `;
      } else {
        rows = await sql`
          UPDATE bookings SET
            status      = COALESCE(${status      ?? null}, status),
            paid_amount = COALESCE(${paid_amount ?? null}, paid_amount)
          WHERE id = ${id}
          RETURNING *
        `;
      }
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: `Booking '${id}' not found` });
      }
      const b = rows[0];
      if (b.status === 'checkedIn')
        await sql`UPDATE rooms SET status = 'occupied'  WHERE id = ${b.room_id}`;
      if (b.status === 'checkedOut' || b.status === 'cancelled')
        await sql`UPDATE rooms SET status = 'available' WHERE id = ${b.room_id}`;
      return res.status(200).json(b);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('bookings PUT error:', err.message);
    return res.status(500).json({ error: dbError(err) });
  }
};
