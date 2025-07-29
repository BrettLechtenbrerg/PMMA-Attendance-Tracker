import { supabase } from './supabase'
import jsPDF from 'jspdf'

export interface ReportFilters {
  startDate: string
  endDate: string
  studentIds?: string[]
  classTypes?: string[]
  beltColors?: string[]
  programs?: string[]
}

export interface AttendanceReportData {
  student_id: string
  student_name: string
  belt_color: string
  program: string
  total_classes: number
  attendance_rate: number
  last_attendance: string | null
  classes_attended: Array<{
    date: string
    class_type: string
    check_in_time: string
  }>
}

export interface ClassReportData {
  class_id: string
  class_type: string
  date: string
  start_time: string
  location: string
  instructor_name: string
  total_capacity: number
  students_attended: number
  attendance_rate: number
  students: Array<{
    student_name: string
    belt_color: string
    check_in_time: string
  }>
}

export const reportsService = {
  /**
   * Generate attendance report for students
   */
  async generateAttendanceReport(filters: ReportFilters): Promise<AttendanceReportData[]> {
    let query = supabase
      .from('attendance')
      .select(`
        student_id,
        check_in_time,
        student:students(
          id,
          first_name,
          last_name,
          belt_color,
          program
        ),
        class:classes(
          id,
          class_type,
          start_time
        )
      `)
      .gte('check_in_time', filters.startDate)
      .lte('check_in_time', filters.endDate)
      .order('check_in_time', { ascending: false })

    if (filters.studentIds?.length) {
      query = query.in('student_id', filters.studentIds)
    }

    const { data: attendanceData, error } = await query

    if (error) {
      throw new Error(`Failed to fetch attendance data: ${error.message}`)
    }

    // Group by student and calculate metrics
    const studentMap = new Map<string, AttendanceReportData>()

    attendanceData?.forEach(record => {
      if (!record.student) return

      const student = Array.isArray(record.student) ? record.student[0] : record.student
      const studentId = student.id
      const studentName = `${student.first_name} ${student.last_name}`

      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          student_id: studentId,
          student_name: studentName,
          belt_color: student.belt_color,
          program: student.program,
          total_classes: 0,
          attendance_rate: 0,
          last_attendance: null,
          classes_attended: []
        })
      }

      const studentData = studentMap.get(studentId)!
      studentData.total_classes++
      studentData.last_attendance = record.check_in_time
      studentData.classes_attended.push({
        date: (record.class as any)?.start_time || record.check_in_time,
        class_type: (record.class as any)?.class_type || 'Unknown',
        check_in_time: record.check_in_time
      })
    })

    // Calculate attendance rates (this is simplified - you might want more complex logic)
    const reportData = Array.from(studentMap.values()).map(student => ({
      ...student,
      attendance_rate: Math.round((student.total_classes / getDaysInRange(filters.startDate, filters.endDate)) * 100)
    }))

    return reportData.sort((a, b) => b.total_classes - a.total_classes)
  },

  /**
   * Generate class-based report
   */
  async generateClassReport(filters: ReportFilters): Promise<ClassReportData[]> {
    let query = supabase
      .from('classes')
      .select(`
        id,
        class_type,
        start_time,
        end_time,
        location,
        instructor:users(first_name, last_name),
        attendance(
          check_in_time,
          student:students(first_name, last_name, belt_color)
        )
      `)
      .gte('start_time', filters.startDate)
      .lte('start_time', filters.endDate)
      .order('start_time', { ascending: false })

    if (filters.classTypes?.length) {
      query = query.in('class_type', filters.classTypes)
    }

    const { data: classData, error } = await query

    if (error) {
      throw new Error(`Failed to fetch class data: ${error.message}`)
    }

    return classData?.map(cls => ({
      class_id: cls.id,
      class_type: cls.class_type,
      date: new Date(cls.start_time).toLocaleDateString(),
      start_time: new Date(cls.start_time).toLocaleTimeString(),
      location: cls.location,
      instructor_name: cls.instructor 
        ? `${(cls.instructor as any).first_name} ${(cls.instructor as any).last_name}`
        : 'Not assigned',
      total_capacity: 20, // This could be configurable per class type
      students_attended: cls.attendance?.length || 0,
      attendance_rate: Math.round(((cls.attendance?.length || 0) / 20) * 100),
      students: cls.attendance?.map(att => ({
        student_name: att.student 
          ? `${(att.student as any).first_name} ${(att.student as any).last_name}`
          : 'Unknown',
        belt_color: (att.student as any)?.belt_color || 'Unknown',
        check_in_time: new Date(att.check_in_time).toLocaleTimeString()
      })) || []
    })) || []
  },

  /**
   * Get promotion candidates
   */
  async getPromotionCandidates(weeksBack: number = 8, minClassesPerWeek: number = 2): Promise<any[]> {
    const { data, error } = await supabase.rpc('fn_promotion_candidates', {
      weeks_back: weeksBack,
      min_classes_per_week: minClassesPerWeek
    })

    if (error) {
      throw new Error(`Failed to fetch promotion candidates: ${error.message}`)
    }

    return data || []
  },

  /**
   * Export attendance report to CSV
   */
  exportAttendanceToCSV(data: AttendanceReportData[]): string {
    const headers = [
      'Student Name',
      'Belt Color',
      'Program', 
      'Total Classes',
      'Attendance Rate (%)',
      'Last Attendance'
    ]

    const rows = data.map(student => [
      student.student_name,
      student.belt_color,
      student.program,
      student.total_classes.toString(),
      student.attendance_rate.toString(),
      student.last_attendance 
        ? new Date(student.last_attendance).toLocaleDateString()
        : 'Never'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n')

    return csvContent
  },

  /**
   * Export class report to CSV
   */
  exportClassToCSV(data: ClassReportData[]): string {
    const headers = [
      'Date',
      'Class Type',
      'Start Time',
      'Location',
      'Instructor',
      'Students Attended',
      'Attendance Rate (%)'
    ]

    const rows = data.map(cls => [
      cls.date,
      cls.class_type,
      cls.start_time,
      cls.location,
      cls.instructor_name,
      cls.students_attended.toString(),
      cls.attendance_rate.toString()
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n')

    return csvContent
  },

  /**
   * Generate PDF report for attendance
   */
  async generateAttendancePDF(
    data: AttendanceReportData[], 
    filters: ReportFilters,
    title: string = 'Attendance Report'
  ): Promise<Uint8Array> {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.setTextColor(0, 0, 0) // Black
    doc.text(title, 20, 30)
    
    // Subheader with date range
    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.text(
      `Report Period: ${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}`,
      20, 40
    )
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 50)

    // Summary stats
    const totalStudents = data.length
    const avgAttendanceRate = Math.round(
      data.reduce((sum, student) => sum + student.attendance_rate, 0) / totalStudents
    )
    const totalClasses = data.reduce((sum, student) => sum + student.total_classes, 0)

    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(`Total Students: ${totalStudents}`, 20, 65)
    doc.text(`Average Attendance Rate: ${avgAttendanceRate}%`, 20, 75)
    doc.text(`Total Class Attendances: ${totalClasses}`, 20, 85)

    // Table headers
    let yPosition = 100
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    
    const headers = ['Student Name', 'Belt', 'Program', 'Classes', 'Rate%']
    const columnWidths = [70, 25, 30, 20, 20]
    let xPosition = 20

    headers.forEach((header, index) => {
      doc.text(header, xPosition, yPosition)
      xPosition += columnWidths[index]
    })

    // Table data
    yPosition += 10
    doc.setFont('helvetica', 'normal')

    data.slice(0, 30).forEach(student => { // Limit to first 30 students
      if (yPosition > 270) { // New page if needed
        doc.addPage()
        yPosition = 30
      }

      xPosition = 20
      const row = [
        student.student_name.substring(0, 25), // Truncate long names
        student.belt_color,
        student.program.substring(0, 10),
        student.total_classes.toString(),
        student.attendance_rate.toString() + '%'
      ]

      row.forEach((cell, index) => {
        doc.text(cell, xPosition, yPosition)
        xPosition += columnWidths[index]
      })

      yPosition += 7
    })

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('PMMA Attendance Tracker', 20, 290)

    return doc.output('arraybuffer') as Uint8Array
  },

  /**
   * Download file helper
   */
  downloadFile(content: string | Uint8Array, filename: string, type: 'csv' | 'pdf') {
    const mimeType = type === 'csv' ? 'text/csv' : 'application/pdf'
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    
    URL.revokeObjectURL(url)
  }
}

function getDaysInRange(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}