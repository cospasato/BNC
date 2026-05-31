// api/expenses/index.js
import { getDb, setCors } from '../_db.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getDb();

  try {
    if (req.method === 'GET') {
      const { location_id } = req.query;
      const rows = location_id
        ? await sql`SELECT * FROM expenses WHERE location_id = ${location_id} ORDER BY expense_date DESC`
        : await sql`SELECT * FROM expenses ORDER BY expense_date DESC`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { location_id, category, description, amount, expense_date, staff_id } = req.body;
      const rows = await sql`
        INSERT INTO expenses (location_id, category, description, amount, expense_date, staff_id)
        VALUES (${location_id}, ${category}, ${description}, ${amount}, ${expense_date || new Date().toISOString().split('T')[0]}, ${staff_id || null})
        RETURNING *
      `;
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await sql`DELETE FROM expenses WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Expenses error:', err);
    return res.status(500).json({ error: dbError(err) });
  }
}
