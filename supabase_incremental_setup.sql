-- =============================================================================
-- PMMA ATTENDANCE TRACKER - INCREMENTAL SUPABASE SETUP
-- =============================================================================
-- This version handles existing types and tables safely
-- Run this in the Supabase SQL Editor
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUMs only if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'belt_color_t') THEN
        CREATE TYPE belt_color_t AS ENUM ('White','Yellow','Orange','Green','Blue','Purple','Brown','Red','Black');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'program_t') THEN
        CREATE TYPE program_t AS ENUM ('Basic','Masters Club','Leadership');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_status_t') THEN
        CREATE TYPE student_status_t AS ENUM ('Active','Vacation','Medical','Hiatus','Past');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_t') THEN
        CREATE TYPE user_role_t AS ENUM ('owner','manager','instructor','parent');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'class_type_t') THEN
        CREATE TYPE class_type_t AS ENUM ('Tiny Tigers','Kids','Teens','Adults','Weapons','Black Belt');
    END IF;
END $$;

-- =============================================================================
-- TABLES (Create only if they don't exist)
-- =============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role_t DEFAULT 'instructor',
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parents table
CREATE TABLE IF NOT EXISTS parents (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  family_qr_code TEXT UNIQUE NOT NULL
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
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
CREATE TABLE IF NOT EXISTS parent_students (
  parent_id UUID REFERENCES parents(user_id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  PRIMARY KEY (parent_id, student_id)
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_type class_type_t,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  instructor_id UUID REFERENCES users(id),
  location TEXT DEFAULT 'Dojo Floor',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
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
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  template TEXT,
  channel TEXT CHECK (channel IN ('sms','email')),
  payload JSONB,
  sent_at TIMESTAMPTZ,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES (Create only if they don't exist)
-- =============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_students_status') THEN
        CREATE INDEX idx_students_status ON students (status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_students_belt_color') THEN
        CREATE INDEX idx_students_belt_color ON students (belt_color);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_students_qr_code') THEN
        CREATE INDEX idx_students_qr_code ON students (qr_code);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_classes_start_time') THEN
        CREATE INDEX idx_classes_start_time ON classes (start_time DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_attendance_student_id') THEN
        CREATE INDEX idx_attendance_student_id ON attendance (student_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_attendance_class_id') THEN
        CREATE INDEX idx_attendance_class_id ON attendance (class_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_attendance_check_in_time') THEN
        CREATE INDEX idx_attendance_check_in_time ON attendance (check_in_time DESC);
    END IF;
END $$;

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate QR codes for students
CREATE OR REPLACE FUNCTION generate_student_qr_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'student_' || gen_random_uuid()::text;
END;
$$ LANGUAGE plpgsql;

-- Function to generate family QR codes
CREATE OR REPLACE FUNCTION generate_family_qr_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'family_' || gen_random_uuid()::text;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set QR code on student insert
CREATE OR REPLACE FUNCTION set_student_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
    NEW.qr_code = generate_student_qr_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set family QR code on parent insert
CREATE OR REPLACE FUNCTION set_family_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.family_qr_code IS NULL OR NEW.family_qr_code = '' THEN
    NEW.family_qr_code = generate_family_qr_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get weekly attendance summary
CREATE OR REPLACE FUNCTION fn_weekly_summary(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  classes_attended BIGINT,
  total_classes BIGINT,
  attendance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.first_name || ' ' || s.last_name,
    COUNT(a.id) as classes_attended,
    COUNT(c.id) as total_classes,
    ROUND(COUNT(a.id)::NUMERIC / NULLIF(COUNT(c.id), 0) * 100, 2) as attendance_rate
  FROM students s
  CROSS JOIN classes c
  LEFT JOIN attendance a ON s.id = a.student_id AND c.id = a.class_id
  WHERE c.start_time::DATE BETWEEN start_date AND end_date
    AND s.status = 'Active'
  GROUP BY s.id, s.first_name, s.last_name
  ORDER BY attendance_rate DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get promotion candidates
CREATE OR REPLACE FUNCTION fn_promotion_candidates(
  weeks_back INTEGER DEFAULT 8,
  min_classes_per_week INTEGER DEFAULT 2
)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  current_belt belt_color_t,
  avg_classes_per_week NUMERIC,
  total_classes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.first_name || ' ' || s.last_name,
    s.belt_color,
    ROUND(COUNT(a.id)::NUMERIC / weeks_back, 2) as avg_classes_per_week,
    COUNT(a.id) as total_classes
  FROM students s
  LEFT JOIN attendance a ON s.id = a.student_id
  LEFT JOIN classes c ON a.class_id = c.id
  WHERE c.start_time >= CURRENT_DATE - (weeks_back || ' weeks')::INTERVAL
    AND s.status = 'Active'
  GROUP BY s.id, s.first_name, s.last_name, s.belt_color
  HAVING COUNT(a.id)::NUMERIC / weeks_back >= min_classes_per_week
  ORDER BY avg_classes_per_week DESC;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role_t AS $$
BEGIN
  RETURN (SELECT role FROM users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user signup and create user record
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS (Create only if they don't exist)
-- =============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_students_updated_at') THEN
        CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_set_student_qr_code') THEN
        CREATE TRIGGER trigger_set_student_qr_code BEFORE INSERT ON students FOR EACH ROW EXECUTE FUNCTION set_student_qr_code();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_set_family_qr_code') THEN
        CREATE TRIGGER trigger_set_family_qr_code BEFORE INSERT ON parents FOR EACH ROW EXECUTE FUNCTION set_family_qr_code();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
    END IF;
END $$;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can read their own record" ON users;
CREATE POLICY "Users can read their own record" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Staff can read all users" ON users;
CREATE POLICY "Staff can read all users" ON users
  FOR SELECT USING (get_user_role(auth.uid()) IN ('owner', 'manager', 'instructor'));

DROP POLICY IF EXISTS "Owners and managers can manage users" ON users;
CREATE POLICY "Owners and managers can manage users" ON users
  FOR ALL USING (get_user_role(auth.uid()) IN ('owner', 'manager'));

-- Parents table policies
DROP POLICY IF EXISTS "Parents can read their own record" ON parents;
CREATE POLICY "Parents can read their own record" ON parents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can read all parents" ON parents;
CREATE POLICY "Staff can read all parents" ON parents
  FOR SELECT USING (get_user_role(auth.uid()) IN ('owner', 'manager', 'instructor'));

DROP POLICY IF EXISTS "Owners and managers can manage parents" ON parents;
CREATE POLICY "Owners and managers can manage parents" ON parents
  FOR ALL USING (get_user_role(auth.uid()) IN ('owner', 'manager'));

-- Students table policies
DROP POLICY IF EXISTS "Parents can read their own children" ON students;
CREATE POLICY "Parents can read their own children" ON students
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'parent' AND
    EXISTS (
      SELECT 1 FROM parent_students ps
      JOIN parents p ON p.user_id = ps.parent_id
      WHERE ps.student_id = id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Staff can read all students" ON students;
CREATE POLICY "Staff can read all students" ON students
  FOR SELECT USING (get_user_role(auth.uid()) IN ('owner', 'manager', 'instructor'));

DROP POLICY IF EXISTS "Owners and managers can manage students" ON students;
CREATE POLICY "Owners and managers can manage students" ON students
  FOR ALL USING (get_user_role(auth.uid()) IN ('owner', 'manager'));

-- Parent-Students table policies
DROP POLICY IF EXISTS "Parents can read their own relationships" ON parent_students;
CREATE POLICY "Parents can read their own relationships" ON parent_students
  FOR SELECT USING (auth.uid() = parent_id);

DROP POLICY IF EXISTS "Staff can read all parent-student relationships" ON parent_students;
CREATE POLICY "Staff can read all parent-student relationships" ON parent_students
  FOR SELECT USING (get_user_role(auth.uid()) IN ('owner', 'manager', 'instructor'));

DROP POLICY IF EXISTS "Owners and managers can manage parent-student relationships" ON parent_students;
CREATE POLICY "Owners and managers can manage parent-student relationships" ON parent_students
  FOR ALL USING (get_user_role(auth.uid()) IN ('owner', 'manager'));

-- Classes table policies
DROP POLICY IF EXISTS "All authenticated users can read classes" ON classes;
CREATE POLICY "All authenticated users can read classes" ON classes
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Staff can manage classes" ON classes;
CREATE POLICY "Staff can manage classes" ON classes
  FOR ALL USING (get_user_role(auth.uid()) IN ('owner', 'manager', 'instructor'));

-- Attendance table policies
DROP POLICY IF EXISTS "Parents can read their children's attendance" ON attendance;
CREATE POLICY "Parents can read their children's attendance" ON attendance
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'parent' AND
    EXISTS (
      SELECT 1 FROM parent_students ps
      JOIN parents p ON p.user_id = ps.parent_id
      WHERE ps.student_id = attendance.student_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Staff can read all attendance" ON attendance;
CREATE POLICY "Staff can read all attendance" ON attendance
  FOR SELECT USING (get_user_role(auth.uid()) IN ('owner', 'manager', 'instructor'));

DROP POLICY IF EXISTS "Staff can manage attendance" ON attendance;
CREATE POLICY "Staff can manage attendance" ON attendance
  FOR ALL USING (get_user_role(auth.uid()) IN ('owner', 'manager', 'instructor'));

-- Notifications table policies
DROP POLICY IF EXISTS "Staff can read all notifications" ON notifications;
CREATE POLICY "Staff can read all notifications" ON notifications
  FOR SELECT USING (get_user_role(auth.uid()) IN ('owner', 'manager', 'instructor'));

DROP POLICY IF EXISTS "Staff can manage notifications" ON notifications;
CREATE POLICY "Staff can manage notifications" ON notifications  
  FOR ALL USING (get_user_role(auth.uid()) IN ('owner', 'manager', 'instructor'));

-- =============================================================================
-- COMPLETE SETUP CONFIRMATION
-- =============================================================================
SELECT 'PMMA Attendance Tracker database setup complete!' as status;