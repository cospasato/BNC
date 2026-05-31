const { getDb, setCors, dbError } = require('../_db.js');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const sql = getDb();
  const { id } = req.query;
  try {
    if (req.method === 'PUT') {
      const { status, paid_amount, add_payment } = req.body;
      let rows;
      if (add_payment !== undefined) {
        rows = await sql`
          UPDATE bookings
          SET paid_amount = LEAST(total_amount, paid_amount + ${Number(add_payment)})
          WHERE id = ${id} RETURNING *
        `;
      } else {
        rows = await sql`
          UPDATE bookings SET
            status      = COALESCE(${status      ?? null}, status),
            paid_amount = COALESCE(${paid_amount ?? null}, paid_amount)
          WHERE id = ${id} RETURNING *
        `;
      }
      const b = rows[0];
      if (b) {
        if (b.status === 'checkedIn')
          await sql`UPDATE rooms SET status='occupied'  WHERE id=${b.room_id}`;
        if (b.status === 'checkedOut' || b.status === 'cancelled')
          await sql`UPDATE rooms SET status='available' WHERE id=${b.room_id}`;
      }
      return res.status(200).json(b);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: dbError(err) });
  }
};
