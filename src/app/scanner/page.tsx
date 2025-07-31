'use client'

import { useState } from 'react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import AuthGuard from '@/components/auth/AuthGuard'
import Header from '@/components/layout/Header'
import QRScanner from '@/components/scanner/QRScanner'
import { supabase } from '@/lib/supabase'
import { parseQRCode } from '@/utils/qr-generator'
import { CheckCircle, AlertCircle, Users } from 'lucide-react'
import type { Student } from '@/types'

interface ScanResult {
  type: 'success' | 'error'
  message: string
  students?: Student[]
}

export default function ScannerPage() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [manualQR, setManualQR] = useState('')

  async function processQRCode(qrCode: string) {
    setIsProcessing(true)
    setScanResult(null)

    try {
      const parsed = parseQRCode(qrCode)
      
      if (!parsed) {
        setScanResult({
          type: 'error',
          message: 'Invalid QR code format'
        })
        return
      }

      if (parsed.type === 'student') {
        // Handle individual student scan
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('qr_code', qrCode)
          .single()

        if (studentError || !student) {
          setScanResult({
            type: 'error',
            message: 'Student not found'
          })
          return
        }

        // Get current active class
        const now = new Date().toISOString()
        const { data: currentClass } = await supabase
          .from('classes')
          .select('*')
          .lte('start_time', now)
          .gte('end_time', now)
          .order('start_time', { ascending: false })
          .limit(1)
          .single()

        if (!currentClass) {
          setScanResult({
            type: 'error',
            message: 'No active class found'
          })
          return
        }

        // Check if already checked in
        const { data: existingAttendance } = await supabase
          .from('attendance')
          .select('*')
          .eq('student_id', student.id)
          .eq('class_id', currentClass.id)
          .single()

        if (existingAttendance) {
          setScanResult({
            type: 'error',
            message: `${student.first_name} ${student.last_name} is already checked in`
          })
          return
        }

        // Create attendance record
        const { error: attendanceError } = await supabase
          .from('attendance')
          .insert({
            student_id: student.id,
            class_id: currentClass.id,
            check_in_time: new Date().toISOString()
          })

        if (attendanceError) {
          setScanResult({
            type: 'error',
            message: 'Failed to check in student'
          })
          return
        }

        setScanResult({
          type: 'success',
          message: `Successfully checked in ${student.first_name} ${student.last_name}`,
          students: [student]
        })

      } else if (parsed.type === 'family') {
        // Handle family scan
        const { data: parent, error: parentError } = await supabase
          .from('parents')
          .select('*')
          .eq('family_qr_code', qrCode)
          .single()

        if (parentError || !parent) {
          setScanResult({
            type: 'error',
            message: 'Family not found'
          })
          return
        }

        // Get all students for this family
        const { data: parentStudents, error: studentsError } = await supabase
          .from('parent_students')
          .select('student_id')
          .eq('parent_id', parent.user_id)

        if (studentsError || !parentStudents || parentStudents.length === 0) {
          setScanResult({
            type: 'error',
            message: 'No students found for this family'
          })
          return
        }

        // Get student details
        const studentIds = parentStudents.map(ps => ps.student_id)
        const { data: students, error: studentDetailsError } = await supabase
          .from('students')
          .select('*')
          .in('id', studentIds)

        if (studentDetailsError || !students) {
          setScanResult({
            type: 'error',
            message: 'Failed to load student details'
          })
          return
        }

        // Get current active class
        const now = new Date().toISOString()
        const { data: currentClass } = await supabase
          .from('classes')
          .select('*')
          .lte('start_time', now)
          .gte('end_time', now)
          .order('start_time', { ascending: false })
          .limit(1)
          .single()

        if (!currentClass) {
          setScanResult({
            type: 'error',
            message: 'No active class found'
          })
          return
        }

        // Check in all family students
        const checkInPromises = students.map(student => 
          supabase
            .from('attendance')
            .upsert({
              student_id: student.id,
              class_id: currentClass.id,
              check_in_time: new Date().toISOString()
            }, {
              onConflict: 'student_id,class_id'
            })
        )

        await Promise.all(checkInPromises)

        setScanResult({
          type: 'success',
          message: `Successfully checked in ${students.length} family member(s)`,
          students
        })
      }

    } catch (error: any) {
      console.error('QR processing error:', error)
      setScanResult({
        type: 'error',
        message: error.message || 'Failed to process QR code'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (manualQR.trim()) {
      processQRCode(manualQR.trim())
      setManualQR('')
    }
  }

  return (
    <AuthGuard roles={['owner', 'manager', 'instructor']}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-primary">QR Code Scanner</h1>
              <p className="mt-2 text-gray-600">
                Scan student or family QR codes to check in for classes.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Scanner Section */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-medium text-primary mb-4">Camera Scanner</h2>
                <QRScanner 
                  onScan={processQRCode}
                  onError={(error) => setScanResult({ type: 'error', message: error })}
                />
              </div>

              {/* Manual Entry & Results */}
              <div className="space-y-6">
                {/* Manual Entry */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-medium text-primary mb-4">Manual Entry</h2>
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="manual-qr" className="block text-sm font-medium text-gray-700">
                        QR Code
                      </label>
                      <input
                        type="text"
                        id="manual-qr"
                        value={manualQR}
                        onChange={(e) => setManualQR(e.target.value)}
                        placeholder="Enter QR code manually"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isProcessing || !manualQR.trim()}
                      className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-gray-800 disabled:opacity-50"
                    >
                      {isProcessing ? 'Processing...' : 'Check In'}
                    </button>
                  </form>
                </div>

                {/* Results */}
                {scanResult && (
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className={`flex items-start space-x-3 ${
                      scanResult.type === 'success' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {scanResult.type === 'success' ? (
                        <CheckCircle className="h-6 w-6 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-6 w-6 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-medium">
                          {scanResult.type === 'success' ? 'Success!' : 'Error'}
                        </h3>
                        <p className="mt-1">{scanResult.message}</p>
                        
                        {scanResult.students && scanResult.students.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium text-gray-900 mb-2">Students Checked In:</h4>
                            <div className="space-y-2">
                              {scanResult.students.map((student) => (
                                <div key={student.id} className="flex items-center space-x-2 text-gray-700">
                                  <Users className="h-4 w-4" />
                                  <span>{student.first_name} {student.last_name}</span>
                                  <span className="text-sm text-gray-500">({student.belt_color} Belt)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {isProcessing && (
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="text-gray-700">Processing QR code...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}