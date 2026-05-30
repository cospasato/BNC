-- ============================================================
-- BNC APARTMENT LODGE — DATABASE SCHEMA
-- Run this SQL once in your Neon SQL Editor to set up the DB
-- https://console.neon.tech → Your Project → SQL Editor
-- ============================================================

-- LOCATIONS
CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY DEFAULT 'L' || substr(md5(random()::text), 1, 6),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  icon TEXT DEFAULT '🏙️',
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROOMS
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY DEFAULT 'R' || substr(md5(random()::text), 1, 6),
  location_id TEXT REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Standard',
  beds INTEGER DEFAULT 1,
  max_guests INTEGER DEFAULT 2,
  price_per_night BIGINT NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available','occupied','maintenance')),
  amenities TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY DEFAULT 'B' || substr(md5(random()::text), 1, 6),
  room_id TEXT REFERENCES rooms(id),
  location_id TEXT REFERENCES locations(id),
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT,
  guest_nationality TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INTEGER NOT NULL,
  base_amount BIGINT NOT NULL,
  discount NUMERIC DEFAULT 0,
  discount_type TEXT DEFAULT 'pct' CHECK (discount_type IN ('pct','fix')),
  total_amount BIGINT NOT NULL,
  paid_amount BIGINT DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','checkedIn','checkedOut','cancelled')),
  payment_method TEXT DEFAULT 'Cash',
  notes TEXT,
  staff_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY DEFAULT 'E' || substr(md5(random()::text), 1, 6),
  location_id TEXT REFERENCES locations(id),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount BIGINT NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  staff_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STAFF
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY DEFAULT 'S' || substr(md5(random()::text), 1, 6),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'Receptionist',
  location_id TEXT REFERENCES locations(id),
  pin_hash TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEED DATA — Sample locations, rooms, staff
-- ============================================================

INSERT INTO locations (id, name, city, address, icon, description) VALUES
  ('L1', 'BNC Msasani', 'Dar es Salaam', 'Msasani Peninsula, DSM', '🏙️', 'Upscale waterfront lodge in the heart of the peninsula'),
  ('L2', 'BNC Mikocheni', 'Dar es Salaam', 'Mikocheni B, DSM', '🌿', 'Serene garden lodge away from the city bustle'),
  ('L3', 'BNC Stone Town', 'Zanzibar', 'Stone Town, Zanzibar', '🏛️', 'Heritage lodge in historic Stone Town')
ON CONFLICT (id) DO NOTHING;

INSERT INTO rooms (id, location_id, name, type, beds, max_guests, price_per_night, status, amenities) VALUES
  ('R1','L1','Penthouse Suite','Suite',2,4,280000,'available',ARRAY['WiFi','AC','Pool','Kitchen','Parking']),
  ('R2','L1','Deluxe Ocean View','Deluxe',1,2,180000,'available',ARRAY['WiFi','AC','Sea View','Breakfast']),
  ('R3','L1','Standard Room A','Standard',1,2,95000,'available',ARRAY['WiFi','AC','TV']),
  ('R4','L1','Family Apartment','Apartment',3,6,320000,'available',ARRAY['WiFi','AC','Kitchen','Parking']),
  ('R5','L2','Garden Cottage','Cottage',1,2,140000,'available',ARRAY['WiFi','AC','Garden','Breakfast']),
  ('R6','L2','Executive Studio','Studio',1,2,110000,'maintenance',ARRAY['WiFi','AC','Kitchenette']),
  ('R7','L2','Premium Suite','Suite',2,4,260000,'available',ARRAY['WiFi','AC','Lounge','Kitchen']),
  ('R8','L3','Heritage Room','Standard',1,2,130000,'available',ARRAY['WiFi','AC','Historic View']),
  ('R9','L3','Sultan Suite','Suite',2,4,310000,'available',ARRAY['WiFi','AC','Rooftop','Breakfast'])
ON CONFLICT (id) DO NOTHING;

-- Admin PIN: 0000 (stored as plain text here for demo; hash in production)
INSERT INTO staff (id, name, email, phone, role, location_id, pin_hash, active) VALUES
  ('ADMIN','BNC Admin','admin@bnc.co.tz',NULL,'Admin',NULL,'0000',true),
  ('S1','Jane Mwangi','jane@bnc.co.tz','+255 712 000 001','Manager','L1','1234',true),
  ('S2','Peter Salum','peter@bnc.co.tz','+255 754 000 002','Receptionist','L3','5678',true)
ON CONFLICT (id) DO NOTHING;
