const { getDb, setCors, dbError } = require('./_db.js');

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
        const rows = await sql`SELECT * FROM therapists ORDER BY sort_order ASC, name ASC`;
        return res.status(200).json(rows);
      }
      if (req.method === 'POST') {
        const { name, phone, email, bio, photo, photos, specialties, outcall, pin, availability } = req.body || {};
        if (!name) return res.status(400).json({ error: 'name required' });
        let rows;
        try {
          rows = await sql`
            INSERT INTO therapists (name, phone, email, email_unique, bio, photo, photos, specialties, outcall, pin_hash, availability)
            VALUES (${name}, ${phone||null}, ${email||null}, ${email||null}, ${bio||''}, ${photo||null},
                    ${photos||[]}, ${specialties||[]}, ${outcall !== false}, ${pin||null}, ${availability||'available'})
            RETURNING *`;
        } catch(e) {
          if (e.message && e.message.includes('does not exist')) {
            rows = await sql`
              INSERT INTO therapists (name, phone, email, bio, photo, specialties, outcall)
              VALUES (${name}, ${phone||null}, ${email||null}, ${bio||''}, ${photo||null}, ${specialties||[]}, ${outcall !== false})
              RETURNING *`;
          } else throw e;
        }
        return res.status(201).json(rows[0]);
      }
      if (req.method === 'PUT' && id) {
        const { name, phone, email, bio, photo, photos, specialties, outcall, active, pin, availability } = req.body || {};
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
              availability = COALESCE(${availability ?? null}, availability),
              active       = COALESCE(${active       ?? null}, active),
              pin_hash     = ${pin}
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
              availability = COALESCE(${availability ?? null}, availability),
              active       = COALESCE(${active       ?? null}, active)
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
      if (req.method === 'GET') {
        const rows = await sql`SELECT * FROM rooms WHERE active = true ORDER BY name ASC`;
        return res.status(200).json(rows);
      }
      if (req.method === 'POST') {
        const { name, description, amenities } = req.body || {};
        if (!name) return res.status(400).json({ error: 'name required' });
        // Try with description+amenities, fall back to name-only if columns missing
        let rows;
        try {
          rows = await sql`
            INSERT INTO rooms (name, description, amenities)
            VALUES (${name}, ${description||''}, ${amenities||[]})
            RETURNING *`;
        } catch(e) {
          if (e.message && e.message.includes('does not exist')) {
            rows = await sql`INSERT INTO rooms (name) VALUES (${name}) RETURNING *`;
          } else throw e;
        }
        return res.status(201).json(rows[0]);
      }
      if (req.method === 'PUT' && id) {
        const { name, description, amenities, active } = req.body || {};
        let rows;
        try {
          rows = await sql`
            UPDATE rooms SET
              name        = COALESCE(${name        ?? null}, name),
              description = COALESCE(${description ?? null}, description),
              amenities   = COALESCE(${amenities   ?? null}, amenities),
              active      = COALESCE(${active      ?? null}, active)
            WHERE id = ${id} RETURNING *`;
        } catch(e) {
          if (e.message && e.message.includes('does not exist')) {
            rows = await sql`
              UPDATE rooms SET
                name   = COALESCE(${name   ?? null}, name),
                active = COALESCE(${active ?? null}, active)
              WHERE id = ${id} RETURNING *`;
          } else throw e;
        }
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json(rows[0]);
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
        let rows;
        try {
          rows = await sql`
            INSERT INTO pricing (service_id, room_id, service_type, price)
            VALUES (${service_id}, ${rid}, ${service_type||'inhouse'}, ${price})
            ON CONFLICT (service_id, room_id, service_type)
            DO UPDATE SET price = ${price}
            RETURNING *`;
        } catch(e) {
          if (e.message && e.message.includes('does not exist')) {
            // Fallback: old schema uses room_type TEXT column
            rows = await sql`
              INSERT INTO pricing (service_id, room_type, service_type, price)
              VALUES (${service_id}, ${rid||'Standard'}, ${service_type||'inhouse'}, ${price})
              ON CONFLICT (service_id, room_type, service_type)
              DO UPDATE SET price = ${price}
              RETURNING *`;
          } else throw e;
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
        const rows = await sql`SELECT id,name,email,phone,role,active,created_at FROM staff ORDER BY created_at ASC`;
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
        const { name, phone, role, pin, active } = req.body || {};
        const rows = pin
          ? await sql`UPDATE staff SET name=COALESCE(${name??null},name),phone=COALESCE(${phone??null},phone),role=COALESCE(${role??null},role),active=COALESCE(${active??null},active),pin_hash=${pin} WHERE id=${id} RETURNING id,name,email,phone,role,active`
          : await sql`UPDATE staff SET name=COALESCE(${name??null},name),phone=COALESCE(${phone??null},phone),role=COALESCE(${role??null},role),active=COALESCE(${active??null},active) WHERE id=${id} RETURNING id,name,email,phone,role,active`;
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

    return res.status(400).json({ error: `Unknown resource: ${resource}` });

  } catch (err) {
    console.error('spa API error:', err.message, err.stack);
    return res.status(500).json({ error: err.message });
  }
};
