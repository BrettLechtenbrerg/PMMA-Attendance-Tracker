import { describe, it, expect } from 'vitest'
import { qrCodeService } from '@/lib/qr-codes'

describe('QR Code Service', () => {
  describe('generateStudentQR', () => {
    it('generates QR code for student', async () => {
      const studentId = 'student-123'
      const studentName = 'John Doe'
      
      const qrCode = await qrCodeService.generateStudentQR(studentId, studentName)
      
      expect(qrCode).toMatch(/^data:image\/png;base64,/)
    })

    it('generates QR code without student name', async () => {
      const studentId = 'student-123'
      
      const qrCode = await qrCodeService.generateStudentQR(studentId)
      
      expect(qrCode).toMatch(/^data:image\/png;base64,/)
    })
  })

  describe('generateFamilyQR', () => {
    it('generates QR code for family', async () => {
      const familyCode = 'family-456'
      const familyName = 'The Smiths'
      
      const qrCode = await qrCodeService.generateFamilyQR(familyCode, familyName)
      
      expect(qrCode).toMatch(/^data:image\/png;base64,/)
    })
  })

  describe('parseQRCode', () => {
    it('parses valid student QR code', () => {
      const validStudentQR = JSON.stringify({
        type: 'student',
        id: 'student-123',
        name: 'John Doe'
      })
      
      const result = qrCodeService.parseQRCode(validStudentQR)
      
      expect(result).toEqual({
        type: 'student',
        id: 'student-123',
        name: 'John Doe'
      })
    })

    it('parses valid family QR code', () => {
      const validFamilyQR = JSON.stringify({
        type: 'family',
        id: 'family-456',
        name: 'The Smiths'
      })
      
      const result = qrCodeService.parseQRCode(validFamilyQR)
      
      expect(result).toEqual({
        type: 'family',
        id: 'family-456',
        name: 'The Smiths'
      })
    })

    it('returns null for invalid QR code', () => {
      const invalidQR = 'invalid-json'
      
      const result = qrCodeService.parseQRCode(invalidQR)
      
      expect(result).toBeNull()
    })

    it('returns null for QR code with wrong structure', () => {
      const wrongStructure = JSON.stringify({
        invalid: 'structure'
      })
      
      const result = qrCodeService.parseQRCode(wrongStructure)
      
      expect(result).toBeNull()
    })

    it('returns null for QR code with invalid type', () => {
      const invalidType = JSON.stringify({
        type: 'invalid',
        id: 'test-123'
      })
      
      const result = qrCodeService.parseQRCode(invalidType)
      
      expect(result).toBeNull()
    })
  })

  describe('generateQRCodeSVG', () => {
    it('generates SVG string for QR code', async () => {
      const data = {
        type: 'student' as const,
        id: 'student-123',
        name: 'John Doe'
      }
      
      const svg = await qrCodeService.generateQRCodeSVG(data)
      
      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
    })
  })

  describe('generateStudentQRBatch', () => {
    it('generates QR codes for multiple students', async () => {
      const students = [
        { id: 'student-1', name: 'John Doe' },
        { id: 'student-2', name: 'Jane Smith' }
      ]
      
      const results = await qrCodeService.generateStudentQRBatch(students)
      
      expect(results).toHaveLength(2)
      expect(results[0].student).toEqual(students[0])
      expect(results[0].qrCode).toMatch(/^data:image\/png;base64,/)
      expect(results[1].student).toEqual(students[1])
      expect(results[1].qrCode).toMatch(/^data:image\/png;base64,/)
    })

    it('handles empty array', async () => {
      const results = await qrCodeService.generateStudentQRBatch([])
      
      expect(results).toHaveLength(0)
    })
  })
})