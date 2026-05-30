// api/bookings/index.js
import { getDb, setCors } from '../_db.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getDb();

  try {
    if (req.method === 'GET') {
      const { location_id, status } = req.query;
      let rows;
      if (location_id && status) {
        rows = await sql`SELECT * FROM bookings WHERE location_id = ${location_id} AND status = ${status} ORDER BY created_at DESC`;
      } else if (location_id) {
        rows = await sql`SELECT * FROM bookings WHERE location_id = ${location_id} ORDER BY created_at DESC`;
      } else if (status) {
        rows = await sql`SELECT * FROM bookings WHERE status = ${status} ORDER BY created_at DESC`;
      } else {
        rows = await sql`SELECT * FROM bookings ORDER BY created_at DESC`;
      }
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const {
        room_id, location_id, guest_name, guest_phone, guest_email,
        guest_nationality, check_in, check_out, nights, base_amount,
        discount, discount_type, total_amount, paid_amount,
        payment_method, notes, staff_id
      } = req.body;

      const rows = await sql`
        INSERT INTO bookings (
          room_id, location_id, guest_name, guest_phone, guest_email,
          guest_nationality, check_in, check_out, nights, base_amount,
          discount, discount_type, total_amount, paid_amount,
          status, payment_method, notes, staff_id
        ) VALUES (
          ${room_id}, ${location_id}, ${guest_name}, ${guest_phone},
          ${guest_email || null}, ${guest_nationality || null},
          ${check_in}, ${check_out}, ${nights}, ${base_amount},
          ${discount || 0}, ${discount_type || 'pct'}, ${total_amount},
          ${paid_amount || 0}, 'pending', ${payment_method || 'Cash'},
          ${notes || null}, ${staff_id || null}
        )
        RETURNING *
      `;
      return res.status(201).json(rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Bookings error:', err);
    return res.status(500).json({ error: err.message });
  }
}
