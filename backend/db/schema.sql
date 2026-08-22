CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'STUDENT' CHECK (role IN ('STUDENT', 'LIBRARY_ADMIN', 'CAFETERIA_ADMIN', 'VOLLEYBALL_ADMIN', 'GYM_ADMIN', 'SUPER_ADMIN', 'ADMIN')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('ENTRANCE', 'STUDY', 'EVENTS', 'SPORTS', 'FOOD', 'SHOPPING', 'RECREATION', 'FITNESS', 'LAB', 'PHOTOCOPY')),
  description TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  availability TEXT NOT NULL DEFAULT 'UNKNOWN' CHECK (availability IN ('OPEN', 'CLOSED', 'UNKNOWN')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS locations_category_idx ON locations(category);
CREATE INDEX IF NOT EXISTS locations_coordinates_idx ON locations(latitude, longitude);

CREATE TABLE IF NOT EXISTS campus_breaks (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  break_type TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  CHECK (start_time < end_time)
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users(LOWER(email));

CREATE TABLE IF NOT EXISTS crowd_reports (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  crowd_level TEXT NOT NULL CHECK (crowd_level IN ('EMPTY', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE crowd_reports ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS crowd_reports_location_idx ON crowd_reports(location_id);
CREATE INDEX IF NOT EXISTS crowd_reports_created_at_idx ON crowd_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS crowd_reports_user_idx ON crowd_reports(user_id);

CREATE TABLE IF NOT EXISTS facilities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  location_id TEXT NOT NULL UNIQUE REFERENCES locations(id),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS facility_slots (
  id UUID PRIMARY KEY,
  facility_id TEXT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  available_capacity INTEGER NOT NULL CHECK (available_capacity >= 0 AND available_capacity <= capacity),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'FULL', 'CLOSED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (start_time < end_time),
  UNIQUE (facility_id, date, start_time, end_time)
);

CREATE INDEX IF NOT EXISTS facility_slots_lookup_idx ON facility_slots(facility_id, date, status);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  facility_id TEXT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES facility_slots(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CHECKED_IN', 'CANCELLED', 'COMPLETED')),
  verification_token TEXT,
  verification_expires_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, slot_id)
);

CREATE INDEX IF NOT EXISTS bookings_user_idx ON bookings(user_id, booking_date);
CREATE INDEX IF NOT EXISTS bookings_facility_idx ON bookings(facility_id, booking_date);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checked_in_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check CHECK (status IN ('CONFIRMED', 'CHECKED_IN', 'CANCELLED', 'COMPLETED'));
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_user_id_slot_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS bookings_confirmed_user_slot_idx ON bookings(user_id, slot_id) WHERE status = 'CONFIRMED';
CREATE INDEX IF NOT EXISTS bookings_verification_idx ON bookings(verification_expires_at) WHERE status = 'CONFIRMED' AND verified_at IS NULL;

CREATE TABLE IF NOT EXISTS booking_checkin_tokens (
  id UUID PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'USED', 'EXPIRED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS booking_checkin_active_idx ON booking_checkin_tokens(booking_id) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS booking_checkin_hash_idx ON booking_checkin_tokens(token_hash);

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('STUDENT', 'LIBRARY_ADMIN', 'CAFETERIA_ADMIN', 'VOLLEYBALL_ADMIN', 'GYM_ADMIN', 'SUPER_ADMIN', 'ADMIN'));