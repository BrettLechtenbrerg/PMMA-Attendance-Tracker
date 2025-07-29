import { supabase } from './supabase'
import { Student, BeltColor, Program, StudentStatus } from './types'
import { z } from 'zod'

const studentSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  belt_color: z.enum(['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 'Red', 'Black']),
  program: z.enum(['Basic', 'Masters Club', 'Leadership']),
  status: z.enum(['Active', 'Vacation', 'Medical', 'Hiatus', 'Past']),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  medical_notes: z.string().optional(),
})

export type StudentFormData = z.infer<typeof studentSchema>

export const studentService = {
  async getAll(): Promise<{ data: Student[] | null; error: any }> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })

    return { data, error }
  },

  async getById(id: string): Promise<{ data: Student | null; error: any }> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single()

    return { data, error }
  },

  async create(studentData: StudentFormData): Promise<{ data: Student | null; error: any }> {
    try {
      studentSchema.parse(studentData)
    } catch (error) {
      return { data: null, error: error }
    }

    const { data, error } = await supabase
      .from('students')
      .insert([{
        ...studentData,
        email: studentData.email || null,
      }])
      .select()
      .single()

    return { data, error }
  },

  async update(id: string, studentData: Partial<StudentFormData>): Promise<{ data: Student | null; error: any }> {
    const { data, error } = await supabase
      .from('students')
      .update({
        ...studentData,
        email: studentData.email || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  },

  async delete(id: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id)

    return { error }
  },

  async getByQRCode(qrCode: string): Promise<{ data: Student | null; error: any }> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('qr_code', qrCode)
      .single()

    return { data, error }
  },

  async searchStudents(query: string): Promise<{ data: Student[] | null; error: any }> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('first_name', { ascending: true })

    return { data, error }
  },

  async getActiveStudents(): Promise<{ data: Student[] | null; error: any }> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('status', 'Active')
      .order('first_name', { ascending: true })

    return { data, error }
  },

  validate: (data: any) => {
    try {
      return { data: studentSchema.parse(data), error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}