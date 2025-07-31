'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AuthGuard from '@/components/auth/AuthGuard'
import Header from '@/components/layout/Header'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Edit, QrCode } from 'lucide-react'
import type { Student } from '@/types'

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadStudents()
  }, [statusFilter])

  async function loadStudents() {
    try {
      let query = supabase
        .from('students')
        .select('*')
        .order('first_name')

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Error loading students:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase()
    return (
      student.first_name.toLowerCase().includes(searchLower) ||
      student.last_name.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      student.belt_color.toLowerCase().includes(searchLower)
    )
  })

  function getBeltColorClass(color: string) {
    const colorMap: Record<string, string> = {
      'White': 'bg-gray-100 text-gray-800',
      'Yellow': 'bg-yellow-100 text-yellow-800',
      'Orange': 'bg-orange-100 text-orange-800',
      'Green': 'bg-green-100 text-green-800',
      'Blue': 'bg-blue-100 text-blue-800',
      'Purple': 'bg-purple-100 text-purple-800',
      'Brown': 'bg-amber-100 text-amber-800',
      'Red': 'bg-red-100 text-red-800',
      'Black': 'bg-gray-900 text-white',
    }
    return colorMap[color] || 'bg-gray-100 text-gray-800'
  }

  function getStatusClass(status: string) {
    const statusMap: Record<string, string> = {
      'Active': 'bg-green-100 text-green-800',
      'Vacation': 'bg-blue-100 text-blue-800',
      'Medical': 'bg-yellow-100 text-yellow-800',
      'Hiatus': 'bg-gray-100 text-gray-800',
      'Past': 'bg-red-100 text-red-800',
    }
    return statusMap[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <AuthGuard roles={['owner', 'manager', 'instructor']}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-primary">Students</h1>
                <p className="mt-2 text-gray-600">
                  Manage student profiles and information.
                </p>
              </div>
              <Link
                href="/students/add"
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-gray-800 flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add Student</span>
              </Link>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    loadStudents()
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Vacation">Vacation</option>
                  <option value="Medical">Medical</option>
                  <option value="Hiatus">Hiatus</option>
                  <option value="Past">Past</option>
                </select>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse flex space-x-4">
                        <div className="rounded-full bg-gray-300 h-10 w-10"></div>
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No students found.</p>
                    <Link
                      href="/students/add"
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-gray-800"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add your first student
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Belt
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Program
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                                    <span className="text-white font-medium">
                                      {student.first_name[0]}{student.last_name[0]}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {student.first_name} {student.last_name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {student.email}
                                  </div>
                                </div>
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
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(student.status)}`}>
                                {student.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.phone || 'No phone'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <Link
                                  href={`/students/${student.id}`}
                                  className="text-primary hover:text-gray-800"
                                  title="View Details"
                                >
                                  <QrCode className="h-5 w-5" />
                                </Link>
                                <Link
                                  href={`/students/${student.id}/edit`}
                                  className="text-primary hover:text-gray-800"
                                  title="Edit Student"
                                >
                                  <Edit className="h-5 w-5" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {filteredStudents.length > 0 && (
              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredStudents.length} of {students.length} students
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}