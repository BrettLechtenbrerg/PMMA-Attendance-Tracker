-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUMs
CREATE TYPE belt_color_t AS ENUM ('White','Yellow','Orange','Green','Blue','Purple','Brown','Red','Black');
CREATE TYPE program_t AS ENUM ('Basic','Masters Club','Leadership');
CREATE TYPE student_status_t AS ENUM ('Active','Vacation','Medical','Hiatus','Past');
CREATE TYPE user_role_t AS ENUM ('owner','manager','instructor','parent');
CREATE TYPE class_type_t AS ENUM ('Tiny Tigers','Kids','Teens','Adults','Weapons','Black Belt');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role_t DEFAULT 'instructor',
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parents table
CREATE TABLE parents (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  family_qr_code TEXT UNIQUE NOT NULL
);

-- Students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  date_of_birth DATE,
  belt_color belt_color_t DEFAULT 'White',
  program program_t DEFAULT 'Basic',
  status student_status_t DEFAULT 'Active',
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  qr_code TEXT UNIQUE NOT NULL,
  profile_photo_url TEXT,
  medical_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parent-Student relationship table
CREATE TABLE parent_students (
  parent_id UUID REFERENCES parents(user_id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  PRIMARY KEY (parent_id, student_id)
);

-- Classes table
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_type class_type_t,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  instructor_id UUID REFERENCES users(id),
  location TEXT DEFAULT 'Dojo Floor',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, class_id)
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  template TEXT,
  channel TEXT CHECK (channel IN ('sms','email')),
  payload JSONB,
  sent_at TIMESTAMPTZ,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX ON students (status);
CREATE INDEX ON students (belt_color);
CREATE INDEX ON students (qr_code);
CREATE INDEX ON classes (start_time DESC);
CREATE INDEX ON attendance (student_id);
CREATE INDEX ON attendance (class_id);
CREATE INDEX ON attendance (check_in_time DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();