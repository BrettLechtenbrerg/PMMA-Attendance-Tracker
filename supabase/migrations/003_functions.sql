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

-- Create triggers for automatic QR code generation
CREATE TRIGGER trigger_set_student_qr_code
  BEFORE INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION set_student_qr_code();

CREATE TRIGGER trigger_set_family_qr_code
  BEFORE INSERT ON parents
  FOR EACH ROW
  EXECUTE FUNCTION set_family_qr_code();

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

-- Trigger to automatically create user record on auth signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();