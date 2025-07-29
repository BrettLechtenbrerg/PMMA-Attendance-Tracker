'use client'

import { useState, useEffect } from 'react'
import { OfflineManager } from '@/lib/offline-manager'

export default function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [queueLength, setQueueLength] = useState(0)
  const [syncInProgress, setSyncInProgress] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const offlineManager = OfflineManager.getInstance()
    
    const updateStatus = () => {
      const status = offlineManager.getQueueStatus()
      setIsOnline(status.isOnline)
      setQueueLength(status.queueLength)
      setSyncInProgress(status.syncInProgress)
    }

    // Initial status
    updateStatus()

    // Set up event listeners
    const handleOnline = () => {
      setIsOnline(true)
      updateStatus()
    }

    const handleOffline = () => {
      setIsOnline(false)
      updateStatus()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Periodic status updates
    const interval = setInterval(updateStatus, 5000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  const handleSyncNow = async () => {
    const offlineManager = OfflineManager.getInstance()
    const result = await offlineManager.syncQueue()
    console.log('Sync result:', result)
  }

  // Don't show if online and no queue
  if (isOnline && queueLength === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className={`rounded-lg shadow-lg p-3 cursor-pointer transition-all ${
          isOnline 
            ? 'bg-blue-50 border border-blue-200' 
            : 'bg-red-50 border border-red-200'
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isOnline ? 'bg-green-500' : 'bg-red-500'
          }`} />
          
          <span className={`text-sm font-medium ${
            isOnline ? 'text-blue-800' : 'text-red-800'
          }`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>

          {queueLength > 0 && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              isOnline ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
            }`}>
              {queueLength} pending
            </span>
          )}

          {syncInProgress && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
          )}
        </div>

        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                  {isOnline ? 'Connected' : 'No connection'}
                </span>
              </div>
              
              {queueLength > 0 && (
                <div className="flex justify-between">
                  <span>Queued items:</span>
                  <span>{queueLength}</span>
                </div>
              )}

              {syncInProgress && (
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-blue-600">Syncing...</span>
                </div>
              )}
            </div>

            {isOnline && queueLength > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleSyncNow()
                }}
                className="mt-2 w-full text-xs bg-primary text-white py-1 px-2 rounded hover:bg-gray-800 transition-colors"
              >
                Sync Now
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}