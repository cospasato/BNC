const { getDb, setCors, dbError } = require('./_db.js');

// ── Notification system ──────────────────────────────────────────────────────
// Supports multiple providers — configure via Vercel env vars

async function sendNotification(message) {
  const results = [];

  // ── Option 0: CallMeBot (free, works!) ──
  // Set: WA_PHONE (your number e.g. 255786203903), WA_API_KEY (from callmebot)
  if (process.env.WA_PHONE && process.env.WA_API_KEY) {
    try {
      const phone  = process.env.WA_PHONE;
      const apiKey = process.env.WA_API_KEY;
      const r = await fetch(
        `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`
      );
      const text = await r.text();
      const ok = text.toLowerCase().includes('message queued') || text.toLowerCase().includes('success');
      results.push({ provider: 'callmebot', ok, response: text.slice(0, 100) });
    } catch(e) { results.push({ provider: 'callmebot', ok: false, error: e.message }); }
  }

  // ── Option 1: Twilio WhatsApp (most reliable, free trial available) ──
  // Set: TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM (+14155238886 for sandbox), TWILIO_TO (+255786203903)
  if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
    try {
      const sid   = process.env.TWILIO_SID;
      const token = process.env.TWILIO_TOKEN;
      const from  = process.env.TWILIO_FROM || 'whatsapp:+14155238886';
      const to    = process.env.TWILIO_TO   || `whatsapp:+${process.env.WA_PHONE}`;
      const creds = Buffer.from(`${sid}:${token}`).toString('base64');
      const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ From: from, To: to, Body: message })
      });
      const d = await r.json();
      results.push({ provider: 'twilio', ok: !!d.sid, error: d.message });
    } catch(e) { results.push({ provider: 'twilio', ok: false, error: e.message }); }
  }

  // ── Option 2: WhatsApp Business API (Meta official) ──
  // Set: WA_TOKEN (permanent token from Meta), WA_PHONE_ID (Phone number ID from Meta), WA_TO (recipient number)
  if (process.env.WA_TOKEN && process.env.WA_PHONE_ID) {
    try {
      const r = await fetch(`https://graph.facebook.com/v18.0/${process.env.WA_PHONE_ID}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.WA_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: process.env.WA_TO || process.env.WA_PHONE,
          type: 'text',
          text: { body: message }
        })
      });
      const d = await r.json();
      results.push({ provider: 'meta', ok: !d.error, error: d.error?.message });
    } catch(e) { results.push({ provider: 'meta', ok: false, error: e.message }); }
  }

  // ── Option 3: UltraMsg (easy setup, $9/mo or free trial) ──
  // Set: ULTRAMSG_TOKEN, ULTRAMSG_INSTANCE, WA_TO (full number with country code)
  if (process.env.ULTRAMSG_TOKEN && process.env.ULTRAMSG_INSTANCE) {
    try {
      const r = await fetch(`https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE}/messages/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: process.env.ULTRAMSG_TOKEN,
          to: process.env.WA_TO || process.env.WA_PHONE,
          body: message
        })
      });
      const d = await r.json();
      results.push({ provider: 'ultramsg', ok: d.sent === 'true', error: d.error });
    } catch(e) { results.push({ provider: 'ultramsg', ok: false, error: e.message }); }
  }

  // ── Option 4: WA-Automate / WaAPI.app ──
  // Set: WAAPI_TOKEN, WAAPI_INSTANCE_ID, WA_TO
  if (process.env.WAAPI_TOKEN && process.env.WAAPI_INSTANCE_ID) {
    try {
      const r = await fetch(`https://waapi.app/api/v1/instances/${process.env.WAAPI_INSTANCE_ID}/client/action/send-message`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.WAAPI_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: `${process.env.WA_TO || process.env.WA_PHONE}@c.us`, message })
      });
      const d = await r.json();
      results.push({ provider: 'waapi', ok: d.status === 'success', error: d.message });
    } catch(e) { results.push({ provider: 'waapi', ok: false, error: e.message }); }
  }

  if (results.length === 0) console.log('No notification provider configured.');
  else console.log('Notification results:', JSON.stringify(results));
  return results;
}

// Helper to build booking message
function bookingMsg(type, data) {
  const emoji = type === 'walkin' ? '🚪' : '📅';
  const label = type === 'walkin' ? 'Walk-In Session' : 'New Booking';
  const svcs  = (data.services||[]).map(s=>s.name).join(', ') || 'TBD';
  const amt   = `TZS ${Number(data.total_amount||0).toLocaleString()}`;
  const loc   = data.service_type === 'outcall' ? '🏠 Outcall' : '🏢 In-House';
  const dt    = data.appt_date ? `${data.appt_date} at ${data.appt_time}` : 'Walk-in now';
  const gender = data.client_gender === 'female' ? '👩 Female' : data.client_gender === 'other' ? '⚧ Other' : '👨 Male';
  return (
    `${emoji} *${label} — MASSAGE TZ*\n` +
    `👤 ${data.customer_name}${data.customer_phone ? ' | ' + data.customer_phone : ''}\n` +
    (type==='walkin' ? `${gender}\n` : '') +
    `📋 ${svcs}\n` +
    `📆 ${dt}\n` +
    `${loc}\n` +
    `💰 ${amt}\n` +
    `💳 ${data.payment_method || 'TBD'}`
  );
}


