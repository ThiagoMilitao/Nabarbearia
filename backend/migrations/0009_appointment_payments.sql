ALTER TABLE appointments ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid'));
ALTER TABLE appointments ADD COLUMN paid_at_utc TEXT;
