-- Bal Ganesh Mitra Mandal database schema
-- Run this once against your Neon PostgreSQL database

CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  surname VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  flat_no VARCHAR(20) NOT NULL,
  wing VARCHAR(10) NOT NULL CHECK (wing IN ('A', 'B', 'C', 'Others')),
  contribution_date DATE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  payment_mode VARCHAR(20) NOT NULL CHECK (payment_mode IN ('Cash', 'Online')),
  receipt_no VARCHAR(20) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  expense_name VARCHAR(150) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  expense_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_members_wing ON members(wing);
CREATE INDEX IF NOT EXISTS idx_members_created_at ON members(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);

-- Single-row settings table. whatsapp_notify_number is the one number that
-- receives a copy of every donation receipt PDF automatically.
CREATE TABLE IF NOT EXISTS settings (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  whatsapp_notify_number VARCHAR(20),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT settings_singleton CHECK (id = 1)
);

INSERT INTO settings (id, whatsapp_notify_number)
VALUES (1, NULL)
ON CONFLICT (id) DO NOTHING;