module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  let sql;
  try { sql = getDb(); } catch (e) { return res.status(500).json({ error: e.message }); }

  const { resource, id, action } = req.query;

  try {

    // ── THERAPISTS ────────────────────────────────────────────
    if (resource === 'therapists') {
      if (req.method === 'GET') {
        await sql`ALTER TABLE therapists ADD COLUMN IF NOT EXISTS commission_pct NUMERIC NOT NULL DEFAULT 0`.catch(()=>{});
        const rows = await sql`SELECT * FROM therapists ORDER BY sort_order ASC, name ASC`;
        return res.status(200).json(rows);
      }
      if (req.method === 'POST') {
        const { name, phone, email, bio, photo, photos, specialties, outcall, pin, availability, commission_pct } = req.body || {};
        if (!name) return res.status(400).json({ error: 'name required' });
        let rows;
        try {
          rows = await sql`
            INSERT INTO therapists (name, phone, email, email_unique, bio, photo, photos, specialties, outcall, pin_hash, availability, commission_pct)
            VALUES (${name}, ${phone||null}, ${email||null}, ${email||null}, ${bio||''}, ${photo||null},
                    ${photos||[]}, ${specialties||[]}, ${outcall !== false}, ${pin||null}, ${availability||'available'}, ${commission_pct||0})
            RETURNING *`;
        } catch(e) {
          if (e.message && e.message.includes('does not exist')) {
            // Auto-add commission_pct column if missing then retry
            await sql`ALTER TABLE therapists ADD COLUMN IF NOT EXISTS commission_pct NUMERIC NOT NULL DEFAULT 0`.catch(()=>{});
            await sql`ALTER TABLE therapists ADD COLUMN IF NOT EXISTS photos TEXT[] NOT NULL DEFAULT '{}'`.catch(()=>{});
            await sql`ALTER TABLE therapists ADD COLUMN IF NOT EXISTS availability TEXT NOT NULL DEFAULT 'available'`.catch(()=>{});
            await sql`ALTER TABLE therapists ADD COLUMN IF NOT EXISTS email_unique TEXT`.catch(()=>{});
            rows = await sql`
              INSERT INTO therapists (name, phone, email, bio, photo, specialties, outcall)
              VALUES (${name}, ${phone||null}, ${email||null}, ${bio||''}, ${photo||null}, ${specialties||[]}, ${outcall !== false})
              RETURNING *`;
          } else throw e;
        }
        return res.status(201).json(rows[0]);
      }
      if (req.method === 'PUT' && id) {
        const { name, phone, email, bio, photo, photos, specialties, outcall, active, pin, availability, commission_pct } = req.body || {};
        let rows;
        try {
          if (pin) {
            rows = await sql`UPDATE therapists SET
              name         = COALESCE(${name         ?? null}, name),
              phone        = COALESCE(${phone        ?? null}, phone),
              email        = COALESCE(${email        ?? null}, email),
              email_unique = COALESCE(${email        ?? null}, email_unique),
              bio          = COALESCE(${bio          ?? null}, bio),
              photo        = COALESCE(${photo        ?? null}, photo),
              photos       = COALESCE(${photos       ?? null}, photos),
              specialties  = COALESCE(${specialties  ?? null}, specialties),
              outcall      = COALESCE(${outcall      ?? null}, outcall),
              availability  = COALESCE(${availability  ?? null}, availability),
              commission_pct= COALESCE(${commission_pct?? null}, commission_pct),
              active        = COALESCE(${active        ?? null}, active),
              pin_hash      = ${pin}
              WHERE id = ${id} RETURNING *`;
          } else {
            rows = await sql`UPDATE therapists SET
              name         = COALESCE(${name         ?? null}, name),
              phone        = COALESCE(${phone        ?? null}, phone),
              email        = COALESCE(${email        ?? null}, email),
              email_unique = COALESCE(${email        ?? null}, email_unique),
              bio          = COALESCE(${bio          ?? null}, bio),
              photo        = COALESCE(${photo        ?? null}, photo),
              photos       = COALESCE(${photos       ?? null}, photos),
              specialties  = COALESCE(${specialties  ?? null}, specialties),
              outcall      = COALESCE(${outcall      ?? null}, outcall),
              availability  = COALESCE(${availability  ?? null}, availability),
              commission_pct= COALESCE(${commission_pct ?? null}, commission_pct),
              active        = COALESCE(${active        ?? null}, active)
              WHERE id = ${id} RETURNING *`;
          }
        } catch(e) {
          if (e.message && e.message.includes('does not exist')) {
            rows = await sql`UPDATE therapists SET
              name        = COALESCE(${name        ?? null}, name),
              phone       = COALESCE(${phone       ?? null}, phone),
              email       = COALESCE(${email       ?? null}, email),
              bio         = COALESCE(${bio         ?? null}, bio),
              photo       = COALESCE(${photo       ?? null}, photo),
              specialties = COALESCE(${specialties ?? null}, specialties),
              outcall     = COALESCE(${outcall     ?? null}, outcall),
              active      = COALESCE(${active      ?? null}, active)
              WHERE id = ${id} RETURNING *`;
          } else throw e;
        }
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json(rows[0]);
      }
      if (req.method === 'DELETE' && id) {
        await sql`UPDATE therapists SET active = false WHERE id = ${id}`;
        return res.status(200).json({ success: true });
      }
    }

    // ── ROOMS ─────────────────────────────────────────────────
    // NOTE: We only use columns guaranteed to exist: id, name, active, created_at
    // description and amenities are added via setup migration
    if (resource === 'rooms') {
      // Use photos_json (TEXT) to store photos as JSON string — avoids TEXT[] size issues
      await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS photos_json TEXT NOT NULL DEFAULT '[]'`.catch(()=>{});

      const parseRoom = (r) => {
        try { r.photos = JSON.parse(r.photos_json || '[]'); } catch { r.photos = []; }
        return r;
      };

      if (req.method === 'GET') {
        const rows = await sql`SELECT * FROM rooms WHERE active = true ORDER BY name ASC`;
        return res.status(200).json(rows.map(parseRoom));
      }
      if (req.method === 'POST') {
        const { name, description, amenities, photos } = req.body || {};
        if (!name) return res.status(400).json({ error: 'name required' });
        const photosJson = JSON.stringify(photos || []);
        let rows;
        try {
          rows = await sql`
            INSERT INTO rooms (name, description, amenities, photos_json)
            VALUES (${name}, ${description||''}, ${amenities||[]}, ${photosJson})
            RETURNING *`;
        } catch(e) {
          rows = await sql`INSERT INTO rooms (name) VALUES (${name}) RETURNING *`;
        }
        return res.status(201).json(parseRoom(rows[0]));
      }
      if (req.method === 'PUT' && id) {
        const { name, description, amenities, active, photos } = req.body || {};
        const photosJson = photos !== undefined ? JSON.stringify(photos) : undefined;
        let rows;
        try {
          rows = await sql`
            UPDATE rooms SET
              name        = COALESCE(${name        ?? null}, name),
              description = COALESCE(${description ?? null}, description),
              amenities   = COALESCE(${amenities   ?? null}, amenities),
              photos_json = COALESCE(${photosJson  ?? null}, photos_json),
              active      = COALESCE(${active      ?? null}, active)
            WHERE id = ${id} RETURNING *`;
        } catch(e) {
          rows = await sql`
            UPDATE rooms SET name=COALESCE(${name??null},name),active=COALESCE(${active??null},active)
            WHERE id=${id} RETURNING *`;
        }
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json(parseRoom(rows[0]));
      }
      if (req.method === 'DELETE' && id) {
        await sql`UPDATE rooms SET active = false WHERE id = ${id}`;
        return res.status(200).json({ success: true });
      }
    }

    // ── SERVICES ──────────────────────────────────────────────
    if (resource === 'services') {
      if (req.method === 'GET') {
        const services = await sql`SELECT * FROM services WHERE active = true ORDER BY category, sort_order, name ASC`;
        const pricing  = await sql`SELECT * FROM pricing ORDER BY service_id, service_type`;
        return res.status(200).json({ services, pricing });
      }
      if (req.method === 'POST') {
        const { name, category, description, duration_min } = req.body || {};
        if (!name) return res.status(400).json({ error: 'name required' });
        const rows = await sql`
          INSERT INTO services (name, category, description, duration_min)
          VALUES (${name}, ${category||'Massage'}, ${description||''}, ${duration_min||60})
          RETURNING *`;
        return res.status(201).json(rows[0]);
      }
      if (req.method === 'PUT' && id) {
        const { name, category, description, duration_min, active } = req.body || {};
        const rows = await sql`
          UPDATE services SET
            name         = COALESCE(${name         ?? null}, name),
            category     = COALESCE(${category     ?? null}, category),
            description  = COALESCE(${description  ?? null}, description),
            duration_min = COALESCE(${duration_min ?? null}, duration_min),
            active       = COALESCE(${active       ?? null}, active)
          WHERE id = ${id} RETURNING *`;
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json(rows[0]);
      }
    }

    // ── PRICING ───────────────────────────────────────────────
    if (resource === 'pricing') {
      if (req.method === 'POST') {
        const { service_id, room_id, service_type, price } = req.body || {};
        if (!service_id || !price) return res.status(400).json({ error: 'service_id and price required' });
        const rid = room_id || null;
        // Check if a matching price already exists and update, otherwise insert
        const existing = await sql`
          SELECT id FROM pricing
          WHERE service_id = ${service_id}
            AND service_type = ${service_type||'inhouse'}
            AND (
              (room_id IS NOT NULL AND room_id = ${rid})
              OR (room_id IS NULL AND ${rid}::text IS NULL)
            )
          LIMIT 1`;
        let rows;
        if (existing.length) {
          rows = await sql`
            UPDATE pricing SET price = ${price}
            WHERE id = ${existing[0].id}
            RETURNING *`;
        } else {
          try {
            rows = await sql`
              INSERT INTO pricing (service_id, room_id, service_type, price)
              VALUES (${service_id}, ${rid}, ${service_type||'inhouse'}, ${price})
              RETURNING *`;
          } catch(e) {
            if (e.message && e.message.includes('does not exist')) {
              // Fallback: old schema without room_id column
              rows = await sql`
                INSERT INTO pricing (service_id, room_type, service_type, price)
                VALUES (${service_id}, ${rid||'Standard'}, ${service_type||'inhouse'}, ${price})
                RETURNING *`;
            } else throw e;
          }
        }
        return res.status(200).json(rows[0]);
      }
      if (req.method === 'DELETE' && id) {
        await sql`DELETE FROM pricing WHERE id = ${id}`;
        return res.status(200).json({ success: true });
      }
    }

    // ── OFFERS ────────────────────────────────────────────────
    if (resource === 'offers') {
      if (req.method === 'GET') {
        const rows = await sql`SELECT * FROM offers ORDER BY created_at DESC`;
        return res.status(200).json(rows);
      }
      if (req.method === 'POST') {
        const { name, code, type, value, min_amount, valid_from, valid_to } = req.body || {};
        if (!name || !value) return res.status(400).json({ error: 'name and value required' });
        const rows = await sql`
          INSERT INTO offers (name, code, type, value, min_amount, valid_from, valid_to)
          VALUES (${name}, ${code||null}, ${type||'pct'}, ${value}, ${min_amount||0}, ${valid_from||null}, ${valid_to||null})
          RETURNING *`;
        return res.status(201).json(rows[0]);
      }
      if (req.method === 'PUT' && id) {
        const { name, active } = req.body || {};
        const rows = await sql`
          UPDATE offers SET
            name   = COALESCE(${name   ?? null}, name),
            active = COALESCE(${active ?? null}, active)
          WHERE id = ${id} RETURNING *`;
        return res.status(200).json(rows[0]);
      }
      if (req.method === 'DELETE' && id) {
        await sql`DELETE FROM offers WHERE id = ${id}`;
        return res.status(200).json({ success: true });
      }
    }

    // ── APPOINTMENTS ──────────────────────────────────────────
    if (resource === 'appointments') {
      if (req.method === 'GET') {
        const { date, therapist_id, status: sf } = req.query;
        let rows;
        if (date && therapist_id)
          rows = await sql`SELECT a.*, t.name AS therapist_name, r.name AS room_name FROM appointments a LEFT JOIN therapists t ON t.id=a.therapist_id LEFT JOIN rooms r ON r.id=a.room_id WHERE a.appt_date=${date} AND a.therapist_id=${therapist_id} ORDER BY a.appt_time`;
        else if (date)
          rows = await sql`SELECT a.*, t.name AS therapist_name, r.name AS room_name FROM appointments a LEFT JOIN therapists t ON t.id=a.therapist_id LEFT JOIN rooms r ON r.id=a.room_id WHERE a.appt_date=${date} ORDER BY a.appt_time`;
        else if (sf)
          rows = await sql`SELECT a.*, t.name AS therapist_name, r.name AS room_name FROM appointments a LEFT JOIN therapists t ON t.id=a.therapist_id LEFT JOIN rooms r ON r.id=a.room_id WHERE a.status=${sf} ORDER BY a.appt_date DESC, a.appt_time`;
        else
          rows = await sql`SELECT a.*, t.name AS therapist_name, r.name AS room_name FROM appointments a LEFT JOIN therapists t ON t.id=a.therapist_id LEFT JOIN rooms r ON r.id=a.room_id ORDER BY a.appt_date DESC, a.appt_time DESC LIMIT 200`;
        return res.status(200).json(rows);
      }
      if (req.method === 'POST') {
        const { customer_id, customer_name, customer_phone, customer_email, therapist_id, room_id,
          service_type, outcall_address, appt_date, appt_time, duration_min,
          services, base_amount, discount, discount_type, total_amount, paid_amount,
          payment_method, notes, staff_id, status } = req.body || {};
        if (!customer_name || !customer_phone || !appt_date || !appt_time)
          return res.status(400).json({ error: 'customer_name, customer_phone, appt_date, appt_time required' });
        const rows = await sql`
          INSERT INTO appointments (customer_id, customer_name, customer_phone, customer_email,
            therapist_id, room_id, service_type, outcall_address, appt_date, appt_time,
            duration_min, services, base_amount, discount, discount_type, total_amount,
            paid_amount, payment_method, notes, staff_id, status)
          VALUES (${customer_id||null}, ${customer_name}, ${customer_phone}, ${customer_email||null},
            ${therapist_id||null}, ${room_id||null}, ${service_type||'inhouse'}, ${outcall_address||null},
            ${appt_date}, ${appt_time}, ${duration_min||60},
            ${JSON.stringify(services||[])}, ${base_amount||0}, ${discount||0},
            ${discount_type||'pct'}, ${total_amount||0}, ${paid_amount||0},
            ${payment_method||'Cash'}, ${notes||null}, ${staff_id||null}, ${status||'pending'})
          RETURNING *`;
        return res.status(201).json(rows[0]);
      }
      if (req.method === 'PUT' && id) {
        const { status, paid_amount, add_payment, payment_method } = req.body || {};
        let rows;
        if (add_payment !== undefined) {
          rows = await sql`UPDATE appointments SET
            paid_amount    = LEAST(total_amount, paid_amount + ${Number(add_payment)}),
            payment_method = COALESCE(${payment_method ?? null}, payment_method)
            WHERE id = ${id} RETURNING *`;
        } else {
          rows = await sql`UPDATE appointments SET
            status      = COALESCE(${status      ?? null}, status),
            paid_amount = COALESCE(${paid_amount ?? null}, paid_amount)
            WHERE id = ${id} RETURNING *`;
        }
        if (!rows?.length) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json(rows[0]);
      }
      if (req.method === 'DELETE' && id) {
        await sql`DELETE FROM appointments WHERE id = ${id}`;
        return res.status(200).json({ success: true });
      }
    }

    // ── RECEPTION LOG ─────────────────────────────────────────
    if (resource === 'reception') {
      await sql`ALTER TABLE reception_log ADD COLUMN IF NOT EXISTS client_gender TEXT NOT NULL DEFAULT 'male'`.catch(()=>{});
      if (req.method === 'GET') {
        const { date } = req.query;
        const rows = date
          ? await sql`SELECT r.*, t.name AS therapist_name, rm.name AS room_name FROM reception_log r LEFT JOIN therapists t ON t.id=r.therapist_id LEFT JOIN rooms rm ON rm.id=r.room_id WHERE r.in_time::date = ${date}::date ORDER BY r.in_time DESC`
          : await sql`SELECT r.*, t.name AS therapist_name, rm.name AS room_name FROM reception_log r LEFT JOIN therapists t ON t.id=r.therapist_id LEFT JOIN rooms rm ON rm.id=r.room_id ORDER BY r.in_time DESC LIMIT 100`;
        return res.status(200).json(rows);
      }
      if (req.method === 'POST') {
        const { customer_name, customer_phone, customer_email, customer_id, therapist_id, room_id,
          service_type, services, base_amount, discount, discount_type, total_amount,
          paid_amount, payment_method, notes, staff_id, status } = req.body || {};
        if (!customer_name) return res.status(400).json({ error: 'customer_name required' });
        const rows = await sql`
          INSERT INTO reception_log (customer_name, customer_phone, customer_email, customer_id,
            therapist_id, room_id, service_type, services, base_amount, discount, discount_type,
            total_amount, paid_amount, payment_method, notes, staff_id, status)
          VALUES (${customer_name}, ${customer_phone||null}, ${customer_email||null}, ${customer_id||null},
            ${therapist_id||null}, ${room_id||null}, ${service_type||'inhouse'},
            ${JSON.stringify(services||[])}, ${base_amount||0}, ${discount||0},
            ${discount_type||'pct'}, ${total_amount||0}, ${paid_amount||0},
            ${payment_method||'Cash'}, ${notes||null}, ${staff_id||null}, ${status||'inProgress'})
          RETURNING *`;
        return res.status(201).json(rows[0]);
      }
      if (req.method === 'PUT' && id) {
        const { out_time, status, paid_amount, add_payment, payment_method } = req.body || {};
        let rows;
        if (add_payment !== undefined) {
          rows = await sql`UPDATE reception_log SET
            paid_amount    = LEAST(total_amount, paid_amount + ${Number(add_payment)}),
            payment_method = COALESCE(${payment_method ?? null}, payment_method),
            out_time       = COALESCE(${out_time       ?? null}, out_time),
            status         = COALESCE(${status         ?? null}, status)
            WHERE id = ${id} RETURNING *`;
        } else {
          rows = await sql`UPDATE reception_log SET
            out_time       = COALESCE(${out_time    ?? null}, out_time),
            status         = COALESCE(${status      ?? null}, status),
            paid_amount    = COALESCE(${paid_amount ?? null}, paid_amount),
            payment_method = COALESCE(${payment_method ?? null}, payment_method)
            WHERE id = ${id} RETURNING *`;
        }
        if (!rows?.length) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json(rows[0]);
      }
    }

    // ── STAFF ─────────────────────────────────────────────────
    if (resource === 'staff') {
      if (req.method === 'GET' && action !== 'login') {
        await sql`ALTER TABLE staff ADD COLUMN IF NOT EXISTS commission_pct NUMERIC NOT NULL DEFAULT 0`.catch(()=>{});
        const rows = await sql`SELECT id,name,email,phone,role,COALESCE(commission_pct,0) AS commission_pct,active,created_at FROM staff ORDER BY created_at ASC`;
        return res.status(200).json(rows);
      }
      if (req.method === 'POST' && action === 'login') {
        const { email, pin } = req.body || {};
        const staffRows = await sql`SELECT id,name,email,role,active FROM staff WHERE lower(email)=lower(${email}) AND pin_hash=${pin} AND active=true LIMIT 1`;
        if (staffRows.length) return res.status(200).json({...staffRows[0], account_type:'staff'});
        const thRows = await sql`SELECT id,name,email_unique AS email,availability,active,'Therapist' AS role FROM therapists WHERE lower(email_unique)=lower(${email}) AND pin_hash=${pin} AND active=true LIMIT 1`.catch(()=>[]);
        if (thRows.length) return res.status(200).json({...thRows[0], account_type:'therapist'});
        return res.status(401).json({ error: 'Invalid email or PIN' });
      }
      if (req.method === 'POST') {
        const { name, email, phone, role, pin } = req.body || {};
        if (!name || !email || !pin) return res.status(400).json({ error: 'name, email, pin required' });
        const rows = await sql`INSERT INTO staff (name,email,phone,role,pin_hash) VALUES (${name},${email},${phone||null},${role||'Receptionist'},${pin}) RETURNING id,name,email,phone,role,active,created_at`;
        return res.status(201).json(rows[0]);
      }
      if (req.method === 'PUT' && id) {
        const { name, phone, role, pin, active, commission_pct } = req.body || {};
        const rows = pin
          ? await sql`UPDATE staff SET name=COALESCE(${name??null},name),phone=COALESCE(${phone??null},phone),role=COALESCE(${role??null},role),active=COALESCE(${active??null},active),commission_pct=COALESCE(${commission_pct??null},commission_pct),pin_hash=${pin} WHERE id=${id} RETURNING id,name,email,phone,role,commission_pct,active`
          : await sql`UPDATE staff SET name=COALESCE(${name??null},name),phone=COALESCE(${phone??null},phone),role=COALESCE(${role??null},role),active=COALESCE(${active??null},active),commission_pct=COALESCE(${commission_pct??null},commission_pct) WHERE id=${id} RETURNING id,name,email,phone,role,commission_pct,active`;
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json(rows[0]);
      }
      if (req.method === 'DELETE' && id) {
        const admins = await sql`SELECT COUNT(*)::int AS n FROM staff WHERE role='Admin' AND active=true`;
        const target = await sql`SELECT role FROM staff WHERE id=${id}`;
        if (!target.length) return res.status(404).json({ error: 'Not found' });
        if (target[0].role === 'Admin' && admins[0].n <= 1) return res.status(400).json({ error: 'Cannot delete the only Admin' });
        await sql`DELETE FROM staff WHERE id=${id}`;
        return res.status(200).json({ success: true });
      }
    }

    // ── PAYMENT METHODS ───────────────────────────────────────
    if (resource === 'payment_methods') {
      if (req.method === 'GET') {
        const rows = await sql`SELECT * FROM payment_methods ORDER BY sort_order ASC, name ASC`;
        return res.status(200).json(rows);
      }
      if (req.method === 'POST') {
        const { name } = req.body || {};
        if (!name) return res.status(400).json({ error: 'name required' });
        const rows = await sql`INSERT INTO payment_methods (name, sort_order) VALUES (${name}, (SELECT COALESCE(MAX(sort_order),0)+1 FROM payment_methods)) RETURNING *`;
        return res.status(201).json(rows[0]);
      }
      if (req.method === 'DELETE' && id) {
        await sql`DELETE FROM payment_methods WHERE id=${id}`;
        return res.status(200).json({ success: true });
      }
    }

    // ── CUSTOMERS ─────────────────────────────────────────────
    if (resource === 'customers') {
      if (req.method === 'POST' && action === 'register') {
        const { name, email, phone, password } = req.body || {};
        if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password required' });
        const ex = await sql`SELECT id FROM customers WHERE lower(email)=lower(${email})`;
        if (ex.length) return res.status(400).json({ error: 'Email already registered' });
        const rows = await sql`INSERT INTO customers (name,email,phone,password_hash) VALUES (${name},${email},${phone||null},${password}) RETURNING id,name,email,phone,created_at`;
        return res.status(201).json(rows[0]);
      }
      if (req.method === 'POST' && action === 'login') {
        const { email, password } = req.body || {};
        const rows = await sql`SELECT id,name,email,phone,created_at FROM customers WHERE lower(email)=lower(${email}) AND password_hash=${password} LIMIT 1`;
        if (!rows.length) return res.status(401).json({ error: 'Incorrect email or password' });
        return res.status(200).json(rows[0]);
      }
      if (req.method === 'GET' && id) {
        const appts = await sql`SELECT a.*, t.name AS therapist_name, r.name AS room_name FROM appointments a LEFT JOIN therapists t ON t.id=a.therapist_id LEFT JOIN rooms r ON r.id=a.room_id WHERE a.customer_id=${id} ORDER BY a.appt_date DESC, a.appt_time DESC`;
        return res.status(200).json(appts);
      }
    }

    // ── EXPENSES ──────────────────────────────────────────────
    if (resource === 'expenses') {
      if (req.method === 'GET') {
        const rows = await sql`SELECT * FROM expenses ORDER BY expense_date DESC, created_at DESC`;
        return res.status(200).json(rows);
      }
      if (req.method === 'POST') {
        const { category, description, amount, expense_date, staff_id } = req.body || {};
        if (!category || !amount) return res.status(400).json({ error: 'category and amount required' });
        const rows = await sql`INSERT INTO expenses (category,description,amount,expense_date,staff_id) VALUES (${category},${description||''},${amount},${expense_date||new Date().toISOString().split('T')[0]},${staff_id||null}) RETURNING *`;
        return res.status(201).json(rows[0]);
      }
    }

    // ── REPORTS ───────────────────────────────────────────────
    if (resource === 'reports') {
      const { date_from, date_to } = req.query;
      const df = date_from || '2000-01-01';
      const dt = date_to   || new Date().toISOString().split('T')[0];
      const [rev, expRows, byTherapist, byService, byMethod, byStatus] = await Promise.all([
        sql`SELECT COALESCE(SUM(paid_amount),0) AS collected, COALESCE(SUM(total_amount-paid_amount),0) AS pending, COALESCE(SUM(total_amount),0) AS invoiced, COUNT(*)::int AS total FROM appointments WHERE appt_date BETWEEN ${df} AND ${dt} AND status != 'cancelled'`,
        sql`SELECT category, COALESCE(SUM(amount),0) AS total FROM expenses WHERE expense_date BETWEEN ${df} AND ${dt} GROUP BY category`,
        sql`SELECT t.name, COUNT(a.id)::int AS appts, COALESCE(SUM(a.paid_amount),0) AS revenue FROM appointments a JOIN therapists t ON t.id=a.therapist_id WHERE a.appt_date BETWEEN ${df} AND ${dt} AND a.status != 'cancelled' GROUP BY t.id, t.name ORDER BY revenue DESC`,
        sql`SELECT svc->>'name' AS service_name, COUNT(*)::int AS count FROM appointments, jsonb_array_elements(services) AS svc WHERE appt_date BETWEEN ${df} AND ${dt} AND status != 'cancelled' GROUP BY svc->>'name' ORDER BY count DESC LIMIT 10`,
        sql`SELECT payment_method, COALESCE(SUM(paid_amount),0) AS total FROM appointments WHERE appt_date BETWEEN ${df} AND ${dt} AND paid_amount > 0 GROUP BY payment_method`,
        sql`SELECT status, COUNT(*)::int AS count FROM appointments WHERE appt_date BETWEEN ${df} AND ${dt} GROUP BY status`,
      ]);
      const totExp = expRows.reduce((s,e) => s+Number(e.total), 0);
      const r = rev[0];
      return res.status(200).json({
        revenue:      { collected: Number(r.collected), pending: Number(r.pending), invoiced: Number(r.invoiced) },
        expenses:     { total: totExp, by_category: expRows.map(e=>({category:e.category,total:Number(e.total)})) },
        net_profit:   Number(r.collected) - totExp,
        total_appts:  r.total,
        by_therapist: byTherapist.map(t=>({...t, revenue:Number(t.revenue)})),
        by_service:   byService,
        by_method:    byMethod.map(m=>({...m, total:Number(m.total)})),
        by_status:    byStatus,
        date_filter:  { from: date_from, to: date_to },
      });
    }

    // ── COMMISSION REPORT ────────────────────────────────────
    if (resource === 'commission') {
      const { date_from, date_to } = req.query;
      const df = date_from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const dt = date_to   || new Date().toISOString().split('T')[0];

      // Ensure columns exist
      await sql`ALTER TABLE therapists ADD COLUMN IF NOT EXISTS commission_pct NUMERIC NOT NULL DEFAULT 0`.catch(()=>{});
      await sql`ALTER TABLE staff ADD COLUMN IF NOT EXISTS commission_pct NUMERIC NOT NULL DEFAULT 0`.catch(()=>{});

      // Get ALL active therapists with their commission rate
      const allTherapists = await sql`SELECT id, name, COALESCE(commission_pct,0) AS commission_pct FROM therapists WHERE active = true`;

      // Revenue from appointments per therapist
      const apptRevByTh = await sql`
        SELECT therapist_id, COALESCE(SUM(paid_amount),0) AS revenue
        FROM appointments
        WHERE appt_date BETWEEN ${df} AND ${dt}
          AND status != 'cancelled'
          AND therapist_id IS NOT NULL
        GROUP BY therapist_id`.catch(()=>[]);

      // Revenue from reception_log per therapist
      const recepRevByTh = await sql`
        SELECT therapist_id, COALESCE(SUM(paid_amount),0) AS revenue
        FROM reception_log
        WHERE in_time::date BETWEEN ${df}::date AND ${dt}::date
          AND status = 'completed'
          AND therapist_id IS NOT NULL
        GROUP BY therapist_id`.catch(()=>[]);

      // Combine: show all therapists who have ANY revenue OR have a commission rate set
      const therapistCommissions = allTherapists
        .map(t => {
          const apptRev   = Number(apptRevByTh.find(r=>r.therapist_id===t.id)?.revenue||0);
          const recepRev  = Number(recepRevByTh.find(r=>r.therapist_id===t.id)?.revenue||0);
          const totalRev  = apptRev + recepRev;
          const pct       = Number(t.commission_pct||0);
          return {
            therapist_id:       t.id,
            name:               t.name,
            commission_pct:     pct,
            revenue:            totalRev,
            appt_revenue:       apptRev,
            recep_revenue:      recepRev,
            commission_amount:  Math.round(totalRev * pct / 100),
          };
        })
        .filter(t => t.revenue > 0 || t.commission_pct > 0); // show if they worked OR have a rate

      // Total sales (appointments + reception combined)
      const apptTotal  = await sql`SELECT COALESCE(SUM(paid_amount),0) AS total FROM appointments WHERE appt_date BETWEEN ${df} AND ${dt} AND status != 'cancelled'`;
      const recepTotal = await sql`SELECT COALESCE(SUM(paid_amount),0) AS total FROM reception_log WHERE in_time::date BETWEEN ${df}::date AND ${dt}::date AND status = 'completed'`;
      const totalSales = Number(apptTotal[0].total) + Number(recepTotal[0].total);

      // Staff commissions — show ALL active staff with a rate (not just > 0)
      const staffList = await sql`SELECT id, name, role, COALESCE(commission_pct,0) AS commission_pct FROM staff WHERE active = true`;
      const staffCommissions = staffList
        .filter(s => Number(s.commission_pct) > 0)
        .map(s => ({
          ...s,
          total_sales:        totalSales,
          commission_amount:  Math.round(totalSales * Number(s.commission_pct) / 100),
        }));

      return res.status(200).json({
        period: { from: df, to: dt },
        total_sales: totalSales,
        therapist_commissions: therapistCommissions,
        staff_commissions: staffCommissions,
      });
    }

        // ── PAYOUTS ──────────────────────────────────────────────
    if (resource === 'payouts') {
      // Ensure table exists
      await sql`CREATE TABLE IF NOT EXISTS payouts (
        id            TEXT PRIMARY KEY DEFAULT 'PO' || upper(substr(md5(random()::text), 1, 6)),
        recipient_id  TEXT NOT NULL,
        recipient_type TEXT NOT NULL DEFAULT 'therapist',
        recipient_name TEXT NOT NULL,
        amount        BIGINT NOT NULL,
        period_from   DATE NOT NULL,
        period_to     DATE NOT NULL,
        notes         TEXT,
        paid_by       TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`.catch(()=>{});

      if (req.method === 'GET') {
        const { recipient_id } = req.query;
        const rows = recipient_id
          ? await sql`SELECT * FROM payouts WHERE recipient_id=${recipient_id} ORDER BY created_at DESC`
          : await sql`SELECT * FROM payouts ORDER BY created_at DESC LIMIT 200`;
        return res.status(200).json(rows);
      }
      if (req.method === 'POST') {
        const { recipient_id, recipient_type, recipient_name, amount, period_from, period_to, notes, paid_by } = req.body || {};
        if (!recipient_id || !amount || !period_from || !period_to)
          return res.status(400).json({ error: 'recipient_id, amount, period_from, period_to required' });
        const rows = await sql`
          INSERT INTO payouts (recipient_id, recipient_type, recipient_name, amount, period_from, period_to, notes, paid_by)
          VALUES (${recipient_id}, ${recipient_type||'therapist'}, ${recipient_name||''}, ${amount}, ${period_from}, ${period_to}, ${notes||null}, ${paid_by||null})
          RETURNING *`;
        return res.status(201).json(rows[0]);
      }
      if (req.method === 'DELETE' && id) {
        await sql`DELETE FROM payouts WHERE id=${id}`;
        return res.status(200).json({ success: true });
      }
    }

        // ── PACKAGES ─────────────────────────────────────────────
    if (resource === 'packages') {
      await sql`CREATE TABLE IF NOT EXISTS packages (
        id           TEXT PRIMARY KEY DEFAULT 'PKG' || upper(substr(md5(random()::text), 1, 6)),
        name         TEXT NOT NULL,
        description  TEXT NOT NULL DEFAULT '',
        room_id      TEXT REFERENCES rooms(id) ON DELETE SET NULL,
        services     JSONB NOT NULL DEFAULT '[]',
        masseuses    INTEGER NOT NULL DEFAULT 1,
        amenities    TEXT[] NOT NULL DEFAULT '{}',
        price        BIGINT NOT NULL DEFAULT 0,
        duration_min INTEGER NOT NULL DEFAULT 60,
        active       BOOLEAN NOT NULL DEFAULT true,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`.catch(()=>{});

      if (req.method === 'GET') {
        const rows = await sql`
          SELECT p.*, r.name AS room_name FROM packages p
          LEFT JOIN rooms r ON r.id = p.room_id
          WHERE p.active = true ORDER BY p.created_at DESC`;
        return res.status(200).json(rows);
      }
      if (req.method === 'POST') {
        const { name, description, room_id, services, masseuses, amenities, price, duration_min } = req.body || {};
        if (!name || !price) return res.status(400).json({ error: 'name and price required' });
        const rows = await sql`
          INSERT INTO packages (name, description, room_id, services, masseuses, amenities, price, duration_min)
          VALUES (${name}, ${description||''}, ${room_id||null}, ${JSON.stringify(services||[])},
                  ${masseuses||1}, ${amenities||[]}, ${price}, ${duration_min||60})
          RETURNING *`;
        return res.status(201).json(rows[0]);
      }
      if (req.method === 'PUT' && id) {
        const { name, description, room_id, services, masseuses, amenities, price, duration_min, active } = req.body || {};
        const rows = await sql`
          UPDATE packages SET
            name         = COALESCE(${name         ?? null}, name),
            description  = COALESCE(${description  ?? null}, description),
            room_id      = COALESCE(${room_id      ?? null}, room_id),
            services     = COALESCE(${services ? JSON.stringify(services) : null}, services),
            masseuses    = COALESCE(${masseuses    ?? null}, masseuses),
            amenities    = COALESCE(${amenities    ?? null}, amenities),
            price        = COALESCE(${price        ?? null}, price),
            duration_min = COALESCE(${duration_min ?? null}, duration_min),
            active       = COALESCE(${active       ?? null}, active)
          WHERE id = ${id} RETURNING *`;
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json(rows[0]);
      }
      if (req.method === 'DELETE' && id) {
        await sql`UPDATE packages SET active = false WHERE id = ${id}`;
        return res.status(200).json({ success: true });
      }
    }

        // ── FINES / PENALTIES ─────────────────────────────────────
    if (resource === 'fines') {
      await sql`CREATE TABLE IF NOT EXISTS fines (
        id             TEXT PRIMARY KEY DEFAULT 'FN' || upper(substr(md5(random()::text), 1, 6)),
        recipient_id   TEXT NOT NULL,
        recipient_type TEXT NOT NULL DEFAULT 'therapist',
        recipient_name TEXT NOT NULL,
        amount         BIGINT NOT NULL,
        notes          TEXT,
        created_by     TEXT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`.catch(()=>{});

      if (req.method === 'GET') {
        const { recipient_id } = req.query;
        const rows = recipient_id
          ? await sql`SELECT * FROM fines WHERE recipient_id=${recipient_id} ORDER BY created_at DESC`
          : await sql`SELECT * FROM fines ORDER BY created_at DESC LIMIT 500`;
        return res.status(200).json(rows);
      }
      if (req.method === 'POST') {
        const { recipient_id, recipient_type, recipient_name, amount, notes, created_by } = req.body || {};
        if (!recipient_id || !amount) return res.status(400).json({ error: 'recipient_id and amount required' });
        const rows = await sql`
          INSERT INTO fines (recipient_id, recipient_type, recipient_name, amount, notes, created_by)
          VALUES (${recipient_id}, ${recipient_type||'therapist'}, ${recipient_name||''}, ${amount}, ${notes||null}, ${created_by||null})
          RETURNING *`;
        return res.status(201).json(rows[0]);
      }
      if (req.method === 'DELETE' && id) {
        await sql`DELETE FROM fines WHERE id=${id}`;
        return res.status(200).json({ success: true });
      }
    }

        // ── TEST NOTIFICATION ────────────────────────────────────────
    if (resource === 'test_notify') {
      const results = await sendNotification(
        '✅ *MASSAGE TZ Notification Test*\nYour notification system is working correctly!'
      );
      return res.status(200).json({ results });
    }

    // ── VIDEOS ───────────────────────────────────────────────────
    if (resource === 'videos') {
      await sql`CREATE TABLE IF NOT EXISTS videos (
        id           TEXT PRIMARY KEY DEFAULT 'VID' || upper(substr(md5(random()::text),1,6)),
        url          TEXT NOT NULL,
        source       TEXT NOT NULL DEFAULT 'youtube',
        title        TEXT NOT NULL DEFAULT '',
        thumbnail    TEXT,
        published_at TIMESTAMPTZ,
        active       BOOLEAN NOT NULL DEFAULT true,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`.catch(()=>{});
      await sql`ALTER TABLE videos ADD COLUMN IF NOT EXISTS thumbnail TEXT`.catch(()=>{});
      await sql`ALTER TABLE videos ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ`.catch(()=>{});

      // ── GET: return manual videos + optionally fetch YouTube channel videos ──
      if (req.method === 'GET') {
        const { fetch_yt } = req.query;
        let manual = await sql`SELECT * FROM videos WHERE active=true ORDER BY COALESCE(published_at, created_at) DESC`;

        // Auto-fetch latest YouTube videos from configured channel
        if (fetch_yt === '1' && process.env.YT_API_KEY && process.env.YT_CHANNEL_ID) {
          try {
            const channelId = process.env.YT_CHANNEL_ID;
            const apiKey    = process.env.YT_API_KEY;
            // Uploads playlist = channel ID with UC -> UU
            const playlistId = channelId.replace(/^UC/, 'UU');
            const ytRes = await fetch(
              `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=20&key=${apiKey}`
            );
            const ytData = await ytRes.json();
            const ytVideos = (ytData.items||[]).map(item => ({
              id:           'YT_' + item.snippet.resourceId.videoId,
              url:          `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
              source:       'youtube',
              title:        item.snippet.title,
              thumbnail:    item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
              published_at: item.snippet.publishedAt,
              created_at:   item.snippet.publishedAt,
              _auto:        true,
            }));
            // Merge: manual overrides auto (if same video URL exists manually, keep manual)
            const manualUrls = new Set(manual.map(v=>v.url));
            const merged = [
              ...manual,
              ...ytVideos.filter(v=>!manualUrls.has(v.url))
            ].sort((a,b)=>new Date(b.published_at||b.created_at)-new Date(a.published_at||a.created_at));
            return res.status(200).json(merged);
          } catch(e) {
            console.warn('YouTube fetch failed:', e.message);
          }
        }
        return res.status(200).json(manual);
      }

      // ── POST: add manual video ──
      if (req.method === 'POST') {
        const { url, source, title, thumbnail, published_at } = req.body || {};
        if (!url) return res.status(400).json({ error: 'url required' });
        const src = source || (url.includes('tiktok') ? 'tiktok' : url.includes('instagram') ? 'instagram' : url.includes('facebook') ? 'facebook' : 'youtube');
        const rows = await sql`
          INSERT INTO videos (url, source, title, thumbnail, published_at)
          VALUES (${url}, ${src}, ${title||''}, ${thumbnail||null}, ${published_at||null})
          RETURNING *`;
        return res.status(201).json(rows[0]);
      }
      if (req.method === 'DELETE' && id) {
        await sql`UPDATE videos SET active=false WHERE id=${id}`;
        return res.status(200).json({ success: true });
      }
    }

    // ── SOCIAL SETTINGS ──────────────────────────────────────────
    if (resource === 'social_settings') {
      await sql`CREATE TABLE IF NOT EXISTS social_settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL DEFAULT ''
      )`.catch(()=>{});
      if (req.method === 'GET') {
        const rows = await sql`SELECT * FROM social_settings`;
        const obj = {};
        rows.forEach(r => obj[r.key] = r.value);
        return res.status(200).json(obj);
      }
      if (req.method === 'POST') {
        const settings = req.body || {};
        for (const [key, value] of Object.entries(settings)) {
          await sql`INSERT INTO social_settings(key,value) VALUES(${key},${value})
                    ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value`;
        }
        return res.status(200).json({ ok: true });
      }
    }

        return res.status(400).json({ error: `Unknown resource: ${resource}` });

  } catch (err) {
    console.error('spa API error:', err.message, err.stack);
    return res.status(500).json({ error: err.message });
  }
};
