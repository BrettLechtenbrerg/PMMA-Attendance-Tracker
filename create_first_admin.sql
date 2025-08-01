-- Simple approach: Just insert into users table after creating user via Supabase Auth

-- Step 1: Go to Supabase Dashboard > Authentication > Users
-- Step 2: Click "Add user" and create user with email/password
-- Step 3: Copy the User ID from the auth users table
-- Step 4: Run this SQL with the actual user ID:

INSERT INTO public.users (
  id,
  email,
  first_name,
  last_name,
  role,
  created_at
) VALUES (
  'PASTE_USER_ID_HERE', -- Replace with actual user ID from auth.users
  'admin@pmma.com',     -- Replace with your email
  'Admin',              -- Replace with your first name
  'User',               -- Replace with your last name
  'owner',              -- Keep as 'owner' for full admin access
  NOW()
);