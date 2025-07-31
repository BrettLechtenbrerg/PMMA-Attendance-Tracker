import { v4 as uuidv4 } from 'uuid'

export function generateStudentQR(): string {
  return `student_${uuidv4()}`
}

export function generateFamilyQR(): string {
  return `family_${uuidv4()}`
}

export function parseQRCode(qrCode: string): { type: 'student' | 'family', id: string } | null {
  if (qrCode.startsWith('student_')) {
    return { type: 'student', id: qrCode.replace('student_', '') }
  }
  
  if (qrCode.startsWith('family_')) {
    return { type: 'family', id: qrCode.replace('family_', '') }
  }
  
  return null
}