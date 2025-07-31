'use client'

import { useEffect, useState } from 'react'
import AuthGuard from '@/components/auth/AuthGuard'
import Header from '@/components/layout/Header'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Users, Calendar, CheckCircle, Award } from 'lucide-react'
import type { User } from '@/types'

interface DashboardStats {
  totalStudents: number
  activeStudents: number
  todayAttendance: number
  thisWeekClasses: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeStudents: 0,
    todayAttendance: 0,
    thisWeekClasses: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)

        const today = new Date().toISOString().split('T')[0]
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)

        const [studentsRes, activeStudentsRes, attendanceRes, classesRes] = await Promise.all([
          supabase.from('students').select('id', { count: 'exact' }),
          supabase.from('students').select('id', { count: 'exact' }).eq('status', 'Active'),
          supabase.from('attendance').select('id', { count: 'exact' }).gte('check_in_time', today),
          supabase.from('classes').select('id', { count: 'exact' })
            .gte('start_time', weekStart.toISOString())
            .lte('start_time', weekEnd.toISOString())
        ])

        setStats({
          totalStudents: studentsRes.count || 0,
          activeStudents: activeStudentsRes.count || 0,
          todayAttendance: attendanceRes.count || 0,
          thisWeekClasses: classesRes.count || 0
        })
      } catch (error) {
        console.error('Dashboard error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  return (
    <AuthGuard roles={['owner', 'manager', 'instructor']}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-primary">
                Welcome back, {user?.first_name}!
              </h1>
              <p className="mt-2 text-gray-600">
                Here&apos;s what&apos;s happening at the dojo today.
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-gray-300 rounded"></div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                          <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Users className="h-8 w-8 text-secondary" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Students
                          </dt>
                          <dd className="text-lg font-medium text-primary">
                            {stats.totalStudents}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Award className="h-8 w-8 text-green-500" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Active Students
                          </dt>
                          <dd className="text-lg font-medium text-primary">
                            {stats.activeStudents}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CheckCircle className="h-8 w-8 text-accent" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Today&apos;s Attendance
                          </dt>
                          <dd className="text-lg font-medium text-primary">
                            {stats.todayAttendance}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Calendar className="h-8 w-8 text-blue-500" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            This Week&apos;s Classes
                          </dt>
                          <dd className="text-lg font-medium text-primary">
                            {stats.thisWeekClasses}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-primary mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <a
                    href="/scanner"
                    className="flex items-center p-3 text-sm font-medium text-primary bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <CheckCircle className="h-5 w-5 mr-3 text-secondary" />
                    Check-in Students
                  </a>
                  <a
                    href="/students/add"
                    className="flex items-center p-3 text-sm font-medium text-primary bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <Users className="h-5 w-5 mr-3 text-secondary" />
                    Add New Student
                  </a>
                  <a
                    href="/classes/add"
                    className="flex items-center p-3 text-sm font-medium text-primary bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <Calendar className="h-5 w-5 mr-3 text-secondary" />
                    Schedule Class
                  </a>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-primary mb-4">Recent Activity</h3>
                <div className="text-sm text-gray-500">
                  Recent attendance and activity will be displayed here.
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}