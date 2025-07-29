'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'
import DashboardLayout from '@/components/DashboardLayout'
import Button from '@/components/ui/Button'
import { studentService } from '@/lib/students'
import { qrCodeService } from '@/lib/qr-codes'
import { Student } from '@/lib/types'


export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string
  
  const [student, setStudent] = useState<Student | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (studentId) {
      loadStudent()
    }
  }, [studentId])

  const loadStudent = async () => {
    try {
      const { data, error } = await studentService.getById(studentId)
      if (error) {
        setError('Failed to load student')
        console.error(error)
        return
      }
      
      if (!data) {
        setError('Student not found')
        return
      }

      setStudent(data)
      
      // Generate QR code
      try {
        const qrUrl = await qrCodeService.generateStudentQR(
          data.id, 
          `${data.first_name} ${data.last_name}`
        )
        setQrCodeUrl(qrUrl)
      } catch (qrError) {
        console.error('Failed to generate QR code:', qrError)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!student) return
    
    if (!confirm(`Are you sure you want to delete ${student.first_name} ${student.last_name}?`)) {
      return
    }

    try {
      const { error } = await studentService.delete(student.id)
      if (error) {
        setError('Failed to delete student')
        return
      }
      router.push('/students')
    } catch (err) {
      setError('Failed to delete student')
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeUrl || !student) return

    const link = document.createElement('a')
    link.download = `${student.first_name}-${student.last_name}-QR.png`
    link.href = qrCodeUrl
    link.click()
  }

  const printQRCode = () => {
    if (!qrCodeUrl || !student) return

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${student.first_name} ${student.last_name} - QR Code</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px; 
              }
              .qr-container {
                margin: 20px auto;
                max-width: 400px;
              }
              .student-info {
                margin-bottom: 20px;
              }
              img {
                max-width: 100%;
                height: auto;
              }
            </style>
          </head>
          <body>
            <div class="student-info">
              <h1>${student.first_name} ${student.last_name}</h1>
              <p>${student.belt_color} Belt - ${student.program}</p>
            </div>
            <div class="qr-container">
              <img src="${qrCodeUrl}" alt="QR Code" />
            </div>
            <p>PMMA Attendance Tracker</p>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

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

  const getStatusClass = (status: string) => {
    const statusMap: Record<string, string> = {
      'Active': 'bg-green-100 text-green-800',
      'Vacation': 'bg-blue-100 text-blue-800',
      'Medical': 'bg-yellow-100 text-yellow-800',
      'Hiatus': 'bg-gray-100 text-gray-800',
      'Past': 'bg-red-100 text-red-800'
    }
    return statusMap[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (error || !student) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Student not found'}
            </h1>
            <Link href="/students">
              <Button>Back to Students</Button>
            </Link>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-primary">
                {student.first_name} {student.last_name}
              </h1>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getBeltColorClass(student.belt_color)}`}>
                  {student.belt_color} Belt
                </span>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusClass(student.status)}`}>
                  {student.status}
                </span>
              </div>
            </div>
            <div className="flex space-x-4">
              <Link href={`/students/${student.id}/edit`}>
                <Button>Edit Student</Button>
              </Link>
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Student Information */}
            <div className="lg:col-span-2 space-y-8">
              {/* Basic Info */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{student.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{student.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Date of Birth</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Program</label>
                    <p className="mt-1 text-sm text-gray-900">{student.program}</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Contact Name</label>
                    <p className="mt-1 text-sm text-gray-900">{student.emergency_contact_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Contact Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{student.emergency_contact_phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Medical Notes */}
              {student.medical_notes && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Medical Notes</h2>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{student.medical_notes}</p>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Student QR Code</h2>
                
                {qrCodeUrl ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <img 
                        src={qrCodeUrl} 
                        alt="Student QR Code" 
                        className="mx-auto max-w-full h-auto"
                      />
                    </div>
                    <div className="space-y-2">
                      <Button 
                        onClick={downloadQRCode}
                        className="w-full"
                        variant="outline"
                      >
                        Download QR Code
                      </Button>
                      <Button 
                        onClick={printQRCode}
                        className="w-full"
                        variant="outline"
                      >
                        Print QR Code
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Use this QR code for attendance check-in
                    </p>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 4h4m4 0h2" />
                    </svg>
                    <p>QR Code not available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}