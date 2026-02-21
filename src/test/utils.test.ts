import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('c1', 'c2')).toBe('c1 c2')
    })

    it('should handle conditional classes', () => {
      expect(cn('c1', { c2: true, c3: false })).toBe('c1 c2')
    })

    it('should merge tailwind classes properly', () => {
      expect(cn('p-4 p-2')).toBe('p-2')
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
    })

    it('should handle arrays and mixed inputs', () => {
      expect(cn(['c1', 'c2'], 'c3', { c4: true })).toBe('c1 c2 c3 c4')
    })

    it('should filter out falsy values', () => {
      expect(cn('c1', null, undefined, false, 'c2')).toBe('c1 c2')
    })
  })
})
