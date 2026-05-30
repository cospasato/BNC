// api/bookings/[id].js
import { getDb, setCors } from '../_db.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getDb();
  const { id } = req.query;

  try {
    if (req.method === 'PUT') {
      const { status, paid_amount, add_payment } = req.body;

      // If adding a payment increment
      if (add_payment !== undefined) {
        const rows = await sql`
          UPDATE bookings SET
            paid_amount = LEAST(total_amount, paid_amount + ${Number(add_payment)})
          WHERE id = ${id}
          RETURNING *
        `;
        // Auto-update room status when checked in/out
        if (rows[0]) {
          const b = rows[0];
          if (b.status === 'checkedIn') {
            await sql`UPDATE rooms SET status = 'occupied' WHERE id = ${b.room_id}`;
          }
        }
        return res.status(200).json(rows[0]);
      }

      // Updating status
      const rows = await sql`
        UPDATE bookings SET
          status = COALESCE(${status}, status),
          paid_amount = COALESCE(${paid_amount ?? null}, paid_amount)
        WHERE id = ${id}
        RETURNING *
      `;

      if (rows[0]) {
        const b = rows[0];
        if (status === 'checkedIn') {
          await sql`UPDATE rooms SET status = 'occupied' WHERE id = ${b.room_id}`;
        } else if (status === 'checkedOut' || status === 'cancelled') {
          await sql`UPDATE rooms SET status = 'available' WHERE id = ${b.room_id}`;
        }
      }
      return res.status(200).json(rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Booking update error:', err);
    return res.status(500).json({ error: err.message });
  }
}
