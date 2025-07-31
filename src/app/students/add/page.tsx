'use client'

import { useState } from 'react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/auth/AuthGuard'
import Header from '@/components/layout/Header'
import { supabase } from '@/lib/supabase'
import { studentSchema, beltColors, programs, studentStatuses } from '@/lib/validations'
import { generateStudentQR } from '@/utils/qr-generator'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AddStudentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    belt_color: 'White' as const,
    program: 'Basic' as const,
    status: 'Active' as const,
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_notes: '',
  })

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const validatedData = studentSchema.parse(formData)
      const qrCode = generateStudentQR()

      const { error } = await supabase
        .from('students')
        .insert({
          ...validatedData,
          qr_code: qrCode,
        })

      if (error) throw error

      router.push('/students')
    } catch (error: any) {
      if (error.errors) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err: any) => {
          if (err.path) {
            fieldErrors[err.path[0]] = err.message
          }
        })
        setErrors(fieldErrors)
      } else {
        setErrors({ submit: error.message || 'Failed to add student' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard roles={['owner', 'manager']}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <Link
                href="/students"
                className="inline-flex items-center text-primary hover:text-gray-600 mb-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Students
              </Link>
              <h1 className="text-3xl font-bold text-primary">Add New Student</h1>
              <p className="mt-2 text-gray-600">
                Enter student information to create a new profile.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {errors.submit}
                </div>
              )}

              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      required
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary ${
                        errors.first_name ? 'border-red-300' : ''
                      }`}
                    />
                    {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>}
                  </div>

                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      required
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary ${
                        errors.last_name ? 'border-red-300' : ''
                      }`}
                    />
                    {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary ${
                        errors.email ? 'border-red-300' : ''
                      }`}
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary ${
                        errors.phone ? 'border-red-300' : ''
                      }`}
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>

                  <div>
                    <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="date_of_birth"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary ${
                        errors.date_of_birth ? 'border-red-300' : ''
                      }`}
                    />
                    {errors.date_of_birth && <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>}
                  </div>
                </div>
              </div>

              {/* Training Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Training Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="belt_color" className="block text-sm font-medium text-gray-700">
                      Belt Color
                    </label>
                    <select
                      id="belt_color"
                      name="belt_color"
                      value={formData.belt_color}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    >
                      {beltColors.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="program" className="block text-sm font-medium text-gray-700">
                      Program
                    </label>
                    <select
                      id="program"
                      name="program"
                      value={formData.program}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    >
                      {programs.map(program => (
                        <option key={program} value={program}>{program}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    >
                      {studentStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-gray-700">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      id="emergency_contact_name"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-gray-700">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      id="emergency_contact_phone"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary ${
                        errors.emergency_contact_phone ? 'border-red-300' : ''
                      }`}
                    />
                    {errors.emergency_contact_phone && <p className="mt-1 text-sm text-red-600">{errors.emergency_contact_phone}</p>}
                  </div>
                </div>
              </div>

              {/* Medical Notes */}
              <div>
                <label htmlFor="medical_notes" className="block text-sm font-medium text-gray-700">
                  Medical Notes
                </label>
                <textarea
                  id="medical_notes"
                  name="medical_notes"
                  rows={3}
                  value={formData.medical_notes}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  placeholder="Any medical conditions, allergies, or special notes..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Link
                  href="/students"
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}