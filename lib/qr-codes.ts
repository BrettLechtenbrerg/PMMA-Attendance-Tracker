import QRCode from 'qrcode'

export interface QRCodeData {
  type: 'student' | 'family'
  id: string
  name?: string
}

export const qrCodeService = {
  /**
   * Generate QR code as Data URL for a student
   */
  async generateStudentQR(studentId: string, studentName?: string): Promise<string> {
    const qrData: QRCodeData = {
      type: 'student',
      id: studentId,
      name: studentName
    }
    
    const qrString = JSON.stringify(qrData)
    
    try {
      const qrCodeUrl = await QRCode.toDataURL(qrString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',  // PMMA primary color
          light: '#FFFFFF'
        }
      })
      return qrCodeUrl
    } catch (error) {
      console.error('Error generating QR code:', error)
      throw new Error('Failed to generate QR code')
    }
  },

  /**
   * Generate QR code as Data URL for a family
   */
  async generateFamilyQR(familyQRCode: string, familyName?: string): Promise<string> {
    const qrData: QRCodeData = {
      type: 'family',
      id: familyQRCode,
      name: familyName
    }
    
    const qrString = JSON.stringify(qrData)
    
    try {
      const qrCodeUrl = await QRCode.toDataURL(qrString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',  // PMMA primary color
          light: '#FFFFFF'
        }
      })
      return qrCodeUrl
    } catch (error) {
      console.error('Error generating QR code:', error)
      throw new Error('Failed to generate QR code')
    }
  },

  /**
   * Generate QR code as SVG string
   */
  async generateQRCodeSVG(data: QRCodeData): Promise<string> {
    const qrString = JSON.stringify(data)
    
    try {
      const svgString = await QRCode.toString(qrString, {
        type: 'svg',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      return svgString
    } catch (error) {
      console.error('Error generating SVG QR code:', error)
      throw new Error('Failed to generate SVG QR code')
    }
  },

  /**
   * Parse QR code data from scanned string
   */
  parseQRCode(qrString: string): QRCodeData | null {
    try {
      const data = JSON.parse(qrString)
      
      // Validate the structure
      if (typeof data.type === 'string' && 
          typeof data.id === 'string' && 
          ['student', 'family'].includes(data.type)) {
        return data as QRCodeData
      }
      
      return null
    } catch (error) {
      console.error('Error parsing QR code:', error)
      return null
    }
  },

  /**
   * Generate printable QR codes for students (batch)
   */
  async generateStudentQRBatch(students: Array<{id: string, name: string}>): Promise<Array<{student: any, qrCode: string}>> {
    const results = []
    
    for (const student of students) {
      try {
        const qrCode = await this.generateStudentQR(student.id, student.name)
        results.push({
          student,
          qrCode
        })
      } catch (error) {
        console.error(`Failed to generate QR for student ${student.name}:`, error)
      }
    }
    
    return results
  }
}