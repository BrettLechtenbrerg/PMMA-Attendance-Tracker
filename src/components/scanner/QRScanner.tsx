'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'
import { Camera, CameraOff } from 'lucide-react'

interface QRScannerProps {
  onScan: (data: string) => void
  onError?: (error: string) => void
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [codeReader, setCodeReader] = useState<BrowserMultiFormatReader | null>(null)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    setCodeReader(reader)

    return () => {
      reader.reset()
    }
  }, [])

  const startScanning = async () => {
    if (!codeReader || !videoRef.current) return

    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      videoRef.current.srcObject = stream
      setHasPermission(true)
      setIsScanning(true)

      await codeReader.decodeFromVideoDevice(
        null,
        videoRef.current,
        (result, error) => {
          if (result) {
            onScan(result.getText())
          }
          if (error && error.name !== 'NotFoundException') {
            console.error('Scanner error:', error)
            onError?.(error.message)
          }
        }
      )
    } catch (error: any) {
      console.error('Camera access error:', error)
      setHasPermission(false)
      onError?.(error.message || 'Failed to access camera')
    }
  }

  const stopScanning = () => {
    if (codeReader) {
      codeReader.reset()
    }
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    
    setIsScanning(false)
  }

  const toggleScanning = () => {
    if (isScanning) {
      stopScanning()
    } else {
      startScanning()
    }
  }

  if (hasPermission === false) {
    return (
      <div className="text-center p-8">
        <CameraOff className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Camera Access Denied</h3>
        <p className="text-gray-600 mb-4">
          Please allow camera access to scan QR codes.
        </p>
        <button
          onClick={startScanning}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-gray-800"
        >
          Request Camera Access
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {!isScanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
            <div className="text-center">
              <Camera className="h-16 w-16 text-white mx-auto mb-4" />
              <p className="text-white text-lg">Camera is ready</p>
            </div>
          </div>
        )}

        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-secondary w-64 h-64 rounded-lg"></div>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-center">
        <button
          onClick={toggleScanning}
          className={`px-6 py-3 rounded-md font-medium flex items-center space-x-2 ${
            isScanning
              ? 'bg-accent text-white hover:bg-red-700'
              : 'bg-primary text-white hover:bg-gray-800'
          }`}
        >
          {isScanning ? (
            <>
              <CameraOff className="h-5 w-5" />
              <span>Stop Scanning</span>
            </>
          ) : (
            <>
              <Camera className="h-5 w-5" />
              <span>Start Scanning</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}