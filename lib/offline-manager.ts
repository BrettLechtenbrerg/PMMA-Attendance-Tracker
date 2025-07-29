/**
 * Offline manager for handling sync queues and background operations
 */

export interface OfflineQueueItem {
  id: string
  type: 'attendance' | 'student_update' | 'notification'
  data: any
  timestamp: string
  retryCount: number
  maxRetries: number
}

export class OfflineManager {
  private static instance: OfflineManager
  private queue: OfflineQueueItem[] = []
  private isOnline = true
  private syncInProgress = false

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager()
    }
    return OfflineManager.instance
  }

  constructor() {
    this.loadQueue()
    this.setupEventListeners()
    this.checkOnlineStatus()
  }

  private setupEventListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true
        this.syncQueue()
      })

      window.addEventListener('offline', () => {
        this.isOnline = false
      })

      // Sync on page visibility change (when app comes back to foreground)
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.isOnline) {
          this.syncQueue()
        }
      })
    }
  }

  private checkOnlineStatus() {
    if (typeof navigator !== 'undefined') {
      this.isOnline = navigator.onLine
    }
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem('offline_queue')
      if (stored) {
        this.queue = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error)
      this.queue = []
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem('offline_queue', JSON.stringify(this.queue))
    } catch (error) {
      console.error('Failed to save offline queue:', error)
    }
  }

  addToQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>) {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      retryCount: 0
    }

    this.queue.push(queueItem)
    this.saveQueue()

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncQueue()
    }

    return queueItem.id
  }

  async syncQueue(): Promise<{ synced: number; failed: number }> {
    if (this.syncInProgress || !this.isOnline || this.queue.length === 0) {
      return { synced: 0, failed: 0 }
    }

    this.syncInProgress = true
    let synced = 0
    let failed = 0

    const itemsToSync = [...this.queue]

    for (const item of itemsToSync) {
      try {
        const success = await this.syncItem(item)
        
        if (success) {
          // Remove from queue
          this.queue = this.queue.filter(q => q.id !== item.id)
          synced++
        } else {
          // Increment retry count
          const queueItem = this.queue.find(q => q.id === item.id)
          if (queueItem) {
            queueItem.retryCount++
            if (queueItem.retryCount >= queueItem.maxRetries) {
              // Remove after max retries
              this.queue = this.queue.filter(q => q.id !== item.id)
              console.error('Max retries exceeded for queue item:', item)
            }
          }
          failed++
        }
      } catch (error) {
        console.error('Error syncing queue item:', item, error)
        failed++
      }
    }

    this.saveQueue()
    this.syncInProgress = false

    return { synced, failed }
  }

  private async syncItem(item: OfflineQueueItem): Promise<boolean> {
    const { supabase } = await import('./supabase')

    switch (item.type) {
      case 'attendance':
        try {
          const { error } = await supabase
            .from('attendance')
            .insert([item.data])

          return !error
        } catch (error) {
          console.error('Failed to sync attendance:', error)
          return false
        }

      case 'student_update':
        try {
          const { error } = await supabase
            .from('students')
            .update(item.data.updates)
            .eq('id', item.data.studentId)

          return !error
        } catch (error) {
          console.error('Failed to sync student update:', error)
          return false
        }

      case 'notification':
        try {
          const { error } = await supabase
            .from('notifications')
            .insert([item.data])

          return !error
        } catch (error) {
          console.error('Failed to sync notification:', error)
          return false
        }

      default:
        console.error('Unknown queue item type:', item.type)
        return false
    }
  }

  getQueueStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.queue.length,
      syncInProgress: this.syncInProgress
    }
  }

  clearQueue() {
    this.queue = []
    this.saveQueue()
  }

  // Add attendance to offline queue
  queueAttendance(studentId: string, classId: string, notes?: string) {
    return this.addToQueue({
      type: 'attendance',
      data: {
        student_id: studentId,
        class_id: classId,
        check_in_time: new Date().toISOString(),
        notes
      },
      maxRetries: 3
    })
  }

  // Add student update to offline queue
  queueStudentUpdate(studentId: string, updates: any) {
    return this.addToQueue({
      type: 'student_update',
      data: {
        studentId,
        updates
      },
      maxRetries: 3
    })
  }

  // Schedule background sync (for service worker)
  scheduleBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        return (registration as any).sync.register('background-sync')
      }).catch(error => {
        console.error('Background sync registration failed:', error)
      })
    }
  }
}