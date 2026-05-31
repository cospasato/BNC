const { getDb, setCors, dbError } = require('./_db.js');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  let sql;
  try { sql = getDb(); } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  const { id, location_id, status: statusFilter } = req.query;

  try {
    // GET /api/bookings
    if (req.method === 'GET') {
      let rows;
      if (location_id && statusFilter)
        rows = await sql`SELECT * FROM bookings WHERE location_id=${location_id} AND status=${statusFilter} ORDER BY created_at DESC`;
      else if (location_id)
        rows = await sql`SELECT * FROM bookings WHERE location_id=${location_id} ORDER BY created_at DESC`;
      else if (statusFilter)
        rows = await sql`SELECT * FROM bookings WHERE status=${statusFilter} ORDER BY created_at DESC`;
      else
        rows = await sql`SELECT * FROM bookings ORDER BY created_at DESC`;
      return res.status(200).json(rows);
    }

    // POST /api/bookings — create
    if (req.method === 'POST') {
      const {
        room_id, location_id: loc, guest_name, guest_phone, guest_email,
        guest_nationality, check_in, check_out, nights, base_amount,
        discount, discount_type, total_amount, paid_amount, payment_method, notes, staff_id
      } = req.body || {};
      if (!guest_name || !guest_phone || !check_in || !check_out)
        return res.status(400).json({ error: 'guest_name, guest_phone, check_in, check_out required' });
      const rows = await sql`
        INSERT INTO bookings (
          room_id, location_id, guest_name, guest_phone, guest_email,
          guest_nationality, check_in, check_out, nights, base_amount,
          discount, discount_type, total_amount, paid_amount,
          status, payment_method, notes, staff_id
        ) VALUES (
          ${room_id || null}, ${loc || null}, ${guest_name}, ${guest_phone},
          ${guest_email || null}, ${guest_nationality || null},
          ${check_in}, ${check_out}, ${nights || 1}, ${base_amount || 0},
          ${discount || 0}, ${discount_type || 'pct'}, ${total_amount || 0},
          ${paid_amount || 0}, 'pending', ${payment_method || 'Cash'},
          ${notes || null}, ${staff_id || null}
        )
        RETURNING *
      `;
      return res.status(201).json(rows[0]);
    }

    // PUT /api/bookings?id=X — update status or payment
    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'id required' });
      const { status, paid_amount, add_payment } = req.body || {};
      let rows;

      if (add_payment !== undefined) {
        // Record a payment
        rows = await sql`
          UPDATE bookings
          SET paid_amount = LEAST(total_amount, paid_amount + ${Number(add_payment)})
          WHERE id = ${id} RETURNING *
        `;
      } else if (status === 'cancelled') {
        // Cancellation: set total_amount = paid_amount so outstanding balance becomes 0
        // Any amount already paid is retained (refund is handled offline)
        rows = await sql`
          UPDATE bookings SET
            status       = 'cancelled',
            total_amount = paid_amount
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

      if (!rows.length) return res.status(404).json({ error: `Booking '${id}' not found` });
      const b = rows[0];
      if (b.status === 'checkedIn')
        await sql`UPDATE rooms SET status = 'occupied'  WHERE id = ${b.room_id}`;
      if (b.status === 'checkedOut' || b.status === 'cancelled')
        await sql`UPDATE rooms SET status = 'available' WHERE id = ${b.room_id}`;
      return res.status(200).json(b);
    }

    // DELETE /api/bookings?id=X — admin only, cancelled bookings only
    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id required' });
      const check = await sql`SELECT status, guest_name FROM bookings WHERE id = ${id}`;
      if (!check.length) return res.status(404).json({ error: 'Booking not found' });
      if (check[0].status !== 'cancelled')
        return res.status(400).json({ error: 'Only cancelled bookings can be deleted. Cancel it first.' });
      await sql`DELETE FROM bookings WHERE id = ${id}`;
      return res.status(200).json({ success: true, guest: check[0].guest_name });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('bookings error:', err.message);
    return res.status(500).json({ error: dbError(err) });
  }
};
