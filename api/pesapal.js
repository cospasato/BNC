/**
 * PesaPal Payment Gateway Integration
 * Docs: https://developer.pesapal.com
 *
 * Required Vercel env vars:
 *   PESAPAL_CONSUMER_KEY    — from PesaPal merchant dashboard
 *   PESAPAL_CONSUMER_SECRET — from PesaPal merchant dashboard
 *   PESAPAL_ENV             — "sandbox" or "live"
 *   NEXT_PUBLIC_APP_URL     — your Vercel deployment URL e.g. https://massagetz.vercel.app
 */

const { getDb, setCors } = require('./_db.js');

const PESAPAL_BASE = process.env.PESAPAL_ENV === 'live'
  ? 'https://pay.pesapal.com/v3'
  : 'https://cybqa.pesapal.com/pesapalv3';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` || 'https://massagetz.com';

// ── Get PesaPal auth token ──────────────────────────────────
async function getToken() {
  const res = await fetch(`${PESAPAL_BASE}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      consumer_key:    process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }),
  });
  const data = await res.json();
  if (!data.token) throw new Error('PesaPal auth failed: ' + (data.message||JSON.stringify(data)));
  return data.token;
}

// ── Register IPN (once per deployment) ─────────────────────
async function registerIPN(token) {
  const res = await fetch(`${PESAPAL_BASE}/api/URLSetup/RegisterIPN`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      url:          `${APP_URL}/api/pesapal?action=ipn`,
      ipn_notification_type: 'POST',
    }),
  });
  const data = await res.json();
  return data.ipn_id;
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  try {
    // ── CREATE ORDER ─────────────────────────────────────────
    if (action === 'create' && req.method === 'POST') {
      const { appointment_id, amount, customer_name, customer_email, customer_phone, description } = req.body || {};
      if (!appointment_id || !amount) return res.status(400).json({ error: 'appointment_id and amount required' });

      const token  = await getToken();
      const ipn_id = await registerIPN(token);

      const orderRes = await fetch(`${PESAPAL_BASE}/api/Transactions/SubmitOrderRequest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          id:               appointment_id,
          currency:         'TZS',
          amount:           Number(amount),
          description:      description || 'Massage TZ Booking',
          callback_url:     `${APP_URL}/payment-complete?appt=${appointment_id}`,
          notification_id:  ipn_id,
          billing_address: {
            email_address: customer_email || 'customer@massagetz.com',
            phone_number:  customer_phone || '',
            first_name:    (customer_name||'Customer').split(' ')[0],
            last_name:     (customer_name||'Customer').split(' ').slice(1).join(' ') || '',
          },
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.redirect_url) {
        return res.status(500).json({ error: 'PesaPal order failed: ' + (orderData.message||JSON.stringify(orderData)) });
      }

      // Save payment record to DB
      const sql = getDb();
      await sql`
        INSERT INTO payments (appointment_id, amount, status, pesapal_order_id, redirect_url)
        VALUES (${appointment_id}, ${amount}, 'pending', ${orderData.order_tracking_id}, ${orderData.redirect_url})
        ON CONFLICT (appointment_id) DO UPDATE SET
          pesapal_order_id = ${orderData.order_tracking_id},
          redirect_url     = ${orderData.redirect_url},
          status           = 'pending'
      `.catch(()=>{}); // ignore if payments table doesn't exist yet

      return res.status(200).json({
        redirect_url:      orderData.redirect_url,
        order_tracking_id: orderData.order_tracking_id,
      });
    }

    // ── IPN CALLBACK (PesaPal notifies us of payment status) ─
    if (action === 'ipn') {
      const { orderTrackingId, orderNotificationType } = req.method === 'POST' ? req.body : req.query;
      if (!orderTrackingId) return res.status(200).json({ status: 'ok' });

      const token = await getToken();

      // Get transaction status from PesaPal
      const statusRes = await fetch(`${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const statusData = await statusRes.json();
      const paymentStatus = statusData.payment_status_description; // Completed, Failed, Invalid, Reversed

      if (paymentStatus === 'Completed') {
        const sql = getDb();
        // Find appointment by tracking id and mark as paid
        const rows = await sql`
          SELECT appointment_id FROM payments WHERE pesapal_order_id = ${orderTrackingId} LIMIT 1
        `.catch(()=>[]);

        if (rows.length) {
          const apptId = rows[0].appointment_id;
          const amount = statusData.amount;
          await sql`UPDATE payments SET status='completed', paid_at=NOW() WHERE pesapal_order_id=${orderTrackingId}`.catch(()=>{});
          await sql`UPDATE appointments SET paid_amount=LEAST(total_amount, paid_amount+${Number(amount)}), status='confirmed' WHERE id=${apptId}`.catch(()=>{});
        }
      }

      return res.status(200).json({ orderNotificationType, orderTrackingId, status: 200, message: 'done' });
    }

    // ── CHECK STATUS (frontend polls after redirect) ─────────
    if (action === 'status' && req.method === 'GET') {
      const { order_tracking_id, appointment_id } = req.query;
      if (!order_tracking_id) return res.status(400).json({ error: 'order_tracking_id required' });

      const token = await getToken();
      const statusRes = await fetch(`${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${order_tracking_id}`, {
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const data = await statusRes.json();

      // If completed, update appointment
      if (data.payment_status_description === 'Completed' && appointment_id) {
        const sql = getDb();
        await sql`UPDATE appointments SET paid_amount=LEAST(total_amount,${Number(data.amount)}), status='confirmed' WHERE id=${appointment_id}`.catch(()=>{});
      }

      return res.status(200).json({
        status:  data.payment_status_description,
        amount:  data.amount,
        method:  data.payment_method,
        message: data.message,
      });
    }

    return res.status(400).json({ error: 'Unknown action' });

  } catch(err) {
    console.error('PesaPal error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
