'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'
import DashboardLayout from '@/components/DashboardLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { familyService, FamilyData, ParentFormData } from '@/lib/families'
import { studentService } from '@/lib/students'
import { Student } from '@/lib/types'

export default function FamiliesPage() {
  const [families, setFamilies] = useState<FamilyData[]>([])
  const [unlinkedStudents, setUnlinkedStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState('')

  // Create parent form state
  const [createLoading, setCreateLoading] = useState(false)
  const [parentForm, setParentForm] = useState<ParentFormData>({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [familiesResult, studentsResult] = await Promise.all([
        familyService.getAllFamilies(),
        familyService.getUnlinkedStudents()
      ])

      if (familiesResult.error) {
        setError('Failed to load families')
        console.error(familiesResult.error)
      } else {
        setFamilies(familiesResult.data || [])
      }

      if (studentsResult.error) {
        console.error('Failed to load unlinked students:', studentsResult.error)
      } else {
        setUnlinkedStudents(studentsResult.data || [])
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateParent = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setError('')

    try {
      const { data, error } = await familyService.createParent(parentForm)
      
      if (error) {
        setError(error.message || 'Failed to create parent account')
        return
      }

      // Reset form and close modal
      setParentForm({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
      })
      setShowCreateForm(false)
      
      // Reload data
      await loadData()
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleLinkStudent = async (parentId: string) => {
    if (!selectedStudent) return

    try {
      const { error } = await familyService.linkStudentToParent(parentId, selectedStudent)
      
      if (error) {
        setError('Failed to link student to family')
        return
      }

      setShowLinkModal(null)
      setSelectedStudent('')
      await loadData()
    } catch (err) {
      setError('Failed to link student to family')
    }
  }

  const handleUnlinkStudent = async (parentId: string, studentId: string) => {
    if (!confirm('Are you sure you want to unlink this student from the family?')) {
      return
    }

    try {
      const { error } = await familyService.unlinkStudentFromParent(parentId, studentId)
      
      if (error) {
        setError('Failed to unlink student')
        return
      }

      await loadData()
    } catch (err) {
      setError('Failed to unlink student')
    }
  }

  const handleDeleteFamily = async (parentId: string, familyName: string) => {
    if (!confirm(`Are you sure you want to delete the ${familyName} family? This will remove the parent account and unlink all students.`)) {
      return
    }

    try {
      const { error } = await familyService.deleteParent(parentId)
      
      if (error) {
        setError('Failed to delete family')
        return
      }

      await loadData()
    } catch (err) {
      setError('Failed to delete family')
    }
  }

  const downloadFamilyQRCode = async (family: FamilyData) => {
    try {
      const familyName = `${family.parent.user?.first_name} ${family.parent.user?.last_name}`.trim()
      const qrCodeUrl = await familyService.getFamilyQRCode(family.parent.family_qr_code, familyName)
      
      if (qrCodeUrl) {
        const link = document.createElement('a')
        link.download = `${familyName}-Family-QR.png`
        link.href = qrCodeUrl
        link.click()
      }
    } catch (error) {
      setError('Failed to generate QR code')
    }
  }

  if (loading) {
    return (
      <AuthGuard allowedRoles={['owner', 'manager']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard allowedRoles={['owner', 'manager']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary">Family Management</h1>
              <p className="mt-2 text-gray-600">Manage parent accounts and student-family relationships</p>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              Create Parent Account
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Create Parent Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create Parent Account</h3>
                
                <form onSubmit={handleCreateParent} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      value={parentForm.first_name}
                      onChange={(e) => setParentForm(prev => ({ ...prev, first_name: e.target.value }))}
                      required
                    />
                    <Input
                      label="Last Name"
                      value={parentForm.last_name}
                      onChange={(e) => setParentForm(prev => ({ ...prev, last_name: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <Input
                    label="Email"
                    type="email"
                    value={parentForm.email}
                    onChange={(e) => setParentForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                  
                  <Input
                    label="Password"
                    type="password"
                    value={parentForm.password}
                    onChange={(e) => setParentForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                    helperText="Minimum 6 characters"
                  />
                  
                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" loading={createLoading}>
                      Create Account
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Link Student Modal */}
          {showLinkModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Link Student to Family</h3>
                
                <div className="space-y-4">
                  <Select
                    label="Select Student"
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    options={[
                      { value: '', label: 'Choose a student...' },
                      ...unlinkedStudents.map(student => ({
                        value: student.id,
                        label: `${student.first_name} ${student.last_name}`
                      }))
                    ]}
                    required
                  />
                  
                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowLinkModal(null)
                        setSelectedStudent('')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleLinkStudent(showLinkModal)}
                      disabled={!selectedStudent}
                    >
                      Link Student
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Families List */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Families ({families.length})</h2>
            </div>

            {families.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No families found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a parent account.</p>
                <div className="mt-6">
                  <Button onClick={() => setShowCreateForm(true)}>
                    Create Parent Account
                  </Button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {families.map((family) => (
                  <div key={family.parent.user_id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-4">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {family.parent.user?.first_name} {family.parent.user?.last_name}
                            </h3>
                            <p className="text-sm text-gray-500">{family.parent.user?.email}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">
                            Students ({family.students.length})
                          </h4>
                          {family.students.length === 0 ? (
                            <p className="text-sm text-gray-500">No students linked</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {family.students.map((student) => (
                                <div
                                  key={student.id}
                                  className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full text-sm"
                                >
                                  <span>{student.first_name} {student.last_name}</span>
                                  <button
                                    onClick={() => handleUnlinkStudent(family.parent.user_id, student.id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowLinkModal(family.parent.user_id)}
                        >
                          Link Student
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadFamilyQRCode(family)}
                        >
                          QR Code
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteFamily(
                            family.parent.user_id,
                            `${family.parent.user?.first_name} ${family.parent.user?.last_name}`.trim()
                          )}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unlinked Students */}
          {unlinkedStudents.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Unlinked Students ({unlinkedStudents.length})
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                These students are not linked to any family account.
              </p>
              <div className="flex flex-wrap gap-2">
                {unlinkedStudents.map((student) => (
                  <div
                    key={student.id}
                    className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm"
                  >
                    {student.first_name} {student.last_name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}