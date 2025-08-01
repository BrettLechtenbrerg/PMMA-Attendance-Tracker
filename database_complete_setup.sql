-- =====================================================
-- PMMA Attendance Tracker - Complete Database Setup
-- =====================================================
-- This script will DELETE ALL DATA and recreate the database schema
-- WARNING: This will destroy all existing data!
-- Run this script in Supabase SQL Editor

-- =====================================================
-- 1. CLEAN SLATE - Delete all existing data and tables
-- =====================================================

-- Drop all policies first
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Owners and managers can view all users" ON public.users;
DROP POLICY IF EXISTS "Owners and managers can insert users" ON public.users;
DROP POLICY IF EXISTS "Owners and managers can update users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Owners and managers can delete users" ON public.users;

DROP POLICY IF EXISTS "Staff can view all students" ON public.students;
DROP POLICY IF EXISTS "Parents can view their children" ON public.students;
DROP POLICY IF EXISTS "Staff can insert students" ON public.students;
DROP POLICY IF EXISTS "Staff can update students" ON public.students;
DROP POLICY IF EXISTS "Staff can delete students" ON public.students;

DROP POLICY IF EXISTS "Staff can view all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Parents can view their children's attendance" ON public.attendance;
DROP POLICY IF EXISTS "Staff can insert attendance" ON public.attendance;
DROP POLICY IF EXISTS "Staff can update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Staff can delete attendance" ON public.attendance;

DROP POLICY IF EXISTS "Staff can view all classes" ON public.classes;
DROP POLICY IF EXISTS "Staff can insert classes" ON public.classes;
DROP POLICY IF EXISTS "Staff can update classes" ON public.classes;
DROP POLICY IF EXISTS "Staff can delete classes" ON public.classes;

DROP POLICY IF EXISTS "Parents can view their own data" ON public.parents;
DROP POLICY IF EXISTS "Staff can view all parents" ON public.parents;
DROP POLICY IF EXISTS "Staff can insert parents" ON public.parents;
DROP POLICY IF EXISTS "Staff can update parents" ON public.parents;
DROP POLICY IF EXISTS "Staff can delete parents" ON public.parents;

DROP POLICY IF EXISTS "Parents can view their own relationships" ON public.parent_students;
DROP POLICY IF EXISTS "Staff can view all relationships" ON public.parent_students;
DROP POLICY IF EXISTS "Staff can manage relationships" ON public.parent_students;

-- Drop functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS check_user_role(user_id uuid, allowed_roles text[]) CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS public.parent_students CASCADE;
DROP TABLE IF EXISTS public.parents CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- =====================================================
-- 2. CREATE TABLES
-- =====================================================

