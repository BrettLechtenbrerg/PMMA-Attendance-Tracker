-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role_t AS $$
BEGIN
  RETURN (SELECT role FROM users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can read their own record" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Staff can read all users" ON users
  FOR SELECT USING (get_user_role(auth.uid()) IN ('owner', 'manager', 'instructor'));

CREATE POLICY "Owners and managers can manage users" ON users
  FOR ALL USING (get_user_role(auth.uid()) IN ('owner', 'manager'));

-- Parents table policies
CREATE POLICY "Parents can read their own record" ON parents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Staff can read all parents" ON parents
  FOR SELECT USING (get_user_role(auth.uid()) IN ('owner', 'manager', 'instructor'));

CREATE POLICY "Owners and managers can manage parents" ON parents
  FOR ALL USING (get_user_role(auth.uid()) IN ('owner', 'manager'));

-- Students table policies
CREATE POLICY "Parents can read their own children" ON students
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'parent' AND
    EXISTS (
      SELECT 1 FROM parent_students ps
      JOIN parents p ON p.user_id = ps.parent_id
      WHERE ps.student_id = id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can read all students" ON students
  FOR SELECT USING (get_user_role(auth.uid()) IN ('owner', 'manager', 'instructor'));

CREATE POLICY "Owners and managers can manage students" ON students
  FOR ALL USING (get_user_role(auth.uid()) IN ('owner', 'manager'));

-- Parent-Students table policies
CREATE POLICY "Parents can read their own relationships" ON parent_students
  FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "Staff can read all parent-student relationships" ON parent_students
  FOR SELECT USING (get_user_role(auth.uid()) IN ('owner', 'manager', 'instructor'));

CREATE POLICY "Owners and managers can manage parent-student relationships" ON parent_students
  FOR ALL USING (get_user_role(auth.uid()) IN ('owner', 'manager'));

-- Classes table policies
CREATE POLICY "All authenticated users can read classes" ON classes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage classes" ON classes
  FOR ALL USING (get_user_role(auth.uid()) IN ('owner', 'manager', 'instructor'));

-- Attendance table policies
CREATE POLICY "Parents can read their children's attendance" ON attendance
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'parent' AND
    EXISTS (
      SELECT 1 FROM parent_students ps
      JOIN parents p ON p.user_id = ps.parent_id
      WHERE ps.student_id = attendance.student_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can read all attendance" ON attendance
  FOR SELECT USING (get_user_role(auth.uid()) IN ('owner', 'manager', 'instructor'));

CREATE POLICY "Staff can manage attendance" ON attendance
  FOR ALL USING (get_user_role(auth.uid()) IN ('owner', 'manager', 'instructor'));

-- Notifications table policies
CREATE POLICY "Staff can read all notifications" ON notifications
  FOR SELECT USING (get_user_role(auth.uid()) IN ('owner', 'manager', 'instructor'));

CREATE POLICY "Staff can manage notifications" ON notifications
  FOR ALL USING (get_user_role(auth.uid()) IN ('owner', 'manager', 'instructor'));