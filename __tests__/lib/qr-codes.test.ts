import { describe, it, expect } from 'vitest'
import { generateStudentQR, generateFamilyQR, parseQRCode } from '@/utils/qr-generator'

describe('QR Code Utils', () => {
  describe('generateStudentQR', () => {
    it('generates a student QR code string', () => {
      const qrCode = generateStudentQR()
      
      expect(qrCode).toMatch(/^student_[0-9a-f-]{36}$/)
    })

    it('generates unique QR codes', () => {
      const qr1 = generateStudentQR()
      const qr2 = generateStudentQR()
      
      expect(qr1).not.toBe(qr2)
    })
  })

  describe('generateFamilyQR', () => {
    it('generates a family QR code string', () => {
      const qrCode = generateFamilyQR()
      
      expect(qrCode).toMatch(/^family_[0-9a-f-]{36}$/)
    })

    it('generates unique QR codes', () => {
      const qr1 = generateFamilyQR()
      const qr2 = generateFamilyQR()
      
      expect(qr1).not.toBe(qr2)
    })
  })

  describe('parseQRCode', () => {
    it('parses valid student QR code', () => {
      const studentQR = 'student_123e4567-e89b-12d3-a456-426614174000'
      
      const result = parseQRCode(studentQR)
      
      expect(result).toEqual({
        type: 'student',
        id: '123e4567-e89b-12d3-a456-426614174000'
      })
    })

    it('parses valid family QR code', () => {
      const familyQR = 'family_123e4567-e89b-12d3-a456-426614174000'
      
      const result = parseQRCode(familyQR)
      
      expect(result).toEqual({
        type: 'family',
        id: '123e4567-e89b-12d3-a456-426614174000'
      })
    })

    it('returns null for invalid QR code', () => {
      const invalidQR = 'invalid-qr-code'
      
      const result = parseQRCode(invalidQR)
      
      expect(result).toBeNull()
    })

    it('returns null for empty string', () => {
      const result = parseQRCode('')
      
      expect(result).toBeNull()
    })
  })
})