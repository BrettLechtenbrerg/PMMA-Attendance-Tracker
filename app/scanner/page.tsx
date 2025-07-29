'use client'

import { useState, useEffect, useRef } from 'react'
import AuthGuard from '@/components/AuthGuard'
import DashboardLayout from '@/components/DashboardLayout'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { QRScanner } from '@/lib/qr-scanner'
import { attendanceService } from '@/lib/attendance'
import { Class } from '@/lib/types'

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QRScanner | null>(null)
  
  const [isScanning, setIsScanning] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [lastScanResult, setLastScanResult] = useState('')
  const [scanStatus, setScanStatus] = useState<{
    type: 'success' | 'error' | 'info' | null
    message: string
  }>({ type: null, message: '' })
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTodayClasses()
    loadCameras()
    
    // Initialize scanner
    scannerRef.current = new QRScanner()

    // Cleanup on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.destroy()
      }
    }
  }, [])

  useEffect(() => {
    // Auto-select current class
    if (classes.length > 0 && !selectedClassId) {
      const now = new Date()
      const currentClass = classes.find(cls => {
        const startTime = new Date(cls.start_time)
        const endTime = new Date(cls.end_time)
        return now >= startTime && now <= endTime
      })
      
      if (currentClass) {
        setSelectedClassId(currentClass.id)
      } else {
        // Select next upcoming class
        const upcomingClass = classes.find(cls => new Date(cls.start_time) > now)
        if (upcomingClass) {
          setSelectedClassId(upcomingClass.id)
        }
      }
    }
  }, [classes, selectedClassId])

  const loadTodayClasses = async () => {
    try {
      const { data, error } = await attendanceService.getTodayClasses()
      if (error) {
        setScanStatus({ type: 'error', message: 'Failed to load classes' })
        return
      }
      setClasses(data || [])
    } catch (error) {
      setScanStatus({ type: 'error', message: 'Failed to load classes' })
    }
  }

  const loadCameras = async () => {
    if (scannerRef.current) {
      const devices = await scannerRef.current.getCameraDevices()
      setCameras(devices)
      if (devices.length > 0) {
        // Prefer back camera on mobile
        const backCamera = devices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('environment')
        )
        setSelectedCamera(backCamera?.deviceId || devices[0].deviceId)
      }
    }
  }

  const startScanning = async () => {
    if (!selectedClassId) {
      setScanStatus({ type: 'error', message: 'Please select a class first' })
      return
    }

    if (!videoRef.current || !scannerRef.current) return

    setIsScanning(true)
    setScanStatus({ type: 'info', message: 'Starting camera...' })

    try {
      await scannerRef.current.startScanning(
        videoRef.current,
        handleScanResult,
        handleScanError
      )
      setScanStatus({ type: 'info', message: 'Scanning for QR codes...' })
    } catch (error) {
      setIsScanning(false)
      setScanStatus({ type: 'error', message: 'Failed to start camera' })
    }
  }

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stopScanning()
    }
    setIsScanning(false)
    setScanStatus({ type: null, message: '' })
  }

  const handleScanResult = async (qrString: string) => {
    // Prevent duplicate scans
    if (qrString === lastScanResult) return
    setLastScanResult(qrString)

    if (!selectedClassId) {
      setScanStatus({ type: 'error', message: 'No class selected' })
      return
    }

    setLoading(true)
    setScanStatus({ type: 'info', message: 'Processing check-in...' })

    try {
      const result = await attendanceService.processQRScan(qrString, selectedClassId)
      
      if (result.success) {
        setScanStatus({ 
          type: 'success', 
          message: `✅ ${result.studentName} checked in successfully!` 
        })
        
        // Clear the last scan after 3 seconds to allow rescanning
        setTimeout(() => {
          setLastScanResult('')
        }, 3000)
      } else {
        setScanStatus({ 
          type: 'error', 
          message: result.error || 'Check-in failed' 
        })
        // Clear error faster to allow retry
        setTimeout(() => {
          setLastScanResult('')
        }, 2000)
      }
    } catch (error) {
      setScanStatus({ type: 'error', message: 'Check-in failed' })
      setTimeout(() => {
        setLastScanResult('')
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  const handleScanError = (error: string) => {
    setScanStatus({ type: 'error', message: error })
  }

  const switchCamera = async () => {
    if (!selectedCamera || !videoRef.current || !scannerRef.current) return

    try {
      await scannerRef.current.switchCamera(
        selectedCamera,
        videoRef.current,
        handleScanResult,
        handleScanError
      )
    } catch (error) {
      setScanStatus({ type: 'error', message: 'Failed to switch camera' })
    }
  }

  const classOptions = classes.map(cls => ({
    value: cls.id,
    label: `${cls.class_type} - ${new Date(cls.start_time).toLocaleTimeString()} ${cls.location}`
  }))

  const cameraOptions = cameras.map(camera => ({
    value: camera.deviceId,
    label: camera.label || 'Camera'
  }))

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary">QR Code Scanner</h1>
            <p className="mt-2 text-gray-600">Scan student or family QR codes for attendance</p>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Select
                label="Select Class"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                options={[
                  { value: '', label: 'Choose a class...' },
                  ...classOptions
                ]}
                required
              />
              
              {cameras.length > 1 && (
                <Select
                  label="Camera"
                  value={selectedCamera}
                  onChange={(e) => {
                    setSelectedCamera(e.target.value)
                    if (isScanning) {
                      switchCamera()
                    }
                  }}
                  options={cameraOptions}
                />
              )}
            </div>

            <div className="flex justify-center space-x-4">
              {!isScanning ? (
                <Button onClick={startScanning} disabled={!selectedClassId}>
                  Start Scanning
                </Button>
              ) : (
                <Button onClick={stopScanning} variant="danger">
                  Stop Scanning
                </Button>
              )}
            </div>
          </div>

          {/* Camera View */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="relative bg-black aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              
              {/* Scanning overlay */}
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-secondary w-64 h-64 relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-secondary"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-secondary"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-secondary"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-secondary"></div>
                  </div>
                </div>
              )}

              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 4h4m4 0h2" />
                    </svg>
                    <p>Click &quot;Start Scanning&quot; to begin</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Display */}
          {scanStatus.type && (
            <div className={`p-4 rounded-lg ${
              scanStatus.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
              scanStatus.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
              'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{scanStatus.message}</span>
                {loading && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <span className="text-secondary mr-2">1.</span>
                Select the class for attendance check-in
              </li>
              <li className="flex items-start">
                <span className="text-secondary mr-2">2.</span>
                Click &quot;Start Scanning&quot; to activate the camera
              </li>
              <li className="flex items-start">
                <span className="text-secondary mr-2">3.</span>
                Hold QR codes in front of the camera - individual student or family codes work
              </li>
              <li className="flex items-start">
                <span className="text-secondary mr-2">4.</span>
                Wait for confirmation before scanning the next code
              </li>
            </ul>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}