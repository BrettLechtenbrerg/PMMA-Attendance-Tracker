import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock environment variables
beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
})

// Mock Next.js router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
}

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
    functions: {
      invoke: vi.fn(),
    },
  },
  supabaseAdmin: {
    auth: {
      admin: {
        deleteUser: vi.fn(),
      },
    },
  },
}))

// Mock QR scanner
vi.mock('@/lib/qr-scanner', () => ({
  QRScanner: vi.fn().mockImplementation(() => ({
    startScanning: vi.fn(),
    stopScanning: vi.fn(),
    getIsScanning: vi.fn(() => false),
    getCameraDevices: vi.fn(() => Promise.resolve([])),
    switchCamera: vi.fn(),
    destroy: vi.fn(),
  })),
}))

// Mock offline manager
vi.mock('@/lib/offline-manager', () => ({
  OfflineManager: {
    getInstance: vi.fn(() => ({
      addToQueue: vi.fn(),
      syncQueue: vi.fn(() => Promise.resolve({ synced: 0, failed: 0 })),
      getQueueStatus: vi.fn(() => ({
        isOnline: true,
        queueLength: 0,
        syncInProgress: false,
      })),
      clearQueue: vi.fn(),
    })),
  },
}))

// Mock window.navigator
Object.defineProperty(window, 'navigator', {
  value: {
    mediaDevices: {
      getUserMedia: vi.fn(),
      enumerateDevices: vi.fn(() => Promise.resolve([])),
    },
    onLine: true,
  },
  writable: true,
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})