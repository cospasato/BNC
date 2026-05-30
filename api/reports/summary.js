// api/reports/summary.js
import { getDb, setCors } from '../_db.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const sql = getDb();
  const { location_id } = req.query;

  try {
    const locFilter = location_id ? sql`AND b.location_id = ${location_id}` : sql``;
    const expLocFilter = location_id ? sql`WHERE location_id = ${location_id}` : sql``;

    // Revenue stats
    const revenueRows = await sql`
      SELECT
        COALESCE(SUM(paid_amount), 0) AS total_collected,
        COALESCE(SUM(total_amount - paid_amount), 0) AS total_pending,
        COALESCE(SUM(base_amount - total_amount), 0) AS total_discounts,
        COALESCE(SUM(total_amount), 0) AS total_invoiced,
        COUNT(*) AS total_bookings,
        COUNT(*) FILTER (WHERE status = 'checkedIn') AS active_bookings,
        COUNT(*) FILTER (WHERE status = 'checkedOut') AS completed_bookings,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_bookings,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_bookings,
        COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed_bookings
      FROM bookings b
      WHERE 1=1 ${locFilter}
    `;

    // Expense stats
    const expenseRows = await sql`
      SELECT
        COALESCE(SUM(amount), 0) AS total_expenses,
        category,
        COALESCE(SUM(amount), 0) AS category_total
      FROM expenses
      ${expLocFilter}
      GROUP BY category
    `;

    // Revenue by location
    const byLocation = await sql`
      SELECT
        l.id, l.name, l.icon, l.city,
        COALESCE(SUM(b.paid_amount), 0) AS revenue,
        COALESCE(SUM(b.total_amount - b.paid_amount), 0) AS pending,
        COUNT(b.id) AS bookings
      FROM locations l
      LEFT JOIN bookings b ON b.location_id = l.id
      GROUP BY l.id, l.name, l.icon, l.city
      ORDER BY revenue DESC
    `;

    // Payment methods
    const byMethod = await sql`
      SELECT payment_method, COALESCE(SUM(paid_amount), 0) AS total
      FROM bookings
      WHERE paid_amount > 0
      GROUP BY payment_method
    `;

    const rev = revenueRows[0];
    const totalExpenses = expenseRows.reduce((s, e) => s + Number(e.category_total), 0);

    return res.status(200).json({
      revenue: {
        total_collected: Number(rev.total_collected),
        total_pending: Number(rev.total_pending),
        total_discounts: Number(rev.total_discounts),
        total_invoiced: Number(rev.total_invoiced),
        net_profit: Number(rev.total_collected) - totalExpenses,
      },
      bookings: {
        total: Number(rev.total_bookings),
        active: Number(rev.active_bookings),
        completed: Number(rev.completed_bookings),
        cancelled: Number(rev.cancelled_bookings),
        pending: Number(rev.pending_bookings),
        confirmed: Number(rev.confirmed_bookings),
      },
      expenses: {
        total: totalExpenses,
        by_category: expenseRows.map(e => ({ category: e.category, total: Number(e.category_total) })),
      },
      by_location: byLocation.map(l => ({ ...l, revenue: Number(l.revenue), pending: Number(l.pending), bookings: Number(l.bookings) })),
      by_method: byMethod.map(m => ({ method: m.payment_method, total: Number(m.total) })),
    });
  } catch (err) {
    console.error('Reports error:', err);
    return res.status(500).json({ error: err.message });
  }
}
