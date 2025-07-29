'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'
import DashboardLayout from '@/components/DashboardLayout'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { attendanceService } from '@/lib/attendance'
import { Class, Attendance } from '@/lib/types'

export default function AttendancePage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'month'>('today')

  useEffect(() => {
    loadTodayClasses()
  }, [])

  useEffect(() => {
    if (selectedClassId) {
      loadClassAttendance()
    }
  }, [selectedClassId])

  const loadTodayClasses = async () => {
    try {
      const { data, error } = await attendanceService.getTodayClasses()
      if (error) {
        setError('Failed to load classes')
        console.error(error)
        return
      }
      
      const classList = data || []
      setClasses(classList)
      
      // Auto-select current class
      if (classList.length > 0) {
        const now = new Date()
        const currentClass = classList.find(cls => {
          const startTime = new Date(cls.start_time)
          const endTime = new Date(cls.end_time)
          return now >= startTime && now <= endTime
        })
        
        if (currentClass) {
          setSelectedClassId(currentClass.id)
        } else {
          // Select next upcoming class
          const upcomingClass = classList.find(cls => new Date(cls.start_time) > now)
          if (upcomingClass) {
            setSelectedClassId(upcomingClass.id)
          } else if (classList.length > 0) {
            setSelectedClassId(classList[0].id)
          }
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadClassAttendance = async () => {
    if (!selectedClassId) return

    try {
      const { data, error } = await attendanceService.getClassAttendance(selectedClassId)
      if (error) {
        setError('Failed to load attendance')
        console.error(error)
        return
      }
      setAttendance(data || [])
    } catch (err) {
      setError('Failed to load attendance')
      console.error(err)
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getClassStatus = (cls: Class) => {
    const now = new Date()
    const startTime = new Date(cls.start_time)
    const endTime = new Date(cls.end_time)
    
    if (now < startTime) {
      return { status: 'upcoming', color: 'bg-blue-100 text-blue-800' }
    } else if (now >= startTime && now <= endTime) {
      return { status: 'in-progress', color: 'bg-green-100 text-green-800' }
    } else {
      return { status: 'completed', color: 'bg-gray-100 text-gray-800' }
    }
  }

  const selectedClass = classes.find(cls => cls.id === selectedClassId)
  const classOptions = classes.map(cls => ({
    value: cls.id,
    label: `${cls.class_type} - ${formatTime(cls.start_time)} (${cls.location})`
  }))

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

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary">Attendance Dashboard</h1>
              <p className="mt-2 text-gray-600">View and manage class attendance</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="bg-white shadow rounded-lg">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {[
                  { id: 'today', label: 'Today' },
                  { id: 'week', label: 'This Week' },
                  { id: 'month', label: 'This Month' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Today Tab Content */}
            {activeTab === 'today' && (
              <div className="p-6">
                {classes.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No classes today</h3>
                    <p className="mt-1 text-sm text-gray-500">Classes will appear here when scheduled.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Class Selection */}
                    <div className="max-w-md">
                      <Select
                        label="Select Class"
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        options={[
                          { value: '', label: 'Choose a class...' },
                          ...classOptions
                        ]}
                      />
                    </div>

                    {/* Class Info */}
                    {selectedClass && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {selectedClass.class_type}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {formatTime(selectedClass.start_time)} - {formatTime(selectedClass.end_time)} | {selectedClass.location}
                            </p>
                            {selectedClass.instructor && (
                              <p className="text-sm text-gray-600">
                                Instructor: {selectedClass.instructor.first_name} {selectedClass.instructor.last_name}
                              </p>
                            )}
                          </div>
                          <div>
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getClassStatus(selectedClass).color}`}>
                              {getClassStatus(selectedClass).status.replace('-', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Attendance List */}
                    {selectedClassId && (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            Attendance ({attendance.length} students)
                          </h3>
                          <div className="text-sm text-gray-500">
                            Last updated: {new Date().toLocaleTimeString()}
                          </div>
                        </div>

                        {attendance.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="mt-2 text-sm text-gray-600">No students checked in yet</p>
                          </div>
                        ) : (
                          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="divide-y divide-gray-200">
                              {attendance.map((record) => (
                                <div key={record.id} className="p-4 hover:bg-gray-50">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                      <div className="flex-shrink-0">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {record.student?.first_name} {record.student?.last_name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          {record.student?.belt_color} Belt - {record.student?.program}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-medium text-gray-900">
                                        {formatTime(record.check_in_time)}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        Check-in time
                                      </div>
                                    </div>
                                  </div>
                                  {record.notes && (
                                    <div className="mt-2 text-sm text-gray-600 ml-14">
                                      Note: {record.notes}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Week/Month Tab Placeholders */}
            {(activeTab === 'week' || activeTab === 'month') && (
              <div className="p-6">
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {activeTab === 'week' ? 'Weekly' : 'Monthly'} reports coming soon
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Advanced reporting features will be available in a future update.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="flex space-x-4">
              <Button onClick={() => window.location.href = '/scanner'}>
                Open Scanner
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/classes'}>
                Manage Classes
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/attendance/reports'}>
                View Reports
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}