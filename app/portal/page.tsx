'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/auth'
import { familyService } from '@/lib/families'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Student, Attendance } from '@/lib/types'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

interface ParentPortalData {
  students: Array<{
    student: Student
    recentAttendance: Attendance[]
    attendanceStreak: number
    totalClasses: number
  }>
}

export default function ParentPortalPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [portalData, setPortalData] = useState<ParentPortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Login form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { user: currentUser } = await auth.getCurrentUser()
      
      if (currentUser && currentUser.role === 'parent') {
        setUser(currentUser)
        loadPortalData(currentUser.id)
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setLoading(false)
    }
  }

  const loadPortalData = async (parentId: string) => {
    try {
      // Get family data
      const { data: family, error: familyError } = await familyService.getFamilyByParentId(parentId)
      
      if (familyError || !family) {
        setError('Unable to load family data')
        setLoading(false)
        return
      }

      // For each student, get recent attendance and calculate metrics
      const studentData = await Promise.all(
        family.students.map(async (student) => {
          // Get recent attendance (last 30 days)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

          const { data: attendance, error: attendanceError } = await supabase
            .from('attendance')
            .select(`
              *,
              class:classes(*)
            `)
            .eq('student_id', student.id)
            .gte('check_in_time', thirtyDaysAgo.toISOString())
            .order('check_in_time', { ascending: false })

          if (attendanceError) {
            console.error('Failed to load attendance for student:', student.id, attendanceError)
          }

          // Calculate attendance streak (consecutive days with attendance)
          const attendanceStreak = calculateAttendanceStreak(attendance || [])
          
          return {
            student,
            recentAttendance: attendance || [],
            attendanceStreak,
            totalClasses: attendance?.length || 0
          }
        })
      )

      setPortalData({ students: studentData })
    } catch (error) {
      console.error('Failed to load portal data:', error)
      setError('Failed to load portal data')
    } finally {
      setLoading(false)
    }
  }

  const calculateAttendanceStreak = (attendance: Attendance[]): number => {
    if (attendance.length === 0) return 0

    // Sort by date (most recent first)
    const sortedAttendance = attendance.sort((a, b) => 
      new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime()
    )

    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    for (const record of sortedAttendance) {
      const recordDate = new Date(record.check_in_time)
      recordDate.setHours(0, 0, 0, 0)

      // If this record is from today or yesterday, continue streak
      const dayDiff = Math.floor((currentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (dayDiff <= 1) {
        streak++
        currentDate = recordDate
      } else {
        break
      }
    }

    return streak
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setError('')

    try {
      const { data, error } = await auth.signIn(email, password)
      
      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        // Check if user is a parent
        const { user: userData } = await auth.getCurrentUser()
        if (userData?.role !== 'parent') {
          setError('This portal is only for parent accounts')
          await auth.signOut()
          return
        }

        setUser(userData)
        loadPortalData(userData.id)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleSignOut = async () => {
    await auth.signOut()
    setUser(null)
    setPortalData(null)
    setEmail('')
    setPassword('')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
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

  // Login form
  if (!user) {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img 
            src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/Uj6CJxWXVU8HyNgI39xb/media/88575c62-51f8-4837-875d-808d452bbc6b.png"
            alt="PMMA Logo"
            className="mx-auto h-24 w-auto"
          />
          <h2 className="mt-6 text-center text-3xl font-bold text-primary">
            Parent Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            View your child&apos;s attendance and progress
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border">
            <form className="space-y-6" onSubmit={handleLogin}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                loading={loginLoading}
                className="w-full"
              >
                Sign in to Portal
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/')}
                className="text-secondary hover:text-yellow-600 font-medium"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Portal dashboard
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img 
                src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/Uj6CJxWXVU8HyNgI39xb/media/88575c62-51f8-4837-875d-808d452bbc6b.png"
                alt="PMMA"
                className="h-8 w-auto mr-3"
              />
              <div>
                <h1 className="text-2xl font-bold text-primary">Parent Portal</h1>
                <p className="text-sm text-gray-600">Welcome, {user.first_name} {user.last_name}</p>
              </div>
            </div>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {!portalData ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">Contact the dojo to link your children to your account.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {portalData.students.map((studentData) => (
              <div key={studentData.student.id} className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {studentData.student.first_name} {studentData.student.last_name}
                      </h2>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getBeltColorClass(studentData.student.belt_color)}`}>
                          {studentData.student.belt_color} Belt
                        </span>
                        <span className="text-sm text-gray-600">{studentData.student.program}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">{studentData.attendanceStreak}</div>
                      <div className="text-sm text-gray-600">Day Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-secondary">{studentData.totalClasses}</div>
                      <div className="text-sm text-gray-600">Classes (30 days)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-accent">{studentData.student.belt_color}</div>
                      <div className="text-sm text-gray-600">Current Belt</div>
                    </div>
                  </div>

                  {/* Recent Attendance */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Attendance</h3>
                    {studentData.recentAttendance.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No recent attendance records</p>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {studentData.recentAttendance.slice(0, 10).map((attendance) => (
                          <div key={attendance.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div>
                              <div className="font-medium text-gray-900">
                                {attendance.class?.class_type}
                              </div>
                              <div className="text-sm text-gray-600">
                                {attendance.class?.location}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {formatDate(attendance.check_in_time)}
                              </div>
                              <div className="text-sm text-gray-600">
                                {new Date(attendance.check_in_time).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}