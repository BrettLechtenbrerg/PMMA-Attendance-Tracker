import { BrowserMultiFormatReader, Result } from '@zxing/library'

export class QRScanner {
  private reader: BrowserMultiFormatReader
  private currentStream: MediaStream | null = null
  private isScanning = false

  constructor() {
    this.reader = new BrowserMultiFormatReader()
  }

  /**
   * Start scanning with camera
   */
  async startScanning(
    videoElement: HTMLVideoElement,
    onResult: (result: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    if (this.isScanning) {
      return
    }

    try {
      this.isScanning = true
      
      // Get camera constraints
      const constraints = {
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }

      // Get user media
      this.currentStream = await navigator.mediaDevices.getUserMedia(constraints)
      videoElement.srcObject = this.currentStream

      // Start decoding from video stream
      await this.reader.decodeFromVideoDevice(
        null, // Use default device
        videoElement,
        (result: Result | null, error?: Error) => {
          if (result) {
            onResult(result.getText())
          }
          if (error && error.name !== 'NotFoundException') {
            console.error('QR Scanner error:', error)
            onError(error.message)
          }
        }
      )
    } catch (error) {
      this.isScanning = false
      console.error('Failed to start QR scanner:', error)
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          onError('Camera permission denied. Please allow camera access to scan QR codes.')
        } else if (error.name === 'NotFoundError') {
          onError('No camera found. Please ensure your device has a camera.')
        } else {
          onError('Failed to access camera: ' + error.message)
        }
      } else {
        onError('Unknown error accessing camera')
      }
    }
  }

  /**
   * Stop scanning and release camera
   */
  stopScanning(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop())
      this.currentStream = null
    }
    
    this.reader.reset()
    this.isScanning = false
  }

  /**
   * Check if scanning is currently active
   */
  getIsScanning(): boolean {
    return this.isScanning
  }

  /**
   * Get available camera devices
   */
  async getCameraDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices.filter(device => device.kind === 'videoinput')
    } catch (error) {
      console.error('Failed to get camera devices:', error)
      return []
    }
  }

  /**
   * Switch to a specific camera device
   */
  async switchCamera(
    deviceId: string,
    videoElement: HTMLVideoElement,
    onResult: (result: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    this.stopScanning()
    
    try {
      this.isScanning = true
      
      const constraints = {
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }

      this.currentStream = await navigator.mediaDevices.getUserMedia(constraints)
      videoElement.srcObject = this.currentStream

      await this.reader.decodeFromVideoDevice(
        deviceId,
        videoElement,
        (result: Result | null, error?: Error) => {
          if (result) {
            onResult(result.getText())
          }
          if (error && error.name !== 'NotFoundException') {
            console.error('QR Scanner error:', error)
            onError(error.message)
          }
        }
      )
    } catch (error) {
      this.isScanning = false
      console.error('Failed to switch camera:', error)
      onError('Failed to switch camera')
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopScanning()
  }
}