-- Users table (extends auth.users)
CREATE TABLE public.users (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email text UNIQUE NOT NULL,
    first_name text,
    last_name text,
    role text NOT NULL CHECK (role IN ('owner', 'manager', 'instructor', 'parent')) DEFAULT 'instructor',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Students table
CREATE TABLE public.students (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text,
    phone text,
    date_of_birth date,
    belt_color text NOT NULL CHECK (belt_color IN ('White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 'Red', 'Black')) DEFAULT 'White',
    program text NOT NULL CHECK (program IN ('Basic', 'Masters Club', 'Leadership')) DEFAULT 'Basic',
    status text NOT NULL CHECK (status IN ('Active', 'Vacation', 'Medical', 'Hiatus', 'Past')) DEFAULT 'Active',
    emergency_contact_name text,
    emergency_contact_phone text,
    qr_code text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
    profile_photo_url text,
    medical_notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Classes table
CREATE TABLE public.classes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    class_type text CHECK (class_type IN ('Tiny Tigers', 'Kids', 'Teens', 'Adults', 'Weapons', 'Black Belt')),
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    instructor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    location text NOT NULL DEFAULT 'Main Dojo',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Attendance table
CREATE TABLE public.attendance (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
    class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
    check_in_time timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes text,
    created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Parents table (for parent users)
CREATE TABLE public.parents (
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
    family_qr_code text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Parent-Student relationships
CREATE TABLE public.parent_students (
    parent_id uuid REFERENCES public.parents(user_id) ON DELETE CASCADE,
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
    relationship text DEFAULT 'parent',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (parent_id, student_id)
);

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_students_status ON public.students(status);
CREATE INDEX idx_students_qr_code ON public.students(qr_code);
CREATE INDEX idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX idx_attendance_class_id ON public.attendance(class_id);
CREATE INDEX idx_attendance_check_in_time ON public.attendance(check_in_time);
CREATE INDEX idx_classes_start_time ON public.classes(start_time);
CREATE INDEX idx_classes_instructor_id ON public.classes(instructor_id);

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to check user role
CREATE OR REPLACE FUNCTION check_user_role(user_id uuid, allowed_roles text[])
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = user_id AND role = ANY(allowed_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Only create user record if email is provided and not a system user
    IF NEW.email IS NOT NULL AND NEW.email NOT LIKE '%supabase%' THEN
        INSERT INTO public.users (id, email, created_at, updated_at)
        VALUES (NEW.id, NEW.email, NOW(), NOW());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. CREATE TRIGGERS
-- =====================================================

-- Trigger to automatically create user record when auth user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 7. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Users policies
CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Owners and managers can view all users" ON public.users
    FOR SELECT USING (check_user_role(auth.uid(), ARRAY['owner', 'manager']));

CREATE POLICY "Owners and managers can insert users" ON public.users
    FOR INSERT WITH CHECK (check_user_role(auth.uid(), ARRAY['owner', 'manager']));

CREATE POLICY "Owners and managers can update users" ON public.users
    FOR UPDATE USING (check_user_role(auth.uid(), ARRAY['owner', 'manager']));

CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Owners and managers can delete users" ON public.users
    FOR DELETE USING (check_user_role(auth.uid(), ARRAY['owner', 'manager']) AND auth.uid() != id);

-- Students policies
CREATE POLICY "Staff can view all students" ON public.students
    FOR SELECT USING (check_user_role(auth.uid(), ARRAY['owner', 'manager', 'instructor']));

CREATE POLICY "Parents can view their children" ON public.students
    FOR SELECT USING (
        check_user_role(auth.uid(), ARRAY['parent']) AND
        EXISTS (
            SELECT 1 FROM public.parent_students ps
            JOIN public.parents p ON ps.parent_id = p.user_id
            WHERE p.user_id = auth.uid() AND ps.student_id = id
        )
    );

CREATE POLICY "Staff can insert students" ON public.students
    FOR INSERT WITH CHECK (check_user_role(auth.uid(), ARRAY['owner', 'manager', 'instructor']));

CREATE POLICY "Staff can update students" ON public.students
    FOR UPDATE USING (check_user_role(auth.uid(), ARRAY['owner', 'manager', 'instructor']));

CREATE POLICY "Staff can delete students" ON public.students
    FOR DELETE USING (check_user_role(auth.uid(), ARRAY['owner', 'manager']));

-- Classes policies
CREATE POLICY "Staff can view all classes" ON public.classes
    FOR SELECT USING (check_user_role(auth.uid(), ARRAY['owner', 'manager', 'instructor']));

CREATE POLICY "Staff can insert classes" ON public.classes
    FOR INSERT WITH CHECK (check_user_role(auth.uid(), ARRAY['owner', 'manager', 'instructor']));

CREATE POLICY "Staff can update classes" ON public.classes
    FOR UPDATE USING (check_user_role(auth.uid(), ARRAY['owner', 'manager', 'instructor']));

CREATE POLICY "Staff can delete classes" ON public.classes
    FOR DELETE USING (check_user_role(auth.uid(), ARRAY['owner', 'manager']));

-- Attendance policies
CREATE POLICY "Staff can view all attendance" ON public.attendance
    FOR SELECT USING (check_user_role(auth.uid(), ARRAY['owner', 'manager', 'instructor']));

CREATE POLICY "Parents can view their children's attendance" ON public.attendance
    FOR SELECT USING (
        check_user_role(auth.uid(), ARRAY['parent']) AND
        EXISTS (
            SELECT 1 FROM public.parent_students ps
            JOIN public.parents p ON ps.parent_id = p.user_id
            WHERE p.user_id = auth.uid() AND ps.student_id = student_id
        )
    );

CREATE POLICY "Staff can insert attendance" ON public.attendance
    FOR INSERT WITH CHECK (check_user_role(auth.uid(), ARRAY['owner', 'manager', 'instructor']));

CREATE POLICY "Staff can update attendance" ON public.attendance
    FOR UPDATE USING (check_user_role(auth.uid(), ARRAY['owner', 'manager', 'instructor']));

CREATE POLICY "Staff can delete attendance" ON public.attendance
    FOR DELETE USING (check_user_role(auth.uid(), ARRAY['owner', 'manager']));

-- Parents policies
CREATE POLICY "Parents can view their own data" ON public.parents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all parents" ON public.parents
    FOR SELECT USING (check_user_role(auth.uid(), ARRAY['owner', 'manager', 'instructor']));

CREATE POLICY "Staff can insert parents" ON public.parents
    FOR INSERT WITH CHECK (check_user_role(auth.uid(), ARRAY['owner', 'manager']));

CREATE POLICY "Staff can update parents" ON public.parents
    FOR UPDATE USING (check_user_role(auth.uid(), ARRAY['owner', 'manager']));

CREATE POLICY "Staff can delete parents" ON public.parents
    FOR DELETE USING (check_user_role(auth.uid(), ARRAY['owner', 'manager']));

-- Parent-Students relationship policies
CREATE POLICY "Parents can view their own relationships" ON public.parent_students
    FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "Staff can view all relationships" ON public.parent_students
    FOR SELECT USING (check_user_role(auth.uid(), ARRAY['owner', 'manager', 'instructor']));

CREATE POLICY "Staff can manage relationships" ON public.parent_students
    FOR ALL USING (check_user_role(auth.uid(), ARRAY['owner', 'manager']));

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- 9. INSERT SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Sample students
INSERT INTO public.students (first_name, last_name, email, belt_color, program, status) VALUES
('John', 'Doe', 'john.doe@email.com', 'Yellow', 'Basic', 'Active'),
('Jane', 'Smith', 'jane.smith@email.com', 'Green', 'Masters Club', 'Active'),
('Mike', 'Johnson', 'mike.johnson@email.com', 'Blue', 'Leadership', 'Active'),
('Sarah', 'Williams', 'sarah.williams@email.com', 'White', 'Basic', 'Active'),
('Tom', 'Brown', 'tom.brown@email.com', 'Purple', 'Masters Club', 'Active');

-- Sample classes
INSERT INTO public.classes (class_type, start_time, end_time, location) VALUES
('Kids', NOW() + INTERVAL '1 hour', NOW() + INTERVAL '2 hours', 'Main Dojo'),
('Teens', NOW() + INTERVAL '3 hours', NOW() + INTERVAL '4 hours', 'Main Dojo'),
('Adults', NOW() + INTERVAL '5 hours', NOW() + INTERVAL '6 hours', 'Main Dojo');

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

-- To create your first admin user, you can either:
-- 1. Use the /setup page in the application (recommended)
-- 2. Use the /signup page and then manually update the role to 'owner'
-- 3. Or manually insert a user record after creating auth user

SELECT 'Database setup completed successfully!' AS status;