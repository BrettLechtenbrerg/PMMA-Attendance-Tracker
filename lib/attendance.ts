import { supabase } from './supabase'
import { Attendance, Student, Class } from './types'
import { qrCodeService, QRCodeData } from './qr-codes'

export interface AttendanceCheckIn {
  student_id: string
  class_id: string
  notes?: string
}

export interface OfflineAttendance {
  id: string
  student_id: string
  class_id: string
  check_in_time: string
  notes?: string
  created_by?: string
  synced: boolean
}

export const attendanceService = {
  /**
   * Check in a student to a class
   */
  async checkInStudent(
    studentId: string, 
    classId: string, 
    notes?: string
  ): Promise<{ data: Attendance | null; error: any }> {
    const { data, error } = await supabase
      .from('attendance')
      .insert([{
        student_id: studentId,
        class_id: classId,
        notes,
        check_in_time: new Date().toISOString()
      }])
      .select(`
        *,
        student:students(*),
        class:classes(*),
        created_by_user:users(*)
      `)
      .single()

    return { data, error }
  },

  /**
   * Check in multiple students (family QR)
   */
  async checkInFamily(
    studentIds: string[], 
    classId: string, 
    notes?: string
  ): Promise<{ data: Attendance[] | null; error: any }> {
    const attendanceRecords = studentIds.map(studentId => ({
      student_id: studentId,
      class_id: classId,
      notes,
      check_in_time: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('attendance')
      .insert(attendanceRecords)
      .select(`
        *,
        student:students(*),
        class:classes(*),
        created_by_user:users(*)
      `)

    return { data, error }
  },

  /**
   * Process QR code scan for attendance
   */
  async processQRScan(
    qrString: string, 
    classId: string, 
    notes?: string
  ): Promise<{ 
    success: boolean; 
    data?: Attendance | Attendance[] | null; 
    error?: string;
    studentName?: string;
  }> {
    try {
      const qrData = qrCodeService.parseQRCode(qrString)
      
      if (!qrData) {
        return { success: false, error: 'Invalid QR code format' }
      }

      if (qrData.type === 'student') {
        // Single student check-in
        const { data, error } = await this.checkInStudent(qrData.id, classId, notes)
        
        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            return { success: false, error: 'Student already checked in to this class' }
          }
          return { success: false, error: error.message }
        }

        return { 
          success: true, 
          data, 
          studentName: data?.student ? `${data.student.first_name} ${data.student.last_name}` : undefined
        }
      } else if (qrData.type === 'family') {
        // Family check-in - get all students for this family
        const { data: familyStudents, error: familyError } = await supabase
          .from('parent_students')
          .select(`
            student_id,
            student:students(*)
          `)
          .eq('parent_id', qrData.id)

        if (familyError || !familyStudents?.length) {
          return { success: false, error: 'No students found for this family QR code' }
        }

        const studentIds = familyStudents.map(fs => fs.student_id)
        const { data, error } = await this.checkInFamily(studentIds, classId, notes)

        if (error) {
          return { success: false, error: error.message }
        }

        const studentNames = familyStudents
          .map(fs => fs.student && typeof fs.student === 'object' && !Array.isArray(fs.student) ? `${(fs.student as any).first_name} ${(fs.student as any).last_name}` : '')
          .filter(name => name)
          .join(', ')

        return { 
          success: true, 
          data, 
          studentName: studentNames
        }
      }

      return { success: false, error: 'Unknown QR code type' }
    } catch (error) {
      console.error('Error processing QR scan:', error)
      return { success: false, error: 'Failed to process QR code' }
    }
  },

  /**
   * Get today's classes for check-in
   */
  async getTodayClasses(): Promise<{ data: Class[] | null; error: any }> {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        instructor:users(*)
      `)
      .gte('start_time', startOfDay.toISOString())
      .lt('start_time', endOfDay.toISOString())
      .order('start_time', { ascending: true })

    return { data, error }
  },

  /**
   * Get current/upcoming class for automatic selection
   */
  async getCurrentClass(): Promise<{ data: Class | null; error: any }> {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        instructor:users(*)
      `)
      .gte('start_time', oneHourAgo.toISOString())
      .lte('start_time', twoHoursFromNow.toISOString())
      .order('start_time', { ascending: true })
      .limit(1)
      .single()

    return { data, error }
  },

  /**
   * Get attendance for a specific class
   */
  async getClassAttendance(classId: string): Promise<{ data: Attendance[] | null; error: any }> {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        student:students(*),
        created_by_user:users(*)
      `)
      .eq('class_id', classId)
      .order('check_in_time', { ascending: false })

    return { data, error }
  },

  /**
   * Save attendance offline for later sync
   */
  saveOfflineAttendance(attendance: OfflineAttendance): void {
    try {
      const offline = this.getOfflineAttendance()
      offline.push(attendance)
      localStorage.setItem('offline_attendance', JSON.stringify(offline))
    } catch (error) {
      console.error('Failed to save offline attendance:', error)
    }
  },

  /**
   * Get offline attendance records
   */
  getOfflineAttendance(): OfflineAttendance[] {
    try {
      const stored = localStorage.getItem('offline_attendance')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to get offline attendance:', error)
      return []
    }
  },

  /**
   * Sync offline attendance records
   */
  async syncOfflineAttendance(): Promise<{ synced: number; failed: number }> {
    const offline = this.getOfflineAttendance()
    let synced = 0
    let failed = 0

    for (const record of offline) {
      if (record.synced) continue

      try {
        const { error } = await supabase
          .from('attendance')
          .insert([{
            student_id: record.student_id,
            class_id: record.class_id,
            check_in_time: record.check_in_time,
            notes: record.notes,
            created_by: record.created_by
          }])

        if (!error) {
          record.synced = true
          synced++
        } else {
          failed++
        }
      } catch (error) {
        console.error('Failed to sync attendance record:', error)
        failed++
      }
    }

    // Update localStorage with synced records
    localStorage.setItem('offline_attendance', JSON.stringify(offline))

    // Remove synced records
    const remaining = offline.filter(record => !record.synced)
    localStorage.setItem('offline_attendance', JSON.stringify(remaining))

    return { synced, failed }
  },

  /**
   * Clear offline attendance records
   */
  clearOfflineAttendance(): void {
    localStorage.removeItem('offline_attendance')
  }
}