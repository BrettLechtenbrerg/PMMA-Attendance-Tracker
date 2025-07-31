export type UserRole = 'owner' | 'manager' | 'instructor' | 'parent'

export type BeltColor = 'White' | 'Yellow' | 'Orange' | 'Green' | 'Blue' | 'Purple' | 'Brown' | 'Red' | 'Black'

export type Program = 'Basic' | 'Masters Club' | 'Leadership'

export type StudentStatus = 'Active' | 'Vacation' | 'Medical' | 'Hiatus' | 'Past'

export type ClassType = 'Tiny Tigers' | 'Kids' | 'Teens' | 'Adults' | 'Weapons' | 'Black Belt'

export interface Student {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  date_of_birth?: string
  belt_color: BeltColor
  program: Program
  status: StudentStatus
  emergency_contact_name?: string
  emergency_contact_phone?: string
  qr_code: string
  profile_photo_url?: string
  medical_notes?: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  role: UserRole
  first_name?: string
  last_name?: string
  created_at: string
}

export interface Class {
  id: string
  class_type?: ClassType
  start_time: string
  end_time: string
  instructor_id?: string
  location: string
}

export interface Attendance {
  id: string
  student_id?: string
  class_id?: string
  check_in_time: string
  notes?: string
  created_by?: string
}

export interface Parent {
  user_id: string
  family_qr_code: string
}

export interface ParentStudent {
  parent_id: string
  student_id: string
}