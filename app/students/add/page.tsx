'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import DashboardLayout from '@/components/DashboardLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { studentService, StudentFormData } from '@/lib/students'
import { BeltColor, Program, StudentStatus } from '@/lib/types'

const beltOptions = [
  { value: 'White', label: 'White Belt' },
  { value: 'Yellow', label: 'Yellow Belt' },
  { value: 'Orange', label: 'Orange Belt' },
  { value: 'Green', label: 'Green Belt' },
  { value: 'Blue', label: 'Blue Belt' },
  { value: 'Purple', label: 'Purple Belt' },
  { value: 'Brown', label: 'Brown Belt' },
  { value: 'Red', label: 'Red Belt' },
  { value: 'Black', label: 'Black Belt' },
]

const programOptions = [
  { value: 'Basic', label: 'Basic' },
  { value: 'Masters Club', label: 'Masters Club' },
  { value: 'Leadership', label: 'Leadership' },
]

const statusOptions = [
  { value: 'Active', label: 'Active' },
  { value: 'Vacation', label: 'Vacation' },
  { value: 'Medical', label: 'Medical' },
  { value: 'Hiatus', label: 'Hiatus' },
  { value: 'Past', label: 'Past' },
]

export default function AddStudentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<StudentFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    belt_color: 'White' as BeltColor,
    program: 'Basic' as Program,
    status: 'Active' as StudentStatus,
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_notes: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await studentService.create(formData)
      
      if (error) {
        setError(error.message || 'Failed to create student')
        return
      }

      router.push('/students')
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary">Add New Student</h1>
            <p className="mt-2 text-gray-600">Create a new student record</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
                <Input
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <Input
                label="Date of Birth"
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleChange}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Select
                  label="Belt Color"
                  name="belt_color"
                  value={formData.belt_color}
                  onChange={handleChange}
                  options={beltOptions}
                  required
                />
                <Select
                  label="Program"
                  name="program"
                  value={formData.program}
                  onChange={handleChange}
                  options={programOptions}
                  required
                />
                <Select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  options={statusOptions}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Emergency Contact Name"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                />
                <Input
                  label="Emergency Contact Phone"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical Notes
                </label>
                <textarea
                  name="medical_notes"
                  value={formData.medical_notes}
                  onChange={handleChange}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Any medical conditions, allergies, or special notes..."
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                >
                  Create Student
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}