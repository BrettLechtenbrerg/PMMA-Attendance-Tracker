-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUMs
CREATE TYPE belt_color_t AS ENUM ('White','Yellow','Orange','Green','Blue','Purple','Brown','Red','Black');
CREATE TYPE program_t AS ENUM ('Basic','Masters Club','Leadership');
CREATE TYPE student_status_t AS ENUM ('Active','Vacation','Medical','Hiatus','Past');
CREATE TYPE user_role_t AS ENUM ('owner','manager','instructor','parent');
CREATE TYPE class_type_t AS ENUM ('Tiny Tigers','Kids','Teens','Adults','Weapons','Black Belt');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role_t DEFAULT 'instructor',
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
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

-- Indexes for students
CREATE INDEX students_status_idx ON students (status);
CREATE INDEX students_belt_color_idx ON students (belt_color);

-- Parent-Student relationship (many-to-many)
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
  location TEXT DEFAULT 'Dojo Floor'
);

-- Index for classes
CREATE INDEX classes_start_time_idx ON classes (start_time DESC);

-- Attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_by UUID REFERENCES users(id),
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
  status TEXT
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for students updated_at
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY users_read_own ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for students
CREATE POLICY students_read_parent ON students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      JOIN users u ON u.id = ps.parent_id
      WHERE ps.student_id = students.id 
      AND u.id = auth.uid()
      AND u.role = 'parent'
    )
  );

CREATE POLICY students_read_staff ON students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('owner','manager','instructor')
    )
  );

CREATE POLICY students_write_staff ON students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('owner','manager')
    )
  );

-- RLS Policies for parents
CREATE POLICY parents_read_own ON parents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY parents_read_staff ON parents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('owner','manager','instructor')
    )
  );

CREATE POLICY parents_write_staff ON parents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('owner','manager')
    )
  );

-- RLS Policies for parent_students
CREATE POLICY parent_students_read_parent ON parent_students
  FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY parent_students_read_staff ON parent_students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('owner','manager','instructor')
    )
  );

CREATE POLICY parent_students_write_staff ON parent_students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('owner','manager')
    )
  );

-- RLS Policies for classes
CREATE POLICY classes_read_all ON classes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY classes_write_staff ON classes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('owner','manager','instructor')
    )
  );

-- RLS Policies for attendance
CREATE POLICY attendance_read_parent ON attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      JOIN users u ON u.id = ps.parent_id
      WHERE ps.student_id = attendance.student_id
      AND u.id = auth.uid()
      AND u.role = 'parent'
    )
  );

CREATE POLICY attendance_read_staff ON attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('owner','manager','instructor')
    )
  );

CREATE POLICY attendance_write_staff ON attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('owner','manager','instructor')
    )
  );

-- RLS Policies for notifications
CREATE POLICY notifications_read_staff ON notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('owner','manager','instructor')
    )
  );

CREATE POLICY notifications_write_staff ON notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('owner','manager')
    )
  );