'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'
import DashboardLayout from '@/components/DashboardLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { notificationService, NotificationTemplate } from '@/lib/notifications'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [notificationHistory, setNotificationHistory] = useState<any[]>([])
  const [templates] = useState<NotificationTemplate[]>(notificationService.getTemplates())
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [customMessage, setCustomMessage] = useState('')

  useEffect(() => {
    loadNotificationHistory()
  }, [])

  const loadNotificationHistory = async () => {
    try {
      const history = await notificationService.getNotificationHistory(20)
      setNotificationHistory(history || [])
    } catch (err) {
      console.error('Failed to load notification history:', err)
    }
  }

  const runAbsenceCheck = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await notificationService.checkAbsenceAlerts()
      setSuccess(`Absence check completed. ${result.sent} notifications sent.`)
      
      if (result.errors.length > 0) {
        setError(`Some notifications failed: ${result.errors.join(', ')}`)
      }

      await loadNotificationHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run absence check')
    } finally {
      setLoading(false)
    }
  }

  const runBirthdayCheck = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await notificationService.checkBirthdayReminders()
      setSuccess(`Birthday check completed. ${result.sent} notifications sent.`)
      
      if (result.errors.length > 0) {
        setError(`Some notifications failed: ${result.errors.join(', ')}`)
      }

      await loadNotificationHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run birthday check')
    } finally {
      setLoading(false)
    }
  }

  const runPromotionCheck = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await notificationService.triggerWeeklyPromotionCheck()
      setSuccess(`Promotion check completed. Found ${result.candidatesCount} candidates, sent ${result.notificationsSent} notifications.`)
      
      await loadNotificationHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run promotion check')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AuthGuard allowedRoles={['owner', 'manager']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">Settings & Notifications</h1>
            <p className="mt-2 text-gray-600">Manage system settings and notification campaigns</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          {/* Notification Management */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Management</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Absence Alerts</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Check for students absent 3+ days and send reminder emails
                </p>
                <Button 
                  onClick={runAbsenceCheck} 
                  loading={loading}
                  className="w-full"
                  size="sm"
                >
                  Run Absence Check
                </Button>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Birthday Reminders</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Send birthday greetings to students celebrating today
                </p>
                <Button 
                  onClick={runBirthdayCheck} 
                  loading={loading}
                  className="w-full"
                  size="sm"
                >
                  Run Birthday Check
                </Button>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Promotion Check</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Find students ready for belt promotion and notify staff
                </p>
                <Button 
                  onClick={runPromotionCheck} 
                  loading={loading}
                  className="w-full"
                  size="sm"
                >
                  Run Promotion Check
                </Button>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Message Templates</h3>
              <div className="space-y-3">
                {templates.map((template) => (
                  <div key={template.id} className="flex items-start justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          template.channel === 'email' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {template.channel.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {template.message.substring(0, 100)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notification History */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadNotificationHistory}
                >
                  Refresh
                </Button>
              </div>
            </div>

            {notificationHistory.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 1 0-15 0v5h5l-5 5-5-5h5V7a12 12 0 1 1 24 0v10z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Notification history will appear here after sending messages.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Template
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Channel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {notificationHistory.map((notification) => (
                      <tr key={notification.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(notification.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {notification.template}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            notification.channel === 'email' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {notification.channel.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {notification.student 
                            ? `${notification.student.first_name} ${notification.student.last_name}`
                            : 'N/A'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(notification.status)}`}>
                            {notification.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* System Configuration */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">Environment Variables</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Supabase URL:</span>
                    <span className="text-green-600">✓ Configured</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SendGrid API:</span>
                    <span className="text-gray-400">⚪ Not configured</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Twilio SMS:</span>
                    <span className="text-gray-400">⚪ Not configured</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">System Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Database:</span>
                    <span className="text-green-600">✓ Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Authentication:</span>
                    <span className="text-green-600">✓ Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PWA:</span>
                    <span className="text-green-600">✓ Enabled</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h3 className="text-md font-medium text-gray-900 mb-3">Quick Actions</h3>
              <div className="flex space-x-4">
                <Button variant="outline" size="sm">
                  Export Settings
                </Button>
                <Button variant="outline" size="sm">
                  Clear Cache
                </Button>
                <Button variant="outline" size="sm">
                  View Logs
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}