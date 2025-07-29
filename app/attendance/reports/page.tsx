'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'
import DashboardLayout from '@/components/DashboardLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { reportsService, ReportFilters, AttendanceReportData, ClassReportData } from '@/lib/reports'
import { studentService } from '@/lib/students'
import { Student } from '@/lib/types'

export default function ReportsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [reportType, setReportType] = useState<'attendance' | 'class' | 'promotion'>('attendance')
  const [attendanceData, setAttendanceData] = useState<AttendanceReportData[]>([])
  const [classData, setClassData] = useState<ClassReportData[]>([])
  const [promotionData, setPromotionData] = useState<any[]>([])
  
  // Filters
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // today
    studentIds: [],
    classTypes: [],
    beltColors: [],
    programs: []
  })

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      const { data, error } = await studentService.getActiveStudents()
      if (error) {
        console.error('Failed to load students:', error)
        return
      }
      setStudents(data || [])
    } catch (err) {
      console.error('Failed to load students:', err)
    }
  }

  const generateReport = async () => {
    setLoading(true)
    setError('')

    try {
      switch (reportType) {
        case 'attendance':
          const attendanceResult = await reportsService.generateAttendanceReport(filters)
          setAttendanceData(attendanceResult)
          break
          
        case 'class':
          const classResult = await reportsService.generateClassReport(filters)
          setClassData(classResult)
          break
          
        case 'promotion':
          const promotionResult = await reportsService.getPromotionCandidates(8, 2)
          setPromotionData(promotionResult)
          break
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = () => {
    let csvContent = ''
    let filename = ''

    switch (reportType) {
      case 'attendance':
        csvContent = reportsService.exportAttendanceToCSV(attendanceData)
        filename = `attendance-report-${filters.startDate}-to-${filters.endDate}.csv`
        break
        
      case 'class':
        csvContent = reportsService.exportClassToCSV(classData)
        filename = `class-report-${filters.startDate}-to-${filters.endDate}.csv`
        break
        
      case 'promotion':
        // Simple CSV for promotion candidates
        const headers = ['Student Name', 'Current Belt', 'Avg Classes/Week', 'Total Classes']
        const rows = promotionData.map(candidate => [
          candidate.student_name,
          candidate.current_belt,
          candidate.avg_classes_per_week.toString(),
          candidate.total_classes.toString()
        ])
        csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(field => `"${field}"`).join(','))
        ].join('\n')
        filename = `promotion-candidates-${new Date().toISOString().split('T')[0]}.csv`
        break
    }

    if (csvContent) {
      reportsService.downloadFile(csvContent, filename, 'csv')
    }
  }

  const downloadPDF = async () => {
    if (reportType === 'attendance' && attendanceData.length > 0) {
      try {
        const pdfBuffer = await reportsService.generateAttendancePDF(
          attendanceData,
          filters,
          'PMMA Attendance Report'
        )
        const filename = `attendance-report-${filters.startDate}-to-${filters.endDate}.pdf`
        reportsService.downloadFile(pdfBuffer, filename, 'pdf')
      } catch (err) {
        setError('Failed to generate PDF')
      }
    }
  }

  const classTypeOptions = [
    { value: 'Tiny Tigers', label: 'Tiny Tigers' },
    { value: 'Kids', label: 'Kids' },
    { value: 'Teens', label: 'Teens' },
    { value: 'Adults', label: 'Adults' },
    { value: 'Weapons', label: 'Weapons' },
    { value: 'Black Belt', label: 'Black Belt' }
  ]

  const beltColorOptions = [
    { value: 'White', label: 'White' },
    { value: 'Yellow', label: 'Yellow' },
    { value: 'Orange', label: 'Orange' },
    { value: 'Green', label: 'Green' },
    { value: 'Blue', label: 'Blue' },
    { value: 'Purple', label: 'Purple' },
    { value: 'Brown', label: 'Brown' },
    { value: 'Red', label: 'Red' },
    { value: 'Black', label: 'Black' }
  ]

  const programOptions = [
    { value: 'Basic', label: 'Basic' },
    { value: 'Masters Club', label: 'Masters Club' },
    { value: 'Leadership', label: 'Leadership' }
  ]

  const getBeltColorClass = (beltColor: string) => {
    const colorMap: Record<string, string> = {
      'White': 'bg-gray-100 text-gray-800',
      'Yellow': 'bg-yellow-100 text-yellow-800',
      'Orange': 'bg-orange-100 text-orange-800',
      'Green': 'bg-green-100 text-green-800',
      'Blue': 'bg-blue-100 text-blue-800',
      'Purple': 'bg-purple-100 text-purple-800',
      'Brown': 'bg-yellow-600 text-white',
      'Red': 'bg-red-100 text-red-800',
      'Black': 'bg-gray-900 text-white'
    }
    return colorMap[beltColor] || 'bg-gray-100 text-gray-800'
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">Reports & Analytics</h1>
            <p className="mt-2 text-gray-600">Generate and export attendance reports</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Report Configuration */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <Select
                label="Report Type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                options={[
                  { value: 'attendance', label: 'Student Attendance' },
                  { value: 'class', label: 'Class Summary' },
                  { value: 'promotion', label: 'Promotion Candidates' }
                ]}
              />

              <Input
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />

              <Input
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <Button onClick={generateReport} loading={loading}>
                  Generate Report
                </Button>
                
                {(attendanceData.length > 0 || classData.length > 0 || promotionData.length > 0) && (
                  <>
                    <Button variant="outline" onClick={downloadCSV}>
                      Download CSV
                    </Button>
                    
                    {reportType === 'attendance' && (
                      <Button variant="outline" onClick={downloadPDF}>
                        Download PDF
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Report Results */}
          {reportType === 'attendance' && attendanceData.length > 0 && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Attendance Report ({attendanceData.length} students)
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Belt
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Program
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Classes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Attendance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceData.map((student) => (
                      <tr key={student.student_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {student.student_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBeltColorClass(student.belt_color)}`}>
                            {student.belt_color}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.program}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.total_classes}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {student.attendance_rate}%
                            </div>
                            <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${Math.min(student.attendance_rate, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.last_attendance 
                            ? new Date(student.last_attendance).toLocaleDateString()
                            : 'Never'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === 'class' && classData.length > 0 && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Class Report ({classData.length} classes)
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Instructor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {classData.map((cls) => (
                      <tr key={cls.class_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cls.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {cls.class_type}
                          </div>
                          <div className="text-sm text-gray-500">
                            {cls.start_time} - {cls.location}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cls.instructor_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cls.students_attended} / {cls.total_capacity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {cls.attendance_rate}%
                            </div>
                            <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-secondary h-2 rounded-full" 
                                style={{ width: `${Math.min(cls.attendance_rate, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === 'promotion' && promotionData.length > 0 && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Promotion Candidates ({promotionData.length} students)
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Students attending ≥2 classes per week for the last 8 weeks
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Belt
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Classes/Week
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Classes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {promotionData.map((candidate, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {candidate.student_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBeltColorClass(candidate.current_belt)}`}>
                            {candidate.current_belt}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {candidate.avg_classes_per_week}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {candidate.total_classes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && reportType === 'attendance' && attendanceData.length === 0 && (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No report data</h3>
              <p className="mt-1 text-sm text-gray-500">
                Click &quot;Generate Report&quot; to create your first report.
              </p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}