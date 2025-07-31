import { z } from 'zod'
import { parsePhoneNumber } from 'libphonenumber-js'

export const beltColors = ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 'Red', 'Black'] as const
export const programs = ['Basic', 'Masters Club', 'Leadership'] as const
export const studentStatuses = ['Active', 'Vacation', 'Medical', 'Hiatus', 'Past'] as const
export const userRoles = ['owner', 'manager', 'instructor', 'parent'] as const
export const classTypes = ['Tiny Tigers', 'Kids', 'Teens', 'Adults', 'Weapons', 'Black Belt'] as const

const phoneNumberSchema = z.string().refine((phone) => {
  try {
    const phoneNumber = parsePhoneNumber(phone, 'US')
    return phoneNumber.isValid()
  } catch {
    return false
  }
}, {
  message: 'Invalid phone number format'
})

export const studentSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: phoneNumberSchema.optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')).refine((date) => {
    if (!date) return true
    const birthDate = new Date(date)
    return birthDate <= new Date()
  }, {
    message: 'Birth date cannot be in the future'
  }),
  belt_color: z.enum(beltColors),
  program: z.enum(programs),
  status: z.enum(studentStatuses),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: phoneNumberSchema.optional().or(z.literal('')),
  medical_notes: z.string().optional(),
})

export const userSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(userRoles),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
})

export const classSchema = z.object({
  class_type: z.enum(classTypes),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  instructor_id: z.string().uuid().optional(),
  location: z.string().min(1, 'Location is required'),
}).refine((data) => {
  return new Date(data.end_time) > new Date(data.start_time)
}, {
  message: 'End time must be after start time',
  path: ['end_time']
})

export const attendanceSchema = z.object({
  student_id: z.string().uuid(),
  class_id: z.string().uuid(),
  notes: z.string().optional(),
})