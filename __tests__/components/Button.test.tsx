import { describe, it, expect } from 'vitest'

describe('Basic Component Tests', () => {
  it('passes basic test', () => {
    expect(true).toBe(true)
  })

  it('can perform basic math', () => {
    expect(2 + 2).toBe(4)
  })
})