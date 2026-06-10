-- ============================================================
-- SPA / MASSAGE MANAGEMENT SYSTEM — FULL SCHEMA
-- Run entire file in Neon SQL Editor to set up fresh
-- ============================================================

-- ── STAFF ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
  id          TEXT PRIMARY KEY DEFAULT 'ST' || upper(substr(md5(random()::text), 1, 6)),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  phone       TEXT,
  role        TEXT NOT NULL DEFAULT 'Receptionist',  -- Admin | Manager | Receptionist | Therapist
  pin_hash    TEXT NOT NULL,
  commission_pct NUMERIC NOT NULL DEFAULT 0,   -- % of total sales for reception staff
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default admin (change immediately after setup)
INSERT INTO staff (id, name, email, role, pin_hash) VALUES
  ('ADMIN', 'Spa Owner', 'admin@massagetz.com', 'Admin', '0000')
ON CONFLICT (id) DO NOTHING;

-- ── THERAPISTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS therapists (
  id            TEXT PRIMARY KEY DEFAULT 'TH' || upper(substr(md5(random()::text), 1, 6)),
  name          TEXT NOT NULL,
  phone         TEXT,
  email         TEXT,
  bio           TEXT NOT NULL DEFAULT '',
  photo         TEXT,                               -- base64 or URL
  specialties   TEXT[] NOT NULL DEFAULT '{}',       -- e.g. ["Swedish","Deep Tissue"]
  outcall       BOOLEAN NOT NULL DEFAULT true,      -- available for home/hotel visits
  active        BOOLEAN NOT NULL DEFAULT true,
  commission_pct NUMERIC NOT NULL DEFAULT 0,   -- % of revenue earned by therapist
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ROOMS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id         TEXT PRIMARY KEY DEFAULT 'RM' || upper(substr(md5(random()::text), 1, 6)),
  name       TEXT NOT NULL,
  active     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SERVICES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id            TEXT PRIMARY KEY DEFAULT 'SV' || upper(substr(md5(random()::text), 1, 6)),
  name          TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'Massage',    -- Massage | Facial | Body | Wellness | Other
  description   TEXT NOT NULL DEFAULT '',
  duration_min  INTEGER NOT NULL DEFAULT 60,        -- minutes
  active        BOOLEAN NOT NULL DEFAULT true,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PRICING ──────────────────────────────────────────────────
-- Price per service varies by: room_type AND service_type (inhouse/outcall)
CREATE TABLE IF NOT EXISTS pricing (
  id            TEXT PRIMARY KEY DEFAULT 'PR' || upper(substr(md5(random()::text), 1, 6)),
  service_id    TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  room_id       TEXT,                               -- room id (null for outcall)
  service_type  TEXT NOT NULL DEFAULT 'inhouse',    -- inhouse | outcall
  price         BIGINT NOT NULL,                    -- TZS
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(service_id, room_id, service_type)
);

-- ── OFFERS / PROMOTIONS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS offers (
  id            TEXT PRIMARY KEY DEFAULT 'OF' || upper(substr(md5(random()::text), 1, 6)),
  name          TEXT NOT NULL,
  code          TEXT UNIQUE,                        -- optional promo code
  type          TEXT NOT NULL DEFAULT 'pct',        -- pct | fix
  value         NUMERIC NOT NULL,                   -- percentage or fixed amount
  min_amount    BIGINT NOT NULL DEFAULT 0,          -- minimum order to qualify
  valid_from    DATE,
  valid_to      DATE,
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CUSTOMERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id            TEXT PRIMARY KEY DEFAULT 'CU' || upper(substr(md5(random()::text), 1, 6)),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  phone         TEXT,
  nationality   TEXT,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── APPOINTMENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id              TEXT PRIMARY KEY DEFAULT 'AP' || upper(substr(md5(random()::text), 1, 6)),
  customer_id     TEXT REFERENCES customers(id),
  customer_name   TEXT NOT NULL,
  customer_phone  TEXT NOT NULL,
  customer_email  TEXT,
  therapist_id    TEXT REFERENCES therapists(id),
  room_id         TEXT REFERENCES rooms(id),
  service_type    TEXT NOT NULL DEFAULT 'inhouse',   -- inhouse | outcall
  outcall_address TEXT,                              -- for outcall
  appt_date       DATE NOT NULL,
  appt_time       TIME NOT NULL,
  duration_min    INTEGER NOT NULL DEFAULT 60,
  services        JSONB NOT NULL DEFAULT '[]',       -- [{id, name, price}]
  base_amount     BIGINT NOT NULL DEFAULT 0,
  discount        NUMERIC NOT NULL DEFAULT 0,
  discount_type   TEXT NOT NULL DEFAULT 'pct',
  total_amount    BIGINT NOT NULL DEFAULT 0,
  paid_amount     BIGINT NOT NULL DEFAULT 0,
  payment_method  TEXT NOT NULL DEFAULT 'Cash',
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','inProgress','completed','cancelled','noShow')),
  notes           TEXT,
  staff_id        TEXT,                              -- who created this record
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── RECEPTION LOG (walk-in recording) ────────────────────────
CREATE TABLE IF NOT EXISTS reception_log (
  id              TEXT PRIMARY KEY DEFAULT 'RL' || upper(substr(md5(random()::text), 1, 6)),
  customer_name   TEXT NOT NULL,
  customer_phone  TEXT,
  customer_email  TEXT,
  customer_id     TEXT REFERENCES customers(id),
  therapist_id    TEXT REFERENCES therapists(id),
  room_id         TEXT REFERENCES rooms(id),
  service_type    TEXT NOT NULL DEFAULT 'inhouse',
  services        JSONB NOT NULL DEFAULT '[]',
  in_time         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  out_time        TIMESTAMPTZ,
  base_amount     BIGINT NOT NULL DEFAULT 0,
  discount        NUMERIC NOT NULL DEFAULT 0,
  discount_type   TEXT NOT NULL DEFAULT 'pct',
  total_amount    BIGINT NOT NULL DEFAULT 0,
  paid_amount     BIGINT NOT NULL DEFAULT 0,
  payment_method  TEXT NOT NULL DEFAULT 'Cash',
  status          TEXT NOT NULL DEFAULT 'inProgress'
                    CHECK (status IN ('inProgress','completed','cancelled')),
  notes           TEXT,
  staff_id        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── EXPENSES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id            TEXT PRIMARY KEY DEFAULT 'EX' || upper(substr(md5(random()::text), 1, 6)),
  category      TEXT NOT NULL,
  description   TEXT NOT NULL,
  amount        BIGINT NOT NULL,
  expense_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  staff_id      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PAYMENT METHODS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_methods (
  id          TEXT PRIMARY KEY DEFAULT 'PM' || upper(substr(md5(random()::text), 1, 5)),
  name        TEXT NOT NULL UNIQUE,
  active      BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO payment_methods (name, sort_order) VALUES
  ('Cash', 1), ('M-Pesa', 2), ('Tigo Pesa', 3), ('Airtel Money', 4),
  ('Halopesa', 5), ('Bank Transfer', 6), ('Card', 7)
ON CONFLICT (name) DO NOTHING;

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_appt_date       ON appointments(appt_date);
CREATE INDEX IF NOT EXISTS idx_appt_status     ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appt_therapist  ON appointments(therapist_id);
CREATE INDEX IF NOT EXISTS idx_recep_in_time   ON reception_log(in_time);
CREATE INDEX IF NOT EXISTS idx_pricing_service ON pricing(service_id);

-- ── THERAPIST ACCOUNT MIGRATIONS ─────────────────────────────
-- Run these if you already have the therapists table:
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS pin_hash TEXT;
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS photos TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS availability TEXT NOT NULL DEFAULT 'available'
  CHECK (availability IN ('available','unavailable','outcall_only'));
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS email_unique TEXT UNIQUE;
-- Copy existing email to email_unique for login
UPDATE therapists SET email_unique = email WHERE email IS NOT NULL AND email_unique IS NULL;

-- ── PAYOUTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payouts (
  id            TEXT PRIMARY KEY DEFAULT 'PO' || upper(substr(md5(random()::text), 1, 6)),
  recipient_id  TEXT NOT NULL,               -- therapist id or staff id
  recipient_type TEXT NOT NULL DEFAULT 'therapist', -- therapist | staff
  recipient_name TEXT NOT NULL,
  amount        BIGINT NOT NULL,
  period_from   DATE NOT NULL,
  period_to     DATE NOT NULL,
  notes         TEXT,
  paid_by       TEXT,                        -- staff id who recorded payment
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PAYMENTS (PesaPal online payments) ───────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                TEXT PRIMARY KEY DEFAULT 'PM' || upper(substr(md5(random()::text), 1, 6)),
  appointment_id    TEXT UNIQUE REFERENCES appointments(id),
  amount            BIGINT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending',  -- pending | completed | failed
  pesapal_order_id  TEXT,
  redirect_url      TEXT,
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
